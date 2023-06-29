import React from 'react';
import styles from './rightEditor.less';
import { genUrl } from '../../../util/image';
import env from 'Config/env';
import Icon from '../../components/Icon';
import { connect } from 'dva';
import eventEmitter from '../../../services/EventListener';
import { VIDEO_COLOR } from '../../../config/staticParams';
import t2vloading from '../../static/loadingGif.gif';

import DragPictures from './pictures';
import Music from './music';

@connect(({ flash }) => ({ flash }))
class RightEditor extends React.Component {
    constructor(props) {
        super(props);
        this.video = React.createRef();
        this.shouldPlay = false;
        this.state = {
            playing: false, // 播放状态
            activeSpeed: 2, // 激活状态
            videoColor: [], // 视频配色
            loading: true, // 视频加载
            //tab标题
            navTitle: [{
                title: '效果',
                active: true //默认激活效果
            },{
                title: '我的图片',
                active: false
            },{
                title: '快闪音乐',
                active: false
            }]
        };
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        const newState = { videoColor: [...prevState.videoColor] };
        if (prevState.activeSpeed !== nextProps.flash.speed) {
            newState.activeSpeed = nextProps.flash.speed;
        }
        if (prevState.videoColor !== nextProps.flash.colorTypes) {
            newState.videoColor = [...(nextProps.flash.colorTypes).map(Number)];
        }
        return newState;
    }
    componentDidMount() {
        const { navTitle } = this.state;
        let arr = Object.assign(navTitle);
        eventEmitter.on('addFlashImgTabActive', () => {
            arr[0].active = false;
            arr[1].active = true;
            this.setState({
                navTitle: arr 
            })
        });
    }
    play = () => {
        if (this.state.playing) {
            this.startPause();
        } else {
            this.startPlay();
        }
    };
    startPause = () => {
        this.video.current.pause();
        this.setState({ playing: false });
    };

    startPlay = () => {
        this.video.current.play();
        this.setState({ playing: true });
    };
    onPlay = () => {
        this.setState({ playing: true });
    };
    onPause = () => {
        this.setState({ playing: false });
    };
    choiceSpeed = (e, data) => {
        const { playing } = this.state;
        if (playing) {
            this.shouldPlay = true;
        }
        this.setState({
            activeSpeed: data.value,
        });
        this.props.dispatch({
            type: 'flash/speed',
            payload: {
                speed: data.value,
            },
        });

    };
    onLoadedData = () => {
        if (this.shouldPlay) {
            this.shouldPlay = false;
            this.setState({ playing: false }, () => {
                this.play();
            });
        }
        this.setState({ loading: false });
    };
    onWaiting = () => {
        if (this.state.playing) {
            this.setState({ loading: true });
        }
    };
    choiceColor = (e, data) => {
        const { state: { videoColor } } = this;
        const newVideoColor = [...videoColor];
        if (videoColor.includes(data.value)) {
            if (newVideoColor.length === 1) return; // 最少一个判断
            newVideoColor.splice(newVideoColor.findIndex(item => item === data.value), 1);
        } else {
            newVideoColor.push(data.value);
        }
        this.setState({ videoColor: newVideoColor });
        this.props.dispatch({
            type: 'flash/colorTypes',
            payload: {
                colorTypes: newVideoColor,
            },
        });
    };

