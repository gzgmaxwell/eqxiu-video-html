import React from 'react';
import { connect } from 'dva';
import { Message, Tooltip } from 'antd';
import Share from 'Components/share';
import Button from 'Components/Button/index';
import styles from './preView.less';
import userVideoApi from 'Api/userVideo';
import imageUtil from 'Util/image';
import { host, prev } from 'Config/env';
import Video from 'Components/video/index';
import storeageLocal from 'Util/storageLocal';
import { genVideoUrl } from '../../util/file';
import {
    AUDIT_NOT_PASS,
    AUDIT_PASSIVITY_AUDIT_REJECT,
    EDITOR_PRODUCT, PLATFORM_NAME, VIDEO_RENDER_TYPE,
} from '../../config/staticParams';
import { waitChoseModel } from '../components/delete';
import ShareDownload from './shareDownload';
import Modal from 'Components/modal';
import { isChuangYiyunVip } from '../../models/User';
import { getMediaAdPublisher, getMediaAdpDomain } from 'Api/ad';
import { sendBDShare } from '../../services/bigDataService';

/**
 * 验证是否在渲染中的通用方法
 * @param type
 * @returns {boolean}
 */
const vaildIsRendering = (type) => {
    return type === 1 || type === 2;
};

@connect(({ user }) => ({ userId: user.id }))
class PreView extends React.PureComponent {

    constructor(props) {
        super(props);
        this.timer = null;
        this.qrCode = React.createRef();
        this.qrCodeObj = null;
        this.cos = null;
    }

    state = {
        id: '',
        createTime: '2018-11-02 17:31:58',
        videoDuration: 40,
        title: '',
        videoDescribe: '',
        loading: false,
        shareSet: false, // 分享设置
        shareType: null,
        adDomain: null, //流量主域名
    };

