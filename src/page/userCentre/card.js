import React from 'react';
import { connect } from 'dva';
import { message, Tooltip } from 'antd';
import { host, prev } from 'Config/env';
import Icon from 'Components/Icon';
import Button from 'Components/Button/index';
import styles from './card.less';
import Modal from 'Components/modal';
import PreView from './preView';
import DeleteModal from 'Components/delete';
import storeageLocal from 'Util/storageLocal';
import imageUtil from 'Util/image';
import { getScrollTop } from 'Util/doc';
import Pie from '../components/pie';
import {
    AUDIT_STATUS,
    EDITOR_PRODUCT,
    USER_TYPE,
    VIDEO_RENDER_TYPE
} from '../../config/staticParams';
import { cancelRender, enteredAdvanceMode, hdFinishClear } from '../../api/userVideo';
import { genVideoUrl } from '../../util/file';
import Video from '../components/video/card';
import DownLoad from './downLoad';
import playBtn from '../static/playButton.png';
import { hasHdRendering } from '../../util/data';
import DownloadSvg from './downloadingIcon';
import Give from './give';
import { waitChoseModel } from '../components/delete';
import ShareDownload from './shareDownload';
import { sendBDEvent, sendBDPage } from '../../services/bigDataService';
import { POS_FROM, TYPE_PAGE } from '../../config/staticParams/goodsParams';
import CardTag from './cardTag';

const genUrl = imageUtil.genUrl;
const Operate = (props) => {
    return (
        <ul className={styles.operate}>
            <li className={styles.border}><span className={styles.a_delete}
                onClick={props.onDelete}>删除</span></li>
            {props.type === USER_TYPE.SHOWER && props.status === 4 &&
                [EDITOR_PRODUCT.main, EDITOR_PRODUCT.headTail].includes(props.product) &&
                <li><span className={styles.a_copy} onClick={props.onCreateTemplate}>转换为模板</span></li>}
            {props.status !== 2 &&
                <li><span className={styles.a_copy} onClick={props.onCopy}>复制</span></li>}
            {props.status !== 2 &&
                <li><span className={styles.a_copy} onClick={props.giveModal}>转赠</span></li>}
        </ul>);
};

/**
 * 0= 未完成 1=渲染中 2=渲染失败  3=渲染成功
 */
@connect(({ user }) => ({
    user,
}))
class Card extends React.PureComponent {

    constructor(props) {
        super(props);
        this.video = React.createRef();
        this.downloadIcon = React.createRef();
    }

    state = {
        hoverQR: false,
        showDeleteModal: false,
        deleteModalText: '是否删除此视频？',
        deleteMethod: this.onDeleteFromModal,
        noPlayed: true,// 播放状态
        playing: false,// 正在播放
        direction: 'hoz', //视频方向
        id: '', // 我的作品列表id
        loading: false,
        videoData: null,
        type: VIDEO_RENDER_TYPE.SDWaterMark, // 201标清有水印 202标清无水印 203 高清无水印
        openDownLoad: false,
        giveModal: false, // 转增
        download: false, // 下载分享弹框
    };

    componentDidMount() {

    }

    componentDidUpdate() {

    }

    componentWillUnmount() {
        this.onCloseModal();
    }

    /**
     * 确认删除视频的操作
     */
    onDeleteFromModal = () => {
        this.onCloseModal();
        this.sendDelete();
        // this.props.refresh();
    };
    /**
     * 点击删除视频
     */
    onDeleteModal = () => {
        this.setState({
            showDeleteModal: true,
            deleteModalText: '是否删除此视频？',
            cancelText: '取消',
            deleteMethod: this.onDeleteFromModal,
        });
    };
    /**
     * 发送取消渲染命令
     */
    sendCancelRender = () => {
        this.onCloseModal();
        // const type = isChuangYiyunVip() ? VIDEO_RENDER_TYPE.SDNoWaterMark : VIDEO_RENDER_TYPE.SDWaterMark;
        cancelRender(this.props.id)
            .then(res => this.props.refresh);
    };
    /**
     * 取消渲染 （标清渲染）
     */
    onCancelRender = (type) => {
        this.setState({
            type: type,
            showDeleteModal: true,
            deleteModalText: '是否取消渲染？',
            cancelText: '暂不',
            deleteMethod: this.sendCancelRender,
        });
    };

