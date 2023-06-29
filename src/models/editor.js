/* eslint-disable no-console */
/* eslint-disable import/no-named-as-default-member */
/* eslint-disable indent */
import { routerRedux } from "dva/router";
import { message, Message } from "antd";
import EventEmitter from "events";
import { arrayMove } from "react-sortable-hoc";
import qs from "qs";
// eslint-disable-next-line import/no-extraneous-dependencies
import cloneDeep from "lodash/cloneDeep";
import templateShow from "../api/templateShow";
import userVideo from "../api/userVideo";
import { addFilePath, encodeMusic, decodeMusic } from "../util/file";
import { prev, version, host } from "../config/env";
import {
    CANVAS_TYPE,
    DEFAULT_FONT_FAMLIY,
    EDITOR_PRODUCT,
    HASH_TYPE,
    LAYER_TYPE,
    MAX_WORKS_DURATION,
    MIN_CONCAT_DURATION,
    NORMAL_RESOLUTION,
    SEGMENT_TYPE,
    WorkspaceVideoType,
    OPEN_FROM,
    HD_RESOLUTION,
    WORKSPACE_SIZE
} from "../config/staticParams";
import { getQiniuToken, uploadQiniuByBase64 } from "../api/upload";
import { delay } from "../util/delayLoad";
import { genBackground } from "../services/editorData";
import {
    createEleRenderSetting,
    createRenderSetting,
    createUUID,
    isSetTimerEle,
    getAnimationData,
    userMarketContentVerify,
    mapToBackendForUserMarket,
    mapPartyToBackend,
    getLayerName
} from "../util/data";
import { getAllFontBlob, getMyFont } from "../api/user";
import { addGlobalStyle } from "../util/doc";
import { getURLObj } from "../util/util";
import { findKey } from "../util/object";
import MainEditorDataProvider from "../dataProvider/mainEdtior";
import { getUserSetting, setUserSetting } from "../util/storageLocal";
import eventEmitter from "../services/EventListener";
import { sendBDEvent } from "../services/bigDataService";
import { getTemplateVideoDetail } from "../api/template";
import { USER_MARKET_LABEL, USER_MARKET_NAME } from "../config/staticParams/userMarket";
import { waitModal } from "../page/components/modal";
import { platformActions, sendPlatformPage } from "../util/platform";
import { round } from "../util/number";

const multipleH = 560 / NORMAL_RESOLUTION.hoz.x; // 横板倍数
const multipleV = 560 / NORMAL_RESOLUTION.ver.y; // 纵板倍数
let firstSave = false;

async function uploadQiniu(base64) {
    let res = await getQiniuToken();
    const { data } = res;
    if (data.success) {
        const token = data.obj;
        res = await uploadQiniuByBase64(base64, token);
        const {
            data: { key }
        } = res;
        return key;
    }
}

/**
 * parties字段说明
 * {
 *  coverImg:封面图,
 *  id:片段id,
 *  playSpeed:片段播放速度,
 *  renderSetting:{filter:滤镜 concatSet:{concatType:转场效果名,duration:转场时间（毫秒）}}, // 渲染服务器设置
 *  segmentId:片段组ID 弃用
 *  title:片段名
 *  videoDuration:片段时长（秒),
 *  elementList:[
 *      {
 *          backgroundColor:背景色,
 *          borderColor:边框颜色,
 *          borderStyle:边框样式,
 *          height:元素高度，
 *          width:元素宽度,
 *          layerName:元素名称，用于在图层管理里面显示
 *          opacity：元素透明度
 *          oriUrl：原始地址 用于二次裁剪回现
 *          rotate: 旋转角度 0-360
 *          top:离画布原点y轴位置，
 *          left:离画布原点X轴位置，
 *          type:在前端画布上的类型     background: 0, // 没有type则是背景
                                      text: 1, // 文字
                                      img: 2, // 图片
                                      templateVideo: 3, // 模板视频
                                      userVideo: 4, // 用户视频
                                      specialText: 201, // 特效字
                                      spacialImg: 202, // 特效图
                                      ornament: 203, // 装饰素材
                                      artFont: 1001, // 艺术字
                                      sticker: 1002, // 贴纸
           url: 图片资源地址,
           previewUrl: 视频的预览地址,
           coverImg: 视频的封面地址，
           videoDuration: 视频时长，
           aspectRatio: 比例,
           templateType: 模板系统的type
           templateId: 模板系统的ID，
           muted: 是否静音 // 目前仅针对用户视频，未静音的话不会播放视频设置中的背景音,
           color: 文字颜色，
           content：文本内容
           fontFamily：字体，
           fontSize：字号，
           fontStyle：自行，
           fontWeight： 字重
           letterSpacing：字距，
           lineHeight：行高
           textAlign：文本对齐方式，
           ...大都是css样式，
           lock: 元素是否锁定，
           materialList：[
                {
                    fileName：对应原名字
                    materialType：素材类型 1是文本 2是图像
                    replaceContent：替换后的内容
                    spec：图片大小信息，
                    videoTemplateMaterialId：素材ID
                }
           ] // 正版视频的可替换素材，的更换信息
 *      }
 *  ] // 元素列表
 * }
 */
