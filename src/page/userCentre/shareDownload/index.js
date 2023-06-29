import React from "react";
import styles from "./index.less";
import Icon from "../../components/Icon";
import gen from "../../static/gen.png";
import Button from "../../components/Button";
import Modal from "../../components/modal";
import Rights from "./rights";
import { connect } from "dva";
import { sendBDDownload, sendBDShare, sendBDEvent } from "../../../services/bigDataService";
import { Checkbox, Message, Tooltip } from "antd";
import Rendering from "./rendering";
import { getCosToken } from "../../../api/upload";
import COS from "cos-js-sdk-v5";
import qs from "qs";
import userVideoApi from "Api/userVideo";
import { upload, host } from "Config/env";
import { getItem, getUserSetting, localStorageKey, setItem } from "../../../util/storageLocal";
import {
    EDITOR_PRODUCT,
    PAY_STATUS,
    PLATFORM_NAME,
    RENDER_STATUS,
    VIDEO_RENDER_NAME,
    VIDEO_RENDER_TYPE,
    XIU_DIAN,
    OPEN_FROM
} from "../../../config/staticParams";
import {
    benefitGoods,
    benefitSign,
    cancelRender,
    hdFinishClear,
    shareType,
    createVideoOrder,
    getMallsCallbackUrl,
    memberExpiryTime,
    getUpdateCoverImageRender
} from "../../../api/userVideo";
import { delay } from "../../../util/delayLoad";
import {
    POS_FROM,
    RENDER_VIDEO_GOODS_ID,
    TYPE_BTN,
    TYPE_PAGE
} from "../../../config/staticParams/goodsParams";
import empty from "../../static/simpleEditor/empty.png";
import { Confirm } from "../../components/popconfirm";
import { ComVip, getBuyKey } from "../../components/vip";
import { jsonList } from "./json";
import EditTitle from "./editTitle";
import Left from "./left";
import Share from "../../components/share";
import { getMediaAdPublisher, getMediaAdpDomain } from "Api/ad";
import { isChuangYiyunVip } from "../../../models/User";
import { getClickPosition, getURLObj, handleBtnText, textTip } from "../../../util/util";
import { platformActions, sendPlatformPage } from "../../../util/platform";
import MediaPromote from "./promote";
import { genUrl } from "../../../util/image";

let timer = null;
let timerCoverImg = null;

@connect(user => user)
class ShareDownload extends React.PureComponent {
    constructor(props) {
        super(props);
        this.goods = []; // 商品
        this.sign = ""; // 签名
        this.goodsId = 0; // 商品id
        this.renderList = {};
        this.isFirst = true;
        this.clickPosition = getClickPosition(props.typePage);
        this.state = {
            active: VIDEO_RENDER_TYPE.SDNoWaterMark, // 默认激活标清有水印
            openRightModal: false, // 购买提示框
            checked: true, // 用剩下的权益抵扣
            singleBuyConfirm: false, // 字幕是否自动识别
            noneTipchecked: false, // 不在提示
            id: "", // 渲染开始
            createTime: "2018-11-02 17:31:58",
            videoDuration: 40,
            title: "",
            videoDescribe: "",
            openDownLoadList: false,
            hdid: null,
            normalid: null,
            loading: false,
            SDprice: 0, // 标清定价
            HDprice: 0, // 高清定价
            SDSurpluse: 0, // 标清剩余权益
            HDSurpluse: 0, // 标清剩余权益
            count: 0, // 权益数量
            navActive: props.typePage,
            clickThis: false,
            openFrom: "",
            isMediaAdDomain: false // 是否流量主
        };
    }

    componentDidMount() {
        const {
            props: { videoId, hdRenderFinish = false, refresh = () => true }
        } = this;
        timer = true;
        this.getHdStatus(); // 获取作品渲染的进度详情
        this.initCos(); // 实例化腾讯云下载对象
        this.onLoadDetail(); // 获取作品的的详情
        this.getBenefitGgoods() // 获取用户剩余权益和标清和高清定价
            .then(() => {
                // 默认激活状态
                const active =
                    (this.state.product == EDITOR_PRODUCT.selfieVideo &&
                        VIDEO_RENDER_TYPE.SDNoWaterMark) ||
                    (this.isChuangYiyunVip() && VIDEO_RENDER_TYPE.SDNoWaterMark) ||
                    VIDEO_RENDER_TYPE.SDWaterMark;
                this.setState({ active });
            }); // 获取权益相关
        if (hdRenderFinish) {
            hdFinishClear(videoId).then(() => {
                refresh(false);
            });
        }
        this.mediaAd();
        this.handleURL(); // 嵌入长页和h5中,根据地址处理参数，在视频预览和生成中显示在Tab
        this.handleMemberExpiryTime(); // 获取创意云会员的到期时间以及是否显示续费
    }

    componentDidUpdate(prevProps, prevState) {
        /* if (prevProps.id !== this.props.id) {
            this.onLoadDetail();
        }*/
        // 状态更改时重新拉取权益
        const statusChange = Object.values(VIDEO_RENDER_TYPE).some(item => {
            const key = `${item}_status`;
            return prevState[key] !== this.state[key];
        });
        if (statusChange) {
            this.getBenefitGgoods();
        }
    }

    componentWillUnmount() {
        timer = null;
        timerCoverImg = null;
        this.setState = () => null;
    }

    /**
     * 嵌入长页和h5中,根据地址处理参数，在视频预览和生成中显示在Tab中
     */
    handleURL = () => {
        const URLObj = getURLObj(window.location.href);
        if (URLObj.openFrom) {
            this.setState({
                openFrom: URLObj.name,
                navActive: TYPE_PAGE.implant
            });
        }
    };
    /**
     * 获取创意云会员的到期时间以及是否显示续费
     */
    handleMemberExpiryTime = () => {
        memberExpiryTime().then(res => {
            const {
                data: { success, map }
            } = res;
            if (success && map) {
                const { expiryTime, prompt } = map;
                this.setState({ expiryTime, prompt });
            }
        });
    };
    /**
     * 修改封面中，获取封面修改进度和状态
     */
    handleGetUpdateCoverImageRender = async () => {
        const { videoId } = this.props;
        const {
            data: { success, obj }
        } = await getUpdateCoverImageRender(videoId);
        this.setState({
            coverImgStatus: obj.status,
            coverImgRenderProgress: obj.renderProgress
        });
        if (success) {
            if (obj.status !== RENDER_STATUS.success) {
                await delay(1000);
                if (timerCoverImg) {
                    await this.handleGetUpdateCoverImageRender();
                }
            } else if (obj.status === RENDER_STATUS.fail) {
                timerCoverImg = false;
                return true;
            } else {
                timerCoverImg = false;
                await this.onLoadDetail();
            }
        }
    };

