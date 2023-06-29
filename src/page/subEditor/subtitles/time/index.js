import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'dva';
import styles from './index.less';
import { Popover } from 'antd';
import Icon from '../../../components/Icon';
import { genUrl } from '../../../../util/image';
import { BLANK_PARTY, SUBTITLES_MIN_DURATION } from '../../../../config/staticParams';
import VideoThumbnails from '../../../../services/videoThumbnails';
import ChangeVideo from '../../../editor/videoStore';
import Modal from '../../../components/modal';
import { Popconfirm } from 'antd';
import storageLocal from '../../../../util/storageLocal';
import { prev } from '../../../../config/env';
import { Tooltip } from 'antd';
import eventEmitter from '../../../../services/EventListener';

const noobKey = storageLocal.key.subtitleTips;
// 鼠标抬起事件
let upFunc = () => null;
// 每个刻度的长度（px）
const oneWidth = 200 + 1 + 1;
// 每个刻度的时间(s)
const seconds = 5;
const minRange = ~~oneWidth / seconds * SUBTITLES_MIN_DURATION / 1000;
// 字幕编辑区wrap外面盒子宽度
let sumWidth = 0;
// 左右间歇
const padingLeft = 22;
// 底部可移动拖动条的宽度
let scrollMoveWidth = 0;
// 点击时间轴左右移动时间轴的点击范围
let clickScope = 20;
// 点击左右时间轴前进后退的范围
let goAndback = 100;
// 时间刻度超出屏幕显示区域增加显示区域值
let spaceDis = 52;

@connect(({ subtitles }) => ({ subtitles }))
class Substitles extends React.Component {
    constructor(props) {
        super(props);
        this.video = props.video || document.createElement('video');
        this.trackWarp = React.createRef();
        this.wrap = React.createRef();
        this.moveScroll = React.createRef();
        this.wrapLeft = 0; // 拖动鼠标以this.wrap.current.getBoundingClientRect().x 为准进行参看
        this.videoTtransverse = true;
        this.onMouseupFunc = null;
        const showTips = !storageLocal.getItem(noobKey);
        this.state = {
            limitEnd: 0,
            limitBegin: this.video.duration,
            distinguish: false, // 语音识别
            distinguishSucess: false, // 语音识别成功
            cancelDistinguish: false, // 取消语音识别
            videoDuration: 0, // 视频持续时间
            playProgress: 0,// 播放进度条初始位置
            currentTime: 0, // 当前播放时间
            barRangeWidth: 0, // 字幕编辑区域总长度
            barRangeTimeWidth: 0, // 时间区域总长度
            barRangeLeft: 0, // 字幕区域相对this.bar位置
            scrollLeft: 22,// 滚动相对 this.bar 编辑位置
            playing: false, // 正在播放
            dx: 0,
            sx: 0,
            timeScale: [], // 时间刻度列表
            subtitles: [], // 字幕内容列表
            subtitlesStatus: false, // true 添加，false 编辑
            uuid: undefined,// 点击的uuid
            activeIndex: 0,// 点击的uuid 序列
            begin: 0, // 选中字幕文件的开始
            end: 0, // 选中字幕的结束时间
            openModal: false, // 更换视频
            visible: false, // 是否添加视频
            visibleAutoDistinguish: false, // 字幕是否自动识别
            visibleScroll: showTips, // 控制时间轴区域提示
            visibleDistinguish: showTips, // 字幕自动识别提示
            visibleSubtitles: showTips, // 字幕时间段提示
            mouseDown: false,
            imgDone: false,
        };
    }

    static getDerivedStateFromProps(nextProps, preState) {
        const { subtitles: { dataList }, uuid } = nextProps;
        const newState = {};
        let subtitles = [];
        if (dataList && !preState.mouseDown) {
            let limitEnd = 0;
            let limitBegin = preState.videoDuration * 1000;
            const activeItem = Object.values(dataList)
                .find(v => v.uuid === uuid) || {
                end: preState.currentTime * 1000,
                begin: preState.currentTime * 1000,
            };
            for (let one of Object.values(dataList)) {
                const newOne = { ...one };
                newOne.begin = (one.begin / 1000);
                newOne.end = (one.end / 1000);
                if (newOne.uuid === uuid) {
                    newOne.active = true;
                } else if (activeItem) {
                    newOne.active = false;
                    if (activeItem.begin > one.begin && one.end > limitEnd) {
                        limitEnd = one.end;
                    }
                    if (activeItem.end < one.end && one.begin < limitBegin) {
                        limitBegin = one.begin;
                    }
                }
                subtitles.push(newOne);
            }
            newState.limitEnd = limitEnd / 1000;
            newState.limitBegin = limitBegin / 1000;
            newState.begin = activeItem.begin / 1000;
            newState.end = activeItem.end / 1000;
            newState.subtitles = subtitles;
            newState.uuid = uuid;
            if (uuid) {
                newState.subtitlesStatus = false;
            } else {
                newState.subtitlesStatus = true;
            }
        }
        return newState;
    }

