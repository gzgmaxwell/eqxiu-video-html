import { host } from 'Config/env';
import qs from 'qs';
/* global axios */
const { CancelToken } = axios;
let cancel = null;

export function getMine(params, cancelPrev = true) {
    if (cancel && cancelPrev) {
        cancel();
        cancel = null;
    }
    const url = `${host.service2}/store/my?${qs.stringify(params)}`;
    return axios.get(url, {
        cancelToken: new CancelToken(function executor(c) {
            cancel = c;
        }),
    });
}

export function getMineMusic(params, type, cancelPrev = true) {
    if (cancel && cancelPrev) {
        cancel();
        cancel = null;
    }
    let url = '';
    switch(type) {
        case 'upload': url = `${host.service2}/store/my?${qs.stringify(params)}`;break;  //上传
        case 'buy': url = `${host.service2}/material/user/buy?${qs.stringify(params)}`;break;    //已购买
        case 'favorite': url = `${host.store}/api/m/favorite/get-favorite-list-groupId?${qs.stringify(params)}`;break; //已收藏
    }
    return axios.get(url, {
        cancelToken: new CancelToken(function executor(c) {
            cancel = c;
        }),
    });
}

export function progressAudio(taskId) {
    const url = `${host.service2}/store/progress/audio`;
    return axios.get(url);
}

export function deleteMine(params) {
    let str = '';
    if (params.ids) { // 如果有参数组，拼接参数组
        str = params.ids.filter(item => item).join('&ids=');
        delete params.ids;
    }
    const url = `${host.service2}/store/delete?ids=${str}&${qs.stringify(params)}`;
    return axios.post(url);
}

export function deleteMineVideo(params) {
    let str = '';
    if (params.ids) { // 如果有参数组，拼接参数组
        str = params.ids.filter(item => item).join('&ids=');
        delete params.ids;
    }
    const url = `${host.service2}/video/user/template/delete/list?ids=${str}&${qs.stringify(params)}`;
    return axios.post(url);
}