    /**
     * 判断是否是创意云会员
     * @returns
     */
    isChuangYiyunVip = () => {
        const { active } = this.state;
        const isHd = active === VIDEO_RENDER_TYPE.HDNoWaterMark;
        const { benefitCount = 0 } =
            this.goods.find(
                value => value.id === (isHd ? RENDER_VIDEO_GOODS_ID.hd : RENDER_VIDEO_GOODS_ID.sd)
            ) || {};
        return benefitCount === -1;
    };
    cancelBtn = () => {
        this.setState({ clickThis: false });
    };

    /**
     * 获取按钮状态
     * @returns 返回按钮状态对象
     */
    getButtonState = () => {
        const {
            props: { typePage = TYPE_PAGE.download },
            state: { active, coverImageUpdating, ...state }
        } = this;
        let status = PAY_STATUS.pay;
        const orderReuslt = this.getOrderAmountCount();
        const videoStatus = state[`${active}_status`];
        const isHD = active === VIDEO_RENDER_TYPE.HDNoWaterMark;
        const surpluse = isHD ? state.HDSurpluse : state.SDSurpluse;
        if (videoStatus === RENDER_STATUS.success) {
            // 如果已经生成
            status = PAY_STATUS.done;
        } else if (videoStatus === RENDER_STATUS.rendering) {
            // 正在渲染中
            status = PAY_STATUS.rendering;
        } else if (
            this.isChuangYiyunVip() ||
            !orderReuslt || // 可以进行渲染
            orderReuslt.orderAmount === 0 ||
            active === VIDEO_RENDER_TYPE.SDWaterMark
        ) {
            status = PAY_STATUS.render;
        }
        const isShare = state.navActive === TYPE_PAGE.share;
        const btnText = handleBtnText(status, state.navActive);
        const renewalsAttr = {
            children: TYPE_BTN.vipRenewals,
            onClick: this.handleVipRenewals,
            className: `${styles.comBtn} ${styles.vipBtn} ${this.handleBtnDisabled(
                coverImageUpdating
            )}`
        };
        const renewalsBtn =
            this.isChuangYiyunVip() && state.prompt && !this.isRecentlyBuyVip() ? renewalsAttr : {};
        const btnStates = {
            pay: [
                {
                    children:
                        surpluse > 0
                            ? `还需支付${orderReuslt.orderAmount}秀点`
                            : btnText.payBtnText,
                    onClick: this.handleRights,
                    onConfirm: () => this.handleSingleBuyConfirm(false),
                    className: `${styles.comBtn} ${this.handleBtnDisabled(coverImageUpdating)}`
                },
                {
                    children: btnText.vipBtnText,
                    onClick: this.handleVip,
                    className: `${styles.comBtn} ${styles.vipBtn} ${this.handleBtnDisabled(
                        coverImageUpdating
                    )}`
                }
            ],
            render: [
                {
                    children: btnText.payBtnText,
                    onClick: this.handleRender,
                    onConfirm: () => this.handleSingleBuyConfirm(true),
                    className: `${styles.comBtn} ${this.handleBtnDisabled(coverImageUpdating)}`
                },
                {
                    ...renewalsBtn
                }
            ],
            rending: [
                {
                    children: videoStatus === RENDER_STATUS.fail ? "生成失败" : "视频生成中...",
                    disabled: true,
                    onClick: null,
                    className: `${styles.comBtn} ${styles.btnDisabled}`
                }
            ],
            done: [
                {
                    children: btnText.payBtnText,
                    share: isShare ? 1 : 0,
                    className: isShare
                        ? `${styles.comBtn2} ${this.handleBtnDisabled(coverImageUpdating)}`
                        : `${styles.comBtn} ${this.handleBtnDisabled(coverImageUpdating)}`,
                    onClick: this.onDownLoadHd
                },
                {
                    ...renewalsBtn
                }
            ]
        };

        return btnStates[status];
    };
    /*
     * 视频正在渲染中或则视频封面正在生成中按钮变灰
     */
    handleBtnDisabled = status => {
        if (status) {
        }
    };
    handleRender = (render = true) => {
        this.handleBuyXiudianTip(render);
    };
    /**
     * 获取用户剩余权益和标清和高清定价
     */
    getBenefitGgoods = () => {
        return benefitGoods()
            .then(res => {
                const {
                    data: { success, list }
                } = res;
                if (success && Array.isArray(list)) {
                    this.goods = list;
                    const sdGoods = list.find(v => v.id === RENDER_VIDEO_GOODS_ID.sd);
                    const hdGoods = list.find(v => v.id === RENDER_VIDEO_GOODS_ID.hd);
                    if (!sdGoods || !hdGoods) {
                        Message.error("商品获取有误");
                        return false;
                    }
                    const SDprice = sdGoods.price / 100; // 标清定价
                    const HDprice = hdGoods.price / 100; // 高清定价
                    const SDSurpluse = sdGoods.benefitCount || 0; // ? 0 : sdGoods.benefitCount; // 标清剩余权益
                    const HDSurpluse = hdGoods.benefitCount || 0; // : hdGoods.benefitCount; // 高清剩余权益
                    this.setState({
                        SDprice,
                        HDprice,
                        SDSurpluse,
                        HDSurpluse
                    });
                }
            })
            .catch(e => console.error());
    };

