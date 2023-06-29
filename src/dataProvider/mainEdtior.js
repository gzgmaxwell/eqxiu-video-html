/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/first */
// @ts-check
import {
    CANVAS_TYPE,
    DEFAULT_BACKGROUND_COLOR,
    HASH_TYPE,
    LAYER_TYPE,
    NORMAL_RESOLUTION,
    WorkspaceVideoType
} from "../config/staticParams";
import {
    createEleRenderSetting,
    createRenderSetting,
    createUUID,
    mapToBackendForUserMarket,
    mapToFrontendForUserMarket
} from "../util/data";
import { genBackground, genMaterialList } from "../services/editorData";
import { compatibleVideo } from "../util/file";
import { genNewResizeParams } from "../util/image";
import lodash from "lodash";
import { ANIMATION_TYPES } from "../dataBase/animations";
import { message } from "antd";

const multipleH = 560 / NORMAL_RESOLUTION.hoz.x; // 横板倍数

const multipleV = 560 / NORMAL_RESOLUTION.ver.y; // 纵板倍数
/**
 * 主编辑器的数据提供器
 */
class MainEditorDataProvider {
    constructor({ templateId, videoId = null, obj }) {
        if (!obj) {
            throw new Error('need "obj" data');
        }
        this.transverse = obj.transverse;
        this.multiple = obj.transverse ? multipleH : multipleV;
        this.templateId = templateId;
        this.parties = [];
        this.oriParties = {};
        this.orginData = obj;
        this.isNew = videoId === null;
        this.isSave = false; // 是否是二次进入 用于判断是否需要重置画布和重置workspace
        this.head = {};
        this.tail = {};
        this.skipComponents = false;
    }

    /**
     * 存放当前处理片段的元素列表
     * @type {Array}
     * @private
     */
    _onPartyElementList = [];

    /**
     * 处理来自setting的element
     * @param {Object} element
     * @returns {*}
     */
    handlerElementFormSetting = (element, index) => {
        const { isNew, _onPartyElementList: backendELeList, _backOneParty: backOneParty } = this;
        if (typeof element !== "object" || !element) throw new Error("元素不是对象");
        // 片段时长
        const partyDuration = this.partyRenderSetting.segmentPartyDuration;
        const result = {
            ...element,
            uuid: createUUID() // element.uuid || createUUID(),
        };

        const isHidden = element.visibility === "hidden";
        // 获取对应的元素 隐藏元素则不取出
        const oneEle = (!isHidden && backendELeList[0] && backendELeList.shift()) || {};
        if (
            !WorkspaceVideoType.includes(element.type) ||
            element.type === LAYER_TYPE.gif ||
            isHidden
        ) {
            // 如果不是视频则直接跳过
            result.id = (!isNew && oneEle.id) || null;
            result.uuid = result.uuid || createUUID();
            result.renderSetting = createEleRenderSetting(element, partyDuration);
            // 处理字体的问题
            result.url =
                // @ts-ignore
                (index === 0 && backOneParty.elements[0] && backOneParty.elements[0].url) ||
                result.url;
            // 处理动画的兼容问题
            if (element.animationName && !element.animate) {
                result.animate = {
                    [ANIMATION_TYPES.ENTRANCE]: {
                        animationName: element.animationName,
                        animationDuration: element.animationDuration || 1000,
                        animationIteration: element.animationIteration || 1,
                        stageType: ANIMATION_TYPES.ENTRANCE,
                        delay: 0
                    }
                };
            }
            // 处理图片裁剪参数
            if (oneEle.elementExtend) {
                const obj = oneEle.elementExtend;
                result.cutParams = {
                    x: obj.cropPositionX,
                    y: obj.cropPositionY,
                    width: obj.cropWidth,
                    height: obj.cropHeight,
                    oriUrl: obj.originImageUrl,
                    rotate: obj.cropRotate,
                    scaleX: obj.cropScaleX,
                    scaleY: obj.cropScaleY
                };
            }
            // 处理文本的内容为空的清空
            if (result.type === CANVAS_TYPE.text) {
                if (!result.content) {
                    result.content = "双击替换文本";
                } else {
                    result.content = result.content.replace(/\n/g, "<br/>");
                }
                if (result.fontSize) {
                    result.fontSize = Number(result.fontSize);
                }
            }

            // 边框宽度转成 int
            if (!result.borderWidth) {
                result.borderWidth = 0;
            } else {
                result.borderWidth = Number(result.borderWidth);
            }
            if (result.type === CANVAS_TYPE.img && !result.url) {
                if (index === 0) {
                    result.type = undefined;
                } else {
                    return null;
                }
            }
            return result;
        }

        // 删除掉内容的materials 只保留mateialList
        delete result.materials;
        const cutId = oneEle.editorCropId || element.cutId || null;
        const renderSetting = createEleRenderSetting(element, partyDuration);
        const type = HASH_TYPE[oneEle.templateType] || element.type;
        if (!Object.values(CANVAS_TYPE).includes(type)) {
            debugger;
            return null;
        }
        const loop = (() => {
            if ([CANVAS_TYPE.gif, CANVAS_TYPE.ornament].includes(type)) {
                if (renderSetting.loop !== undefined) {
                    return renderSetting.loop;
                }
                return element.loop !== undefined ? element.loop : true;
            }
            if ([CANVAS_TYPE.clad, CANVAS_TYPE.dynamicBg].includes(type)) {
                return true;
            }
            return false;
        })();
        return {
            ...result,
            uuid: oneEle.uuid || result.uuid,
            id: (!isNew && oneEle.id) || null, // 否则就为null
            cutId,
            loop,
            templateId: oneEle.templateId || element.templateId,
            type,
            materialList: genMaterialList(oneEle, false, element).map(value => ({
                ...value,
                id: isNew ? null : value.id
            })),
            renderSetting,
            previewUrl: compatibleVideo(oneEle) || element.previewUrl,
            videoMp4Url: oneEle.videoMp4Url || element.videoMp4Url,
            videoWebmUrl: oneEle.videoWebmUrl || element.videoWebmUrl,
            oriPreviewUrl: oneEle.previewUrl || element.previewUrl,
            coverImg: oneEle.coverImg || element.coverImg
        };
    };

