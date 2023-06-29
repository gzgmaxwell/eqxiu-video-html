import { host } from 'Config/env';
import qs from 'qs';
import { apiCache } from 'Util/apiCache';
import { version } from '../config/env';

const CancelToken = axios.CancelToken;
let cancel = null;


export function cutAudio({ path, name, start, duration }) {
    const url = `${host.service2}/store/audioCrop?path=${path}&name=${name}&start=${start}&duration=${duration}`;
    return axios.post(url);
}

export function getCropResult(taskId) {
    const url = `${host.service2}/store/audioCrop/result?taskId=${taskId}`;
    return axios.get(url);
}

/* global axios */
export function getMusicTags(params) {
    const url = `${host.store}/api/category/getCategoryListByTopId?${qs.stringify(params)}`;
    return apiCache({
        method: 'GET',
        url,
        params: {},
    });
}

export function checkCollect(params) {
    const url = `${host.store}/api/m/favorite/check-collect?${qs.stringify(params)}`;
    return axios.get(url);
}

export function deleteFavorite(id) {
    const url = `${host.store}/api/m/favorite/delete-favorite`;
    return axios.post(url, {
        'ids[]': id,
    });
}

export function addFavorite(id) {
    const url = `${host.store}/api/m/favorite/add-favorite`;
    return axios.post(url, {
        productId: id,
    });
}

export function textToVoice(params) {
    const url = `${host.service2}/ai/textToVoice`;
    return axios.post(url, params, {
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    });
}
export function textsToVoice(params) {
    const url = `${host.service2}/ai/textsToVoice`;
    return axios.post(url, params, { // GET /ai/textsToVoice/result
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    });
}

export function textsToVoiceResult(taskCode) {
    const url = `${host.service2}/ai/textsToVoice/result?taskCode=${taskCode}`;
    return axios.get(url);
}

export function typeMonkeySubmit(params) {
    const url = `${host.service2}/video/user/video/typemonkey/submit`;
    return axios.post(url, params, {
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    });
}

export function getTypeMonkeyInfo(videoId) {
    const url = `${host.service2}/video/user/video/typemonkey/${videoId}`;
    return axios.get(url);
}
export function getTypeMonkeyVoiceNames() {
    const url = `${host.service2}/config/getTypeMonkeyVoiceNames`;
    return axios.get(url);
}
/**
 * 判断是否创意云会员
 */
export function checkVipMaterial() {
    const url = `${host.service2}/video/user/benefit/vipMaterial/check`;
    return axios.get(url);
}