    /**
     * 处理商品详情
     * @returns 返回购买商品的名称、金额、权益、ID
     */
    getOrderAmountCount = () => {
        const { state } = this;
        const { active } = state;
        const isHd = active === VIDEO_RENDER_TYPE.HDNoWaterMark;
        const goods =
            this.goods.find(v => v.id === RENDER_VIDEO_GOODS_ID[isHd ? "hd" : "sd"]) || {};
        const benefitCount = !goods.benefitCount ? 0 : goods.benefitCount;
        let orderAmount = 0;
        let count = 0;
        if (state.checked) {
            // 使用剩余权益抵扣金额
            count = ~~state.videoDuration - benefitCount;
            orderAmount = ~~(((~~state.videoDuration - benefitCount) * goods.price) / 100);
        } else {
            count = ~~state.videoDuration;
            orderAmount = ~~((~~state.videoDuration * goods.price) / 100);
        }
        // 订单金额小于0的话 取0
        orderAmount = Math.max(0, orderAmount);
        this.setState({ count });

        return {
            productName: `${(VIDEO_RENDER_NAME[active] || {}).name}`,
            orderAmount,
            count,
            orderProductId: goods.id
        };
    };
    /**
     * 购买签名
     * @returns 签名成功返回true,否则返回false
     */
    signParams = {};
    getBenefitSign = async () => {
        const AmountCountObj = this.getOrderAmountCount();
        if (!AmountCountObj) return;

        // 创建视频订单
        const {
            props: { videoId },
            state: { active, templateId }
        } = this;
        const { data: orderData } = await createVideoOrder({
            templateId,
            videoId,
            videoType: active
        });
        if (!orderData.success && orderData.code !== 200) {
            return false;
        }

        //获取商城回调地址
        const { data: mallsCallBackData } = await getMallsCallbackUrl();
        let callBackUrl = "";
        if (mallsCallBackData.success && mallsCallBackData.code === 200) {
            callBackUrl = mallsCallBackData.obj;
        }
        // callBackUrl = 'aidl.natapp4.cc/order/callback/malls';
        const params = {
            productName: AmountCountObj.productName,
            orderProductId: AmountCountObj.orderProductId,
            count: AmountCountObj.count,
            orderAmount: !AmountCountObj.orderAmount ? 0 : AmountCountObj.orderAmount,
            orderType: XIU_DIAN.orderType,
            orderAppId: XIU_DIAN.orderAppId,
            orderRemark: "",
            returnUrl: callBackUrl,
            notifyUrl: callBackUrl,
            orderTradeId: orderData.obj || "",
            productId: "",
            properties: ""
        };
        this.signParams = params;
        const {
            data: { success, obj }
        } = await benefitSign(params);
        if (success) {
            this.sign = obj;
            return true;
        } else {
            return false;
        }
    };
    /**
     * 分享设置
     * @params value= 201/202/203
     */
    handelShareType = (value, longpage = false) => {
        const {
            props,
            props: { typePage },
            state: { navActive }
        } = this;
        shareType(props.videoId, value)
            .then(res => {
                const { data } = res;
                if (longpage) {
                    // 分享设置成功嵌入长页 通知长页关闭tab
                    this.handleImplantVideo();
                }
                if (data.success) {
                    this.onLoadDetail();
                    this.setState({ clickThis: false });
                    Message.success("保存成功");
                } else {
                    Message.error("失败");
                }
            })
            .catch(e => console.error(e));
    };
    /**
     * 生成中的视频取消渲染
     * @params videoType = 201/202/203
     */
    onCancelRender = videoType => {
        const {
            props: { videoId }
        } = this;
        cancelRender(videoId, videoType).then(res => {
            const { data } = res;
            if (data.success) {
                Message.success("取消成功");
                this.getBenefitGgoods();
            } else {
                Message.error("取消失败");
            }
        });
    };

    /**
     * 实例化腾讯云下载对象
     */
    initCos = () => {
        const cosToken = getCosToken(true);
        this.Cos = new COS({
            // 必选参数
            getAuthorization: (options, callback) => {
                cosToken.then(
                    res => {
                        if (res.data && res.data.success) {
                            const data = res.data.obj;
                            callback({
                                TmpSecretId: data.tmpSecretId,
                                TmpSecretKey: data.tmpSecretKey,
                                XCosSecurityToken: data.sessionToken,
                                ExpiredTime: data.expiredTime
                            });
                        }
                    },
                    error => {
                        console.log("获取Token错误");
                        console.log(error);
                    }
                );
            },
            FileParallelLimit: 20, // 控制文件上传并发数
            ChunkParallelLimit: 9, // 控制单个文件下分片上传并发数
            ProgressInterval: 100 // 控制上传的 onProgress 回调的间隔
        });
    };
    /**
     * 改变loading状态
     * @param state
     */
    changeLoading = state => {
        this.setState({ loading: state });
    };
    /**
     * 获取作品的的详情
     */
    onLoadDetail = async () => {
        const id = this.props.videoId;
        this.changeLoading(true);
        // 查询详情
        const { data } = await userVideoApi.getDetail(id);
        if (data.success) {
            this.setState({
                ...data.obj,
                active: data.obj.shareType
            });
            if (this.isChuangYiyunVip()) {
                // 创意云会员
                if (this.state.navActive === TYPE_PAGE.download) {
                    this.setState({
                        active: VIDEO_RENDER_TYPE.SDNoWaterMark
                    });
                }
            } else {
                // 非创意云会员
                if (this.state.navActive === TYPE_PAGE.download) {
                    this.setState({
                        active: VIDEO_RENDER_TYPE.SDWaterMark
                    });
                }
            }
            // App实拍模板的shareType 有点问题，前端使用强制措施。
            if (data.obj.product === EDITOR_PRODUCT.selfieVideo) {
                this.setState({ active: VIDEO_RENDER_TYPE.SDNoWaterMark });
            }
            if (data.obj.coverImageUpdating && !timerCoverImg) {
                timerCoverImg = true;
                this.handleGetUpdateCoverImageRender(); // 修改封面中，获取封面修改进度和状态
            }
            this.changeLoading(false);
        } else {
            this.changeLoading(false);
        }
    };
    timerCoverImg = (data = null) => {
        timerCoverImg = data;
    };
    /**
     * 获取高清渲染状态
     */
    getHdStatus = async () => {
        const { typePage } = this.props;
        const id = this.props.videoId;
        this.changeLoading(true);
        /* if (!this.state.previewUrl) {
            // todo ：去掉观察
            this.onLoadDetail();
        }*/
        // 查询状态
        const {
            data: { success, map }
        } = await userVideoApi.getRenderStatus(id);
        if (!success) return false;
        const hdObj = map[VIDEO_RENDER_TYPE.HDNoWaterMark];
        const noWaterSD = map[VIDEO_RENDER_TYPE.SDNoWaterMark];
        const normalArray = map[VIDEO_RENDER_TYPE.SDWaterMark];
        let newState = {};
        if (normalArray) {
            newState.normalid = normalArray.id;
        }
        this.renderList = {
            [VIDEO_RENDER_TYPE.SDWaterMark]: normalArray,
            [VIDEO_RENDER_TYPE.SDNoWaterMark]: noWaterSD,
            [VIDEO_RENDER_TYPE.HDNoWaterMark]: hdObj
        };
        newState = {
            ...newState,
            [`${VIDEO_RENDER_TYPE.HDNoWaterMark}_status`]: hdObj.status,
            [`${VIDEO_RENDER_TYPE.SDWaterMark}_status`]: normalArray.status,
            [`${VIDEO_RENDER_TYPE.SDNoWaterMark}_status`]: noWaterSD.status,
            [`${VIDEO_RENDER_TYPE.HDNoWaterMark}_progress`]: hdObj.renderProgress || 0,
            [`${VIDEO_RENDER_TYPE.SDWaterMark}_progress`]: normalArray.renderProgress || 0,
            [`${VIDEO_RENDER_TYPE.SDNoWaterMark}_progress`]: noWaterSD.renderProgress || 0,
            [`${VIDEO_RENDER_TYPE.HDNoWaterMark}_url`]: hdObj.url,
            [`${VIDEO_RENDER_TYPE.SDWaterMark}_url`]: normalArray.url,
            [`${VIDEO_RENDER_TYPE.SDNoWaterMark}_url`]: noWaterSD.url
        };
        if (this.isFirst && typePage === TYPE_PAGE.download) {
            this.isFirst = false;
            // 第一次重设默认选择
            const type =
                (hdObj.url && VIDEO_RENDER_TYPE.HDNoWaterMark) ||
                (noWaterSD.url && VIDEO_RENDER_TYPE.SDNoWaterMark) ||
                (normalArray.url && VIDEO_RENDER_TYPE.SDWaterMark);
            this.choice(type);
        }
        this.setState({ ...newState });
        if (
            timer &&
            (hdObj.status !== RENDER_STATUS.rendering ||
                noWaterSD.status !== RENDER_STATUS.rendering ||
                normalArray.status !== RENDER_STATUS.rendering)
        ) {
            if (typeof this.props.refresh === "function") {
                this.props.refresh(false);
            }
        }
        if (
            timer &&
            (hdObj.status !== RENDER_STATUS.success ||
                noWaterSD.status !== RENDER_STATUS.success ||
                normalArray.status !== RENDER_STATUS.success)
        ) {
            await delay(3000);
            return this.getHdStatus();
        }
    };
    /**
     * 点击下载高清，有则直接下载 没有则请求
     * @returns {boolean}
     */
    onDownLoadHd = () => {
        const {
            props: { typePage },
            state,
            state: { navActive, id, templateId, playCode, coverImageUpdating }
        } = this;
        const { active } = state;
        if (this.renderList[active].url) {
            if (coverImageUpdating) return false;
            if (navActive === TYPE_PAGE.share) {
                // 分享设置
                this.handelShareType(state.active);
            } else if (navActive === TYPE_PAGE.implant) {
                // 嵌入视频
                // 更新分享设置
                this.handelShareType(state.active, true);
            } else {
                this.commonDownLoad(true);
            }
        } else {
            this.sendRender(state.active);
        }
    };
    /**
     * 嵌入视频,发送参数到长页h5
     * @returns {boolean}
     */
    handleImplantVideo = () => {
        const {
            state: { id, templateId, playCode, coverImg },
            props: { eqxCollectInfo }
        } = this;
        sendPlatformPage(platformActions.publishPage, {
            id,
            templateId,
            playCode,
            coverImg,
            ...eqxCollectInfo
        });
        this.props.onClose();
    };

