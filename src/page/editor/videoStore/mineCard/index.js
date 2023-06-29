import React from 'react';
import { connect } from 'dva';
import Icon from '../../../components/Icon';
import VideoPlayButton from '../../../components/Button/VideoPlayButton';
import styles from './index.less';
import { genUrl } from '../../../../util/image';
import { genVideoUrl } from '../../../../util/file';
import Video from '../../../components/video/card';
import { editeUserVideoInfo, templateDelete } from '../../../../api/videoStore';
import { message } from 'antd';
import noCover from '../../../static/noCover.png';
import Button from '../../../components/Button';
import { HASH_TYPE, LIMIT_VIDEO_DURATION, VIDEO_TYPE } from '../../../../config/staticParams';
import MenuComponent from '../../../components/menu';
import Modal from '../../../components/modal';
import CutVideo from '../cutVideo';
import { pauseAllVideo } from '../../../../util/video';
import { findKey } from '../../../../util/object';
import { CSSTransition } from 'react-transition-group';

@connect(({ editor }) => ({ editor }))
class mineCard extends React.PureComponent {
    constructor(props) {
        super(props);
        this.video = React.createRef();
    }

    state = {
        noPlayed: true, // 播放状态
        playing: false, // 正在播放
        cardHover: false,
        showOption: false, // 显示操作菜单
        showRename: false, // 显示改名
        showCropper: false, // 裁剪框
        title: null, // 暂存标题
    };


    static getDerivedStateFromProps(nextProps, prevState) {
        const newState = { ...prevState };
        if (prevState.title !== nextProps.title && !prevState.showRename) {
            newState.title = nextProps.title;
        }
        return newState;
    }

    componentDidMount() {
        document.removeEventListener('keydown', this.keydown);
    }

    play = () => {
        if (this.state.playing) {
            this.pause();
        } else {
            this.startPlay();
        }
    };
    startPlay = () => {
        this.video.current.play();
        this.setState({
            noPlayed: false,
            playing: true,
        });
    };
    pause = () => {
        this.video.current.pause();
        this.setState({ playing: false });
    };
    onUserTemplate = () => {
        const { props: { onChange, dispatch, videoDuration, status, id, onClose = () => {} } } = this;
        if (status !== 4) {
            message.info('获取信息中..请稍后使用');
            return false;
        }
        if (videoDuration < LIMIT_VIDEO_DURATION) {
            message.error('视频时长过短，无法使用。');
            return false;
        }
        if (typeof onChange === 'function') {
            onChange(id, VIDEO_TYPE.userVideo);
        } else {
            dispatch({
                type: 'editor/addParty',
                payload: {
                    id,
                    type: VIDEO_TYPE.userVideo,
                },
            });
        }
        onClose();
    };
    confirm = () => {
        templateDelete(this.props.id)
            .then(res => {
                let { data } = res;
                if (data.success) {
                    message.success(data.msg);
                    this.props.onGetMineVideo(false);
                }
            });
        this.closeOption();
    };
    fullScreen = (e) => {
        e.stopPropagation();
        const video = this.video.current;
        if (typeof video.requestFullscreen === 'function') {
            video.requestFullscreen();
        } else if (typeof video.webkitRequestFullScreen === 'function') {
            video.webkitRequestFullScreen();
        } else if (typeof video.mozRequestionFullScreen === 'function') {
            video.mozRequestFullScreen();
        }

    };
    cardHover = (show) => {
        if (show) {
            this.setState({
                cardHover: true,
            });
        } else {
            this.setState({
                cardHover: false,
            });
        }
    };

    openOption = () => {
        this.setState({ showOption: true });
    };

    closeOption = () => {
        this.setState({ showOption: false });
    };

    openRename = () => {
        this.setState({ showRename: true });
        document.addEventListener('keydown', this.keydown);
        this.closeOption();
    };
    keydown = (e) => {
        if (e.keyCode === 13) {
            this.postName();
        }
    };
    closeRename = () => {
        this.setState({ showRename: false });
        document.removeEventListener('keydown', this.keydown);
    };

    rename = (e) => {
        const title = e.target.value || '';
        this.setState({ title });
    };

    postName = () => {
        const { props: { id, onRefer }, state: { title } } = this;
        editeUserVideoInfo(id, title)
            .then(res => onRefer()
                .then(r => {
                    message.success('修改成功');
                    this.closeRename();
                }));
    };

    openCropper = () => {
        const { props: { videoDuration = 0 } } = this;
        if (videoDuration <= LIMIT_VIDEO_DURATION) {
            message.error(`视频时长无法低于${LIMIT_VIDEO_DURATION}秒。`);
            return;
        }
        pauseAllVideo();
        this.setState({ showCropper: true });
    };

