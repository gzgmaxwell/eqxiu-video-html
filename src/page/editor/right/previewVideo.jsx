// @ts-nocheck

import React, { PureComponent } from "react";
import { connect } from "dva";
import { message as antdMessage } from "antd";
import styles from "./backgroundSet.less";
import { genMusicUrl, genVideoUrl } from "../../../util/file";
import VideoList from "../../editor/centre/videoList";
import {
    BLANK_VIDEO,
    CANVAS_TYPE,
    WORKSPACE_SIZE,
    WORKSPACE_Z_INDEX,
    WorkspaceVideoType
} from "../../../config/staticParams";
import Loading from "../../components/loading";
import ResizeImg from "../centre/element/img";
import ResizeVideo from "../centre/element/video";
import ResizeText from "../centre/element/text";
import { genUrl } from "../../../util/image";
import eventEmitter from "../../../services/EventListener";
import { getVoiceFormEditor } from "../../../util/data";
import { ANIMATION_TYPES } from "../../../dataBase/animations";

function Element({ type, ...props }) {
    if ([CANVAS_TYPE.text, CANVAS_TYPE.artFont, CANVAS_TYPE.animateFont].includes(type)) {
        return <ResizeText type={type} {...props} />;
    } else if ([CANVAS_TYPE.img, CANVAS_TYPE.animateImg].includes(type)) {
        return <ResizeImg {...props} />;
    } else if (WorkspaceVideoType.includes(type)) {
        return <ResizeVideo {...props} type={type} />;
    }
    console.log("错误素材", type, props);
    return null;
}

let scale = 1.8;

@connect(({ workspace, editor, canvas }) => ({
    workspace,
    editor,
    canvas
}))
class PreviewVideo extends PureComponent {
    constructor(props) {
        super(props);
        const {
            simpleScale = false,
            partyIndex = null,
            workspace,
            editor: { parties, transverse }
        } = props;
        const { isAll } = getVoiceFormEditor(props.editor);
        this.body = React.createRef();
        this.videoList = React.createRef();
        this.canvas = React.createRef();
        this.background = React.createRef();
        this.voiceTime = isAll ? null : 0; // 旁白起始时间
        this.voiceMuted = null; // 旁白是否静音
        this.playSpeed = 1; // 播放速度
        this.loadList = 0; // 需要加载的
        this.loadBlank = null;
        this.paused = false; // 暂停状态，以避免自动播放影响暂停
        this.videoNone();
        scale = transverse ? (simpleScale ? 1 : 1.8) : 1;
        const dataList =
            partyIndex === null
                ? workspace.dataList
                : (parties[partyIndex] || {}).elementList || [];
        this.state = {
            dataList,
            hover: false,
            videoList: [],
            drawCanvas: true,
            loadedCount: 0, // 加载完毕的媒体文件数量
            onLoadGif: 0,
            currentTime: 0,
            videoMessage: "视频加载中..."
        };
        this.jumped = {};
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        const newState = {};
        const {
            canvas: { loadingObj },
            workspace: { uuid, dataList }
        } = nextProps;
        const isLoading = loadingObj[uuid] === true;
        if (isLoading !== prevState.drawCanvas) {
            newState.drawCanvas = isLoading;
            if (isLoading) {
                newState.videoMessage = "图层生成中";
            }
        }
        if (dataList.some(v => CANVAS_TYPE.gif === v.type && !v.previewUrl)) {
            newState.onLoadGif = true;
            newState.videoMessage = "gif处理中";
        }
        return newState;
    }

    componentDidMount() {
        const {
            props: { onRef = null, tipsHide = false },
            state: { dataList }
        } = this;
        eventEmitter.emit("saveWorkData"); // 预览时保存文字
        if (typeof onRef === "function") {
            onRef(this);
        }
        const showTips = dataList.some(v => v.materialList && v.materialList.length > 0);
        if (showTips && !tipsHide) {
            antdMessage.info("特效字、特效图、正版视频的修改会在生成后生效");
        }
    }

    componentDidUpdate() {
        this.playSpeed = this.props.editor.playSpeed;
        if (this.paused === false) {
            this.autoPlay();
        }
        if (typeof this.props.onRef === "function") {
            this.props.onRef(this);
        }
    }

    componentWillUnmount() {
        this.loadBlank = null;
        this.cancelRendering();
    }