    componentDidMount() {
        this.wrapLeft = this.wrap.current.getBoundingClientRect().x;
        sumWidth = this.wrap.current.getBoundingClientRect().width;
        scrollMoveWidth = sumWidth / 5;
        this.listenerVideo();
        if (this.video.duration) {
            this.loadedMetadata();
        }
        document.addEventListener('keypress', this.keyPress);
    }

    componentDidUpdate(prevProps, prevState) {
        this.wrapLeft = this.wrap.current.getBoundingClientRect().x;
        sumWidth = this.wrap.current.getBoundingClientRect().width;
        if (this.props.video !== this.video) {
            this.video = this.props.video;
            this.listenerVideo();
        }
    }

    componentWillUnmount() {
        this.video.removeEventListener('timeupdate', this.timeUpdate);
        this.video.removeEventListener('loadedmetadata', this.loadedMetadata);
        this.video.removeEventListener('play', this.onPlay);
        this.video.removeEventListener('pause', this.onPause);
        document.removeEventListener('keypress', this.keyPress);
    }

    listenerVideo = () => {
        this.video.addEventListener('timeupdate', this.timeUpdate);
        this.video.addEventListener('loadedmetadata', this.loadedMetadata);
        this.video.addEventListener('play', this.onPlay);
        this.video.addEventListener('pause', this.onPause);
    };
    /**
     * 按下空格播放和暂停视频
     * @params {[type]} key=32 description 空格键值
     */
    keyPress = (e) => {
        const body = document.body;
        if (e.keyCode === 32 && document.activeElement === body) {
            this.play();
        }
    };
    commonBind = (func) => {
        upFunc = (event) => {
            this.cancelMove(event, func);
        };
        this.setState({ mouseDown: true });
        document.addEventListener('mousemove', func, { passive: true });
        document.addEventListener('mouseup', upFunc, { passive: true });
    };
    cancelMove = (e, func) => {
        if (typeof this.onMouseupFunc === 'function') {
            this.onMouseupFunc();
        }
        this.setState({ mouseDown: false });
        document.removeEventListener('mousemove', this.moveBarStart);
        document.removeEventListener('mousemove', this.moveBarEnd);
        document.removeEventListener('mousemove', this.moveBarCenter);
        document.removeEventListener('mousemove', this.moveBarScroll);
        document.removeEventListener('mousemove', this.dragSubtitles);
        document.removeEventListener('mouseup', upFunc);
    }
        /**
         * type 拖动类型 type=start|| center || end || scroll
         * @andy
         */;
    startMoveBar = (e, type) => {
        this.videoDuration();
        if (type === 'start') {
            this.commonBind(this.moveBarStart);
            this.onMouseupFunc = this.mouseUpFunc;
        } else if (type === 'end') {
            this.commonBind(this.moveBarEnd);
            this.onMouseupFunc = this.mouseUpFunc;
        } else if (type === 'playProgress' || (this.state.playing && type === 'drag')) {
            this.commonBind(this.moveBarCenter);
        } else if (type === 'scroll') {
            let dx = e.clientX;
            let sx = this.moveScroll.current.offsetLeft;
            this.setState({
                dx,
                sx,
            });
            this.commonBind(this.moveBarScroll);
        } else if (type === 'drag') {
            const { state: { subtitles, uuid } } = this;
            let activeIndex = '';
            subtitles.forEach((item, index) => {
                if (item.uuid === uuid) {
                    activeIndex = index;
                }
            });
            let dx = e.clientX;
            if (!uuid) return;
            let sx = document.getElementsByClassName('singleSubtitles')[activeIndex].offsetLeft;
            this.setState({
                dx,
                sx,
                activeIndex,
            });
            this.commonBind(this.dragSubtitles);
            this.onMouseupFunc = this.mouseUpFunc;
        }
    };

