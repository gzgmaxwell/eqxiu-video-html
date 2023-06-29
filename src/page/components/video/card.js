import React from 'react';
import Slider from '../../components/slider';
import styles from './card.less';

class Video extends React.PureComponent {

    constructor(props) {
        super(props);
        this.video = React.createRef();
    }

    state = {
        noPlayed: true,
        playing: false,
        onProgress: false,
        progress: 0,
    };

    componentDidMount() {
    }

    componentDidUpdate(prevProps, prevState) {
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
    play = (e) => {
        if (this.state.playing) {
            this.onPause();
        } else {
            this.onPlay();
        }
    };

    ontimeupdate = () => {
        const totalTime = this.video.current.duration;
        const nowTime = this.video.current.currentTime;
        this.setState({ progress: ~~(nowTime / totalTime * 100) });
    };
    onended = () =>{
        this.video.current.currentTime = 0
    }
    onChangeProgress = (value) => {
        this.setState({
            progress: value,
        });
        this.video.current.currentTime = value / 100 * this.video.current.duration;
    };
    onClick = (e) => {
        // e.preventDefault();
        // e.stopPropagation();
    };

    render() {
        const { state, props } = this;
        const { forwardedref } = props;
        if (forwardedref) {
            this.video = forwardedref;
        }
        return (
            <span className={styles.videoBox} onClick={this.onClick} style={props.style}>
                <video crossOrigin='Anonymous'
                       {...props} playing={props.playing ? String(props.playing) : undefined}
                       ref={forwardedref || this.video} onTimeUpdate={this.ontimeupdate} onEnded={this.onended}/>
                <div className={`${this.video.current && !this.video.current.noPlayed
                                   ? styles.barBox
                                   : styles.barBoxNone}`} style={{bottom:props.bottom ? '-51px':'-1px'}}>
                    <div className={styles.barBoxBg}>
                        <Slider value={state.progress}
                                tooltipVisible={false}
                                onChange={this.onChangeProgress}
                        />
                    </div>
                </div>
            </span>);
    }
}

export default React.forwardRef((props, ref) => <Video {...props} forwardedref={ref}/>);
