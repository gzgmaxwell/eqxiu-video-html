/* eslint-disable no-console */
// @ts-check
import React from "react";
import {
    CANVAS_TYPE,
    CANVAS_TYPE_NAME,
    // @ts-ignore
    CustomSetTimerType,
    DEFAULT_ANIMATE_FONT_FAMILY,
    HD_RESOLUTION,
    SEGMENT_TYPE,
    SUBTITLES_FONTS,
    TimeSetLayerType,
    TimeSetVideoType,
    WORKSPACE_SIZE
} from "../config/staticParams";
import { showModal } from "../page/components/modal";
import { isObject, randomValue } from "./util";
import { cloneDeep, isEqual } from "lodash";
import { flashAnimates, animateFontSize, ANIMATION_TYPES } from "../dataBase/animations";
import { getItem, localStorageKey } from "./storageLocal";
import {
    MARKET_TYPE,
    USER_MARKET_NAME,
    USER_MARKET_STYLE_LIST
} from "../config/staticParams/userMarket";
import { round } from "./number";
import { deleteObjectKeys } from "./object";

/**
 * 上传参数过滤器
 * @param rules 规则 格式如下
 * [
 *  {                   // 单个属性
    attr: '属性名',      // 属性名
    rules: [{           // 规则列表
      name: 'required', // 必须存在
      msg: '必须填写标题' // 报错消息
    }, {
      name: 'max',      // 长度
      value: 15,        // 值
      msg: '长度不可超过15'
    }],
  },
 * ]
 * @param state 上传的状态对象
 * @param reError 为ture的时候直接返回错误，不返回error
 * @returns {true|Object}  //true 为通过   有则为 {attr1Error：'msg',attr2Error:'msg'} 这样的对象
 */
const filter = (rules, state, reError = false) => {
    const error = {};
    let errorCount = 0;
    rules.forEach(item => {
        const { attr } = item;
        error[`${attr}Error`] = "";
        item.rules.forEach(val => {
            switch (val.name) {
                case "required":
                    if (
                        state[attr] === undefined ||
                        state[attr] === null ||
                        state[attr].length === 0 ||
                        state[attr].size === 0
                    ) {
                        error[`${attr}Error`] = val.msg;
                        errorCount += 1;
                    }
                    break;
                case "max":
                    if (String(state[attr]).length > val.value) {
                        error[`${attr}Error`] = val.msg;
                        errorCount += 1;
                    }
                    break;
                default:
                    return null;
            }
        });
    });
    return reError ? error : errorCount === 0 || error;
};
/**
 * 重置过滤器
 * @param dataFilterRules
 */
const resetFilter = dataFilterRules => {
    const arr = dataFilterRules.map(item => `${item.attr}Error`);
    const newState = {};
    for (const a of arr) {
        newState[a] = null;
    }
    return newState;
};
/**
 * 数字变成中文
 * @param num
 * @returns {string}
 */
const numberToChinese = num => {
    const china = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
    const arr = [];
    const english = String(num).split("");
    for (let i = 0; i < english.length; i += 1) {
        arr[i] = china[english[i]];
    }
    return arr.join("");
};
/**
 * 用来判断是否应该有声音
 * @param canvasType
 * @param templateType
 * @returns {boolean}
 */
