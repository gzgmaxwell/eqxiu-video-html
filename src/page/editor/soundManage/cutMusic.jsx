import React from 'react';
import PropTypes from 'prop-types';
import styles from './cutMusic.less';
import Icon from '../../components/Icon';
import VolumeSlider from '../../components/transition/volumeSlider';
import Button from '../../components/Button';
import { cutAudio, getCropResult } from '../../../api/music';
import { Message, message as antMessage } from 'antd';
import LoopRequest from '../../../services/loopRequest';
import loadingImg from '../../static/icon/loading.gif';
import Wavesurfer from './wavesurfer';
import ScrollBarController from '../../components/common/scrollBarController';
import ScaleController from '../bottom/timeLine/scaleController';

// 鼠标右键抬起事件
let upFunc = () => null;
// 拖动总宽度
let sumWidth = 0;
const minSeconds = 10;
const fourSeconds = 4;

class CutMusic extends React.Component {
    constructor(props) {
        super(props);
        const { audio } = this.props;
        this.wrap = React.createRef();
        this.content = React.createRef();
        this.audio = audio;
        audio.addEventListener('timeupdate', this.onTimeUpdate);
        this.wrapLeft = 0;
        this.contentLeft = 0;
        this.scrollOffset = 0;
        this.timer = null;
        if (!this.audio.duration) {
            audio.addEventListener('durationchange',
                () => this.setState({ audioDuration: audio.duration }));
        }
        this.state = {
            audioDuration: audio.duration,
            start: 0, // 剪切开始
            end: 1, // 剪切结束
            curPlayPos: 0, // 当前播放的位置
            playing: false, // 正在播放
            cutLoading: false,
            scale: 1,
        };
    }

    componentDidMount() {
        this.wrapLeft = this.wrap.current.getBoundingClientRect().x;
        this.contentLeft = this.content.current.getBoundingClientRect().x;
        sumWidth = this.wrap.current.clientWidth;
        this.handleEvent();
        this.setState({ isPadding: true });
        if (this.audio) {
            this.audio.loop = false;
            this.audio.addEventListener('ended', () => {
                this.onPause();
            });
        }
    }

    componentDidUpdate() {
        this.wrapLeft = this.wrap.current.getBoundingClientRect().x;
        this.contentLeft = this.content.current.getBoundingClientRect().x;
        sumWidth = this.wrap.current.clientWidth;
    }

    componentWillUnmount() {
        if (this.audio) {
            this.audio.pause();
        }
    }


    handleEvent = () => {
        const { state } = this;
        this.content.current.addEventListener('scroll', (e) => {
            const { scrollLeft } = e.target;
            this.scrollOffset = scrollLeft;
            this.setState({
                state: state.start,
            });
        });
    };