    mouseUpFunc = () => {
        const { state: { subtitles, uuid }, props: { dispatch } } = this;
        if (!uuid) return;
        let { end, begin } = subtitles.find(v => v.uuid === uuid) || {};
        dispatch({
            type: 'subtitles/changeNow',
            payload: {
                uuid,
                begin: begin * 1000,
                end: end * 1000,
            },
        });
        this.onMouseupFunc = null;
    };
    /**
     * 拖动单个字幕条改变字幕时间
     * @param {[type]} [description]
     * @AndyWay
     */
    dragSubtitles = (e) => {
        const { state: { begin, end, uuid, subtitles, barRangeWidth, videoDuration, barRangeLeft, activeIndex, limitEnd, limitBegin } } = this;
        const change = e.clientX - (this.state.dx - this.state.sx);
        let subtitleWidth = (end - begin) * barRangeWidth / videoDuration;
        let dragLeft = change;
        // 字幕左右极限限制
        if (change <= 0) {
            dragLeft = 0;
        }
        if (change + subtitleWidth > barRangeWidth) {
            dragLeft = barRangeLeft;
        }
        let newBegin = dragLeft * videoDuration / barRangeWidth;
        let newEnd = dragLeft * videoDuration / barRangeWidth + subtitleWidth * videoDuration /
            barRangeWidth;

        // 字幕开始和结束重叠判断
        if (newBegin <= limitEnd) {
            newBegin = limitEnd;
            newEnd = limitEnd + subtitleWidth * videoDuration / barRangeWidth;
        }
        if (newEnd >= limitBegin) {
            newEnd = limitBegin;
            newBegin = limitBegin - subtitleWidth * videoDuration / barRangeWidth;
        }
        this.moveBarCenter(e);
        subtitles[activeIndex].begin = newBegin;
        subtitles[activeIndex].end = newEnd;
        this.setState({
            subtitles,
            begin: newBegin,
            end: newEnd,
        });
    };
    /**
     * 拖动滑动条移动字幕编辑区位置
     * @param {[type]} [description]
     * @AndyWay
     */
    moveBarScroll = (e) => {
        let scrollLeft = e.clientX - (this.state.dx - this.state.sx);
        if (sumWidth === scrollMoveWidth) return;
        if (scrollLeft < padingLeft) {
            scrollLeft = padingLeft;
        }
        if (scrollLeft > sumWidth - scrollMoveWidth - padingLeft) {
            scrollLeft = sumWidth - scrollMoveWidth - padingLeft;
        }

        // 滚动范围 = 滚动条最左位置-滚动条最右位置
        const scrollWidth = sumWidth - scrollMoveWidth - padingLeft * 2;

        // 字幕区域相对this.bar位置
        const barRangeLeft = -((this.state.barRangeWidth - (sumWidth - padingLeft * 2)) /
            scrollWidth * (scrollLeft - padingLeft));

        this.setState({
            scrollLeft,
            barRangeLeft,
        });

    };
    moveBarStart = (e) => {
        const { state: { uuid, subtitles, begin, end, barRangeLeft, barRangeWidth, videoDuration, limitEnd } } = this;
        let activeIndex = null;
        const nowItem = subtitles.find((v, i) => {
            activeIndex = i;
            return v.uuid === uuid;
        });
        if (!nowItem) return;
        const subtitlePosition = begin * barRangeWidth / videoDuration;
        // 红条长度
        const subtitleWidth = (end - begin) * barRangeWidth / videoDuration;
        // 改变量
        const change = e.clientX - this.wrapLeft - subtitlePosition - padingLeft - barRangeLeft;
        // 即将变化位置
        const start = subtitlePosition + change;
        const newBegin = (subtitlePosition + change) * videoDuration / barRangeWidth;
        // 判断是否小于间隙 或者是有过界的现象
        if ((change > (subtitleWidth - minRange)) || newBegin <= limitEnd) {
            return false;
        }
        subtitles[activeIndex].begin = newBegin;
        this.moveBarCenter(e, false);
        this.setState({
            subtitles,
            begin: newBegin,
        });
    };
    moveBarEnd = (e) => {
        const { state: { uuid, subtitles, begin, end, barRangeLeft, barRangeWidth, videoDuration, limitBegin } } = this;
        let activeIndex = null;
        const nowItem = subtitles.find((v, i) => {
            activeIndex = i;
            return v.uuid === uuid;
        });
        if (!nowItem) return;
        const subtitlePosition = begin * barRangeWidth / videoDuration;
        const subtitleWidth = (end - begin) * barRangeWidth / videoDuration;
        const change = e.clientX - this.wrapLeft - subtitlePosition - subtitleWidth - padingLeft -
            barRangeLeft;
        const newEnd = (subtitlePosition + subtitleWidth + change) * videoDuration / barRangeWidth;
        // 判断是否小于间隙 或者是有过界的现象
        if ((-change > subtitleWidth - minRange) || newEnd >= limitBegin) {
            return false;
        }
        subtitles[activeIndex].end = newEnd;
        this.moveBarCenter(e, false);
        this.setState({
            subtitles,
            end: newEnd,
        });

    };
    videoDuration = () => {
        const { duration } = this.video;
        const barRangeWidth = duration / seconds * oneWidth;
        const scaleNum = Math.ceil(duration / seconds); // 有多少时间刻度
        const timeScale = [];
        for (let i = 0; i < scaleNum; i += 1) {
            let time = i * seconds;
            const left = i * oneWidth + padingLeft;
            if (time === 0) {
                time = 0;
            } else {
                time = moment(time, 'X')
                    .format('mm:ss');
            }
            timeScale.push({
                id: i,
                time,
                left,
            });
        }
        if (barRangeWidth < sumWidth) {
            scrollMoveWidth = sumWidth;
        }
        this.setState({
            barRangeWidth, // 字幕编辑区域总长度
            barRangeTimeWidth: barRangeWidth < sumWidth ? sumWidth : barRangeWidth,
            videoDuration: duration,
            timeScale,
        });
    };
    /**
     * 添加字幕
     */
    addSubtitles = () => {
        const { state: { currentTime, limitBegin, distinguish }, props: { dispatch, subtitles: { dataList } } } = this;
        const end = Math.min(currentTime + 2, limitBegin);
        if (distinguish) return;
        this.video.pause();
        dispatch({
            type: 'subtitles/insertText',
            payload: {
                begin: currentTime * 1000,
                end: end * 1000,
            },
        })
            .then(res => {
                eventEmitter.emit('inputText');
            });
    };
    play = () => {
        if (this.state.playing) {
            this.video.pause();
        } else {
            this.video.play();
        }
    };
    onPlay = () => {
        this.setState({ playing: true });
    };
    onPause = () => {
        this.setState({ playing: false });
    };
    loadedMetadata = () => {
        this.videoTtransverse = this.video.videoWidth > this.video.videoHeight;
        !this.state.imgDone && this.createThumb();
        this.videoDuration();
    };
    timeUpdate = () => {
        const { state: { subtitles, playProgress, barRangeWidth, scrollLeft, barRangeLeft } } = this;
        if (this.video.ended) {
            this.setState({
                playProgress: 0,
                currentTime: 0,
            });
            return;
        }
        const currentTime = this.video.currentTime;
        /*subtitles.forEach(item => {
            if (item.begin < currentTime && item.end > currentTime) {
                // this.activeSubtitles(item);
            }
        });*/
        // 滚动范围 = 滚动条最左位置-滚动条最右位置
        /*  const scrollWidth = sumWidth - scrollMoveWidth - padingLeft * 2;
          let rate = Math.floor(playProgress/(sumWidth-padingLeft))
          let barRangeLeft = ''
          let newScrollLeft = scrollLeft
          if(playProgress>(sumWidth-padingLeft)*rate){
              barRangeLeft = -(sumWidth-padingLeft)*rate
              newScrollLeft = -barRangeLeft*scrollWidth/barRangeWidth + padingLeft
              if(newScrollLeft<0){
                  newScrollLeft = padingLeft
                  barRangeLeft = 0
              }
          }*/
        this.setState({
            playProgress: currentTime * oneWidth / seconds,
            currentTime,
            // scrollLeft:newScrollLeft,
            // barRangeLeft,
        });
    };