    componentDidMount() {
        this.onLoadDetail();
        this.mediaAd();
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.id !== this.props.id) {
            this.onLoadDetail();
        }
    }

    componentWillUnmount() {
    }

    /**
     * 改变loading状态
     * @param state
     */
    changeLoading = (state) => {
        this.setState({ loading: state });
    };
    /**
     * 获取标题 视频等详情
     */
    onLoadDetail = () => {
        const id = this.props.videoId;
        this.changeLoading(true);
        // 查询详情
        return userVideoApi.getDetail(id)
            .then(
                res => {
                    this.changeLoading(false);
                    if (res.data.success) {
                        this.setState({ ...res.data.obj });
                    }
                },
            )
            .catch(e => this.changeLoading(false));
    };

    /**
     * 重定向到编辑页
     * @returns {boolean}
     */
    redirectEdit = async () => {
        const {
            props: { dispatch, location, onClose, product, videoId, templateId },
            state: { platform },
        } = this;
        if (vaildIsRendering(this.state.hdstatus)) {
            Message.error('高清渲染中无法继续编辑...');
            return false;
        }
        const isPhone = ~~platform !== 1;
        if (isPhone) {
            const s = await waitChoseModel({
                text: `手机作品一旦编辑，就会转为电脑作品。\n
                    电脑作品暂不支持在手机端编辑，请谨慎操作。`,
                sureBtn: '继续',
            })
                .catch();
        }
        let url = `${prev}/editor/${templateId}/${videoId}`;
        switch (product) {
            case EDITOR_PRODUCT.subtitles:
                url = `${prev}/subEditor/subtitles/0/${videoId}`;
                break;
            case EDITOR_PRODUCT.headTail:
                url = `${prev}/HTEditor/${templateId}/${videoId}`;
                break;
            case EDITOR_PRODUCT.flash: {
                url = `${prev}/subEditor/flash/${templateId}/${videoId}`;
                break;
            }
            case EDITOR_PRODUCT.typeMonkey: {
                url = `${prev}/subEditor/typeMonkey/${templateId || 1}/${videoId}`;
                break;
            }
            default:
                break;
        }
        window.open(url);
    };

    onChangeShowAuthor = (e) => {
        return userVideoApi.showAuthor(this.props.id, e.target.checked)
            .then(res => this.onLoadDetail());
    };
    shareSet = () => {
        this.setState({ shareSet: true });
    };
    onCloseShareSet = () => {
        this.setState({ shareSet: false });
        this.onLoadDetail();
    };

    /**
     * 流量主广告
     */
    mediaAd = async () => {
        const { data: { success, obj } } = await getMediaAdPublisher();
        if (success && obj === true) {
            const { data: domain, status } = await getMediaAdpDomain(9);
            if (status === 200 && domain.length > 0) {
                const index = Math.floor(Math.random() * domain.length);
                //随机取一个域名
                const { protocol } = window.location;
                this.setState({
                    adDomain: `http://${domain[index]}/video/player`,
                });
            }
        }
    };

    shareBigSend = (act) => {
        const { state: { shareType, platform, videoDuration: duration }, props: { userId, id } } = this;
        const resolution = shareType === VIDEO_RENDER_TYPE.HDNoWaterMark ? 'hd' : 'sd';
        const isWatermark = shareType === VIDEO_RENDER_TYPE.SDWaterMark;
        const formPlatform = (PLATFORM_NAME[platform] || { name: 'pc' }).name;
        const params = {
            id,
            act,
            resolution,
            userId,
            formPlatform,
            isWatermark,
            duration,
        };
        sendBDShare(params);
    };

    render() {
        const { state, props } = this;
        const { playCode, platform, adDomain } = state;
        // 如果是流量主则显示流量主分享域名
        const shareUrl = playCode ? `${adDomain ? adDomain : host.preView}/0/${playCode}` : '';
        const rendering = vaildIsRendering(state.hdstatus);
        const isPhone = ~~platform !== 1;
        const noPassdAudit = [AUDIT_NOT_PASS, AUDIT_PASSIVITY_AUDIT_REJECT].includes(
            ~~state.auditStatus); // 未通过审核
        let shareTypeTitle = '';
        const isVip = isChuangYiyunVip();
        if (state.shareType === VIDEO_RENDER_TYPE.SDWaterMark || (!isVip && !state.shareType)) {
            shareTypeTitle = '标清有水印';
        } else if (state.shareType === VIDEO_RENDER_TYPE.SDNoWaterMark || (isVip && !state.shareType)) {
            shareTypeTitle = '标清无水印';
        } else if (state.shareType === VIDEO_RENDER_TYPE.HDNoWaterMark) {
            shareTypeTitle = '高清无水印';
        }
        return (
            <div className={styles.body}>
                <div className={styles.left}>
                    <div className={styles.videoDiv}>
                        {state.previewUrl &&
                        <Video width="480" height="480" preload='none'
                               onContextMenu={(e) => { // 阻止右键活动
                                   e.stopPropagation();
                                   e.preventDefault();
                               }}
                               poster={imageUtil.genUrl(state.coverImg, '480:480')}
                               src={genVideoUrl(state.previewUrl)} controls={true} />}
                    </div>
                    <div className={styles.leftFoot}>
            <span className={styles.createTime}>创建时间：{moment(state.createTime)
                .format('YYYY年MM月DD日')}</span>
                        <span className={styles.videoDuration}>{moment(state.videoDuration, 'X')
                            .format('mm:ss')}</span>
                    </div>
                </div>
                <div className={styles.right}>
                    <div className={styles.infoWrap}>
                        <p>当前分享的视频格式为 <span
                            className={styles.SD}>{shareTypeTitle}</span> ，若需要分享无水印或高清视频请 <span
                            onClick={this.shareSet} className={styles.clickTips}>点击此处 </span>进行修改。
                        </p>
                    </div>
                    {noPassdAudit
                        ? <span style={{ color: 'red' }}>
                         提示：该视频审核未通过，无法进行网络分享，请查看站内信了解审核信息并修改视频内容。
                     </span>
                        : <Share url={shareUrl} title={state.title} showAuthor={state.showAuthor}
                                 beforeShare={this.shareBigSend}
                                 onCheckFunc={this.onChangeShowAuthor} videoId={props.id}
                                 coverImg={state.coverImg} describe={state.videoDescribe} />}
                    <div className={styles.bottom}>
                        <div className={styles.right_title} title={state.title}>
                            {
                                state.title.length > 17 ? state.title.substr(0, 17) + '...' : state.title
                            }</div>
                        <div className={styles.describe}>{state.videoDescribe}</div>
                        <div className={styles.downLoadGroup} onMouseLeave={this.onCancel}>
                            <Tooltip arrowPointAtCenter={true}
                                     title={isPhone ? '手机作品' : null}>
                                <Button icon='eqf-pen-l' style={{
                                    width: 105,
                                    height: 34,
                                }} onClick={this.redirectEdit}
                                        className={(rendering)
                                            ? styles.disabled
                                            : ''}>继续编辑</Button>
                            </Tooltip>
                        </div>
                    </div>
                </div>

                <Modal visible={state.shareSet} onCancel={this.onCloseShareSet}>
                    <ShareDownload videoId={props.id} {...props} typePage='share'
                                   shareType={state.shareType}
                                   onClose={this.onCloseShareSet} />
                </Modal>
            </div>
        );
    }
}

export default PreView;
