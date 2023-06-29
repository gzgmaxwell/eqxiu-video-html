import React from "react";
import styles from "./index.less";
import Button from "../../../components/Button";
import { userTemplateCropN, getCutSource, getCropInfoById } from "../../../../api/videoStore";
import { message, Radio } from "antd";
import { genVideoUrl } from "../../../../util/file";
import { genNewResizeParams, genUrl } from "../../../../util/image";
import { findKey } from "../../../../util/object";
import { HASH_TYPE, LIMIT_VIDEO_DURATION } from "../../../../config/staticParams";
import { connect } from "dva";
import Icon from "../../../components/Icon";
import { delay } from "../../../../util/delayLoad";
import Loading from "../../../components/loading";
import { TYPE_RATIO, videoRatioObj } from "../../../../config/staticParams/goodsParams";
import { VideoClicp, VideoClip } from "./videoClip";
import ScaleMark from "../../../components/scaleMark/scaleMark";
import { CSSTransition } from "react-transition-group";
import {
    bubbleSort,
    duplicateRemoval,
    effectiveSum,
    getArrMaxOrMin,
    getArrSum,
    getMaxIndex,
    getNewArr,
    handleAddMaxTime,
    handleArrLeft,
    handleArrThenMinTime,
    handleStartPlayTimeArr,
    handleThenNum,
    time2fs
} from "../../../../util/util";
import RenderInBody from "./RenderInBody";

// 鼠标右键抬起事件
let upFunc = () => null;
const second = 4; // 每个刻度表示6秒
let barTotalWidth = 0; // 刻度总长

@connect(({ guideline, editor }) => ({
    guideline,
    transverse: editor.transverse
}))
class CutVideo extends React.PureComponent {
    constructor(props) {
        super(props);
        this.video = React.createRef();
        this.video2 = React.createRef() || null;
        this.bar = React.createRef();
        this.move = React.createRef();
        this.scaleBox = React.createRef();
        this.barLeft = 0;
        this.width = 0; // 视频在页面元素的宽度
        this.height = 0; // 视频在页面元素的高度
        this.videoErrorTime = 0; // 视频的原始高度
        this.originRate = 0; // 视频原始比例缩放
        this.angle = false; // 拖放角落上
        // 视频加载的promise
        this.videoReadyPromise = null;
        this.minTime = 1; // 裁剪最短时间
        this.startPointer = 0;
        this.endPointer = 0;
        this.timer = null;
        this.state = {
            id: "", // 裁剪视频id
            startTime: 0,
            endTime: 0,
            leftCenter: 0, // 进度条初始位置
            duration: 0, // 视频持续时间
            newDuration: 0,
            totalScale: 0, // 总刻度是多少
            oneWidth: 1, // 一个刻度的宽度
            playing: false, // 正在播放
            url: "", // 视频地址
            coverImg: "", // 视频封面
            videoScale: TYPE_RATIO.origin, // 自定义视频
            width: 0, // 裁剪框的宽度
            height: 0, // 裁剪框的高度
            left: 0,
            top: 0,
            dx: 0,
            dy: 0,
            sx: 0,
            sy: 0,
            videoSuffix: "",
            loading: false,
            angle: false, // 拖放角落上
            videoClip: []
        };
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        const newState = {};
        if (prevState.id !== nextProps.id) {
            newState.url = nextProps.url;
            newState.coverImg = nextProps.coverImg;
            newState.id = nextProps.id;
        }
        return newState;
    }

    componentDidMount() {
        if (this.bar.current) {
            this.barLeft = this.bar.current.getBoundingClientRect().x;
            barTotalWidth = this.bar.current.clientWidth;
            this.videoReadyPromise = new Promise(reslove => {
                this.video.current.addEventListener("loadedmetadata", reslove);
            });
        }
        document.addEventListener("keypress", this.keyPress);
    }

    componentDidUpdate() {
        if (this.bar.current) {
            this.barLeft = this.bar.current.getBoundingClientRect().x;
            barTotalWidth = this.bar.current.clientWidth;
        }
    }