    /**
     * 创建缩略图
     */
    createThumb = () => {
        const { url, videoBase64 } = this.props.subtitles;
        const rate = this.videoTtransverse;
        const width = rate ? 101 : 202 / 4;
        const interval = rate ? 2.5 : 1.25;
        const { props: { subtitles } } = this;
        const videoThumbnails = new VideoThumbnails({
            src: videoBase64 || genUrl(url),
            width,
            height: 64,
            defaultImg: genUrl(subtitles.oriCoverImg || subtitles.coverImg),
        });
        const dom = this.trackWarp.current;
        const showImg = (v, i) => {
            const canvas = document.createElement('canvas');
            canvas.className = styles.ImgTrackWrap;
            canvas.width = width;
            canvas.height = 64;
            canvas.style.left = `${~~width * i}px`;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(v, 0, 0, width, 64);
            if (dom) dom.append(canvas);
        };
        const drawImg = (cls) => {
            Array.from(dom.childNodes)
                .forEach(v => dom.removeChild(v));
            cls.canvasArray.forEach(showImg);
        };
        new Promise(resolve => {
            if (videoThumbnails.cover) {
                videoThumbnails.cover.onload = () => resolve(true);
            } else {
                resolve(true);
            }

        }).then((res) => {
            videoThumbnails.createThumbanails({
                interval,
                end: this.video.duration,
                callBack: drawImg,
            })
                .then(res => {
                    Array.from(dom.childNodes)
                        .forEach(v => dom.removeChild(v));
                    res.forEach(showImg);
                    this.setState({ imgDone: true });
                    videoThumbnails.dispose();
                });
            drawImg(videoThumbnails);
        });
    };
    moveBarCenter = (e, changeActive = true) => {
        const { state } = this;
        const change = e.clientX - this.wrapLeft - padingLeft - state.barRangeLeft;
        let playProgress = change;
        if (change < 0) {
            playProgress = 0;
        }
        if (change > state.barRangeWidth) {
            playProgress = state.barRangeWidth + padingLeft;
        }
        const currentTime = playProgress / state.barRangeWidth * this.video.duration;
        this.video.currentTime = currentTime;
        let uuid = '';
        let begin = '';
        let end = '';
        let subtitlesStatus = false;
        if (changeActive) {
            state.subtitles.forEach(item => {
                if (item.begin < currentTime && item.end > currentTime) {
                    item.active = true; // 激活状态
                    uuid = item.uuid;
                    begin = item.begin;
                    end = item.end;
                    subtitlesStatus = true;
                } else {
                    item.active = false;
                }
            });
            this.setState({
                subtitles: state.subtitles,
                playProgress: playProgress,
                uuid,
                currentTime,
                begin,
                end,
                subtitlesStatus,
            });
        } else {
            this.setState({
                currentTime,
                playProgress: playProgress,
            });
        }

    };
    editSubtitles = () => {
        if (this.state.distinguish) return;
        this.video.pause();
        eventEmitter.emit('inputText');
    };
    /**
     * subtitlesStatus :false 编辑字幕处于激活状态
     */
    activeSubtitles = (data) => {
    };
    /**
     *点击时间轴，视频进度快进到此处
     */
    clickProgress = (e) => {
        const { state: { barRangeLeft, scrollLeft, barRangeWidth } } = this;
        let playProgress = e.clientX - this.wrapLeft - padingLeft - barRangeLeft;
        const time = playProgress * seconds / oneWidth;
        // this.moveBarCenter(e, true);

        // 滚动范围 = 滚动条最左位置-滚动条最右位置
        const scrollWidth = sumWidth - scrollMoveWidth - padingLeft * 2;
        const clickPos = e.clientX - this.wrapLeft - padingLeft;
        let newBarRangeLeft = barRangeLeft;
        let newScrollLeft = scrollLeft;
        if (sumWidth - padingLeft - clickScope < clickPos) {
            newBarRangeLeft = newBarRangeLeft - goAndback;
            newScrollLeft = -newBarRangeLeft * scrollWidth /
                (barRangeWidth - (sumWidth - padingLeft * 2)) + padingLeft;
            if (newScrollLeft > scrollWidth) {
                newScrollLeft = scrollWidth + padingLeft;
                newBarRangeLeft = -((barRangeWidth - (sumWidth - padingLeft * 2)) / scrollWidth *
                    (scrollLeft - padingLeft));
            }
        }
        if (clickPos < clickScope) {
            newBarRangeLeft = newBarRangeLeft + goAndback;
            if (newBarRangeLeft > -goAndback) {
                newBarRangeLeft = 0;
                newScrollLeft = padingLeft;
            }
            newScrollLeft = -newBarRangeLeft * scrollWidth /
                (barRangeWidth - (sumWidth - padingLeft * 2)) + padingLeft;
        }
        this.video.currentTime = time;
        if (playProgress < 0) {
            playProgress = 0;
        }
        this.setState({
            playProgress,
            barRangeLeft: newBarRangeLeft,
            scrollLeft: newScrollLeft,
        });
    };
    /**
     * 删除选中的字幕
     */
    cancelSubtitles = () => {
        const { state: { uuid }, props: { subtitles: { dataList } } } = this;
        this.props.dispatch({
            type: 'subtitles/delete',
            payload: uuid,
        });
        let subtitles = [];
        for (let one of Object.values(dataList)) {
            subtitles.push(one);
        }
        this.setState({
            subtitles,
        });
    };
    /**
     * 字幕自动识别，禁止字幕添加，字幕编辑
     * @param {[type]} [description]
     * @AndyWay
     */
    distinguishSubtitles = () => {
        this.setState({
            visibleAutoDistinguish: true,
            visible: false,
            visibleScroll: false,
            visibleDistinguish: false,
            visibleSubtitles: false,
        });

    };
    /**
     * 自动识别字幕确认弹出框按下，开始自动识别字幕
     */