    /**
     * 来自后台的一条party数据
     * @type {{}}
     * @private
     */
    _backOneParty = {};
    partyRenderSetting = {};
    handlerSetting = value => {
        try {
            this._backOneParty = value;
            const party = {
                ...JSON.parse(value.setting),
                renderSetting: JSON.parse(value.renderSetting)
            };
            /**
             * 如果有setting但是setting里面没有elementList
             * 说明是第三版的数据，只保存背景设置后降级到没有setting的分支去
             */
            if (!party.elementList) {
                this.backgroundSetting = { ...party };
                return false;
            }
            const userMarkets = this.UserMarket.filter(v => v.partySort === this._nowIndex);
            this.oriParties[party.uuid] = value.elements;
            let haveChange = false;
            // 拿出真实返回数据的所有的动态元素除了gif
            const partyElementList = lodash.cloneDeep(value.elements);
            // 统计setting 里面动态元素
            const partySettingCount = party.elementList.filter(v => v.visibility !== "hidden")
                .length;
            if (partyElementList[0] && !partyElementList[0].url) {
                console.log("保存数据，需要重新生成");
                haveChange = true;
            }
            if (partySettingCount !== partyElementList.length) {
                haveChange = true;
                console.log(`片段${this._nowIndex + 1}有素材丢失情况。需要重新生成`);
                partyElementList.length = 0; // 清空数组
            }
            this._onPartyElementList = partyElementList;
            this.isSave = true; // 是否是二次进入
            const { isNew } = this;
            const partyRenderSetting = createRenderSetting(party);
            this.partyRenderSetting = partyRenderSetting;
            this.oneParty = {
                ...party,
                id: isNew ? null : value.id, // 片段ID
                uuid: createUUID(),
                playSpeed: 1,
                groupList:
                    (Array.isArray(party.groupList) &&
                        party.groupList.map(item => ({
                            ...item,
                            active: false
                        }))) ||
                    [],
                renderSetting: partyRenderSetting,
                segmentPartyDuration: partyRenderSetting.segmentPartyDuration,
                elementList: party.elementList
                    .map(this.handlerElementFormSetting)
                    .concat(...userMarkets)
                    .filter(v => v),
                haveChange // 都设置为没有改变过
            };
            delete this.oneParty.dataList;
            delete this.oneParty.elements;
            switch (this.oneParty.type) {
                case 1:
                    this.head = this.oneParty;
                    this.oneParty = false;
                    break;
                case 3:
                    this.tail = this.oneParty;
                    this.oneParty = false;
                    break;
                default:
            }
            return true;
        } catch (e) {
            console.log("setting解析失败", value.setting);
            console.log(e);
            return false;
        }
    };

