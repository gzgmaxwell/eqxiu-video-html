/**
 * 用于生成编辑器的通用数据
 */
import {
    ART_TEXT_TYPE,
    DEFAULT_BACKGROUND_COLOR,
    DEFAULT_FONT_FAMLIY, WORKSPACE_SIZE,
} from '../config/staticParams';

/**
 * 生成默认背景对象
 * @param transverse 是否为横板
 * @returns {{backgroundColor: string, backgroundImg: null, videoBackgroundPicOpacity: number, width: number, height: number, left: number, top: number}}
 */
export function genBackground(transverse) {
    return {
        backgroundColor: DEFAULT_BACKGROUND_COLOR,
        backgroundImg: null,
        videoBackgroundPicOpacity: 1,
        width: transverse ? WORKSPACE_SIZE.l : WORKSPACE_SIZE.s,
        height: transverse ? WORKSPACE_SIZE.s : WORKSPACE_SIZE.l,
        left: 0,
        top: 0,
    };
}


/**
 * 生成素材数组
 * @param obj 接受到的数组
 * @param isNew 是否是新视频
 * @returns {Array}
 */
export const genMaterialList = (backValue, isNew = true, v = {}) => {
    const materialList = [];
    if (v.materialList) {
        v.materials = v.materialList;
    }
    const value = Array.isArray(backValue.materials) && backValue.materials.length > 0 &&
        backValue || v;
    Array.isArray(value.materials) && value.materials.forEach((item, index) => {
        if (isNew && item.replaceable === false) return;
        let one = {
            ...item,
            id: isNew ? null : item.id,
            videoTemplateMaterialId: (isNew
                ? item.id
                : item.videoTemplateMaterialId) ||
            item.videoTemplateMaterialId,
            materialType: item.type || item.materialType,
            type: item.type || item.materialType,
            replaceContent: (isNew ? (item.type === 1
                ? item.content
                : item.ossUrl) : item.replaceContent) || item.replaceContent,
        };
        if (v.materialList && v.materialList[index]) {
            one = { ...v.materialList[index], ...one };
        }
        one.id = isNew ? null : item.id;
        materialList.push(one);
    });
    // 去重
    const videoTemplateMaterialIds = new Set();
    return materialList.filter(v => {
        if (!v || videoTemplateMaterialIds.has(v.videoTemplateMaterialId)) {
            return false;
        } else {
            videoTemplateMaterialIds.add(v.videoTemplateMaterialId);
            return true;
        }
    });
    // return materialList;
};

export const getDataList = (parties, nowIndex) => (parties[nowIndex] || {}).elementList || [];


export const defaultTextStyle = {
    width: 315,
    height: 21,
    left: 0,
    rotate: 0,
    padding: 0,
    fontFamily: DEFAULT_FONT_FAMLIY,
    fontSize: 14,
    color: 'rgba(0,0,0,1)',
    borderColor: 'rgba(0,0,0,1)',
    borderStyle: 'unset',
    borderWidth: 0,
    textAlign: 'center',
    textAlignLast: 'center',
    lineHeight: 1.5,
    letterSpacing: 0,
    fontStyle: 'normal',
    textDecoration: 'none',
    fontWeight: 'normal',
};

export const defaultSubTitleStyle = {
    width: 108,
    height: 27,
    rotate: 0,
    padding: 0,
    fontFamily: 'fangzheng_htjt',
    fontSize: 18,
    color: 'rgba(255,255,255,1)',
    borderColor: 'rgba(0,0,0,1)',
    borderStyle: 'unset',
    borderWidth: 0,
    textAlign: 'left',
    textAlignLast: 'left',
    lineHeight: 1.5,
    letterSpacing: 0,
    fontStyle: 'normal',
    textDecoration: 'none',
    fontWeight: 'normal',
    wordBreak: 'normal',
    artJson: {
        type: ART_TEXT_TYPE.scribble,
        angle: 45,
        shadow: {
            color: '#000000',
            h: 0,
            v: 0,
            blur: 0,
        },
        stroke: {
            size: 1,
            color: '#000000',
        },
    },
};
