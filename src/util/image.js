/* eslint-disable prefer-destructuring */
import env from 'Config/env';
import delayLoad from 'Util/delayLoad.js';
import {version, name} from '../config/env';
import {
    HD_RESOLUTION,
    SUBTITLES_H,
    SUBTITLES_TRANSVERSE_W,
    SUBTITLES_W,
} from '../config/staticParams';


export default {
    genUrl,
    genQrCode,
};

export {
    genUrl,
    genQrCode,
    genAvatar,
    genNewResizeParams,
    getImgAspectRatioByUrl,
};

/**
 * 获取图片比例，
 * @param picUrl
 * @returns {Promise<any>}
 */
function getImgAspectRatioByUrl(picUrl) {
    const img = new Image();
    img.src = picUrl;
    return new Promise(resolve => {
        const set = setInterval(() => {
            if (img.width > 0 || img.height > 0) {
                clearInterval(set);
                resolve(img.width / img.height);
            }
        });
    }, 40).catch((e) => {
        console.log(e);
    });
}

/**
 * 生成后缀
 * @param width
 * @param height
 * @param format
 * @param type
 * @returns {string}
 */
function genImgSuffix({width = '', height = '', format = '', mode = 0}, type = 'qiniu', freeParams = '') {
    let params = [
        ...String(freeParams)
            .split('/'), 'auto-orient', 'strip'];
    if ([0, 1, 3].includes(~~mode) && (Number(width) && Number(height))) {
        params.push('thumbnail');
        if (mode === 0 && Number(width) && height) {
            params.push(`${width}x${height}`);
        }
        if ((mode === 1 || mode === 3) && width && height) {
            params.push(`!${width}x${height}r`);
        }
    }
    if ([2, 3].includes(~~mode) && (width || height)) {
        params.push(`crop/${width}x${height}`);
    }
    if (format) {
        params.push('format');
        params.push(format);
    }
    const noRepeatProps = ['auto-orient', 'strip'];
    const hasRepeatProps = [];
    params = params.filter(v => {
        if (!v) return false;
        if (noRepeatProps.includes(v)) {
            if (hasRepeatProps.includes(v)) {
                return false;
            } else {
                hasRepeatProps.push(v);
            }
        }
        return true;
    });
    return (params.length > 2) ? `imageMogr2/${params.join('/')}` : '';
}


/**
 * 生成url间隔符 ？： &
 * @param url
 * @returns {string} ?:&
 */
export function generateSeparator(ourl) {
    const url = String(ourl);
    const hasQuestion = String(url)
        .indexOf('?');
    const hasFop = String(url).indexOf('|');
    if (hasQuestion === url.length - 1 || hasFop === url.length - 1) return '';
    return hasQuestion > 0 ? '&' : '?';
}

function formatImgParams(formatStr) {
    const formatObj = {};
    if (formatStr) {
        const arr = formatStr.split(':');
        formatObj.width = arr[0];
        formatObj.height = arr[1];
        if (arr[2]) {
            formatObj.format = arr[2];
        }
        formatObj.mode = Number(arr[3]) || 0;
    }
    return formatObj;
}

/**
 * 生成头像
 * @param url
 * @returns {*}
 */
function genAvatar(url, formatStr = '') {
    if (!url || !url.replace(env.host.musicFile, '')) {
        return null;
    }
    const formatObj = formatImgParams(formatStr);
    formatObj.mode = 1;
    if (url.includes('imageMogr2')) {
        url = url.split('?')[0];
    }
    if (typeof url === 'string' && (url.indexOf('http') === 0 || url.indexOf('//') === 0)) {
        return `${url}${generateSeparator(url)}${genImgSuffix(formatObj, 'qiniu')}`;
    } else {
        return `${env.host.musicFile}${url}${generateSeparator(url)}${genImgSuffix(formatObj,
            'qiniu')}/crop/${formatObj.width || ''}x${formatObj.height || ''}`;
    }
}