    /**
     * 渲染视频
     * @params 视频类型 type = 201/202/203
     */
    sendRender = type => {
        const {
            props: { videoId }
        } = this;
        this.setState({ loading: true });
        userVideoApi
            .render(videoId, type)
            .then(res => {
                if (res.data.success) {
                    this.getHdStatus();
                    Message.success("请求成功,请等待渲染完毕后即可下载");
                    this.props.refresh(false);
                } else {
                    this.setState({ singleBuyConfirm: false });
                }
                this.setState({ loading: false });
            })
            .catch(err => this.setState({ loading: false }));
    };

    /**
     * 公共下载方法
     * @param isHd {boolean} 是否高清
     */
    commonDownLoad() {
        const {
            state,
            state: { navActive },
            props: { videoId, typePage = TYPE_PAGE.download }
        } = this;
        const { title, active } = state;
        const obj = this.renderList[active] || {};
        const { url } = obj;
        if (!url) {
            Message.error("还没有进行生成");
            return false;
        }
        const isHD = active === VIDEO_RENDER_TYPE.HDNoWaterMark;
        // 转义部分符号以避免无法下载
        const fileName = `${title.replace(/;/g, "").replace(/,/g, "，")}-${
            isHD ? "高清" : "标清"
        }.mp4`;
        this.sendBigData(active);

        function downLoadUrl(purl) {
            const a = document.createElement("a");
            const event = new MouseEvent("click");
            a.download = fileName || "";
            a.target = "_blank";
            a.href = purl;
            a.dispatchEvent(event);
        }

        if (url.includes(".eqh5")) {
            return downLoadUrl(`${url}?attname=${fileName}`);
        }
        this.Cos.getObjectUrl(
            {
                Bucket: `${upload.bucket}-${upload.appid}` /* 必须 */,
                Region: upload.region /* 必须 */,
                Key: url,
                Sign: true
            },
            (err, data) => {
                if (navActive === TYPE_PAGE.download) {
                    userVideoApi.addDownLoad(videoId, isHD ? 2 : 1, url, active);
                    const { Url } = data;
                    const downLoadParams = {
                        ["response-content-disposition"]: `attachment;filename=${fileName}`,
                        ["response-content-type"]: "video/mp4"
                    };
                    const purl = `${Url}${Url.indexOf("?") > -1 ? "&" : "?"}${qs.stringify(
                        downLoadParams
                    )}`;
                    downLoadUrl(purl);
                }
            }
        );
    }

    sendBigData() {
        const {
            props: { videoId },
            state: { active, videoDuration, userId, platform }
        } = this;
        const isWatermark = active === VIDEO_RENDER_TYPE.SDWaterMark;
        const resolution = active === VIDEO_RENDER_TYPE.HDNoWaterMark ? "hd" : "sd";
        const formPlatform = (PLATFORM_NAME[platform] || { name: "pc" }).name;
        sendBDDownload({
            id: videoId,
            userId: userId,
            duration: videoDuration,
            isWatermark,
            resolution,
            formPlatform
        });
    }

