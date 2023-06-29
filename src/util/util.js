import qs from "qs";

/**
 * 判断是否支持webp格式的图片
 */
// const isSupportWebp = !![].map && document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0
import { OPEN_FROM, PAY_STATUS, VIDEO_RENDER_TYPE } from "../config/staticParams";
import { TYPE_PAGE } from "../config/staticParams/goodsParams";

/**
 * 判断是否支持webm
 * @type {boolean}
 */
const isSupportWebm =
    document.createElement("video").canPlayType('video/webm; codecs="vp8.0, vorbis"') !== "";
/**
 * 判断是否是windows平台
 */
// const isWin = ['Win32', 'Windows'].includes(navigator.platform)
const isWin = /win/.test(navigator.platform.toLocaleLowerCase());
/**
 * 判断是否是Linux平台
 * @type {boolean}
 */
export const isLinux = /linux/.test(navigator.platform.toLocaleLowerCase());
//
// /**
//  * 判断是否是mac平台
//  */
// const isMac = ['Mac68K', 'MacPPC', 'Macintosh', 'MacIntel'].includes(navigator.platform)
const isMac = /mac/.test(navigator.platform.toLocaleLowerCase());
/**
 * 判断是否是Firefox
 */
const isFirefox = /Firefox/.test(navigator.userAgent);
/**
 * 判断是否是Safari
 */
const isSafari = /Safari/.test(navigator.userAgent);
/**
 * 判断是否是Edge
 */
const isEdge = /Edge/.test(navigator.userAgent);
/**
 * 判断是否是Chrome
 */
const isChrome = /Chrome/.test(navigator.userAgent) && !isEdge;

/**
 * 判断参数是哪种类型
 * @param {*} obj
 */
export function checkType(obj, type) {
    return Object.prototype.toString.call(obj).toLowerCase() === `[object ${type}]`;
}

/**
 * 判断参数是不是对象
 * @param {*} obj
 */
function isObject(obj) {
    return checkType(obj, "object");
}

/**
 * 判断参数是不是字符串
 * @param {*} obj
 */
function isString(obj) {
    return checkType(obj, "string");
}

/**
 * 判断参数是不是方法
 * @param {*} obj
 */
function isFunction(obj) {
    return checkType(obj, "function");
}

/**
 * 获取随机数
 * @param min
 * @param max
 * @returns {number}
 */
function getRandom(min, max) {
    let choose = max - min + 1;
    return Math.floor(Math.random() * choose + min);
}

/**
 * 获取Chrome的版本号
 */
function getChromeVersion() {
    return Number(/Chrome\/(\d+)/.exec(navigator.userAgent)[1]);
}

function isPromise(e) {
    return !!e && typeof e.then === "function";
}

export function insertStr(str, flg, sn) {
    let newstr = "";
    const tmp = str.substring(str, sn);
    newstr += tmp + flg;
    return newstr;
}

/**
 * 计算双字节字符的真实长度。
 * @param str
 * @returns {真实长度}
 */
export function dbLength(str) {
    let leg = String(str).length || 0;
    for (const s of String(str)) {
        const db = s.charCodeAt(0).toString(16).length === 4;
        if (db) leg += 1;
    }
    return leg;
}

/**
 * 双字节的字符串拆切
 * @param s
 * @param n
 * @returns {*}
 */
export function dbSubString(s, n) {
    return s
        .slice(0, n)
        .replace(/([^x00-xff])/g, "$1a")
        .slice(0, n)
        .replace(/([^x00-xff])a/g, "$1");
}

/**
 * 全局替换
 * @param from
 * @param to
 * @returns {*}
 */
export function replaceAll(str, from, to) {
    const reg = new RegExp(from, "g"); // 创建正则RegExp对象
    return str.replace(reg, to);
}

/**
 * 随机获取数组的某一项或者对象的某一个属性的值
 * @param source
 * @returns {*}
 */
export function randomValue(source) {
    if (Array.isArray(source)) {
        return source[parseInt(Math.random() * source.length)];
    } else {
        return source[parseInt(Math.random() * Object.keys(source).length)];
    }
}

/**
 * 生成公告新共能提示和新手引导的数据格式
 * @param source
 * @returns {*}
 */
export function genStoreData(reason) {
    const time = new Date().getTime();
    return {
        reason,
        time
    };
}

/**
 * 将查询url字符串转为对象。
 * @param source
 * @returns {*}
 */
