import {host, upload} from 'Config/env';
import qs from 'qs';
import {apiCache} from '../util/apiCache';
import {genImageUrl} from '../util/file';
import env from '../config/env';
import {genUrl} from '../util/image';
/* global axios */

export const getTencentToken = () => axios.get(`${env.host.service}/store/qcloud/token`);

const getQiniuToken = (noCache = false) => {
    const url = `${host.service}/store/qiniu/token`;
    return apiCache({
        method: 'GET',
        url,
    }, 57000, noCache);
};


export const getCosToken = (read = false) => {
    return axios.get(`${host.service2}${upload.tokenUrl}?read=${read}`);
};

export const getMaterialToken = (fileType = 3) => {
    const url = `${host.service2}/store/token?fileType=${fileType}`;
    return axios.get(url);
};

export const getPhoneToken = (fileType = 3, token) => {
    const url = `${host.service2}/open/eqxiuToken/qiniu?type=${fileType}&eqxiuToken=${token}`;
    return axios.get(url);
};
/**
 * 上传到七牛
 * @param base64
 * @param token
 * @param onUploadProgress 上传进度回调
 * @param getToken 重试回调
 * @returns {*}
 */
const uploadQiniuByBase64 = (base64, token, onUploadProgress = (progressEvent) => progressEvent, getToken = false) => {
    const ba64 = base64.replace(/^.*?base64,/, '');
    return axios.post('//upload-z0.qiniup.com/putb64/-1', ba64, {
        onUploadProgress,
        withCredentials: false,
        ignoreInterceptor: true,
        headers: {
            'Content-Type': 'application/octet-stream',
            'Authorization': 'UpToken ' + token,
        },
    })
        .catch(err => {
            console.log('上传七牛报错', err);
            return (getToken && getToken(true) || getQiniuToken(true))
                .then(res => Promise.resolve(
                    uploadQiniuByBase64(base64, res.data.obj, onUploadProgress)));
        });
};

/**
 * 获取gif转视频地址。
 * @param picUrl
 * @returns {*}
 */
export const getGifVideo = (picUrls) => {
    const url = `${host.service2}/video/user/gif/getGif`;
    return axios.post(url, picUrls, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
};

/**
 * 快速获取图片宽高
 * @param url
 */
const getImgInfoByQiNiu = (url) => {
    if (!url) return new Promise(((resolve, reject) => reject()));
    let trueUrl = `${genUrl(url)}`;
    if (trueUrl.includes('imageMogr2/')) {
        trueUrl += '|imageInfo';
    } else {
        trueUrl = `${trueUrl.split('?')[0]}?imageInfo`;
    }
    return axios({
        method: 'get',
        url: trueUrl,
        withCredentials: false,
        ignoreInterceptor: true,
    });
};
/**
 * 获取用户上传权益限制pc端
 * @param url
 */
export const getUserBenefitUploadPc = () => {
    const url = `${host.service2}/video/user/benefit/upload`;
    return axios.get(url);
};
/**
 * 获取用户上传视频图片上传大小限制
 * @param url
 */
export const getBenefitUploadPhone = (eqxiuToken) => {
    const url = `${host.service2}/video/phone/user/benefit/upload?eqxiuToken=${eqxiuToken}`;
    return axios.get(url);
};
/**
 * 获取获取旁白音库列表
 * @param url
 */
export const getVoiceoverVoiceNames = () => {
    const url = `${host.service2}/config/getVoiceoverVoiceNames`;
    return axios.get(url);
};

export {
    getQiniuToken,
    uploadQiniuByBase64,
    getImgInfoByQiNiu,
};