    /**
     * 处理AE模板视频的元素
     * @param value
     * @returns {{materialList: Array, width: number, height: number,
     *  left: number, top: number, id: *, uuid, renderSetting: {},
     *  templateId: *, videoDuration: *, type: *,muted?:boolean,
     *  resolutionH: *, resolutionW: *, previewUrl: *, coverImg: *}}
     */
    handlerElementFormNew = value => {
        if (value.templateType === LAYER_TYPE.img) return;
        const { isNew } = this;
        // 如果有templateId 说明是领取的空白模板
        if (value.templateId) {
            // 大小重置
            let reiszeValue = {
                ...value,
                width: 0,
                height: 0,
                left: 0,
                top: 0
            };
            let type = (value.templateType || LAYER_TYPE.templateVideo) + 2;
            if (value.templateType === LAYER_TYPE.userVideoNew) {
                type = CANVAS_TYPE.userVideoNew;
                value.resolutionH = value.height;
                value.resolutionW = value.width;
                value.height = 0;
                value.width = 0;
                reiszeValue = { ...value };
            }
            const renderSetting = createEleRenderSetting(value);
            return {
                materialList: genMaterialList(value, isNew),
                ...genNewResizeParams(reiszeValue, this.transverse),
                id: value.id,
                uuid: createUUID(),
                renderSetting,
                templateId: value.templateId,
                videoDuration: value.videoDuration,
                type,
                muted: renderSetting.volume === 0,
                resolutionH: value.resolutionH,
                resolutionW: value.resolutionW,
                previewUrl: value.previewUrl,
                coverImg: value.coverImg
            };
        }
        return {
            materialList: genMaterialList(value, isNew),
            ...genNewResizeParams(value, this.transverse),
            id: value.id,
            uuid: createUUID(),
            renderSetting: createEleRenderSetting(value),
            templateId: value.id,
            videoDuration: value.videoDuration,
            type: (value.templateType || LAYER_TYPE.templateVideo) + 2,
            resolutionH: value.resolutionH,
            resolutionW: value.resolutionW,
            previewUrl: value.previewUrl,
            coverImg: value.coverImg
        };
    };

    /**
     * 处理来自没有setting的片段
     * @param value
     * @returns {{id: null, title: (*|string), uuid,
     *  renderSetting: {filter: string, concatSet: {duration: number, concatType: string}},
     *  coverImg: *, segmentId: *, videoDuration: *, playSpeed: number,
     *  oriPlaySpeed: number, resolutionH: *, resolutionW: *, templateType: number,groupList,
     *  haveChange: boolean, segmentPartyDuration: (number|*), elementList: *[]}}
     */
    handlerNewParty = value => {
        const { isNew, _nowIndex: index } = this;
        return {
            id: null,
            title: value.title || `第${index + 1}段`,
            uuid: createUUID(),
            renderSetting: createRenderSetting(value),
            coverImg: value.coverImg,
            segmentId: isNew ? value.id : value.templateId,
            videoDuration: value.videoDuration,
            playSpeed: 1,
            oriPlaySpeed: 1,
            resolutionH: value.resolutionH,
            resolutionW: value.resolutionW,
            templateType: isNew ? 1 : value.templateType,
            haveChange: true,
            segmentPartyDuration: value.segmentPartyDuration || value.videoDuration,
            groupList: [],
            elementList: [
                this.initBackground(value),
                ...(([1, 2].includes(~~this.templateId) && []) ||
                    (value.elements && value.elements.map(this.handlerElementFormNew)) || [
                        {
                            ...this.handlerElementFormNew(value),
                            id: null
                        }
                    ])
            ].filter(v => v)
        };
    };

    /**
     * @desc 初始化背景
     * @param value
     * @returns {{uuid, renderSetting: {},
     *  backgroundColor: string, backgroundImg: null,
     *  videoBackgroundPicOpacity: number, width: number,
     *  height: number, left: number, top: number}}
     */
    initBackground = value => {
        const { backgroundSetting } = this;
        return {
            uuid: createUUID(),
            renderSetting: createEleRenderSetting(value),
            ...genBackground(this.transverse),
            backgroundColor:
                backgroundSetting.backgroundColor ||
                value.backgroundColor ||
                DEFAULT_BACKGROUND_COLOR,
            backgroundImg: backgroundSetting.backgrounImg || value.backgroundImg || null,
            videoBackgroundPicOpacity:
                (backgroundSetting.alpha === 0 ? 0 : backgroundSetting.alpha) || value.alpha === 0
                    ? 0
                    : value.alpha || 1
        };
    };

    UserMarket = [];
    handlerUserMarket = async components => {
        const format = async (item, index) => {
            return await mapToFrontendForUserMarket(item, index, this.multiple);
        };
        this.UserMarket = await Promise.all(components.map(format));
    };

    _nowIndex = 0; // 当前片段的序号
    backgroundSetting = {}; // 用于兼容v3版本的背景数据
    /**
     * @desc 获取片段数据
     * @return {Promise|*}
     */
    getPariesData = async (skipComponents = false) => {
        const obj = this.orginData;
        if (!Array.isArray(obj.segments)) throw new Error("没有片段");
        // 营销组件的处理
        this.skipComponents = skipComponents;
        if (obj.components && obj.components.length > 0 && !skipComponents) {
            await this.handlerUserMarket(obj.components);
        }
        this.parties = obj.segments
            .map((value, index) => {
                this.oneParty = {};
                this._nowIndex = index;
                if (value.setting && this.handlerSetting(value)) {
                    if (!Array.isArray(value.elements)) throw new Error(`片段${index + 1}没有元素`);
                    return this.oneParty;
                }
                return this.handlerNewParty(value);
            })
            .filter(v => v);
        return this.parties;
    };
}

export default MainEditorDataProvider;
