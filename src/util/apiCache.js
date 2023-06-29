import qs from 'qs';
import logger from './logger';
import storageLocal from './storageLocal';
/* global axios */

// 5分钟
const EXPIRES = 5 * 60 * 1000;

const PREFIX = storageLocal.key.api;

/**
 * 正常请求api接口 并且保存
 */
function update(httpConfig, key, expries = EXPIRES) {
    return axios(httpConfig)
        .then(res => {
            const { data: { success = false } = {} } = res;
            // 如果没成功则不缓存
            if (success) {
                storageLocal.setItem(key, {
                    expires: Date.now() + expries,
                    value: res,
                });

                return res;
            } else {
                return Promise.reject(res);
            }

        }, error => {
            storageLocal.removeItem(key);
            return Promise.reject(error);
        });
}

/**
 * 缓存api接口
 * @param {*} httpConfig
 */
function apiCache(httpConfig, expries = EXPIRES, refer = false) {
    const { method, url, params } = httpConfig;
    if (method !== 'GET') {
        logger.warn(`api cache does not support ${method}`);
        return axios(httpConfig);
    }

    let key = PREFIX + url;
    if (params) {
        key += key.indexOf('?') > -1 ? '&' : '?' + qs.stringify(params);
    }

    const result = storageLocal.getItem(key);
    if (result && result.value && result.expires && !refer) {
        const now = Date.now();
        // 过期策略
        // 超过过期时间, 或者重新发版
        if (now > result.expires) {
            return update(httpConfig, key, expries);
        } else {
            return Promise.resolve(result.value);
        }
    } else {
        return update(httpConfig, key);
    }
}


/**
 * 初始化时，清理过期的api接口，避免占用的空间越来越大
 */
function apiClearExpired() {
    for (let key in window.localStorage) {
        if (window.localStorage.hasOwnProperty(key)) {
            if (key.indexOf(PREFIX) === 0) {
                let obj = storageLocal.getItem(key);
                if (Date.now() > obj.expires) {
                    storageLocal.removeItem(key);
                }
            }
        }
    }
}

export default {
    apiCache,
    apiClearExpired,
};

export {
    apiCache,
    apiClearExpired,
};