    closeCropper = (save = false) => {
        const { props: { onGetMineVideo } } = this;
        if (onGetMineVideo && save) {
            onGetMineVideo(true);
        }
        this.setState({ showCropper: false });
    };

    menuList = [
        {
            title: '裁剪',
            onClick: this.openCropper,
        },
        {
            title: '重命名',
            onClick: this.openRename,
        },
        { line: true },
        {
            title: '删除',
            isDelete: true,
            onClick: this.confirm,
        },
    ];

    render() {
        const {
            state: { showOption, showRename, title, showCropper, ...state },
            props, closeOption, menuList, closeCropper,
        } = this;
        const { transcodeUrl: url, coverImg, id, uploadType } = props;
        const timeLong = moment(props.videoDuration, 'X')
            .format('mm:ss');
        const videoStyle = state.playing ? { display: 'none' } : { display: 'block' };
        const uploading = props.status === 2 || props.status === 1; // 是否上传中
        const isFail = props.status === 3; // 是否失败
        const cutProps = {
            title,
            url,
            coverImg,
            id,
            isSave: 1, // 0不保存
            type: uploadType,
            onCancel: closeCropper,
        };
        return (
            <div>
                <div className={`${styles.singleAll} index-Card ${state.cardHover ? 'hover' : ''}`}>
                    <div className={styles.topBox} onClick={this.play}>
                        {!uploading && <React.Fragment>
                            <Icon type='eqf-bigger' className={styles.eqf_bigger}
                                  onClick={this.fullScreen}/>
                            <div className={styles.videoBgBox}><img
                                src={genUrl(props.coverImg, '166:200')}
                                className={styles.videoBg} alt=''/>
                            </div>
                            <Video
                                onClick={this.play}
                                preload='none'
                                ref={this.video}
                                controls={false}
                                crossOrigin='Anonymous'
                                width={170}
                                height={200}
                                poster={genUrl(props.coverImg, '166:200')}
                                src={genVideoUrl(props.webmUrl || props.transcodeUrl || props.templateUrl)}
                                style={{ zIndex: 1 }}/>
                            <VideoPlayButton className={styles.VideoPlayButton} style={videoStyle}/></React.Fragment>
                        || <img src={noCover} className={styles.noCover} alt={'没有封面'}/>}
                    </div>
                    <div className={styles.bottomBox}>
                        <div
                            className={`${styles.noneHoverBox} ${showRename && styles.showRename}`}>
                            <p className={`${styles.title} ${showRename && styles.showRename}`}>
                                {showRename ? <input className={styles.renameInput}
                                                     maxLength='30'
                                                     value={title === null ? '' : title}
                                                     autoFocus={true}
                                                     onChange={this.rename} onBlur={this.postName}/>
                                            : title}
                            </p>
                            <div className={styles.screen}>
                                {isFail && <span className={styles.failText}>视频处理失败。请稍后再试。</span> || // 失败
                                uploading && <span className={styles.uploading}>视频处理中，请稍等…</span> || // 处理中
                                (<React.Fragment><span
                                    className={styles.screenNumber}>{props.resolutionW}*{props.resolutionH}</span>
                                    <span className={styles.screenDetailTime}><Icon
                                        type='eqf-clock-f'/> {timeLong}</span></React.Fragment>)}
                            </div>
                        </div>
                        <div className={`${styles.onHoverBox} ${showRename && styles.showRename}`}>
                            {uploading
                             ? <Button className={styles.uploadingDeleteBtn}
                                       onClick={this.confirm}>删除</Button>
                             : <React.Fragment>
                                 <Button className={`${styles.useBtn}`}
                                         onClick={this.onUserTemplate}>立即使用</Button>
                                 <Button lite={1} className={`${styles.option} ${showOption &&
                                 styles.hover}`}
                                         onMouseEnter={this.openOption}>
                                     操作
                                 </Button>
                                 <MenuComponent visible={showOption} close={closeOption}
                                                onMouseLeave={closeOption}
                                                dataList={menuList} className={styles.menu}/>
                                 {showCropper && <CSSTransition
                                     in={showCropper}
                                     timeout={500}
                                     classNames='slider'
                                     unmountOnExit>
                                     <CutVideo {...cutProps} />
                                 </CSSTransition>}
                              {/*   <Modal visible={showCropper}
                                        onCancel={closeCropper}><CutVideo visible={showCropper} {...cutProps} />
                                 </Modal>*/}
                             </React.Fragment>}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default mineCard;
