import { message as antdMessage } from "antd";
import isEqualWith from "lodash/isEqualWith";
import cloneDeep from "lodash/cloneDeep";
import {
    CANVAS_TYPE,
    DEFAULT_FONT_FAMLIY,
    DEFAULT_WORKSPACE_IMG_HEIGHT,
    HASH_TYPE,
    WorkspaceVideoType,
    VIDEO_TYPE,
    WORKSPACE_SIZE,
    ELEMENT_PARAMS,
    DEFAULT_ELE_BACKGROUND_COLOR,
    LAYER_TYPE,
    WorkspaceTextType
} from "../config/staticParams";
import { userTemplateId } from "../api/template";
import { genNewResizeParams, getImgAspectRatioByUrl } from "../util/image";
import { arrayMove } from "react-sortable-hoc";
import { defaultTextStyle, genMaterialList, getDataList } from "../services/editorData";
import { getAllSegment } from "../api/templateShow";
import EditorHistory from "../services/editorHistory";
import { getMyFont, getAllFontBlob } from "../api/user";
import { addGlobalStyle } from "../util/doc";
import { compatibleVideo, compatibleVideoWebm, isWebmUrl } from "../util/file";
import { host } from "../config/env";
import {
    haveSound,
    limitInsert,
    getLayerName,
    createUUID,
    createEleRenderSetting,
    isSetTimerEle,
    getUserMarketStyle
} from "../util/data";
import { getGifVideo, getImgInfoByQiNiu } from "../api/upload";
import { delay } from "../util/delayLoad";
import eventEmitter from "../services/EventListener";
import { WORKSPACE_Z_INDEX } from "Config/staticParams";
import React from "react";
import { getRectPoint } from "../util/geometry";
import { canSaveWaiteModel, waitModal } from "../page/components/modal";
import {
    MARKET_TYPE,
    USER_MARKET_NAME,
    USER_MARKET_STYLE_LIST
} from "../config/staticParams/userMarket";
import Message from "../page/components/common/Message";
import { isShowker } from "./User";
import { sendBDEvent } from "../services/bigDataService";
import { getStylesList } from "../services/userMarket";

let historyList = {};
const defaultActiveIndex = 1; // 默认选中项
let pasteTimes = 0;
let genGifTimes = 0;

function reduceAnimateTime(duration, item) {
    return duration + (item.animationDuration + item.delay) / 1000;
}

/**
 * 是否能继续添加营销组件
 * @returns {boolean}
 */
function userMarketLimit(num = 1) {
    const { parties } = window._dva_app._store.getState().editor;
    // 超限判断
    const haveCount = parties.reduce((total, party) => {
        const partyCount = party.elementList.reduce((partTotal, element) => {
            if (element.type === CANVAS_TYPE.userMarket) {
                return partTotal + 1;
            }
            return partTotal;
        }, 0);
        return total + partyCount;
    }, 0);
    if (haveCount + num > 3) {
        antdMessage.error("营销组件整个视频最多添加三个");
        return false;
    }
    return true;
}

/**
 * 根据覆层置顶位置插入所有元素
 * @param dataList 数据列表
 * @param insertData 待插入数据
 */
function insertElementFromClad(dataList, inInsertData) {
    let insertIndexs = [];
    let newDataList = [...dataList];
    dataList.forEach((list, index) => {
        if (list.positionTop && list.positionTop === true) {
            insertIndexs.push(index);
        }
    });
    let insertData = inInsertData;
    let insertTopCount = 0;
    if (Array.isArray(inInsertData)) {
        insertData = inInsertData
            .map((list, index) => {
                if (list.positionTop && list.positionTop === true) {
                    insertIndexs.push(index);
                    newDataList.push(list);
                    insertTopCount += 1;
                    return false;
                }
                return list;
            })
            .filter(v => v);
    }
    // 插入元素
    // let len = insertIndexs.length == 0 ? dataList.length : (...insertIndexs);
    let insertIndex = dataList.length - insertIndexs.length;
    let activeIndexs = [];

    if (Array.isArray(insertData)) {
        newDataList.splice(insertIndex, 0, ...insertData);
        for (let i in insertData) {
            activeIndexs.push(insertIndex + Number(i));
        }
    } else {
        newDataList.splice(insertIndex, 0, insertData);
    }
    for (let i = 1; i <= insertTopCount; i += 1) {
        activeIndexs.push(newDataList.length - i);
    }

    return {
        dataList: newDataList,
        activeIndex: activeIndexs[0] || insertIndex,
        activeIndexs
    };
}

/**
 * 覆层是否置顶
 */
function cladIsTop(dataList, oldIndex, newIndex) {
    // 覆层置顶后拖动提示
    const topIndex = dataList.findIndex(v => v.positionTop === true);
    const element = dataList[oldIndex];
    if ((topIndex !== -1 && newIndex >= topIndex) || element.positionTop === true) {
        if (element.type === CANVAS_TYPE.clad) {
            antdMessage.warning("请先取消覆层置顶后再操作");
        } else if (element.type === CANVAS_TYPE.userMarket) {
            antdMessage.warning("营销组件不参与图层排序");
        } else {
            antdMessage.warning("已有置顶的覆层或者营销组件");
        }
        return true;
    }
    return false;
}

function moveLayer(dataList) {
    let newDataList = [];
    // 除了覆层外其他元素
    let newList = [];
    // 置顶覆层元素
    let topList = [];
    // 未置顶元素
    let topTempList = [];
    topList = dataList.filter(v => v.type === CANVAS_TYPE.clad && v.positionTop === true);
    topTempList = dataList.filter(v => v.type === CANVAS_TYPE.clad && v.positionTop === false);
    newList = dataList.filter(v => v.type !== CANVAS_TYPE.clad);

    newDataList = [...newList, ...topTempList, ...topList];

    return newDataList;
}

/**
 * 获取视频缩放值
 * @param {boolean} transverse 是否是横版视频
 * @param {Number} type 类型
 * @param {Number} width 视频宽
 * @param {Number} height 视频高
 * @returns {number}
 */
export function getVideoZoom(transverse, type, width, height) {
    if (
        (transverse && type === CANVAS_TYPE.spacialImg) ||
        (transverse && type === CANVAS_TYPE.specialText && width > height) ||
        (!transverse && type === CANVAS_TYPE.specialText && width < height)
    ) {
        return 0.5;
    }
    return 1;
}

function genGroupDataList(dataList, groupList) {
    const liArray = [];
    const groupInserted = [];
    dataList.forEach((item, index) => {
        const group = groupList.find(value => value.activeElems.find(v => v.uuid === item.uuid));
        if (group) {
            if (groupInserted.includes(group.uuid)) {
                return;
            }
            groupInserted.push(group.uuid);
            const childProps = {
                index,
                currentIndex: index,
                ...group,
                activeElems: group.activeElems
                    .map(value => dataList.find(ele => ele.uuid === value.uuid))
                    .filter(v => v)
            };
            liArray.push(childProps);
        } else {
            liArray.push(item);
        }
    });
    return liArray;
}

