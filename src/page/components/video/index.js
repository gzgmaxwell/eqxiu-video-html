require('video.js/dist/video-js.css');
import React from 'react';
import videojs from 'video.js/dist/video.es';
import Util from 'Util/util';
import styles from './index.less';
// 载入汉化文件
window.videojs = videojs;
import('video.js/dist/lang/zh-CN');


const isOld = (Util.isChrome && Util.getChromeVersion() < 52) || (!Util.isChrome && Util.isSafari);

class Video extends React.PureComponent {

    constructor(props) {
        super(props);
        this.video = React.createRef();
        this.div = React.createRef();
    }

    state = {};


    componentDidMount() {
        if (this.props.src || this.state.src) {
            this.onInitVideo();
        }

    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.src !== this.props.src) {
            this.onInitVideo();
        }
    }

    videoOption = {
        autoplay: false,
        controls: true,
        poster: '',
        language: 'zh-CN',
        controlBar: {
          //控件排序
          children: [
            {
              name: 'playToggle'
            },
            {
                name: 'currentTimeDisplay'
            },
            {
                name: 'durationDisplay'
            },
            {
              name: 'progressControl'
            },
            {
              name: 'volumePanel',
              inline: false //声音控件竖着显示
            },
            {
              name: 'fullscreenToggle'
            }
          ]
        }
    };

    onInitVideo = () => {
        if (this.videoJs) {
            // 为了替换封面，销毁播放器再创建;
            this.videoJs.dispose();
            this.video.current.className = [
                'video-js',
                'vjs-default-skin',
                this.props.className].join(' ');
            if (this.props.coverImg) {
                this.video.current.poster = this.props.coverImg;
            }
            this.div.current.append(this.video.current);
        }
        this.videoJs = videojs(this.video.current,
            {
                ...this.videoOption,
                ...this.props,
                sources: {
                    src: this.props.src,
                    type: 'video/mp4',
                },
            },
            this.onPlayerReady);
        this.div.current.style.display = 'block';
    };

    onPlayerReady = () => {
        this.div.current.style.display = 'block';
    };

    componentWillUnmount() {
        if (this.videoJs && typeof this.videoJs.dispose === 'function') {
            this.videoJs.dispose();
        }
    }

    render() {
        const { props } = this;
        if (props.inref) {
            this.video = props.inref;
        }
        return (
            <div className={styles.player} ref={this.div}>
                <video  {...props}
                        crossOrigin='Anonymous'
                        className={['video-js', 'vjs-default-skin', props.className].join(' ')}
                        ref={props.inref || this.video}>
                </video>
            </div>);
    }
}

const oriVideo = (props) => {
    return <video  {...props} ref={props.inref}/>;
};

const Out = isOld ? oriVideo : Video;
export default React.forwardRef((props, ref) => <Out {...props} inref={ref}/>);