    /**
     * 操作列和二维码的隐藏
     */
    onCancel = () => {
        this.setState({
            hoverQR: false,
        });
    };
    /**
     * modal窗的关闭
     */
    onClose = () => {
        this.setState({
            showDeleteModal: false,
        });
    };
    /**
     * 重定向到编辑页
     */
    redirectEdit = async () => {
        const { props: { dispatch, location, product, id, templateId = 0, platform } } = this;
        const isPhone = ~~platform !== 1;
        if (isPhone) {
            const s = await waitChoseModel({
                text: `手机作品一旦编辑，就会转为电脑作品。\n
                    电脑作品暂不支持在手机端编辑，请谨慎操作。`,
                sureBtn: '继续',
            })
                .catch();
        }
        this.pause();
        storeageLocal.setItem('beforeEditor', location);
        let url = `${prev}/editor/${templateId}/${id}`;
        switch (product) {
            case EDITOR_PRODUCT.subtitles:
                url = `${prev}/subEditor/subtitles/0/${id}`;
                break;
            case EDITOR_PRODUCT.headTail:
                url = `${prev}/HTEditor/${templateId}/${id}`;
                break;
            case EDITOR_PRODUCT.flash: {
                url = `${prev}/subEditor/flash/${templateId}/${id}`;
                break;
            }
            case EDITOR_PRODUCT.typeMonkey: {
                url = `${prev}/subEditor/typeMonkey/${templateId}/${id}`;
                break;
            }
            default:
                break;
        }
        window.open(url);
    };
    /**
     * 打开预览窗
     */
    onPreView = () => {
        if (this.video.current) {
            this.video.current.pause();
        }
        sendBDEvent({
            position: '我的作品',
            type: '打开分享页面',
        });
        this.setState({ showPreView: true });
    };
    /**
     * 关闭模态框
     */
    onCloseModal = (callback = null) => {
        if (typeof callback === 'function') {
            this.setState({
                showPreView: false,
                showDeleteModal: false,
            }, callback);
        } else {
            this.setState({
                showPreView: false,
                showDeleteModal: false,
            });
        }
    };
    onCloseGiveModal = () => {
        this.setState({ giveModal: false });
    };
    onCloseShareDownload = () => {
        this.setState({ download: false });
    };
    /**
     * 复制
     */
    onCopy = () => {
        const { id, dispatch } = this.props;
        dispatch({
            type: 'editor/copy',
            payload: {
                id,
            },
        })
            .then(() => {
                this.props.refresh(true, true);
            });
    };
    /**
     * 转增
     */
    giveModal = () => {
        this.setState({ giveModal: true });
    };

    /**
     * 发送删除请求
     */
    sendDelete = () => {
        this.props.dispatch({
            type: 'editor/delete',
            payload: {
                id: this.props.id,
            },
        })
            .then(() => {
                this.props.refresh(true, true);
            });
    };


    onCreateTemplate = () => {
        const url = `${host.service2}/video/user/video/worksTemplate/add?videoId=${this.props.id}`;
        axios.post(url, { id: this.props.id })
            .then(res => {
                const { data: { success = false } = {} } = res;
                if (success) {
                    message.success('申请成功，请去我的模板查看。');
                }
            });
    };
    /**
     * 关闭高清下载
     */
    closeModalDownLoad = () => {
        this.setState({ openDownLoad: false });
    };
    /**
     * 打开高清下载
     */
    openModalDownLoad = () => {
        // this.setState({
        //     openDownLoad: true,
        // }, this.cancelRedDot);
        sendBDEvent({
            position: '我的作品',
            type: '打开下载窗口',
        });
        this.setState({ download: true });
    };
    cancelRedDot = () => {
        const { id, refresh, hdRenderFinish = false } = this.props;
        hdRenderFinish && hdFinishClear(id)
            .then(res => refresh(false));
    };

