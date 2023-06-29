import env, { version, name, host } from 'Config/env';
import { isObject, isSupportWebm } from './util';
import { waitChoseModel } from '../page/components/delete';

const tencentcdn = host.tencentcdn;
const deleteHeader = str => {
    const replaceCdn = tencentcdn.replace(/^http(s?):/, '');
    return str.replace(replaceCdn, '')
    // .replace(env.host.file, '')
        .replace(/^http(s?):/, '');
};

export default {
    genMusicUrl,
    addFilePath,
    genVideoUrl,
    genImageUrl,
    genZip,
    genImgInfo,
    isCompressed,
};
export {
    genMusicUrl,
    addFilePath,
    genVideoUrl,
    genImageUrl,
    genZip,
    genImgInfo,
    isCompressed,
    isTencent,
};

function isTencent(url) {
    return /^\/tencent/.test(url);
}

/**
 * 生成图片信息对象
 * @param spec 100x200xpng
 * @returns {*}
 */
function genImgInfo(spec) {
    if (typeof spec === 'string') {
        const arr = spec.split('x');
        const [width, height, formats] = arr;
        return {
            width,
            height,
            formats,
            aspectratio: width / height,
        };
    }
    return {
        width: null,
        height: null,
        formats: null,
        aspectratio: 1,
    };
}

/**
 * 配置上传的音乐地址
 * @param url
 * @returns {string}
 */
function genMusicUrl(url) {
    if (typeof url === 'string' && (url.indexOf('http') === 0 || url.indexOf('//') === 0)) {
        return url;
    } else if (isTencent(url)) {
        return `${tencentcdn}${url}`;
    } else {
        return `${env.host.musicFile}${url}`;
    }
}


/**
 * 生成上传的视频地址
 * @param url
 * @returns {string}
 */
function genVideoUrl(url) {
    if (!url) return;
    const ver = '';
    if (typeof url === 'string' && (url.indexOf('http') === 0 || url.indexOf('//') === 0)) {
        return url;
    } else if (isTencent(url)) {
        return `${tencentcdn}${url}${ver}`;
    } else {
        return `${env.host.file}${url}${ver}`;
    }
}

/**
 * 根基兼容性取得视频地址
 * @param obj
 * @param all 全地址？
 */
export function compatibleVideo(obj = {}, all = false) {
    const oriUrl = (isSupportWebm ? obj.videoWebmUrl : obj.videoMp4Url) || obj.previewUrl;
    if (all) {
        return genVideoUrl(oriUrl);
    } else {
        return oriUrl;
    }
}


/**
 * 发现该视频有Webm 格式时，使用Webm 的格式，否则还是使用MP4格式的视频
 * （safrai 还是使用MP4格式，在用户添加到画布时提示如右图）
 * @param  templateUrl:mov; transcodeUrl:mp4 ;webmUrl:webm
 * @param all 全地址？
 */
export function compatibleVideoWebm(obj = {}, all = false) {
    let oriUrl = '';
    if (obj.webmUrl) {
        if (!isSupportWebm) {
            waitChoseModel({
                text: '该视频带透明通道，但是Safari浏览器不支持展示,生成时会使用带透明通道的视频素材',
                info: '',
                cancelBtnShow: false,
                sureBtn: '知道了',
            }).then((res) => {
                if (res) {
                    oriUrl = obj.transcodeUrl;
                }
            }).catch(re => re);
            oriUrl = obj.transcodeUrl;
        } else {
            oriUrl = obj.webmUrl;
        }
    }
    if (!obj.webmUrl){
        oriUrl = obj.transcodeUrl || obj.templateUrl || obj.previewUrl;
    }
    if(all){
        return genVideoUrl(oriUrl);
    }
    return oriUrl;
}

/**
 * 生成上传的 zip文件地址
 * @param url
 * @returns {*}
 */
function genZip(url) {
    return deleteHeader(url);
}

/**
 * 生成上传的图片地址
 * @param url
 * @returns {string}
 */
function genImageUrl(url) {
    if (!url || !url.replace(env.host.file.replace(`${location.protocol}`, ''), '')) return '';
    if (typeof url === 'string' && (url.indexOf('http') === 0 || url.indexOf('//') === 0)) {
        return url;
    } else if (isTencent(url)) {
        return `${tencentcdn}${url}`;
    } else {
        return `${env.host.file}${url}`;
    }
}


function isCompressed(fileName) {
    const len = fileName.length - 4;
    return len > 0 &&
        (fileName.lastIndexOf('.mov') === len || fileName.lastIndexOf('.zip') === len
            || fileName.lastIndexOf('.mp4') === len);
}


/**
 * 传入后端时文件时去掉腾讯的地址
 * @param url
 * @param type
 */
function addFilePath(url, type) {
    if (typeof url === 'string') {
        switch (type) {
            case 1:
                return url;
                break;
            case 2:
                return deleteHeader(genImageUrl(url));
                break;
            case 3:
                return deleteHeader(genMusicUrl(url));
                break;
            case 4:
                return deleteHeader(genVideoUrl(url));
                break;
            default:
                return url;
        }
    } else {
        return url;
    }
};

/**
 *把音频格式转换成  name:url 的格式
 */
export function encodeMusic(obj) {
    if (!isObject(obj)) return obj;
    if (obj.url) {
        return `${obj.name.replace(':', '-')}:${addFilePath(obj.url, 3)}`;
    } else {
        return null;
    }
};

/**
 * 把音频 的  name：url格式转换成{name,url}
 */
export function decodeMusic(str) {
    if (!str) {
        return {
            name: null,
            url: null,
            volume: 100,
        };
    }
    const arr = str.split(':');
    return {
        name: arr[0],
        url: arr[1],
        volume: 100,
    };
}