    onTimeUpdate = e => {
        if (typeof e.currentTime === "number") {
            this.setState({ currentTime: e.currentTime });
        }
    };
    onError = e => {
        // const { target } = e;
        // target.src = `${target.src}?v=${Math.random()}`;
        // const pr = new Promise((resolve) => {
        //     target.onError = resolve();
        // }).then(() => {
        this.setState({ videoMessage: "视频加载失败，请检查您的网络或者重试。" });
        // });
    };
    /**
     * 视频元素读取完毕的处理方式
     * @param {Object} e
     * @param {{ muted:boolean, type:Number, renderSetting: object, loop:boolean }} data
     */
    onLoad = (e, { muted = true, type = 0, renderSetting: { startTime, endTime } = {}, loop }) => {
        if (this.loadList <= this.state.loadedCount) return;
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
                    CANVAS_TYPE.gif
                ].includes(type),
                playbackRate: this.playSpeed,
                loop: [CANVAS_TYPE.gif, CANVAS_TYPE.ornament].includes(type)
                    ? loop
                    : [CANVAS_TYPE.dynamicBg, CANVAS_TYPE.clad].includes(type),
                rangeTime: isForever || [startTime, endTime], // 元素进入/退出的时间
                main: 0 // 参数 0：取最长元素的时间作为播放时间；非0：以参考值作为播放时间，定义的播放时间大于最大片段时间
            }
        ];
        this.setState({
            videoList: json,
            loadedCount: this.state.loadedCount + 1
        });
    };
    closeTips = () => {
        this.setState({ showTips: false });
    };
    /**
     * 加载音频数据
     * @param e 事件对象
     * @param item
     */
    onLoadAudio = (e, item) => {
        const { volume = 100, loop = true } = item;
        if (this.loadList <= this.state.loadedCount) return;
        const {
            editor: { parties, nowIndex: pIndex },
            partyIndex = null
        } = this.props;
        // 时间
        const nowIndex = partyIndex === null ? pIndex : partyIndex;
        const dataList = (parties[nowIndex] && parties[nowIndex].elementList) || [{}];
        const { bgmVolume: partyVolume = 100 } =
            (parties[nowIndex] && parties[nowIndex].renderSetting) || {};
        const time =
            this.voiceTime !== null
                ? this.voiceTime
                : parties.reduce((prev, cur, index) => {
                      if (index < nowIndex && cur.renderSetting) {
                          const {
                              segmentPartyDuration,
                              concatSet: { concatType = "none", duration = 800 } = {}
                          } = cur.renderSetting;
                          const concatTime = concatType === "none" ? 0 : duration / 1000;
                          const oneDuration = segmentPartyDuration - concatTime;
                          return prev + oneDuration;
                      }
                      return prev;
                  }, 0);
        // 是否静音
        const muted = this.voiceMuted
            ? this.voiceMuted
            : dataList.some(
                  value =>
                      [CANVAS_TYPE.userVideo, CANVAS_TYPE.userVideoNew].includes(value.type) &&
                      !value.muted
              );
        const videoList = [
            ...this.state.videoList,
            {
                obj: e.target,
                muted: false,
                volume: (volume * partyVolume) / 10000,
                time: [time, 90],
                rangeTime: [0, 9999], // 元素进入/退出的时间
                main: 0, // 参数 0：取最长元素的时间作为播放时间；非0：以参考值作为播放时间，定义的播放时间大于最大片段时间
                playbackRate: 1,
                loop
            }
        ];
        this.setState({
            videoList,
            loadedCount: this.state.loadedCount + 1
        });
    };
    // 播放
    play = e => {
        if (this.videoList.current) {
            this.videoList.current.play();
            this.setState({
                paused: false,
                animationState: "running"
            });
            if (this.props.currentTime) {
                this.changeCurrentTime(this.props.currentTime);
            }
        }
    };
    pause = e => {
        if (this.videoList.current) {
            this.paused = true;
            this.videoList.current.pause();
            this.setState({
                paused: true,
                animationState: "paused"
            });
        }
    };
    changeCurrentTime = currentTime => {
        if (this.videoList.current) {
            this.videoList.current.changeCurrentTime(currentTime);
        }
    };
    dontAny = e => {
        e.stopPropagation();
        e.preventDefault();
    };
    /**
     * 则添加一个空白视频作为总控制视频
     */
    videoNone = () => {
        const {
            props: {
                editor: { parties, nowIndex },
                partyIndex = null
            }
        } = this;
        if (this.loadBlank) return;
        const { segmentPartyDuration = 4 } =
            (partyIndex === null ? parties[nowIndex] : parties[partyIndex] || {}).renderSetting ||
            {};
        const video = document.createElement("video");
        // 因为chrome 有可能有ERR_CACHE_OPERATION_NOT_SUPPORTED BUG 所以先加个随机数防止缓存
        video.src = `${BLANK_VIDEO}?ver=${Math.random()}`;
        video.style.display = "none";
        video.preload = "true";
        this.loadBlank = video;
        video.oncanplay = () => {
            video.oncanplay = null;
            const json = [
                ...this.state.videoList,
                {
                    obj: video,
                    playbackRate: 1,
                    rangeTime: [0, 999], // 元素进入/退出的时间
                    main: segmentPartyDuration // 参数 0：取最长元素的时间作为播放时间；非0：以参考值作为播放时间，定义的播放时间大于最大片段时间
                }
            ];
            this.setState({
                videoList: json,
                loadedCount: this.state.loadedCount + 1
            });
        };
        video.onerror = this.onError;
    };
    autoPlay = () => {
        if (
            this.loadList <= this.state.loadedCount &&
            !this.state.drawCanvas &&
            this.props.autoPlay !== false &&
            !this.videoList.current.state.playing
        ) {
            this.play();
        }
    };
    cancelRendering = () => {
        cancelAnimationFrame(this.interval);
        this.interval = null;
    };
    handleStroke = playing => {
        this.paused = !playing;
    };
    // 快进快退
    jump = () => {
        const { dataList } = this.state;
        dataList.forEach(item => {
            if (item.animate) {
                this.jumped[item.uuid] = true;
            }
        });
    };
    setAnimationState = animationState => {
        this.setState({ animationState });
    };

    getAnimateData = (item, currentTime) => {
        const { animate = {}, renderSetting: { startTime = 0, endTime } = {} } = item;
        let animationName = undefined;
        let animationDuration = 0;
        let animationIteration = 1;
        const inAnimate = animate[ANIMATION_TYPES.ENTRANCE] || {};
        const stayAnimate = animate[ANIMATION_TYPES.STAY] || {};
        const outAnimate = animate[ANIMATION_TYPES.EXITS] || {};
        if (
            inAnimate.animationName &&
            currentTime > startTime &&
            currentTime < startTime + inAnimate.animationDuration / 1000
        ) {
            // 入场动画存在，并且在入场动画时间内
            animationName = inAnimate.animationName;
            animationDuration = inAnimate.animationDuration;
            animationIteration = inAnimate.animationIteration;
        }
        if (
            stayAnimate.animationName &&
            currentTime >
                startTime + ((inAnimate.animationDuration || 0) + stayAnimate.delay) / 1000 &&
            currentTime <
                startTime +
                    ((inAnimate.animationDuration || 0) +
                        stayAnimate.delay +
                        stayAnimate.animationDuration) /
                        1000
        ) {
            // 强调动画存在，并且在强调动画时间内
            animationName = stayAnimate.animationName;
            animationDuration = stayAnimate.animationDuration;
            animationIteration = stayAnimate.animationIteration;
        }
        if (
            outAnimate.animationName &&
            currentTime > endTime - outAnimate.animationDuration / 1000 &&
            currentTime < endTime
        ) {
            // 出场动画存在，并且在出场动画时间内
            animationName = outAnimate.animationName;
            animationDuration = outAnimate.animationDuration;
            animationIteration = outAnimate.animationIteration;
        }
        return {
            animationName,
            animationDuration,
            animationIteration
        };
    };

    render() {
        const {
            state: {
                loadedCount,
                drawCanvas,
                videoMessage,
                currentTime,
                dataList,
                paused,
                animationState,
                ...state
            },
            props: { ...props }
        } = this;
        const {
            editor: { transverse, music, bgmLoop },
            mutedAll = false
        } = props;
        const { voice, voiceLoop } = getVoiceFormEditor(props.editor);
        // 获取按钮
        const bodyStyle = {
            // 外框的属性
            width: transverse ? WORKSPACE_SIZE.l : WORKSPACE_SIZE.s,
            height: transverse ? WORKSPACE_SIZE.s : WORKSPACE_SIZE.l
        };
        const clearDefault = {
            // 清除默认事件
            onDrag: this.dontAny,
            draggable: false
        };
        // 音频时间加强
        let mediaCount = 1;
        if (music.url) this.loadList = mediaCount += 1;
        if (voice.url) this.loadList = mediaCount += 1;
        return (
            <div
                className={`${styles.video__content}`}
                ref={this.body}
                onClick={paused ? this.play : this.pause}
                id='videoPreview'
                onMouseEnter={() => this.setState({ hover: true })}
                onMouseLeave={() => this.setState({ hover: false })}
                style={{
                    width: bodyStyle.width * scale,
                    height: bodyStyle.height * scale
                }}>
                {/* {showTips && tipsText && <Message onClose={closeTips}>{tipsText}</Message>} */}
                <div
                    style={{
                        zIndex: 1,
                        ...bodyStyle,
                        transform: `scale(${scale})`,
                        transformOrigin: "left top"
                    }}>
                    {dataList.map((item, index) => {
                        const params = {
                            ...item,
                            width: item.width,
                            height: item.height,
                            rotate: item.rotate || 0,
                            top: item.top || 0,
                            left: item.left || 0,
                            zIndex: 0 // 间隔5
                        };
                        const { renderSetting: { startTime = 0, endTime = 999 } = {} } = item;
                        if (item.animate) {
                            //动画字
                            if (
                                currentTime <= 0 ||
                                (this.jumped[item.uuid] &&
                                    currentTime >= startTime &&
                                    currentTime < endTime)
                            ) {
                                // 重新加载 1、轮播 2、跳帧
                                this.jumped[item.uuid] = false;
                                return null;
                            }
                        }
                        if (item.visibility === "hidden") {
                            return null;
                        }
                        if (WorkspaceVideoType.includes(item.type)) {
                            this.loadList = mediaCount += 1;
                            const { borderWidth = 0, rotate = 0, opacity = 1, ...paramsData } =
                                params || item;
                            return (
                                <video
                                    {...clearDefault}
                                    key={`${index}-ele`}
                                    onCanPlay={e => this.onLoad(e, item)}
                                    onError={this.onError}
                                    preload='auto'
                                    // crossOrigin="Anonymous"
                                    src={genVideoUrl(item.url || item.previewUrl)}
                                    id={`video-random-${index}`}
                                    muted={mutedAll}
                                    style={{
                                        position: "absolute",
                                        ...paramsData,
                                        borderWidth,
                                        zIndex: ~~index * 5 + 20,
                                        opacity,
                                        // display: 'none',
                                        transform: `rotateZ(${rotate}deg)`
                                    }}
                                />
                            );
                        } else if (!item.type || CANVAS_TYPE.background === item.type) {
                            const backgroundPicProps = {
                                // 背景图的props
                                src: genUrl(
                                    item.backgroundImg,
                                    `${bodyStyle.width}:${bodyStyle.height}:png:3`
                                ),
                                style: { opacity: item.videoBackgroundPicOpacity }
                            };
                            return (
                                <div
                                    ref={this.background}
                                    key='background'
                                    style={{ backgroundColor: item.backgroundColor }}
                                    className={styles.background}>
                                    {item.backgroundImg ? (
                                        <img
                                            {...clearDefault}
                                            {...backgroundPicProps}
                                            className={styles.videoBackgroundPic}
                                        />
                                    ) : (
                                        ""
                                    )}
                                </div>
                            );
                        }
                        if (currentTime < startTime || currentTime > endTime) {
                            return null;
                        }
                        const resizeprops = {
                            // 缩放组件的props
                            active: false,
                            paramsData: {
                                width: item.width,
                                height: item.height,
                                rotate: item.rotate || 0,
                                top: item.top || 0,
                                left: item.left || 0,
                                zIndex: WORKSPACE_Z_INDEX + index * 5 // 间隔5
                            },
                            limit: {
                                width: [10],
                                height: [10]
                            },
                            fixedaspectratio: item.resolutionW / item.resolutionH
                        };
                        const itemProps = {
                            resizeprops,
                            elementprops: clearDefault,
                            ...item,
                            ...this.getAnimateData(item, currentTime),
                            animationState,
                            index
                        };
                        return <Element key={`${item.uuid}-ele`} {...itemProps} />;
                    })}
                </div>
                {(mediaCount > loadedCount || drawCanvas) && (
                    <Loading title={videoMessage} onClick={e => e.stopPropagation()} />
                )}
                {voice.url && ( // 旁白
                    <video
                        src={genMusicUrl(voice.url)}
                        muted={mutedAll}
                        onCanPlay={e =>
                            this.onLoadAudio(e, {
                                ...voice,
                                loop: voiceLoop
                            })
                        }
                        preload='auto'
                        onError={this.onError}
                        className={styles.audio}
                    />
                )}
                {music.url && ( // 背景音乐
                    <video
                        src={genMusicUrl(music.url)}
                        muted={mutedAll}
                        onCanPlay={e =>
                            this.onLoadAudio(e, {
                                ...music,
                                loop: bgmLoop
                            })
                        }
                        preload='auto'
                        onError={this.onError}
                        className={styles.audio}
                    />
                )}

                {
                    <VideoList
                        videoList={this.state.videoList}
                        ref={this.videoList}
                        onTimeUpdate={this.onTimeUpdate}
                        visible={state.hover}
                        stroke={this.handleStroke}
                        setAnimationState={this.setAnimationState}
                        jump={this.jump}
                    />
                }
            </div>
        );
    }
}

export default PreviewVideo;