    /**
     *************页面部分*********
     */
    choice = value => {
        const {
            state,
            state: { shareType, active, coverImageUpdating },
            props: { positionFrom = POS_FROM.workSpace }
        } = this;
        if (positionFrom === POS_FROM.editorSpace) {
            // 为编辑器中且默认分享正在渲染中是阻止切换卡片的
            if (active === shareType) {
                if (state[`${active}_status`] === RENDER_STATUS.rendering) {
                    Message.warning("默认视频正在渲染中，请稍等一下...");
                    return;
                }
            }
        }
        if (coverImageUpdating) {
            Message.warning("封面图正在生成中，请稍等等一下...");
            return;
        }
        this.setState({
            active: value,
            singleBuyConfirm: false,
            checked: true
        });
        if (value === VIDEO_RENDER_TYPE.SDNoWaterMark) {
            this.goodsId = RENDER_VIDEO_GOODS_ID.sd;
        } else if (value === VIDEO_RENDER_TYPE.HDNoWaterMark) {
            this.goodsId = RENDER_VIDEO_GOODS_ID.hd;
        }
    };
    /**
     * 单次购买权益下载，有地址这走渲染和下载流程，否则获取签名购买
     */
    handleRights = async () => {
        const { active } = this.state;
        if (!this.renderList[active].url) {
            // 不存在下载地址的时候在进行签名
            const res = await this.getBenefitSign(); //  获取签名
            if (!res) return;
        } else {
            this.onDownLoadHd();
            return;
        }
        this.handleBuyXiudianTip(false);
    };

    handleBuyXiudianTip = (render = false) => {
        const {
            state: { active, videoDuration }
        } = this;
        if (
            !getItem(localStorageKey.buyXiudianTip) &&
            !this.isChuangYiyunVip() &&
            active !== VIDEO_RENDER_TYPE.SDWaterMark &&
            videoDuration >= 2
        ) {
            this.setState({ singleBuyConfirm: true });
        } else {
            this.handleSingleBuyConfirm(render);
        }
    };

    onCloseRightsModal = () => {
        this.setState({ openRightModal: false });
    };
    handleVipRenewals = () => {
        this.clickPosition = "会员续费";
        this.handleVip();
    };
    /**
     * 会员购买，购买成功后渲染和下载
     */
    handleVip = () => {
        const {
            state: { active, templateId },
            props: { typePage = TYPE_PAGE.download, videoId }
        } = this;
        const textInfo = textTip(typePage);
        const sendParams = {
            source: `[${active === VIDEO_RENDER_TYPE.HDNoWaterMark ? "高清" : "标清"}]${textInfo}`,
            videoId,
            templateId,
            benefit: active === VIDEO_RENDER_TYPE.HDNoWaterMark ? "hd" : "sd",
            isVip: isChuangYiyunVip(),
            clickPosition: this.clickPosition
        };
        if (isChuangYiyunVip()) {
            sendBDEvent({
                position: "视频预览-会员续费",
                type: "点击会员续费"
            });
        }
        ComVip({
            ...sendParams
        })
            .then(async res => {
                this.forceUpdate();
                await this.getBenefitGgoods();
                this.onDownLoadHd();
            })
            .catch(re => re);
    };
    onChange = e => {
        this.setState({ checked: e.target.checked });
    };
    onChangeTip = e => {
        this.setState({ noneTipchecked: e.target.checked });
        setItem(localStorageKey.buyXiudianTip, e.target.checked);
    };
    handleSingleBuyConfirm = render => {
        if (render) {
            this.onDownLoadHd();
            this.setState({ singleBuyConfirm: false });
        } else {
            this.setState({ openRightModal: true });
            this.setState({ singleBuyConfirm: false });
        }
    };
    cancelSingleBuyConfirm = () => {
        this.setState({ singleBuyConfirm: false });
    };
    reGen = async type => {
        this.sendRender(type);
    };
    /**
     * tab 切换
     */
    navActive = async (e, value) => {
        if (this.compatibleOldData()) {
            let openPromoteModal = false;
            // 新媒体推广
            if (value === TYPE_PAGE.promote) {
                openPromoteModal = true;
            }
            this.setState({
                navActive: value,
                clickThis: false,
                openPromoteModal
            });
        }
        this.clickPosition = getClickPosition(value);
        await this.onLoadDetail();
    };
    /**
     * 分享脏数据兼容，shareType 存在，但是没有预览视频地址
     */
    compatibleOldData = () => {
        const { state } = this;
        const isTrue =
            state[`${VIDEO_RENDER_TYPE.SDWaterMark}_status`] === RENDER_STATUS.success ||
            state[`${VIDEO_RENDER_TYPE.SDNoWaterMark}_status`] === RENDER_STATUS.success ||
            state[`${VIDEO_RENDER_TYPE.HDNoWaterMark}_status`] === RENDER_STATUS.success;
        return isTrue;
    };
    /**
     * 某一个类型视频在渲染中就返回true
     */
    getRenderingSomeone = () => {
        const { state } = this;
        const isTrue =
            state[`${VIDEO_RENDER_TYPE.SDWaterMark}_status`] === RENDER_STATUS.rendering ||
            state[`${VIDEO_RENDER_TYPE.SDNoWaterMark}_status`] === RENDER_STATUS.rendering ||
            state[`${VIDEO_RENDER_TYPE.HDNoWaterMark}_status`] === RENDER_STATUS.rendering;
        return isTrue;
    };
    /**
     * 某一个类型视频存在url并且状态为success就返回true
     */
    getGenVideoURL = () => {
        const { state } = this;
        const isTrue =
            (state[`${VIDEO_RENDER_TYPE.SDWaterMark}_url`] &&
                state[`${VIDEO_RENDER_TYPE.SDWaterMark}_status`] === RENDER_STATUS.success) ||
            (state[`${VIDEO_RENDER_TYPE.SDNoWaterMark}_url`] &&
                state[`${VIDEO_RENDER_TYPE.SDNoWaterMark}_status`] === RENDER_STATUS.success) ||
            (state[`${VIDEO_RENDER_TYPE.HDNoWaterMark}_url`] &&
                state[`${VIDEO_RENDER_TYPE.HDNoWaterMark}_status`] === RENDER_STATUS.success);
        return isTrue;
    };