/**
 * 统一生成显示图片视频等资源（除头像外）Url的方法
 * @param {string} url;
 * @param {string} formatStr;
 * @returns {*}
 */
function genUrl(ourl, formatStr = '', freeParams = '') {
    // 'http://test.res.eqh5.com/FjapX1EISqIavIzTNYjrMNljwMIs?imageMogr2/crop/!3740.9999999999995x670.5078188004032a0a833.2634387600806'
    if (!ourl) return;
    const suffix = freeParams;
    let url = ourl;
    // 如果已经有处理 则添加管道操作符
    if (ourl.includes('imageMogr2/') && (formatStr || freeParams)) {
        url += '|';
    } else if (formatStr || freeParams) {
        url += generateSeparator(url);
    }
    const isSvg = url.includes('svg');
    const formatObj = formatImgParams(formatStr);
    const ver = `ver=${version}-${name}`;
    if (!url || url === 'undefined' ||
        !url.replace(env.host.file.replace(`${location.protocol}`, ''), '')) {
        return null;
    }
    if (typeof url === 'string' && (url.indexOf('http') === 0 || url.indexOf('//') === 0)) {
        // 如果是七牛（去掉http:头）并且没有拼接format
        if (url.includes('//res') && !url.includes('imageMogr2')) {
            return `${url}${isSvg ? '' : `${genImgSuffix(formatObj, 'qiniu', suffix)}`}`;
        }
        return `${url}${genImgSuffix(formatObj, 'qiniu', suffix)}`;
    } else if (/^\/tencent/.test(url)) {
        return `${env.host.tencentimgcdn}${url}${genImgSuffix(
            formatObj, 'tencent', suffix)}`;
    } else if (typeof url === 'string') {
        const repx = new RegExp(env.host.file.replace(/^http(s?):/, ''), 'gim');
        const newUrl = url.replace(repx, '');
        return `${env.host.file}${newUrl}${genImgSuffix(formatObj, 'qiniu', suffix)}`;
    }
    return url;
}

/**
 * 获取图片的原生数据
 * @param {*} src
 */
function image(src) {
    const deferred = window.Defer();
    const image = new Image();
    image.crossOrigin = 'anonymous';

    image.onload = () => {
        deferred.resolve(image);
    };

    image.onerror = () => {
        deferred.reject();
    };

    image.src = getAbsoluteUrl(src);

    return deferred.promise;
}

/**
 * 生成二维码
 * @param el 元素
 * @param text 文本
 * @param option 配置
 * @param type 类型0=无中心图片  其他等于有
 * @param src 图片链接
 */
function genQrCode(el, text, option = null, type = 0, src = null) {
    const size = parseInt(option.width);
    option.size = size;
    option.text = text;
    let promise = delayLoad.delayLoadJS(env.plugin.jquery)
        .then(() => delayLoad.delayLoadJS(env.plugin.qrcode));
    if (type) {
        const src = src || qrcodeLogo;
    }
    if (src && type) { // type: 0 无图片, 1 有图片
        promise = promise
            .then(() => image(src))
            .then((image) => {
                Object.assign(option, {
                    mode: 4,
                    mSize: 30 * 0.01,
                    mPosX: 50 * 0.01,
                    mPosY: 50 * 0.01,
                    image,
                });
            });
    }
    return promise
        .then(() => {
            const $image = image = window.$('<div>')
                .qrcode(option)
                .children()
                .get(0);
            el.innerHTML = '';
            el.appendChild($image);
        })
        .catch(err => err);
}


/**
 * 获取根据图片urlToBase64
 * @param {string} picUrl
 * @returns {string}
 */
export async function picUrltoBase64(picUrl) {
    const blob = await new Promise(resolve => {
        const xhr = new XMLHttpRequest();
        xhr.open('get', String(picUrl)
            .replace('http:', window.location.protocol), true);
        xhr.responseType = 'blob';
        xhr.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                resolve(this.response);
            }
        };
        xhr.send();
    });
    const dataUrl = await new Promise(resolve => {
        const fileReader = new FileReader();
        fileReader.onload = function (e) {
            resolve(e.target.result);
        };
        fileReader.readAsDataURL(blob);

    });
    return dataUrl;
}