    handleCutPosition = (e, time, on) => {
        const {
            props: { cutId },
            state
        } = this;
        if (cutId && on) {
            Promise.all([getCropInfoById(cutId), this.videoReadyPromise]).then(res => {
                const {
                    data: {
                        success,
                        obj: {
                            cutTimesSetting,
                            cutRatioType,
                            positionX,
                            positionY,
                            width,
                            height,
                            startTime,
                            endTime,
                            videoDuration
                        }
                    }
                } = res[0];
                const newPositionX = positionX ? positionX : 0;
                const newPositionY = positionY ? positionY : 0;
                const newWidth = width ? width : this.width;
                const newHeight = width ? height : this.height;
                const newStartTime = startTime ? startTime : 0;
                const defaultCutTimesSetting = [
                    {
                        startTime,
                        endTime
                    }
                ];
                if (success) {
                    const { videoHeight = 1, videoWidth = 2 } = this.video.current || {};
                    const defaultCutRatioType =
                        (newWidth / newHeight).toFixed(2) === (videoWidth / videoHeight).toFixed(2)
                            ? 1
                            : 2;
                    this.setState({
                        videoClip: cutTimesSetting
                            ? JSON.parse(cutTimesSetting)
                            : defaultCutTimesSetting,
                        videoScale: cutRatioType ? cutRatioType : defaultCutRatioType,
                        left: (newPositionX * this.width) / this.video.current.videoWidth,
                        top: (newPositionY * this.height) / this.video.current.videoHeight,
                        width: (newWidth * this.width) / this.video.current.videoWidth,
                        height: (newHeight * this.height) / this.video.current.videoHeight,
                        startTime: startTime ? startTime : 0,
                        endTime: endTime ? endTime : videoDuration
                    });
                    this.video.current.currentTime = newStartTime;
                    this.video2.current.currentTime = newStartTime;
                }
            });
        }
    };
    /**
     * 按下空格播放和暂停视频
     * @params {[type]} key=32 description 空格键值
     */
    keyPress = e => {
        if (e.keyCode === 32) {
            this.play();
        }
    };

    play = () => {
        if (this.state.playing) {
            this.pause();
        } else {
            this.startPlay();
        }
    };
    onTimeUpdate = () => {
        const {
            state,
            state: { leftCenter, duration }
        } = this;
        const currentTime = this.video.current.currentTime;
        const arr = duplicateRemoval(state.videoClip); // 得到片段播放的二维数组时间段[[1,3],[4,8]]
        const notPlay = handleArrLeft(arr, duration);
        if (notPlay.length) {
            for (let i = 0; i < notPlay.length; i++) {
                const isNotPlay = currentTime > notPlay[i][0] && currentTime < notPlay[i][1];
                if (isNotPlay) {
                    this.video.current.currentTime = notPlay[i][1] + 0.01;
                    this.video2.current.currentTime = notPlay[i][1] + 0.01;
                    this.setState({ leftCenter: notPlay[i][1] + 0.01 });
                }
            }
        }
        if (currentTime > arr[arr.length - 1][1] || currentTime >= duration) {
            this.video.current.currentTime = arr[0][0];
            this.video2.current.currentTime = arr[0][0];
            this.pause();
            this.setState({
                leftCenter: arr[0][0]
            });
        }
        this.setState({
            leftCenter: this.video.current.currentTime
        });
        // console.log('currentTime=>', this.video.current.currentTime);
    };