    getVideoURL = () => {
        const { state } = this;
        let url = "";
        if (
            state[`${VIDEO_RENDER_TYPE.HDNoWaterMark}_url`] &&
            state[`${VIDEO_RENDER_TYPE.HDNoWaterMark}_status`] === RENDER_STATUS.success
        ) {
            url = state[`${VIDEO_RENDER_TYPE.HDNoWaterMark}_url`];
        }
        if (
            state[`${VIDEO_RENDER_TYPE.SDNoWaterMark}_url`] &&
            state[`${VIDEO_RENDER_TYPE.SDNoWaterMark}_status`] === RENDER_STATUS.success
        ) {
            url = state[`${VIDEO_RENDER_TYPE.SDNoWaterMark}_url`];
        }

        if (
            state[`${VIDEO_RENDER_TYPE.SDWaterMark}_url`] &&
            state[`${VIDEO_RENDER_TYPE.SDWaterMark}_status`] === RENDER_STATUS.success
        ) {
            url = state[`${VIDEO_RENDER_TYPE.SDWaterMark}_url`];
        }
        return genUrl(url);
    };

    shareBigSend = act => {
        const {
            state: { shareType, platform, videoDuration: duration },
            props: { userId, id }
        } = this;
        const resolution = shareType === VIDEO_RENDER_TYPE.HDNoWaterMark ? "hd" : "sd";
        const isWatermark = shareType === VIDEO_RENDER_TYPE.SDWaterMark;
        const formPlatform = (PLATFORM_NAME[platform] || { name: "pc" }).name;
        const params = {
            id,
            act,
            resolution,
            userId,
            formPlatform,
            isWatermark,
            duration
        };
        sendBDShare(params);
    };
    /**
     * 流量主广告
     */
    mediaAd = async () => {
        const {
            data: { success, obj }
        } = await getMediaAdPublisher();
        if (success && obj === true) {
            this.setState(
                {
                    isMediaAdDomain: true
                },
                () => {
                    const URLObj = getURLObj(window.location.href);
                    if (
                        this.props.positionFrom !== POS_FROM.workSpace &&
                        URLObj.openFrom !== OPEN_FROM.longPage
                    ) {
                        this.setState({
                            navActive: TYPE_PAGE.promote
                        });
                    }
                }
            );
            const { data: domain, status } = await getMediaAdpDomain(9);
            if (status === 200 && domain.length > 0) {
                const index = Math.floor(Math.random() * domain.length);
                //随机取一个域名
                const { protocol } = window.location;
                this.setState({
                    adDomain: `http://${domain[index]}`
                });
            }
        }
    };
    onChangeShowAuthor = e => {
        return userVideoApi
            .showAuthor(this.props.id, e.target.checked)
            .then(res => this.onLoadDetail());
    };
    shareSet = () => {
        this.setState({ clickThis: true });
    };
    onClose = (e, fromWorkSpace = false) => {
        const {
            state,
            props: { positionFrom = "workSpace" }
        } = this;
        if (positionFrom === POS_FROM.editorSpace || fromWorkSpace) {
            // 在工作台
            const {
                props: { videoId }
            } = this;
            if (state[`${VIDEO_RENDER_TYPE.SDWaterMark}_status`] === RENDER_STATUS.rendering) {
                this.cancelRendeing(videoId, VIDEO_RENDER_TYPE.SDWaterMark);
            }
            if (state[`${VIDEO_RENDER_TYPE.SDNoWaterMark}_status`] === RENDER_STATUS.rendering) {
                this.cancelRendeing(videoId, VIDEO_RENDER_TYPE.SDNoWaterMark);
            }
            if (state[`${VIDEO_RENDER_TYPE.HDNoWaterMark}_status`] === RENDER_STATUS.rendering) {
                this.cancelRendeing(videoId, VIDEO_RENDER_TYPE.HDNoWaterMark);
            }
        }
        this.props.onClose(state.status === 4 && positionFrom === POS_FROM.editorSpace);
    };

    /**
     * 取消渲染视频
     * @params 视频类型 shareType = 201/202/203
     */
    cancelRendeing = (videoId, shareType) => {
        cancelRender(videoId, shareType).then(res => {
            const { data } = res;
            if (data.success) {
                Message.success("取消成功");
                this.getBenefitGgoods();
            } else {
                Message.error("取消失败");
            }
        });
    };
    /**
     * 是否是才买过vip
     */
    isRecentlyBuyVip = () => {
        const expires = getUserSetting(getBuyKey()) || 0;
        if (expires < Date.now() - 30 * 60 * 1000) {
            return false;
        }
        return true;
    };