export default {
    namespace: "workspace",
    state: {
        activeIndex: null, // 激活index
        activeIndexes: [], // 激活indexes
        beforeChangeActiveHook: null, // 改变激活前的钩子 返回false 会中止修改
        dataList: [], // 素材列表
        haveChange: false,
        partyIndex: null, // 片段序号
        myFonts: [],
        history: {},
        isLoading: false,
        copyData: {},
        layerMgr: false,
        groupList: [], // 组合列表
        activeGroupIndex: null
    },
    effects: {
        *reset(action, { put }) {
            historyList = {};
            pasteTimes = 0;
            yield put.resolve({
                type: "save",
                payload: {
                    activeIndex: null, // 激活index
                    activeIndexes: [], // 激活index
                    beforeChangeActiveHook: null, // 改变激活前的钩子 返回false 会中止修改
                    dataList: [], // 素材列表
                    haveChange: false,
                    history: {}
                }
            });
        },
        // 改变公共参数的方法
        *changeCommon({ payload }, { put }) {
            yield put({
                type: "saveCommon",
                payload
            });
        },
        // 片段更改时调用
        *changeAll({ payload: { dataList: oriDataList, ...payload } }, { put, select }) {
            const dataList = oriDataList;
            pasteTimes = 0;
            yield put.resolve({
                type: "save",
                payload: { isLoading: true }
            });

            // yield put.resolve({
            //     type: "getMyFonts"
            // });

            const {
                workspace: { history, uuid, myFonts }
            } = yield select(({ workspace, timeLine }) => ({
                workspace,
                timeLine
            }));
            historyList[uuid] = history || new EditorHistory(dataList);
            // 遍历下dataList 来取加载字体

            // if (Array.isArray(dataList)) {
            //     dataList.forEach((v, i) => {
            //         if (v.layerName === undefined) {
            //             dataList[i].layerName = getLayerName(dataList, v.type);
            //         }
            //         if (
            //             [CANVAS_TYPE.text, CANVAS_TYPE.artFont, CANVAS_TYPE.animateFont].includes(
            //                 v.type
            //             ) &&
            //             v.fontFamily !== DEFAULT_FONT_FAMLIY
            //         ) {
            //             // 是字体而且不是默认字体
            //             const { fontFamily = null, woffPath = null, ttfPath = null } =
            //                 myFonts.find(f => f.fontFamily === v.fontFamily) || {};
            //             if (!fontFamily) {
            //                 dataList[i].fontFamily = DEFAULT_FONT_FAMLIY;
            //             } else {
            //                 addGlobalStyle(fontFamily, woffPath || ttfPath, true);
            //             }
            //         }
            //     });
            // }
            yield put({
                type: "saveHistory",
                payload: {
                    ...payload,
                    dataList,
                    isLoading: false,
                    activeIndexes: [],
                    activeIndex: null,
                    history:
                        historyList[payload.uuid] ||
                        new EditorHistory({
                            dataList,
                            groupList: payload.groupList || []
                        })
                }
            });
        },
        *changeELementsTime(
            {
                payload: {
                    uuidArr,
                    timeObj: { start, end }
                }
            },
            { put, select }
        ) {
            const { dataList, uuid } = yield select(({ workspace }) => workspace);
            const newDataList = dataList.map(value => {
                if (!uuidArr.includes(value.uuid)) return value;
                return {
                    ...value,
                    renderSetting: {
                        ...value.renderSetting,
                        startTime: start,
                        endTime: end
                    }
                };
            });
            yield put.resolve({
                type: "save",
                payload: {
                    uuid,
                    dataList: newDataList,
                    haveChange: true
                }
            });
            yield put.resolve({
                type: "editor/reloadVideoDuration",
                payload: { uuid }
            });
        },
        // 更改当前激活元素配置
        *changeNow(
            { payload: { refresh = true, isRotate = false, _index, ...payload } },
            { put, select }
        ) {
            const { activeIndex: oldIndex, dataList: oldDataList, uuid } = yield select(
                ({ workspace }) => workspace
            );
            const dataList = cloneDeep(oldDataList);
            const activeIndex = _index !== undefined ? _index : oldIndex;
            const dataListElement = dataList[activeIndex];
            if (!dataListElement || (dataListElement.lock && payload.lock !== false)) {
                // Message.info('操作失败，请先取消图层锁定');
                return;
            }
            dataList[activeIndex] = {
                ...dataListElement,
                ...payload
            };
            let reloadVideoDuration = false; // 是否重新计算片段时长
            // if (payload.animationDuration > 0.1) {
            //     const renderSetting = dataList[activeIndex].renderSetting;
            //     const { startTime, endTime } = renderSetting;
            //     if (payload.animationDuration > (endTime - startTime) * 1000) { // 动画时长大于元素时长,重新设置元素时长
            //         reloadVideoDuration = true;
            //         dataList[activeIndex].renderSetting = {
            //             ...renderSetting,
            //             endTime: startTime + payload.animationDuration / 1000,
            //         };
            //     }
            // }

            yield put.resolve({
                type: "save",
                payload: {
                    uuid,
                    dataList,
                    haveChange: true
                }
            });
            if (refresh) {
                // 如果要更新预览
                if ((isRotate && dataListElement.type === CANVAS_TYPE.templateVideo) || !isRotate) {
                    yield put.resolve({
                        type: "partyChange",
                        payload: {
                            uuid: [dataListElement.uuid]
                        }
                    });
                }
            }

            const { type } = payload;
            if (WorkspaceVideoType.includes(type) || reloadVideoDuration) {
                yield put.resolve({
                    type: "editor/reloadVideoDuration",
                    payload: { uuid }
                });
            }
        },
        // 移动当前激活的元素
        *changeAllNow({ payload: { dontDraw = false, ...payload } }, { put, select }) {
            const { activeIndexes, dataList, uuid } = yield select(({ workspace }) => workspace);
            const uuidArr = [];
            for (let i = 0; i < activeIndexes.length; i += 1) {
                // 循环参数，重新计算参数值
                const currentIndex = activeIndexes[i];
                dataList[currentIndex].top += payload.top;
                dataList[currentIndex].left += payload.left;
                if (dataList[currentIndex].type === CANVAS_TYPE.templateVideo) {
                    uuidArr.push(dataList[currentIndex].uuid);
                }
            }
            yield put.resolve({
                type: "save",
                payload: {
                    uuid,
                    dataList,
                    haveChange: true
                }
            });
            if (!dontDraw) {
                yield put.resolve({
                    type: "partyChange",
                    payload: {
                        uuid: uuidArr
                    }
                });
            }
        },
        // 元素适应画布：Command+Alt+F
        *responsive({ payload: {} }, { put, select }) {
            const { activeIndexes, dataList } = yield select(({ workspace }) => workspace);
            const newDataList = cloneDeep(dataList);
            const { width, height } = dataList[0];
            for (let i = 0; i < activeIndexes.length; i += 1) {
                const currentIndex = activeIndexes[i];
                const { type, resolutionW, resolutionH } = dataList[currentIndex];
                const videoRate = resolutionW / resolutionH;
                // 有video比例则取video比例
                const rate =
                    videoRate || dataList[currentIndex].width / dataList[currentIndex].height;
                const isNotVideoRate = Math.abs(videoRate - rate) > 0.1;
                const widthRate = width / (resolutionW || dataList[currentIndex].width);
                const heightRate = height / (resolutionH || dataList[currentIndex].height);
                const isMaxHeight = widthRate > heightRate; // 高先满足最大值
                const isTextType = WorkspaceTextType.includes(type);
                const isVideoType = WorkspaceVideoType.includes(type);
                if (isTextType) {
                    antdMessage.warning("文本暂不支持快捷键自适应");
                    return;
                }
                console.log(isMaxHeight);
                if (isMaxHeight) {
                    newDataList[currentIndex].height = height;
                    newDataList[currentIndex].width = height * rate;
                    newDataList[currentIndex].top = 0;
                    newDataList[currentIndex].left = (width - height * rate) / 2;
                    newDataList[currentIndex].rotate = 0;
                } else {
                    newDataList[currentIndex].width = width;
                    newDataList[currentIndex].height = (width * 1) / rate;
                    newDataList[currentIndex].top = (height - (width * 1) / rate) / 2;
                    newDataList[currentIndex].left = 0;
                    newDataList[currentIndex].rotate = 0;
                }
            }
            yield put.resolve({
                type: "save",
                payload: {
                    dataList: newDataList
                }
            });
        },
        // 更改图层设置
        *saveLayerData({ payload: { data, index, uuid } }, { put, select }) {
            const {
                activeIndex,
                activeIndexes,
                dataList: oldDataList,
                uuid: PartyUUID
            } = yield select(({ workspace }) => workspace);
            const _index = index || oldDataList.findIndex(v => v.uuid === uuid);
            const dataList = cloneDeep(oldDataList);
            dataList[_index] = {
                ...dataList[_index],
                ...data
            };
            let newActiveIndexes = activeIndexes;
            if (data.lock || data.visibility === "hidden") {
                newActiveIndexes = newActiveIndexes.filter(v => v !== _index);
                if (_index === activeIndex) {
                    yield put.resolve({
                        type: "changeActive",
                        payload: { index: newActiveIndexes[0] || null }
                    });
                }
            }
            yield put.resolve({
                type: "save",
                payload: {
                    uuidL: PartyUUID,
                    dataList,
                    activeIndexes: newActiveIndexes,
                    haveChange: true
                }
            });
            if (data.visibility) {
                yield put.resolve({
                    type: "editor/reloadVideoDuration",
                    payload: { uuid: PartyUUID }
                });
                yield put.resolve({
                    type: "partyChange",
                    payload: { uuid: [] }
                });
            }
        },
        *changeGroup({ payload: { uuid, ...payload } }, { put, select }) {
            const {
                workspace: { groupList, dataList }
            } = yield select(({ workspace }) => ({ workspace }));
            let groupIndex = null;
            const group = groupList.find((v, index) => {
                if (uuid === v.uuid) {
                    groupIndex = index;
                    return true;
                }
                return false;
            });
            if (!group) return false;
            const newGroup = { ...group, ...payload };
            const newGroupList = [...groupList];
            newGroupList[groupIndex] = newGroup;
            const newDataList = dataList.map(item => {
                if (group.activeElems.find(gitem => gitem.uuid === item.uuid)) {
                    return { ...item, ...payload };
                }
                return item;
            });
            yield put.resolve({
                type: "save",
                payload: {
                    groupList: newGroupList,
                    dataList: newDataList
                }
            });
        },
        *changeBackground({ payload }, { put, select }) {
            const { dataList: oldDataList, uuid: partyUuid } = yield select(
                ({ workspace }) => workspace
            );
            const dataList = cloneDeep(oldDataList);
            window.dataList = dataList;
            dataList.forEach((v, i) => {
                if (v.type) {
                    if (v.type === CANVAS_TYPE.dynamicBg) {
                        dataList.splice(i, 1);
                    }
                }
            });
            dataList[0] = {
                ...dataList[0],
                ...payload
            };
            const { uuid } = dataList[0];
            yield put.resolve({
                type: "save",
                payload: {
                    uuid: partyUuid,
                    dataList,
                    haveChange: true
                }
            });
            yield put.resolve({
                type: "partyChange",
                payload: { uuid: [uuid] }
            });
        },
        // 修改选中项
        *changeActive({ payload: { index, clear = true, filter = true } }, { put, select }) {
            const {
                workspace: {
                    activeIndex,
                    activeIndexes,
                    beforeChangeActiveHook,
                    dataList,
                    uuid,
                    groupList = [],
                    activeGroupIndex
                },
                timeLine: { currentTimes = {} } = {}
            } = yield select(({ workspace, timeLine }) => ({
                workspace,
                timeLine
            }));
            // 取消组合
            let gList = groupList;
            if (clear) {
                gList = groupList.map(g => ({
                    ...g,
                    active: false
                }));
            }

            if (index === null && clear && filter) {
                yield put.resolve({
                    type: "save",
                    payload: {
                        activeIndex: null,
                        activeIndexes: [],
                        activeGroupIndex: null,
                        groupList: gList
                    }
                });
                eventEmitter.emit("activeType", null);
                return;
            }
            /**
             * 相等并且不在activeIndexes里面则不操作
             * V20版修改-修复第一个元素点击时不能选中
             * 不存在应取反 activeIndexes.includes(index) => !activeIndexes.includes(index)
             */
            if (index === activeIndex && (!filter || !activeIndexes.includes(index))) return;
            if (!dataList[index] && index !== null) return; // 没有数据则不操作
            const clickElement = dataList[index];
            if (clickElement && clickElement.lock) return;

            if (typeof beforeChangeActiveHook === "function") {
                const handlerBefore = yield beforeChangeActiveHook(index);
                yield put.resolve({
                    type: "save",
                    payload: { beforeChangeActiveHook: null }
                });
                if (handlerBefore === false) return;
            }
            const type = (index !== null && dataList[index].type) || null;
            let newActiveIndexes = activeIndexes;
            let newActiveIndex = index;
            if (index === null) {
                newActiveIndexes = [];
            } else if (clear && !activeIndexes.includes(index)) {
                // 是否清除activeIndexes里面的值，单个选中必须清除

                newActiveIndexes = [index];
            } else {
                if (clickElement.type === CANVAS_TYPE.userMarket) {
                    antdMessage.warning("营销组件不支持多选");
                    return false;
                }
                // eslint-disable-next-line no-lonely-if
                if (activeIndexes.includes(index)) {
                    // 已经选中则取消选择
                    if (filter && activeIndexes.length > 1) {
                        // V20版优化更改
                        // 当两个元素合并后，点击下方角标时，上方出来的展示栏会同时选中两个元素。
                        // v !== index => v === index
                        newActiveIndexes = newActiveIndexes.filter(v => v !== index);
                        newActiveIndex = newActiveIndexes[0] || null;
                    }
                } else {
                    newActiveIndexes.push(~~index);
                }
            }

            //update: lyz 2019-10-16
            //当前选中元素uuid
            const activeElemUuid =
                (dataList.length > 0 && newActiveIndex && dataList[newActiveIndex].uuid) || null;
            let newActiveGroupIndex = activeGroupIndex;
            gList.forEach(g => {
                //当前选中元素在组合内时激活当前组
                if (activeElemUuid) {
                    if (g.activeElems.some(v => v.uuid === activeElemUuid)) {
                        g.active = true;
                        //组合外元素和组内元素同时选中时右侧面板显示取消组合
                        newActiveGroupIndex = g.uuid;
                    } else {
                        //不在组合内 未组合
                        g.active = false;
                        newActiveGroupIndex = null;
                    }
                }
            });
            yield put.resolve({
                type: "save",
                payload: {
                    activeIndex: ~~newActiveIndex,
                    activeIndexes: newActiveIndexes,
                    activeGroupIndex: newActiveGroupIndex,
                    groupList: gList
                }
            });

            eventEmitter.emit("activeType", newActiveIndexes.length > 1 ? null : type);
            if (!dataList[newActiveIndex]) return;
            // 重新设置片段时间
            if (!dataList[newActiveIndex] || !dataList[newActiveIndex].renderSetting) return;
            const {
                renderSetting: { startTime, endTime }
            } = dataList[newActiveIndex];
            const currentTime = currentTimes[uuid];
            if (startTime * 1000 > currentTime || endTime * 1000 < currentTime) {
                const newCurrentTime = currentTime < startTime * 1000 ? startTime : endTime;
                yield put.resolve({
                    type: "timeLine/changeCurrentTime",
                    payload: {
                        currentTime: newCurrentTime * 1000,
                        uuid
                    }
                });
            }
        },
        // 框选时选中元素
        *boxActive({ payload = [] }, { put, select }) {
            const {
                workspace: { dataList, activeIndexes, groupList, uuid },
                timeLine: { currentTimes }
            } = yield select(({ workspace, timeLine }) => ({
                workspace,
                timeLine
            }));
            let activeGroupIndex = null;
            if (payload.sort().join("-") === activeIndexes.sort().join("-")) {
                return;
            }
            let newGroupList = [...groupList];
            let activeElemsUuid = [];
            //框选组时
            payload.forEach(index => {
                const groupUuid = dataList[index].groupUuid;
                if (groupUuid) {
                    activeGroupIndex = groupUuid;
                    newGroupList = groupList.filter(g => {
                        if (g.uuid === groupUuid) {
                            g.active = true;
                            activeElemsUuid = g.activeElems.map(v => v.uuid);
                        }
                        return g;
                    });
                }
            });
            //处理在框选时 框选到组合时自动全部选中组内所有元素 取消组合时框选元素高亮
            let _activeIndexes = [];
            const startTimes = [];
            const endTimes = [];
            dataList.forEach((v, index) => {
                if (payload.includes(index)) {
                    startTimes.push(v.renderSetting.startTime);
                    endTimes.push(v.renderSetting.endTime);
                    _activeIndexes.push(index);
                }
            });
            const _payload = Array.from(new Set([...payload, ..._activeIndexes]));

            yield put.resolve({
                type: "save",
                payload: {
                    activeIndex: _payload || null,
                    activeIndexes: _payload,
                    activeGroupIndex,
                    groupList: newGroupList
                }
            });
            if (payload.length === 1) {
                eventEmitter.emit("activeType", dataList[payload[0]].type);
            } else {
                eventEmitter.emit("activeType", null);
                return true;
            }
            // 重新设置片段时间
            const startTime = Math.min(...startTimes) || 0;
            const endTime = Math.max(...endTimes) || 100;
            const currentTime = currentTimes[uuid];
            if (startTime * 1000 > currentTime || endTime * 1000 < currentTime) {
                const newCurrentTime = currentTime < startTime * 1000 ? startTime : endTime;
                yield put.resolve({
                    type: "timeLine/changeCurrentTime",
                    payload: {
                        currentTime: newCurrentTime * 1000,
                        uuid
                    }
                });
            }
        },
        *deleteElement({ payload: { index = undefined } = {} }, { put, select }) {
            const { activeIndexes, dataList, uuid, groupList = [] } = yield select(
                ({ workspace }) => workspace
            );
            let newDataList = [];
            let needReloadTime = false;
            if (index > -1) {
                // 指定了删除元素的index
                newDataList = dataList.concat();
                newDataList.splice(index, 1);
            } else {
                /**
                 * 标记删除的元素是否包含视频，包含视频需要重新计算片段时长
                 * @param {{ lock: boolean; }} item
                 * @param {Number} dIndex
                 */
                newDataList = dataList.filter((item, dIndex) => {
                    if (!activeIndexes.includes(dIndex) || item.lock) {
                        return true;
                    }
                    if (isSetTimerEle(item)) {
                        needReloadTime = true;
                    }
                    return false;
                });
            }
            //删除组
            let delGroupUuid = null;
            let newGroupList = groupList.filter(g => {
                if (g.active) {
                    delGroupUuid = g.uuid;
                    return false;
                }
                return true;
            });
            //删除组内任意一个时删除整个组包含组内所有元素
            if (delGroupUuid) {
                newDataList = newDataList.filter(list => list.groupUuid !== delGroupUuid);
            }

            eventEmitter.emit("activeType", 0);
            yield put.resolve({
                type: "save",
                payload: {
                    uuid,
                    dataList: newDataList,
                    activeIndex: null,
                    activeIndexes: [],
                    haveChange: true,
                    groupList: newGroupList,
                    activeGroupIndex: null
                }
            });

            if (needReloadTime) {
                // 重新计算片段时长
                yield put.resolve({
                    type: "editor/reloadVideoDuration",
                    payload: { uuid }
                });
            }
            yield put.resolve({
                type: "partyChange",
                payload: { uuid: [] }
            });
        },
        /**
         * 删除组
         */ *deleteGroupElement({ payload }, { put, select }) {
            const { dataList, uuid, groupList, activeIndexes = [] } = yield select(
                ({ workspace }) => workspace
            );
            let delELeUuids = [];
            let newGroupList = groupList.filter((list, index) => {
                if (list.active) {
                    //待删除元素uuid
                    delELeUuids = list.activeElems.map(el => {
                        return el.uuid;
                    });
                } else {
                    return list;
                }
            });

            let newDataList = dataList.filter((list, index) => {
                if (!delELeUuids.includes(list.uuid)) {
                    return list;
                }
            });
            eventEmitter.emit("activeType", 0);
            yield put.resolve({
                type: "save",
                payload: {
                    uuid,
                    dataList: newDataList,
                    groupList: newGroupList,
                    activeGroupIndex: null
                }
            });
            // 重新计算片段时长
            yield put.resolve({
                type: "editor/reloadVideoDuration",
                payload: { uuid }
            });
        },

        *changeLayer({ payload: { oldIndex, newIndex } }, { put, select }) {
            const {
                workspace: { dataList, uuid, groupList }
            } = yield select(({ workspace }) => ({ workspace }));
            const { max, min } = Math;
            const liArray = genGroupDataList(dataList, groupList);
            const realNewIndex = max(min(newIndex, liArray.length - 1), 1);

            // 覆层置顶后拖动提示
            if (cladIsTop(dataList, oldIndex, newIndex)) {
                return;
            }

            // 去除undefined 再map
            const newDataList = arrayMove(liArray, oldIndex, realNewIndex)
                .filter(v => v)
                .map(v => {
                    if (v.activeElems) {
                        return v.activeElems.map(v => ({
                            ...dataList.find(aEle => aEle.uuid === v.uuid)
                        }));
                    } else {
                        return { ...v };
                    }
                })
                .flat();
            yield put.resolve({
                type: "save",
                payload: {
                    dataList: newDataList,
                    haveChange: true,
                    uuid
                    // activeIndex: realNewIndex,
                }
            });
            yield put.resolve({
                type: "partyChange",
                payload: { uuid: [] }
            });
            yield put.resolve({
                type: "changeActive",
                payload: { index: newIndex }
            });
        },
        // 插入文本
        *insertText({ payload: { type = CANVAS_TYPE.text, ...payload } }, { put, select }) {
            const {
                editor: { parties, nowIndex },
                workspace: { uuid: partyUuid },
                timeLine: { currentTimes }
            } = yield select(({ workspace, editor, timeLine }) => ({
                workspace,
                editor,
                timeLine
            }));
            const currentTime = currentTimes[partyUuid] / 1000 || 0;
            const dataList = getDataList(parties, nowIndex);
            const uuid = createUUID();
            const minTime =
                (payload.animate && Object.values(payload.animate).reduce(reduceAnimateTime, 0)) ||
                0.2;
            const endTime =
                currentTime >= parties[nowIndex].renderSetting.segmentPartyDuration - minTime
                    ? currentTime + 4
                    : parties[nowIndex].renderSetting.segmentPartyDuration;
            const insertData = {
                uuid,
                layerName: getLayerName(dataList, type),
                lock: false,
                type,
                content: "双击替换文本",
                ...defaultTextStyle,
                top: Math.random() * 300,
                ...payload,
                renderSetting: createEleRenderSetting({
                    renderSetting: {
                        startTime: currentTime,
                        endTime
                    },
                    segmentPartyDuration: parties[nowIndex].renderSetting.segmentPartyDuration
                })
            };
            // const newDataList = dataList.concat(insertData);

            // 根据覆层位置插入元素
            const newCladDataList = insertElementFromClad(dataList, insertData);

            yield put.resolve({
                type: "save",
                payload: {
                    uuid: partyUuid,
                    dataList: newCladDataList.dataList,
                    haveChange: true
                }
            });
            yield put.resolve({
                type: "partyChange",
                payload: { uuid: [uuid] }
            });
            yield put.resolve({
                type: "changeActive",
                payload: { index: newCladDataList.activeIndex }
            });
            // 调整时长
            yield put.resolve({
                type: "editor/reloadVideoDuration",
                payload: { uuid: partyUuid }
            });
            if (minTime !== 0.2) {
                yield put.resolve({
                    type: "timeLine/setMinTime",
                    payload: {
                        uuid,
                        minTime
                    }
                });
            }
            return "插入文字完毕";
        },

        // 插入图片
        *insertImg(
            { payload: { type = CANVAS_TYPE.img, picUrl, ...payload } },
            { put, select, call }
        ) {
            const {
                workspace: { dataList, uuid: partyUuid },
                editor: { transverse, parties, nowIndex },
                timeLine: { currentTimes }
            } = yield select(({ workspace, editor, timeLine }) => ({
                workspace,
                editor,
                timeLine
            }));
            if (limitInsert(dataList, type) === false) return;
            const currentTime = currentTimes[partyUuid] / 1000 || 0;

            // 获取图片的宽高比
            const aspectRatio = yield getImgAspectRatioByUrl(picUrl);
            const height = DEFAULT_WORKSPACE_IMG_HEIGHT;
            const width = height * aspectRatio;
            const workSize = {
                x: transverse ? WORKSPACE_SIZE.l : WORKSPACE_SIZE.s,
                y: transverse ? WORKSPACE_SIZE.s : WORKSPACE_SIZE.l
            };
            const uuid = createUUID();
            const minTime =
                (payload.animate && Object.values(payload.animate).reduce(reduceAnimateTime, 0)) ||
                0.2;
            const endTime =
                currentTime >= parties[nowIndex].renderSetting.segmentPartyDuration - minTime
                    ? currentTime + 4
                    : parties[nowIndex].renderSetting.segmentPartyDuration;
            const insertData = {
                ...payload,
                uuid,
                layerName: getLayerName(dataList, type),
                lock: false,
                height,
                width,
                type,
                url: picUrl,
                left: (workSize.x - width) / 2,
                top: (workSize.y - height) / 2,
                rotate: 0,
                backgroundColor: "rgba(0, 0, 0, 0)",
                borderColor: "rgba(0,0,0,1)",
                borderStyle: "unset",
                borderWidth: 0,
                opacity: 1,
                aspectRatio,
                renderSetting: createEleRenderSetting({
                    renderSetting: {
                        startTime: currentTime,
                        endTime
                    },
                    segmentPartyDuration: parties[nowIndex].renderSetting.segmentPartyDuration
                })
            };

            // 根据覆层位置插入元素
            const newCladDataList = insertElementFromClad(dataList, insertData);

            // eventEmitter.emit('activeSpecialImg');
            yield put.resolve({
                type: "save",
                payload: {
                    uuid: partyUuid,
                    dataList: newCladDataList.dataList,
                    haveChange: true
                }
            });
            yield put.resolve({
                type: "partyChange",
                payload: { uuid: [uuid] }
            });
            yield put.resolve({
                type: "changeActive",
                payload: { index: newCladDataList.activeIndex }
            });
            // 调整时长
            yield put.resolve({
                type: "editor/reloadVideoDuration",
                payload: { uuid: partyUuid }
            });
            if (minTime !== 0.2) {
                yield put.resolve({
                    type: "timeLine/setMinTime",
                    payload: {
                        uuid,
                        minTime: minTime
                    }
                });
            }
            return "插入图片完毕";
        },

        // *insertSvg({ payload: { picUrl } }, { put, call, select }) {
        //     const { data } = yield call(axios.get, picUrl, {
        //         withCredentials: false,
        //     });
        //     const object = new SvgElement({
        //         svgCode: data,
        //         type: CANVAS_TYPE.svg,
        //     });
        //     const objectData = object.exportJson();
        //     console.log(object);
        // },
        /**
         * 插入gif调用的方法。
         * @param url
         * @param updateUUid 用于更新的UUid 如果没有则需要新增
         * @param put
         * @param select
         * @param call
         * @returns {IterableIterator<*>}
         */ *insertGif(
            { payload: { url, updateUUid = null, replaceCurrent = false } },
            { put, select, call }
        ) {
            const realUrl = url.split("?")[0];
            const response = yield call(getGifVideo, [realUrl]);
            const {
                data: { success, obj: object = {} }
            } = response;
            const { id = null, webmUrl = null, mp4Url = null, ...obj } = object[realUrl] || {};
            let newUuid = updateUUid;
            const {
                workspace: { dataList: oldDataList, activeIndex, uuid: partyUuid },
                editor: { parties, nowIndex },
                timeLine: { currentTimes }
            } = yield select(({ workspace, editor, timeLine }) => ({
                workspace,
                editor,
                timeLine
            }));
            const currentTime = currentTimes[partyUuid] / 1000 || 0;
            let dataList = cloneDeep(oldDataList);
            if (limitInsert(dataList, CANVAS_TYPE.gif) === false) {
                return;
            }
            obj.videoWebmUrl = webmUrl;
            obj.videoMp4Url = mp4Url;
            if (!webmUrl) {
                // 如果没有uuid则需要先获取宽高
                const { data: imageData } = yield call(getImgInfoByQiNiu, realUrl);
                obj.resolutionW = imageData.width;
                obj.resolutionH = imageData.height;
            }
            const transverse = obj.resolutionW > obj.resolutionH; // 是否横竖
            let newCladDataList = null;
            if (!updateUUid) {
                newUuid = createUUID();
                let data = {
                    id: null,
                    uuid: newUuid,
                    layerName: getLayerName(dataList, CANVAS_TYPE.gif),
                    lock: false,
                    visibility: "visible",
                    templateId: id,
                    type: CANVAS_TYPE.gif, // 把视频系统的type转换成工作区的type （CANVAS_TYPE）
                    templateType: VIDEO_TYPE.gif, // 模板系统的type（模板类型）
                    previewUrl: compatibleVideo(obj),
                    loop: true,
                    opacity: 1,
                    backgroundColor: DEFAULT_ELE_BACKGROUND_COLOR,
                    resolutionH: obj.resolutionH || 1,
                    resolutionW: obj.resolutionW || 1,
                    aspectRatio: obj.resolutionH ? obj.resolutionW / obj.resolutionH : 1,
                    videoDuration: obj.duration || 5,
                    coverImg: url,
                    borderColor: "rgba(0,0,0,1)",
                    borderStyle: "unset",
                    borderWidth: 0,
                    renderSetting: {
                        ...createEleRenderSetting({
                            renderSetting: {
                                startTime: currentTime,
                                endTime: currentTime + 5
                            },
                            segmentPartyDuration: 5
                        }),
                        customDuration: true
                    }, // gif图默认时长是5,初始化就自定义
                    ...genNewResizeParams(
                        obj,
                        transverse,
                        getVideoZoom(transverse, CANVAS_TYPE.gif, obj.resolutionW, obj.resolutionH)
                    ) // 视频缩放规则
                };
                if (replaceCurrent) {
                    const { uuid, left, top, backgroundColor, opacity, lock } = dataList[
                        activeIndex
                    ];
                    newUuid = uuid;
                    data = {
                        ...data,
                        uuid,
                        left,
                        top,
                        backgroundColor,
                        opacity,
                        lock
                    };
                    dataList.splice(activeIndex, 1, data);
                } else {
                    // dataList = dataList.concat(data);
                    // 根据覆层位置插入元素
                    newCladDataList = insertElementFromClad(dataList, data);
                }
                yield put.resolve({
                    type: "save",
                    payload: {
                        uuid: partyUuid,
                        dataList: newCladDataList ? newCladDataList.dataList : dataList,
                        haveChange: true
                    }
                });
                if (!replaceCurrent) {
                    yield put.resolve({
                        type: "changeActive",
                        payload: {
                            index: newCladDataList
                                ? newCladDataList.activeIndex
                                : dataList.length - 1
                        }
                    });
                }
            }
            if (!success) return;
            if (![3, 4].includes(~~obj.status)) {
                genGifTimes += 1;
                if (genGifTimes > 200) {
                    genGifTimes = 0;
                    return false;
                }
                yield delay(500);
                const res = yield put.resolve({
                    type: "insertGif",
                    payload: {
                        url,
                        updateUUid: newUuid,
                        replaceCurrent
                    }
                });
                return res;
            }
            genGifTimes = 0;
            const { dataList: newDataList } = yield select(({ workspace }) => workspace);
            let gifIndex = null;
            const data = newDataList.find((v, i) => {
                if (v.uuid === newUuid) {
                    gifIndex = i;
                    return true;
                }
                return false;
            });
            if (!data) {
                return false;
            }
            // 如果是0 则降级成图片 或者转换失败 或者没有视频地址
            let newData = {};
            if (!obj.duration || obj.status === 3 || !webmUrl) {
                waitModal({
                    title: "GIF图插入失败，已转化为静态图片",
                    info: "GIF缺少相关参数，为了能顺利生成视频，已将GIF为您转为静态图片"
                });
                const staticUrl = `${url}?imageMogr2/format/png`;
                newData = {
                    ...data,
                    type: CANVAS_TYPE.img,
                    renderSetting: createEleRenderSetting({
                        segmentPartyDuration: parties[nowIndex].renderSetting.segmentPartyDuration
                    }),
                    resolutionH: obj.resolutionH,
                    resolutionW: obj.resolutionW,
                    aspectRatio: obj.resolutionH ? obj.resolutionW / obj.resolutionH : 1,
                    videoDuration: obj.duration,
                    url: staticUrl,
                    oriUrl: staticUrl
                };
            } else {
                newData = {
                    ...data,
                    previewUrl: compatibleVideo(obj),
                    resolutionH: obj.resolutionH,
                    resolutionW: obj.resolutionW,
                    aspectRatio: obj.resolutionH ? obj.resolutionW / obj.resolutionH : 1,
                    videoDuration: obj.duration,
                    coverImg: url
                };
            }
            // @ts-ignore
            newDataList[gifIndex] = newData;
            yield put.resolve({
                type: "save",
                payload: {
                    uuid: partyUuid,
                    dataList: newDataList,
                    haveChange: true
                }
            });
            yield put.resolve({
                type: "partyChange",
                payload: { uuid: [newUuid] }
            });
            // 调整时长
            yield put.resolve({
                type: "editor/reloadVideoDuration",
                payload: { uuid: partyUuid }
            });
            yield put.resolve({
                type: "editor/overLoading"
            });
            return true;
        },
        *insertVideo({ payload: { type, id, title = null, lock = false } }, { put, select, call }) {
            let obj = null;
            let isUser = false;
            const {
                workspace: { dataList: oldDataList, uuid: partyUuid },
                editor: { transverse },
                timeLine: { currentTimes, maxTime }
            } = yield select(({ workspace, editor, timeLine }) => ({
                workspace,
                editor,
                timeLine
            }));
            const currentTime = currentTimes[partyUuid] / 1000 || 0;
            const dataList = cloneDeep(oldDataList);
            if (type === CANVAS_TYPE.dynamicBg) {
                dataList[0].backgroundImg = "";
                dataList[0].backgroundColor = "#ffffff";
            }
            // 如果是普通视频则不管
            if (limitInsert(dataList, type) === false) {
                return;
            }
            yield put.resolve({
                type: "editor/startLoading"
            });
            switch (~~type) {
                case CANVAS_TYPE.templateVideo:
                case CANVAS_TYPE.specialText:
                case CANVAS_TYPE.spacialImg:
                case CANVAS_TYPE.clad:
                case CANVAS_TYPE.dynamicBg:
                case CANVAS_TYPE.realShoot:
                case CANVAS_TYPE.ornament: {
                    const response = yield call(getAllSegment, id);
                    if (response.data && response.data.success) {
                        [obj] = response.data.obj.segments;
                    }
                    // 如果是正版视频 在创建renderSetting之前去掉renderSetting
                    if (obj.renderSetting) {
                        delete obj.renderSetting;
                    }
                    break;
                }
                case CANVAS_TYPE.userVideo:
                    {
                        isUser = true;
                        const response1 = yield call(userTemplateId, id);
                        if (response1.data && response1.data.success) {
                            ({ obj } = response1.data);
                        }
                    }
                    break;
                default:
                    break;
            }
            if (obj === null) {
                yield put.resolve({
                    type: "editor/overLoading"
                });
                return false;
            }
            const canvasType = ~~type;
            const templateType = obj.type || 0;
            const uuid = createUUID();
            let endTime = currentTime + obj.videoDuration;
            if (endTime > maxTime) {
                antdMessage.info(`最大只支持${maxTime}秒的视频，最大时长已经被缩减。`);
                endTime = maxTime;
            }
            let videoData = {
                id: null,
                uuid,
                layerName: getLayerName(dataList, canvasType),
                lock,
                templateId: id,
                title,
                pointerEvents: lock ? "none" : undefined,
                type: canvasType, // 把视频系统的type转换成工作区的type （CANVAS_TYPE）
                templateType, // 模板系统的type（模板类型）
                // previewUrl: isUser ? obj.transcodeUrl || obj.templateUrl : compatibleVideo(obj),  // templateUrl:mov; transcodeUrl:mp4 ;webmUrl:webm
                previewUrl: isUser ? compatibleVideoWebm(obj) : compatibleVideo(obj),
                videoMp4Url: obj.transcodeUrl || null,
                videoWebmUrl: obj.webmUrl || null,
                oriPreviewUrl: obj.templateUrl || null,
                muted: !haveSound(canvasType, templateType), // 用户视频则有声音否则静音
                resolutionH: obj.resolutionH,
                resolutionW: obj.resolutionW,
                aspectRatio: obj.resolutionW / obj.resolutionH,
                videoDuration: obj.videoDuration,
                coverImg: obj.coverImg,
                loop: [CANVAS_TYPE.dynamicBg, CANVAS_TYPE.clad, CANVAS_TYPE.gif].includes(
                    canvasType
                ),
                ...genNewResizeParams(
                    obj,
                    transverse,
                    getVideoZoom(transverse, type, obj.resolutionW, obj.resolutionH)
                ), // 视频缩放规则
                materialList: genMaterialList(obj, true),
                borderColor: "rgba(0,0,0,1)",
                borderStyle: "unset",
                borderWidth: 0,
                renderSetting: createEleRenderSetting({
                    ...obj,
                    renderSetting: {
                        startTime: isSetTimerEle({ type }) ? currentTime : 0,
                        endTime
                    }
                })
            };
            // 如果插入的是覆层
            if (~~type === CANVAS_TYPE.clad) {
                // 默认置顶
                videoData.positionTop = true;
            }

            if (canvasType === CANVAS_TYPE.dynamicBg) {
                // 如果插入的是动态背景
                // 查找是否有动态背景
                let dynamicBgIndex = 1;
                let deleteCount = 0;
                dataList.forEach((item, index) => {
                    if (item.type === canvasType) {
                        dynamicBgIndex = index;
                        deleteCount = 1;
                    }
                });
                dataList.splice(dynamicBgIndex, deleteCount, videoData);
                yield put.resolve({
                    type: "save",
                    payload: {
                        uuid: partyUuid,
                        dataList,
                        haveChange: true
                    }
                });
            } else {
                // dataList.push(videoData);
                // 根据覆层位置插入元素
                let newCladDataList = insertElementFromClad(dataList, videoData);
                // 如果插入的是覆层 在所有图片之上
                if (~~type === CANVAS_TYPE.clad) {
                    dataList.push(videoData);
                    newCladDataList = {
                        dataList,
                        activeIndex: dataList.length - 1
                    };
                }

                yield put.resolve({
                    type: "save",
                    payload: {
                        uuid: partyUuid,
                        dataList: newCladDataList.dataList,
                        haveChange: true
                    }
                });
                yield put.resolve({
                    type: "changeActive",
                    payload: { index: newCladDataList.activeIndex }
                });
            }

            yield put.resolve({
                type: "partyChange",
                payload: { uuid: [uuid] }
            });
            // 调整时长
            yield put.resolve({
                type: "editor/reloadVideoDuration",
                payload: { uuid: partyUuid }
            });
            yield put.resolve({
                type: "editor/overLoading"
            });
        },
        /**
         * 插入营销组件
         * @param type
         * @param select
         * @param put
         * @returns {Generator<*, void, ?>}
         */ *insertUserMarket({ payload: { type } }, { select, put }) {
            const {
                editor: { transverse, parties },
                workspace: { uuid, dataList }
            } = yield select(({ editor, workspace }) => ({
                editor,
                workspace
            }));
            // 超限判断
            if (userMarketLimit() === false) return false;
            const size = {
                width: 200, //number
                height: 200 //number
            };
            const position = {
                left:
                    (transverse ? WORKSPACE_SIZE.l - size.width : WORKSPACE_SIZE.s - size.width) /
                    2,
                top:
                    (transverse ? WORKSPACE_SIZE.s - size.height : WORKSPACE_SIZE.l - size.height) /
                    1.2
            };
            const commonParams = {
                id: null, //int 后端Id,
                componentType: type, // int emun 1,2,3 电话，微信，链接
                type: CANVAS_TYPE.userMarket, //canvas_type
                partyUUID: uuid,
                uuid: createUUID(),
                timeType: 2, //时间类型,
                content: "", // string 链接||电话.
                coverImg: "", // 图片地址,切换回文本的时候则删除,
                title: "", // 文本名称，
                color: "#fff", // 文本颜色，
                backgroundColor: "#1593FF", //背景颜色，
                opacity: 100, // 不透明度
                fontSize: 14,
                rotate: 0,
                animate: {},
                layerName: USER_MARKET_NAME[type],
                positionTop: true,
                ...size,
                ...position
            };
            const isShower = isShowker();
            const infoList = {
                [MARKET_TYPE.phone]: {
                    content: isShower ? "010-56592226" : "",
                    title: "拨打电话"
                },
                [MARKET_TYPE.wechat]: {
                    content: isShower
                        ? "https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=MzU5NTY5Njg5Ng==&scene=124#wechat_redirect"
                        : "",
                    title: "关注公众号"
                },
                [MARKET_TYPE.link]: {
                    content: isShower ? "https://www.eqxiu.com/video/introduce" : "",
                    title: "跳转链接"
                }
            };

            const { fontStyle, background, styleType, defaultSize } = yield getUserMarketStyle(
                type,
                1
            );
            const moreInfo = {
                ...infoList[MARKET_TYPE.link],
                ...(infoList[type] || {}),
                ...fontStyle,
                background,
                styleType,
                ...defaultSize
            };
            sendBDEvent({
                position: "营销组件-插入",
                type: moreInfo.title
            });
            if (type === MARKET_TYPE.wechat) {
                canSaveWaiteModel({ title: "该组件只能在微信内分享视频时才会展示" });
            }
            if (!moreInfo) return false;
            const newDataList = dataList.concat({
                ...commonParams,
                ...moreInfo
            });
            yield put.resolve({
                type: "save",
                payload: {
                    dataList: newDataList,
                    uuid
                }
            });
            yield put.resolve({
                type: "changeActive",
                payload: { index: newDataList.length - 1 }
            });
        },
        /**
         * 修改覆层置顶
         * @param uuid 置顶元素uuid
         * @param positionTop 是否置顶
         */ *changeClad({ payload: { uuid, positionTop } }, { put, select, call }) {
            const {
                workspace: { dataList }
            } = yield select(({ workspace }) => ({ workspace }));
            let newDataList = dataList.map((item, idx) => {
                if (item.uuid === uuid) {
                    return {
                        ...item,
                        positionTop
                    };
                }
                return item;
            });
            // 待置顶/取消置顶元素
            const insertData = newDataList.filter(v => v.uuid === uuid) || [];
            // 当前覆层位置
            const updataIndex = newDataList.findIndex(v => v.uuid === uuid);
            if (positionTop) {
                // 非置顶->置顶
                // 插入元素到最顶层
                newDataList = arrayMove(newDataList, updataIndex, newDataList.length - 1);
            } else {
                // 置顶->取消置顶
                let insertIndexs = [];
                newDataList.forEach((list, index) => {
                    if (list.positionTop && list.positionTop == true) {
                        insertIndexs.push(index);
                    }
                });
                // 待插入位置
                let inserIndex = newDataList.length - insertIndexs.length - 1;
                newDataList = arrayMove(newDataList, updataIndex, inserIndex);
            }

            yield put.resolve({
                type: "save",
                payload: {
                    dataList: newDataList
                }
            });

            yield put.resolve({
                type: "changeActive",
                payload: { index: newDataList.findIndex(v => v.uuid === uuid) }
            });
        },

        /**
         * 修改视频
         * @param type
         * @param id
         * @param uuid
         * @param put
         * @param select
         * @param call
         * @return {IterableIterator<*>}
         */ *changeVideo({ payload: { type, id, uuid } }, { put, select, call }) {
            let getDetails = null;
            switch (type) {
                case 1:
                    getDetails = getAllSegment;
                    break;
                default:
                    getDetails = userTemplateId;
                    break;
            }
            const {
                editor: { transverse },
                workspace: { dataList, uuid: partyUUID }
            } = yield select(({ editor, workspace }) => ({
                editor,
                workspace
            }));
            const data = dataList.find(v => v.uuid === uuid);
            if (!data) return;
            const res = yield call(getDetails, id);
            if (res.data && res.data.success) {
                let { obj } = res.data;
                const isTemplate = type === LAYER_TYPE.templateVideo;
                if (isTemplate) obj = obj.segments[0];
                const newParty = {
                    id: null, // 更换视频ID至空
                    cutId: null,
                    type: isTemplate ? CANVAS_TYPE.templateVideo : CANVAS_TYPE.userVideo,
                    previewUrl: isTemplate ? compatibleVideo(obj) : compatibleVideoWebm(obj),
                    resolutionH: obj.resolutionH,
                    resolutionW: obj.resolutionW,
                    aspectRatio: obj.resolutionW / obj.resolutionH,
                    videoDuration: obj.videoDuration,
                    segmentPartyDuration: obj.videoDuration,
                    coverImg: obj.coverImg,
                    segmentId: obj.id,
                    playSpeed: 1,
                    muted: !(type !== LAYER_TYPE.userVideo || type !== LAYER_TYPE.userVideoNew), // 用户视频则有声音否则静音
                    templateId: id,
                    materialList: genMaterialList(obj, true),
                    videoWebmUrl: obj.videoWebmUrl || null,
                    videoMp4Url: obj.videoMp4Url || null,
                    oriPreviewUrl: compatibleVideo(obj) || null,
                    ...genNewResizeParams(obj, transverse),
                    left: data.left,
                    top: data.top,
                    renderSetting: createEleRenderSetting(obj)
                };
                yield put.resolve({
                    type: "changeNow",
                    payload: newParty
                });
                yield put.resolve({
                    type: "editor/reloadVideoDuration",
                    payload: { uuid: partyUUID }
                });
                eventEmitter.emit("activeType", newParty.type);
            }
        },
        /**
         * 插入特效字
         * @param id
         * @param put
         * @param select
         * @param call
         * @returns {IterableIterator<*>}
         */ *insertSpacialText({ payload: { id } }, { put, select, call }) {
            const {
                workspace: { dataList: oldDataList, uuid: partyUuid },
                editor: { transverse },
                timeLine: { currentTiems }
            } = yield select(({ workspace, editor, timeLine }) => ({
                workspace,
                editor,
                timeLine
            }));
            const currentTime = currentTiems[partyUuid] / 1000 || 0;
            yield put.resolve({
                type: "editor/startLoading"
            });
            const { data: { success = false, obj = null } = {} } = yield call(getAllSegment, id);
            if (!(success && obj)) {
                yield put.resolve({
                    type: "editor/overLoading"
                });
                return false;
            }
            let dataList = cloneDeep(oldDataList);
            const uuid = createUUID();
            const insertData = {
                id: null,
                uuid,
                layerName: getLayerName(dataList, CANVAS_TYPE.specialText),
                lock: false,
                templateId: id,
                type: CANVAS_TYPE.specialText,
                previewUrl: compatibleVideo(obj),
                muted: false, // 用户视频则有声音否则静音
                resolutionH: obj.resolutionH,
                resolutionW: obj.resolutionW,
                aspectRatio: obj.resolutionW / obj.resolutionH,
                videoDuration: obj.videoDuration,
                coverImg: obj.coverImg,
                ...genNewResizeParams(obj, transverse),
                materialList: genMaterialList(obj, true),
                borderColor: "rgba(0,0,0,1)",
                borderStyle: "unset",
                borderWidth: 0,
                renderSetting: {
                    ...createEleRenderSetting({
                        renderSetting: {
                            startTime: currentTime,
                            endTime: currentTime + obj.videoDuration
                        }
                    })
                }
            };

            // 根据覆层位置插入元素
            const newCladDataList = insertElementFromClad(dataList, insertData);

            yield put.resolve({
                type: "save",
                payload: {
                    uuid: partyUuid,
                    dataList: newCladDataList.dataList,
                    haveChange: true
                }
            });
            yield put.resolve({
                type: "partyChange",
                payload: { uuid: [uuid] }
            });
            yield put.resolve({
                type: "changeActive",
                payload: { index: newCladDataList.activeIndex }
            });
            // 调整时长
            yield put.resolve({
                type: "editor/reloadVideoDuration",
                payload: { uuid: partyUuid }
            });
            yield put.resolve({
                type: "editor/overLoading"
            });
        },
        /**
         * 清除覆层
         * @param uuid
         * @param put
         * @param select
         * @returns {IterableIterator<*>}
         */ *clearClad({ payload: uuid }, { put, select }) {
            const { dataList, uuid: partyUuid } = yield select(({ workspace }) => workspace);
            let newDataList = dataList;
            const uuidList = [];
            if (uuid) {
                uuidList.push(uuid);
                newDataList = dataList.filter(i => i.uuid !== uuid);
            } else {
                newDataList = dataList.filter(i => {
                    if (i.type === CANVAS_TYPE.clad) {
                        uuidList.push(i.uuid);
                    }
                    return i.type !== CANVAS_TYPE.clad;
                });
            }
            eventEmitter.emit("activeType", 0);
            yield put.resolve({
                type: "save",
                payload: {
                    uuid: partyUuid,
                    dataList: newDataList,
                    activeIndex: null, // 激活index
                    activeIndexes: [], // 激活index
                    haveChange: true
                }
            });
            yield put.resolve({
                type: "editor/reloadVideoDuration",
                payload: { uuid: partyUuid }
            });
            yield put.resolve({
                type: "partyChange",
                payload: { uuid: [] }
            });
            yield put.resolve({
                type: "canvas/deleteCanvas",
                payload: { uuidList }
            });
        },
        /**
         * 获取操作历史
         * */ *changeHistory({ back }, { put, select }) {
            const { dataList, history, uuid: partyUUID } = yield select(
                ({ workspace }) => workspace
            );
            let newDataList = [];
            let newGroupList = [];
            if (back) {
                ({ dataList: newDataList = [], groupList: newGroupList = [] } = history.back());
            } else {
                ({ dataList: newDataList = [], groupList: newGroupList = [] } = history.forward());
            }
            // 比较发生改变的值
            const changedIndexes = [];
            (newDataList || []).forEach(item => {
                const { uuid } = item;
                const find = dataList.find(data => data.uuid === uuid);
                // 没找到或者和现在的数据不相等，表明数据发生了改变，需要重新绘制
                // if (!find || !isEqualWith(item, find, (source, target) => isEqualBy(source, target, ELEMENT_PARAMS))) {
                if (!find || !isEqualWith(item, find)) {
                    changedIndexes.push(uuid);
                }
            });
            yield put.resolve({
                type: "saveHistory",
                payload: {
                    activeIndexes: [],
                    activeIndex: null,
                    history
                }
            });
            //撤销后默认不激活所有组 修复撤销bug
            newGroupList.forEach(v => (v.active = false));

            yield put.resolve({
                type: "editor/changePartyByUuid",
                payload: {
                    uuid: partyUUID,
                    elementList: newDataList,
                    groupList: newGroupList
                }
            });
            yield put.resolve({
                type: "partyChange",
                payload: {
                    uuid: changedIndexes,
                    delay: true
                }
            });
            eventEmitter.emit("activeType", null);

            // 调整时长
            yield put.resolve({
                type: "editor/reloadVideoDuration",
                payload: { uuid: partyUUID }
            });
        },

        // 获取已购买的字体
        *getMyFonts(action, { put, select, call }) {
            console.log('字体');
            const { myFonts, uuid } = yield select(({ workspace }) => workspace);
            if (myFonts.length > 3) {
                return;
            }
            const { data } = yield call(getMyFont);
            if (data.success) {
                const { list } = data;
                const urls = [];
                for (let i = 0; i < list.length; i += 1) {
                    // eslint-disable-next-line object-curly-newline
                    const {
                        // eslint-disable-next-line camelcase
                        font_family,
                        name,
                        woff_path,
                        authedttf_path
                    } = list[i];
                    // eslint-disable-next-line camelcase
                    const path = `store/fonts/${font_family}.woff?text=${name}`;
                    urls.push(`${host.font}${path}`);
                    addGlobalStyle(font_family, path);
                    // eslint-disable-next-line camelcase
                    const { length } = myFonts.filter(item => item.fontFamily === font_family);
                    if (length < 1) {
                        myFonts.push({
                            fontFamily: font_family,
                            woffPath: woff_path,
                            ttfPath: authedttf_path,
                            name
                        });
                    }
                }
                // 发送请求
                getAllFontBlob(urls);
            }
            yield put.resolve({
                type: "save",
                payload: {
                    uuid,
                    myFonts
                }
            });
        },

        // 复制当前的素材
        *copyData(action, { put, select }) {
            const copyData = [];
            pasteTimes = 1;
            const { dataList, activeIndexes, uuid, groupList, activeGroupIndex } = yield select(
                ({ workspace }) => workspace
            );
            let copyGroup = [];
            let newActiveIndexes = activeIndexes;
            //复制组合
            if (activeGroupIndex) {
                const cloneGroupList = cloneDeep(groupList);
                let activeElems = [];
                cloneGroupList.forEach(list => {
                    if (list.uuid === activeGroupIndex) {
                        list.uuid = null;
                        copyGroup = copyGroup.concat(list);
                        activeElems = activeElems.concat(list.activeElems);
                    }
                });
                //取出当前复制组内元素在dataList的位置
                newActiveIndexes = [];
                dataList.forEach((list, idx) => {
                    if (activeElems.map(v => v.uuid).includes(list.uuid)) {
                        newActiveIndexes.push(idx);
                    }
                });
            }
            //复制元素
            for (let i = 0; i < newActiveIndexes.length; i += 1) {
                const copyObj = dataList[newActiveIndexes[i]];
                copyObj.id = null;
                copyData.push(copyObj);
            }

            yield put.resolve({
                type: "save",
                payload: {
                    uuid,
                    copyData: {
                        dataList: copyData,
                        groupList: copyGroup
                    }
                }
            });
        },
        // 粘贴当前的素材
        *pasteData(action, { put, select }) {
            const { dataList, copyData, uuid: partyUUID, activeGroupIndex } = yield select(
                ({ workspace }) => workspace
            );
            const { dataList: copyDataList, groupList: copyGroupList } = copyData;
            if (!copyDataList || (copyDataList.length < 1 && copyGroupList.length < 1)) {
                return;
            }
            const uuids = [];
            const newActiveIndexes = [];
            const newDataList = [];
            for (let i = 0; i < copyDataList.length; i += 1) {
                let cloneData = cloneDeep(copyDataList[i]);

                const uuid = createUUID();
                uuids.push(uuid);
                cloneData.top += pasteTimes * 10;
                cloneData.left += pasteTimes * 10;
                cloneData.layerName = `${cloneData.layerName}拷贝${
                    pasteTimes > 1 ? pasteTimes : ""
                }`;
                cloneData.lock = false;
                cloneData.uuid = uuid;
                cloneData.id = null;
                if (Array.isArray(cloneData.materialList)) {
                    cloneData.materialList = cloneData.materialList.map(v => ({
                        ...v,
                        id: null
                    }));
                }
                newActiveIndexes.push(dataList.length + newDataList.length);
                newDataList.push(cloneData);
            }
            let checkedArray = [];
            let userMarketCount = 0;
            for (const item of newDataList) {
                if (item.type === CANVAS_TYPE.userMarket) {
                    userMarketCount += 1;
                } else if (limitInsert([...dataList, ...checkedArray], item.type) === false) {
                    return;
                }
                checkedArray.push(item);
            }
            if (userMarketLimit(userMarketCount) === false) return false;
            // 根据覆层位置插入元素
            const finalDataList = insertElementFromClad(dataList, newDataList);
            yield put.resolve({
                type: "save",
                payload: {
                    uuid: partyUUID,
                    dataList: finalDataList.dataList,
                    haveChange: true,
                    // activeIndex: newActiveIndexes[0],
                    activeIndex: finalDataList.activeIndex,
                    // activeIndexes: newActiveIndexes,
                    activeIndexes: finalDataList.activeIndexs
                }
            });

            if (copyGroupList.length > 0) {
                const groupActiveElems = copyGroupList.find(group => group.activeElems).activeElems;
                // 粘贴组
                yield put.resolve({
                    type: "pasteGroupData",
                    payload: {
                        groupActiveElems,
                        newDataList //新生成的元素
                    }
                });
            }
            // 调整时长
            yield put.resolve({
                type: "editor/reloadVideoDuration",
                payload: { uuid: partyUUID }
            });
            pasteTimes += 1;
            return "粘贴完成";
        },
        // 粘贴当前复制组
        *pasteGroupData({ payload: { groupActiveElems, newDataList } }, { put, select }) {
            const {
                workspace: { dataList, groupList, uuid: partyUUID, copyData },
                editor: { positionScale }
            } = yield select(({ workspace, editor }) => ({
                workspace,
                editor
            }));

            const { groupList: copyGroupList } = copyData;
            const eleUuis = groupActiveElems.map(g => g.uuid);
            let activeIndexes = [];
            let activeElems = newDataList;
            // 取出复制组合在dataList下的位置
            dataList.forEach((list, index) => {
                if (eleUuis.includes(list.uuid)) {
                    activeIndexes.push(index);
                }
            });

            const uuid = `GROUP__${createUUID()}`;
            // 组合层级
            const zIndex = WORKSPACE_Z_INDEX + groupList.length + 1;
            const { top, left, name } = copyGroupList[0];
            const group = {
                ...copyGroupList[0],
                name: `${name}拷贝${pasteTimes > 1 ? pasteTimes : ""}`,
                uuid,
                activeElems: activeElems.filter(v => (v.groupUuid = uuid)),
                active: true,
                top: top + pasteTimes * 10,
                left: left + pasteTimes * 10,
                zIndex
            };

            yield put.resolve({
                type: "save",
                payload: {
                    uuid: partyUUID,
                    haveChange: true,
                    activeIndex: null,
                    activeIndexes,
                    groupList: [...groupList, { ...group }],
                    activeGroupIndex: uuid //拷贝后激活当前组
                }
            });
        },
        // 打开或者关闭图层管理
        *layerMgr(action, { put, select }) {
            const {
                workspace: { layerMgr, uuid }
            } = yield select(({ workspace }) => ({ workspace }));
            yield put.resolve({
                type: "save",
                payload: {
                    uuid,
                    layerMgr: !layerMgr
                }
            });
        },
        // 片段改变时重新转换成canvas
        *partyChange(
            { payload: { uuid: layerUUIDArr = [], isMove = false, saveDelay = false } = {} },
            { put, select }
        ) {
            const { dataList, uuid } = yield select(({ workspace }) => workspace);
            yield put.resolve({
                type: "canvas/drawParties",
                payload: {
                    uuidArr: isMove ? [] : layerUUIDArr,
                    dataList,
                    uuid,
                    saveDelay
                }
            });
        },

        *drawNow(action, { put, select }) {
            const { dataList, uuid } = yield select(({ workspace }) => workspace);
            yield put.resolve({
                type: "canvas/drawParties",
                payload: {
                    dataList,
                    uuid
                }
            });
        },

        // 下载选择的字体
        *downloadFont({ payload }, { call }) {
            yield call(getAllFontBlob, [payload]);
        },

        *save({ payload }, { put, select }) {
            let { dataList, uuid, groupList, ...oldPayload } = payload;
            const { haveChange, uuid: partyUUid } = yield select(({ workspace }) => workspace);
            uuid = uuid || partyUUid;
            if (dataList || groupList) {
                const newPayload = {
                    uuid,
                    saveCue: haveChange
                };
                if (dataList) newPayload.elementList = dataList;
                if (groupList) newPayload.groupList = groupList;
                yield put.resolve({
                    type: "editor/changePartyByUuid",
                    payload: newPayload
                });
                /**
                 * 如果dataList改变则更新历史记录
                 * */
                if (dataList && dataList.length > 0) {
                    const { history: editorHistory } = yield select(({ workspace }) => workspace);
                    editorHistory.data = {
                        dataList,
                        groupList
                    };
                    editorHistory.add();
                    // eslint-disable-next-line no-param-reassign
                    payload.history = editorHistory;
                }
            }
            if (Object.keys(oldPayload).length) {
                yield put({
                    type: "saveCommon",
                    payload
                });
            }
        },
        /**
         * 新增组合元素
         * @param activeElems 被组合元素
         */ *addElemGroup({ payload: {} }, { put, select }) {
            const {
                workspace: { groupList = [], dataList, activeIndexes },
                editor: { positionScale }
            } = yield select(({ workspace, editor }) => ({
                workspace,
                editor
            }));

            //待组合元素
            let activeElems = [];

            const elements = activeIndexes
                .map(idx => {
                    const { uuid, rotate } = dataList[idx];
                    activeElems.push({
                        ...dataList[idx]
                    });
                    const dom = document.querySelector(`#workspace #elements_${uuid}`);
                    return (dom && dom.getBoundingClientRect()) || false;
                })
                .filter(v => v);
            const bodyRect = document.getElementById("workspace").getBoundingClientRect();
            const { max, min } = Math;
            const scale = positionScale;
            const size = {
                width:
                    max(...elements.map(v => v.right)) / scale -
                    min(...elements.map(v => v.left)) / scale,
                height:
                    max(...elements.map(v => v.bottom)) / scale -
                    min(...elements.map(v => v.top)) / scale,
                left: min(...elements.map(v => v.left)) / scale,
                top: min(...elements.map(v => v.top)) / scale
            };

            const minTop = size.top - bodyRect.top / scale;
            const minLeft = size.left - bodyRect.left / scale;
            const { height, width } = size;

            const uuid = `GROUP__${createUUID()}`;
            // 组合层级
            const zIndex = WORKSPACE_Z_INDEX + groupList.length + 1;
            const group = {
                uuid,
                name: `组合${groupList.length + 1}`,
                activeElems: activeElems.filter(v => (v.groupUuid = uuid)),
                active: false,
                width,
                height,
                rotate: 0,
                top: minTop || 0,
                left: minLeft || 0,
                zIndex
            };
            const newDataList = dataList.map((item, index) => {
                if (activeIndexes.includes(index)) {
                    return {
                        ...item,
                        groupUuid: uuid
                    };
                }
                return item;
            });

            // 更新组数据并取消单个元素选择
            yield put.resolve({
                type: "save",
                payload: {
                    activeIndex: null,
                    activeIndexes: [],
                    groupList: [...groupList, { ...group }],
                    dataList: newDataList
                }
            });
            yield put.resolve({
                type: "activeElemGroup",
                payload: {
                    activeGroupIndex: uuid
                }
            });
        },
        /**
         *  取消当前组合
         */ *cancelElemGroup({ payload: { groupUuid } }, { put, select }) {
            const { groupList, dataList } = yield select(({ workspace }) => workspace);
            let gList = [...groupList];
            let dList = [...dataList];
            let uuids = [];

            gList.forEach((g, idx, arr) => {
                if (g.uuid === groupUuid) {
                    //获取uuid集合
                    uuids = g.activeElems;
                    arr.splice(idx, 1);
                }
            });

            dList.forEach(d => {
                uuids.forEach(u => {
                    if (d.uuid === u.uuid) {
                        // d.groupStatus = false;
                        d.groupUuid = null;
                    }
                });
            });

            yield put.resolve({
                type: "save",
                payload: {
                    groupList: gList,
                    dataList: dList,
                    activeGroupIndex: null
                }
            });
        },
        /**
         * 改变组合元素位置
         */ *changeGroupStyles(
            {
                payload: {
                    top = 0,
                    left = 0,
                    width = 100,
                    height = 100,
                    rotate = 0,
                    isRotate = false,
                    isScale = false,
                    ...payload
                }
            },
            { put, select }
        ) {
            const { groupList, dataList, uuid } = yield select(({ workspace }) => workspace);

            let group = {};
            let groupIndex = null;
            // 获取需要更改的
            groupList.find((item, index) => {
                if (item.uuid === payload.uuid) {
                    groupIndex = index;
                    group = { ...item };
                    return true;
                }
            });
            if (groupIndex === null) return;
            //当前组合内元素
            let changeTop = 0;
            let changeLeft = 0;
            //当前组合盒子样式
            const scale = width / group.width || 1;

            if (isScale) {
                group.width *= scale;
                group.height *= scale;
            }

            changeLeft = left - group.left;
            changeTop = top - group.top;
            group.top = top;
            group.left = left;
            if (isRotate) {
                group.rotate = rotate;
            }
            const childrenUUIDs = group.activeElems.map(v => v.uuid);

            const newDataList = dataList.map(item => {
                const innerIndex = childrenUUIDs.indexOf(item.uuid);
                if (innerIndex !== -1) {
                    const newState = { ...item };
                    const oldItem = group.activeElems[innerIndex];
                    // 组合旋转
                    if (isRotate) {
                        // 旋转中心
                        const centerPoint = {
                            x: group.left + group.width / 2 - oldItem.width / 2,
                            y: group.top + group.height / 2 - oldItem.height / 2
                        };
                        // 原始坐标点
                        const originPoint = {
                            x: oldItem.left,
                            y: oldItem.top
                        };
                        // 弧度计算
                        const angle = (rotate * Math.PI) / 180;
                        // 旋转半径
                        const xR = originPoint.x - centerPoint.x;
                        const yR = originPoint.y - centerPoint.y;
                        // 旋转后子元素left top位置
                        const newLeft = xR * Math.cos(angle) - yR * Math.sin(angle) + centerPoint.x;
                        const newTop = xR * Math.sin(angle) + yR * Math.cos(angle) + centerPoint.y;

                        newState.top = newTop;
                        newState.left = newLeft;
                        // 加上元素初始旋转角度
                        newState.rotate = (rotate + oldItem.rotate) % 360;
                    } else {
                        newState.top += changeTop;
                        newState.left += changeLeft;
                        if (isScale) {
                            newState.width *= scale;
                            newState.height *= scale;
                            newState.fontSize && (newState.fontSize *= scale);
                        }
                        group.activeElems = group.activeElems.map((item, index) => {
                            if (index === innerIndex) {
                                return {
                                    ...item,
                                    width: newState.width,
                                    height: newState.height,
                                    top: newState.top,
                                    left: newState.left
                                };
                            }
                            return item;
                        });
                        // group.activeElems[innerIndex] = {
                        //     ...oldItem,
                        //     width: newState.width,
                        //     height: newState.height,
                        //     top: newState.top,
                        //     left: newState.left,
                        // };
                    }

                    return newState;
                } else {
                    return { ...item };
                }
            });
            const newGroupList = [...groupList];
            newGroupList[groupIndex] = group;
            yield put.resolve({
                type: "save",
                payload: {
                    dataList: newDataList,
                    groupList: newGroupList,
                    uuid
                }
            });
        },
        /**
         * 激活当前组
         */ *activeElemGroup(
            { payload: { activeGroupIndex, clear = true, filter = true } },
            { put, select }
        ) {
            const { groupList, activeIndex, activeIndexes } = yield select(
                ({ workspace }) => workspace
            );
            let same = false;
            const gLists = groupList.map(list => {
                if (list.uuid === activeGroupIndex) {
                    same = list.active === true && !filter;
                    return {
                        ...list,
                        active: filter ? !list.active : true
                    };
                } else if (clear && list.active) {
                    return {
                        ...list,
                        active: false
                    };
                }
                return list;
            });
            //点击组内空白区不更新组激活
            if (same) return;
            const payload = {
                groupList: gLists,
                activeGroupIndex,
                activeIndex: clear ? null : activeIndex,
                activeIndexes: clear ? [] : activeIndexes
            };
            yield put({
                type: "save",
                payload
            });
        },
        /**
         * 设置多选元素对其方式
         */ *changeElemAlign({ payload: { type = null } }, { put, select }) {
            const { dataList, activeIndexes } = yield select(({ workspace }) => workspace);
            const arrAlign = [
                "top",
                "center",
                "bottom",
                "left",
                "middle",
                "right",
                "1",
                "-1",
                "999",
                "-999"
            ];
            const selectElems = [];
            // 取出框选中的元素
            let newDataList = dataList.map((elm, idx) => {
                if (activeIndexes.includes(idx)) {
                    selectElems.push({ ...elm });
                }
                return { ...elm };
            });
            const elementsPoint = selectElems.map(getRectPoint);

            // 顶部/左对齐 取最小值
            if ("top" === type || "left" === type) {
                // 基准线
                const baseValue = Math.min(...elementsPoint.map(v => v[type]));
                [...activeIndexes].sort().forEach((index, i) => {
                    const rect = elementsPoint[i];
                    const element = selectElems[i];
                    // 基准距离
                    const distence = rect[type] - element[type];
                    newDataList[index][type] = baseValue - distence;
                });
            }
            // 右对齐/底部对齐 已最大值宽度为基准设置最小值位置
            if ("right" === type || "bottom" === type) {
                let sizeType = "width";
                let baseType = "left";
                if (type === "bottom") {
                    baseType = "top";
                    sizeType = "height";
                }
                const baseValue = Math.max(...elementsPoint.map(v => v[baseType] + v[sizeType]));
                [...activeIndexes].sort().forEach((index, i) => {
                    const rect = elementsPoint[i];
                    const element = selectElems[i];
                    const distence = rect[type] - element[baseType];
                    newDataList[index][baseType] = baseValue - distence;
                });
            }
            // 左右居中/上下居中
            if ("middle" === type || "center" === type) {
                let baseType = "left";
                let otherType = "right";
                let lenProp = "width";
                if (type === "center") {
                    baseType = "top";
                    otherType = "bottom";
                    lenProp = "height";
                }
                // 最大元素位置中心点
                const minPoint = Math.min(...elementsPoint.map(v => v[baseType]));
                const maxPoint = Math.max(...elementsPoint.map(v => v[otherType]));
                // left -- baseVlue --- right
                const baseValue = (maxPoint - minPoint) / 2 + minPoint;
                // 当前最宽元素位置
                // 先对activeIndexes排序再循环 保证selectElems和activeIndexes比较的值一直
                [...activeIndexes].sort().forEach((index, i) => {
                    const rect = elementsPoint[i];
                    const element = selectElems[i];
                    // 需要加上一半占位框的长度
                    const distence = rect[baseType] - element[baseType] + rect[lenProp] / 2;
                    newDataList[index][baseType] = baseValue - distence;
                });
            }

            yield put({
                type: "save",
                payload: {
                    dataList: newDataList
                }
            });
        },
        /**
         * 改变多个uuid的元素的图层位置
         * @param UUIDs {Array|Null} 不传默认选择选中的 (不包括数组)
         * @param type {String} 方向
         * @param select
         * @param put
         */ *changeManyLayer({ payload: { UUIDs = null, type } }, { select, put }) {
            const types = ["top", "bottom", "up", "down"];
            if (!types.includes(type)) {
                throw new Error("移动方向有误");
            }
            const sortUUIDS = [];
            const {
                workspace: { dataList, activeIndex, activeIndexes }
            } = yield select(({ workspace }) => ({ workspace }));
            let caldPositionTop = false;
            let newIndex = 0;
            if (type === "top") {
                newIndex = dataList.length - 1;
            }
            // 多选
            if (Array.isArray(activeIndexes)) {
                if (type === "up") {
                    newIndex = Math.max(...activeIndexes) + 1;
                }
                if (type === "down") {
                    newIndex = Math.max(...activeIndexes) - 1;
                }
                for (let idx = 0; idx < activeIndexes.length; idx++) {
                    if (cladIsTop(dataList, activeIndexes[idx], newIndex)) {
                        caldPositionTop = true;
                        break;
                    }
                }
            }

            if (caldPositionTop) return;

            if (UUIDs) {
                dataList.forEach((item, oldIndex) => {
                    if (UUIDs.includes(item.uuid)) {
                        sortUUIDS.push({
                            item,
                            oldIndex
                        });
                    }
                });
            } else {
                dataList.forEach((item, oldIndex) => {
                    if (activeIndexes.includes(oldIndex)) {
                        sortUUIDS.push({
                            item,
                            oldIndex
                        });
                    }
                });
            }

            let newData = [];
            let newActiveIndexs = [];
            const insertELeSet = new Set();
            switch (type) {
                case "top":
                    // 首先翻转需要排序的 插入数组最开始
                    sortUUIDS.reverse().forEach(({ item }) => {
                        // 覆层置顶改变switch状态
                        if (item.type === CANVAS_TYPE.clad) {
                            item.positionTop = true;
                        }
                        newData.push(item);
                        insertELeSet.add(item.uuid);
                        newActiveIndexs.push(dataList.length - newActiveIndexs.length - 1);
                    });
                    // 然后翻转 dataList 插入剩下的
                    [...dataList].reverse().forEach(item => {
                        if (!insertELeSet.has(item.uuid)) {
                            newData.push(item);
                        }
                    });
                    // 最后整体翻转
                    newData.reverse();
                    break;
                case "bottom":
                    // 首先插入低层
                    newData.push(dataList[0]);
                    sortUUIDS.forEach(({ item }, index) => {
                        newData.push(item);
                        insertELeSet.add(item.uuid);
                        newActiveIndexs.push(index + 1);
                    });
                    // 然后翻转 dataList 插入剩下的
                    [...dataList].forEach((item, index) => {
                        if (index === 0) return;
                        if (!insertELeSet.has(item.uuid)) {
                            newData.push(item);
                        }
                    });
                    break;
                case "up":
                    newData = Array(dataList.length).fill(false);
                    sortUUIDS.reverse().forEach(({ item, oldIndex }) => {
                        const newIndex = Math.max(dataList.length - oldIndex - 2, 0);

                        // 递归插入 不符合则加1 再试
                        function loopInsert(i) {
                            if (!newData[i]) {
                                newData[i] = item;
                                insertELeSet.add(item.uuid);
                                newActiveIndexs.push(dataList.length - i - 1);
                                return;
                            } else {
                                loopInsert(i + 1);
                            }
                        }

                        loopInsert(newIndex);
                    });
                    [...dataList].reverse().forEach(item => {
                        if (!insertELeSet.has(item.uuid)) {
                            newData.find((value, i) => {
                                if (!value) {
                                    newData[i] = item;
                                    return true;
                                }
                                return false;
                            });
                        }
                    });
                    newData.reverse();
                    break;
                default:
                    newData = Array(dataList.length).fill(false);
                    newData[0] = dataList[0];

                    sortUUIDS.forEach(({ item, oldIndex }) => {
                        const newIndex = Math.max(oldIndex - 1, 1);

                        // 递归插入 不符合则加1 再试
                        function loopInsert(i) {
                            if (!newData[i]) {
                                newData[i] = item;
                                insertELeSet.add(item.uuid);
                                newActiveIndexs.push(i);
                                return;
                            } else {
                                loopInsert(i + 1);
                            }
                        }

                        loopInsert(newIndex);
                    });

                    [...dataList].forEach((item, index) => {
                        if (index === 0) return;
                        if (!insertELeSet.has(item.uuid)) {
                            newData.find((value, i) => {
                                if (!value) {
                                    newData[i] = item;
                                    return true;
                                }
                                return false;
                            });
                        }
                    });
            }
            yield put.resolve({
                type: "save",
                payload: {
                    activeIndex: newActiveIndexs[0],
                    dataList: newData,
                    activeIndexes: newActiveIndexs
                }
            });
        }
    },

    reducers: {
        saveCommon(state, { payload }) {
            return {
                ...state,
                ...payload
            };
        },
        saveHistory(state, { payload }) {
            return {
                ...state,
                ...payload
            };
        },
        changeVersionID(state, payload) {
            return {
                ...state,
                ...payload
            };
        }
    },
    subscriptions: {
        setup() {}
    }
};
