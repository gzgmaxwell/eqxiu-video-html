import React from "react";
import lodash from "lodash";
import { connect } from "dva";
import { routerRedux } from "dva/router";
import styles from "./userEditor.less";
import Button from "Components/Button";
import LeftSide from "./leftSide";
import RightSide from "./right";
import { setTitle, getScrollTop } from "Util/doc";
import EventEmitter from "events";
import DeleteModal from "Components/delete";
import { prev } from "Config/env";
import Loading from "../components/loading";
import { filter } from "../../util/data";
import { message, Tooltip } from "antd";
import { getInfo } from "../../api/user";
import VideoOption from "./videoOption";
import WorkSpace from "./centre/workspace";
import { CSSTransition } from "react-transition-group";
import Modal, { showModal } from "../components/modal";
import HeaderMiddle from "./centre/headerMiddle";
import { DEFAULT_COVER_PIC, EDITOR_PRODUCT, USER_TYPE, OPEN_FROM } from "../../config/staticParams";
import videoLogo from "../static/icon/videoLogo.svg";
import { getItem } from "../../util/storageLocal";
import { getLimt } from "../../api/userVideo";
import DownLoadGoogle from "../components/google";
import EditorBottom from "./bottom";
import eventEmitter from "../../services/EventListener";
import { waitChooseVideoType } from "./chooseVideoType";
import { delay } from "../../util/delayLoad";
import { sendBDEvent, sendBDPage } from "../../services/bigDataService";
import qs from "qs";
import t2vloading from "../static/t2vloading.gif";
import { platformActions, sendPlatformPage } from "../../util/platform";
import { formatEQXMessage, isPressedCtrl } from "../../util/event";
import ShareDownload from "../userCentre/shareDownload";
import { POS_FROM, TYPE_PAGE } from "../../config/staticParams/goodsParams";
import Icon from "../components/Icon";
import { showTimeLineNoob } from "./bottom/timeLine/timeLineNoob";
import { getURLObj } from "../../util/util";
import RulesBox from "./centre/rule";

const commonFilterRules = [
    {
        attr: "title",
        rules: [
            {
                name: "required",
                msg: "必须填写标题"
            },
            {
                name: "max",
                value: 24,
                msg: "长度不可超过24"
            }
        ]
    },
    {
        attr: "videoDescribe",
        rules: [
            {
                name: "required",
                msg: "必须有填写视频介绍"
            },
            {
                name: "max",
                value: 50,
                msg: "长度不可超过50"
            }
        ]
    }
];

function hasChangeVideoOption(obj) {
    if (obj.coverImg === DEFAULT_COVER_PIC.hoz || obj.coverImg === DEFAULT_COVER_PIC.ver) {
        return false;
    }
    return true;
}

@connect(({ editor, looper }) => ({
    saveCue: editor.saveCue,
    autoSaving: editor.autoSaving || looper.cutVideoUUID
}))
class SaveButton extends React.PureComponent {
    render() {
        const { saveCue, autoSaving, onClick } = this.props;
        const openFrom = getURLObj(window.location.href).openFrom;
        return (
            (autoSaving && (
                <Button
                    style={{
                        width: 42,
                        color: "#666666",
                        background: "#666",
                        border: "none"
                    }}>
                    <img width='24' src={t2vloading} alt='保存中...' />
                </Button>
            )) || (
                <Button
                    style={{
                        width: 42,
                        color: "#666666",
                        border: "1px solid rgba(204,213,219,1)"
                    }}
                    onClick={onClick}
                    lite={1}>
                    {!openFrom ? '保存' : '预览'}
                    {saveCue && <div className={styles.saveCue}></div>}
                </Button>
            )
        );
    }
}

