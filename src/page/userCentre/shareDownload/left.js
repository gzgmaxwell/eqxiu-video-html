import React from 'react';
import styles from './left.less';
import Video from '../../components/video/index';
import imageUtil from 'Util/image';
import { genVideoUrl } from '../../../util/file';
import AdvertShow from '../../components/advert/advertMy';
import { RENDER_STATUS, VIDEO_RENDER_TYPE } from '../../../config/staticParams';
import LogoGif from 'Static/logo.gif';
import { host } from 'Config/env';
import { cancelCoverImage, cancelRender, getUpdateCoverImageRender } from '../../../api/userVideo';
import { waitChoseModel } from '../../components/delete';
import { Message } from 'antd';
import eventEmitter from '../../../services/EventListener';

class Left extends React.PureComponent {
    constructor(props) {
        super(props);
        this.iframe_video = React.createRef();
        this.count = 1;
    }
    componentDidMount() {
        eventEmitter.on('showModal', this.sendMessagePause);
    }

    componentDidUpdate(prevProps, prevState) {
        const { props } = this;
        if (prevProps[`${props.shareType}_status`] !== this.props[`${props.shareType}_status`]) {
            this.props.onLoadDetail();
        }
        if (props.navActive === 'promote') {
            const video = this.iframe_video.current;
            if (video) {
                // 切换至新媒体推广页 通知暂停视频
                this.sendMessagePause();
            }
        }
        if (prevProps.coverImg !== this.props.coverImg && this.iframe_video.current) {
            this.iframe_video.current.contentWindow.location.reload();
        }
    }
    componentWillUnmount() {
        eventEmitter.removeListener('showModal', this.sendMessagePause);
    }

    onCancel = () => {
        const { props: { id, onLoadDetail, timerCoverImg } } = this;
        cancelCoverImage(id)
            .then((res) => {
                const { data } = res;
                if (data.success) {
                    Message.success('取消成功');
                    if (typeof onLoadDetail === 'function') {
                        setTimeout(onLoadDetail, 300);
                        timerCoverImg();
                    }
                }
            });
    }
    sendMessagePause = () => {
        const msgData = {
            type: 'pause',
            msg: '暂停视频播放',
        };
        setTimeout(() => {
            if (this.iframe_video.current) {
                this.iframe_video.current.contentWindow.postMessage(JSON.stringify(msgData), '*');
            }
        }, 200);
    }


    render() {
        const { props } = this;
        let articulation = '';
        if (props.shareType === VIDEO_RENDER_TYPE.SDWaterMark) {
            articulation = '标清有水印';
        } else if (props.shareType === VIDEO_RENDER_TYPE.SDNoWaterMark) {
            articulation = '标清无水印';
        } else {
            articulation = '高清无水印';
        }
        let isCoverImageUpdating = false;
        if (props.coverImageUpdating) {
            isCoverImageUpdating = true;
        } else {
            isCoverImageUpdating = false;
        }
        const videoStatus = props[`${props.shareType}_status`];
        let isShowAD = false;
        let progress = '0%';
        if (videoStatus === RENDER_STATUS.rendering) {
            progress = (props[`${props.shareType}_progress`] || 0).toFixed(1) + '%';
            isShowAD = true;
        } else if (videoStatus === RENDER_STATUS.success) {
            isShowAD = false;
        } else if (videoStatus === RENDER_STATUS.fail) {
            isShowAD = true;
            progress = '渲染失败,请关闭重试';
        } else if (videoStatus === RENDER_STATUS.cancelRendering && !props[`${props.shareType}_url`]) {
            isShowAD = true;
            progress = '渲染取消，请重新渲染';
        } else {
            isShowAD = false;
        }
        const shareUrl = `${host.preView.replace('player', 'inlinePlayer')}/0/${props.playCode}?onlyView=1`;
        const coverImgRenderProgress = props.coverImgRenderProgress || 0;
        return (
            <div className={styles.leftBox}>
                {
                    isShowAD &&
                    <React.Fragment>
                        <div className={styles.renderBox}>
                            {
                                videoStatus === RENDER_STATUS.rendering &&
                                <React.Fragment>
                                    <img src={LogoGif} />
                                    <p className={styles.progress}>{progress}</p>
                                    <p className={styles.rendering}>{articulation}视频预览生成中</p>
                                </React.Fragment>
                            }
                            <p className={styles.notice}>下载前请务必确认视频效果，修改后再下载需重新付费</p>
                            <p className={styles.tip}>关闭预览页或继续编辑将取消生成预览视频</p>
                        </div>
                        <AdvertShow isShowAD={isShowAD} />
                    </React.Fragment>
                }
                {
                    isCoverImageUpdating &&
                    <React.Fragment>
                        <div className={styles.renderBox}>
                            <img src={LogoGif} />
                            <p className={styles.progress}>{coverImgRenderProgress}%</p>
                            <p className={styles.rendering}>视频封面更新中</p>
                            <div onClick={this.onCancel} className={styles.cancelCoverImageUpdating}>取消</div>
                        </div>
                        <AdvertShow isShowAD={isShowAD} />
                    </React.Fragment>
                }
                {
                    (!isShowAD && !isCoverImageUpdating) &&
                    <React.Fragment>
                        <div className={styles.preBox}>
                            {
                                props.playCode &&
                                <iframe ref={this.iframe_video} src={shareUrl} width='480' height='480' allowFullScreen />
                            }
                        </div>
                        <p className={styles.timeInfo}>
                            <span>{moment(props.createTime)
                                .format('YYYY年MM月DD日')}</span>
                            <span>{moment(props.videoDuration, 'X')
                                .format('mm:ss')}</span>
                        </p>
                    </React.Fragment>
                }
            </div>
        );
    }
}


export default Left;