    /**
     * tab切换
     * @param index 当前下标
     */
    navSwitch = (index) => {
        const { state: { navTitle } } = this;
        let arr = Object.assign(navTitle);
        arr.map((item, idx) => {
            item.active = false;
            arr[index].active = true;
        });
        this.setState({
            navTitle: arr
        });

    };
    render() {
        const { state } = this;
        let videoSrc = '';
        if (state.activeSpeed === 0) {
            videoSrc = ['pre', 'pro'].includes(env.name) ?
                       genUrl(
                           '/tencent/cf2cefbed1254294893230aff00d522a/mceEh2XNchvGZHWHHQB_mp4.mp4')
                                                         : genUrl(
                    '/tencent/29bcb45ed60248c4bc8d5cdfc8f99976/5mzVDXNjaErAbaoLjA1_mp4.mp4');
        } else if (state.activeSpeed === 1) {
            videoSrc = ['pre', 'pro'].includes(env.name) ?
                       genUrl(
                           '/tencent/cf2cefbed1254294893230aff00d522a/WxTMmBAmzXWVVale9Ne_mp4.mp4')
                                                         : genUrl(
                    '/tencent/29bcb45ed60248c4bc8d5cdfc8f99976/DmNQ4cfscWJiQcHeraF_mp4.mp4');
        } else if (state.activeSpeed === 2) {
            videoSrc = ['pre', 'pro'].includes(env.name) ?
                       genUrl(
                           '/tencent/cf2cefbed1254294893230aff00d522a/XHDzWnZ7CAbFgpQlZLt_mp4.mp4')
                                                         : genUrl(
                    '/tencent/29bcb45ed60248c4bc8d5cdfc8f99976/zww9zzd6a8hcQphghs0_mp4.mp4');
        }
        const playPause = state.playing ? 'eqf-pause-f' : 'eqf-play-f';
        const videoStyle = !state.playing ? { display: 'block' } : { display: 'none' };

        const speedObject = [
            {
                name: '较慢',
                type: 'slow',
                value: 0,
            }, {
                name: '一般',
                type: 'normal',
                value: 1,
            }, {
                name: '较快',
                type: 'fast',
                value: 2,
            }];
        return (
            <div className={styles.body}>
                <div className={styles.nav}>
                    {
                        state.navTitle.map((nav, index) => (
                            <div 
                                key={index}
                                className={`${styles.navTitle} ${nav.active ? styles.activeNav : ''}`}
                                onClick={() => this.navSwitch(index)}
                            >{nav.title}</div>
                        ))
                    }
                </div>
                {
                    state.navTitle[0].active ? 
                    <div className={styles.wrap}>
                        <p className={styles.rhythm}>调整节奏</p>
                        <div className={styles.exampleWrap} onClick={this.play}>
                            <div className={styles.tag}>示例</div>
                            <video
                                ref={this.video}
                                onPause={this.onPause}
                                onPlay={this.onPlay}
                                onCanPlay={this.onLoadedData}
                                onWaiting={this.onWaiting}
                                onLoadStart={this.onWaiting}
                                className={styles.video}
                                src={videoSrc}/>
                            <Icon type={playPause}
                                style={videoStyle}
                                className={styles.playPause}/>
                            {state.loading && <div className={styles.t2vloadingwrap}>
                                <img width='20' src={t2vloading} className={styles.t2vloading}/>
                            </div>}
                        </div>
                        <div className={styles.speed}>
                            {speedObject && speedObject.map((v, i) =>
                                <div key={i}
                                    onClick={(e) => this.choiceSpeed(e, v)}
                                    className={`${styles.speedValue} ${state.activeSpeed === i
                                                                        ? styles.activeSpeed
                                                                        : ''}
                                    ${state.activeSpeed === (i - 1)
                                    ? styles.borderLeft
                                    : ''}`}>{v.name}</div>)}
                        </div>
                        <p className={styles.addColor}>视频配色(可多选)</p>
                        <div className={styles.colorWrap}>
                            {VIDEO_COLOR && VIDEO_COLOR.map((v, i) =>
                                <div key={i}
                                    className={styles.list}
                                    onClick={(e) => this.choiceColor(e, v)}>
                                    <img src={v.url} alt="" width='104' height='104'/>
                                    {state.videoColor.includes(i) && <div className={styles.yesBox}>
                                        <Icon type='eqf-yes' className={styles.eqfYes}/>
                                    </div>}
                                </div>,
                            )}
                        </div>
                    </div> : state.navTitle[1].active ? <DragPictures /> : <Music />
                }
            </div>
        );
    }
}

export default RightEditor;
