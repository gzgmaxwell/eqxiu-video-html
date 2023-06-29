import React from 'react';
import { routerRedux } from 'dva/router';
import { Message } from 'antd';
import Icon from 'Components/Icon';
import Button from 'Components/Button/index';
import Video from 'Components/video/index';
import { setTitle } from 'Util/doc';
import imageUtil from 'Util/image';
import styles from './player.less';
import { getPlayerUrl } from 'Api/playerVideo';
import templateApi from 'Api/template';
import Header from 'Page/layout/header/index';
import { host } from 'Config/env';
import Share from 'Components/share';


class PreView extends React.PureComponent {

    constructor(props) {
        super(props);
        this.timer = null;
        this.qrCode = React.createRef();
        this.qrCodeObj = null;
        this.videoDiv = React.createRef();
        this.m_video = React.createRef();
    }

    state = {
        id: '',
        loading: true,
        playing: false,
        isTemplate: false,
        createTime: '2018-11-02 17:31:58',
        videoDuration: 40,
        title: '',
        videoDescribe: '',
        userName: '易企秀官方',
        userAvatar: 'https://res1.eqh5.com/group2/M00/7F/9B/yq0KXlZNGfWAbZo_AAAdI0Feqt0138.png?imageMogr2/auto-orient/thumbnail/212x212>/strip',
        url: '',
        coverImg: '',
    };

    componentWillMount() {
        this.onLoadDetail();
    }

    componentDidUpdate() {
    }

    componentWillUnmount() {
    }

    onLoadDetail = () => {
        const { match: { params: { videoId, playCode } } } = this.props;
        // 查询详情
        if (playCode) {
            getPlayerUrl(videoId, playCode)
                .then(
                    res => {
                        if (!res) {
                            this.setState({ loading: '读取失败，可能是视频已经下线' });
                            return;
                        }
                        if (res.data.success) {
                            this.setState({
                                ...res.data.obj,
                                loading: false,
                            });
                        }
                    },
                )
                .catch(error => {
                    this.setState({ loading: '读取失败' });
                });
        } else {
            templateApi.getDetail(videoId)
                .then(
                    res => {
                        if (res.data.success) {
                            this.setState({
                                ...res.data.obj,
                                loading: false,
                                isTemplate: true,
                            });
                        }
                    },
                )
                .catch(error => {
                    this.setState({ loading: '读取失败' });
                });
            ;
        }

    };

    phonePlay = () => {
        this.setState({ playing: true });
        this.m_video.current.play();
    };


    render() {
        const { state, props } = this;
        const { match: { params: { videoId, playCode } } } = props;
        const shareUrl = `${host.preView}/${videoId}/${playCode}`;
        setTitle(state.title);
        if (window.screen.width < 1000) {
            return (<div className={styles.mobail} ref={this.videoDiv}>
                {!state.playing && <div className={styles.coverImg} onClick={this.phonePlay}>
                    <Icon type='eqf-play'/>
                    <img
                        src={imageUtil.genUrl(state.coverImg)}/>
                </div>}
                <video className={styles.mobailVideo} ref={this.m_video}
                       crossOrigin='Anonymous'
                       poster={imageUtil.genUrl(state.coverImg)}
                       src={imageUtil.genUrl(state.previewUrl)}
                       controls={true}/>
            </div>);
        }
        return (
            <div className={styles.body}>
                <Header location={props.location} tab_list={[]}/>
                <div className={styles.content}>
                    <div className={styles.left}>
                        <div className={styles.videoDiv}>
                            {state.loading ? <h2 style={{
                                               verticalAlign: 'middle',
                                               lineHeight: '450px',
                                           }}>{state.loading}</h2> :
                             <Video width="480" height="480" preload='none'
                                    poster={imageUtil.genUrl(state.coverImg)}
                                    src={imageUtil.genUrl(state.previewUrl)} controls={true}/>}
                        </div>
                        <div className={styles.leftFoot}>
            <span className={styles.createTime}>创建时间：{moment(state.createTime)
                .format('YYYY年MM月DD日')}</span>
                            <span className={styles.videoDuration}>{moment(state.videoDuration, 'X')
                                .format('mm:ss')}</span>
                        </div>
                    </div>
                    <div className={styles.right}>
                        <div className={styles.authorInfo}>
                            <div className={styles.avatar}>
                                <img src={imageUtil.genUrl(state.userAvatar)}/>
                            </div>
                            <span>{state.userName}</span>
                        </div>
                        <div className={styles.right_title}>{state.title}</div>
                        <div className={styles.describe}>{state.videoDescribe}</div>
                        {!state.isTemplate && <Share url={shareUrl} title={state.title}
                                                     coverImg={imageUtil.genUrl(state.coverImg)}
                                                     describe={state.videoDescribe}/>}
                    </div>
                </div>
            </div>
        );
    }
}

export default PreView;
