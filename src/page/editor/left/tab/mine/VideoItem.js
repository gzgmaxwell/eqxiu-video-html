import React from 'react';
import { connect } from 'dva';
import Icon from 'Components/Icon';
import VideoPlayButton from 'Components/Button/VideoPlayButton';
import styles from './VideoItem.less';
import { genUrl } from 'Util/image';
import { genVideoUrl } from 'Util/file';
import Video from 'Components/video/card';
import { editeUserVideoInfo, templateDelete } from 'Api/videoStore';
import { message, Tooltip } from 'antd';
import noCover from '../../../../static/noCover.png';
import Button from 'Components/Button';
import { HASH_TYPE, LIMIT_VIDEO_DURATION, VIDEO_TYPE } from 'Config/staticParams';
import MenuComponent from 'Components/menu';
import Modal from 'Components/modal';
import CutVideo from '../../../videoStore/cutVideo';
import { pauseAllVideo } from 'Util/video';
import eventEmitter from '../../../../../services/EventListener';
import { findKey } from '../../../../../util/object';

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
        eventEmitter.removeListener('leftSideCallback', this.callback); //暂停音乐播放
        document.removeEventListener('keydown', this.keydown);
    }

    callback = () => {
        this.pause();
    };
    play = () => {
        if (this.state.playing) {
            this.pause();
            eventEmitter.on('leftSideCallback', this.callback); //暂停音乐播放
        } else {
            this.startPlay();
            eventEmitter.on('leftSideCallback', this.callback); //暂停音乐播放
            document.addEventListener('click', this.handleClickAfterPlay);
        }
    };

    handleClickAfterPlay = () => {
        this.pause();
        document.removeEventListener('click', this.handleClickAfterPlay);
    };

    startPlay = () => {
        // this.video.current.play();
        this.setState({
            noPlayed: false,
            playing: true,
        });
    };
    pause = () => {
        if (this.video.current) {
            // this.video.current.pause();
            this.setState({ playing: false });
        }
    };
    onUserTemplate = () => {
        const { props: { insert, videoDuration, status, id } } = this;
        if (status !== 4) {
            message.info('获取信息中..请稍后使用');
            return false;
        }
        if (videoDuration < LIMIT_VIDEO_DURATION) {
            message.error('视频时长过短，无法使用。');
            return false;
        }
        insert({
            id,
            type: VIDEO_TYPE.userVideo,
        });
    };
    confirm = () => {
        templateDelete(this.props.id)
            .then(res => {
                let { data } = res;
                if (data.success) {
                    message.success(data.msg);
                    this.props.loadLists();
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
        const { props: { id, loadLists }, state: { title } } = this;
        editeUserVideoInfo(id, title)
            .then(res => {
                this.closeRename();
                message.success('修改成功');
                loadLists();
            });
    };
    openCropper = () => {
        const { props: { videoDuration = 0, afterModalHook = () => true } } = this;
        if (videoDuration <= LIMIT_VIDEO_DURATION) {
            message.error(`视频时长无法低于${LIMIT_VIDEO_DURATION}秒。`);
            return;
        }
        pauseAllVideo();
        afterModalHook(true);
        this.setState({ showCropper: true });
    };
    closeCropper = (save = false) => {
        const { props: { loadLists, afterModalHook = () => true } } = this;
        if (loadLists && save) {
            loadLists();
        }
        afterModalHook(false)
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
        const { transcodeUrl: url, coverImg, id, disabled, type } = props;
        const timeLong = moment(props.videoDuration, 'X')
            .format('mm:ss');
        const videoStyle = state.cardHover && !state.playing
            ? { display: 'block' }
            : { display: 'none' };
        const uploading = props.status === 2 || props.status === 1; // 是否上传中
        const isFail = props.status === 3; // 是否失败
        const cutProps = {
            title,
            url,
            coverImg,
            id,
            isSave: 1, // 0 不保存
            type,
            onCancel: closeCropper,
        };
        return (
            <div className={`${styles.singleAll} ${state.cardHover ? 'hover' : ''} `}>
                <div className={styles.topBox}
                    onClick={disabled ? () => { } : this.play}
                    onMouseEnter={() => this.cardHover(true)}
                    onMouseLeave={() => this.cardHover(false)}
                >
                    {!uploading &&
                        <React.Fragment>
                            {/*<Icon type='eqf-bigger' className={styles.eqf_bigger}*/}
                            {/*onClick={this.fullScreen}/>*/}
                            <div className={styles.videoBgBox}>
                            </div>
                            <img
                                preload='none'
                                ref={this.video}
                                controls={false}
                                crossOrigin='Anonymous'
                                src={genUrl(props.coverImg, '124:146')}
                                style={{
                                    zIndex: 1,
                                    maxWidth: 124,
                                    maxHeight: 146,
                                }} />
                            <div className={styles.hoverBtn}>
                                <Tooltip title='删除' placement='left'>
                                    <Icon type='eqf-delete-l' className={styles.deleteIcon} onClick={this.confirm} />
                                </Tooltip>
                                <Tooltip title='重命名' placement='left'>
                                    <Icon type='eqf-t' className={styles.renameIcon} onClick={this.openRename} />
                                </Tooltip>
                            </div>
                        </React.Fragment>
                        || <img src={noCover} className={styles.noCover} alt={'没有封面'} />}
                </div>
                <div className={styles.bottomBox}>
                    <div
                        className={`${styles.noneHoverBox} ${showRename && styles.showRename}`}>
                        <p className={`${styles.title} ${showRename && styles.showRename}`}>
                            {showRename ? <input className={styles.renameInput}
                                maxLength="30"
                                value={title === null ? '' : title}
                                autoFocus={true}
                                onChange={this.rename} onBlur={this.postName} />
                                : title}
                        </p>
                        <div className={styles.screen}>
                            {isFail && <span className={styles.failText}>视频处理失败。请稍后再试。</span> || // 失败
                                uploading && <span className={styles.uploading}>视频处理中，请稍等…</span> || // 处理中
                                (<React.Fragment><span
                                    className={styles.screenNumber}>{props.resolutionW}*{props.resolutionH}</span>
                                    <span
                                        className={styles.screenDetailTime}>{timeLong}</span></React.Fragment>)}
                        </div>
                    </div>
                    <div className={`${styles.onHoverBox} ${showRename && styles.showRename}`}>
                        {uploading
                            ? <Button
                                className={styles.uploadingDeleteBtn}
                                onClick={this.confirm}>删除
                            </Button>
                            : <React.Fragment>
                                <Button
                                    lite={1}
                                    className={styles.leftBtn}
                                    onClick={this.openCropper}>
                                    裁剪
                                </Button>
                                <Button
                                    className={styles.rightBtn}
                                    onClick={disabled ? () => { } : this.onUserTemplate}>
                                    立即使用
                                </Button>
                                <Modal visible={showCropper}
                                    onCancel={closeCropper}><CutVideo {...cutProps} /></Modal>
                            </React.Fragment>}
                    </div>
                </div>
            </div>
        );
    }
}

export default mineCard;