export const haveSound = (canvasType, templateType) => {
    if (canvasType === CANVAS_TYPE.userVideo || CANVAS_TYPE.userVideoNew === canvasType) {
        return true;
    }
    if (canvasType === CANVAS_TYPE.templateVideo && templateType === SEGMENT_TYPE.SEGMENT_VIDEO) {
        return true;
    }
    return false;
};
// 插入限制
const limitList = {
    [CANVAS_TYPE.text]: {
        name: "普通文本",
        limit: 10,
        limitCn: "十条"
    },
    [CANVAS_TYPE.img]: {
        name: "图片",
        limit: 10,
        limitCn: "十张"
    },
    [CANVAS_TYPE.gif]: {
        name: "图片",
        limit: 10,
        limitCn: "十张"
    },
    [CANVAS_TYPE.userVideo]: {
        name: "视频",
        limit: 3,
        limitCn: "三个"
    },
    [CANVAS_TYPE.userVideoNew]: {
        name: "视频",
        limit: 3,
        limitCn: "三个"
    },
    [CANVAS_TYPE.templateVideo]: {
        name: "视频",
        limit: 3,
        limitCn: "三个"
    },
    [CANVAS_TYPE.specialText]: {
        name: "特效字",
        limit: 5,
        limitCn: "五个"
    },
    [CANVAS_TYPE.spacialImg]: {
        name: "特效图",
        limit: 5,
        limitCn: "五个"
    },
    [CANVAS_TYPE.artFont]: {
        name: "艺术字",
        limit: 10,
        limitCn: "十个"
    },
    [CANVAS_TYPE.animateFont]: {
        name: "动画字",
        limit: 15,
        limitCn: "十五个"
    },
    [CANVAS_TYPE.animateImg]: {
        name: "动画图",
        limit: 5,
        limitCn: "五个"
    },
    [CANVAS_TYPE.ornament]: {
        name: "动态元素",
        limit: 5,
        limitCn: "五个"
    },
    [CANVAS_TYPE.sticker]: {
        name: "贴纸",
        limit: 10,
        limitCn: "十个"
    },
    [CANVAS_TYPE.dynamicBg]: {
        name: "动态背景",
        limit: 1,
        limitCn: "1个"
    },
    [CANVAS_TYPE.clad]: {
        name: "覆层",
        limit: 3,
        limitCn: "3个"
    },
    [CANVAS_TYPE.realShoot]: {
        name: "视频",
        limit: 3,
        limitCn: "3个"
    }
};
const noShow = [
    CANVAS_TYPE.userVideo,
    CANVAS_TYPE.userVideoNew,
    CANVAS_TYPE.gif,
    CANVAS_TYPE.realShoot
];
// 超量信息
const limitInfo = `每个片段最多允许插入${Object.keys(limitList)
    .map(a => {
        const v = limitList[a];
        return noShow.includes(~~a) ? false : `${v.limit}个${v.name}`;
    })
    .filter(v => v)
    .join(",")}。`;
/**
 * 插入素材数量控制
 * @param elementList
 * @param type
 * @returns {boolean}
 */
export const limitInsert = (elementList, type) => {
    // @ts-ignore
    const dataList = elementList || window._dva_app._store.getState().workspace.dataList;
    const name = limitList[type];
    const unexpectedArr = [CANVAS_TYPE.dynamicBg];
    let unexpectedCount = 0;
    if (unexpectedArr.includes(type)) {
        unexpectedCount = 1;
    }
    const videoArray = [
        CANVAS_TYPE.templateVideo,
        CANVAS_TYPE.userVideo,
        CANVAS_TYPE.userVideoNew,
        CANVAS_TYPE.realShoot
    ];
    const imageArray = [CANVAS_TYPE.img, CANVAS_TYPE.gif];
    const group = videoArray.includes(type)
        ? videoArray
        : imageArray.includes(type)
        ? imageArray
        : false;
    if (
        dataList.reduce((prev, cur) => {
            if (group ? group.includes(cur.type) : cur.type === type) {
                return prev + 1;
            }
            return prev;
        }, 0) >=
        name.limit + unexpectedCount
    ) {
        showModal({
            title: (
                <span>
                    该片段允许插入的“
                    <span style={{ color: "#42a9ff" }}>{name.name}</span>
                    ”已达上限
                    {name.limit}个
                </span>
            ),
            info: limitInfo
        });
        return false;
    }
    return true;
};
/**
 * 插入素材时获取素材名字,通过相同类型素材的索引加一
 * @param dataList
 * @param type
 * @returns {string}
 */
export const getLayerName = (dataList, type) => {
    let index = 0;
    for (let i = 0; i < dataList.length; i += 1) {
        if (dataList[i] && dataList[i].type === type) {
            const match = (dataList[i].layerName || "0").match(/\d+/g);
            if (match && index < match[0]) {
                index = parseInt(match[0], 10);
            }
        }
    }
    return `${CANVAS_TYPE_NAME[type]}${index + 1}`;
};

/**
 * 获取旁白同时告知是否是全局旁白
 * @param editor
 * @return {{isAll: boolean, voice: {url:string, name:string},voiceLoop: boolean}}
 */
export function getVoiceFormEditor(editor) {
    const { parties, voice, nowIndex, voiceLoop } = editor;
    let isAll = true;
    if (voice) {
        return {
            isAll,
            voice,
            voiceLoop
        };
    } else {
        isAll = false;
        if (parties[nowIndex] && parties[nowIndex].voice) {
            return {
                isAll,
                voice: parties[nowIndex].voice,
                voiceLoop: parties[nowIndex].voiceLoop
            };
        } else {
            return {
                isAll: true,
                voice: {
                    url: null,
                    name: ""
                },
                voiceLoop: true
            };
        }
    }
}