export default {
    namespace: "editor",
    state: {
        parties: [], // 片段的基本数据
        oriParties: {}, // 原始数据，用于不重新生成；
        partiesVer: 0, // parties 版本号。子组件用来判断是否改变
        playSpeed: 1, // 播放速度
        nowIndex: null, // 目前激活的片段
        videoId: null, // 视频ID
        templateId: null, // 模板ID
        title: null, // 视频标题
        coverImg: null, // 封面图
        videoDescribe: null, // 视频描述
        previewUrl: null, // 全视频预览地址（暂时没用）
        videoDuration: 0, // 视频时长
        transverse: false, // 横版视频
        createTime: "2018-11-20 00:00:00",
        updateTime: "2018-11-20 00:00:00",
        music: {}, // 背景音乐对象
        voice: {}, // 旁白对象
        commonVer: 0, // 公共变量版本号
        isLoading: false, // 是否在读取中，可以为string，会在读取画面显示
        lockLoading: false, // 读取状态锁，保存的时候锁住，免得被其他东西关掉
        beforeInsertHook: null, // 插入前钩子;
        action: null, // 操作提示
        cancelAutoSave: false, // 取消自动保存
        firstSaving: false, // 正在进行初次保存
        saveVersion: 0, // 保存版本号
        positionScale: getUserSetting(`${false}_Scale`) || 1,
        systemTailLeaderOn: true, // 是否显示默认片尾
        product: EDITOR_PRODUCT.main, // 编辑器类型 1=普通  3=片头'
        autoSaving: false,
        loadedFont: false // 是否已经读取字体
    },
    effects: {
        /**
         * 刚进入时获取数据
         * @param templateId
         * @param videoId
         * @param call
         * @param put
         * @returns {IterableIterator<*>}
         * 流程设计 https://www.processon.com/view/link/5cf6408ce4b0da05395e5d2d
         */ *create(
            {
                payload: {
                    templateId: oriTemplateId,
                    videoId = null,
                    product: oriProduct = EDITOR_PRODUCT.main
                }
            },
            { call, put, select }
        ) {
            const { openFrom, tabId } = getURLObj(window.location.search); // 长页进入
            // 是否是模板片段
            const search = qs.parse(window.location.search.replace("?", "")) || {};
            let isWorkTpl = search.workTpl;
            let templateId = isWorkTpl || oriTemplateId;
            let product = oriProduct;
            if (isWorkTpl) {
                // 如果是作品模板先查询是去模板系统请求拿到type
                const {
                    data: {
                        success,
                        obj: { type }
                    }
                } = yield call(getTemplateVideoDetail, isWorkTpl);
                if (!success) {
                    return false;
                }
                // 如果是不是video系统的则从模板系统取
                if (
                    ![SEGMENT_TYPE.VIDEO_HEAD_TAIL, SEGMENT_TYPE.VIDEO_GROUP_TEMPLATE].includes(
                        type
                    )
                ) {
                    templateId = isWorkTpl;
                    isWorkTpl = false;
                }
                // 如果是 片头片尾则标记为片头片尾
                if ([SEGMENT_TYPE.HEAD_TAIL, SEGMENT_TYPE.VIDEO_HEAD_TAIL].includes(type)) {
                    product = EDITOR_PRODUCT.headTail;
                }
            }
            const isLoading = openFrom ? false : true;
            yield put({
                type: "save",
                payload: {
                    saveCue: false,
                    isLoading,
                    templateId: isWorkTpl || templateId || 0,
                    videoId: videoId ? videoId : null
                }
            });
            let obj = {};
            let autoSave = true;
            window.scene = {
                id: String(videoId || `vt-${templateId}`)
            };
            const isNew = videoId === null; // 是否是新的
            // 如果是新的而且不是作品模板则从模板库取数据。否则从作品库取数据，如果是作品模板带上作品模板的iD
            const response =
                isNew && !isWorkTpl
                    ? yield call(templateShow.getAllSegment, templateId)
                    : yield call(
                          userVideo.getMaterial,
                          isWorkTpl ? templateId : videoId,
                          isWorkTpl || null
                      );

            if (openFrom === OPEN_FROM.longPage && !response.data.success) {
                // 数据错误 通知集合页关闭tab
                sendPlatformPage(platformActions.quite, {
                    tabId,
                    ...window.eqxCollectInfo
                });
                return;
            }
            if (response.data && response.data.success) {
                ({ obj } = response.data);
                // 兼容长页进入增加openFrom参数
                if (openFrom === OPEN_FROM.longPage) {
                    let redirectUrl = null;
                    // 进入字幕编辑器2
                    if (obj.product === EDITOR_PRODUCT.subtitles) {
                        redirectUrl = `/video/subEditor/subtitles/0/${obj.id}?openFrom=${openFrom}&tabId=${tabId}`;
                    }
                    // 进入自说自话编辑器5
                    if (obj.product === EDITOR_PRODUCT.typeMonkey) {
                        redirectUrl = `/video/subEditor/typeMonkey/0/${obj.id}?openFrom=${openFrom}&tabId=${tabId}`;
                    }
                    if (redirectUrl) {
                        yield put(routerRedux.replace(redirectUrl));
                        return false;
                    }
                }
                const saveVersion = response.data.obj.ver || 0;
                const editorDataProvider = new MainEditorDataProvider({
                    videoId,
                    templateId,
                    obj
                });
                try {
                    yield editorDataProvider.getPariesData();
                } catch (e) {
                    console.error(e);
                    Message.error(e.message);
                    yield put({
                        type: "save",
                        payload: {
                            saveCue: false,
                            isLoading: false
                        }
                    });
                    return;
                }
                if (obj.templateId && !isWorkTpl) {
                    ({ templateId } = obj);
                }
                if (obj.product) {
                    ({ product } = obj);
                }
                if (videoId && obj.status === 4) {
                    // 上次是渲染成功则不自动保存，没有作品ID 一直会保存
                    autoSave = false;
                }
                const { parties, oriParties, isSave } = editorDataProvider;
                if (!isSave) {
                    yield put.resolve({
                        type: "workspace/reset"
                    });
                    yield put.resolve({
                        type: "canvas/reset"
                    });
                }
                // 处理全片段字体和 名字
                yield put.resolve({
                    type: "workspace/getMyFonts"
                });
                const { myFonts } = yield select(({ workspace }) => workspace);
                parties.forEach(item => {
                    if (Array.isArray(item.elementList)) {
                        const dataList = item.elementList;
                        dataList.forEach((v, i) => {
                            if (v.layerName === undefined) {
                                v.layerName = getLayerName(dataList, v.type);
                            }
                            if (
                                [
                                    CANVAS_TYPE.text,
                                    CANVAS_TYPE.artFont,
                                    CANVAS_TYPE.animateFont
                                ].includes(v.type) &&
                                v.fontFamily !== DEFAULT_FONT_FAMLIY
                            ) {
                                // 是字体而且不是默认字体
                                const { fontFamily = null, woffPath = null, ttfPath = null } =
                                    myFonts.find(f => f.fontFamily === v.fontFamily) || {};
                                if (!fontFamily) {
                                    v.fontFamily = DEFAULT_FONT_FAMLIY;
                                } else {
                                    addGlobalStyle(fontFamily, woffPath || ttfPath, true);
                                }
                            }
                        });
                    }
                });
                yield put({
                    type: "save",
                    payload: {
                        templateId,
                        saveCue: false,
                        saveVersion,
                        cancelAutoSave: !autoSave,
                        oriParties,
                        music: {
                            ...decodeMusic(obj.bgm),
                            volume: obj.bgmVolume === 0 ? 0 : obj.bgmVolume || 100
                        },
                        voice: obj.voiceover
                            ? {
                                  ...decodeMusic(obj.voiceover),
                                  volume: obj.voiceoverVolume === 0 ? 0 : obj.voiceoverVolume || 100
                              }
                            : null,
                        systemTailLeaderOn: [EDITOR_PRODUCT.main, EDITOR_PRODUCT.flash].includes(
                            product
                        )
                            ? obj.systemTailLeaderOn !== false
                            : obj.systemTailLeaderOn === true,
                        voiceLoop: obj.voiceoverLoop !== false,
                        bgmLoop: obj.bgmLoop !== false,
                        coverImg: obj.coverImg,
                        createTime: obj.createTime,
                        previewUrl: obj.previewUrl,
                        videoDescribe:
                            obj.videoDescribe ||
                            obj.templateDescribe ||
                            (product === EDITOR_PRODUCT.selfieVideo &&
                                "这是我使用易企秀APP拍的视频，你也来试试吧") ||
                            "视频描述",
                        transverse: obj.transverse,
                        videoDuration: obj.videoDuration,
                        title: obj.title,
                        parties,
                        isLoading: false,
                        // positionScale: getUserSetting(`${obj.transverse}_Scale`) || 1,
                        positionScale: getUserSetting(`${obj.transverse}_Scale`) || 1,
                        product
                    }
                });
                // 编辑器loading完成 通知集合页面
                if (openFrom === OPEN_FROM.longPage) {
                    // 加载完成通知集合页面关闭loading
                    sendPlatformPage(platformActions.messageReady, {
                        tabId
                    });
                }
                yield put.resolve({
                    type: "timeLine/init"
                });
                yield put.resolve({
                    type: "timeLine/save",
                    payload: { maxTime: product === EDITOR_PRODUCT.headTail ? 10 : 999 }
                });

                yield put({
                    type: "headAndTail/save",
                    payload: {
                        head: editorDataProvider.head,
                        tail: editorDataProvider.tail
                    }
                });
                let partyIndex = Number(search.party) || 0;
                if (parties.length - 1 < partyIndex) {
                    partyIndex = 0;
                }
                yield put.resolve({
                    type: "changeParty",
                    payload: {
                        index: partyIndex,
                        force: true
                    }
                });
                firstSave = false;
                eventEmitter.emit("editorInit");
                /**
                 * 如果符合自动保存条件 并且 有videoId 则开始自动保存
                 */
                if (autoSave && videoId) {
                    console.log("开始自动保存");
                    yield put.resolve({
                        type: "autoSave"
                    });
                } else if (autoSave) {
                    if (!videoId) {
                        firstSave = true;
                        // 执行初次保存 不能使用 put.resolve
                        yield put({ type: "firstSave" });
                    }
                }
            }
        },
        *autoSave(action, { put, select }) {
            yield delay(30000); // 30秒保存一次
            const {
                editor: { videoId, cancelAutoSave, isLoading },
                looper: { cutVideoUUID }
            } = yield select(({ editor, looper }) => ({
                editor,
                looper
            }));
            if (cancelAutoSave) return;
            // 有videoId || 窗口是激活 || 没有在保存 || 没有剪裁中的视频 才自动保存
            if (videoId && !document.hidden && !isLoading && !cutVideoUUID) {
                console.info("自动保存中");
                yield put.resolve({
                    type: "saveOrRender",
                    payload: {
                        onlySave: true,
                        showLoading: false,
                        autoSave: true
                    }
                });
            }
            yield put.resolve({
                type: "autoSave"
            });
        },
        /**
         * 保存或者渲染方法
         * @param onlySave
         * @param select
         * @param call
         * @param put
         * @returns {IterableIterator<*>}
         */ *saveOrRender(
            {
                payload: {
                    onlySave,
                    id = null,
                    showLoading = true,
                    autoSave = false,
                    donJump = false
                }
            },
            { select, call, put }
        ) {
            try {
                const {
                    editor: {
                        videoId,
                        parties: oldParties, // 原始parties
                        oriParties,
                        templateId,
                        music,
                        voice,
                        title,
                        coverImg,
                        videoDescribe,
                        isLoading,
                        transverse,
                        saveVersion,
                        voiceLoop,
                        bgmLoop,
                        systemTailLeaderOn,
                        product
                    },
                    headAndTail: { head, tail },
                    looper: { cutVideoUUID }
                } = yield select(({ editor, workspace, headAndTail, looper }) => ({
                    editor,
                    workspace,
                    headAndTail,
                    looper
                }));
                const actionName = onlySave ? "保存" : "生成";
                if (cutVideoUUID) {
                    if (showLoading) {
                        message.warning(`有视频正在剪裁,无法${actionName}`);
                    }
                    return false;
                }
                if (showLoading) {
                    eventEmitter.emit("saveWorkData"); // 触发保存事件 主要用来提醒文本框保存，目前有resizeVideo 绑定失去选择点事件
                }
                if (isLoading) {
                    Message.error("正在保存");
                    return false;
                }
                if (showLoading) {
                    yield put({
                        type: "save",
                        payload: {
                            isLoading: "保存中...-正在生成图层",
                            lockLoading: true,
                            saveCue: false
                        }
                    });
                } else if (autoSave) {
                    yield put({
                        type: "save",
                        payload: {
                            autoSaving: autoSave
                        }
                    });
                }
                if (!onlySave) {
                    yield put.resolve({
                        type: "workspace/changeActive",
                        payload: { index: null }
                    });
                }
                const parties = cloneDeep(oldParties);
                // 缩放倍数
                const multiple = transverse ? multipleH : multipleV;
                let hasHead = false;
                if (head.uuid) {
                    hasHead = true;
                    parties.unshift(head);
                }
                if (tail.uuid) {
                    parties.push(tail);
                }
                // 营销组件处理
                const userMarketList = [];
                try {
                    parties.forEach((party, sort) => {
                        party.elementList = party.elementList.filter((item, index) => {
                            if (item.type === CANVAS_TYPE.userMarket) {
                                const { componentType, content } = item;
                                const verifyFunc = userMarketContentVerify(componentType);
                                let msg = "";
                                let errorTitle = "";
                                const componentName = USER_MARKET_NAME[componentType];
                                const componentLabel = USER_MARKET_LABEL[componentType];
                                const verifyData = verifyFunc(content);
                                if (!content) {
                                    errorTitle = `你尚未填写${componentLabel}`;
                                    msg = `如果『${componentName}』的内容为空，则不能生成有效作品`;
                                } else if (!verifyData.res) {
                                    errorTitle = `『${componentName}』信息填写有误`;
                                    msg = verifyData.message;
                                }
                                if (msg && !onlySave) {
                                    throw new Error([errorTitle, msg, sort, index].join("::"));
                                }
                                const data = mapToBackendForUserMarket(item, sort, multiple);
                                if (data) {
                                    userMarketList.push(data);
                                } else {
                                    console.log("营销组件整理失败");
                                }
                                return false;
                            }
                            return true;
                        });
                    });
                } catch (e) {
                    // 营销组件错误处理
                    const [errorTitle, msg = e.message, sort, index] = e.message.split("::") || [];
                    yield waitModal({
                        onCancel: () => null,
                        title: errorTitle,
                        info: msg,
                        icon: {
                            type: "eqf-no-f",
                            style: { color: "red" }
                        },
                        buttons: [
                            {
                                children: "立即填写",
                                onClick: (e, onClose) => onClose()
                            }
                        ]
                    });
                    const partyIndex = ~~sort - (hasHead ? 1 : 0);
                    yield put.resolve({
                        type: "changeParty",
                        payload: { index: partyIndex }
                    });
                    yield delay(300);
                    yield put.resolve({
                        type: "workspace/changeActive",
                        payload: { index: ~~index }
                    });
                    throw new Error("");
                }
                // 查看是否有未保存的
                let i = 0;
                const layerData = Array(parties.length)
                    .fill(1)
                    .map(() => []);

                for (const party of parties) {
                    let elements = party.elementList;
                    if (party.haveChange === true) {
                        elements[0].url = "";
                    }
                    // 如果片段的第一个元素不存在url 或者 原始片段对应的数据没有，则需要重新生成
                    if (!elements[0].url || !oriParties[party.uuid]) {
                        // 生成视频,但是没有图层
                        if (!onlySave) {
                            if (showLoading) {
                                yield put({
                                    type: "save",
                                    payload: {
                                        isLoading: `保存中...-正在处理片段...${i + 1}/${
                                            parties.length
                                        }`,
                                        lockLoading: true
                                    }
                                });
                            }
                            // 在绘图之前先重新拉取下所有文本的高度
                            const newElements = elements
                                .map(data => {
                                    if (!data) {
                                        console.log("提交没有数据=>", elements);
                                        return false;
                                    }
                                    if (data.type === CANVAS_TYPE.userMarket) {
                                        userMarketList.push({
                                            ...data,
                                            segmentSort: i
                                        });
                                        return null;
                                    }
                                    // console.log(data.width,data.height);
                                    if (!data.type) {
                                        const { l, s } = WORKSPACE_SIZE;
                                        return {
                                            ...data,
                                            width: transverse ? l : s,
                                            height: transverse ? s : l
                                        };
                                    }
                                    const dom = document.querySelector(`#element_${data.uuid}`);
                                    if (
                                        !data.type ||
                                        !dom ||
                                        !dom.offsetHeight ||
                                        !dom.offsetWidth
                                    ) {
                                        return { ...data };
                                    }
                                    return {
                                        ...data,
                                        width:
                                            data.width ||
                                            dom.offsetWidth + 2 * (data.borderWidth || 0),
                                        height: dom.offsetHeight + 2 * (data.borderWidth || 0),
                                        borderWidth: data.borderWidth || 0
                                    };
                                })
                                .filter(v => v);
                            elements = newElements;
                            party.elementList = newElements;
                            const drawRes = yield put.resolve({
                                type: "canvas/drawParties",
                                payload: {
                                    dataList: elements,
                                    uuid: party.uuid
                                }
                            });
                            if (drawRes === false) {
                                console.log(elements);
                                throw new Error("版本有更新哦，请保存后刷新页面重新生成");
                            }

                            const { canvasObj } = yield select(({ canvas }) => canvas);
                            // const partyLayer = canvasObj[party.uuid] || {};
                            //
                            const partyLayer = elements.map(
                                item => canvasObj[item.uuid] || canvasObj[party.uuid][item.uuid]
                            );
                            let layer = 0;
                            for (const { type, canvas, values: canvasValue = {} } of partyLayer) {
                                // 从party里面取出 避免数据是旧的
                                const a =
                                    elements.find(v => v.uuid === canvasValue.uuid) || canvasValue;
                                layer += 1;
                                if (type === LAYER_TYPE.img) {
                                    const isAnimate =
                                        a.animate &&
                                        Object.keys(a.animate).some(animateType => {
                                            const one = a.animate[animateType];
                                            return one.animationDuration && one.animationName;
                                        });
                                    if (!isAnimate) {
                                        // 不是动画
                                        let key = null;
                                        // 图片上传
                                        if (canvas && typeof canvas.toDataURL === "function") {
                                            key = yield uploadQiniu(canvas.toDataURL());
                                        }
                                        if (key) {
                                            // 静态元素的宽高要通过边框宽度重新处理
                                            const { borderWidth = 0 } = a;
                                            layerData[i].push({
                                                ...a,
                                                url: addFilePath(key, 2),
                                                type,
                                                layer,
                                                top: a.top - borderWidth,
                                                left: a.left - borderWidth,
                                                height: a.height + borderWidth * 2,
                                                width: a.width + borderWidth * 2
                                            });
                                        }
                                    } else {
                                        // 动画字
                                        const { borderWidth = 0 } = a;
                                        const elementType = [
                                            CANVAS_TYPE.animateImg,
                                            CANVAS_TYPE.img
                                        ].includes(a.type)
                                            ? 2
                                            : 1;
                                        layerData[i].push({
                                            ...a,
                                            renderSetting: {
                                                ...a.renderSetting,
                                                animations: getAnimationData(
                                                    elementType,
                                                    a,
                                                    transverse
                                                )
                                            },
                                            type: [
                                                CANVAS_TYPE.animateImg,
                                                CANVAS_TYPE.img
                                            ].includes(a.type)
                                                ? LAYER_TYPE.animationImg
                                                : LAYER_TYPE.animationFont,
                                            layer,
                                            top: a.top - borderWidth,
                                            left: a.left - borderWidth,
                                            height: a.height + borderWidth * 2,
                                            width: a.width + borderWidth * 2
                                        });
                                    }
                                } else {
                                    let borderUrl = null;
                                    // 如果有边框数据，则上传
                                    if (canvas && typeof canvas.toDataURL === "function") {
                                        const key = onlySave
                                            ? ""
                                            : yield uploadQiniu(canvas.toDataURL());
                                        if (key) {
                                            borderUrl = addFilePath(key, 2);
                                        }
                                    }
                                    layerData[i].push({
                                        ...a,
                                        type,
                                        layer,
                                        borderUrl
                                    });
                                }
                            }
                        }
                    }
                    i += 1;
                }
                if (onlySave) {
                    parties.forEach((item, index) => {
                        layerData[index] = [
                            {
                                url: "",
                                type: LAYER_TYPE.img,
                                layer: index
                            }
                        ];
                    });
                }
                // 拼接参数
                if (showLoading) {
                    yield put({
                        type: "save",
                        payload: {
                            isLoading: "保存中...-正在提交数据",
                            lockLoading: true,
                            saveCue: false
                        }
                    });
                }
                // 前一个片段时长;
                let prevPartyDuration = 0;
                // 片段总 时长
                let totalVideoDuration = 0;

                function roundBackend(value) {
                    return round(value, 2);
                }

                const params = {
                    id: videoId,
                    product: product === EDITOR_PRODUCT.selfieVideo ? 1 : product,
                    version,
                    title,
                    videoDescribe,
                    systemTailLeaderOn,
                    voiceoverLoop: voiceLoop,
                    bgmLoop,
                    coverImg,
                    voiceover: encodeMusic(voice),
                    voiceoverVolume: (voice && voice.volume) || null,
                    bgm: encodeMusic(music),
                    bgmVolume: music.volume,
                    templateId,
                    ver: saveVersion,
                    transverse,
                    onlySave,
                    components: userMarketList,
                    segments: parties.map((oriParty, index) => {
                        const party = cloneDeep(oriParty);
                        party.renderSetting = {
                            ...party.renderSetting,
                            segmentPartyDuration: party.renderSetting.segmentPartyDuration
                        };
                        // 看是否需要重置转场
                        if (prevPartyDuration < 1 || party.renderSetting.segmentPartyDuration < 1) {
                            party.renderSetting.concatSet = {
                                duration: 800,
                                concatType: "none"
                            };
                        }
                        prevPartyDuration = party.renderSetting.segmentPartyDuration;
                        totalVideoDuration += prevPartyDuration;
                        if (!party.renderSetting.segmentPartyDuration) {
                            console.log("时长为0!");
                            party.renderSetting.segmentPartyDuration = 4;
                        }
                        // 验证上传视频数量
                        if (layerData[index]) {
                            const dataListVideo = party.elementList.filter(
                                v =>
                                    WorkspaceVideoType.includes(v.type) &&
                                    v.type !== CANVAS_TYPE.gif &&
                                    v.visibility !== "hidden"
                            );
                            const videoCount = dataListVideo.length;
                            const layerDataVideoCount = layerData[index].filter(
                                v =>
                                    WorkspaceVideoType.map(e => ~~HASH_TYPE[e]).includes(
                                        v.templateType
                                    ) && v.templateType !== LAYER_TYPE.gif
                            ).length;
                            if (videoCount > layerDataVideoCount && !onlySave) {
                                console.log(`片段${index + 1}提交时有动态素材丢失`);
                                const dValue = videoCount - layerDataVideoCount;
                                layerData[index].concat(
                                    cloneDeep(dataListVideo)
                                        .slice(dValue)
                                        .forEach((v, vi) => {
                                            // eslint-disable-next-line no-param-reassign
                                            v.type = ~~findKey(HASH_TYPE, v.type);
                                            // eslint-disable-next-line no-param-reassign
                                            v.layer = vi + dValue;
                                        })
                                );
                            }
                        }
                        return {
                            // 片段参数拼接
                            id: party.id, // 片段ID
                            sort: index,
                            speed: 1,
                            templateId: party.segmentId,
                            title: party.title || `片段${index + 1}`,
                            voiceover: encodeMusic(party.voice),
                            voiceoverVolume: (party.voice && party.voice.volume) || null,
                            voiceoverLoop: party.voiceLoop,
                            setting: mapPartyToBackend(party), // 全参数控制
                            renderSetting: JSON.stringify(party.renderSetting),
                            type: party.type || 2,
                            elements: (
                                (layerData[index].length &&
                                    layerData[index].map(oriVal => {
                                        // 否则拼接
                                        const val = cloneDeep(oriVal);
                                        const { borderWidth = 0 } = val;
                                        let obj = {};
                                        if (val.visibility === "hidden") return null;
                                        if ([LAYER_TYPE.img].includes(val.type)) {
                                            obj = {
                                                url: val.url
                                            };
                                        }
                                        if (
                                            !isSetTimerEle({
                                                ...val,
                                                templateType: val.type
                                            })
                                        ) {
                                            val.renderSetting = {
                                                startTime: 0,
                                                ...(val.renderSetting ||
                                                    createEleRenderSetting({})),
                                                endTime: party.renderSetting.segmentPartyDuration
                                            };
                                        } else {
                                            // 视频的音量
                                            val.renderSetting = {
                                                ...val.renderSetting,
                                                volume: val.muted === false ? 100 : 0
                                            };
                                        }
                                        if (val.type === LAYER_TYPE.gif) {
                                            // 如果是gif图
                                            val.url = val.coverImg;
                                            val.renderSetting = {
                                                ...val.renderSetting,
                                                opacity: val.opacity,
                                                loop: val.loop,
                                                backgroundColor: val.backgroundColor,
                                                duration: val.videoDuration
                                            };
                                        }
                                        if (val.loop !== undefined) {
                                            val.renderSetting.loop = val.loop;
                                        }
                                        val.renderSetting.borderUrl = val.borderUrl;
                                        const url =
                                            val.type === LAYER_TYPE.gif
                                                ? val.url.split("?")[0]
                                                : val.type === LAYER_TYPE.headTail
                                                ? val.previewUrl
                                                : null;
                                        // 处理图片裁剪
                                        if (
                                            val.type === LAYER_TYPE.img &&
                                            val.cutParams &&
                                            val.cutParams.oriUrl
                                        ) {
                                            obj.elementExtend = {
                                                cropHeight: val.cutParams.height,
                                                cropWidth: val.cutParams.width,
                                                cropPositionX: val.cutParams.x,
                                                cropPositionY: val.cutParams.y,
                                                originImageUrl: val.cutParams.oriUrl,
                                                cropRotate: val.cutParams.rotate || 0,
                                                cropScaleX: val.cutParams.scaleX,
                                                cropScaleY: val.cutParams.scaleY
                                            };
                                        }
                                        return {
                                            transverse,
                                            // 数据需要除以倍数
                                            width:
                                                roundBackend(
                                                    (val.width - 2 * borderWidth) / multiple
                                                ) || 0,
                                            height:
                                                roundBackend(
                                                    (val.height - 2 * borderWidth) / multiple
                                                ) || 0,
                                            positionX:
                                                roundBackend((val.left + borderWidth) / multiple) ||
                                                0,
                                            positionY:
                                                roundBackend((val.top + borderWidth) / multiple) ||
                                                0,
                                            url,
                                            editorCropId: val.cutId || null,
                                            rotate: val.rotate,
                                            templateType: val.type,
                                            layer: val.layer,
                                            templateId: val.templateId,
                                            id: val.id || null,
                                            uuid: createUUID(),
                                            renderSetting: JSON.stringify(val.renderSetting),
                                            bgmOn: val.muted === undefined ? true : !val.muted,
                                            videoMp4Url: val.videoMp4Url || null,
                                            videoWebmUrl: val.videoWebmUrl || null,
                                            previewUrl: val.oriPreviewUrl || null,
                                            coverImg: val.coverImg,
                                            materials:
                                                (val.materialList && // 素材组装
                                                    val.materialList.map(material => ({
                                                        id: material.id,
                                                        videoTemplateMaterialId:
                                                            material.videoTemplateMaterialId,
                                                        replaceContentName: "",
                                                        replaceContent: addFilePath(
                                                            material.replaceContent,
                                                            material.materialType
                                                        )
                                                    }))) ||
                                                [],
                                            ...obj
                                        };
                                    })) ||
                                oriParties[party.uuid]
                            ).filter(v => {
                                if (v) {
                                    return true;
                                }
                                console.log("素材缺失，可能是过老");
                                return false;
                            }) // 实在没有则传空,去掉空白
                        };
                    })
                };
                // 提交时总时长检查
                if (totalVideoDuration > MAX_WORKS_DURATION && !onlySave) {
                    throw new Error("您的视频总时长已经超过30分钟，无法生成。");
                }
                if (product === EDITOR_PRODUCT.headTail && totalVideoDuration > 11) {
                    throw new Error("片头片尾总时长不能超过十秒，请重新调整。");
                }
                const { data: { success = false, obj = null, map } = {} } = yield call(
                    autoSave ? userVideo.autoSubmit : userVideo.submit,
                    params
                ); // 发送保存请求
                const { saveVersion: nowSaveVersion } = yield select(({ editor }) => editor);
                const { ver: newSaveVersion = nowSaveVersion } = map || {};
                if (success) {
                    if (onlySave && showLoading) {
                        Message.success("保存成功");
                        const payload = {
                            saveVersion: newSaveVersion,
                            isLoading: false,
                            lockLoading: false,
                            saveCue: false
                        };
                        if (!videoId) {
                            payload.videoId = obj || id;
                        }
                        yield put({
                            type: "save",
                            payload
                        });
                        return obj || id;
                    } else if (autoSave || !showLoading) {
                        const videoid = obj || id; // 作品ID
                        if (!videoId) {
                            window.scene = {
                                id: String(videoid)
                            };
                            yield put({
                                type: "save",
                                payload: {
                                    saveVersion: newSaveVersion,
                                    videoId: videoId || videoid,
                                    saveCue: false,
                                    autoSaving: false
                                }
                            });
                            if ([EDITOR_PRODUCT.main, EDITOR_PRODUCT.headTail].includes(product)) {
                                if (window.location.pathname.includes("simpleEditor")) {
                                    sendBDEvent({
                                        position: "简易编辑器",
                                        type: "创建视频"
                                    });
                                }
                                // 长页进入增加openFrom参数
                                const { openFrom, tabId } = getURLObj(window.location.search); // 长页进入
                                let routerUrl = `${window.location.pathname}/${videoid}`;
                                if (openFrom === OPEN_FROM.longPage) {
                                    routerUrl = `${window.location.pathname}/${videoid}?openFrom=${openFrom}&tabId=${tabId}`;
                                }
                                yield put(routerRedux.replace(routerUrl));
                            }
                        } else {
                            yield put({
                                type: "save",
                                payload: {
                                    saveVersion: newSaveVersion,
                                    saveCue: false,
                                    autoSaving: false
                                }
                            });
                        }
                        return success;
                    }
                    yield put({
                        type: "save",
                        payload: {
                            saveVersion: newSaveVersion,
                            videoId: videoId || obj,
                            cancelAutoSave: true,
                            isLoading: false,
                            lockLoading: false
                        }
                    });
                    if (!donJump) {
                        // yield put(routerRedux.push(`${prev}/scene`));
                    }
                    return success;
                }
                yield put({
                    type: "save",
                    payload: {
                        isLoading: false,
                        lockLoading: false,
                        saveCue: false,
                        autoSaving: false
                    }
                });
                return success;
            } catch (e) {
                console.error(e);
                if (e.message) {
                    Message.error(e.message);
                }
            }
            yield put({
                type: "save",
                payload: {
                    isLoading: false,
                    lockLoading: false,
                    autoSaving: false
                }
            });
            return false;
        },
        /**
         * 作品列表复制用户作品
         * @param payload
         * @param call
         * @param select
         * @param put
         */ *copy({ payload }, { call }) {
            const { id, callBack } = payload;
            const response = yield call(userVideo.copy, id);
            if (response.data.success) {
                Message.success("复制成功");
                if (typeof callBack === "function") {
                    callBack();
                }
            }
        },
        /**
         * 作品列表删除作品
         * @param id
         * @param callBack
         * @param call
         * @param put
         * @returns {IterableIterator<*>}
         */ *delete({ payload: { id, callBack } }, { call }) {
            const response = yield call(userVideo.videoDelete, id);
            if (response.data.success) {
                Message.success("删除成功");
                if (typeof callBack === "function") {
                    // callBack(response.data);
                }
            }
        },
        /**
         * 重置
         * @param action
         * @param put
         * @returns {IterableIterator<*>}
         */ *reset(action, { put }) {
            firstSave = false;
            yield put({
                type: "save",
                payload: {
                    parties: [], // 片段的基本数据
                    oriParties: {}, // 原始数据，用于不重新生成；
                    partiesVer: 0, // parties 版本号。子组件用来判断是否改变
                    playSpeed: 1, // 播放速度
                    nowIndex: null, // 目前激活的片段
                    videoId: null, // 视频ID
                    templateId: null, // 模板ID
                    title: null, // 视频标题
                    coverImg: null, // 封面图
                    videoDescribe: null, // 视频描述
                    previewUrl: null, // 全视频预览地址（暂时没用）
                    videoDuration: 0, // 视频时长
                    transverse: false, // 横版视频
                    createTime: "2018-11-20 00:00:00",
                    updateTime: "2018-11-20 00:00:00",
                    music: {}, // 背景音乐对象
                    voice: {}, // 旁白对象
                    commonVer: 0, // 公共变量版本号
                    isLoading: false, // 是否在读取中，可以为string，会在读取画面显示
                    lockLoading: false, // 读取状态锁，保存的时候锁住，免得被其他东西关掉
                    beforeInsertHook: null, // 插入前钩子;
                    action: null, // 操作提示
                    voiceLoop: true,
                    bgmLoop: true,
                    autoSaving: false
                }
            });
        },
        /**
         * 保存公共参数的方法
         * @param payload
         * @param put
         * @returns {IterableIterator<*>}
         */ *saveCommon({ payload }, { put }) {
            yield put({
                type: "save",
                payload: {
                    ...payload,
                    saveCue: true
                }
            });
        },
        *setVoice(
            { payload: { partyIndex = false, voiceLoop = true, ...voice } },
            { select, put }
        ) {
            const {
                editor: { parties, nowIndex }
            } = yield select(({ editor }) => ({ editor }));
            let payload = {};
            if (partyIndex === false) {
                const newParties = parties.map(v => ({
                    ...v,
                    voiceLoop: true,
                    voice: null
                }));
                payload = {
                    voiceLoop,
                    voice,
                    parties: newParties
                };
            } else {
                const index = partyIndex === "now" ? nowIndex : partyIndex;
                if (!parties[index]) return;
                const newParties = cloneDeep(parties);
                newParties[index].voice = voice;
                newParties[index].voiceLoop = voiceLoop;
                payload = {
                    voiceLoop: true,
                    voice: null,
                    parties: newParties
                };
            }
            yield put({
                type: "save",
                payload
            });
        },
        /**
         * 保存分段信息的方法
         * @param payload
         * @param put
         * @returns {IterableIterator<*>}
         */ *saveParties({ payload }, { put }) {
            yield put({
                type: "save",
                payload: {
                    parties: payload.list,
                    saveCue: true
                }
            });
        },
        /**
         * 改变当前片段的方法
         * @param payload
         * @param select
         * @param put
         * @returns {IterableIterator<*>}
         */ *changeNowParty({ payload }, { select, put }) {
            const { nowIndex, parties } = yield select(({ editor }) => editor);
            const newParties = [...parties];
            newParties[nowIndex] = { ...parties[nowIndex], ...payload };
            yield put({
                type: "save",
                payload: {
                    parties: newParties,
                    saveCue: true
                }
            });
        },
        /**
         * 通过uuid，更改片段
         * @param uuid
         * @param payload
         * @param saveCue
         * @param select
         * @param put
         * @returns {IterableIterator<*>}
         */ *changePartyByUuid({ payload: { uuid, saveCue = true, ...payload } }, { select, put }) {
            const {
                parties,
                nowIndex,
                videoId,
                cancelAutoSave,
                isLoading,
                saveCue: preSaveCue
            } = yield select(({ editor }) => editor);
            let activeParty = false;
            let changeParty = {};
            const newParties = parties.map((item, index) => {
                if (item.uuid === uuid) {
                    if (nowIndex === index) {
                        activeParty = true;
                    }
                    changeParty = {
                        ...item,
                        ...payload,
                        haveChange: true
                    };
                    return changeParty;
                }
                return item;
            });
            yield put({
                type: "save",
                payload: {
                    parties: newParties,
                    saveCue: saveCue || preSaveCue
                }
            });
            if (activeParty) {
                const payload = {};
                yield put.resolve({
                    type: "workspace/changeCommon",
                    payload: {
                        dataList: changeParty.elementList,
                        groupList: changeParty.groupList
                    }
                });
            }
        },
        *firstSave(action, { put }) {
            // yield delay(30000);
            if (!firstSave) return;
            yield put({
                type: "save",
                payload: { firstSaving: true }
            });
            yield put.resolve({
                type: "saveOrRender",
                payload: {
                    onlySave: true,
                    showLoading: false
                }
            });
            console.log("开始自动保存");
            yield put.resolve({
                type: "autoSave"
            });
        },
        /**
         * 新增片段的方法
         * @param id
         * @param select
         * @param put
         * @param call
         * @returns {IterableIterator<*>}
         */ *addParty({ payload: { id, type = 1 } }, { select, put }) {
            const { beforeInsertHook } = yield select(({ editor }) => editor);
            if (typeof beforeInsertHook === "function") {
                // 如果有钩子则调用
                const res = yield beforeInsertHook(id, type);
                yield put({
                    // 清空钩子
                    type: "save",
                    payload: { insertCallBack: null }
                });
                if (!res) return; // 如果钩子返回false 则停止继续插入
            }
            yield put.resolve({
                type: "addEmptyParty",
                payload: {
                    name: "片段",
                    saveCue: true
                }
            });
            yield delay(200);
            yield put.resolve({
                type: "workspace/insertVideo",
                payload: {
                    id,
                    type
                }
            });
        },
        *addEmptyParty({ payload: { name = "空白片段" } = {} }, { put, select }) {
            const { parties, nowIndex, transverse } = yield select(({ editor }) => editor);
            const defaultDuration = 4;
            const newParty = {
                id: null,
                title: `${name}${parties.length + 1}`,
                playSpeed: 1,
                videoDuration: defaultDuration,
                segmentPartyDuration: defaultDuration,
                renderSetting: createRenderSetting({}),
                elementList: [
                    {
                        ...genBackground(transverse),
                        uuid: createUUID(),
                        renderSetting: createEleRenderSetting({})
                    }
                ],
                groupList: [],
                haveChange: true
            };
            newParty.uuid = createUUID();
            parties.splice(nowIndex + 1, 0, newParty);
            yield put({
                type: "save",
                payload: {
                    parties,
                    saveCue: true
                }
            });
            yield put.resolve({
                type: "changeParty",
                payload: {
                    index: nowIndex + 1
                }
            });
            yield put.resolve({
                type: "canvas/drawParties",
                payload: {
                    dataList: newParty.elementList,
                    uuid: newParty.uuid
                }
            });
            yield put({
                type: "timeLine/changeCurrentTime",
                payload: {
                    currentTime: 0,
                    uuid: newParty.uuid
                }
            });
            yield put.resolve({
                type: "overLoading"
            });
        },
        *startLoading(action, { put }) {
            yield put({
                type: "save",
                payload: { loading: true }
            });
        },
        *overLoading(action, { put, select }) {
            const { lockLoading } = yield select(({ editor }) => editor);
            if (lockLoading) {
                return;
            }
            yield put({
                type: "save",
                payload: { loading: false }
            });
        },
        /**
         * 复制片段的方法
         * @param activeIndex
         * @param select
         * @param put
         * @returns {IterableIterator<*>}
         */ *copyParties({ payload: { activeIndex } }, { select, put }) {
            const {
                editor: { parties },
                timeLine: { currentTimes }
            } = yield select(({ editor, timeLine }) => ({
                editor,
                timeLine
            }));
            const newParties = cloneDeep(parties[activeIndex]);
            const oldUUID = newParties.uuid;
            const currentTime = currentTimes[oldUUID];
            newParties.id = null;
            // 设置新片段的uuid
            newParties.uuid = createUUID();
            newParties.haveChange = true;
            // 清空ID 和 uuid
            newParties.elementList = newParties.elementList
                // 过滤营销组件
                .filter(v => v.type !== CANVAS_TYPE.userMarket)
                .map(v => ({
                    ...v,
                    id: null,
                    uuid: createUUID(),
                    materialList:
                        (v.materialList &&
                            v.materialList.map(a => ({
                                ...a,
                                id: null
                            }))) ||
                        null
                }));
            // 插入片段列表中
            parties.splice(activeIndex + 1, 0, newParties);
            yield put({
                type: "save",
                payload: {
                    parties,
                    saveCue: true
                }
            });
            yield put.resolve({
                type: "changeParty",
                payload: {
                    index: activeIndex + 1,
                    force: true
                }
            });
            yield put({
                type: "timeLine/changeCurrentTime",
                payload: {
                    uuid: newParties.uuid,
                    currentTime
                }
            });
        },
        /**
         * 删除片段
         * @param activeIndex
         * @param select
         * @param put
         * @returns {IterableIterator<*>}
         */ *deleteParties({ payload: { activeIndex } }, { select, put }) {
            const { parties } = yield select(({ editor }) => editor);
            if (parties.length < 2) {
                Message.error("无法删除最后一个片段");
                return;
            }
            parties.splice(activeIndex, 1);
            yield put.resolve({
                type: "save",
                payload: {
                    parties,
                    saveCue: true
                }
            });
            yield put.resolve({
                type: "changeParty",
                payload: {
                    index: Math.max(activeIndex - 1, 0),
                    force: true
                }
            });
            if (activeIndex > 0) {
                yield put.resolve({
                    type: "reloadVideoDuration",
                    payload: {
                        uuid: parties[activeIndex - 1].uuid
                    }
                });
            }
        },
        /**
         * 移动片段
         * @param oldIndex
         * @param newIndex
         * @param select
         * @param put
         * @returns {IterableIterator<*>}
         */ *moveParties({ payload: { oldIndex, newIndex } }, { select, put }) {
            let { parties } = yield select(({ editor }) => editor);
            parties = arrayMove(parties, oldIndex, newIndex);
            yield put.resolve({
                type: "save",
                payload: {
                    parties,
                    saveCue: true
                }
            });
            yield put.resolve({
                type: "changeParty",
                payload: {
                    index: Math.max(newIndex - 1, 0),
                    force: true
                }
            });
            yield put.resolve({
                type: "reloadVideoDuration",
                payload: {
                    uuid: parties[newIndex].uuid
                }
            });
            if (oldIndex > 0) {
                yield put.resolve({
                    type: "reloadVideoDuration",
                    payload: {
                        uuid: parties[oldIndex - 1].uuid
                    }
                });
            }
            if (newIndex > 0) {
                yield put.resolve({
                    type: "reloadVideoDuration",
                    payload: {
                        uuid: parties[newIndex - 1].uuid
                    }
                });
            }
        },
        /**
         * 保存工作区
         * @param action
         * @param select
         * @param call
         * @param put
         * @returns {IterableIterator<*>}
         */ *saveWorkData({ payload = {} }, { select, put }) {
            const index = payload.index === undefined ? false : payload.index;
            const { noSave = false } = payload;
            const {
                editor: { nowIndex, parties }
            } = yield select(({ editor }) => ({
                editor
            }));
            if (!parties[nowIndex]) {
                // 如果已经没有则不管
                console.log("没有找到片段");
                return;
            }
            yield put.resolve({
                type: "workspace/changeActive",
                payload: { index: null }
            });
            yield delay(50);
            const { dataList: nowDataList, haveChange, uuid: nowUUID } = yield select(
                ({ workspace }) => workspace
            );
            const { canvasObj, loadingObj } = yield select(({ canvas }) => canvas);
            const trueIndex = index === false ? nowIndex : index;
            const dataList = trueIndex === nowIndex ? nowDataList : parties[trueIndex].elementList; // 如果是当前页面 则使用workspace的数据
            const uuid = trueIndex === nowIndex ? nowUUID : parties[trueIndex].uuid; // 如果是当前页面 则使用workspace的数据
            if (haveChange && !noSave) {
                // 如果改变才存
                // 存放图层到laypic；
                if (loadingObj[uuid]) {
                    // 如果正在生成，则需要等待生成完毕；
                    console.log("等待生成图片中");
                    yield put.resolve({
                        type: "canvas/waitLoading",
                        payload: { uuid }
                    });
                    yield delay(50);
                } else if (!canvasObj[uuid]) {
                    yield put.resolve({
                        type: "waitingTOCanvasData",
                        payload: { uuid }
                    });
                }
            }
            // 切换前存好
            parties[trueIndex] = {
                ...parties[trueIndex],
                elementList: cloneDeep(dataList),
                haveChange
            };
            yield put({
                type: "save",
                payload: {
                    parties
                }
            });
        },
        /**
         * 等待画图model的绘图完毕
         * @param uuid
         * @param select
         * @param call
         * @param put
         * @returns {IterableIterator<*>}
         */ *waitingTOCanvasData({ payload: { uuid } }, { select }) {
            while (true) {
                const { canvasObj } = yield select(({ canvas }) => canvas);
                if (canvasObj[uuid]) {
                    return canvasObj[uuid];
                }
            }
        },
        /**
         * 切换选中片段
         * @param index
         * @param force 是否强制刷新
         * @param select
         * @param call
         * @param put
         * @returns {IterableIterator<*>}
         */ *changeParty({ payload: { index, force = false } }, { select, put }) {
            const {
                editor: { parties, nowIndex },
                workspace: { activeIndex },
                timeLine: { currentTimes }
            } = yield select(({ editor, workspace, timeLine }) => ({
                editor,
                workspace,
                timeLine
            }));
            // 非强制刷新时 现在的index === 要改变的index 的时候跳出
            if (!force && nowIndex === index) {
                return;
            }
            if (!parties[index]) {
                return;
            }
            yield put({
                type: "save",
                payload: { isLoading: true }
            });
            yield put({
                type: "timeLine/pause"
            });
            eventEmitter.emit("resetPlayer");
            const {
                playSpeed,
                haveChange,
                elementList,
                videoBackgroundPic,
                videoBackgroundColor,
                videoBackgroundPicOpacity,
                segmentPartyDuration,
                groupList = [],
                uuid
            } = parties[index];
            const oneEle = elementList[activeIndex] || null;
            const currentTime = currentTimes[uuid] || 0;
            const { renderSetting: { startTime = 0, endTime = 1 } = {} } = oneEle || {};
            if (
                !oneEle ||
                oneEle.lock ||
                (oneEle.visibility === "hidden" &&
                    (startTime > currentTime || endTime < currentTime))
            ) {
                yield put.resolve({
                    type: "workspace/changeActive",
                    payload: { index: null }
                });
            }
            // 切换放入workspace model
            yield put.resolve({
                type: "workspace/changeAll",
                payload: {
                    haveChange,
                    dataList: elementList,
                    partyIndex: index,
                    uuid,
                    groupList
                }
            });
            const { location } = _dva_app._history;
            const search = qs.parse(location.search.slice(1)) || {};
            search.party = index;
            yield put(routerRedux.replace(`${location.pathname}?${qs.stringify(search)}`));
            yield put({
                type: "save",
                payload: {
                    isLoading: false,
                    playSpeed,
                    segmentPartyDuration,
                    nowIndex: index,
                    videoBackgroundPic,
                    videoBackgroundColor,
                    videoBackgroundPicOpacity
                }
            });
        },
        /**
         * 提前获取字体，加快首次进入编辑页面的响应速度
         * */ *getFonts(action, { call, put, select }) {
            const {
                editor: { loadedFont }
            } = yield select(({ editor }) => ({ editor }));
            if (loadedFont) return;
            const {
                data: { list = [] }
            } = yield call(getMyFont);
            // const list = [];
            // eslint-disable-next-line camelcase
            const { font_family, woff_path, authedttf_path } =
                list.find(f => f.font_family === DEFAULT_FONT_FAMLIY) || {};
            // eslint-disable-next-line camelcase
            if (font_family) {
                // eslint-disable-next-line camelcase
                const url = `${host.font2}${woff_path}`;
                getAllFontBlob([url]);
                // eslint-disable-next-line camelcase
                addGlobalStyle(font_family, woff_path || authedttf_path, true);
            }
            yield put({
                type: "save",
                payload: {
                    loadedFont: true
                }
            });
        },
        *onChangeAllConcatSet({ payload: { concatSet } }, { select, put }) {
            if (!concatSet) return;
            const {
                editor: { parties: list },
                headAndTail: {
                    head: { renderSetting = {} }
                }
            } = yield select(({ editor, headAndTail }) => ({
                editor,
                headAndTail
            }));
            let prePartyDuration = renderSetting.segmentPartyDuration || 0;
            const newList = list.map(v => {
                const {
                    renderSetting: { segmentPartyDuration = 0 }
                } = v;
                const newOne = {
                    ...v,
                    renderSetting: {
                        ...v.renderSetting,
                        concatSet: { ...concatSet }
                    }
                };
                // 如果不符合转场规范
                if (
                    segmentPartyDuration < MIN_CONCAT_DURATION ||
                    prePartyDuration < MIN_CONCAT_DURATION
                ) {
                    newOne.renderSetting.concatSet.concatType = "none";
                }
                prePartyDuration = segmentPartyDuration;
                return newOne;
            });
            yield put.resolve({
                type: "headAndTail/changeConcatSet",
                payload: {
                    ...concatSet
                }
            });
            yield put({
                type: "save",
                payload: { parties: newList }
            });
            message.success("已经应用于所有前后片段时长大于1秒的片段");
        },
        /**
         * 重新获取片段时长
         * @param action
         * @param select
         * @param put
         * @returns {IterableIterator<*>}
         */ *reloadVideoDuration({ payload = {} }, { select, put }) {
            const {
                editor: { parties, nowIndex: edIndex },
                timeLine: { currentTimes }
            } = yield select(({ editor, timeLine }) => ({
                editor,
                timeLine
            }));
            let { uuid } = payload;
            let partyDuration = 0;
            const nowIndex = (uuid && parties.findIndex(party => party.uuid === uuid)) || edIndex;
            if (!parties[nowIndex]) return;
            const oldPartyDuration = parties[nowIndex].renderSetting.segmentPartyDuration;
            uuid = uuid || parties[nowIndex].uuid;
            const dataList = parties[nowIndex].elementList;
            dataList.forEach(obj => {
                const { renderSetting = false } = obj;
                const isHidden = obj.visibility === "hidden";
                if (
                    isSetTimerEle(obj) &&
                    !isHidden &&
                    renderSetting &&
                    renderSetting.endTime > partyDuration
                ) {
                    partyDuration = renderSetting.endTime;
                }
            });
            // 有任何操作导致片段时长为0的时候，重置片段时长为4秒
            partyDuration = partyDuration || 4;
            if (partyDuration === oldPartyDuration) {
                return;
            }
            if (partyDuration > 0) {
                // 重新设定其他的list
                const newDataList = dataList.map(obj => {
                    const isHidden = obj.visibility === "hidden";
                    const { renderSetting = false } = obj;
                    // 不是时间点组件 且不是隐藏则同步到片段时长
                    if (!isSetTimerEle(obj) && !isHidden) {
                        return {
                            ...obj,
                            renderSetting: {
                                ...renderSetting,
                                endTime: partyDuration
                            }
                        };
                    }
                    return obj;
                });
                const { renderSetting } = parties[nowIndex];
                yield put.resolve({
                    type: "changePartyByUuid",
                    payload: {
                        uuid,
                        elementList: newDataList,
                        renderSetting: {
                            ...renderSetting,
                            segmentPartyDuration: partyDuration
                        }
                    }
                });
                // if (currentTimes[uuid] < (partyDuration * 1000)) {
                //     yield put.resolve({
                //         type: 'timeLine/changeCurrentTime',
                //         payload: {
                //             uuid,
                //             currentTime: 0,
                //         },
                //     });
                // }
                // 时长如果小于1。5应该重新设置前后转场
                if (partyDuration < 1) {
                    const { renderSetting: nowRenderSetting } = parties[nowIndex];
                    const { renderSetting: nextRenderSetting = null, uuid: nextUuid = null } =
                        parties[nowIndex + 1] || {};
                    if (parties[parties.length - 1].uuid === uuid) {
                        yield put.resolve({
                            type: "headAndTail/changeConcatSet",
                            payload: {
                                concatType: "none"
                            }
                        });
                    }
                    if (uuid) {
                        yield put.resolve({
                            type: "changePartyByUuid",
                            payload: {
                                uuid,
                                renderSetting: {
                                    ...nowRenderSetting,
                                    segmentPartyDuration: partyDuration,
                                    concatSet: {
                                        duration: 800,
                                        concatType: "none"
                                    }
                                }
                            },
                            uuid
                        });
                    }
                    if (nextUuid) {
                        yield put.resolve({
                            type: "changePartyByUuid",
                            payload: {
                                uuid: nextUuid,
                                renderSetting: {
                                    ...nextRenderSetting,
                                    concatSet: {
                                        duration: 800,
                                        concatType: "none"
                                    }
                                }
                            },
                            uuid
                        });
                    }
                }
            }
        },
        *scaleSave({ payload }, { put }) {
            yield put.resolve({
                type: "save",
                payload: {
                    positionScale: payload
                }
            });
        }
    },
    reducers: {
        save(state, { payload }) {
            const { materialListVer } = state;
            let { partiesVer, commonVer } = state;
            if (payload.parties !== state.parties) {
                partiesVer += 1;
            }
            if (payload.voice || payload.music || payload.title || payload.videoDescribe) {
                commonVer += 1;
            }
            return {
                ...state,
                ...payload,
                partiesVer,
                materialListVer,
                commonVer
            };
        },
        changeScale(state, { payload }) {
            const { scale } = payload;
            const positionScale = state.positionScale + scale;
            if (positionScale > 3 || positionScale < 0.49) {
                return { ...state };
            }
            setUserSetting(`${state.transverse}_Scale`, positionScale);
            return {
                ...state,
                positionScale
            };
        }
    },
    subscriptions: {
        setup({ dispatch, history }) {
            history.listen(({ pathname }) => {
                if (!pathname.toLowerCase().includes("editor")) {
                    dispatch({
                        type: "reset"
                    });
                }
            });
        },
        getFonts({ dispatch, history }) {
            history.listen(() => {
                dispatch({
                    type: "getFonts"
                });
            });
        }
    }
};
