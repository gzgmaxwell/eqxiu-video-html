import React from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import styles from './subtitles.less';
import RightSide from './right';
import { setTitle } from 'Util/doc';
import EventEmitter from 'events';
import { prev } from 'Config/env';
import Loading from '../../components/loading';
import { filter } from '../../../util/data';
import { message } from 'antd';
import { getInfo } from '../../../api/user';
import VideoSet from './videoSet';
import WorkSpace from './center';
import { CSSTransition } from 'react-transition-group';
import { name } from '../../../config/env';
import Modal, { showModal } from '../../components/modal';
import {
    BOTTOM_HEIGHT,
    DEFAULT_COVER_PIC,
    NORMAL_RESOLUTION,
    SUBTITLES_H,
    SUBTITLES_TRANSVERSE_W,
    SUBTITLES_W, TOP_HEIGHT, TYPE_EDITOR,
    OPEN_FROM
} from '../../../config/staticParams';
import { genUrl } from '../../../util/image';
import { getLimt } from '../../../api/userVideo';
import Top from './top/index';
import Substitles from './time';
import DownLoadGoogle from '../../components/google';
import eventEmitter from '../../../services/EventListener';
import { sendBDEvent } from '../../../services/bigDataService';
import { formatEQXMessage, isPressedCtrl } from '../../../util/event';
import { platformActions, sendPlatformPage } from '../../../util/platform';
import Advert from '../../components/advert';
import ShareDownload from '../../userCentre/shareDownload';
import { POS_FROM, TYPE_PAGE } from '../../../config/staticParams/goodsParams';
import VideoStore from '../../editor/videoStore';
import { getURLObj } from '../../../util/util';

const commonFilterRules = [
    {
        attr: 'title',
        rules: [
            {
                name: 'required',
                msg: '必须填写标题',
            }, {
                name: 'max',
                value: 24,
                msg: '长度不可超过24',
            }],
    },
    {
        attr: 'videoDescribe',
        rules: [
            {
                name: 'required',
                msg: '必须有填写视频介绍',
            }, {
                name: 'max',
                value: 50,
                msg: '长度不可超过50',
            }],
    },
];

function hasChangeVideoOption(obj) {
    if (obj.coverImg === DEFAULT_COVER_PIC.hoz || obj.coverImg === DEFAULT_COVER_PIC.ver) {
        return false;
    }
    return true;
}


@connect(({ subtitles }) => ({ subtitles }))
class userEditor extends React.Component {
    constructor(props) {
        super(props);
        this.right = React.createRef();
        this.event = new EventEmitter();
        this.video = React.createRef();
        this.eqxCollectInfo = {};
        document.querySelector('#draw_canvas_div')
            .classList
            .remove('hidden');
        this.state = {
            openCloseModal: false,
            saving: false,
            closeWindow: false,
            openOptions: false,
            loading: false,
            openOptionsed: false,
            uuid: null,
            videoParams: {
                autoplay: false,
                controls: false,
                poster: '',
                language: 'cn',
                loop: 'loop',
                sources: {
                    src: null,
                    type: 'video/mp4',
                },
                notSupportedMessage: '无法播放此视频',
            },
            shareDownload: false,
        };
    }

    videoStyle = {
        maxWidth: '100%',
        maxHeight: '100%',
    };
    sources = {};
    currentTime = 0; // 视频当前的播放时间
    static getDerivedStateFromProps(nextProps, prevState) {
        const newState = {};
        const { subtitles } = nextProps;
        if (subtitles.id !== prevState.id) {
            newState.loading = false;
        }
        newState.saving = subtitles.isLoading && !prevState.saving;
        return newState;
    }

    componentDidMount() {
        // body禁止滚动
        document.body.style.overflow = 'hidden';
        const { id } = this.props.match.params;
        eventEmitter.on('addSubTitle', this.addSubTitle);
        this.reset();
        this.onLoad();
        // 登录验证
        getInfo();
        getLimt()
            .then(res => {
                if (res.data.success) {
                    const { remainSaveCount, remainRenderCount } = res.data.obj;
                    if (remainSaveCount <= 0 && !id) { // 如果是新建而且保存数量已满 就不能再编辑了.
                        message.error('您的作品数量已经达到上限');
                        setTimeout(() => {
                            location.replace(`/video/scene`);
                        }, 1000);
                    } else if (remainRenderCount <= 0) {
                        message.error('您今日的渲染次数已达到上限');
                    } else {
                        return;
                    }
                    window.history.back(1);
                }
            });
        // 视频首页流量统计
        if (name === 'pro') {
            window._hmt &&
                window._hmt.push([`_trackPageview`, `/video/subEditor/subtitles/${id}`]);
        }
        this.listenVideo();
        window.addEventListener('resize', this.resizeWindow);
        this.resizeWindow();
        window.addEventListener('message', this.parentMessage);
        document.addEventListener('keydown', this.handleSave);
    }

