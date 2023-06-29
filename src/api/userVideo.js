import env from 'Config/env';
import qs from 'qs';
import { version } from '../config/env';
/* global axios */

const serverHost = env.host.service2 + '/video/user/video/';

export default {
    getDetail,
    getIndex,
    getMaterial,
    submit,
    videoDelete,
    addDownLoad,
    renderHd,
    render,
    getRenderStatus,
    copy,
    showAuthor,
    videoPresent,
    autoSubmit,
};

export {
    getDetail,
    getIndex,
    getMaterial,
    submit,
    videoDelete,
    addDownLoad,
    render,
    getRenderStatus,
    copy,
    getLimt,
    cancelRender,
    getOrginId,
    hdFinishClear,
    showAuthor,
    autoSubmit,
    videoPresent,
};

/**
 * 获取用户视频详情
 * @param id
 */
function getDetail(id) {
    const url = `${serverHost}detail?videoId=${id}`;
    return axios.get(url);
}

function getIndex(params) {
    const url = `${serverHost}my?${qs.stringify(params, { arrayFormat: 'repeat' })}&ver=${version}`;
    return axios.get(url);
}

export function getHeadTail(params) {
    const url = `${serverHost}myHeadTail?${qs.stringify(params,
        { arrayFormat: 'repeat' })}&ver=${version}`;
    return axios.get(url);
}

/**
 * 获取用户素材
 * @param id
 */
function getMaterial(id, templateId = null) {
    const url = `${serverHost}materialV2?videoId=${id}&templateId=${templateId}`;
    return axios.get(url);
}

/**
 * 获取用户视频播放地址
 * @param videoId
 * @param playCode
 */
function getPlaySrc(videoId, playCode) {
    const url = `${env.host.service2}/video/share/play?videoId=${videoId}&playCode=${playCode}`;
    return axios.get(url);
}

function getOrginId(videoId) {
    const url = `${env.host.service2}/video/user/video/worksTemplate/sourceId?videoId=${videoId}`;
    return axios.get(url);
}

/**
 * 提交用户模板
 * @param 参数
 */
function submit(createVideoGroupParam) {
    const url = `${serverHost}submitV2`;
    return axios.post(url, createVideoGroupParam, {
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
        },
    });
}

function autoSubmit(videoParam) {
    const url = `${serverHost}autoSave`;
    return axios.post(url, videoParam, {
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
        },
    });
}


function showAuthor(videoId, showAuthor = true) {
    const url = `${env.host.service2}/video/share/showAuthor?videoId=${videoId}&showAuthor=${showAuthor}`;
    return axios.post(url, {
        videoId,
        showAuthor,
    });
}

function getLimt() {
    const url = `${serverHost}limit`;
    return axios.get(url);
}

function videoDelete(id) {
    const url = `${serverHost}delete?videoId=${id}`;
    return axios.post(url);
}

function copy(id) {
    const url = `${serverHost}copy?videoId=${id}`;
    return axios.post(url);
}

function renderHd(id) {
    const url = `${serverHost}render/hd?videoId=${id}`;
    return axios.post(url);
}

function render(id, videoType) {
    const url = `${serverHost}render?videoId=${id}&videoType=${videoType}`;
    return axios.post(url);
}

function getRenderStatus(id) {
    const url = `${serverHost}render/query?videoId=${id}`;
    return axios.get(url);
}

function addDownLoad(videoId, hd, aurl, type) {
    const url = `${serverHost}download/record/add?videoRenderId=&videoId=${videoId}&videoQuality=${~~hd}&url=${aurl}&videoType=${type}`;
    return axios.post(url);
}

function cancelRender(videoId, videoType = null) {
    const params = {
        videoId,
        videoType,
    };
    if (!videoType) {
        delete params.videoType;
    }
    const url = `${serverHost}render/cancel?${qs.stringify(params)}`;
    return axios.post(url);
}

/**
 *
 * @param id 取消封面设置
 * @returns {*}
 */
export function cancelCoverImage(id) {
    const url = `${serverHost}render/cancel/coverImage?videoId=${id}`;
    return axios.get(url);
}

/**
 * 修改标题和秒速
 * update_title_describe
 */
export function updateTitleDescribe(data) {
    const url = `${serverHost}update_title_describe?${qs.stringify(data)}`;
    return axios.post(url);
}

function hdFinishClear(id) {
    const url = `${serverHost}render/hdFinish/clear?videoId=${id}`;
    return axios.post(url);
}

/**
 * 请求自动识别
 * @param videoId
 * @returns {*}
 */
export function requestAsr(videoId) {
    const url = `${env.host.service2}/video/user/template/audioDiscern?id=${videoId}`;
    return axios.post(url);
}


/**
 * 轮询自动识别
 * @param videoId
 * @returns {*}
 */