export function getURLObj(URL) {
    const queryString = URL.split("?")[1];
    const json = qs.parse(queryString);
    let obj = json;
    if (json.openFrom) {
        if (json.openFrom === OPEN_FROM.longPage) {
            obj.name = "长页";
        } else {
            obj.name = "H5";
        }
        obj = { ...json };
    }
    return obj;
}

/**
 *  单次购买和开通会员按钮的文字显示
 * @param source
 * @returns {*}
 */
export function handleBtnText(payStatus, tab) {
    const obj = {
        payBtnText: "",
        vipBtnText: ""
    };
    if (payStatus === PAY_STATUS.pay) {
        // 视频需要购买
        if (tab === TYPE_PAGE.download) {
            obj.payBtnText = "购买后再下载";
            obj.vipBtnText = "开通会员免费下载";
        } else if (tab === TYPE_PAGE.share) {
            obj.payBtnText = "购买后再分享";
            obj.vipBtnText = "开通会员免费分享";
        } else if (tab === TYPE_PAGE.implant) {
            obj.payBtnText = "购买后再嵌入";
            obj.vipBtnText = "开通会员免费嵌入";
        }
    } else if (payStatus === PAY_STATUS.render) {
        // 视频已经购买等待生成
        if (tab === TYPE_PAGE.download) {
            obj.payBtnText = "下载";
        } else if (tab === TYPE_PAGE.share) {
            obj.payBtnText = "设置";
        } else if (tab === TYPE_PAGE.implant) {
            obj.payBtnText = "嵌入";
        }
    } else if (payStatus === PAY_STATUS.done) {
        // 视频已经生成
        if (tab === TYPE_PAGE.download) {
            obj.payBtnText = "下载";
        } else if (tab === TYPE_PAGE.share) {
            obj.payBtnText = "保存";
        } else if (tab === TYPE_PAGE.implant) {
            obj.payBtnText = "确认嵌入";
        }
    }
    return obj;
}

/**
 * 视屏预览下载分享嵌入文字处理
 * @param source
 * @returns {*}
 */
export function textTip(type) {
    let text = "";
    if (type === TYPE_PAGE.download) {
        text = "下载";
    } else if (type === TYPE_PAGE.share) {
        text = "分享";
    } else if (type === TYPE_PAGE.implant) {
        text = "嵌入";
    }
    return text;
}

/**
 * 将秒12s转换成00:00.0
 * @param source
 * @returns {*}
 */
export function time2fs(time) {
    const formatTime = moment(Math.round(Number(time) * 10) / 10, "X").format("mm:ss.S");
    return formatTime;
}

/**
 * 将一纬数组构造二维数组
 * @param source
 * @returns {*}
 */
function handleArr(arr) {
    const newArr = [...arr];
    let myArr = [];
    for (let i = 0; i < newArr.length; i++) {
        myArr.push([newArr[i].startTime, newArr[i].endTime]);
    }
    // console.log(myArr);
    return myArr;
}
/**
 * 大于num的数组
 * @param source
 * @returns {*}
 */

export function handleThenNum(arr, num) {
    const newArr = [...arr];
    let myArr = [];
    for (let i = 0; i < newArr.length; i++) {
        if (newArr[i] > num) {
            myArr.push(newArr[i]);
        }
    }
    console.log(myArr);
    return myArr;
}
/**
 * 将一纬数组构造称二维数组
 * @param source
 * @returns {*}
 */

export function handleStartPlayTimeArr(arr) {
    const newArr = [...arr];
    let myArr = [];
    for (let i = 0; i < newArr.length; i++) {
        myArr.push(newArr[i][0]);
    }
    console.log(myArr);
    return myArr;
}
/**
 * 将[[2,5], [7,10]] ===> [[1,2],[5,7]]
 * @param source
 * @returns {*}
 */
export function handleArrLeft(arr, duration = 0) {
    const newArr = [...arr];
    const myArr = [];
    const maxIndex = newArr.length - 1;
    if (newArr.length) {
        for (let i = 0; i < newArr.length; i++) {
            if (i === 0 && newArr[0][0] > 0) {
                myArr.push([0, newArr[0][0]]);
            }
            if (i > 0) {
                myArr.push([newArr[i - 1][1], newArr[i][0]]);
            }
            if (i === maxIndex && duration > newArr[maxIndex][1]) {
                myArr.push([newArr[maxIndex][1], duration]);
            }
        }
    }
    // console.log('不可播放的区间',myArr);
    return myArr;
}

/**
 * 将[[2,5], [7,10]] ===> [[1,2],[5,7]]
 * @param source
 * @returns {*}
 */