/**
 * 统一生成元素的renderSetting
 * @param ele
 * @returns {*}
 */
export const createEleRenderSetting = (ele, partyDuration = 4) => {
    let result = {
        startTime: 0,
        endTime: ele.segmentPartyDuration || ele.videoDuration || partyDuration
    };
    if (isObject(ele.renderSetting)) {
        result = { ...result, ...ele.renderSetting };
        if (result.startTime < 0) {
            result.startTime = 0;
        }
        return result;
    }
    try {
        result = ele.renderSetting ? { ...result, ...JSON.parse(ele.renderSetting) } : result;
    } catch (e) {
        console.log("ElerenderSetting解析失败");
    }
    delete result.customDuration;
    if (result.startTime < 0) {
        result.startTime = 0;
    }
    return result;
};
/**
 * 判断是否是参与时长判断的元素
 * @param {Object} ele 元素对象
 * @param {Boolean} reObj 是否返回对象
 * @returns {*}
 */
export const isSetTimerEle = (ele, reObj = false) => {
    const renderSetting = isObject(ele.renderSetting)
        ? ele.renderSetting
        : createEleRenderSetting(ele);
    const refuc = isTimer1 => {
        if (reObj) {
            return {
                renderSetting,
                isTimer: isTimer1
            };
        }
        return isTimer1;
    };
    // 如果是隐藏元素则不参与时长计算
    const isHidden = ele.visibility === "hidden";
    if (isHidden) return refuc(false);
    // 如果是内部元素则需要判断是不是时间点元素，如果是自定义才是时间点元素的需要判断是否是自定义
    const isTimerELe = TimeSetVideoType.includes(ele.type);
    const isTimer = TimeSetLayerType.includes(ele.templateType) || isTimerELe;
    if (reObj) {
        return {
            renderSetting,
            isTimer
        };
    }
    return isTimer;
};
/**
 * 用于生成片段渲染设置对象
 * @param {Object} oriParty
 * @returns {{filter: string, concatSet: {duration: number, concatType: string},
 * segmentPartyDuration}}
 */
export const createRenderSetting = oriParty => {
    const party = oriParty;
    let result = {
        filter: "none",
        concatSet: {
            duration: 800,
            concatType: "none"
        },
        bgmVolume: 100,
        segmentPartyDuration: 4
    };
    let addElements = false;
    if (party.elementList && !party.elements) {
        party.elements = party.elementList;
        addElements = true;
    }
    if (isObject(party.renderSetting)) {
        let segmentPartyDuration = 0;
        if (party.renderSetting.concatSet && party.renderSetting.concatSet.duration === 1200) {
            party.renderSetting.concatSet.duration = 1000;
        }
        // 有片段元素则从动态片段元素中获取最长值
        if (party.elementList) {
            party.elementList.forEach(v => {
                // 是否是设置时间的对象
                const { isTimer, renderSetting: eleRenderSetting } = isSetTimerEle(v, true);
                if (isTimer && eleRenderSetting.endTime > segmentPartyDuration) {
                    segmentPartyDuration = eleRenderSetting.endTime;
                }
            });
        }
        return {
            ...result,
            ...party.renderSetting,
            segmentPartyDuration:
                segmentPartyDuration || party.renderSetting.segmentPartyDuration || 4
        };
    } else if (party.elements) {
        try {
            result = party.renderSetting ? JSON.parse(party.renderSetting || "{}") : result;
            // 如果片段时长短于元素时长，则更新到元素时长。
            let segmentPartyDuration = 0;
            // 有片段元素则从动态片段元素中获取最长值
            if (party.elements) {
                party.elements.forEach(v => {
                    // 是否是设置时间的对象
                    const { isTimer, renderSetting: eleRenderSetting } = isSetTimerEle(v, true);
                    if (isTimer && eleRenderSetting.endTime > segmentPartyDuration) {
                        segmentPartyDuration = eleRenderSetting.endTime;
                    }
                });
            }
            if (segmentPartyDuration) {
                result.segmentPartyDuration = segmentPartyDuration;
            }
        } catch (e) {
            console.log("renderSetting解析失败");
        }
    } else {
        // 原始模板编辑器
        result.segmentPartyDuration = party.videoDuration || 4;
    }
    if (addElements) {
        delete party.elements;
    }
    // 转场老数据兼容 1200秒转1000
    if (result.concatSet && result.concatSet.duration === 1200) {
        result.concatSet.duration = 1000;
    }
    return result;
};
/**
 * 获取uuid
 * */