@connect(state => {
    const { editor, looper = {} } = state;
    return {
        editor: {
            videoId: editor.videoId,
            isLoading: editor.isLoading,
            id: editor.id,
            cancelAutoSave: editor.cancelAutoSave,
            title: editor.title,
            videoDescribe: editor.videoDescribe,
            transverse: editor.transverse
        },
        haveCut: looper.cutVideoUUID
    };
})
class userEditor extends React.Component {
    constructor(props) {
        super(props);
        this.right = React.createRef();
        this.event = new EventEmitter();
        this.video = React.createRef();
        // 长页融合集合页tabId originId数据
        this.eqxCollectInfo = {};
        document.querySelector("#draw_canvas_div").classList.remove("hidden");
        this.detailBody = React.createRef();
        this.state = {
            openCloseModal: false,
            saving: false,
            closeWindow: false,
            openOptions: false,
            loading: false,
            openModal: false,
            openOptionsed: false,
            shareDownload: false
        };
    }

    componentDidMount() {
        // body禁止滚动
        document.body.style.overflow = "hidden";
        const {
            params: { oriTemplateId, id },
            url
        } = this.props.match;
        const isWorkTpl = (qs.parse(window.location.search.replace("?", "")) || {}).workTpl;
        sendBDPage(`/video/editor/${oriTemplateId}`);
        showTimeLineNoob();
        if (~~oriTemplateId === 0 && !isWorkTpl && !id) {
            const hTEditor = url.includes("HTEditor");
            waitChooseVideoType()
                .then(newTemplateId => {
                    window.location.href = `${prev}/${
                        hTEditor ? "HTEditor" : "editor"
                    }/${newTemplateId}`;
                })
                .catch(() => {
                    // if (window.history.length > 1) {
                    //     window.history.back(1);
                    // } else {
                    this.props.dispatch(routerRedux.push(`${prev}/index`));
                    // }
                });
            return false;
        }
        this.onLoad();
        // 登录验证
        getInfo().then(({ data: { obj: { id: userId = "" } = {} } = {} }) => {});
        getLimt().then(res => {
            if (res.data.success) {
                const { remainSaveCount, remainRenderCount } = res.data.obj;
                let promise = null;
                if (remainSaveCount <= 0 && !id) {
                    // 如果是新建而且保存数量已满 就不能再编辑了.
                    promise = message.error("您的作品数量已经达到上限");
                } else if (remainRenderCount <= 0) {
                    promise = message.error("您今日的渲染次数已达到上限");
                } else {
                    return;
                }
                promise.then(() => {
                    window.history.back(1);
                });
            }
        });
        sendBDEvent({
            position: "主编辑器",
            type: "进入主编辑器"
        });
        eventEmitter.on("onGenerateVideo", this.onGenerateVideo);
        eventEmitter.on("onSaveVideo", this.onSave);
        window.addEventListener("message", this.parentMessage);
        document.addEventListener("keydown", this.handleSave);
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (!lodash.isEqual(this.state, nextState)) {
            return true;
        }
        if (this.props.editor.isLoading !== nextProps.editor.isLoading) {
            return true;
        }
        if (this.props.haveCut !== nextProps.haveCut) {
            return true;
        }
        return false;
    }

