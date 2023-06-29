import React from 'react';
import { connect } from 'dva';
import Icon from '../../../components/Icon';
import stylesCommon from './index.less';
import Button from 'Components/Button/index';
import { prev } from 'Config/env';
import { genUrl } from '../../../../util/image';
import { routerRedux } from 'dva/router';
import { genVideoUrl } from '../../../../util/file';
import VideoPlayButton from '../../../components/Button/VideoPlayButton';
import Video from '../../../components/video/card';

@connect(({ editor }) => ({ editor }))
class Card extends React.PureComponent {
    constructor(props) {
        super(props);
        this.video = React.createRef();
    }

    state = {
        direction: '',
        noPlayed: true,// 播放状态
        playing: false,// 正在播放
    };
    play = () => {
        if (this.state.playing) {
            this.onPause();
        } else {
            this.onPlay();
        }
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
    onUserTemplate = () => {
        this.props.dispatch({
            type: 'editor/addParty',
            payload: {
                id: this.props.id,
                type: 1,
            },
        });
        this.props.onClose();
    };

    render() {
        const { state, props } = this;
        state.direction = props.direction;
        let timeLong = moment(props.videoDuration, 'X')
            .format('mm:ss');
        const videoStyle = state.playing ? { display: 'none' } : { display: 'block' };
        const withCard = state.direction === 'hoz' ? '250' : '140px';
        const heightCard = state.direction === 'hoz' ? '132px' : '248px';
        const cardBoxMarginLeft = state.direction === 'hoz' ? '7px' : '6px';
        return (
            <div className={`${stylesCommon.cardSingleBox} index-Card`}
                 style={{ marginLeft: cardBoxMarginLeft }}>
                <div className={stylesCommon.cardSingleVideoBox} style={{
                    width: withCard,
                    height: heightCard,
                }} onClick={this.play}>
                    <Video
                        onClick={this.play}
                        ref={this.video}
                        controls={false}
                        onPlay={this.onPlay}
                        onPause={this.onPause}
                        style={{
                            width: withCard,
                            height: heightCard,
                        }}
                        poster={genUrl(props.coverImg, '236:248')}
                        src={genVideoUrl(props.previewUrl)}/>
                    <div className={stylesCommon.playBtn} style={videoStyle}>
                        <VideoPlayButton className={stylesCommon.playIcon}/>
                    </div>
                </div>
                <div className={stylesCommon.cardSingleDetailBox} style={{ width: withCard }}>
                    <div className={stylesCommon.cardSingleDetailMain}>
                        <div className={stylesCommon.cardSingleDetailTitle}>{props.title}</div>
                        <div className={stylesCommon.cardSingleDetailFreeBox}>
                            <span className={stylesCommon.cardSingleDetailFree}>{props.price ||
                            '免费'}</span>
                            <span className={stylesCommon.cardSingleDetailTime}> <Icon
                                type='eqf-clock-f'/>&nbsp;{timeLong}</span>
                        </div>
                    </div>
                    <div className={stylesCommon.cardSingleDetailBtn}>
                        <Button className={stylesCommon.useButton}
                                onClick={this.onUserTemplate}>立即使用</Button>
                    </div>
                </div>
            </div>
        );
    }
}

export default Card;