    onLoadedData = () => {
        this.audioDuration();
    };
    audioDuration = () => {
        const time = this.audio.duration;
        this.setState({
            audioDuration: time,
        });
    };
    /**
     *公共绑定事件
     * @param {function} func
     */
    commonBind = (func) => {
        upFunc = (event) => {
            this.cancelMove(event, func);
        };
        document.addEventListener('mousemove', func, { passive: true });
        document.addEventListener('mouseup', upFunc, { passive: true });
    };
    /**
     * 公共取消事件
     * @param e
     */
    cancelMove = (e, func) => {
        document.removeEventListener('mousemove', func);
        document.removeEventListener('mousemove', upFunc);
    };
    startMoveBar = (e, type) => {
        e.stopPropagation();
        e.preventDefault();
        this.audioDuration();
        if (type === 'left') {
            this.commonBind(this.moveLeft);
        } else if (type === 'right') {
            this.commonBind(this.moveRight);
        }
    };
    moveLeft = (e) => {
        this.pauseEnd();
        const { state: { end, audioDuration } } = this;
        const change = e.clientX - this.wrapLeft;
        let leftStart = change;
        if (leftStart < 0) return;
        if ((end - leftStart / sumWidth) <= 1 / audioDuration) {
            leftStart = (end - 1 / audioDuration) * sumWidth;
            this.setTimeoutTip();
        }
        this.setState({
            curPlayPos: leftStart / sumWidth,
            start: leftStart / sumWidth,
        }, () => {
            this.onPause();
        });
    };
    moveRight = (e) => {
        this.pauseEnd();
        const { state: { start, audioDuration } } = this;
        const change = e.clientX - this.wrapLeft;
        let leftEnd = change;
        if (leftEnd >= sumWidth) return;
        if ((leftEnd / sumWidth - start) <= 1 / audioDuration) {
            leftEnd = (start + 1 / audioDuration) * sumWidth;
            this.setTimeoutTip();
        }
        if (audioDuration / fourSeconds <= 1.019 && leftEnd > sumWidth) {
            leftEnd = sumWidth;
        }
        this.setState({
            curPlayPos: start / sumWidth,
            end: leftEnd / sumWidth,
        });
    };
    setTimeoutTip = () => {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            Message.warning('音频裁剪的最短时间是1秒', 1);
        }, 400);
    };
    onTimeUpdate = () => {
        const { state: { end, audioDuration } } = this;
        let curPlayPos = this.audio.currentTime / audioDuration;
        if (curPlayPos > end) {
            curPlayPos = end;
            this.pauseEnd();
            return;
        }

        this.setState({
            curPlayPos,
        });
    };
    play = () => {
        if (this.state.playing) {
            this.pauseEnd();
        } else {
            this.playStart();
        }
    };
    playStart = () => {
        const { start, audioDuration } = this.state;
        this.audio.currentTime = start * audioDuration;
        this.audio.play();
        this.setState({
            playing: true,
            curPlayPos: start,
        });
    };
    pauseEnd = () => {
        this.audio.pause();
        this.setState({
            playing: false,
        });
    };
    onPause = () => {
        const { state: { start, audioDuration } } = this;
        const curPlayPos = start;
        this.audio.currentTime = start * audioDuration;
        this.setState({
            curPlayPos,
            playing: false,
        });
    };

    requiredCut = async () => {
        const { state: { start, end, audioDuration, cutLoading }, props: { title, onChange, onBack = null, onClose } } = this;
        if (cutLoading) return;
        this.setState({ cutLoading: true });
        const duration = ~~((end - start) * audioDuration);
        const { src } = this.audio;
        let pathArr = src.split('//');
        if (pathArr.length > 1) {
            pathArr = pathArr[1].split('/');
        } else {
            pathArr = pathArr[0].split('/');
        }
        pathArr.shift();
        const path = pathArr.join('/');
        const { data: { success, obj } } = await cutAudio({
            path,
            duration,
            name: title,
            start: ~~(start * audioDuration),
        });
        if (!success || !obj) {
            antMessage.error('裁剪服务器异常，请稍后再试...');
        }
        // 裁剪时关闭声音
        if (this.audio && typeof this.audio.pause === 'function') {
            this.audio.pause();
        }
        if (obj) {
            const loopClass = new LoopRequest({
                requestFunc: getCropResult,
                params: [obj],
            });
            const newObj = await loopClass.run();
            if (newObj) {
                antMessage.success('裁剪成功');
                onChange(newObj);
            } else {
                antMessage.error('裁剪失败');
            }
        }
        this.setState({ cutLoading: false });
        return;

    };
    onChangeScale = (scale) => {
        this.setState({ scale });
    };

    render() {
        const { state, state: { scale }, props: { title, onClose, onBack = null } } = this;
        const { playing, cutLoading } = state;
        const width = state.end - state.start;
        const curPlayTime = state.curPlayPos * state.audioDuration;
        const formatCurPlayTime = moment(curPlayTime, 'X')
            .format('mm:ss');
        const startTime = state.start * state.audioDuration;
        const formatStartTime = moment(startTime, 'X')
            .format('mm:ss');
        const endTime = state.end * state.audioDuration;
        const formatEndTime = moment(endTime, 'X')
            .format('mm:ss');
        const audioDuration = moment(state.audioDuration, 'X')
            .format('mm:ss');
        const cutAfterTime = moment(width * state.audioDuration, 'X')
            .format('mm:ss');
        const outerStyle = onBack ? {} : {
            position: 'relative',
        };
        // 缩放尺度
        const max = state.audioDuration / fourSeconds;
        const min = 1;
        const scaleControllerProps = {
            id: 'time-scale-bar',
            value: scale,
            onChange: this.onChangeScale,
            min,
            max,
        };
        const isShownControllerBox = max > 1.019;
        const curPlayPos = state.curPlayPos * sumWidth - this.scrollOffset;
        const isLessFourSeconds = state.audioDuration <= fourSeconds;
        const isMoveDis = (state.end - state.start) * sumWidth < 45;
        return (
            <div className={styles.container} style={outerStyle}>
                {cutLoading && <div className={styles.loadingBody}>
                    <div>
                        <img src={loadingImg} alt='裁剪图标'/>
                    </div>
                    <span>裁剪中</span>
                </div>}
                <div className={styles.header}>
                    {onBack ?
                        <div onClick={onBack} className={styles.backWrap}>
                            <Icon
                                className={styles.eqf_left} type='eqf-left'/>
                            <span
                                className={styles.back}>返回
                        </span>
                        </div> :
                        <h2>音乐裁剪</h2>}
                    <Icon onClick={onClose} className={styles.eqf_no} type='eqf-no'/>
                </div>
                <div className={styles.center}>
                    <div className={styles.musicName}>
                        <div className={styles.tipBox}>
                            <VolumeSlider className={styles.icon} dynamic={playing}/>
                            <span>{title}</span>
                        </div>
                        <p className={styles.audioTime}>音频时长：{audioDuration}s</p>
                    </div>
                    <div className={styles.container}>
                        <div
                            className={`${styles.content} ${!isShownControllerBox ? styles.padding : ''}`}
                            ref={this.content}>
                            <div className={styles.wrap}
                                 ref={this.wrap}
                                 style={{ width: `${scale * 100}%` }}>
                                {state.playing &&
                                <div style={{
                                    // left: `${state.curPlayPos * 100}%`,
                                    transform: `translateY(-6px) translateX(${curPlayPos}px)`,
                                }}
                                     className={styles.currentTime}>
                                    <div className={styles.progress}>{formatCurPlayTime}</div>
                                </div>
                                }
                                <div style={{ left: `${state.start * 100}%` }}
                                     className={styles.leftMove}
                                     onMouseDown={(e) => this.startMoveBar(e, 'left')}>
                                    {!playing &&
                                    <div className={styles.time}
                                         style={{ left: isMoveDis ? '-30px' : '-10px' }}
                                        // style={{ transform: `translateY(-26px) translateX(${leftDis}px)` }}
                                    >
                                        {formatStartTime}
                                    </div>}
                                    <Icon className={styles.eqf_left} type='eqf-left'/>
                                </div>
                                <div style={{ left: `${state.end * 100}%` }}
                                     className={styles.rightMove}
                                     onMouseDown={(e) => this.startMoveBar(e, 'right')}>
                                    {!state.playing &&
                                    <div className={styles.time}
                                         style={{ left: isMoveDis ? '0px' : '-22px' }}
                                        // style={{ transform: `translateY(-26px) translateX(${rightDis}px)` }}
                                    >
                                        {formatEndTime}
                                    </div>}
                                    <Icon className={styles.eqf_right} type='eqf-right'/>
                                </div>
                                <div style={{
                                    left: `${state.start * 100}%`,
                                    width: `${width * 100}%`,
                                }} className={styles.slide}/>
                                <div className={styles.markLeft}/>
                                <div className={styles.markRight}/>
                                <Wavesurfer {...state} audio={this.audio}/>
                            </div>
                        </div>

                        {isShownControllerBox && <div className={styles.controllerBox}>
                            <div className={styles.scrollBarBox}>
                                {this.content.current &&
                                <ScrollBarController
                                    id={'time-scrollbar'}
                                    hideNoSize={false}
                                    element={this.content.current}
                                    axis={'x'}
                                    isPadding={1}
                                    scale={scale}/>
                                }
                            </div>
                            {!isLessFourSeconds && <div className={styles.scaleControllerBox}>
                                <ScaleController {...scaleControllerProps} />
                            </div>
                            }
                        </div>}
                        <div className={styles.cutAfterTime}>剪裁后音频时长：{cutAfterTime}s</div>
                    </div>
                </div>
                <div className={styles.foot}>
                    <Icon onClick={this.play} type={playing ? 'eqf-pause-f' : 'iconfont iconplay-f'}
                          className={playing ? styles.eqf_play_l : styles.eqf_play_l2}/>
                    <Button className={styles.requiredCut} onClick={this.requiredCut} value={'裁剪'}/>
                </div>
            </div>
        );
    }
}

CutMusic.propTypes = {
    audio: PropTypes.instanceOf(Audio).isRequired,
    title: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    onBack: PropTypes.func,
};


export default CutMusic;