export const createUUID = () => {
    const s = [];
    const hexDigits = "0123456789abcdef";
    for (let i = 0; i < 36; i += 1) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
    // bits 6-7 of the clock_seq_hi_and_reserved to 01
    // @ts-ignore
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
    // eslint-disable-next-line no-multi-assign
    s[8] = s[13] = s[18] = s[23] = "-";
    const uuid = s.join("");
    return uuid;
};
export const handleMaxOrMinNum = (oriValue, max = 10, min = 0) => {
    let value = oriValue;
    // eslint-disable-next-line no-restricted-globals
    if (isNaN(value)) {
        value = parseInt(value, 10) || 0;
    }
    if (value > max) {
        return max;
    }
    if (value < min) {
        return min;
    }
    return Number(value);
};
/**
 * 控制输入参数的最大最小值
 * @param {Number} value 输入参数
 * @param {Array<Number>} param1 最大最小值数组
 */
export const limitNumber = (value, [minValue, maxValue]) => {
    const { max, min } = Math;
    return max(minValue, min(maxValue, value));
};
/**
 * 判断是否在高清渲染
 * @param item
 * @returns {boolean}
 */
export const hasHdRendering = item => {
    const hdProgress = item.hdRenderProgress;
    return hdProgress !== null && ~~hdProgress < 99;
};
/**
 * rgba转16进制
 * */
export const rgbToHex = str => {
    if (str.startsWith("rgba") || str.startsWith("rgb")) {
        const values = str
            .replace(/rgba?\(/, "")
            .replace(/\)/, "")
            .replace(/[\s+]/g, "")
            .split(",");
        const a = (255 * (1 - parseFloat(values[3] || 1))).toString(16);
        const r = parseFloat(values[0])
            .toString(16)
            .padStart(2, "0");
        const g = parseFloat(values[1])
            .toString(16)
            .padStart(2, "0");
        const b = parseFloat(values[2])
            .toString(16)
            .padStart(2, "0");
        return `#${r}${g}${b}${a}`.toUpperCase();
    } else {
        return str;
    }
};

/**
 * 比较对象的key值是否有变化
 * @param {Object} before 改变前的对象
 * @param {Object} after 改变后的对象
 * @param {Array<String>} keys xxx.yyy.>zzz  a.表示对象，>表示上个字段是个数组，会循环对比每一项
 * @returns {boolean}
 */
export function contrast(before, after, keys) {
    const uniKeys = Array.from(new Set(keys));
    return uniKeys.some(value => {
        if (value.includes(".")) {
            const values = value.split(".");
            let b = before;
            let a = after;
            for (const v of values) {
                if (v.startsWith(">")) {
                    if (Array.isArray(a) && Array.isArray(b)) {
                        if (b.length !== a.length) {
                            return true;
                        }
                        for (let i = 0; i < b.length; i += 1) {
                            const tempArr = value.split(">");
                            tempArr.shift();
                            const newValue = tempArr.join(">");
                            if (contrast(b[i], a[i], [newValue])) {
                                return true;
                            }
                        }
                    } else {
                        throw new Error(`${v} parent is not Array`);
                    }
                }
                if (!b) return true;
                if (v === "left") break;
                b = b[v];
                a = a[v];
            }
            return a !== b;
        }
        if (!value) return before !== after;
        if (isObject(before[value]) || isObject(after[value])) {
            return !isEqual(before[value], after[value]);
        }
        return before[value] !== after[value];
    });
}

/**
 * 从obj里面取出对应的key
 * @param {Object} obj
 * @param {Array} keys
 */
export function filterFromObj(obj, keys) {
    const newObj = {};
    keys.forEach(key => {
        newObj[key] = obj[key];
    });
    return newObj;
}