    distinguishSubtitlesHandle = () => {
        this.setState({
            distinguish: true,
            cancelDistinguish: false,
        });
        this.props.dispatch({
            type: 'subtitles/voiceRecognition',
        })
            .then(() => {
                if (!this.state.distinguish) return;
                this.setState({
                    distinguish: false,
                    distinguishSucess: true,
                });
                setTimeout(() => {
                    this.setState({
                        distinguishSucess: false,
                        visibleAutoDistinguish: false,
                    });

                }, 3000);
            })
            .catch(() => {
                console.log('error');
            });
    };
    cancelDistinguish = () => {
        this.setState({ cancelDistinguish: true });
    };
    cancelDistinguishHandle = () => {
        this.props.dispatch({
            type: 'subtitles/cancelVoiceRecognition',
        });
        this.setState({
            distinguish: false,
            distinguishSucess: false,
            visibleAutoDistinguish: false,
        });
    };
    /**
     * 更换视频
     */
    changeVideo = () => {
        if (this.state.distinguish) return;
        this.setState({
            visible: true,
            visibleAutoDistinguish: false,
        });
    };
    closeChangeVideo = () => {
        this.setState({ openModal: false });
    };
    onClose = () => {
        this.setState({ openModal: false });
    };
    confirm = () => {
        this.setState({
            openModal: true,
            visible: false,
            visibleAutoDistinguish: false,
            visibleScroll: false,
            visibleDistinguish: false,
            visibleSubtitles: false,
        });
    };
    cancel = () => {
        this.setState({
            visible: false,
            visibleAutoDistinguish: false,
            cancelDistinguish: false,
        });
    };
    closeScroll = () => {
        storageLocal.setItem(noobKey, { done: true });
        this.setState({ visibleScroll: false });
    };
    closeDistinguish = () => {
        storageLocal.setItem(noobKey, { done: true });
        this.setState({ visibleDistinguish: false });
    };
    closeSubtitles = (e) => {
        storageLocal.setItem(noobKey, { done: true });
        e.stopPropagation();
        this.setState({ visibleSubtitles: false });
    };
    afterChangeVideo = (id) => {
        window.location.href = `${prev}/subEditor/subtitles/${id}`;
    };

