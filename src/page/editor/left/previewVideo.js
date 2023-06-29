import React, { PureComponent } from 'react';
import { connect } from 'dva';
import styles from '../right/backgroundSet.less';
import { genMusicUrl, genVideoUrl } from '../../../util/file';
import VideoList from '../../editor/centre/videoList';
import {
    BLANK_VIDEO,
    CANVAS_TYPE, LAYER_TYPE,
    WORKSPACE_SIZE,
    WorkspaceVideoType,
} from '../../../config/staticParams';
import Loading from '../../components/loading';
import eventEmitter from '../../../services/EventListener';
import { getVoiceFormEditor } from '../../../util/data';

@connect(({ workspace, editor, canvas, headAndTail }) => ({
    workspace,
    editor,
    canvas,
    headAndTail,
}))
class PreviewVideo extends PureComponent {
    constructor(props) {
        super(props);
        this.body = React.createRef();
        this.videoList = React.createRef();
        this.canvas = React.createRef();
        this.voiceTime = null; // 旁白起始时间
        this.voiceMuted = null; // 旁白是否静音
        this.playSpeed = 1; // 播放速度
        this.loadList = 1; // 需要加载的
        this.loadBlank = false;
        this.videoGroup = React.createRef();
        this.paused = false; // 暂停状态，以避免自动播放影响暂停
        this.videoNone();
    }

    state = {
        hover: false,
        videoList: [],
        drawCanvas: true,
        loadedCount: 0, // 加载完毕的媒体文件数量
        onLoadGif: 0,
        videoMessage: '视频加载中...',
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        const newState = {};
        const { canvas: { loadingObj }, workspace: { uuid, dataList } } = nextProps;
        const isLoading = loadingObj[uuid] === true;
        if (isLoading !== prevState.drawCanvas) {
            newState.drawCanvas = isLoading;
            if (isLoading) {
                newState.videoMessage = '图层生成中';
            }
        }
        if (dataList.some(v => CANVAS_TYPE.gif === v.type && !v.previewUrl)) {
            newState.onLoadGif = true;
            newState.videoMessage = 'gif处理中';
        }
        return newState;
    }


    componentDidMount() {
        eventEmitter.emit('saveWorkData'); // 预览时保存文字
        if (typeof this.props.onRef === 'function') {
            this.props.onRef(this);
        }
        // 处理预览数据
    }

    componentDidUpdate() {
        this.playSpeed = this.props.editor.playSpeed;
        if (this.paused === false) {
            this.autoPlay();
        }
        if (typeof this.props.onRef === 'function') {
            this.props.onRef(this);
        }
    }

    componentDidCatch(error, info) {
        // You can also log the error to an error reporting service
        console.log(error, info);
    }

    componentWillUnmount() {
        this.loadBlank = null;
        this.cancelRendering();
    }