    startPlay = () => {
        if (this.video.current && this.video2.current) {
            const currentTime = this.video.current.currentTime;
            const arr = duplicateRemoval(this.state.videoClip); // 得到片段播放的二维数组时间段[[1,3],[4,8]]
            if (arr.length) {
                if (arr[arr.length - 1][1] < currentTime + 0.1) {
                    this.video.current.currentTime = arr[0][0];
                    this.video2.current.currentTime = arr[0][0];
                }
            }
            this.video.current.play();
            this.video.current.muted = true;
            this.video2.current.play();
            this.setState({
                playing: true
            });
        }
    };
    handleFinsh = async () => {
        const {
            state: { leftCenter, duration }
        } = this;
        await this.handleVideoCurrentTime(leftCenter);
        if (this.video.current) {
            this.video.current.play();
        }
        if (this.video.current) {
            this.video2.current.play();
        }
    };
    pause = e => {
        if (this.video.current) {
            this.video.current.pause();
        }
        if (this.video2.current) {
            this.video2.current.pause();
        }
        this.setState({
            playing: false
        });
    };
    onPause = () => {
        this.setState({ playing: false });
    };
    onLoadedData = () => {
        this.scale();
        this.videoDuration();
        this.width = this.video.current.clientWidth; // 视频在页面元素的宽度
        this.height = this.video.current.clientHeight;
        this.originRate = this.width / this.height;
        this.setState({
            left: 0,
            top: 0,
            width: this.width, // 视频的宽度
            height: this.height // 视频的高度
        });
    };
    onChange = (e, item) => {
        const { videoScale } = this.state;
        const isHoz = this.width > this.height; // 横竖版判断
        if (item.typeRatio === videoScale) {
        }
        if (item.typeRatio === TYPE_RATIO.origin) {
            this.originRate = this.width / this.height;
            this.setState({
                top: 0,
                left: 0,
                width: this.width,
                height: this.height
            });
        } else if (item.typeRatio === TYPE_RATIO.custom) {
            this.originRate = this.state.width / this.state.height;
            this.angle = true; // 拖放角落上
            this.setState({
                top: 0,
                left: 0,
                width: this.width,
                height: this.height
            });
        } else if (item.typeRatio === TYPE_RATIO.ver) {
            this.originRate = 9 / 16;
            if (isHoz) {
                this.setState({
                    top: 0,
                    left: (this.width - (this.height * 9) / 16) / 2,
                    width: (this.height * 9) / 16,
                    height: this.height
                });
            } else {
                this.setState({
                    top: 0,
                    left: 0,
                    width: this.width,
                    height: this.height
                });
            }
        } else if (item.typeRatio === TYPE_RATIO.hoz) {
            this.originRate = 16 / 9;
            if (isHoz) {
                this.setState({
                    top: 0,
                    left: 0,
                    width: this.width,
                    height: this.height
                });
            } else {
                this.setState({
                    top: (this.height - (this.width * 9) / 16) / 2,
                    left: 0,
                    width: this.width,
                    height: (this.width * 9) / 16
                });
            }
        } else if (item.typeRatio === TYPE_RATIO.isometric) {
            this.originRate = 1;
            if (isHoz) {
                this.setState({
                    top: 0,
                    left: (this.width - this.height) / 2,
                    width: this.height,
                    height: this.height
                });
            } else {
                this.setState({
                    top: (this.height - this.width) / 2,
                    left: 0,
                    width: this.width,
                    height: this.width
                });
            }
        }
        this.setState({
            videoScale: item.typeRatio
        });
    };
    onLoadedData2 = () => {
        this.scaleBoxPos = this.scaleBox.current.getBoundingClientRect();
    };
    scale = () => {
        const totalScale = this.video.current.duration / second;
        const oneWidth = barTotalWidth / totalScale;
        this.setState({
            totalScale: totalScale,
            oneWidth,
            leftEnd: totalScale * oneWidth,
            endTime: this.video.current.duration
        });
    };
    startMove = (e, type) => {
        const {
            state: { width, height }
        } = this;
        this.originRate = width / height;
        this.angle = false;
        this.barLeft = this.bar.current.getBoundingClientRect().x;
        this.onLoadedData2();
        e.stopPropagation();
        e.preventDefault();
        this.videoDuration(e, false);
        if (type === "center") {
            this.commonBind(this.moveBarCenter);
        } else if (type === "TL") {
            this.angle = true;
            this.commonBind(this.moveTL);
        } else if (type === "T") {
            this.commonBind(this.moveT);
        } else if (type === "TR") {
            this.angle = true;
            this.commonBind(this.moveTR);
        } else if (type === "R") {
            this.commonBind(this.moveR);
        } else if (type === "BR") {
            this.angle = true;
            this.commonBind(this.moveBR);
        } else if (type === "B") {
            this.commonBind(this.moveB);
        } else if (type === "BL") {
            this.angle = true;
            this.commonBind(this.moveBL);
        } else if (type === "L") {
            this.commonBind(this.moveL);
        } else if (type === "DRAG") {
            let dx = e.clientX;
            let dy = e.clientY;
            let sx = this.move.current.offsetLeft;
            let sy = this.move.current.offsetTop;
            this.setState({
                dx,
                dy,
                sx,
                sy
            });
            this.commonBind(this.drag);
        }
    };
    videoDuration = (e, on = true) => {
        const time = this.video.current.duration;
        this.setState({
            duration: time,
            newDuration: time
        });
        if (!this.state.videoClip.length) {
            this.setState({
                videoClip: [
                    {
                        startTime: 0,
                        endTime: time
                    }
                ]
            });
        }
        this.handleCutPosition(e, time, on);
        this.video.current.addEventListener("error", this.errorPause); // 当在音频/视频加载期间发生错误时
    };
    errorPause = e => {
        console.log("播放错误拉=>", e);
        this.pause();
        e.target.addEventListener("playing", this.errorPlay);
    };
    errorPlay = e => {
        this.play();
        console.log("错误后开始播放拉=>", e);
        e.target.removeEventListener("playing", this.errorPlay);
    };
    moveBarCenter = async e => {
        const {
            state: { duration }
        } = this;
        const change = e.clientX - this.barLeft;
        let leftCenter = change;
        leftCenter = Math.max(0, Math.min(barTotalWidth, change));
        if (leftCenter < 0) {
            leftCenter = 0;
        }
        if (leftCenter > barTotalWidth) {
            leftCenter = barTotalWidth;
        }
        const time = (leftCenter / barTotalWidth) * duration;
        this.setState({
            leftCenter: time
        });
        await this.handleVideoCurrentTime(time);
    };