    componentDidUpdate(prevProps, prevState) {
        const { playing } = prevState;
        const prevCurrentTime = this.currentTime;
        const { props: { subtitles: { videoBase64 = null, dataList } } } = this;
        const { subtitles: { videoBase64: prevVideoBase64 = null, dataList: prevDataList } } = prevProps;
        if (Object.keys(dataList).length !== Object.keys(prevDataList).length) {
            this.timeupdate();
        }
        if (prevProps.location.pathname !== this.props.location.pathname) {
            this.onLoad();
        }
        if (prevProps.subtitles.id !== this.props.subtitles.id) {
            this.overSaving();
        }
        if (!prevVideoBase64 && videoBase64 && this.video.current) {
            this.video.current.oncanplay = (e) => {
                this.video.current.currentTime = prevCurrentTime /
                    1000;
                if (playing) {
                    this.video.current.play();
                }
                this.video.current.oncanplay = null;
            };
        }
        if (this.video.current) {
            this.listenVideo();
        }
    }

    componentWillUnmount() {
        // 取消body禁止滚动
        document.body.style.overflow = 'auto';
        document.querySelector('#draw_canvas_div')
            .classList
            .add('hidden');
        // 监听播放时间
        this.removeListenter();
        window.removeEventListener('resize', this.resizeWindow);
        this.props.dispatch({
            type: 'subtitles/cancelVoiceRecognition',
        });
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
                id: this.props.subtitles.worksId,
                ...this.eqxCollectInfo,
            }, 'subtitle');
        }
    };

    removeListenter = () => {
        if (!this.video.current) return;
        this.video.current.removeEventListener('timeupdate', this.timeupdate);
        this.video.current.removeEventListener('play', this.play);
        this.video.current.removeEventListener('pause', this.pause);
    };
    listenVideo = () => {
        // 监听播放时间
        if (!this.video.current) return;
        this.video.current.addEventListener('timeupdate', this.timeupdate);
        this.video.current.addEventListener('play', this.play);
        this.video.current.addEventListener('pause', this.pause);
    };
    resizeWindow = () => {
        const excludeHeight = document.body.clientWidth < 1920
            ? BOTTOM_HEIGHT + TOP_HEIGHT + 16 * 2
            : BOTTOM_HEIGHT + TOP_HEIGHT + 72 * 2;
        this.saveData(
            { positionScale: (document.body.clientHeight - excludeHeight) / SUBTITLES_H });
    };
    reset = () => {
        this.props.dispatch({
            type: 'subtitles/reset',
        });
    };
    addSubTitle = (uuid) => {
        this.setState({ uuid });
    };
    saveData = (payload) => {
        this.props.dispatch({
            type: 'subtitles/save',
            payload,
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
        const { id, worksId = null } = this.props.match.params;
        if (!worksId && ~~id === 0) {
            this.setState({ openVideoStore: true, });
        } else {
            this.props.dispatch({
                type: 'subtitles/init',
                payload: {
                    id,
                    worksId,
                },
            });
        }
    };
    /**
     * 关闭视频库
     */
    onCloseVideoStroe = (e) => {
        if (e) {
            this.setState({ openVideoStore: false });
        } else {
            message.warning('必须选择一个视频');
            window.history.back(-1);
        }
    }
    /**
     * 选择视频
     */
    onInsert = (id) => {
        const { props: { dispatch } } = this;
        this.setState({ openVideoStore: false });
        dispatch(routerRedux.push(`${prev}/subEditor/subtitles/${id}`));
    }

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
        this.video.current.pause();
        if (this.state.saving) {
            return false;
        }
        if (!showMessage) {
            message.config({
                maxCount: 0,
            });
        }
        const submit = () => {
            const { id } = this.props.match.params;
            return this.props.dispatch({
                type: 'subtitles/submit',
                payload: {
                    onlySave: true,
                    id,
                    ...this.saveVideoPosition(),
                },
            });
        };
        if (filter(commonFilterRules, this.props.subtitles) !== true) {
            if (showMessage) message.error('资料填写有误');
            this.openOption(e, () => this.event.emit('saveError'));
            return false;
        }
        return submit()
            .then(res => {
                message.config({
                    maxCount: 5,
                });
            });
    };
    /**
     * 生成视频事件
     */
    onGenerateVideo = (e) => {
        if (this.state.saving) {
            return false;
        }
        const { props: { subtitles: { worksId } } } = this;
        const submit = () => {
            sendBDEvent({
                position: '字幕编辑器',
                type: '生成',
            });
            return this.props.dispatch({
                type: 'subtitles/submit',
                payload: {
                    onlySave: false,
                    id: this.props.match.params.id,
                    postion: this.saveVideoPosition(),
                },
            }).then((res) => {
                if (res) {
                    this.handlePre();
                }
            });
        };
        const { props: { subtitles }, state: { openOptionsed } } = this;
        if (!openOptionsed && hasChangeVideoOption(subtitles) === false) {
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
        if (filter(commonFilterRules, this.props.subtitles) !== true) {
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
        });
    };
    /**
     * 确认退出事件
     */
    onQuite = (e) => {
        const { props: { dispatch, subtitles: { worksId, isLoading } } } = this;
        if (isLoading) return;
        const redirectScene = () => {
            // 通知长页关闭tab
            if (getURLObj(window.location.href).openFrom) {
                sendPlatformPage(platformActions.quite, {
                    id: worksId,
                    ...this.eqxCollectInfo,
                }, 'subtitle');
            }
            dispatch(routerRedux.push(`${prev}/scene`));
        };
        if (this.state.closeWindow) {
            window.close();
        }
        if (!worksId) { // 如果没有videoID 则保存一次
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
    openOption = (e, callback = () => {
    }) => {
        this.setState({
            openOptions: true,
            openOptionsed: true,
        }, callback);
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
        const { props: { subtitles: { worksId } } } = this;
        if (getURLObj(window.location.href).openFrom) return;
        this.props.dispatch(routerRedux.push(`${prev}/index/2`));
    };
    // 切换横竖板
    changeTransverse = (nextTransverse) => {
        this.removeListenter();
        this.video.current && this.video.current.pause();
        const { transverse } = this.props.subtitles;
        if (transverse !== nextTransverse) {
            this.props.dispatch({
                type: 'subtitles/transverse',
                payload: { transverse: nextTransverse },
            });
        }
    };
    // 计算视频的位置
    saveVideoPosition = () => {
        const current = this.video.current;
        const { url, transverse } = this.props.subtitles;
        const width = transverse ? SUBTITLES_TRANSVERSE_W : SUBTITLES_W;
        const height = SUBTITLES_H;
        const { x, y } = transverse ? NORMAL_RESOLUTION.hoz : NORMAL_RESOLUTION.ver;
        if (current && url) {
            return {
                left: (width - current.offsetWidth) / 2 / width * x,
                top: (height - current.offsetHeight) / 2 / height * y,
                width: current.offsetWidth / width * x,
                height: current.offsetHeight / height * y,
            };
        }
        return {};
    };
    play = () => {
        document.getElementById('previewBody')
            .addEventListener('mousedown', this.dontClick, { capture: true });
        this.setState({ playing: true });
    };
    pause = () => {
        document.getElementById('previewBody')
            .removeEventListener('mousedown', this.dontClick, { capture: true });
        this.setState({ playing: false });
    };
    dontClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
    };
    timeupdate = () => {
        const video = this.video.current;
        // 用秒数来显示当前播放进度
        this.currentTime = Math.floor(video.currentTime * 1000);
        const { dataList } = this.props.subtitles;
        const { uuid } = Object.values(dataList)
            .find(item => (~~item.begin) <= this.currentTime && item.end > this.currentTime) ||
            { uuid: null };
        if (this.state.uuid !== uuid) {
            this.setState({ uuid });
        }
    };
    getVideoStyle = () => {
        const current = this.video.current;
        const { url, transverse, resolutionH, resolutionW } = this.props.subtitles;
        const scale = transverse ? 16 / 9 : 9 / 16;
        const width = transverse ? SUBTITLES_TRANSVERSE_W : SUBTITLES_W;
        const height = SUBTITLES_H;
        if (current && url) {
            // 通过视频的真实比例，获取缩放后的视频大小以宽度还是高度为基准
            const flag = resolutionW / resolutionH > scale;
            if (flag) {
                this.videoStyle = { width };
            } else {
                this.videoStyle = { height };
            }
        }
    };
    voiceRecognition = () => {
        this.props.dispatch({
            type: 'subtitles/voiceRecognition',
        });
    };
    onCloseShareDownload = (reload = false) => {
        this.setState({ shareDownload: false });
        if (reload) {
            this.onLoad();
        }
    }

    render() {
        const { props, state } = this;
        const { RedirectIndex, openOption, onSave, onGenerateVideo, onClickQuite, onCloseModal, onQuite } = this;
        setTitle('模板编辑');
        const { isLoading, dataList, transverse, url, videoBase64 } = props.subtitles;
        this.removeListenter();
        const uuid = state.uuid;
        this.getVideoStyle();
        const paddingTop = document.body.clientWidth < 1920
            ? styles.paddingTop16
            : styles.paddingTop72;
        return (
            <div className={styles.detailBody}>
                {isLoading &&
                    <Loading title={isLoading === true ? '加载中' : isLoading} />}
                <Top
                    RedirectIndex={RedirectIndex}
                    openOption={openOption}
                    onSave={onSave}
                    onGenerateVideo={onGenerateVideo}
                    onClickQuite={onClickQuite}
                    onCloseModal={onCloseModal}
                    onQuite={onQuite}
                    openCloseModal={state.openCloseModal}
                    saving={state.saving}
                    isLoading={isLoading}>
                </Top>
                <div className={styles.headerFill} />
                <div className={styles.contentWrap}>
                    <div className={styles.leftSide}>
                        <div className={`${styles.list} ${!this.props.subtitles.transverse
                            ? styles.activeTransverse
                            : ''}`}
                            onClick={() => this.changeTransverse(false)}>
                            <div className={styles.ver} />
                            <div className={styles.size}>9:16</div>
                        </div>
                        <div className={`${styles.list} ${
                            this.props.subtitles.transverse
                                ? styles.activeTransverse
                                : ''
                            } `}
                            onClick={() => this.changeTransverse(true)}>
                            <div className={styles.hoz} />
                            <div className={styles.size}>16:9</div>
                        </div>
                        <Advert editorType={TYPE_EDITOR.subtitlesEditor.editor} />
                    </div>
                    <div className={styles.rightBox}>
                        <div className={styles.rowBody}>
                            <div id={'previewBody'}
                                className={`${styles.previewBody} ${paddingTop} `}>
                                <div className={styles.container}>
                                    <div className={styles.content}>
                                        <WorkSpace uuid={uuid} active={!state.playing}>
                                            <div className={styles.videoContainer}>
                                                <video
                                                    style={this.videoStyle}
                                                    ref={this.video}
                                                >
                                                    <source
                                                        key={videoBase64 || genUrl(url)}
                                                        src={videoBase64 || genUrl(url)}
                                                        type='video/mp4'>
                                                    </source>
                                                    Your browser does not support the audio element.
                                                </video>
                                            </div>
                                        </WorkSpace>
                                    </div>
                                </div>
                            </div>

                            {Object.values(dataList).length > 0 &&
                                <RightSide key={uuid} ref={this.right} event={this.event}
                                    overSaving={this.overSaving}
                                    uuid={uuid} playing={state.playing} />}
                            {state.openOptions &&
                                <div onClick={this.closeOption} className='shade' />
                            }
                            <CSSTransition in={state.openOptions} timeout={300} classNames='slider'
                                unmountOnExit>
                                <VideoSet onClose={this.closeOption} event={this.event}
                                    overSaving={this.overSaving} />
                            </CSSTransition>
                        </div>
                        <div className={styles.bottom}>
                            {this.video.current &&
                                <Substitles key={url} video={this.video.current} uuid={uuid} />}
                        </div>
                        <DownLoadGoogle />
                        <Modal visible={state.shareDownload}>
                            <ShareDownload videoId={props.subtitles.worksId}
                                typePage={TYPE_PAGE.download}
                                positionFrom={POS_FROM.editorSpace}
                                onClose={this.onCloseShareDownload} />
                        </Modal>
                        <Modal visible={state.openVideoStore} >
                            <VideoStore
                                onChange={this.onInsert}
                                onClose={this.onCloseVideoStroe}
                                defualtIndex={0}
                                only_list={[0]}
                            />
                        </Modal>
                    </div>
                </div>
            </div>
        );
    }
}

export default userEditor;
