import React from 'react';
import lodash from 'lodash';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import styles from './index.less';
import Button from 'Components/Button';
import { setTitle, getScrollTop } from 'Util/doc';
import EventEmitter from 'events';
import DeleteModal from 'Components/delete';
import env, { prev } from 'Config/env';
import Loading from '../../components/loading';
import { filter } from '../../../util/data';
import { message, Popover } from 'antd';
import { getInfo } from '../../../api/user';
import VideoOption from './videoOption';
import { CSSTransition } from 'react-transition-group';
import { name, version } from '../../../config/env';
import Modal, { showModal } from '../../components/modal';
import {
    AD_TIME,
    byReason,
    DEFAULT_COVER_PIC,
    NEW_FUNCTION_GIF,
    OPEN_FROM, TYPE_EDITOR,
} from '../../../config/staticParams';
import { COLOR_STYLES } from '../../../dataBase/typeMonkey';
import typeMonkey_logo from '../../static/icon/typeMonkey.png';
import { localStorageKey, getItem, setItem } from '../../../util/storageLocal';
import { getLimt } from '../../../api/userVideo';
import DownLoadGoogle from '../../components/google';
import eventEmitter from '../../../services/EventListener';
import { sendBDEvent, sendBDPage } from '../../../services/bigDataService';
import Icon from '../../components/Icon';
import RightEditor from './rightEditor';
import RenderTypeMonkey from '../../../services/typeMonkey/renderTypeMonkey';
import loadingImg from '../../static/t2vloading.gif';
import Advert from '../../components/advert';
import ShareDownload from '../../userCentre/shareDownload';
import { POS_FROM, TYPE_PAGE } from '../../../config/staticParams/goodsParams';
import { getURLObj } from '../../../util/util';
import { isPressedCtrl, formatEQXMessage } from '../../../util/event';
import { platformActions, sendPlatformPage } from '../../../util/platform';

const { openFrom, tabId } = getURLObj(window.location.search);
let initFlag = true;
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


@connect(({ typeMonkey, loading }) => ({
    typeMonkey,
    isLoading: loading.effects['typeMonkey/init'] || loading.effects['typeMonkey/saveOrRender'],
}))
class Index extends React.Component {
    constructor(props) {
        super(props);
        this.event = new EventEmitter();
        this.video = React.createRef();
        document.querySelector('#draw_canvas_div')
            .classList
            .remove('hidden');
        this.detailBody = React.createRef();
        this.eqxCollectInfo = {};
        this.state = {
            playing: false, // 播放状态
            openCloseModal: false,
            saving: false,
            closeWindow: false,
            openOptions: false,
            loading: false,
            openModal: false,
            openOptionsed: false,
            showNewFunctionModal: false,
            flashGuideStep: 0,
            transverse: 1, // 横竖版本
            newFunTip: false, // 新功能提示 false：不提示
            operateNoticeTip: false, // 运营公告 false: 不提示
            clickAdBtn: false, //  点击公告
            sendBDEvent: {
                visible: false,
            },
            shareDownload: false,
        };
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        const { typeMonkey } = nextProps;
        const newState = {};
        newState.transverse = typeMonkey.transverse ? 1 : 0;
        return newState;
    }

    componentDidMount() {
        // body禁止滚动
        document.body.style.overflow = 'hidden';
        const { params: { worksId, type }, url } = this.props.match;
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
        if (!this.props.isLoading && initFlag) {
            // 长页视频融合-二次编辑
            console.log('视频编辑器加载完成', openFrom, tabId)
            if (openFrom === OPEN_FROM.longPage) {
                // 加载完成通知集合页面
                sendPlatformPage(platformActions.messageReady, {
                    tabId,
                }, 'typeMonkey');
                initFlag = false
            }
        }
        window.addEventListener('message', this.parentMessage);
        document.addEventListener('keydown', this.handleSave);
    }