    render() {
        const { state, props: { subtitles: { id, dataList } } } = this;
        const currentTime = moment(state.currentTime, 'X')
            .format('mm:ss');
        const sumTime = moment(state.videoDuration, 'X')
            .format('mm:ss');
        const floatOne = (state.currentTime.toFixed(10)
            .toString()
            .split('.')[1].slice(0, 1));
        const contentDistinguish = (
            <div className={styles.distinguish}>
                <span>自动识别视频中的声音为字幕</span> <span onClick={this.closeDistinguish}
                                                 className={styles.closeDistinguish}>×</span>
            </div>
        );
        const contentScroll = (
            <div className={styles.distinguish}>
                <span onClick={this.closeScroll} className={styles.closeDistinguish}>×</span>
                <div>鼠标左右拖动滚动条，设置要添加</div>
                <div>字幕起始时间点</div>
            </div>
        );
        const contentSubtitles = (
            <div className={styles.distinguish}>
                <span onClick={this.closeSubtitles} className={styles.closeDistinguish}>×</span>
                <div>红色区域表示“字幕”显示时间段</div>
                <div>可“选中”红色区域调整时间段</div>
            </div>
        );
        const contentChangeVideo = (
            <React.Fragment>
                <div className={styles.changeVideo}>更换视频？</div>
                <div className={styles.changeVideoCon}
                     style={{ marginTop: '10px' }}>当前编辑中视频将被替换，已有字
                </div>
                <div className={styles.changeVideoCon}>幕也将清空</div>
            </React.Fragment>
        );
        const contentDistinguishSubtitles = (
            <React.Fragment>
                <div className={styles.changeVideo} style={{ width: '182px' }}>自动识别字幕？</div>
                <div className={styles.changeVideoCon}
                     style={{ marginTop: '10px' }}>自动识别将清空已有字幕
                </div>
            </React.Fragment>
        );
        const playBtn = state.playing ? 'eqf-pause-l' : 'eqf-play-l';
        return (
            <React.Fragment>
                <div className={styles.foot}>
                    <div className={styles.operate}>
                        <div className={styles.leftWrap}>
                            <Popconfirm
                                visible={this.state.visible}
                                overlayClassName='Popconfirm'
                                title={contentChangeVideo}
                                icon={<Icon type="eqf-why-f" style={{
                                    color: '#FFB243',
                                    display: 'inline-block',
                                    marginTop: '2px',
                                }}/>}
                                cancelText='取消'
                                okText='确定'
                                onConfirm={this.confirm}
                                onCancel={this.cancel}
                            >
                                <div className={`${!state.distinguish
                                                   ? styles.revoke
                                                   : styles.revokeHover}`}
                                     onClick={this.changeVideo}>
                                    <Icon type='eqf-refresh-ccw' className={styles.eqf_rotate_ccw}/>
                                    <span className={styles.revokeBtn}>更换视频</span>
                                </div>
                            </Popconfirm>
                            {
                                !state.distinguish && !state.distinguishSucess &&
                                <Popover content={contentDistinguish} placement='top'
                                         overlayClassName='distinguish'
                                         visible={state.visibleDistinguish}>
                                    <Popconfirm
                                        visible={this.state.visibleAutoDistinguish}
                                        overlayClassName='Popconfirm'
                                        title={contentDistinguishSubtitles}
                                        icon={<Icon type="eqf-why-f" style={{
                                            color: '#faad14',
                                            display: 'inline-block',
                                            marginTop: '2px',
                                        }}/>}
                                        cancelText='取消'
                                        okText='确定'
                                        onConfirm={this.distinguishSubtitlesHandle}
                                        onCancel={this.cancel}
                                    >
                                        <div
                                            className={`${styles.distinguishBtn} ${state.visibleAutoDistinguish
                                                                                   ? styles.distinguishBtnHover
                                                                                   : ''}`}
                                            onClick={this.distinguishSubtitles}>
                                            <Icon type='eqf-mic-l' className={styles.eqf_mic_l}/>
                                            <span className={styles.eqf_mic_l_btn}>自动识别</span>
                                            <div className={styles.limitTimeFree}>限时免费</div>
                                        </div>
                                    </Popconfirm>
                                </Popover>
                            }
                            {
                                state.distinguish &&
                                <div className={styles.distinguish_ing}><Icon type='eqf-refresh-cw'
                                                                              className={`${styles.eqf_mic_l} ${styles.eqf_mic_l_hover}`}/>
                                    <span className={styles.eqf_mic_l_btn}>自动识别中...</span>
                                    <Popconfirm
                                        visible={this.state.cancelDistinguish}
                                        overlayClassName='Popconfirm'
                                        title={contentDistinguishSubtitles}
                                        icon={<Icon type="eqf-why-f" style={{
                                            color: '#faad14',
                                            display: 'inline-block',
                                            marginTop: '2px',
                                        }}/>}
                                        cancelText='取消'
                                        okText='确定'
                                        onConfirm={this.cancelDistinguishHandle}
                                        onCancel={this.cancel}
                                    >
                                        <span onClick={this.cancelDistinguish}
                                              className={styles.distinguishCancel}>取消</span>
                                    </Popconfirm>

                                </div>
                            }
                            {
                                state.distinguishSucess &&
                                <div className={styles.distinguish_ing}>
                                    <Icon type='eqf-yes-f' className={styles.eqf_mic_l}/>
                                    <span className={styles.eqf_mic_l_btn}>识别成功，字幕已添加</span>
                                </div>
                            }
                        </div>
                        <div className={styles.addSubtitles}>
                            {state.subtitlesStatus &&
                            <div className={`${!state.distinguish
                                               ? styles.editSubtitles
                                               : styles.distinguishSubtitles}`}
                                 onClick={this.addSubtitles}>
                                <Icon type='eqf-plus' className={styles.eqf_plus}/> <span
                                className={styles.editSubtitlesBtn}>添加字幕</span>
                            </div>}
                            {!state.subtitlesStatus &&
                            <div className={`${!state.distinguish
                                               ? styles.editSubtitles
                                               : styles.distinguishSubtitles}`}
                                 onClick={this.editSubtitles}>
                                <Icon type='eqf-pen-l'/> <span
                                className={styles.editSubtitlesBtn}>编辑字幕</span>
                            </div>}
                            {!state.subtitlesStatus &&
                            <Icon type='eqf-delete-l' onClick={this.cancelSubtitles}
                                  className={styles.eqf_delete_f}/>}
                        </div>
                        {Object.keys(dataList).length && <div className={styles.rightWarp}/> ||
                        null}
                    </div>
                    <Tooltip placement='topLeft' title='播放/暂停(空格键)'>
                        <Icon onClick={this.play} type={playBtn} className={styles.eqf_play_l}/>
                    </Tooltip>
                    <div className={styles.container}>
                        <div className={styles.sumTime}>{sumTime}</div>
                        <div className={styles.wrap} ref={this.wrap}>
                            <div className={styles.time} onClick={this.clickProgress}
                                 style={{
                                     width: state.barRangeTimeWidth + spaceDis,
                                     left: state.barRangeLeft,
                                 }}>
                                <ul className={styles.ul}>
                                    {state.timeScale && state.timeScale.map((item, index) =>
                                        <li key={index} style={{ left: item.left }}><span
                                            className={styles.time_flag}>{item.time}</span></li>,
                                    )}
                                </ul>
                                <Popover content={contentSubtitles} placement='topLeft'
                                         overlayClassName='distinguish'
                                         visible={state.visibleSubtitles}>
                                    <div className={styles.main}>
                                        <div onMouseDown={(e) => this.startMoveBar(e,
                                            'playProgress')}
                                             style={{ left: state.playProgress }}
                                             className={`${styles.current} ${styles.bar}`}>
                                            <span className={styles.slide_circle}>
                                                <span>{currentTime}.{floatOne}</span>
                                                <span className={styles.triangleTop}/>
                                            </span>
                                            <span className={styles.playProgressBottom}>
                                                <span className={styles.triangleBottom}/>
                                            </span>
                                        </div>
                                        <div className={styles.previewDiv}
                                             ref={this.trackWarp}
                                             style={{ width: state.barRangeWidth }}/>
                                        {this.state.subtitles && this.state.subtitles.map((item) =>
                                            <div onClick={() => {
                                                this.activeSubtitles(item);
                                            }}
                                                 key={item.uuid}
                                                 className={`${styles.singleSubtitles} singleSubtitles`}
                                                 style={{
                                                     width: (item.end - item.begin) *
                                                         state.barRangeWidth / state.videoDuration,
                                                     left: item.begin * state.barRangeWidth /
                                                         state.videoDuration,
                                                 }}>
                                                <div
                                                    onMouseDown={item.active
                                                                 ? (e) => this.startMoveBar(e,
                                                            'drag')
                                                                 : null}
                                                    className={`${styles.bar_range}`}
                                                    style={{
                                                        width: (item.end - item.begin) *
                                                            state.barRangeWidth /
                                                            state.videoDuration,
                                                    }}/>
                                                {item.active &&
                                                <React.Fragment>
                                                    <div onMouseDown={(e) => this.startMoveBar(e,
                                                        'start')} className={`${styles.bar}`}>
                                                        <span className={styles.slide_rect}/>
                                                    </div>
                                                    <div
                                                        onMouseDown={(e) => this.startMoveBar(e,
                                                            'end')}
                                                        className={`${styles.bar}`}
                                                        style={{
                                                            left: (item.end - item.begin) *
                                                                state.barRangeWidth /
                                                                state.videoDuration,
                                                        }}>
                                                        <span className={styles.slide_rect}/>
                                                    </div>
                                                </React.Fragment>
                                                }
                                            </div>,
                                        )}
                                    </div>
                                </Popover>
                            </div>
                        </div>
                        {state.barRangeWidth > sumWidth && <div className={styles.scrollBox}>
                            <div className={styles.scroll}>
                                <Popover content={contentScroll} placement='top'
                                         overlayClassName='distinguish'
                                         visible={state.visibleScroll}>
                                    <div onMouseDown={(e) => this.startMoveBar(e, 'scroll')}
                                         className={styles.scroll_move} style={{
                                        left: state.scrollLeft,
                                        width: scrollMoveWidth,
                                    }} ref={this.moveScroll}/>
                                </Popover>
                            </div>
                        </div>}
                    </div>
                </div>
                <Modal visible={state.openModal} onClose={this.onClose}
                       onCancel={this.closeChangeVideo}>
                    <ChangeVideo only_list={[0]} onClose={this.onClose}
                                 onChange={this.afterChangeVideo}/>
                </Modal>
            </React.Fragment>
        );
    }
}

Substitles.propTypes = {
    video: PropTypes.object,
};

export default Substitles;
