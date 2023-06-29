import logger from './logger';

const key = {
    api: 'VIDEO-API-',
    bgLinearColor: 'VIDEO-EDITOR-BG-LINEAR-COLOR',
    bgPurityolor: 'VIDEO-EDITOR-BG-PURITY-COLOR',
    imageDragTip: 'VIDEO-EDITOR-IMAGE-DRAG-TIP',
    workspaceDragTip: 'VIDEO-EDITOR-WORKSPACE-DRAG-TIP',
    newQrcode: 'VIDEO-EDITOR-NEW-QRCODE',
    newUpload: 'VIDEO-EDITOR-NEW-UPLOAD',
    newHelp: 'VIDEO-EDITOR-NEW-HELP',
    userInfo: 'VIDEO-USER-INFO',
    noShowPreViewTip: 'VIDEO-USER-NO-SHOW-PREVIEW-TIP',
    endNoobGuide: 'VIDEO-NOOBGUIDE-END',
    newFunction: 'VIDEO-NEW-FUNCTION',
    subtitleTips: 'VIDEO-SUBTITLE',
    userSetting: 'VIDEO-USER_SETTING',
    simpleTip: 'VIDEO-SIMPLE-TIP',
    flashGuide: 'VIDEO-FLASH-GUIDE',
    eqxAdSDKTip: 'VIDEO-AD-TIP',
    flashReplaceCked: 'VIDEO-FLASH-REPLACE-CKED',
    buyXiudianTip: 'VIDEO-XIUDIAN-TIP',
    timeLineNoob: 'VIDEO-TIMELINE-NOOB',
    openPreviewModal: 'VIDEO-OPENPREVIEW',
    shareDownloadPop: 'VIDEO-SHARE-DOWNLOAD-POPOVER',
};


function setItem(field, value) {
    localStorage.setItem(field, JSON.stringify(value));
}

function getItem(field) {
    const value = localStorage.getItem(field);
    if (!value && field === key.userInfo) {
        return {};
    }
    try {
        return JSON.parse(value);
    } catch (err) {
        // 只要是通过这里的setItem设置的都不会转换失败，这里只是做一个万一
        logger.error(err);
        return value;
    }
}

function removeItem(field) {
    localStorage.removeItem(field);
}

function getCookie(name) {
    let arr;
    const reg = new RegExp(`(^| )${name}=([^;]*)(;|$)`);

    if (arr = document.cookie.match(reg) && arr) {
        return unescape(arr[2]);
    } else {
        return null;
    }
}

/**
 * 设置用户配置
 * @param key
 * @param value
 */
export const setUserSetting = (field, value) => {
    const userSetting = JSON.parse(localStorage.getItem(key.userSetting) || '{}');
    userSetting[field] = value;
    setItem(key.userSetting, userSetting);
};
/**
 * 读取用户配置
 * @param key
 * @returns {*}
 */
export const getUserSetting = (field) => {
    const userSetting = JSON.parse(localStorage.getItem(key.userSetting) || '{}');
    if (field) {
        return userSetting[field];
    }
    return userSetting;
};


export default {
    setItem,
    getItem,
    removeItem,
    getCookie,
    key,
};

export {
    setItem,
    getItem,
    removeItem,
    getCookie,
    key as localStorageKey,
};
