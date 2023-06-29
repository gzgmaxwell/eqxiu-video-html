import React, { useRef, useEffect, useState } from 'react';
import { connect } from 'dva';
import logoGif from 'Static/logo.gif';
import ResizeComponent, { needProperty as resizeNeedProperty } from '../../../components/resizeComponent';
import styles from './video.less';
import { genUrl } from '../../../../util/image';
import {
    CANVAS_TYPE,
    DEFAULT_ELE_BACKGROUND_COLOR,
    WORKSPACE_Z_INDEX,
} from '../../../../config/staticParams';
import Icon from '../../../components/Icon';
import { getImgInfoByQiNiu } from '../../../../api/upload';
import { makeCancelable } from '../../../../util/request';

import { initElementProps } from '../workspace';
import { compatibleVideo, genVideoUrl } from '../../../../util/file';
import { isOpenPreviewModal } from '../../../../util/data';

/**
 * 裁剪遮罩
 * @param title
 * @param isAbsolute
 * @returns {*}
 * @constructor
 */
function CutCover({ className = '', title, isAbsolute = true }) {
    const [showGif, setShowGif] = useState(true);
    const bodyRef = useRef();
    // 如果宽高小于 100 则不显示gif图了
    const { offsetHeight, offsetWidth } = bodyRef.current || {};
    useEffect(() => {
        if (offsetHeight < 100 || offsetWidth < 150) {
            setShowGif(false);
        } else {
            setShowGif(true);
        }
    }, [offsetHeight, offsetWidth]);

    return (
        <React.Fragment>
            <div
                key='shade' className={`${styles.shade} ${className}`}
                style={{ position: isAbsolute ? 'absolute' : '' }}/>
            <div
                key='body' className={`${styles.CutCoverBody} ${className}`}
                ref={bodyRef}
            >
                <div className={styles.content}>
                    {showGif && <img src={logoGif}/>}
                    {title}
                </div>
            </div>
        </React.Fragment>
    );
}


/**
 * video图像缩放规则
 * @type {*[]}
 */
const ThumbRule = [
    {
        min: 0,
        max: 200,
        rule: '',
    },
    {
        min: 200,
        max: 400,
        rule: '1040:1040',
    },
    {
        min: 400,
        max: Number.MAX_VALUE,
        rule: '520:520',
    },
];

export const needProperty = {
    ...resizeNeedProperty,
    coverImg: '',
};

@connect((...params) => {
    const newProps = initElementProps(...params);
    const [{ looper: { cutVideoUUID } }, { uuid }] = params;
    newProps.isCuting = cutVideoUUID === uuid;
    return newProps;
})
class ResizeVideo extends React.Component {
    constructor(props) {
        super(props);
        this.video = React.createRef();
        this.getCover = null;
    }

    state = {
        height: null,
        thumbRule: null,
        isLoadVideo: null,
    };

    static getDerivedStateFromProps(nextProps) {
        const {
            resizeprops: { paramsData: { width } = {}, fixedaspectratio } = {},
            borderWidth = 0,
        } = nextProps;
        const newState = {};
        //边框高度修正
        newState.height = (width - 2 * borderWidth) / fixedaspectratio + 2 * borderWidth;
        return newState;
    }

    componentDidMount() {
        this.setCoverThumb();
        const { props: { coverImg, isWork, currentTime, playing, } = {} } = this;
        const { current: video } = this.video;
        if (isWork && !isOpenPreviewModal()) {
            this.afterChangeCurrentTime();
            if (playing) {
                this.onPlay();
            }
        }


    }

    componentDidUpdate(prevProps) {
        const { props: { coverImg, isWork, currentTime, playing, } = {} } = this;
        const { coverImg: prevCoverImg } = prevProps;
        if (coverImg !== prevCoverImg) {
            this.setCoverThumb();
        }
        const { current: video } = this.video;
        if (isWork && video && !isOpenPreviewModal()) {
            if (!playing && currentTime !== prevProps.currentTime) {
                this.afterChangeCurrentTime();
            }
            if (playing !== prevProps.playing) {
                if (playing) {
                    this.onPlay();
                } else {
                    this.onPause();
                }
            }
        }
    }

    componentWillUnmount() {
        const { current: video } = this.video;
        if (video && typeof video.pause === 'function') {
            video.pause();
        }
        this.onCanPlay();
        this.getCover.cancel();
        this.setState = () => null;
    }

    _mediaAction = new Promise(resolve => resolve());
    onPlay = () => {
        const { current: video } = this.video;
        if (video && typeof video.play === 'function') {
            this.afterChangeCurrentTime();
            if (video.currentTime === video.duration) return;
            this._mediaAction.then(() => {
                this._mediaAction = video.play()
                    .catch((error) => {
                        console.log(error);
                        return video.play();
                    });
            });
        }
    };