    render() {
        const {
            state,
            state: { active, playCode, adDomain, navActive, shareType },
            props,
            props: { typePage = TYPE_PAGE.download, videoId }
        } = this;
        const vipBtnIfon = textTip(navActive);
        const sendParams = {
            source: `[${
                active === VIDEO_RENDER_TYPE.HDNoWaterMark ? "高清" : "标清"
            }]${vipBtnIfon}`,
            videoId
        };
        let Surpluse = 0;
        let resolutionPower = "";
        if (state.active === VIDEO_RENDER_TYPE.SDNoWaterMark) {
            Surpluse = state.SDSurpluse;
            resolutionPower = "标清";
        } else if (state.active === VIDEO_RENDER_TYPE.HDNoWaterMark) {
            Surpluse = state.HDSurpluse;
            resolutionPower = "高清";
        }

        // 获取按钮状态 志刚同学请看这个方法
        const btnState = this.getButtonState();
        const isShowCheckbox =
            state.active !== VIDEO_RENDER_TYPE.SDWaterMark &&
            this.goods.length > 0 &&
            !this.isChuangYiyunVip() &&
            (this.goods.find(v => v.id === this.goodsId) || {}).benefitCount > 0 &&
            state[`${active}_status`] !== RENDER_STATUS.success &&
            state.videoDuration >= 2;
        const isShowSubtitlesTypeMonkey = [
            EDITOR_PRODUCT.subtitles,
            EDITOR_PRODUCT.typeMonkey
        ].includes(state.product);
        const isSelfVideo = [EDITOR_PRODUCT.selfieVideo].includes(state.product);
        const cardBox = (
            <div className={styles.cardBox}>
                {jsonList.map((v, i) => {
                    if (
                        (v.choiceType === VIDEO_RENDER_TYPE.HDNoWaterMark &&
                            isShowSubtitlesTypeMonkey) ||
                        (isSelfVideo && v.choiceType !== VIDEO_RENDER_TYPE.SDNoWaterMark)
                    ) {
                        return;
                    } else {
                        return (
                            <div
                                key={i}
                                onClick={() => this.choice(v.choiceType)}
                                className={`${styles[`${v.boxDOM}`]} ${styles.card} ${
                                    state.active === v.choiceType ? styles.active : ""
                                }`}>
                                <p className={`${styles.title} ${styles[`${v.titleDom}`]}`}>
                                    {isSelfVideo ? "标清视频" : v.titleText}
                                </p>
                                <p className={`${styles.xiuDot} ${styles[`${v.titleDom}`]}`}>
                                    {v.choiceType === VIDEO_RENDER_TYPE.SDWaterMark && "免费"}
                                    {v.choiceType !== VIDEO_RENDER_TYPE.SDWaterMark && (
                                        <React.Fragment>
                                            <span className={styles.bigTitle}>
                                                {
                                                    ~~(
                                                        ~~state.videoDuration *
                                                        state[`${v.priceRate}`]
                                                    )
                                                }
                                            </span>
                                            <span className={styles.smTitle}>{v.xiuDotText}</span>
                                            {this.isChuangYiyunVip() && <i />}
                                        </React.Fragment>
                                    )}
                                </p>
                                {v.xiuDotPrice && (
                                    <div className={`${styles[`${v.xiuDotPrice}`]}`}>
                                        1秒={state[`${v.priceRate}`]}
                                        {v.xiuDotText}
                                    </div>
                                )}
                                <div className={styles.infoWrap}>
                                    <div className={styles.left}>
                                        {v.leftLabel.map((m, n) => (
                                            <Icon
                                                key={n}
                                                className={styles[`${m.className}`]}
                                                type={m.type}
                                            />
                                        ))}
                                    </div>
                                    <div className={styles.right}>
                                        {v.rightLabel.map((x, y) => (
                                            <p key={y} className={styles[`${x.className}`]}>
                                                {isSelfVideo && String(x.text).includes("水印")
                                                    ? "文件较小"
                                                    : x.text}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                                {state[`${v.choiceType}_status`] === RENDER_STATUS.success && (
                                    <img src={gen} className={styles.gen} width='44' height='39' />
                                )}
                                {v.choiceType !== VIDEO_RENDER_TYPE.SDWaterMark && (
                                    <div className={styles.vip}>会员免费</div>
                                )}

                                {state[`${v.choiceType}_status`] === RENDER_STATUS.rendering && (
                                    <Rendering
                                        {...state}
                                        key={i}
                                        Index={v.choiceType}
                                        positionFrom={props.positionFrom}
                                        singleProgress={state[`${v.choiceType}_progress`]}
                                        isVip={this.isChuangYiyunVip()}
                                        onCancelRender={this.onCancelRender}
                                    />
                                )}
                                {state[`${v.choiceType}_status`] === RENDER_STATUS.fail && (
                                    <div className={styles.fail}>
                                        <img src={empty} width='100' alt='' />
                                        <p className={styles.title}>生成失败</p>
                                        <Button
                                            onClick={() => this.reGen(v.choiceType)}
                                            className={styles.reGen}>
                                            重新生成
                                        </Button>
                                    </div>
                                )}
                            </div>
                        );
                    }
                })}
            </div>
        );
        // 如果是流量主则显示流量主分享域名
        const shareUrl = playCode
            ? `${adDomain ? adDomain + "/video/player" : host.preView}/0/${playCode}`
            : "";
        const inliePlayerUrl = `${
            adDomain ? adDomain : host.preView1
        }/video/inlinePlayer/0/${playCode}`;
        const isShowCardBox =
            state.navActive === TYPE_PAGE.download ||
            state.navActive === TYPE_PAGE.implant ||
            (state.navActive === TYPE_PAGE.share && state.clickThis);
        const isShowShare = state.navActive === TYPE_PAGE.share && !state.clickThis;
        const isShowShareSet = state.navActive === TYPE_PAGE.share && state.clickThis;
        let shareTypeTitle = "";
        const isVip = isChuangYiyunVip();
        if (state.shareType === VIDEO_RENDER_TYPE.SDWaterMark || (!isVip && !state.shareType)) {
            shareTypeTitle = "标清有水印";
        } else if (
            state.shareType === VIDEO_RENDER_TYPE.SDNoWaterMark ||
            (isVip && !state.shareType)
        ) {
            shareTypeTitle = "标清无水印";
        } else if (state.shareType === VIDEO_RENDER_TYPE.HDNoWaterMark) {
            shareTypeTitle = "高清无水印";
        }
        if(isSelfVideo){
            shareTypeTitle = '标清视频';
        }
        const shareInfo1 = (
            <div className={styles.tipInfoWrap}>
                <p>
                    当前分享的视频格式为 <span className={styles.SD}>{shareTypeTitle}</span>{" "}
                    ，若需要分享无水印或高清视频请{" "}
                    <span onClick={this.shareSet} className={styles.clickTips}>
                        点击此处{" "}
                    </span>
                    进行修改。
                </p>
            </div>
        );
        const shareInfo2 = (
            <p className={styles.durationTime}>
                {isShowShareSet && <span className={styles.videoSet}>分享视频格式设置</span>}
                当前视频时长
                <span style={{ color: "#EB0707" }}>{Math.floor(state.videoDuration)}秒</span>，
                {vipBtnIfon}无水印视频价格会随视频时长而变化。
            </p>
        );

        const tipInfo = isShowShare ? shareInfo1 : shareInfo2;
        // const shareTip = state[`${shareType}_status`] === RENDER_STATUS.success ? null : '视频生成成功后才能进行分享';
        const shareTip = this.compatibleOldData() ? null : "视频生成成功后才能进行分享";
        const shareTipStyle = this.compatibleOldData();
        const modalTitle = props.positionFrom === POS_FROM.workSpace ? "下载和分享" : "预览和生成";
        const isChangeCoverImg = this.getGenVideoURL();
        const isShowVipTip = btnState.some(
            v => v.onClick === this.handleVip && !this.isChuangYiyunVip()
        );
        const isRenewalsTip =
            !isShowShare &&
            btnState.some(v => v.children === TYPE_BTN.vipRenewals && this.isChuangYiyunVip());
        const limitDataTime = moment(state.expiryTime).format("YYYY-MM-DD");
        const leftDate = parseInt((state.expiryTime - new Date()) / 1000 / 60 / 60 / 24);
        const renewalsTip = `会员${limitDataTime}到期，仅剩${leftDate}天`;
        const isShareTypeRenderFail = state[`${state.shareType}_status`] === RENDER_STATUS.fail;
        return (
            <div className={styles.body}>
                <div className={styles.head}>
                    <div className={styles.shareTitle}>{modalTitle}</div>
                    <Icon onClick={this.onClose} className={styles.close} type='eqf-no' />
                </div>
                <div className={styles.box}>
                    <Left
                        {...state}
                        onLoadDetail={this.onLoadDetail}
                        timerCoverImg={this.timerCoverImg}
                    />
                    <div className={styles.rightBox}>
                        <EditTitle
                            title={state.title}
                            positionFrom={props.positionFrom}
                            onClose={this.onClose}
                            active={state.active}
                            isVip={this.isChuangYiyunVip()}
                            onCancelRender={this.onCancelRender}
                            platform={state.platform}
                            videoId={state.id}
                            templateId={state.templateId}
                            videoDescribe={state.videoDescribe}
                            onLoadDetail={this.onLoadDetail}
                            transverse={state.transverse}
                            product={state.product}
                            coverImg={state.coverImg}
                            isShareTypeRenderFail={isShareTypeRenderFail}
                            url={this.getVideoURL()}
                            navActive={state.navActive !== TYPE_PAGE.promote}
                            isRenderingSomeone={this.getRenderingSomeone()}
                            coverImageUpdating={state.coverImageUpdating}
                            isChangeCoverImg={isChangeCoverImg}
                        />
                        <div className={styles.main}>
                            <div className={styles.navBox}>
                                <div
                                    onClick={e => this.navActive(e, TYPE_PAGE.download)}
                                    className={`${styles.nav} ${
                                        state.navActive === TYPE_PAGE.download
                                            ? styles.navActive
                                            : ""
                                    }`}>
                                    下载视频
                                </div>
                                <Tooltip title={shareTip}>
                                    <div
                                        onClick={e => this.navActive(e, TYPE_PAGE.share)}
                                        className={`${styles.nav} ${
                                            !shareTipStyle ? styles.shareTip : ""
                                        } ${
                                            state.navActive === TYPE_PAGE.share
                                                ? styles.navActive
                                                : ""
                                        }`}>
                                        分享视频
                                    </div>
                                </Tooltip>
                                {state.openFrom && (
                                    <div
                                        onClick={e => this.navActive(e, TYPE_PAGE.implant)}
                                        className={`${styles.nav} ${
                                            state.navActive === TYPE_PAGE.implant
                                                ? styles.navActive
                                                : ""
                                        }`}>
                                        嵌入作品至{state.openFrom}
                                    </div>
                                )}
                                {state.isMediaAdDomain && (
                                    <div
                                        onClick={e => this.navActive(e, TYPE_PAGE.promote)}
                                        className={`${styles.nav} ${
                                            state.navActive === TYPE_PAGE.promote
                                                ? styles.navActive
                                                : ""
                                        }`}>
                                        推广
                                    </div>
                                )}
                            </div>
                            {state.isMediaAdDomain && state.playCode && (
                                <MediaPromote
                                    visible={state.navActive === TYPE_PAGE.promote}
                                    onNavActive={this.navActive}
                                    openFrom={state.openFrom}
                                    onClose={this.onClose}
                                    scale={state.transverse ? 2 : 1}
                                    videoSrc={inliePlayerUrl}
                                    videoCoverImg={state.coverImg}
                                    videoId={state.id}
                                    playCode={state.playCode}
                                    positionFrom={props.positionFrom}
                                    product={state.product}
                                    templateId={state.templateId}
                                    platform={state.platform}
                                    renderTip={shareTipStyle}
                                />
                            )}
                            {state.navActive !== TYPE_PAGE.promote && tipInfo}
                            {isShowCardBox && cardBox}
                            {isShowShare && (
                                <Share
                                    url={shareUrl}
                                    title={state.title}
                                    showAuthor={state.showAuthor}
                                    beforeShare={this.shareBigSend}
                                    onCheckFunc={this.onChangeShowAuthor}
                                    videoId={state.id}
                                    isMediaAdDomain={state.isMediaAdDomain}
                                    coverImg={state.coverImg}
                                    describe={state.videoDescribe}
                                />
                            )}

                            {isShowCheckbox && (
                                <Checkbox
                                    checked={this.state.checked}
                                    className={styles.checked}
                                    onChange={this.onChange}>
                                    使用已有{Surpluse}秒{resolutionPower}下载权益抵扣部分金额
                                </Checkbox>
                            )}
                        </div>
                        <div className={styles.foot}>
                            <div className={styles.wrap}>
                                {/*下载按钮 志刚同学请看这个组件*/}
                                {!isShowShare &&
                                    btnState.map(({ onConfirm = null, ...oneBtn }) => {
                                        if (
                                            oneBtn.onClick === this.handleRights ||
                                            oneBtn.onClick === this.handleRender
                                        ) {
                                            return (
                                                <Confirm
                                                    key={oneBtn.children}
                                                    visible={this.state.singleBuyConfirm}
                                                    title='下载前请务必确认视频效果，修改后再下载需重新付费？'
                                                    onConfirm={onConfirm}
                                                    btnInfo={oneBtn}
                                                    checked={this.state.noneTipchecked}
                                                    onChange={this.onChangeTip}
                                                    onCancel={
                                                        this.cancelSingleBuyConfirm
                                                    }></Confirm>
                                            );
                                        } else {
                                            let Btn = null;
                                            if (oneBtn.share) {
                                                Btn = (
                                                    <React.Fragment key={oneBtn.children}>
                                                        <Button
                                                            key={"取消"}
                                                            onClick={this.cancelBtn}
                                                            className={styles.comBtn2}
                                                            lite={1}>
                                                            取消
                                                        </Button>
                                                        <Button key={oneBtn.children} {...oneBtn} />
                                                    </React.Fragment>
                                                );
                                            } else {
                                                Btn = <Button key={oneBtn.children} {...oneBtn} />;
                                            }
                                            return Btn;
                                        }
                                    })}
                            </div>
                            {isShowVipTip && (
                                <div className={styles.vipTip}>无限次下载,每天低至0.6元</div>
                            )}
                            {isRenewalsTip && !this.isRecentlyBuyVip() && (
                                <div className={styles.vipTip}>{renewalsTip}</div>
                            )}
                        </div>
                    </div>
                </div>

                <Modal
                    visible={state.openRightModal}
                    onCancel={this.onCloseRightsModal}
                    style={{ height: 360 }}>
                    <Rights
                        title={state.title}
                        goods={this.goods}
                        sign={this.sign}
                        params={this.signParams}
                        onClose={this.onCloseRightsModal}
                        {...sendParams}
                        type={active}
                        onDownLoadHd={this.onDownLoadHd}
                    />
                </Modal>
            </div>
        );
    }
}

export default ShareDownload;