// 根据element data创建animation Data
export function getAnimationData(elementType = 1, data, transverse) {
    const deep = cloneDeep(data);
    const {
        animate = {},
        renderSetting,
        id,
        uuid,
        layerName,
        lock,
        type,
        url,
        visibility,
        content,
        fontFamily,
        width,
        height,
        left,
        top,
        padding,
        fontSize,
        borderWidth,
        letterSpacing,
        borderRadius,
        ...animationData
    } = deep;
    const sizes = transverse ? HD_RESOLUTION.hoz : HD_RESOLUTION.ver;
    const proWidth = transverse ? WORKSPACE_SIZE.l : WORKSPACE_SIZE.s;
    const multiple = proWidth / sizes.x;
    if (visibility === "hidden") {
        return null;
    }
    const initData = {
        type: elementType, // html类型 1文字， 2图片
        data: {
            // 元素相关的数据
            url, // html类型是图片时的url
            text: content, // html类型是文字时的文本内容
            styles: {
                ...animationData,
                width: width / multiple || 0,
                height: height / multiple || 0,
                left: left / multiple || 0,
                top: top / multiple || 0,
                padding: padding / multiple || 0,
                fontSize: fontSize / multiple || 0,
                borderWidth: ~~borderWidth / multiple || 0,
                letterSpacing: letterSpacing / multiple || 0,
                borderRadius: ~~borderRadius / multiple || 0,
                fontFamily: (
                    SUBTITLES_FONTS[fontFamily] || SUBTITLES_FONTS[DEFAULT_ANIMATE_FONT_FAMILY]
                ).ass
            }
        }
    };
    const resData = [];
    const inAnimate =
        animate[ANIMATION_TYPES.ENTRANCE] &&
        animate[ANIMATION_TYPES.ENTRANCE].animationName &&
        animate[ANIMATION_TYPES.ENTRANCE];
    const stayAnimate =
        animate[ANIMATION_TYPES.STAY] &&
        animate[ANIMATION_TYPES.STAY].animationName &&
        animate[ANIMATION_TYPES.STAY];
    const exitsAnimate =
        animate[ANIMATION_TYPES.EXITS] &&
        animate[ANIMATION_TYPES.EXITS].animationName &&
        animate[ANIMATION_TYPES.EXITS];
    if (inAnimate) {
        //有入场动画
        resData.push({
            ...initData,
            ...inAnimate,
            stageType: ANIMATION_TYPES.ENTRANCE
        });
    }
    if (stayAnimate) {
        //有强调动画
        resData.push({
            ...initData,
            ...stayAnimate,
            stageType: ANIMATION_TYPES.STAY
        });
    }
    if (exitsAnimate) {
        //有退出动画
        resData.push({
            ...initData,
            ...exitsAnimate,
            stageType: ANIMATION_TYPES.EXITS
        });
    }
    return resData;
}

/**
 * 处理快闪视频的片段内容，根据data获取片段的类型和具体的内容
 * 片段内容初始格式为： #-1-#:这是一段测试内容
 *
 * */
