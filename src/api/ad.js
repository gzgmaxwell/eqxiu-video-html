import { host } from 'Config/env';

/**
 * 新媒体中心广告
 * 作品预览-判断是否流量主
 */
export function getMediaAdPublisher() {
    const url = `${host.service2}/video/user/video/publisher`;
    return axios.get(url);
}

/**
 * 获取流量域名接口
 * @param {*} mediaId 
 */
export function getMediaAdpDomain(mediaId) {
    const url = `${host.mediaAd}/m/yqc/adp/publisher/domain/list/find?mediaId=${mediaId}`;
    return axios.get(url, { 
            ignoreInterceptor: true, // 不拦截请求
        }
    );
}

/**
 * 获取轮播广告内容
 * @param {*} mediaId
 */
export function advertList(mediaId) {
    const url = `${host.eqxAds}/iom/advert/list?mediaId=${mediaId}`;
    return axios.get(url, {
            ignoreInterceptor: true, // 不拦截请求
        }
    );
}