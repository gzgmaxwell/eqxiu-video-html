import { host } from '../config/env';

/* global axios */
const { service2 } = host;

/**
 * 开始分享抖音
 * @param videoId
 * @return {*}
 */
export function getDouyinLoginUrl(videoId) {
    const url = `${service2}/video/share/getDouyinLoginUrl?videoId=${videoId}`;
    return axios.get(url);
}

/**
 * 获取抖音分享结果
 * @param taskCoded
 * @return {*}
 */
export function getDouyinShareResult(taskCoded) {
    const url = `${service2}/video/share/douyinShare/result?taskCode=${taskCoded}`;
    return axios.get(url);
}
