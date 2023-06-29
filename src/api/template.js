import { host } from 'Config/env';
import qs from 'qs';
import { apiCache } from 'Util/apiCache';
import { version } from '../config/env';

const CancelToken = axios.CancelToken;
let cancel = null;

/* global axios */

/**
 * @param params 查询参数
 * @param cancelPrev 是否取消上次请求（默认取消）
 * */
function getIndex(oldParams, cancelPrev = true) {
    if (cancel && cancelPrev) {
        cancel();
        cancel = null;
    }
    const params = { ...oldParams };
    if (Array.isArray(params.labelIds)) { // 如果有参数组，拼接参数组
        params.labelIds = params.labelIds.filter(item => item);
    }
    const url = `${host.service}/video/template/auth/find?${qs.stringify(
        params, { arrayFormat: 'repeat' })}&ver=${version}`;
    return axios.get(url, {
        cancelToken: new CancelToken(function executor(c) {
            cancel = c;
        }),
    });
}

function getDetail(templateId) {
    const url = `${host.service}/video/template/detail?id=${templateId}`;
    return axios({
        url,
        method: 'GET',
    });
};

function getTags(parentId = 1) {
    const url = `${host.service}/video/label/list?parentId=${parentId}`;
    return axios.get(url);
}

function getTagsTree() {
    const url = `${host.service}/video/label/all/tree`;
    return axios.get(url);
}

function userTemplateFind(params) {
    const url = `${host.service2}/video/user/template/find?${qs.stringify(params)}`;
    return axios.get(url);
}

function userTemplateId(id) {
    const url = `${host.service2}/video/user/template/get?id=${id}`;
    return axios.get(url);
}

export function userHeadAndTail(pramas) {
    const url = `${host.service2}/video/user/video/my?pageNo=-1&pageSize=0`;
    return axios.get(url);
}

/**
 * 从模板系统获取详情
 * @param id
 * @return {*}
 */
function getTemplateVideoDetail(id) {
    const url = `${host.service}/video/template/get?id=${id}`;
    return apiCache({
        method: 'GET',
        url,
    });
}

function userTemplateGetPhoneParam() {
    const url = `${host.service2}/video/user/template/get/phone/param`;
    return axios.get(url);
}

/**
 * 获取手机上传进度值
 * @param
 */
function getPhoneProgress(token) {
    const url = `${host.service2}/video/user/template/getPhoneProgress?token=${token}`;
    return axios.get(url);
}

export function getGoodsInfoByTemplateId(templateId) {
    const url = `${host.service2}/goods/getGoodsInfoByTemplateId?templateId=${templateId}`;
    return axios.get(url);
}


export {
    getTags,
    getDetail,
    getIndex,
    getTagsTree,
    userTemplateFind,
    getPhoneProgress,
    userTemplateGetPhoneParam,
    userTemplateId,
    getTemplateVideoDetail,
};

export default {
    getTags,
    getDetail,
    getIndex,
    getTagsTree,
    getPhoneProgress,
    userTemplateFind,
    userTemplateGetPhoneParam,
    getTemplateVideoDetail,
};
