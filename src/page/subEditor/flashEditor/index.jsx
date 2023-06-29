import React from 'react';
import lodash from 'lodash';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import styles from './index.less';
import Button from 'Components/Button';
import { setTitle, getScrollTop } from 'Util/doc';
import EventEmitter from 'events';
import DeleteModal from 'Components/delete';
import { prev } from 'Config/env';
import Loading from '../../components/loading';
import { filter } from '../../../util/data';
import { message, Popover } from 'antd';
import { getInfo } from '../../../api/user';
import VideoOption from './videoOption';
import WorkSpace from './workSpace';
import { CSSTransition } from 'react-transition-group';
import { name, version } from '../../../config/env';
import Modal, { showModal } from '../../components/modal';
import {
    AD_TIME,
    byReason,
    DEFAULT_COVER_PIC,
    NEW_FUNCTION_GIF,
    NOOD_GUIDE_TEMPLATE_ID, TYPE_EDITOR,
} from '../../../config/staticParams';
import flash_logo from '../../static/icon/flash_logo.png';
import { localStorageKey, getItem, setItem } from '../../../util/storageLocal';
import { genUrl } from '../../../util/image';
import { enteredAdvanceMode, getLimt, insertAdvanceModeRecord } from '../../../api/userVideo';
import DownLoadGoogle from '../../components/google';
import eventEmitter from '../../../services/EventListener';
import { waitChooseVideoType } from '../../editor/chooseVideoType';
import { sendBDEvent, sendBDPage } from '../../../services/bigDataService';
import flashEditorIcon from '../../static/icon/flash_editor.png';
import { waitChoseModel } from '../../components/delete';
import RightEditor from './rightEditor';
import { platformActions, sendPlatformPage } from '../../../util/platform';
import { formatEQXMessage, isPressedCtrl } from '../../../util/event';
import Advert from '../../components/advert';
import { userTemplateGetPhoneParam } from 'Api/template';
import ShareDownload from '../../userCentre/shareDownload';
import { POS_FROM, TYPE_PAGE } from '../../../config/staticParams/goodsParams';
import { getURLObj } from '../../../util/util';
import Icon from '../../components/Icon';

const commonFilterRules = [
    {
        attr: 'title',
        rules: [
            {
                name: 'required',
                msg: '必须填写标题',
            },
            {
                name: 'max',
                value: 24,
                msg: '长度不可超过24',
            },
        ],
    },
    {
        attr: 'videoDescribe',
        rules: [
            {
                name: 'required',
                msg: '必须有填写视频介绍',
            },
            {
                name: 'max',
                value: 50,
                msg: '长度不可超过50',
            },
        ],
    },
];

function hasChangeVideoOption(obj) {
    if (obj.coverImg === DEFAULT_COVER_PIC.hoz || obj.coverImg === DEFAULT_COVER_PIC.ver) {
        return false;
    }
    return true;
}


@connect(({ flash, editor, loading }) => ({
    flash: {
        isLoading: flash.isLoading,
        id: flash.id,
        title: flash.title,
        videoDescribe: flash.videoDescribe,
        saveLoading: loading.effects['flash/saveOrRender'] || false,
        worksId: flash.worksId,
    },
}))
class index extends React.Component {
    constructor(props) {
        super(props);
        this.event = new EventEmitter();
        this.video = React.createRef();
        document.querySelector('#draw_canvas_div')
            .classList
            .remove('hidden');
        this.detailBody = React.createRef();
        this.saving = false;
        this.state = {
            openCloseModal: false,
            saving: false,
            closeWindow: false,
            openOptions: false,
            loading: false,
            openModal: false,
            openOptionsed: false,
            flashGuideStep: 0,
            shareDownload: false,
        };
    }

