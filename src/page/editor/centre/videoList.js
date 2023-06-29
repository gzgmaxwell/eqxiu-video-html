import React from 'react';
import styles from './videoList.less';
import Slider from '../../components/slider';
import Icon from '../../components/Icon';
import MultipleVideo from '../../../services/multipleVideo';

class VideoList extends React.PureComponent {
    constructor(props) {
        super(props);
    }

    state = {
        playing: false,// 正在播放
        progress: 0, // 播放进度
        volume: 100, // 声音大小
        videoList: [], //
        nowTime: '00:00', // 目前的播放时间位置
        totalTime: '00:00', // 目前的播放的总时间
        muted: false, // 过来的声音是否是静音
        MVideo: {}, // 实例化video 对象
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        const newState = {};
        const { videoList } = nextProps;
        if (nextProps.videoList.length === 0) {
            newState.videoList = videoList;
        }
        return newState;
    }

    componentDidUpdate(prevProps, prevState) {
        const { props: { videoList } } = this;
        if (prevProps.videoList.length !== videoList.length) {
            this.MVideo = new MultipleVideo(videoList);
            this.MVideo.addEventListener('timeupdate', this.onTimeUpdate);
        }
    }

    componentWillUnmount() {
        this.MVideo.removeEventListener('timeupdate', this.onTimeUpdate);
        this.dispose();
    }


    dispose = () => {
        if (this.MVideo) {
            this.MVideo.dispose();
            this.MVideo = null;
        }
    };

    onTimeUpdate = () => {
        const { MVideo, props: { onTimeUpdate = null } } = this;
        if (this.MVideo) {
            this.setState({
                nowTime: this.MVideo.currentTime,
                totalTime: this.MVideo.duration,
                volume: this.MVideo.volume,
                progress: this.MVideo.progress,
                muted: this.MVideo.muted,
                playing: this.MVideo.playState,
            });
            if (typeof onTimeUpdate === 'function') {
                onTimeUpdate(MVideo);
            }
        }
    };


    playOrPause = (e) => {
        e.stopPropagation();
        if (this.state.playing) {
            this.props.stroke(false);
            this.pause(e);
        } else {
            this.play(e);
        }
    };
    pause = (e) => {
        this.MVideo.pause();
        this.setState({
            playing: false,
        });
        if(typeof this.props.setAnimationState === 'function') {
            this.props.setAnimationState('paused');
        }
    };
    play = (e) => {
        if (this.MVideo) {
            this.MVideo.play();
            this.props.stroke(true);
        }
        if(typeof this.props.setAnimationState === 'function') {
            this.props.setAnimationState('running');
        }
    };
    changeCurrentTime = (currentTime) => {
        if (this.MVideo) {
            this.MVideo.currentTime = currentTime;
        }
    };

    onPlay = (e) => {
        if (!this.MVideo) return;
        this.props.stroke(true);
        this.setState({ playing: true });
        if(typeof this.props.setAnimationState === 'function') {
            this.props.setAnimationState('running');
        }
    };
    onPause = (e) => {
        if (!this.MVideo) return;
        this.props.stroke(false);
        this.setState({
            playing: false,
        });
        if(typeof this.props.setAnimationState === 'function') {
            this.props.setAnimationState('paused');
        }
    };
    onChangeProgress = (value) => {
        if (!this.MVideo) return;
        this.MVideo.progress = value;
        this.setState({ progress: value });
        if(typeof this.props.jump === 'function') {
            this.props.jump();
        }
    };
    onChangeVolumeProgress = (value) => {
        if (!this.MVideo) return;
        if (value === 0) {
            this.setState({
                muted: true, // 静音
            });
        } else {
            this.setState({
                muted: false,// 最大音量
            });
        }
        this.MVideo.volume = value / 100;
        this.setState({
            volume: value,
        });
    };
    handleClick = (e) => {
        e.stopPropagation();
    };
    handleClickMuted = (e) => {
        e.stopPropagation();
        if (this.state.muted) {
            this.setState({
                muted: false,// 最大音量
            });
            this.onChangeVolumeProgress(100);
        } else {
            this.setState({
                muted: true,// 静音
            });
            this.onChangeVolumeProgress(0);
        }
    };

    render() {
        const { state, props: { visible = false } } = this;
        const playBtn = state.playing ? 'eqf-pause' : 'eqf-play';
        const muted = state.muted ? 'eqf-volume-off' : 'eqf-volume-high';
        let nowTime = moment(state.nowTime, 'X')
            .format('mm:ss');
        let totalTime = moment(state.totalTime, 'X')
            .format('mm:ss');
        return (
            <React.Fragment>
                <div className={styles.videoHandleBox} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.progressBox} onClick={(e) => this.handleClick(e)}>
                        <Slider tipFormatter={null} value={state.progress}
                                onChange={this.onChangeProgress}/>
                    </div>
                    <div className={styles.showBox}
                         style={visible === true ? { display: 'block' } : {}}>
                        <div className={styles.operateBox}>
                            <div
                                className={styles.position}
                                onClick={this.playOrPause}
                            ><Icon type={playBtn}
                                   className={styles.eqf_play}/>
                                <span
                                    className={styles.passPlay}>{nowTime}</span> <span
                                    className={styles.willPlay}>/ {totalTime}</span></div>
                            <div className={styles.position}>
                                <div onClick={(e) => this.handleClickMuted(e)}
                                     className={styles.eqf_volume_highBox}><Icon type={muted}
                                                                                 className={styles.eqf_volume_high}/>
                                </div>
                                <div className={styles.volumeShowBox}>
                                    <div className={styles.volumeBox}
                                         onClick={(e) => this.handleClick(e)}>
                                        <div
                                            className={styles.volumNumber}>{state.volume}</div>
                                        <Slider tipFormatter={null} vertical
                                                value={state.volume}
                                                onChange={this.onChangeVolumeProgress}/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
    }
}

export default VideoList;