export function getAsrStatus(videoId) {
    const url = `${env.host.service2}/video/user/template/audioDiscernResult?id=${videoId}`;
    return axios.get(url);
}

/**
 * 转赠视频
 * @param videoId
 * @param receiver
 * @returns {*}
 */
function videoPresent(videoId, receiver) {
    const url = `${env.host.service2}/video/user/video/present?videoId=${videoId}&receiver=${receiver}`;
    return axios.post(url);
}

/**
 * 获取是否进入过高级编辑模式
 * @param videoId
 * @return {*}
 */
export function enteredAdvanceMode(videoId) {
    const url = `${serverHost}enteredAdvanceMode?videoId=${videoId}`;
    return axios.get(url);
}

/**
 * 快闪记录进入高级编辑模式的
 * @param videoId
 * @return {*}
 */
export function insertAdvanceModeRecord(videoId) {
    const url = `${serverHost}insertAdvanceModeRecord?videoId=${videoId}`;
    return axios.get(url);
}

/**
 * 调分词接口
 * @param textArr
 * @return {*}
 */
export function splitWord(textArr) {
    const url = `${env.host.service2}/video/user/part/word`;
    return axios.post(url, textArr, {
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
        },
    });
}

export function flashVideoSubmit(params) {
    const url = `${env.host.service2}/video/user/video/flashVideoSubmit`;
    return axios.post(url, params, {
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
        },
    });
}

/**
 * 获取快闪视频-快闪音乐
 * @param {*} params
 */
export function getFlashVideoMusic(params) {
    const url = `${env.host.service2}/config/getFlashVideoBGMs`;
    return axios.get(url, params, {
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
        },
    });
}

/**
 * 获取权益
 * @param
 * @return {*}
 */
export function benefitGoods() {
    const url = `${env.host.service2}/video/user/benefit/goods`;
    return axios.get(url);
}

/**
 * 秀点签名
 * @param data
 * @return {*}
 */
export function benefitSign(data) {
    const url = `${env.host.service2}/video/user/benefit/sign?${qs.stringify(data)}`;
    return axios.get(url);
}

/**
 * 记录分享选择视频类型
 * @param videoId
 * @param videoType 201：标清有水印 202：标清无水印 203：高清无水印
 * @returns {*}
 */
export function shareType(videoId, videoType) {
    const url = `${serverHost}share/type?videoId=${videoId}&videoType=${videoType}`;
    return axios.post(url);
}

/**
 * 创建视频订单接口
 * @param params
 * @returns {*}
 */
export function createVideoOrder(params) {
    const url = `${env.host.service2}/order/video/order/create?templateId=${params.templateId}&videoId=${params.videoId}&videoType=${params.videoType}`;
    return axios.get(url);
}

/**
 * 创建视频订单时获取商城回调地址
 */
export function getMallsCallbackUrl() {
    const url = `${env.host.service2}/order/callback/getMallsCallbackUrl`;
    return axios.get(url);
}

/**
 * 创建视频订单时获取商城回调地址
 */
export function memberExpiryTime() {
    const url = `${env.host.service2}/video/user/member/expiryTime`;
    return axios.get(url);
}

/**
 *
 *封面更新渲染查询
 */
export function getUpdateCoverImageRender(videoId) {
    const url = `${env.host.service2}/video/user/video/getUpdateCoverImageRender?videoId=${videoId}`;
    return axios.get(url);
}


/**
 * 修改封面
 * @param videoId
 * @param videoType 201：标清有水印 202：标清无水印 203：高清无水印
 * @returns {*}
 */
export function updateCoverImage(coverImage, videoId) {
    const url = `${env.host.service2}/video/user/video/updateCoverImage?coverImage=${coverImage}&videoId=${videoId}`;
    return axios.get(url);
}

/**
 * 获取视频作品封面图
 * @param videoId
 */
export function getVideoThumbnail(videoId) {
    const url = `${serverHost}/getVideoThumbnail?videoId=${videoId}`;
    return axios.get(url);
}

/**
 *
 *添加作品微信分享设置
 * update_title_describe
 */
export function wechatSetting(data) {
    const url = `${env.host.service2}/video/share/wechatSetting`;
    return axios.post(url, { ...data },
        {
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
            },
        },
    );
}
/**
 *
 *添加作品微信分享设置
 * update_title_describe
 */
export function getWechatSetting(videoId) { // concat=false
    const url = `${env.host.service2}/video/share/getWechatSetting?videoId=${videoId}&concat=false`;
    return axios.get(url);
}
/**
 *
 *添加作品微信分享设置
 * update_title_describe
 */
export function addMemberPurchaseRecord(data) {
    const url = `${env.host.service2}/video/user/member/addMemberPurchaseRecord`;
    return axios.post(url, { ...data },
        {
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
            },
        },
    );
}