/**
 * 生成新插入的比例
 * @param obj 包含宽高 和 宽高分辨率 数据
 * @param transverse 是否是横版画布
 * @param oriMultiple  总比例
 */
function genNewResizeParams(obj, transverse = true, oriMultiple = 1) {
    const params = {};
    if (transverse) {
        if (!obj.width && (obj.resolutionH > 315 || obj.resolutionW > 560)) {
            if ((obj.resolutionH - 315) > (obj.resolutionW - 560)) {
                const multiple = (315 / obj.resolutionH);
                params.width = obj.resolutionW * multiple * oriMultiple;
                params.height = 315 * oriMultiple;
            } else {
                const multiple = (560 / obj.resolutionW);
                params.width = 560 * oriMultiple;
                params.height = obj.resolutionH * multiple * oriMultiple;
            }
        } else {
            params.width = obj.width || obj.resolutionW;
            params.height = params.width * obj.resolutionH / obj.resolutionW;
        }
        params.left = obj.left || (560 - params.width) / 2;
        params.top = obj.top || (315 - params.height) / 2;
        params.rotate = obj.rotate || 0;
    } else {
        if (!obj.width && (obj.resolutionH > 560 || obj.resolutionW > 315)) {
            if ((obj.resolutionH - 560) > (obj.resolutionW - 315)) {
                const multiple = (560 / obj.resolutionH);
                params.width = obj.resolutionW * multiple * oriMultiple;
                params.height = 560 * oriMultiple;
            } else {
                const multiple = (315 / obj.resolutionW);
                params.width = 315 * oriMultiple;
                params.height = obj.resolutionH * multiple * oriMultiple;
            }
        } else {
            params.width = obj.width || obj.resolutionW;
            params.height = params.width * obj.resolutionH / obj.resolutionW;
        }
        params.left = obj.left || (315 - params.width) / 2;
        params.top = obj.top || (560 - params.height) / 2;
        params.rotate = obj.rotate || 0;
    }
    return params;
};

/**
 * 根据传入的图片和位置信息构造一张新的图片,图片水平垂直居中, 返回promise对象
 * @param {string} url 封面图片的地址
 * @param {boolean} transverse 封面背景的横竖版
 *
 *
 * */
export const img2Cover = async (url, transverse) => {
    if (!url) {
        return null;
    }
    // 获取图片的比例
    const aspectRatio = await getImgAspectRatioByUrl(genUrl(url));
    // 获取横竖版的比例
    const scale = transverse ? 16 / 9 : 9 / 16;
    // 获取横竖版时背景画布的宽高
    const width = transverse ? HD_RESOLUTION.hoz.x : HD_RESOLUTION.ver.x;
    const height = transverse ? HD_RESOLUTION.hoz.y : HD_RESOLUTION.ver.y;
    let videoStyle = {};
    // 通过图片的真实比例，获取缩放后的图片大小以宽度还是高度为基准
    if (aspectRatio > scale) {
        videoStyle = {
            width,
            height: width / aspectRatio,
            top: (height - width / aspectRatio) / 2,
            left: 0,
        };
    } else {
        videoStyle = {
            width: height * aspectRatio,
            height,
            top: 0,
            left: (width - height * aspectRatio) / 2,
        };
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.background = '#fff';
    const img = new Image();
    img.src = await picUrltoBase64(genUrl(url));
    img.setAttribute('crossOrigin', 'anonymous');
    const base64 = await new Promise(resolve => {
        img.onload = () => {
            const {left, top, width, height} = videoStyle;
            const context = canvas.getContext('2d');
            context.fillStyle = '#fff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, left, top, width, height);
            resolve(canvas.toDataURL());
        };
    }).catch((err) => {
        console.log(err);
    });
    return base64;
};
