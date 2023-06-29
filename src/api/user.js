import { host, name } from 'Config/env';
import qs from 'qs';
import { apiCache } from '../util/apiCache';
import FONT_LIST from '../dataBase/fonts';
/* global axios */
const { CancelToken } = axios;
let cancel = null;


function login(password, rememberMe, username) {
    const url = `${host.passport}/login`;
    return axios.post(url, {
        password: password,
        rememberMe: rememberMe,
        username: username,
    }, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });
}

function getInfo(ignoreInterceptor = false) {
    const url = `${host.passport}/account/info?t=${Date.now()}`;
    return axios.get(url, {
        ignoreInterceptor,
    });
}

function getMyFont() {
    // const url = `${host.store}/api/product/cat/listProdByParam?category=${
    //     ['pre', 'pro'].includes(name)
    //     ? '891381'
    //     : '890507'}&sortBy=sort&priceFloor=-1&priceCeiling=-1&pageNo=1&pageSize=100`;
    return new Promise((resolve) => {
        resolve({
            data: {
                success: true,
                list: FONT_LIST,
            },
        });
    });
}

/**
 * 获取所有字体
 * @param urls
 * @returns {Promise<[any , any , any , any , any , any , any , any , any , any]>}
 */
function getAllFontBlob(urls) {
    return Promise.all(urls.map(url => axios({
        method: 'get',
        url,
        ignoreInterceptor: true,
        withCredentials: false,
    })));
}

function getListProdByParam(params, cancelPrev = true) {
    if (cancel && cancelPrev) {
        cancel();
        cancel = null;
    }
    const url = `${host.store}/api/product/cat/listProdByParam?${qs.stringify(params)}`;
    return apiCache({
        method: 'GET',
        url,
        params: {
            cancelToken: new CancelToken(function executor(c) {
                cancel = c;
            }),
        },
    });
}
// 音乐搜索临时测试接口
function getMusicSearchList(params) {
    
    const url = `//msearch-api.yqxiu.cn/m/search/searchProducts`;
    return axios.post(url, params, {
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    });
}

function logout() {
    const url = `${host.passport}/logout`;
    return axios.get(url);
}

/**
 * 设置邀请码
 * @param code
 * @returns {*}
 */
function setInvitationCode(code) {
    const url = `${host.service2}/video/code/register?invitationCode=${code}`;
    return axios.post(url, { invitationCode: code }, {
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    });
}


export function getSystemTailLeader(transverse) {
    const url = `${host.service2}/video/user/video/getSystemTailLeader?transverse=${transverse}`;
    return apiCache({
        method: 'GET',
        url,
    });
}

export function statistics(params) {
    const url = `${host.service2}/video/income/statistics`;
    return axios.post(url, params, {
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    });
}

/**
 * 轻设计艺术字接口
 */
function getH5ComponentStyles() {
    const url = `${host.service3}/print/getComponentStyles?styleStatus=1&pageSize=100`;
    return apiCache({
        method: 'GET',
        url,
        params: {},
    });
}

export default {
    getInfo,
    logout,
    setInvitationCode,
    getMyFont,
    getAllFontBlob,
    login,
    getListProdByParam,
    getSystemTailLeader,
    getH5ComponentStyles,
    getMusicSearchList
};

export {
    setInvitationCode,
    getInfo,
    logout,
    getMyFont,
    getAllFontBlob,
    login,
    getListProdByParam,
    getH5ComponentStyles,
    getMusicSearchList
};