    /**
     * 视频播放
     * @params {[type]} status===4 [渲染成功]
     */
    play = (props) => {
        if (props.status === 4) {
            if (this.state.playing) {
                this.pause();
            } else {
                this.startPlay();
            }
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
        this.video.current && this.video.current.pause();
        this.setState({ playing: false });
    };
    fullScreen = () => {
        const video = this.video.current;
        window.addEventListener('resize', this.resizeWindow);
        if (typeof video.requestFullscreen === 'function') {
            video.requestFullscreen();
        } else if (typeof video.webkitRequestFullScreen === 'function') {
            video.webkitRequestFullScreen();
        } else if (typeof video.mozRequestionFullScreen === 'function') {
            video.mozRequestFullScreen();
        }
    };

    resizeWindow = (e) => {
        const video = this.video.current;
        if (video.controls) {
            video.controls = false;
            window.removeEventListener('resize', this.resizeWindow);
        } else {
            video.controls = true;
        }
    };

    render() {
        const { state: { openDownLoad, ...state }, props: { user = {}, platform, transverse, auditStatus, ...props } } = this;
        const isPhone = ~~platform !== 1;
        let timeLong = moment(props.videoDuration, 'X')
            .format('mm:ss');
        let status = '';
        let elseStatus = '';
        let isRendering = false;
        let isFail = false;
        const imgStyle = transverse ? {
            width: '100%',
            maxHeight: '100%',
        } : {
                height: '100%',
                maxWidth: '100%',
            };
        const isHdRendering = hasHdRendering(props);
        // tag标签
        let tagStatus = props.status;
        if (props.status === 0 && props.previewUrl) {
            tagStatus = 'update';
        }

        switch (tagStatus) {
            case 0:
                // status = <span className={styles.noCommit}>未完成</span>;
                status = '';
                elseStatus = <React.Fragment>
                    <div onMouseEnter={this.onToggle} onMouseLeave={this.onToggleLeave}
                        className={styles.operation}><Icon type='eqf-menu-p'
                            className={styles.eqf_menu_p} />
                    </div>
                    <Operate type={user.type} status={props.status} onCopy={this.onCopy}
                        giveModal={this.giveModal}
                        product={props.product}
                        onDelete={this.onDeleteModal}
                        onCreateTemplate={this.onCreateTemplate} />
                </React.Fragment>;
                isFail = true;
                break;
            case 1:
            case 2:
                let renderTime = parseInt(moment(props.renderUseTime, 'X')
                    .format('m'));
                status = <span className={styles.rendering}>大约需要{renderTime === 0
                    ? 1
                    : renderTime}-{renderTime +
                        2}分钟</span>;
                elseStatus = <div className={styles.editBox}>
                    <span onClick={() => this.onCancelRender(type)}
                        className={`${styles.eqfPenBox} ${styles.cancelRender}`}>
                        <Icon type='iconfont iconcancel' className={styles.iconcancel} /> &nbsp;取消生成
                    </span>
                </div>;
                isRendering = true;
                break;
            case 3:
                // status = <span className={styles.renderFail}>渲染失败,请重新提交</span>;
                elseStatus = <React.Fragment>
                    <div onMouseEnter={this.onToggle} onMouseLeave={this.onToggleLeave}
                        className={styles.operation}><Icon type='eqf-menu-p'
                            className={styles.eqf_menu_p} />
                    </div>
                    <Operate
                        type={user.type} status={props.status} onCopy={this.onCopy}
                        giveModal={this.giveModal}
                        product={props.product}
                        onDelete={this.onDeleteModal}
                        onCreateTemplate={this.onCreateTemplate} />
                </React.Fragment>;
                isFail = true;
                break;
            case 'update':
            case 4:
                status = <React.Fragment>
                    <span className={styles.pvSpan}>{props.pv}&nbsp;浏览</span>
                    {props.componentPv != null && <span className={styles.compSpan}>{props.componentPv}&nbsp;点击组件</span>}
                </React.Fragment>
                elseStatus =
                    <React.Fragment>
                        <div onMouseEnter={this.onToggle} onMouseLeave={this.onToggleLeave}
                            className={styles.operation}><Icon type='eqf-menu-p'
                                className={styles.eqf_menu_p} />
                        </div>
                        <Operate type={user.type} status={props.status} onCopy={this.onCopy}
                            giveModal={this.giveModal}
                            product={props.product}
                            onDelete={this.onDeleteModal}
                            onCreateTemplate={this.onCreateTemplate} />
                        <div className={styles.wrapDH}>
                            <div onClick={() => this.openModalDownLoad(props)}
                                className={styles.download}>
                                {props.hdRenderFinish && <span className={styles.redDot} />}
                                {isHdRendering ? <DownloadSvg ref={this.downloadIcon}
                                    className={styles.downloading}
                                />
                                    : <Icon type='eqf-download'
                                        className={styles.eqf_share_l} />}
                                下载
                            </div>
                            <div onClick={this.onPreView} className={styles.share}><Icon
                                type='eqf-share-l' className={styles.eqf_share_l} />&nbsp;分享
                            </div>
                        </div>
                    </React.Fragment>;
                break;
        }
        if ([AUDIT_STATUS.NOT_PASS, AUDIT_STATUS.INITIATIVE_AUDIT_REJECT, AUDIT_STATUS.PASSIVITY_AUDIT_REJECT].includes(auditStatus)) {
            // status = <span className={styles.renderFail}>
            //     {auditStatus === 4 ? '作品审核未通过' : '作品审核中'}
            // </span>;
            tagStatus = auditStatus === 4 ? 'auditFail' : 'auditWait';
            elseStatus = <React.Fragment>
                <div onMouseEnter={this.onToggle} onMouseLeave={this.onToggleLeave}
                    className={styles.operation}><Icon type='eqf-menu-p'
                        className={styles.eqf_menu_p} />
                </div>
                <Operate type={user.type} status={2} onCopy={this.onCopy}
                    giveModal={this.giveModal}
                    product={props.product}
                    onDelete={this.onDeleteModal}
                    onCreateTemplate={this.onCreateTemplate} />
            </React.Fragment>;
            isFail = true;
        }
        const withCard = state.direction === 'hoz' ? '250px' : '250px';
        const heightCard = state.direction === 'hoz' ? '250px' : '250px';
        const videoStyle = state.playing
            ? { display: 'none' } : { display: 'block' };
        const type = 1;
        const typeHD = 2;
        return (
            <div className={`${isFail ? styles.CardF : styles.Card} index-Card`}
                onMouseLeave={this.onCancel} style={props.style}>
                {!isPhone && <CardTag status={tagStatus} />}
                {openDownLoad && <DownLoad videoId={props.id} {...props}
                    onCancelRender={() => this.onCancelRender(
                        typeHD)}
                    closeModalDownLoad={() => this.closeModalDownLoad()} />}
                <div className={`${styles.videoDiv}`}>
                    {isPhone && <span className={styles.phoneTag}>手机作品</span>}
                    {props.status === 4 &&
                        <div className={styles.eqf_arrow_bigger}><Icon onClick={this.fullScreen}
                            type='eqf-arrow-bigger' /></div>}
                    {props.status === 4 &&
                        <img onClick={() => this.play(props)} src={playBtn}
                            className={styles.eqf_play_f} style={videoStyle} />}
                    <div className={styles.coverBackgroundBox}><img
                        src={genUrl(props.coverImg, '250:250')}
                        className={styles.coverBackground} /></div>
                    {props.status === 4 && <Video
                        className={styles.video}
                        onClick={() => this.play(props)}
                        ref={this.video}
                        controls={false}
                        controlsList='nodownload '
                        bottom='true'
                        style={{
                            width: withCard,
                            height: heightCard,
                        }}
                        poster={genUrl(props.coverImg)}>
                        <source src={genVideoUrl(props.previewUrl)} />
                    </Video>
                        ||
                        <img src={genUrl(props.coverImg)} style={imgStyle} />}

                    {isRendering &&
                        [
                            <div key='rendingShade' className={styles.renderShade}>
                            </div>,
                            <div key='redingDiv' className={styles.renderDiv}>
                                {props.renderProgress !== null &&
                                    <Pie className={styles.progress}
                                        progress={~~props.renderProgress} />}
                                <div
                                    className={styles.progressInfo}>{props.renderProgress ===
                                        null
                                        ? '当前用户过多，请稍后...'
                                        : `${~~props.renderProgress}%`}</div>
                            </div>]}
                </div>
                <div className={styles.titleBox}>
                    <div className={`${styles.titleCover} ${isRendering ? styles.noHover : ''}`}>
                        <div className={styles.titleContainer}>
                            <div className={[styles.title].join('')}>{props.title}</div>
                            <span className={styles.durationSpan}>{timeLong}</span>
                        </div>
                        <div className={styles.info}>
                            {!['auditWait', 'auditFail'].includes(tagStatus) && status}
                            {/* <span className={styles.durationSpan}>{timeLong}</span> */}
                        </div>
                    </div>
                    {![1, 2].includes(~~props.status) &&
                        <Tooltip arrowPointAtCenter={true}
                            title={isPhone ? '手机端作品' : null}
                            placement='left'>
                            <Button onClick={(isHdRendering) ? null : this.redirectEdit}
                                className={`${styles.edit} ${(isHdRendering)
                                    ? styles.disbaled
                                    : ''}`}>
                                <Icon type='eqf-pen-f' />
                            </Button>
                        </Tooltip>
                    }
                </div>
                <div className={styles.bottom}>
                    {elseStatus}
                    <DeleteModal onClose={this.onClose}
                        onDelete={state.deleteMethod}
                        style={{ top: getScrollTop() }}
                        cancelText={state.cancelText}
                        text={state.deleteModalText}
                        visible={state.showDeleteModal} />
                </div>
                <Modal visible={state.showPreView}
                    onCancel={this.onCloseModal}>
                    <ShareDownload videoId={props.id}
                        typePage={TYPE_PAGE.share}
                        positionFrom={POS_FROM.workSpace}
                        onClose={this.onCloseModal} />
                </Modal>
                <Modal
                    visible={state.giveModal}
                    onCancel={this.onCloseGiveModal}>
                    <Give onClose={this.onCloseGiveModal} videoId={props.id} />
                </Modal>
                <Modal visible={state.download} onCancel={this.onCloseShareDownload}>
                    <ShareDownload videoId={props.id}
                        refresh={this.props.refresh}
                        typePage={TYPE_PAGE.download}
                        positionFrom={POS_FROM.workSpace}
                        onClose={this.onCloseShareDownload} />
                </Modal>
            </div>
        );
    }
}

export default Card;