    componentDidMount() {

        // body禁止滚动
        document.body.style.overflow = 'hidden';
        const { params: { worksId, type }, url } = this.props.match;
        if (worksId) {
            enteredAdvanceMode(worksId)
                .then(({ data: { obj } }) => {
                    if (obj) {
                        window.location.href = `${prev}/editor/${type}/${worksId}`;
                        return;
                    }
                });
        }

        sendBDPage(`/video/subEditor/flash/${type}`);
        if (~~type === 0) {
            waitChooseVideoType()
                .then((newTemplateId) => {
                    window.location.href = `${prev}/subEditor/flash/${newTemplateId}`;
                })
                .catch(() => window.history.back(1));
            return false;
        }
        this.onLoad();
        // 登录验证
        getInfo();
        getLimt()
            .then((res) => {
                if (res.data.success) {
                    const {
                        remainSaveCount, remainRenderCount, maxSaveCount, maxRenderCount,
                    } = res.data.obj;
                    if (remainSaveCount <= 0 && !id) {
                        // 如果是新建而且保存数量已满 就不能再编辑了.
                        message.error('您的作品数量已经达到上限');
                        setTimeout(() => {
                            window.location.replace('/video/scene');
                        }, 1000);
                    } else if (remainRenderCount <= 0) {
                        message.error('您今日的渲染次数已达到上限');
                    } else {
                        return;
                    }
                    window.history.back(1);
                }
            });
        eventEmitter.on('onGenerateVideo', this.onGenerateVideo);
        eventEmitter.on('onSaveVideo', this.onSave);
        this.flashGuide(); // 新手引导
        window.addEventListener('message', this.parentMessage);
        //获取upload token
        this.getPhoneToken();
        document.addEventListener('keydown', this.handleSave);
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (!lodash.isEqual(this.state, nextState)) {
            return true;
        }
        if (this.props.flash.isLoading !== nextProps.flash.isLoading) {
            return true;
        }
        if (this.props.flash.saveLoading !== nextProps.flash.saveLoading) {
            return true;
        }
        return false;
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        const newState = {};
        const { flash } = nextProps;
        if (flash.id !== prevState.id) {
            newState.loading = false;
        }
        newState.saving = flash.isLoading && !prevState.saving;
        return newState;
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.location.pathname !== this.props.location.pathname) {
            this.onLoad();
        }
        if (prevProps.flash.id !== this.props.flash.id) {
            this.overSaving();
        }
    }

    componentWillUnmount() {
        eventEmitter.removeListener('onGenerateVideo', this.onGenerateVideo);
        eventEmitter.removeListener('onSaveVideo', this.onSave);
        // 取消body禁止滚动
        document.body.style.overflow = 'auto';
        document.querySelector('#draw_canvas_div')
            .classList
            .add('hidden');
        window.removeEventListener('message', this.parentMessage);
        document.removeEventListener('keydown', this.handleSave);
    }


    // 新手引导
    flashGuide = () => {
        const { worksId = null } = this.props.match.params;
        const item = getItem(localStorageKey.flashGuide);
        if (!item && !worksId) {
            this.changeFlashGuideStep();
        }
    };

    parentMessage = (e) => {
        const data = formatEQXMessage(e);
        if (data === false) {
            return;
        }
        if (data.eventType === 'savePageData') {
            this.onSave(e, false);
        }
    };

    /**
     * 获取token用于我的图片手机上传token
     */
    getPhoneToken = () => {
        userTemplateGetPhoneParam()
            .then(res => {
                const { data } = res;
                if (data.success) {
                    //tokek获取成功 存入models
                    this.props.dispatch({
                        type: 'flash/savePhoneToken',
                        payload: {
                            uploadPhoneTokenObj: data.obj,
                        },
                    });
                } else {
                    message.error(data.msg);
                }
            });
    };
    /**
     * 关闭窗口时的确认，大多数浏览器无效
     * @param e
     */
    onClose = (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.setState({ closeWindow: true });
        this.onClickQuite();
    };
    /**
     *根据url地址读取编辑器信息
     */
    onLoad = () => {
        const { type, worksId = null } = this.props.match.params;
        setTitle('一键快闪');
        this.props.dispatch({
            type: 'flash/init',
            payload: {
                worksId: worksId || null,
                type: Number(type),
            },
        });
    };
    handleSave = (e) => {
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
        const openFrom = getURLObj(window.location.href).openFrom;
        if (openFrom) {
            this.onGenerateVideo();
            return;
        }
        if (this.state.saving) {
            return false;
        }
        if (!showMessage) {
            message.config({
                maxCount: 0,
            });
        }
        const submit = () => {
            const { type, worksId = null } = this.props.match.params;
            return this.props.dispatch({
                type: 'flash/saveOrRender',
                payload: {
                    onlySave: true,
                    type,
                    worksId,
                },
            });
        };
        if (filter(commonFilterRules, this.props.flash) !== true) {
            if (showMessage) message.error('资料填写有误');
            this.openOption(e, () => this.event.emit('saveError'));
            return false;
        }
        return submit()
            .then((res) => {
                message.config({
                    maxCount: 5,
                });
            });
    };
    /**
     * 生成视频事件
     */
    onGenerateVideo = async (e) => {
        if (this.saving) {
            return false;
        }
        const submit = () => {
            sendBDEvent({
                position: '一键快闪编辑器',
                type: '生成视频',
            });
            return this.props.dispatch({
                type: 'flash/saveOrRender',
                payload: { onlySave: false },
            }).then((res) => {
                if (res) {
                    this.handlePre();
                }
            }).finally(() => {
                this.saving = false;
            });
        };
        const {
            props: { flash },
            state: { openOptionsed },
        } = this;
        if (!openOptionsed && hasChangeVideoOption(flash) === false) {
            showModal({
                title: '您尚未进行视频标题、封面的修改',
                info: '可前往“视频设置”进行修改。若不修改，将使用默认。',
                buttons: [
                    {
                        children: '仍要生成',
                        className: styles.still_save,
                        onClick: () => {
                            submit();
                            return false;
                        },
                    },
                    {
                        children: '前往设置',
                        onClick: (e) => {
                            this.openOption(e);
                            return false;
                        },
                    },
                ],
            });
            return false;
        }
        if (filter(commonFilterRules, this.props.flash) !== true) {
            message.error('资料填写有误');
            this.openOption(e, () => this.event.emit('saveError'));
            return false;
        }
        this.saving = true;
        return submit();
    };
    handlePre = () => {
        this.setState({ shareDownload: true });
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
            openPreviewModal: false,
        });
    };
    /**
     * google 谷歌浏览器判断提示
     */
    downloadGoogle = () => {
        this.setState({ downloadGoogle: false });
    };
    /**
     * 确认退出事件
     */
    onQuite = (e) => {
        const {
            props: {
                dispatch,
                flash: { cancelAutoSave, isLoading, status },
            },
        } = this;
        if (isLoading) return;
        const redirectScene = () => {
            dispatch(routerRedux.push(`${prev}/scene`));
        };
        sendPlatformPage(platformActions.quite, this.props.flash.id, 'flash');
        if (this.state.closeWindow) {
            window.close();
        }
        if (status < 4) {
            // 如果没有取消自动保存 则保存一次
            const saveRes = this.onSave(e, false);
            if (saveRes !== false) {
                // 保存成功或者失败都跳转到 作品页面；
                saveRes.then(res => redirectScene())
                    .catch(err => redirectScene());
                return;
            }
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
    openOption = (e, callback = () => { }) => {
        this.setState(
            {
                openOptions: true,
                openOptionsed: true,
            },
            callback,
        );
    };
    closeOption = () => {
        this.setState({ openOptions: false });
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
        this.props.dispatch(routerRedux.push(`${prev}/index/1`));
    };
    changeFlashGuideStep = () => {
        const nextStep = this.state.flashGuideStep + 1;
        document.querySelectorAll('.guideCard')
            .forEach(node => {
                node.style.animation = 'none';
            });
        this.setState({
            flashGuideStep: nextStep,
        }, () => {
            setTimeout(() => {
                const elementNodeList = document.querySelectorAll('.guideCard');
                elementNodeList[nextStep - 1].style.animation = 'floatX 1000ms infinite backwards';
            }, 300);
        });
    };
    flashGuideDetails = [
        ['您可以在此处添加文字和图片，', '添加的文字，系统会自动将其切分为多个镜头哦'],
        ['添加好相应的文字和图片后，', '您就可以点击生成视频啦'],
        ['您还可以点击 “?”查看具体教程哦'],
    ];
    goToEditor = () => {
        const { type, worksId = null } = this.props.match.params;
        waitChoseModel({ text: '进入高级编辑模式后，后期再次编辑时将直接进入高级编辑器，您确认吗？' })
            .then(() => {
                insertAdvanceModeRecord(worksId);
                this.props.dispatch(routerRedux.push(`${prev}/editor/${type}/${worksId}`));
            });
    };
    finishFlashGuide = () => {
        this.changeFlashGuideStep();
        setItem(localStorageKey.flashGuide, true);
    };
    getPopoverContent = (step = 1) => {
        if (step < 1) {
            return '';
        }
        return (<div>
            <div>{this.flashGuideDetails[step - 1].map((item, index) => {
                if (index > 0) {
                    return <React.Fragment key={index}>
                        <br />{item}
                    </React.Fragment>;
                } else {
                    return <span key={index}>{item}</span>;
                }
            })}</div>
            <div className="nextStep">
                {step === this.flashGuideDetails.length
                    ? <div onClick={this.finishFlashGuide}>我知道啦</div>
                    : <div onClick={this.changeFlashGuideStep}>下一步</div>}
            </div>
        </div>);
    };

    onCloseShareDownload = (reload = false) => {
        this.setState({ shareDownload: false });
        if (reload) {
            this.onLoad();
        }
    }
    render() {
        const { props, state } = this;
        const { isLoading, saveLoading } = props.flash;
        const { worksId = null } = this.props.match.params;
        const openFrom = getURLObj(window.location.href).openFrom;
        return (
            <div className={styles.detailBody} ref={this.detailBody}>
                {(isLoading || saveLoading) &&
                    <Loading title={(isLoading || saveLoading === true) ? '加载中' : isLoading} />}
                <div className={styles.header}>
                    <div
                        className={styles.logo}
                        onClick={this.RedirectIndex}
                        rdt="3"
                        cat="flash"
                        act="duration"
                    >
                        <img src={flash_logo} />
                    </div>
                    {worksId && <div className={styles.advanceEditor} onClick={this.goToEditor}>
                        <img src={flashEditorIcon} />
                        进入高级编辑模式
                    </div>}
                    <div className={styles.headerButtonGroup}>
                        {!openFrom && <Button
                            style={{ width: 64 }}
                            className={state.saving ? styles.displayButton : ''}
                            onClick={this.openOption}
                            rdt="3" cat="flash" act="duration">
                            视频设置
                        </Button>}

                        <Button
                            style={{ width: 42 }}
                            className={state.saving ? styles.displayButton : ''}
                            onClick={this.onSave}
                            rdt="3" cat="flash" act="duration"
                        >
                            {!openFrom ? '保存':'预览'}
                        </Button>
                        <Popover
                            overlayClassName={`guideCard top_guideCard`}
                            placement="bottomRight" visible={state.flashGuideStep === 2}
                            title={null}
                            content={this.getPopoverContent(2)}
                            trigger="click">
                            <Button
                                className={state.saving ? styles.displayButton : ''}
                                style={{ width: 84 }}
                                onClick={this.onGenerateVideo}
                                rdt="3" cat="flash" act="duration">
                                { !openFrom ? '预览和生成':'嵌入长页'}
                            </Button>
                        </Popover>
                        {!openFrom && <Button
                            className={styles.quiteBtn}
                            onClick={this.onClickQuite}
                            rdt="3" cat="flash" act="duration">
                            退出
                        </Button>}

                        {!openFrom &&   <DeleteModal
                            visible={this.state.openCloseModal}
                            text={<span>{props.flash.isLoading || '确认退出么？'}</span>}
                            style={{ top: getScrollTop() }}
                            type={props.flash.isLoading ? 'eqf-info-f' : 'eqf-why-f'}
                            inconclass="warning"
                            sureBtn="确认"
                            cancelBtn="取消"
                            onClose={this.onCloseModal}
                            onDelete={this.onQuite}
                        />}
                    </div>
                </div>
                <div className={styles.headerFill} />
                <div className={styles.rowBody}>
                    <div className={styles.content} id="previewBody">
                        <div className={styles.leftSide}>
                            <Popover
                                overlayClassName={`guideCard`}
                                placement="right" visible={state.flashGuideStep === 3} title={null}
                                content={this.getPopoverContent(3)}
                                trigger="click">
                                <div className={`${styles.course}`}>
                                    {/*<Icon type="eqf-activity-l"/>教程*/}
                                </div>
                            </Popover>
                            <Advert
                                editorType={TYPE_EDITOR.flashEditor.editor}
                                autoShow={getItem(localStorageKey.flashGuide)} />
                        </div>
                        <div className={styles.rightSide}>
                            <WorkSpace getPopoverContent={this.getPopoverContent}
                                step={state.flashGuideStep} />
                            <RightEditor />
                        </div>
                    </div>
                    {state.openOptions && <div onClick={this.closeOption} className="shade" />}
                    <CSSTransition in={state.openOptions} timeout={300} classNames="slider"
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
                    <ShareDownload videoId={props.flash.worksId}
                        typePage={TYPE_PAGE.download}
                        positionFrom={POS_FROM.editorSpace}
                        onClose={this.onCloseShareDownload} />
                </Modal>
            </div>
        );
    }
}

export default index;