    handleVideoCurrentTime = async time => {
        if (this.video.current) {
            this.video.current.currentTime = time;
        }
        if (this.video2.current) {
            this.video2.current.currentTime = time;
        }
    };
    /**
     *拖拽处理裁剪移动
     * @param {function} func
     */
    moveTL = e => {
        // 按照top 计算
        this.moveT(e);
    };
    moveT = e => {
        const {
            state: { top, left, width, height }
        } = this;
        const change = e.clientY - this.scaleBoxPos.y - top; // 下为正数
        let newTop = top + change;
        let newHeight = height - change;
        if (newTop < 0) {
            newTop = 0;
            newHeight = height + top;
        }
        if (this.angle) {
            // 角上的拖拽需要考虑
            const newWidth = newHeight * this.originRate;
            let newLeft = left - (newWidth - width);
            if (newLeft < 0) {
                newLeft = 0;
                this.setState({
                    left: newLeft + left
                });
                return false;
            }
            this.setState({
                left: newLeft,
                width: newWidth
            });
        }
        this.setState({
            top: newTop,
            height: newHeight
        });
    };
    moveTR = e => {
        this.moveR(e);
    };
    moveR = e => {
        const {
            state: { left, top, width, height }
        } = this;
        const change = e.clientX - this.scaleBoxPos.x - width - left; // 往右为正
        let newWidth = width + change;
        if (newWidth + left > this.width) {
            newWidth = this.width - left;
        }
        if (newWidth < 0) {
            return false;
        }
        if (this.angle) {
            const newHeight = newWidth / this.originRate;
            let newTop = top - (newHeight - height);
            if (newTop < 0) {
                newTop = 0;
                this.setState({
                    top: newTop + top
                });
                return false;
            }
            this.setState({
                height: newHeight,
                top: newTop
            });
        }
        this.setState({ width: newWidth });
    };
    moveBR = e => {
        this.moveB(e);
    };
    moveB = e => {
        const {
            state: { top, left, width, height }
        } = this;
        const change = e.clientY - this.scaleBoxPos.y - height - top; // 往下为正
        let newHeight = height + change;
        if (newHeight + top > this.height) {
            newHeight = this.height - top;
        }
        if (newHeight < 0) {
            return false;
        }
        if (this.angle) {
            // 角上的拖拽需要考虑
            let newWidth = newHeight * this.originRate;
            if (newWidth + left > this.width) {
                newWidth = this.width - left;
                this.setState({
                    width: newWidth
                });
                return false;
            }
            this.setState({
                width: newWidth
            });
        }
        this.setState({ height: newHeight });
    };
    moveBL = e => {
        this.moveL(e);
    };
    moveL = e => {
        const {
            state: { left, top, width, height }
        } = this;
        const change = e.clientX - this.scaleBoxPos.x - left; // 往右为正
        let newWidth = width - change;
        let newLeft = left + change;
        if (newLeft < 0) {
            newLeft = 0;
            newWidth = width + left;
        }
        if (newWidth < 0) {
            return false;
        }
        if (this.angle) {
            // 角上的拖拽需要考虑
            let newHeight = newWidth / this.originRate;
            if (newHeight + top > this.height) {
                newHeight = this.height - top;
                this.setState({
                    height: newHeight
                });
                return false;
            }
            this.setState({
                height: newHeight
            });
        }
        this.setState({
            left: newLeft,
            width: newWidth
        });
    };
    drag = e => {
        const {
            state: { left, top, width, height }
        } = this;
        const changeX = e.clientX - (this.state.dx - this.state.sx) - left; // 往右为正
        const changeY = e.clientY - (this.state.dy - this.state.sy) - top; // 往下为正
        let newLeft = left + changeX;
        let newTop = top + changeY;
        if (newLeft < 0) {
            newLeft = 0;
        }
        if (newTop < 0) {
            newTop = 0;
        }
        if (newLeft + width > this.width) {
            newLeft = this.width - width;
        }
        if (newTop + height > this.height) {
            newTop = this.height - height;
        }
        this.setState({
            left: newLeft,
            top: newTop
        });
    };
    /**
     *公共绑定事件
     * @param {function} func
     */
    commonBind = func => {
        upFunc = event => {
            this.cancelMove(event, func);
        };
        document.addEventListener("mousemove", func, { passive: true });
        document.addEventListener("mouseup", upFunc, { passive: true });
    };
    /**
     * 公共取消事件
     * @param e
     */
    cancelMove = (e, func) => {
        document.removeEventListener("mousemove", func);
        document.removeEventListener("mousemove", upFunc);
    };
    closeModel = (save = false) => {
        this.props.onCancel(save);
    };
    sureCutVideo = async () => {
        const {
            state: { startTime, id, width, height, left, top, duration },
            props: { cutType = true, isSave = 1, type = 2, transverse, onChange }
        } = this;
        const arr = duplicateRemoval(this.state.videoClip);
        const endTime = startTime + getArrSum(arr);
        const realWidth = (this.video.current.videoWidth * width) / this.width;
        const realHeight = (this.video.current.videoHeight * height) / this.height;
        const realPositionX = (left * this.video.current.videoWidth) / this.width;
        const realPositionY = (top * this.video.current.videoHeight) / this.height;
        this._parmasInner = {
            resolutionH: realHeight,
            resolutionW: realWidth,
            aspectRatio: realWidth / realHeight,
            startTime,
            endTime
        };
        this._parmasInner = {
            ...this._parmasInner,
            ...genNewResizeParams(this._parmasInner, transverse)
        };
        const paramsNoneRate = {
            cutRatioType: this.state.videoScale, // 类型
            cutTimesSetting: JSON.stringify(this.state.videoClip),
            id,
            startTime,
            endTime,
            positionX: realPositionX,
            positionY: realPositionY,
            height: realHeight,
            width: realWidth,
            type: findKey(HASH_TYPE, type),
            isSave
        };
        this.setState({ loading: true });
        const {
            data: { obj: cutId, success, msg }
        } = await userTemplateCropN(paramsNoneRate);
        if (!success) {
            this.setState({ loading: false });
            return false;
        }
        if (!isSave) {
            onChange({ cutId, ...this._parmasInner });
        } else {
            message.success("裁剪成功");
            this.closeModel(true);
        }
    };
    _parmasInner = {};
    _loopCount = 0;
    loopCut = async cutId => {
        const {
            data: {
                obj: { status, url, coverImg },
                success,
                msg
            }
        } = await getCutSource(cutId).catch(() => this.setState({ loading: false }));
        if (!success) {
            message.error(msg);
            this.setState({ loading: false });
            this._loopCount = 0;
            return false;
        }
        if (this._loopCount > 15) {
            message.error("裁剪超时，请稍后再试");
            this.setState({ loading: false });
            this._loopCount = 0;
            return false;
        }
        if (status !== 4) {
            await delay(2000);
            this._loopCount += 1;
            return this.loopCut(cutId);
        } else {
            this.setState({ loading: false });
            const {
                props: { onChange }
            } = this;
            this._loopCount = 0;
            if (typeof onChange === "function") {
                onChange({
                    ...this._parmasInner,
                    cutId,
                    url,
                    coverImg
                });
            } else {
                message.success("裁剪成功");
                this.closeModel(true);
            }
            return true;
        }
    };