    afterChangeCurrentTime = async () => {
        const { props: { currentTime, renderSetting: { startTime = 0 } = {}, loop } } = this;
        const { current: video } = this.video;
        if (!video) return;
        const { duration } = video;
        const myCurrentTime = (currentTime - startTime);
        if (myCurrentTime > duration) {
            if (loop) {
                video.currentTime = myCurrentTime % duration;
            } else {
                video.currentTime = duration;
            }
        } else {
            video.currentTime = myCurrentTime;
        }
    };


    onPause = () => {
        const { current: video } = this.video;
        this._mediaAction.then(() => {
            if (video && typeof video.pause === 'function') {
                this._mediaAction = video.pause();
                if (!this._mediaAction) {
                    this._mediaAction = new Promise(resolve => resolve());
                }
            }
        });
    };

    setCoverThumb = () => {
        const {
            props: { coverImg },
        } = this;
        this.getCover = makeCancelable(getImgInfoByQiNiu(coverImg));
        this.getCover.promise.then(({ data: { size } = {} }) => {
            const kbSize = size / 1024;
            const oneRule = ThumbRule.find(v => v.min <= kbSize && v.max > kbSize) || {};
            this.setState({ thumbRule: oneRule.rule });
        })
            .catch(() => {
            });
    };

    _waitLoading = null;
    onLoadVideo = (e) => {
        const { props: { dispatch, uuid } } = this;
        this.cancelLoad();
        this._waitLoading = setTimeout(() => {
            this.cancelLoad();
            dispatch({
                type: 'timeLine/addWait',
                payload: {
                    uuid,
                }
            });
            this.setState({ isLoadVideo: true });
        }, 300);
    };

    cancelLoad = () => {
        if (this._waitLoading) {
            clearTimeout(this._waitLoading);
            this._waitLoading = null;
        }
    };

    onCanPlay = (e) => {
        if (this._waitLoading) {
            this.cancelLoad();
        }
        const { props: { dispatch, uuid } } = this;
        dispatch({
            type: 'timeLine/removeWait',
            payload: {
                uuid,
            }
        });
        this.setState({ isLoadVideo: false });
    };

    render() {
        const {
            props: {
                resizeprops: { paramsData, limit, ...resizeprops },
                coverImg,
                type,
                elementprops,
                visibility = 'visible',
                lock = false,
                pointerEvents,
                opacity = 1,
                backgroundColor = DEFAULT_ELE_BACKGROUND_COLOR,
                borderStyle = 'solid',
                borderColor = '#FFF',
                borderWidth = 0,
                borderRadius = 0,
                isCuting,
                isWork,
                muted = false,
                loop,
                playing,
            },
            state: { height, thumbRule, isLoadVideo },
        } = this;
        paramsData.height = height || paramsData.height;
        const fixedaspectratio = paramsData.width / paramsData.height;
        const otherStyles = {
            wordBreak: 'break-word',
            visibility,
            lock,
            opacity,
            backgroundColor,
            borderStyle,
            borderColor,
            borderWidth,
            borderRadius,
            pointerEvents,
            overflow: 'hidden',
        };
        if (visibility === 'hidden') return null;
        const contentElement = isWork && !isCuting && !isOpenPreviewModal() ? (<video
            src={genVideoUrl(this.props.previewUrl)}
            poster={playing ? '' : genUrl(coverImg, '1920:1080')}
            alt="视频封面"
            style={{
                width: '100%',
                height: '100%',
            }}
            className="workspace__el"
            draggable={false}
            controls={false}
            preload={'meta'}
            muted={muted}
            loop={loop}
            ref={this.video}
            onWaiting={this.onLoadVideo}
            onSeeking={this.onLoadVideo}
            onCanPlay={this.onCanPlay}
            onSeeked={this.onCanPlay}
        />) : (<img
            src={genUrl(coverImg, '1920:1080:png')}
            alt="视频封面"
            style={{
                width: '100%',
                height: '100%',
            }}
            className="workspace__el"
            draggable={false}
            controls={false}
            ref={this.video}
        />);
        const loadingText = isLoadVideo ? '加载中...' : (isCuting ? '视频裁剪中，请稍等...' : null);
        return (
            <ResizeComponent
                {...resizeprops}
                fixedaspectratio={fixedaspectratio}
                paramsData={paramsData}
                limit={limit}
                showdot={isCuting ? [] : ['NW', 'NE', 'SE', 'SW']}
                banMove={isCuting}
                banRotate={isCuting}
                otherStyle={otherStyles}
            >
                {<CutCover className={loadingText ? '' : styles.hidden} title={loadingText}/>}
                <div
                    {...elementprops}
                    role="presentation"
                    // onMouseDown={resizeprops.onMouseDown}
                    className={styles.body}
                >
                    {contentElement}
                    {/* <img src={PlayButton} className={styles.eqf_play_f} alt=""/> */}
                </div>
            </ResizeComponent>
        );
    }
}

export default ResizeVideo;