    autoPlay = () => {
        if ((this.loadList <= this.state.loadedCount) && !this.state.drawCanvas &&
            this.props.autoPlay !== false && !this.videoList.current.state.playing) {
            this.play();
        }
    };
    /**
     * 没有视频 则添加一个空白视频
     */
    videoNone = () => {
        const { props: { editor: { parties, nowIndex }, partyIndex = null } } = this;
        if (this.loadBlank) return;
        const { segmentPartyDuration } = (partyIndex === null
                                          ? parties[nowIndex]
                                          : parties[partyIndex]
                                              || {}).renderSetting || {};
        const video = document.createElement('video');
        video.src = `${BLANK_VIDEO}?ver=${Math.random()}`; // 防止chrome 缓存的bug
        video.style.display = 'none';
        // video.preload = 'true';
        this.loadBlank = video;
        video.oncanplay = () => {
            video.oncanplay = null;
            const json = [
                ...this.state.videoList,
                {
                    obj: video,
                    playbackRate: 1,
                    rangeTime: [0, 999], // 元素进入/退出的时间
                    main: segmentPartyDuration, // 参数 0：取最长元素的时间作为播放时间；非0：以参考值作为播放时间，定义的播放时间大于最大片段时间
                },
            ];
            this.setState({
                videoList: json,
                loadedCount: this.state.loadedCount + 1,
            });
        };
        video.onerror = this.onError;
    };
    // 播放
    play = (e) => {
        if (this.videoList.current) {
            this.videoList.current.play();
            if (this.props.currentTime) {
                this.changeCurrentTime(this.props.currentTime);
            }
        }
    };
    pause = (e) => {
        if (this.videoList.current) {
            this.paused = true;
            this.videoList.current.pause();
        }
    };
    addEventListener = (type, callback, option = {}) => {
        this.videoList.current.MVideo.addEventListener(type, callback, option);
    };
    changeCurrentTime = (currentTime) => {
        if (this.videoList.current) {
            this.videoList.current.changeCurrentTime(currentTime);
        }
    };
    dontAny = (e) => {
        e.stopPropagation();
        e.preventDefault();
    };
    onError = (e) => {
        this.setState({ videoMessage: '视频加载失败，请检查您的网络或者重试。' });
    };
    /**
     * 视频元素读取完毕的处理方式
     * @param e
     * @param muted
     * @param type
     * @param startTime
     * @param endTime
     */
    onLoad = (e, { muted = true, type = 0, renderSetting: { startTime, endTime } = {}, loop }) => {
        if ((this.loadList <= this.state.loadedCount)) return;
        const isForever = [CANVAS_TYPE.dynamicBg, CANVAS_TYPE.clad].includes(type)
                          ? [0, 999]
                          : null;
        const json = [
            ...this.state.videoList,
            {
                obj: e.target,
                muted, // muted=false 表示有声音
                visible: [
                    CANVAS_TYPE.spacialImg,
                    CANVAS_TYPE.specialText,
                    CANVAS_TYPE.ornament,
                    CANVAS_TYPE.dynamicBg,
                    CANVAS_TYPE.clad,
                    CANVAS_TYPE.gif].includes(type),
                playbackRate: this.playSpeed,
                loop: CANVAS_TYPE.gif === type ? loop : [
                    CANVAS_TYPE.ornament,
                    CANVAS_TYPE.dynamicBg,
                    CANVAS_TYPE.clad].includes(type),
                rangeTime: isForever || [startTime, endTime], // 元素进入/退出的时间
                main: 0, // 参数 0：取最长元素的时间作为播放时间；非0：以参考值作为播放时间，定义的播放时间大于最大片段时间
            },
        ];
        this.setState({
            videoList: json,
            loadedCount: this.state.loadedCount + 1,
        });
    };
    /**
     * 加载音频数据
     * @param e 事件对象
     * @param volume 音量
     * @param item
     */
    onLoadAudio = (e, { volume = 100 }, noTime = false) => {
        if ((this.loadList <= this.state.loadedCount)) return;
        const { editor: { parties, nowIndex: pIndex }, partyIndex = null } = this.props;
        // 时间
        const nowIndex = partyIndex === null ? pIndex : partyIndex;
        const dataList = parties[nowIndex] && parties[nowIndex].elementList || [{}];
        const { bgmVolume: partyVolume = 100 } = parties[nowIndex] &&
        parties[nowIndex].renderSetting || {};
        const time = noTime ? 0 : (this.voiceTime ? this.voiceTime : parties.reduce(
            (prev, cur, index) => {
                if (index < nowIndex) {
                    return prev - index + (cur.videoDuration / cur.playSpeed); // 以前的视频要算上播放速度
                } else {
                    return prev;
                }
            }, 0));
        // 是否静音
        const muted = this.voiceMuted ? this.voiceMuted : dataList.some(
            value => (value.type === CANVAS_TYPE.userVideo || value.type ===
                CANVAS_TYPE.userVideoNew) && !value.muted);
        const videoList = [
            ...this.state.videoList,
            {
                obj: e.target,
                muted: false,
                volume: volume * partyVolume / 10000,
                time: [time, 90],
                rangeTime: [0, 9999], // 元素进入/退出的时间
                main: 0, // 参数 0：取最长元素的时间作为播放时间；非0：以参考值作为播放时间，定义的播放时间大于最大片段时间
                playbackRate: 1,
                loop: true,
            },
        ];
        this.setState({
            videoList,
            loadedCount: this.state.loadedCount + 1,
        });
    };
    cancelRendering = () => {
        cancelAnimationFrame(this.interval);
        this.interval = null;
    };
    getParty = () => {
        const { editor: { parties }, headAndTail: { head, tail }, workspace: { uuid: wuuid }, partyIndex = null } = this.props;
        const party = partyIndex === 'tail' ? tail : (partyIndex < 0
                                                      ? head
                                                      : parties[partyIndex]) || {};
        return party || {};
    };
    handleStroke = (stroke = true) => {
        if (stroke) {
            this.paused = false;
            const { editor: { parties, transverse }, headAndTail: { head, tail }, workspace: { uuid: wuuid }, partyIndex = null } = this.props;
            const party = this.getParty();
            const partyUUID = partyIndex === null ? wuuid : party.uuid;
            const outWidth = transverse ? WORKSPACE_SIZE.l : WORKSPACE_SIZE.s;
            const outHeight = transverse ? WORKSPACE_SIZE.s : WORKSPACE_SIZE.l;
            if (!this.canvas.current) {
                return;
            }
            const proCanvas = document.createElement('canvas');
            const ctx = proCanvas.getContext('2d', { alpha: false });
            proCanvas.width = outWidth;
            proCanvas.height = outHeight;
            const renderVideo = (time) => {
                if (!this.interval) return;
                const { canvas: { canvasObj }, visible } = this.props;
                const currentData = canvasObj[partyUUID];
                if (!visible) {
                    cancelAnimationFrame(this.interval);
                    return;
                }
                if (!currentData || !this.canvas.current) {
                    this.interval = requestAnimationFrame(renderVideo);
                    return;
                }
                try {
                    let videoIndex = -1;
                    currentData.forEach((item) => {
                        const { type, canvas, uuid } = item;
                        const values = party.elementList.find(v => v.uuid === uuid);
                        if (type !== LAYER_TYPE.img && this.videoGroup.current &&
                            values.visibility !== 'hidden') { // 视频素材
                            videoIndex += 1;
                            const video = this.videoGroup.current.getElementsByTagName(
                                'video')[videoIndex];
                            if (!video || video.style.visibility === 'hidden') {
                                return;
                            }
                            if (canvas) {
                                ctx.drawImage(canvas, 0, 0, outWidth, outHeight);
                            }
                            const { width, height, top, left, rotate, borderWidth = 0, opacity = 1 } = values;
                            const rectCenterPointX = left + width / 2;
                            const rectCenterPointY = top + height / 2;
                            ctx.save();
                            ctx.translate(rectCenterPointX, rectCenterPointY);
                            ctx.rotate(rotate * Math.PI / 180);
                            ctx.translate(-rectCenterPointX, -rectCenterPointY);
                            ctx.globalAlpha = opacity;
                            ctx.drawImage(video, left + borderWidth, top + borderWidth,
                                width - 2 * borderWidth, height - 2 * borderWidth);
                            ctx.restore();
                            return;
                        }
                        if (type === LAYER_TYPE.img && canvas) {
                            const { renderSetting: { endTime, startTime, customDuration } = {} } = values;
                            const currentTime = this.videoList.current &&
                                this.videoList.current.state.nowTime;
                            if (currentTime < endTime && currentTime > startTime) {
                                ctx.drawImage(canvas, 0, 0, outWidth, outHeight);
                            }
                        }
                    });
                    this.canvas.current.getContext('2d', { alpha: false })
                        .drawImage(proCanvas, 0, 0, outWidth, outHeight);
                    this.interval = requestAnimationFrame(renderVideo);
                } catch (error) {
                    this.cancelRendering();
                    console.error(error);
                }
            };
            if (!this.interval) {
                this.interval = requestAnimationFrame(renderVideo);
            }
        } else {
            this.paused = true;
            this.cancelRendering();
        }
    };

