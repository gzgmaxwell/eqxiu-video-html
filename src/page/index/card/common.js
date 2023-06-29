import React from 'react';
import { routerRedux } from 'dva/router';
import Icon from 'Components/Icon';
import Button from 'Components/Button/index';
import { prev } from 'Config/env';
import imageUtil from 'Util/image';
import VideoPlayButton from '../../components/Button/VideoPlayButton';
import Video from '../../components/video/card';
import { genVideoUrl } from '../../../util/file';

const sizeArray = {
    hoz: {
        videoWidth: 285,
        videoHeight: 160,
    },
    ver: {
        videoWidth: 285,
        videoHeight: 507,
    },
};

class Card extends React.PureComponent {
    constructor(props) {
        super(props);
        this.outer = React.createRef();
        this.video = React.createRef();
    }

    state = {
        noPlayed: true,
        playing: false,
        onProgress: false,
    };

    componentDidMount() {
        setTimeout(() => {
            if (this.outer.current) {
                this.outer.current.classList.add('scale-enter-done');
            }
        }, 300);
    }

    onPlay = () => {
        this.video.current.play();
        this.setState({
            noPlayed: false,
            playing: true,
        });
    };
    onPause = () => {
        this.video.current.pause();
        this.setState({ playing: false });
    };
    onProgress = () => {
        this.setState({ onProgress: true });
    };
    play = () => {
        if (this.state.playing) {
            this.onPause();
        } else {
            // 大数据埋点
            const bigDataParams = {
                e_t: 'page_view',
                b_t: 'default',
                scene_id: `vt-${this.props.id}`,
            };
            if (window._tracker_api_ && typeof window._tracker_api_.report === 'function') {
                window._tracker_api_.report(bigDataParams);
            }
            this.onPlay();
        }
    };
    onEnd = () => {
        this.setState({
            playing: false,
            noPlayed: true,
        });
        this.video.current.currentTime = 0;
    };
    onUserTemplate = () => {
        this.props.onChose(this.props.id);
        // window._eqx_dispatch(routerRedux.push({ pathname: `${prev}/detail/${this.props.id}` }));
    };

    render() {
        const { state, props } = this;
        const { styles } = props;
        const styleObj = sizeArray[props.type];
        const timeLong = moment(props.videoDuration, 'X')
            .format('mm:ss');
        const videoStyle = state.noPlayed ? { display: 'none' } : { display: 'block' };
        return (
            <div className={`${styles.Card} index-Card`} ref={this.outer} style={props.style}>
                <div className={styles.video_div}>
                    {state.noPlayed && <img src={imageUtil.genUrl(props.coverImg, '570:1014')}/>}
                    <div>
                        {!state.playing && [
                            <div key={'shade'} onClick={this.play}
                                 className={`${styles.video_shade} ${styles.video_button}`}/>,
                            <div key={'button_div'} onClick={this.play}
                                 className={`${styles.video_button}`}>
                                <VideoPlayButton className={styles.video_icon}/>
                            </div>]}
                        <Video
                            onClick={this.play}
                            ref={this.video}
                            width={styleObj.videoWidth}
                            height={styleObj.videoHeight}
                            preload='none'
                            style={videoStyle}
                            className={` ${styles.video}`}
                            controls={false}
                            poster={imageUtil.genUrl(props.coverImg, '360:600')}
                            onPlay={this.onPlay}
                            onPause={this.onPause}
                            onProgress={this.onProgress}
                            onWaiting={this.onProgress}
                            onEnded={this.onEnd}
                        >
                            <source src={genVideoUrl(props.videoComposeUrl || props.previewUrl)}/>
                        </Video>
                    </div>
                </div>
                <div className={styles.useDiv}>
                    <Button className={styles.useButton} onClick={this.onUserTemplate}>立即使用</Button>
                </div>
                <div className={styles.titleBlock}>
                    <div className={styles.title}>{props.title}</div>
                    <div className={styles.pv}>
                        <Icon type='eqf-eye-f'/>{props.pv}
                    </div>
                </div>
                <div className={styles.info}><span className={styles.priceSpan}>{props.price ||
                '免费'}</span>
                    <span className={styles.durationSpan}>{timeLong}</span>
                </div>
            </div>
        );
    }
}

export default Card;