export function handleAddMaxTime(arr, time = 0) {
    const newArr = [...arr];
    const myArr = [];
    const minTime = 1;
    if (!newArr.length) {
        return [0, time];
    }
    if (newArr.length) {
        // myArr 得到大于1秒的数组
        for (let i = 0; i < newArr.length; i++) {
            if (newArr[i][1] - newArr[i][0] >= minTime) {
                myArr.push([newArr[i][0], newArr[i][1]]);
            }
        }
    }
    if (!myArr.length) {
        return [0, time];
    }

    if (myArr.length === 1) {
        return [myArr[0][0], myArr[0][1]];
    }
    const effectTimeArr = effectTime(myArr);
    console.log(effectTimeArr);
    return effectTimeArr;
}
/**
 * 计算添加片段的数组[1,2]
 * @param source
 * @returns {*}
 */
function effectTime(arr) {
    const newArr = [...arr];
    const needArr = [];
    for (let i = 0; i < newArr.length; i++) {
        needArr.push(newArr[i][1] - newArr[i][0]);
    }
    const index = getMaxIndex(needArr);
    const time = [newArr[index][0], newArr[index][1]];
    return time;
}

/**
 * 将二维数组得出有效时间段的的二维数组
 * @param source
 * @returns {*}
 */
export function duplicateRemoval(data) {
    var intervals = handleArr(data);
    intervals.sort(function(a, b) {
        if (a[0] !== b[0]) return a[0] - b[0];
        return a[1] - b[1];
    });
    var len = intervals.length,
        ans = [],
        start,
        end;

    for (var i = 0; i < len; i++) {
        var s = intervals[i][0],
            e = intervals[i][1];
        if (start === undefined) (start = s), (end = e);
        else if (s <= end) end = Math.max(e, end);
        else {
            var part = [start, end];
            ans.push(part);
            start = s;
            end = e;
        }
    }

    if (start !== undefined) {
        var part = [start, end];
        ans.push(part);
    }
    // console.log('有效播放时间=>',ans);
    return ans;
}
/**
 * 将二维数组得出有效的时间和
 * @param source
 * @returns {*}
 */
export function getArrSum(data) {
    const arr = [...data];
    if (!arr.length) {
        return 0;
    }
    const newArr = [];
    for (let i = 0; i < arr.length; i++) {
        const item = arr[i][1] - arr[i][0];
        newArr.push(item);
    }
    let sum = 0;
    newArr.forEach(item => {
        sum += item;
    });
    return sum;
}

export function getArrMaxOrMin(data) {
    const arr = [...data];
    if (!arr.length) {
        return {
            max: 0,
            min: 0
        };
    }
    const newArr = [];
    for (let i = 0; i < arr.length; i++) {
        newArr.push(arr[i].startTime);
        newArr.push(arr[i].endTime);
    }
    const max = Math.max(...newArr);
    const min = Math.min(...newArr);
    return {
        max,
        min
    };
}
/**
 * 求数组最大值的下标
 * @param source
 * @returns {*}
 */
export function getMaxIndex(arr) {
    var max = arr[0];
    // 声明了个变量 保存下标值
    var index = 0;
    for (var i = 0; i < arr.length; i++) {
        if (max < arr[i]) {
            max = arr[i];
            index = i;
        }
    }
    return index;
}

export function getNewArr(arr) {
    const newArr = [...arr];
    const myArr = [];
    if (newArr.length > 0) {
        for (let i = 0; i < newArr.length; i++) {
            myArr.push(newArr[i].endTime - newArr[i].startTime);
        }
    }
    return myArr;
}

export function getClickPosition(value) {
    let position = "预览框-下载";
    if (value === TYPE_PAGE.download) {
        position = "预览框-下载";
    }
    if (value === TYPE_PAGE.share) {
        position = "预览框-分享";
    }
    if (value === TYPE_PAGE.implant) {
        position = "预览框-嵌入";
    }
    return position;
}

export {
    isObject,
    isString,
    isFunction,
    isSupportWebm,
    isWin,
    isMac,
    isChrome,
    isFirefox,
    isSafari,
    isEdge,
    getRandom,
    getChromeVersion,
    isPromise
};
export default {
    isObject,
    isString,
    isFunction,
    isSupportWebm,
    isWin,
    isMac,
    isChrome,
    isFirefox,
    isSafari,
    isEdge,
    getRandom,
    getChromeVersion,
    isPromise
};
