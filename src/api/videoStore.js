import { host } from 'Config/env';
import qs from 'qs';
import { apiCache } from 'Util/apiCache';

function getTagsTree() {
    const url = `${host.service}/video/label/all/tree`;
    return axios.get(url);
}

function templateFind(params) {
    const url = `${host.service}/video/template/auth/find?${qs.stringify(params)}`;
    return axios.get(url);
};

function getUploadStatus(id) {
    const url = `${host.service2}/video/user/template/getStatus?id=${id}`;
    return axios.get(url);
};

/**
 * 上传视频
 * @param videoUrl
 * @param title
 * @returns {*}
 */
function templateUpload(videoUrl, title, fileType = 3) {
    const url = `${host.service2}/video/user/template/uploadN`;
    return axios.post(url, {
        url: videoUrl,
        title,
        fileType,
    }, {
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
        },
    });
};

function templateDelete(id) {
    const url = `${host.service2}/video/user/template/delete?id=${id}`;
    return axios.post(url);
};

function editeUserVideoInfo(id, title) {
    const url = `${host.service2}/video/user/template/edit`;
    return axios.post(url, {
        id,
        title,
    }, {
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
        },
    });
}

function phoneUpload(url, title, token, time, fileType) {
    const requesetUrl = `${host.service2}/video/phone/user/uploadN`;
    return axios.post(requesetUrl, {
        url,
        title,
        token,
        time,
        fileType,
    }, {
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
        },
    });
};

export function clearProgress(token) {
    const requesetUrl = `${host.service2}/video/phone/user/cleanProgress?token=${token}`;
    return axios.get(requesetUrl);
};

function userTemplateCrop(id, startTime, endTime) {
    const url = `${host.service2}/video/user/template/crop?id=${id}&startTime=${startTime}&endTime=${endTime}`;
    return axios.post(url);
}

function userTemplateCropN(params) {
    const url = `${host.service2}/video/user/template/cropN`;
    return axios.post(url, params, {
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    });
}

export function getCropInfoById(id) {
    const url = `${host.service2}/video/user/template/getCropInfoById?id=${id}`;
    return axios.get(url);
}

export function getCutSource(cid) {
    const url = `${host.service2}/video/user/template/crop/source?id=${cid}`;
    return axios.get(url);
}

export function getImageInfo(data) {
    const url = `${data}?imageInfo`;
    return axios.get(url, {
        ignoreInterceptor: true,
        withCredentials: false,
    });
}

/**
 * 前端主动获取图片宽高
 * @param url
 * @returns {Promise<unknown>}
 */
export function getImageInfoByTag(url) {
    const img = new Image();
    img.src = url;
    return new Promise((resolve, reject) => {
        img.onload = () => {
            const { naturalHeight: height, naturalWidth: width } = img;
            resolve({
                width,
                height,
            });
        };

        img.onerror = reject;
    });
}

export default {
    getTagsTree,
    templateFind,
    templateUpload,
    getUploadStatus,
    templateDelete,
    phoneUpload,
    userTemplateCrop,
    userTemplateCropN,
};
export {
    getTagsTree,
    templateFind,
    templateUpload,
    getUploadStatus,
    templateDelete,
    phoneUpload,
    editeUserVideoInfo,
    userTemplateCrop,
    userTemplateCropN,
};