export const handleFlashContent = data => {
    const regExp = new RegExp(/^#-(.*?)-#:/);
    if (regExp.test(data)) {
        return {
            type: Number(data.match(/^#-(.*?)-#:/)[1]),
            content: data.replace(/^#-(.*?)-#:/, "")
        };
    } else {
        return {};
    }
};
/**
 *
 * @param {{index:number, startTime:number, transverse:boolean, content:string }} data
 *
 * */
export const getTextStyles = ({ index, startTime, transverse, content = "" }) => {
    //一个字符不需要添加动画
    const isAnimate = content.length > 1;
    let animationName = randomValue(flashAnimates); // 动画类型
    while (content.length > 4 && animationName === "magnifier") {
        animationName = randomValue(flashAnimates); // 动画类型
    }
    // @ts-ignore
    const animationDuration = isAnimate ? parseInt(Math.random() * 300) + 100 : 0; //动画时长 300-600毫秒
    //随机的停留时长
    const sizeItem = animateFontSize[Math.min(content.length - 1, animateFontSize.length - 1)];
    const {
        duration: [minDuration, maxDuration],
        fontSize: [minFontSize, maxFontSize]
    } = sizeItem;
    // @ts-ignore
    const stayDuration = parseInt(Math.random() * (maxDuration - minDuration)) + minDuration; // 停留时长
    // @ts-ignore
    const fontSize = parseInt(parseInt(Math.random() * minFontSize) + (maxFontSize - minFontSize)); //字体大小
    const canvas_width = transverse ? WORKSPACE_SIZE.l : WORKSPACE_SIZE.s; // 画布的宽度
    const canvas_height = transverse ? WORKSPACE_SIZE.s : WORKSPACE_SIZE.l; // 画布的高度
    const height = Math.ceil((content.length * fontSize) / canvas_width) * fontSize * 1.5; // 文本框高度
    const animateData = isAnimate
        ? {
              [ANIMATION_TYPES.ENTRANCE]: {
                  animationName,
                  animationDuration,
                  animationIteration: 1,
                  stageType: ANIMATION_TYPES.ENTRANCE,
                  delay: 0
              }
          }
        : undefined;
    return {
        uuid: createUUID(),
        type: isAnimate ? CANVAS_TYPE.animateFont : CANVAS_TYPE.text,
        layerName: `${isAnimate ? "动画字" : "文本"}${index}`,
        content,
        width: canvas_width,
        height,
        top: (canvas_height - height) / 2,
        fontSize,
        animate: animateData,
        renderSetting: {
            startTime,
            endTime: startTime + (animationDuration + stayDuration) / 1000,
            customDuration: true
        }
    };
};
/**
 *
 * @param {{url: string, transverse:boolean}} data
 *
 * */
export const getImageStyles = ({ url, transverse }) => {
    const animationName = randomValue(flashAnimates); // 动画类型
    // @ts-ignore
    const animationDuration = parseInt(Math.random() * 100) + 300; //动画时长 400-800毫秒
    // @ts-ignore
    const stayDuration = parseInt(Math.random() * 200) + 200; // 停留时长 400-1200毫秒
    const canvas_width = transverse ? WORKSPACE_SIZE.l : WORKSPACE_SIZE.s; // 画布的宽度
    const canvas_height = transverse ? WORKSPACE_SIZE.s : WORKSPACE_SIZE.l; // 画布的高度
    return {
        uuid: createUUID(),
        layerName: "动画图1",
        url,
        width: canvas_width,
        height: canvas_height,
        top: 0,
        left: 0,
        rotate: 0,
        lock: false,
        type: CANVAS_TYPE.animateImg,
        animate: {
            [ANIMATION_TYPES.ENTRANCE]: {
                animationName,
                animationDuration,
                animationIteration: 1,
                stageType: ANIMATION_TYPES.ENTRANCE,
                delay: 0
            }
        },
        backgroundColor: "rgba(0,0,0,0)",
        borderColor: "rgba(0,0,0,0)",
        borderStyle: "unset",
        borderWidth: 0,
        opacity: 1,
        aspectRatio: 1,
        renderSetting: {
            startTime: 0,
            endTime: (animationDuration + stayDuration) / 1000,
            customDuration: true
        }
    };
};
export const getCommonTextStyles = () => {
    return {
        lock: false,
        left: 0,
        rotate: 0,
        padding: 0,
        fontFamily: "fangzheng_ktjt",
        borderColor: "rgba(0,0,0,0)",
        borderStyle: "unset",
        borderWidth: 0,
        textAlign: "center",
        textAlignLast: "center",
        lineHeight: 1.5,
        letterSpacing: 0,
        fontStyle: "normal",
        textDecoration: "none",
        fontWeight: "normal",
        color: "#000000",
        backgroundColor: "rgba(0,0,0,0)"
    };
};
export { filter, resetFilter, numberToChinese };

export function isNoobGuideIng() {
    // @ts-ignore
    const { noobGuide: { isNoob } = {} } = window._dva_app._store.getState();
    return isNoob === true;
}

export function isOpenPreviewModal() {
    return getItem(localStorageKey.openPreviewModal);
}

export function decimalToPercentage(num) {
    return `${Number(num) * 100}%`;
}

/**
 * 获取验证方法
 * @param type
 * @returns {(function(*=): {res: boolean, message: (boolean|string)})|(function(*=): {res: boolean, message: (boolean|string)})|(function(): {res: boolean, message: boolean})}
 */
export function userMarketContentVerify(type) {
    function verifyPhone(content) {
        if (!content) {
            return {
                res: false,
                message: "请输入手机/电话号码"
            };
        }
        const res = /^[0-9+\-]+$/i.test(content);
        return {
            res,
            message: !res && "请输入正确的号码"
        };
    }

    function verifyLink(content) {
        if (!content) {
            return {
                res: false,
                message: "请输入链接"
            };
        }
        const res = /^((http:|https:)?\/\/|www)/i.test(content);
        return {
            res,
            message: !res && "需以http(s)://或www开头"
        };
    }

    if (type === MARKET_TYPE.phone) {
        return verifyPhone;
    } else {
        return verifyLink;
    }
}

/**
 * 整理前端向后端提交的营销组件数据
 * @param {Object} item
 * @param {Number} sort
 * @param {Number} scale
 * @returns {{buttonImg: *, rotate: *, sort: *, type, title: *, positionX: *, positionY: *, bgColor: *, animations: string, displayTimeType: number, width: *, id: *, opacity: *, fontColor: *, height: *}|null}
 */
export function mapToBackendForUserMarket(item, sort, scale) {
    if (item) {
        const data = {
            id: item.id || null,
            sort,
            type: item.componentType,
            displayTimeType: item.timeType,
            buttonImg: item.coverImg,
            title: String(item.title).slice(0, 12),
            bgColor: item.backgroundColor,
            fontColor: item.color,
            fontSize: item.fontSize / scale,
            opacity: item.opacity,
            positionX: item.left / scale,
            positionY: item.top / scale,
            width: item.width / scale,
            height: item.height / scale,
            rotate: item.rotate,
            content: item.content,
            animations: JSON.stringify(item.animate),
            fontBoxTop: item.fontTop,
            fontBoxLeft: item.fontLeft,
            fontBoxWidth: item.fontWidth,
            fontBoxHeight: item.fontHeight,
            fontBoxStyleType: item.styleType
        };
        return data;
    }
    return null;
}

export async function mapToFrontendForUserMarket(item, sort, scale = 1) {
    if (item) {
        const data = {
            id: item.id,
            partySort: item.sort,
            componentType: item.type,
            type: CANVAS_TYPE.userMarket,
            uuid: createUUID(),
            positionTop: true,
            layerName: USER_MARKET_NAME[item.type],
            timeType: item.displayTimeType,
            coverImg: item.buttonImg,
            title: item.title,
            backgroundColor: "#ffffff00", //item.bgColor,
            color: item.fontColor,
            opacity: item.opacity,
            left: item.positionX * scale,
            top: item.positionY * scale,
            width: item.width * scale,
            height: item.height * scale,
            rotate: item.rotate,
            content: item.content,
            animate: JSON.parse(item.animations),
            fontSize: Math.round(item.fontSize * scale),
            styleType: Number(item.fontBoxStyleType) || 1
        };
        const { background, fontStyle, styleType } = await getUserMarketStyle(
            data.componentType,
            data.styleType || 1
        );
        return { background, ...fontStyle, ...data, styleType };
    }
    return null;
}

/**
 * 处理交给后端的片段setting数据
 * @param {Object} party
 * @returns {string}
 */
export function mapPartyToBackend(party) {
    let backend = { ...party };
    const deleteKeys = [
        "renderSetting",
        "uuid",
        "resolutionH",
        "resolutionW",
        "haveChange",
        "segmentPartyDuration",
        "groupList"
    ];
    backend = deleteObjectKeys(backend, deleteKeys);
    const elementsDeleteKeys = ["width", "height", "top", "left", "rotate"];

    function dig(item) {
        const newObj = { ...item };
        for (const key of Object.keys(newObj)) {
            if (elementsDeleteKeys.includes(key)) {
                newObj[key] = round(newObj[key], 2);
            }
        }
        return newObj;
    }

    backend.elementList = backend.elementList.map(item => dig(item));
    return JSON.stringify(backend);
}

export async function getUserMarketStyle(type, outStyleType = 1) {
    const styles = (USER_MARKET_STYLE_LIST[type] || []).find(v => v.key === outStyleType) || {
        fontStyle: {},
        defaultSize: { width: 140, height: 40 },
        backgroundUrl: new Promise(reslove => reslove({ default: null })),
        key: undefined
    };
    let styleType = 1;
    if (!styles.key) {
        styleType = 1;
    } else {
        styleType = styles.key;
    }
    const fontStyle =
        (styles.fontStyle && {
            fontWidth: styles.fontStyle.width,
            fontHeight: styles.fontStyle.height,
            fontTop: styles.fontStyle.top,
            fontLeft: styles.fontStyle.left,
            color: styles.fontStyle.color,
            backgroundColor: "#ffffff00", //背景颜色，
            title: styles.fontStyle.title,
            fontSize: Number(styles.fontStyle.fontSize) || 14
        }) ||
        {};
    const { default: background } = await styles.backgroundUrl;
    return { styleType, fontStyle, background, defaultSize: styles.defaultSize };
}
