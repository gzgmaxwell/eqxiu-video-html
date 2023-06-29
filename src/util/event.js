import { isLinux, isMac, isWin } from './util';

/**
 * 触发元素事件
 * @param el
 */
export const triggerEvent = (el, event = 'click', type = 'MouseEvents') => {
    if (document.all) {
        const f = el.event;
        f();
    } else {
        let e = document.createEvent(type);
        e.initEvent(event, true, true);
        el.dispatchEvent(e);
    }
};

/**
 * 解析EQX的消息事件函数
 * @param message
 * @returns {type:'xxx'}||false
 */
export const formatEQXMessage = (message) => {
    const { data } = message;
    let obj = '';
    if (typeof (data) === 'string') {
        try {
            obj = JSON.parse(data);
        } catch (e) {
            return false;
        }
    } else if (typeof (data) === 'object') {
        obj = data;
    }
    if (obj.type || obj.eventType) {
        return obj;
    } else {
        return false;
    }
};

/**
 * 判断是否按住ctrl或者command
 * */
export const isPressedCtrl = (event = {}) => {
    if (isMac) {
        return event.metaKey;
    }
    return event.ctrlKey;
};
/**
 * 判断是否按住Alt
 * */
export const isPressedAlt = (event = {}) => {
    return event.altKey;
};

export const dontAny = (e) => {
    e.stopPropagation();
    e.preventDefault();
};
