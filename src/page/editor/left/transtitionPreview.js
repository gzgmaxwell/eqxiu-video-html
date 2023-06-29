import React, { PureComponent } from 'react';
import { connect } from 'dva';
import styles from './transtitionPreview.less';
import { WORKSPACE_SIZE } from '../../../config/staticParams';
import PreviewVideo from './previewVideo';
import Transition from '../../components/video/transition';
import Loading from '../../components/loading';

@connect(({ workspace, editor, canvas, headAndTail }) => ({
    workspace,
    editor,
    canvas,
    headAndTail,
}))
class TransitionPreview extends PureComponent {
    constructor(props) {
        super(props);
        this.totalDuration = 3000; // 总预览时长3秒
        this.waitingDuration = (this.totalDuration - props.duration) / 2; // 等待时长
        this.interval = null; // 定时器
        this.canvasReady = null;
        this.nextPlaying = false; // 下一个片段开始播放
        this.beginTime = 0;
        this.rePlay = false; // 是否是重放
    }

    state = {
        time: 0,
        prevVideo: null,
        nextVideo: null,
        prevDuration: 4,
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        const newState = {};
        const { canvas: { loadingObj }, editor: { parties }, workspace: { uuid }, partyIndex } = nextProps;
        const { renderSetting: { segmentPartyDuration: prevDuration } = {} } = (parties[partyIndex -
        1] || {});
        newState.prevDuration = prevDuration;
        const isLoading = loadingObj[uuid] === true;
        if (isLoading !== prevState.drawCanvas) {
            newState.drawCanvas = isLoading;
        }
        return newState;
    }

    componentDidMount() {
    }

    componentDidUpdate() {
        const { state: { time, nextVideo, prevVideo, prevDuration }, props: { duration = 400 }, nextPlaying } = this;
        if (this.getCanvasReady() && !this.interval) {
            this.handlerPlay();
        }
        if (time >= this.waitingDuration && nextVideo && !nextPlaying) {
            nextVideo.play();
            this.nextPlaying = true;
        }
    }

    componentWillUnmount() {
        this.cancelRender();
        this.setState({
            prevVideo: null,
            nextVideo: null,
        });
    }

    componentDidCatch(e) {
        console.log(e);
    }

    cancelRender = () => {
        cancelAnimationFrame(this.interval);
        this.interval = null;
    };
    handlerPlay = () => {
        const renderVideo = (animationTime) => {
            if (!this.interval && !this.rePlay) return;
            const { time, nextVideo, prevVideo } = this.state;
            if (time > this.totalDuration) {
                clearInterval(this.interval);
                this.nextPlaying = false;
                this.interval = null;
                prevVideo.play();
                this.beginTime = performance.now();
                nextVideo.pause();
                nextVideo.changeCurrentTime(0);
                this.rePlay = true;
                this.setState({
                    time: 0,
                });
            } else {
                const playTime = performance.now() - this.beginTime;
                this.setState({ time: playTime });
                this.interval = requestAnimationFrame(renderVideo);
            }
        };
        if (!this.interval) {
            this.beginTime = performance.now();
            this.interval = requestAnimationFrame(renderVideo);
        }
    };
    /**
     * 设置上一个片段的
     * @param nextVideo
     */
    onPrevRef = (prevVideo) => {
        this.setState({ prevVideo });
    };
    /**
     * 设置下一个片段的
     * @param nextVideo
     */
    onNextRef = (nextVideo) => {
        this.setState({ nextVideo });
    };
    /**
     * 判断Canvas是否准备好
     * @returns boolean
     */
    getCanvasReady = () => {
        const { state: { prevVideo, nextVideo } } = this;
        return prevVideo && !prevVideo.state.drawCanvas && nextVideo && !nextVideo.state.drawCanvas;
    };

    render() {
        const {
            state: { time, prevVideo, nextVideo, prevDuration },
            props,
        }
            = this;
        const { editor: { transverse, parties }, type, duration, partyIndex = null } = props;
        // 获取按钮
        const bodyStyle = { // 外框的属性
            width: transverse ? WORKSPACE_SIZE.l : WORKSPACE_SIZE.s,
            height: transverse ? WORKSPACE_SIZE.s : WORKSPACE_SIZE.l,
        };
        const prevCurrentTime = prevDuration - (this.waitingDuration + duration) / 1000;
        const progress = Math.min(Math.max((time - this.waitingDuration) / duration, 0), 1);
        const isTail = partyIndex === 'tail';
        const preIndex = isTail ? parties.length - 1 : partyIndex - 1;
        return (
            <div className={styles.video__content} style={bodyStyle}>
                <div className={styles.videoGroup}>
                    <PreviewVideo visible={true} partyIndex={preIndex}
                                  currentTime={prevCurrentTime}
                                  onRef={this.onPrevRef}/>
                    <PreviewVideo visible={true} autoPlay={false} partyIndex={partyIndex}
                                  onRef={this.onNextRef}/>
                </div>
                {(this.rePlay || (time > 0 && this.getCanvasReady())) ?
                    <Transition from={prevVideo.canvas.current}
                                to={nextVideo.canvas.current} transverse={transverse}
                                type={type} progress={progress}/>
                    : <Loading
                        title={'正在生成转场，请稍等...'}/>}
            </div>
        );
    }
}

export default TransitionPreview;