    render() {
        const {
            state: { loadedCount, drawCanvas, videoMessage, ...state },
            props,
        }
            = this;
        const {
            workspace, editor: { transverse, music },
            partyIndex = null, mutedAll = false,
        } = props;
        // 获取按钮
        const { voice, isAll } = getVoiceFormEditor(this.props.editor);
        const bodyStyle = { // 外框的属性
            width: transverse ? WORKSPACE_SIZE.l : WORKSPACE_SIZE.s,
            height: transverse ? WORKSPACE_SIZE.s : WORKSPACE_SIZE.l,
        };
        const clearDefault = { // 清除默认事件
            onDrag: this.dontAny,
            draggable: false,
        };
        const party = this.getParty();
        const dataList = partyIndex === null ? workspace.dataList : party.elementList || [];
        // 音频时间加强
        let mediaCount = 1;
        if (music.url) mediaCount += 1;
        if (voice.url) mediaCount += 1;
        return (
            <div className={`${styles.video__content}`} ref={this.body} onClick={this.play}
                 id='videoPreview'
                 onMouseEnter={() => this.setState({ hover: true })}
                 onMouseLeave={() => this.setState({ hover: false })}
                 style={bodyStyle}>
                <div style={{ zIndex: 1, ...bodyStyle }}>
                    <canvas ref={this.canvas} className={styles.videoBackgroundPic}
                            width={bodyStyle.width} height={bodyStyle.height}
                            crossOrigin="Anonymous"
                            style={{ display: drawCanvas ? 'none' : 'block' }}>
                        您的浏览器不支持最新网页标准，请升级或更换浏览器。
                    </canvas>
                    <div className={styles.videoGroup} ref={this.videoGroup}>
                        {dataList.map((item, index) => {
                            const params = {
                                ...item,
                                width: item.width,
                                height: item.height,
                                rotate: item.rotate || 0,
                                top: item.top || 0,
                                left: item.left || 0,
                                zIndex: 0, // 间隔5
                            };
                            if (WorkspaceVideoType.includes(item.type) && item.visibility !==
                                'hidden') {
                                this.loadList = mediaCount += 1;
                                const { borderWidth = 0, rotate = 0, opacity = 1, ...paramsData } = params ||
                                item;
                                return (
                                    <video
                                        {...clearDefault}
                                        ref={this.video}
                                        key={`${index}-ele`}
                                        onCanPlay={(e) => this.onLoad(e, item)}
                                        onError={this.onError}
                                        preload='true'
                                        crossOrigin='Anonymous'
                                        src={genVideoUrl(item.previewUrl)}
                                        id={`video-random-${index}`}
                                        muted={mutedAll}
                                        style={{
                                            position: 'absolute',
                                            borderStyle: 'solid',
                                            ...paramsData,
                                            borderWidth,
                                            zIndex: ~~index * 5 + 20,
                                            opacity,
                                            // display: 'none',
                                            transform: `rotateZ(${rotate}deg)`,
                                        }}
                                    />
                                );
                            }
                            return null;
                        })}
                    </div>
                </div>
                {(mediaCount > loadedCount || drawCanvas) &&
                <Loading title={videoMessage}
                         onClick={(e) => e.stopPropagation()}/>}
                {voice.url && // 旁白
                <video src={genMusicUrl(voice.url)}
                       crossOrigin='Anonymous'
                       muted={mutedAll}
                       onCanPlay={(e) => this.onLoadAudio(e, voice, !isAll)}
                       preload='true'
                       onError={this.onError}
                       className={styles.audio}/>}
                {music.url && // 背景音乐
                <video src={genMusicUrl(music.url)}
                       crossOrigin='Anonymous'
                       muted={mutedAll}
                       onCanPlay={(e) => this.onLoadAudio(e, music)}
                       preload='true'
                       onError={this.onError}
                       className={styles.audio}/>}
                {<VideoList videoList={this.state.videoList} ref={this.videoList}
                            visible={state.hover} stroke={this.handleStroke}/>}
            </div>
        );
    }
}

export default PreviewVideo;
