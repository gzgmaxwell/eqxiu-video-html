import React from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { prev } from 'Config/env';
import Icon from 'Components/Icon';
import Button from 'Components/Button/index';
import Modal from 'Components/modal';
import imageUtil from 'Util/image';
import VideoPlayButton from '../../components/Button/VideoPlayButton';
import { genVideoUrl } from '../../../util/file';
import Video from '../../components/video/card';


const sizeArray = {
    hoz: {
        videoWidth: 256,
        videoHeight: 144,
    },
    ver: {
        videoWidth: 126,
        videoHeight: 224,
    },
};

@connect()
class Card extends React.PureComponent {

    constructor(props) {
        super(props);
        this.video = React.createRef();
    }

    state = {
        noPlayed: true,
        playing: false,
        onProgress: false,
        changeConfirm: false,
    };
    /**
     * 点击使用模板，显示弹窗
     */
    onChangeTemplate = () => {
        this.setState({ changeConfirm: true });
    };

    /**
     * 点击弹窗确认的时候 改变模板
     */
    trueChange = () => {
        if (typeof (this.props.onChange) === 'function') {
            this.props.onChange(this.props.id);
        } else {
            window.open(`${prev}/editor/${this.props.id}`);
        }
        this.setState({ changeConfirm: false });
    };
    /**
     * 取消改变模板
     */
    onCancel = () => {
        this.setState({ changeConfirm: false });
    };
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

    render() {
        const { state, props } = this;
        const timeLong = moment(props.videoDuration, 'X')
            .format('mm:ss');
        const styles = props.styles;
        const styleObj = sizeArray[props.type];
        const videoStyle = state.noPlayed ? { display: 'none' } : { display: 'block' };
        return (
            <div className={`${styles.Card} index-Card`} style={props.style}>
                <div className={styles.video_div}>
                    <span key='price' className={styles.priceSpan}>{props.price || '免费'}</span>
                    {state.noPlayed && [
                        <img key='img' src={imageUtil.genUrl(props.coverImg, '256:224')}/>,
                    ]}
                    <div>
                        {!state.playing && [
                            <div key={'shade'} onClick={this.play}
                                 className={`${styles.video_shade} ${styles.video_button}`}/>,
                            <div key={'button_div'} onClick={this.play}
                                 className={`${styles.video_button}`}>
                                <VideoPlayButton className={styles.video_icon} />
                            </div>]}
                        <Video
                            onClick={this.play}
                            ref={this.video}
                            preload='none'
                            height={styleObj.videoHeight}
                            width={styleObj.videoWidth}
                            style={videoStyle}
                            className={` ${styles.video}`}
                            controls={false}
                            poster={imageUtil.genUrl(props.coverImg, '256:224')}
                            onPlay={this.onPlay}
                            onPause={this.onPause}
                            onProgress={this.onProgress}
                            onWaiting={this.onProgress}
                            onEnded={this.onEnd}
                        >
                            <source src={genVideoUrl(props.previewUrl)}/>
                        </Video>
                    </div>
                </div>
                <div className={styles.useDiv}>
                    <Button className={styles.useButton}
                            onClick={this.onChangeTemplate}>立即使用</Button>
                </div>
                <div className={styles.title}>{props.title}</div>
                <div className={styles.info}>
                    <span className={styles.durationSpan}><Icon type='eqf-clock-f'/>&nbsp;{timeLong}</span>
                </div>
                <Modal visible={state.changeConfirm} onCancel={this.onCancel}
                       className={styles.changeTempModal}>
                    <div style={{ paddingTop: 30 }}>
                        <Icon type='eqf-why-f' style={{
                            color: '#ffb243',
                            marginRight: 5,
                        }}/> 切换模板会丢失已有的改变，是否继续？
                    </div>
                    <div className={styles.changeTempModalFoot}>
                        <Button onClick={this.onCancel}>取消</Button>
                        <Button onClick={this.trueChange}>确定</Button>
                    </div>
                </Modal>
            </div>
        );
    }
}

export default Card;