    componentDidUpdate(prevProps, prevState) {
        if (prevProps.location.pathname !== this.props.location.pathname) {
            this.onLoad();
        }
        if (prevProps.typeMonkey.id !== this.props.typeMonkey.id) {
            this.overSaving();
        }
        if (prevProps.typeMonkey.animationStyle && !this.props.typeMonkey.animationStyle) {
            if (this.props.playing) {
                this.play();
            }
            const dom = document.createElement('p');
            dom.innerText = this.props.typeMonkey.text[0] || '文字样例';
            document.getElementById('typeMonkeyCanvas').innerHTML = '';
            document.getElementById('typeMonkeyCanvas')
                .appendChild(dom);
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
        clearTimeout(this.timer);
        if (this.audio) {
            this.audio.pause();
            this.audio.src = '';
        }
        window.removeEventListener('message', this.parentMessage);
        document.removeEventListener('keydown', this.handleSave);
    }
    parentMessage = (e) => {
        const data = formatEQXMessage(e);
        if (data === false) {
            return;
        }
        if (data.eventType === 'savePageData') {
            this.onSave(e, false);
        }
        // 长页融合集合页消息
        if (data.eventType === 'editorOpened') {
            // 存储originId，即是作为父级窗口的唯一标识
            this.eqxCollectInfo = {
                originId: data.originId,
                tabId: data.tabId,
            }
            window.eqxCollectInfo = this.eqxCollectInfo;
        }
        // 长页融合集合页消息
        if (data.eventType === 'saveAndOpenNew') {
            // 同时编辑AB视频时，A视频自动保存，关闭A视频编辑器打开B视频编辑器
            console.log('视频自动保存开始')
            this.onSave(e, true);
            // 向集合页面通知消息
            sendPlatformPage(platformActions.saveAndOpenNew, {
                ...this.eqxCollectInfo,
            }, 'typeMonkey');
        }
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
        setTitle('字说自画');
        this.props.dispatch({
            type: 'typeMonkey/init',
            payload: {
                worksId,
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
            this.onGenerateVideo()
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
                type: 'typeMonkey/saveOrRender',
                payload: {
                    onlySave: true,
                    type,
                    worksId,
                },
            });
        };
        if (filter(commonFilterRules, this.props.typeMonkey) !== true) {
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
        if (this.state.saving) {
            return false;
        }
        const submit = () => {
            sendBDEvent({
                position: '字说自画编辑器',
                type: '生成视频',
            });
            return this.props.dispatch({
                type: 'typeMonkey/saveOrRender',
                payload: { onlySave: false },
            }).then((res) => {
                if (res) {
                    this.handlePre();
                }
            });
        };
        const {
            props: { typeMonkey },
            state: { openOptionsed },
        } = this;
        if (!openOptionsed && hasChangeVideoOption(typeMonkey) === false) {
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
        if (filter(commonFilterRules, this.props.typeMonkey) !== true) {
            message.error('资料填写有误');
            this.openOption(e, () => this.event.emit('saveError'));
            return false;
        }
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
     * 确认退出事件
     */
    onQuite = (e) => {
        const {
            props: {
                dispatch,
                typeMonkey: { cancelAutoSave, isLoading, status },
            },
        } = this;
        if (isLoading) return;
        const redirectScene = () => {
            // 通知长页关闭tab
            if (getURLObj(window.location.href).openFrom) {
                sendPlatformPage(platformActions.quite, {
                    ...this.eqxCollectInfo,
                }, 'typeMonkey');
            }
            dispatch(routerRedux.push(`${prev}/scene`));
        };
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
        e.stopPropagation();
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
    changeTransverse = (e, transverse) => {
        const newTransverse = transverse === 1 ? true : false;
        const coverImg = newTransverse ? DEFAULT_COVER_PIC.hoz : DEFAULT_COVER_PIC.ver;
        if (transverse !== this.state.transverse) {
            this.setState({ transverse });
            this.props.dispatch({
                type: 'typeMonkey/save',
                payload: {
                    transverse: newTransverse,
                    bgImg: null,
                    animationStyle: null,
                    coverImg,
                },
            });
        }
    };
    play = async () => {
        const { state: { playing }, props: { dispatch } } = this;
        if (playing) {
            return this.audio.pause();
        }
        let { props: { typeMonkey: { animationStyle, voiceover, time } } } = this;
        this.setState({ playLoading: true });
        if (!voiceover || time.length === 0) {
            const res = await dispatch({
                type: 'typeMonkey/textToVoice',
            })
                .catch((e) => {
                    console.log(e);
                    this.setState({ playLoading: false });
                });
            if (res === false) {
                this.setState({ playLoading: false });
            }
        }
        if (!animationStyle) {
            await dispatch({
                type: 'typeMonkey/say2Draw',
                payload: {
                    id: 1,
                },
            });
        }
        ({
            props: {
                typeMonkey: {
                    animationStyle,
                    voiceover,
                },
            },
        } = this);
        this.renderTypeMonkey = new RenderTypeMonkey(animationStyle);
        this.renderTypeMonkey.createContent();
        this.audio = this.audio || new Audio();
        this.audio.src = voiceover;
        this.audio.autoplay = true;
        this.audio.addEventListener('timeupdate', (e) => {
            this.renderTypeMonkey.onTimeUpdate(this.audio.currentTime);
        });
        this.audio.addEventListener('play',
            () => {
                this.setState({
                    playLoading: false,
                    playing: true,
                });
                this.renderTypeMonkey.play.bind(this.renderTypeMonkey);
            });
        this.audio.addEventListener('pause',
            () => {
                this.setState({ playing: false });
                this.renderTypeMonkey.pause.bind(this.renderTypeMonkey);
            },
        );
    };
    onCloseShareDownload = (reoload = false) => {
        this.setState({ shareDownload: false });
        if (reoload) {
            this.onLoad();
        }
    }


    render() {
        const { props, state } = this;
        const { isLoading } = props;
        const { typeMonkey: { bgImg, colorType, font, text } } = props;
        const colorItem = COLOR_STYLES[colorType] || COLOR_STYLES[0];
        const bg = {
            backgroundColor: colorItem.color.bg,
            color: colorItem.color.font[0],
            backgroundImage: bgImg ? `url("${bgImg}")` : 'none',
            fontFamily: font,
        };
        const playPause = state.playing ? 'eqf-pause-f' : 'eqf-play-f';
        const bgBoxStyle = state.transverse === 1 ? {
            width: '564px',
            height: '317px',
            ...bg,
        } : {
                width: '313px',
                height: '556px',
                ...bg,
            };
        const openFrom = getURLObj(window.location.href).openFrom;
        return (
            <div className={styles.detailBody} ref={this.detailBody}>
                {isLoading && initFlag &&
                    <Loading title={'加载中'} />}
                <div className={styles.header}>
                    <div
                        className={styles.logo}
                        onClick={this.RedirectIndex}
                        rdt="3"
                        cat="flash"
                        act="duration"
                    >
                        <img src={typeMonkey_logo} />
                    </div>
                    <div className={styles.headerButtonGroup}>
                        {!openFrom &&  <Button
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
                            rdt="3" cat="flash" act="duration">
                            {!openFrom ? '保存' : '预览'}
                        </Button>
                        <Button
                            className={state.saving ? styles.displayButton : ''}
                            style={{ width: 84 }}
                            onClick={this.onGenerateVideo}
                            rdt="3" cat="flash" act="duration"
                        >
                            {!openFrom ? '预览和生成' : '嵌入长页'}
                        </Button>
                        {!openFrom && <Button
                            className={styles.quiteBtn}
                            onClick={this.onClickQuite}
                            rdt="3" cat="flash" act="duration">
                            退出
                        </Button>}
                        <DeleteModal
                            visible={this.state.openCloseModal}
                            text={<span>{props.typeMonkey.isLoading || '确认退出么？'}</span>}
                            style={{ top: getScrollTop() }}
                            type={props.typeMonkey.isLoading ? 'eqf-info-f' : 'eqf-why-f'}
                            inconclass="warning"
                            sureBtn="确认"
                            cancelBtn="取消"
                            onClose={this.onCloseModal}
                            onDelete={this.onQuite}
                        />
                    </div>
                </div>
                <div className={styles.headerFill} />
                <div className={styles.rowBody}>
                    <div className={styles.content} id="previewBody">
                        <div className={styles.leftSide}>
                            <div className={`${styles.list} ${!state.transverse
                                ? styles.activeTransverse
                                : ''}`}
                                onClick={(e) => this.changeTransverse(e, 0)}>
                                <div className={styles.ver} />
                                <div className={styles.size}>9:16</div>
                            </div>
                            <div className={`${styles.list} ${state.transverse
                                ? styles.activeTransverse
                                : ''}`}
                                onClick={(e) => this.changeTransverse(e, 1)}>
                                <div className={styles.hoz} />
                                <div className={styles.size}>16:9</div>
                            </div>
                            <Advert editorType={TYPE_EDITOR.typeMonkeyEditor.editor} />
                        </div>
                        <div className={styles.rightSide}>
                            <div className={styles.workspace}>
                                <div className={styles.videoWrap}>
                                    <div className={styles.bgImgWrap} style={bgBoxStyle}>
                                        <div id='typeMonkeyCanvas'
                                            className={`${styles.playerContent}
                                             ${state.transverse
                                                    ? styles.hoz
                                                    : ''}`}>
                                            <p>{text[0] || '文字样例'}</p>
                                        </div>
                                    </div>
                                    {state.playLoading ?
                                        <div className={styles.loadingBody}>
                                            <div>
                                                <img src={loadingImg} alt='读取图标' />
                                            </div>
                                        </div> :
                                        <Icon onClick={this.play}
                                            type={playPause}
                                            className={styles.playPause} />}
                                </div>
                            </div>
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
                            {...state}
                        />
                    </CSSTransition>
                </div>
                <DownLoadGoogle />
                <Modal visible={state.shareDownload}>
                    <ShareDownload videoId={props.typeMonkey.worksId}
                        typePage={TYPE_PAGE.download}
                        positionFrom={POS_FROM.editorSpace}
                        onClose={this.onCloseShareDownload} />
                </Modal>
            </div>
        );
    }
}

export default Index;
