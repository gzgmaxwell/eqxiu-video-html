import React from 'react';
import { connect } from 'dva';
import Icon from '../../../../components/Icon';
import stylesCommon from './index.less';
import Button from 'Components/Button/index';
import { prev } from 'Config/env';
import { genUrl } from '../../../../../util/image';
import { routerRedux } from 'dva/router';
import { genVideoUrl } from '../../../../../util/file';
import VideoPlayButton from '../../../../components/Button/VideoPlayButton';
import Video from '../../../../components/video/card';
import { CANVAS_TYPE } from '../../../../../config/staticParams';

@connect(({ editor }) => ({ editor }))
export default class Card extends React.PureComponent {
    constructor(props) {
        super(props);
        this.video = React.createRef();
    }

    state = {
        direction: '',
        noPlayed: true, // 播放状态
        playing: false, // 正在播放
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
        const {onChange} = this.props;
        if (typeof onChange === 'function'){
            onChange()
        } else{
            this.props.dispatch({
                type: 'workspace/insertVideo',
                payload: {
                    id: this.props.id,
                    type: CANVAS_TYPE.templateVideo,
                },
            });
        }
    };
    mouseEnter = (data) => {
        const { props: { handleMouseEnter } } = this;
        handleMouseEnter(data);
    };
    mouseLeave = () => {
        const { props: { handleMouseLeave } } = this;
        handleMouseLeave();
    };

    render() {
        const { state, props } = this;
        state.direction = props.direction;
        let timeLong = moment(props.videoDuration, 'X')
            .format('mm:ss');
        const withCard = state.direction === 'hoz' ? '124px' : '80px';
        const cardBoxMarginLeft = state.direction === 'hoz' ? '12px' : '10px';
        const hozVer = state.direction === 'hoz' ? '124:116' : '80:188';
        const imageClass = state.direction === 'hoz' ? stylesCommon.hozImg : stylesCommon.verImg;
        return (
            <div
                onMouseEnter={() => this.mouseEnter(props)}
                onMouseLeave={() => this.mouseLeave()}
                onClick={this.onUserTemplate}
                className={`${stylesCommon.cardSingleBox}`}
                style={{ marginLeft: cardBoxMarginLeft }}>
                <div className={stylesCommon.cardSingleVideoBox}>
                    <img src={genUrl(props.coverImg, hozVer)} className={imageClass} alt=""/>
                    <div className={stylesCommon.mark}></div>
                </div>
                <div className={stylesCommon.cardSingleDetailBox} style={{ width: withCard }}>
                    <div className={stylesCommon.cardSingleDetailTitle}>{props.title}</div>
                    <div className={stylesCommon.cardSingleDetailFreeBox}>
                            <span className={stylesCommon.cardSingleDetailFree}>{props.price ||
                            '免费'}</span>
                        <span className={stylesCommon.cardSingleDetailTime}>{timeLong}</span>
                    </div>
                    <div className={stylesCommon.line}></div>
                </div>
            </div>
        );
    }
}