    componentDidCatch(e) {
        message.error(e.message);
        message.error("编辑器出现错误，请及时保存");
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        const newState = {};
        const { editor } = nextProps;
        if (editor.id !== prevState.id) {
            newState.loading = false;
        }
        newState.saving = editor.isLoading && !prevState.saving;
        return newState;
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.location.pathname !== this.props.location.pathname) {
            this.onLoad();
        }
        if (prevProps.editor.id !== this.props.editor.id) {
            this.overSaving();
        }
    }

    componentWillUnmount() {
        // 取消body禁止滚动
        document.body.style.overflow = "auto";
        document.querySelector("#draw_canvas_div").classList.add("hidden");
        // 取消自动保存
        this.props.dispatch({
            type: "editor/saveCommon",
            payload: {
                cancelAutoSave: true
            }
        });
        window.removeEventListener("message", this.parentMessage);
        document.removeEventListener("keydown", this.handleSave);
        eventEmitter.removeListener("onGenerateVideo", this.onGenerateVideo);
        eventEmitter.removeListener("onSaveVideo", this.onSave);
    }

    parentMessage = e => {
        const data = formatEQXMessage(e);
        if (data === false) {
            return;
        }
        if (data.eventType === "savePageData") {
            this.onSave(e, false);
        }
        // 长页融合集合页消息
        if (data.eventType === "editorOpened") {
            // 存储originId，即是作为父级窗口的唯一标识
            this.eqxCollectInfo = {
                originId: data.originId,
                tabId: data.tabId
            };
            // 存储全局
            window.eqxCollectInfo = this.eqxCollectInfo;
        }
        // 长页融合集合页消息
        if (data.eventType === "saveAndOpenNew") {
            // 同时编辑AB视频时，A视频自动保存，关闭A视频编辑器打开B视频编辑器
            console.log("视频自动保存开始");
            this.onSave(e, true);
            // 向集合页面通知消息
            sendPlatformPage(platformActions.saveAndOpenNew, {
                id: this.props.editor.videoId,
                ...this.eqxCollectInfo
            });
        }
    };
    /**
     * 关闭窗口时的确认，大多数浏览器无效
     * @param e
     */
    onClose = e => {
        e.stopPropagation();
        e.preventDefault();
        this.setState({ closeWindow: true });
        this.onClickQuite();
    };
    /**
     *根据url地址读取编辑器信息
     */
    onLoad = () => {
        const {
            params: { oriTemplateId, id },
            url
        } = this.props.match;
        const hTEditor = url.includes("HTEditor");
        setTitle(hTEditor ? "片头片尾" : "模板编辑");
        this.props.dispatch({
            type: "editor/create",
            payload: {
                templateId: oriTemplateId,
                videoId: id,
                product: hTEditor ? EDITOR_PRODUCT.headTail : EDITOR_PRODUCT.main
            }
        });
    };

    handleSave = e => {
        if (e.keyCode === 83 && isPressedCtrl(e)) {
            e.preventDefault();
            const showMessage = false;
            this.onSave(e, showMessage);
        }
    };
    /**
     * 保存事件
     * @param e 事件；
     * @param showMessage 显示信息
     */
    onSave = (e, showMessage = true) => {
        const openFrom = getURLObj(window.location.href).openFrom
        if (openFrom) {
            this.onGenerateVideo();
            return;
        }
        if (this.state.saving) {
            return false;
        }
        if (!showMessage) {
            message.config({
                maxCount: 0
            });
        }
        const {
            params: { oriTemplateId, id },
            url
        } = this.props.match;
        const submit = () => {
            return this.props.dispatch({
                type: "editor/saveOrRender",
                payload: {
                    onlySave: true,
                    oriTemplateId,
                    id,
                },
            })
        };
        if (filter(commonFilterRules, this.props.editor) !== true) {
            if (showMessage) message.error("资料填写有误");
            this.openOption(e, () => this.event.emit("saveError"));
            return false;
        }
        return submit().then(res => {
            const hTEditor = this.props.isHtEditor || url.includes("HTEditor");
            if (res && !id && !hTEditor) {
                this.props.dispatch(routerRedux.replace(`${this.props.location.pathname}/${res}`));
            }
            return res;
        });
    };
    /**
     * 生成视频事件
     */
    onGenerateVideo = async e => {
        eventEmitter.emit("saveWorkData");
        await delay(300);
        if (this.state.saving) {
            return false;
        }
        const submit = async () => {
            const { url } = this.props.match;
            const hTEditor = this.props.isHtEditor || url.includes("HTEditor");
            sendBDEvent({
                position: "主编辑器",
                type: hTEditor ? "生成片头片尾" : "生成视频"
            });
            return this.props
                .dispatch({
                    type: "editor/saveOrRender",
                    payload: {
                        onlySave: false,
                        dontJump: true
                    }
                })
                .then(res => {
                    if (res) {
                        this.handlePre();
                    }
                });
        };
        const {
            props: { editor },
            state: { openOptionsed }
        } = this;
        if (!openOptionsed && hasChangeVideoOption(editor) === false) {
            showModal({
                title: "您尚未进行视频标题、封面的修改",
                info: "可前往“视频设置”进行修改。若不修改，将使用默认。",
                buttons: [
                    {
                        children: "仍要生成",
                        className: styles.still_save,
                        onClick: () => {
                            submit();
                            return false;
                        }
                    },
                    {
                        children: "前往设置",
                        onClick: e => {
                            this.openOption(e);
                            return false;
                        }
                    }
                ]
            });
            return false;
        }
        if (filter(commonFilterRules, this.props.editor) !== true) {
            message.error("资料填写有误");
            this.openOption(e, () => this.event.emit("saveError"));
            return false;
        }
        return submit();
    };
    handlePre = () => {
        this.setState({ shareDownload: true });
    };
    /**
     * 调速
     * @param e
     */
    onPlay = e => {
        // 视频调速
        this.video.current.playbackRate = this.props.editor.playSpeed;
    };
    /**
     * 点击退出事件
     */
    onClickQuite = () => {
        this.setState({ openCloseModal: true });
    };
    /**
     * 关闭模态框
     */
    onCloseModal = () => {
        this.setState({
            openCloseModal: false,
            closeWindow: false,
            openPreviewModal: false
        });
    };
    /**
     * 确认退出事件
     */
    onQuite = e => {
        const {
            props: {
                dispatch,
                editor: { cancelAutoSave, isLoading },
                haveCut
            }
        } = this;
        if (isLoading) return;
        const redirectScene = () => {
            // 通知长页关闭tab
            if (getURLObj(window.location.href).openFrom) {
                sendPlatformPage(platformActions.quite, {
                    id: this.props.editor.videoId,
                    ...this.eqxCollectInfo
                });
            }
            dispatch(routerRedux.push(`${prev}/scene`));
        };
        if (this.state.closeWindow) {
            window.close();
        }
        if (!cancelAutoSave) {
            // 如果没有取消自动保存 则保存一次
            const saveRes = this.onSave(e, false);
            if (saveRes !== false) {
                // 保存成功或者失败都跳转到 作品页面；
                saveRes
                    .then(res => {
                        return res;
                    })
                    .then(res => redirectScene())
                    .catch(err => redirectScene());
                return;
            }
        } else if (haveCut) {
            message.warning("裁剪已取消");
        }
        this.setState({ openCloseModal: !this.state.openCloseModal }, () => {
            redirectScene();
        });
    };
    /**
     * 开启视频设置
     * @param e
     * @param callback
     */
    openOption = (e, callback = () => {}) => {
        this.setState(
            {
                openOptions: true,
                openOptionsed: true
            },
            callback
        );
    };
    closeOption = () => {
        this.setState({ openOptions: false });
    };

    openVoiceManger = () => {
        // 打开editor/bottom/index 的声音管理
        eventEmitter.emit("openSoundManage");
    };
    /**
     * 保存完毕调用
     */
    overSaving = () => {
        this.setState({ saving: false });
    };
    /**
     * 点击logo 重回商城页面
     * @constructor
     */
    RedirectIndex = () => {
        if (getURLObj(window.location.href).openFrom) return;
        this.props.dispatch(routerRedux.push(`${prev}/index`));
    };
    onCloseShareDownload = (reload = false) => {
        this.setState({
            shareDownload: false,
            openOptions: false
        });
        if (reload) {
            this.onLoad();
        }
    };

    render() {
        const { props, state } = this;
        const {
            editor: { isLoading },
            haveCut
        } = props;
        const isShowker = getItem("VIDEO-USER-INFO").type === USER_TYPE.SHOWER;
        const openFrom = getURLObj(window.location.href).openFrom;
        return (
            <div className={styles.detailBody} ref={this.detailBody}>
                {isLoading && <Loading title={isLoading === true ? "加载中" : isLoading} />}
                <div className={styles.header}>
                    <div
                        className={styles.logo}
                        onClick={this.RedirectIndex}
                        rdt='3'
                        cat='editor'
                        act='duration'>
                        <img src={videoLogo} />
                    </div>
                    <div className={styles.headerButtonGroup}>
                        {isShowker && (
                            <div style={{ display: "inline-block" }}>
                                <a
                                    href='https://bbs.eqxiu.com/forum.php?mod=viewthread&tid=108504&fromuid=2445256'
                                    target='_blank'>
                                    模板制作规范
                                </a>
                            </div>
                        )}
                        <Button
                            style={{
                                width: 92,
                                color: "#666666",
                                border: "1px solid rgba(204,213,219,1)"
                            }}
                            className={`${styles.soundManger} ${
                                state.saving ? styles.displayButton : ""
                            }`}
                            onClick={this.openVoiceManger}
                            lite={1}>
                            <Icon type={"eqf-music-f"} />
                            声音管理
                        </Button>
                        {!openFrom && <Button
                            style={{
                                width: 42,
                                color: "#666666",
                                border: "1px solid rgba(204,213,219,1)"
                            }}
                            className={state.saving ? styles.displayButton : ""}
                            onClick={this.openOption}
                            lite={1}>
                            设置
                        </Button>}

                        <SaveButton onClick={this.onSave} />
                        <Tooltip title={haveCut ? "剪裁中无法保存" : null}>
                            <Button
                                className={state.saving || haveCut ? styles.displayButton : ""}
                                style={{
                                    width: 84
                                }}
                                onClick={haveCut ? null : this.onGenerateVideo}
                                rdt='3'
                                cat='editor'
                                act='duration'>
                                {!openFrom ? ' 预览和生成' : '嵌入长页'}
                            </Button>
                        </Tooltip>
                        {!openFrom &&
                            <Button
                                className={styles.quiteBtn}
                                onClick={this.onClickQuite}
                                rdt='3'
                                cat='editor'
                                act='duration'>
                                退出
                            </Button>
                        }
                        <DeleteModal
                            visible={this.state.openCloseModal}
                            text={
                                <span>
                                    {props.editor.isLoading ||
                                        `确认退出么？`}
                                </span>
                            }
                            style={{ top: getScrollTop() }}
                            type={props.editor.isLoading ? "eqf-info-f" : "eqf-why-f"}
                            inconclass='warning'
                            sureBtn='确认'
                            cancelBtn='取消'
                            onClose={this.onCloseModal}
                            onDelete={this.onQuite}
                        />
                    </div>
                </div>
                <div className={styles.headerFill} />
                <div className={styles.rowBody}>
                    <LeftSide />
                    <div className={styles.previewBody} id='editorBody'>
                        <div className={styles.content} id='previewBody'>
                            <RulesBox/>
                            <WorkSpace />
                        </div>
                        <EditorBottom />
                    </div>
                    <HeaderMiddle />
                    <RightSide ref={this.right} overSaving={this.overSaving} />
                    {state.openOptions && <div onClick={this.closeOption} className='shade' />}
                    <CSSTransition
                        in={state.openOptions}
                        timeout={300}
                        classNames='slider'
                        unmountOnExit>
                        <VideoOption
                            onClose={this.closeOption}
                            event={this.event}
                            overSaving={this.overSaving}
                        />
                    </CSSTransition>
                </div>
                <DownLoadGoogle />
                <Modal visible={state.shareDownload}>
                    <ShareDownload
                        videoId={props.editor.videoId}
                        eqxCollectInfo={this.eqxCollectInfo}
                        typePage={TYPE_PAGE.download}
                        positionFrom={POS_FROM.editorSpace}
                        onClose={this.onCloseShareDownload}
                    />
                </Modal>
            </div>
        );
    }
}

export default userEditor;