    onError = e => {
        this.videoErrorTime += 1;
        if (this.videoErrorTime > 5) {
            console.log(e);
            message.error("视频加载失败,请尝试重新打开裁剪框");
        } else {
            this.setState({ videoSuffix: `?v=${Date.now()}` });
            this.forceUpdate();
        }
    };
    addVideoClip = () => {
        const { videoClip, duration } = this.state;
        const newVideoClip = [...videoClip];
        if (videoClip.length > 5) {
            message.warning("裁剪片段不能超过6个");
            return;
        }
        const arr = duplicateRemoval(videoClip); // 得到片段播放的二维数组时间段[[1,3],[4,8]]
        const notPlay = handleArrLeft(arr, duration);
        const time = handleAddMaxTime(notPlay, duration); // [1,2]
        const newItem = {
            startTime: time[0],
            endTime: time[1]
        };
        newVideoClip.push(newItem);
        this.setState({ videoClip: newVideoClip });
    };
    deleteVideoClip = index => {
        const { videoClip } = this.state;
        // todo const newVideoClip = videoClip;
        const newVideoClip = [...videoClip];
        if (videoClip.length < 2) {
            message.warning("裁剪片段不能少于一个");
            return;
        }
        newVideoClip.splice(index, 1);
        this.setState({ videoClip: newVideoClip });
    };
    playCurrentTime = time => {
        this.video.current.currentTime = time;
        this.video2.current.currentTime = time;
        this.setState({
            leftCenter: time
        });
    };
    handleOnChange = (data, index) => {
        const { videoClip, duration } = this.state;
        const newVideoClip = [...videoClip];
        const startData = data[0];
        const endData = data[1];
        const moveEndPoint = ((endData - startData) / 100) * duration; // 移动结束滑块
        const isStartPointer = startData !== this.startPointer;
        const isEndPointer = endData !== this.endPointer;
        newVideoClip[index].startTime = (startData / 100) * duration;
        newVideoClip[index].endTime = (endData / 100) * duration;
        this.pause();
        if (isStartPointer) {
            // 是开始点在移动
            this.playCurrentTime((startData / 100) * duration);
            if (Math.abs(moveEndPoint) < this.minTime) {
                // 移动结束滑块
                const time = (endData / 100) * duration - this.minTime;
                newVideoClip[index].startTime = time;
                this.setState({
                    videoClip: newVideoClip
                });
                this.playCurrentTime(time);
                this.setTimeoutTip();
                return;
            }
        }else if(isEndPointer) {
            // 是结束点在移动
            this.playCurrentTime((endData / 100) * duration);
            if (Math.abs(moveEndPoint) < this.minTime) {
                // 移动结束滑块
                const time = (startData / 100) * duration + this.minTime;
                newVideoClip[index].endTime = time;
                this.setState({
                    videoClip: newVideoClip
                });
                this.playCurrentTime(time);
                this.setTimeoutTip();
                return;
            }
        }
        this.startPointer = data[0];
        this.endPointer = data[1];
        this.setState({
            videoClip: newVideoClip
        });
    };
    handleChangeStart = (time, index) => {
        const { videoClip, playing } = this.state;
        const newVideoClip = [...videoClip];
        const { startTime } = newVideoClip[index];
        const { endTime } = newVideoClip[index];
        newVideoClip[index].startTime = time;
        this.pause();
        this.playCurrentTime(time);
        if (endTime - startTime < this.minTime) {
            const newTime = endTime - this.minTime;
            newVideoClip[index].startTime = newTime;
            this.playCurrentTime(newTime);
            this.setState({ videoClip: newVideoClip });
            this.setTimeoutTip();
            return;
        }
        this.setState({ videoClip: newVideoClip });
    };
    handleChangeEnd = (time, index) => {
        const { videoClip } = this.state;
        const newVideoClip = [...videoClip];
        const { startTime } = newVideoClip[index];
        const { endTime } = newVideoClip[index];
        newVideoClip[index].endTime = time;
        this.pause();
        this.playCurrentTime(time);
        if (endTime - startTime < this.minTime) {
            const newTime = startTime + this.minTime;
            newVideoClip[index].endTime = newTime;
            this.playCurrentTime(newTime);
            this.setState({ videoClip: newVideoClip });
            this.setTimeoutTip();
            return;
        }
        this.setState({ videoClip: newVideoClip });
    };
    setTimeoutTip = () => {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            message.warning("视频裁剪的最短时间是1秒", 1);
            duplicateRemoval();
        }, 400);
    };

    render() {
        const {
            state: { totalScale, url, coverImg, loading, videoSuffix, duration, ...state },
            props,
            props: { cutType = true }
        } = this;
        const playPause = state.playing ? "eqf-pause-f" : "eqf-play-f";
        const cutStyle =
            state.videoScale === TYPE_RATIO.custom ? { display: "block" } : { display: "none" };
        const videoTime = moment(duration, "X").format("mm:ss.S");
        const currentPlayTime = moment(state.leftCenter, "X").format("mm:ss.S");
        const videoRatio = videoRatioObj;
        const arr = duplicateRemoval(state.videoClip);
        const effectiveTime = getArrSum(arr);
        const formatEffectiveTime = time2fs(effectiveTime);
        const isMoveEnd =(duration - state.leftCenter) < 1
        return (
            <RenderInBody>
                <div className={styles.cutBox}>
                    {loading && <Loading title={"裁剪中"} />}
                    <div className={styles.left}>
                       <div className={styles.videoRatioBox}>
                           <div className={styles.videoRatio}>
                               {videoRatio.map((item, index) => (
                                   <div
                                       style={{
                                           background:
                                               state.videoScale === item.typeRatio ? "#1593ff" : ""
                                       }}
                                       key={index}
                                       className={styles.list}
                                       onClick={e => this.onChange(e, item)}>
                                       <img
                                           src={
                                               state.videoScale === item.typeRatio
                                               ? item.iconActive
                                               : item.icon
                                           }
                                           width='28'
                                           height='28'
                                       />
                                       <span
                                           style={{
                                               color: state.videoScale === item.typeRatio ? "#fff" : ""
                                           }}>
                                        {item.title}
                                    </span>
                                   </div>
                               ))}
                           </div>
                       </div>
                        <div className={styles.container}>
                            <div className={styles.previewVideo}>
                                <div className={styles.videoBox}>
                                    <div
                                        className={styles.wrap}
                                        style={{
                                            width: this.width === 0 ? 676 : this.width,
                                            height: this.height === 0 ? 380 : this.height
                                        }}>
                                        <video
                                            preload='auto'
                                            crossOrigin='Anonymous'
                                            ref={this.video}
                                            controls={false}
                                            onLoadedData={this.onLoadedData}
                                            onPause={this.onPause}
                                            onTimeUpdate={this.onTimeUpdate}
                                            poster={genUrl(coverImg, "350")}
                                            onError={this.onError}
                                            src={`${genVideoUrl(props.url)}${videoSuffix}`}
                                        />
                                        {this.width > 0 && cutType && (
                                            <div
                                                className={styles.scaleBox}
                                                id='scaleBox'
                                                ref={this.scaleBox}>
                                                <div
                                                    className={styles.move}
                                                    onMouseDown={e => this.startMove(e, "DRAG")}
                                                    style={{
                                                        width: state.width,
                                                        height: state.height,
                                                        left: state.left,
                                                        top: state.top
                                                    }}
                                                    ref={this.move}>
                                                    <div className={styles.draggable}>
                                                        <video
                                                            preload='auto'
                                                            crossOrigin='Anonymous'
                                                            ref={this.video2}
                                                            controls={false}
                                                            style={{
                                                                left: -state.left,
                                                                top: -state.top
                                                            }}
                                                            onLoadedData={this.onLoadedData2}
                                                            onPause={this.onPause}
                                                            onTimeUpdate={this.onTimeUpdate}
                                                            onError={this.onError}
                                                            poster={genUrl(props.coverImg, "350")}
                                                            src={`${genVideoUrl(
                                                                props.url
                                                            )}${videoSuffix}`}
                                                        />
                                                    </div>
                                                    <span className={styles.resizable}>
                                                    <span
                                                        className={styles.tl}
                                                        onMouseDown={e => this.startMove(e, "TL")}
                                                    />
                                                    <span
                                                        style={cutStyle}
                                                        className={styles.t}
                                                        onMouseDown={e => this.startMove(e, "T")}>
                                                        <i />
                                                    </span>
                                                    <span
                                                        className={styles.tr}
                                                        onMouseDown={e => this.startMove(e, "TR")}
                                                    />
                                                    <span
                                                        style={cutStyle}
                                                        className={styles.r}
                                                        onMouseDown={e => this.startMove(e, "R")}>
                                                        {" "}
                                                        <i />
                                                    </span>
                                                    <span
                                                        className={styles.br}
                                                        onMouseDown={e => this.startMove(e, "BR")}
                                                    />
                                                    <span
                                                        style={cutStyle}
                                                        className={styles.b}
                                                        onMouseDown={e => this.startMove(e, "B")}>
                                                        <i />
                                                    </span>
                                                    <span
                                                        className={styles.bl}
                                                        onMouseDown={e => this.startMove(e, "BL")}
                                                    />
                                                    <span
                                                        style={cutStyle}
                                                        className={styles.l}
                                                        onMouseDown={e => this.startMove(e, "L")}>
                                                        {" "}
                                                        <i />
                                                    </span>
                                                </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className={styles.playBox}>
                                <Icon
                                    onClick={this.play}
                                    type={playPause}
                                    className={styles.VideoPlayButton}
                                />
                            </div>
                        </div>
                    </div>
                    <div className={styles.right}>
                        <div className={styles.title}>
                            <span className={styles.name}>视频裁剪</span>
                            <Icon
                                onClick={this.closeModel}
                                type='eqf-no'
                                className={styles.eqfNo}
                            />
                        </div>
                        <div className={styles.center}>
                            <div className={styles.label}>
                                <p>裁剪时长</p>
                                <div>
                                    <i />
                                    <span>保留</span>
                                    <i />
                                    <span>舍弃</span>
                                </div>
                            </div>
                            <div className={styles.ruler}>
                                <div className={styles.playBox}>
                                    <Icon
                                        onClick={this.play}
                                        type={playPause}
                                        className={styles.VideoPlayButton}
                                    />
                                </div>
                                <div className={styles.box}>
                                    <div className={styles.bar_area} id='bar-area' ref={this.bar}>
                                        <div className={styles.bg} />
                                        {state.videoClip.map((item, index) => (
                                            <div
                                                key={index}
                                                style={{
                                                    left: `${(item.startTime / state.newDuration) *
                                                        100}%`,
                                                    width: `${((item.endTime - item.startTime) /
                                                        state.newDuration) *
                                                        100}%`
                                                }}
                                                className={styles.bar_range}
                                            />
                                        ))}
                                        <ScaleMark duration={state.newDuration * 1000} scale={0.3} />
                                        <div
                                            style={{
                                                left: `${(state.leftCenter / state.newDuration) *
                                                    100}%`
                                            }}
                                            onMouseDown={e => this.startMove(e, "center")}
                                            className={styles.bar}>
                                            <div className={`${isMoveEnd ? styles.moveEnd : styles.move}`}>
                                                <p>{currentPlayTime}</p>
                                                <span />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.timeTip}>
                                <p>裁剪后时长:&nbsp;{formatEffectiveTime}</p>
                                <div>
                                    {currentPlayTime}&nbsp;/&nbsp;{videoTime}
                                </div>
                            </div>
                            {state.newDuration > 0 && (
                                <VideoClip
                                    duration={state.newDuration}
                                    addVideoClip={this.addVideoClip}
                                    deleteVideoClip={this.deleteVideoClip}
                                    handleOnChange={this.handleOnChange}
                                    handleChangeStart={this.handleChangeStart}
                                    handleChangeEnd={this.handleChangeEnd}
                                    videoClip={state.videoClip}
                                />
                            )}
                        </div>
                        <div className={styles.bottom}>
                            <div className={styles.btnBox}>
                                <Button onClick={this.sureCutVideo} className={styles.sureBtn}>
                                    确定
                                </Button>
                                <div onClick={this.closeModel} className={styles.cancelBtn}>
                                    取消
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </RenderInBody>
        );
    }
}

export default CutVideo;
