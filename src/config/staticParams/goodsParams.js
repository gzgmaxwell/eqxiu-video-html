import origin from '../../../src/page/static/cut/origin.png';
import originActive from '../../../src/page/static/cut/originActive.png';
import custom from '../../../src/page/static/cut/custom.png';
import customActive from '../../../src/page/static/cut/customActive.png';
import ver from '../../../src/page/static/cut/ver.png';
import verActive from '../../../src/page/static/cut/verActive.png';
import hoz from '../../../src/page/static/cut/hoz.png';
import hozActive from '../../../src/page/static/cut/hozActive.png';
import isometric from '../../../src/page/static/cut/isometric.png';
import isometricActive from '../../../src/page/static/cut/isometricActive.png';
export const RENDER_VIDEO_GOODS_ID = {
    sd: 10157,
    hd: 10161,
};

/**
 * @create by Andy
 * WorkSpace:来自我的作品 ; editorSpace 编辑器
 */

export const POS_FROM = {
    workSpace: 'workSpace',
    editorSpace: 'editorSpace',
}

/**
 * @create by Andy
 * WorkSpace:来自我的作品 ; editorSpace 编辑器
 */

export const TYPE_PAGE = {
    download: 'download',
    share: 'share',
    implant: 'implant',
    promote: 'promote', // 新媒体互动推广
}

export const TYPE_BTN = {
    vipRenewals: '会员续费',
};

export const TYPE_SCROLL_INPUT = {
    mm_ss: 1, // 原比例
    line_height: 2,
}

export const TYPE_RATIO = {
    origin: 1, // 原比例
    custom: 2, // 自定意比例
    ver: 3, // 竖版9:16
    hoz: 4, // 横版
    isometric: 5, // 1:1
}
export const cutJson = {
    id: 2969,
    ratioType: 1,
    positionX: 0,
    positionY: 0,
    height: 960,
    width: 544,
    isSave: 1,
    videoParams: [
        {
            startTime: 0,
            endtime: 2,
        },
        {
            startTime: 1,
            endtime: 3,
        },
        {
            startTime: 5,
            endtime: 8,
        },
    ],
}
export const videoRatioObj = [
    {
        title: '原比例',
        icon: origin,
        iconActive: originActive,
        typeRatio: TYPE_RATIO.origin,
    },
    {
        title: '自定义',
        icon: custom,
        iconActive: customActive,
        typeRatio: TYPE_RATIO.custom,
    },
    {
        title: '9:16',
        icon: ver,
        iconActive: verActive,
        typeRatio: TYPE_RATIO.ver,
    },
    {
        title: '16:9',
        icon: hoz,
        iconActive: hozActive,
        typeRatio: TYPE_RATIO.hoz,
    },
    {
        title: '1:1',
        icon: isometric,
        iconActive: isometricActive,
        typeRatio: TYPE_RATIO.isometric,
    },
]
const isMyMac = /mac/.test(navigator.platform.toLocaleLowerCase())

const isCtr = isMyMac ? 'Command' : 'Ctrl';
export const TYPE_RENDER_IN_BODY = {
    videoCuts: 1, // 视频裁剪
    shortcuts: 2, // 快捷键
}
export const TYPE_SHORTCUTS = {
    keyboardBase: [
        {
            name: '元素适应画布',
            shortcuts: `${isCtr} + Alt + F`,
        },
        {
            name: '复制',
            shortcuts: `${isCtr} + C`,
        },
        {
            name: '剪切',
            shortcuts: `${isCtr} + X`,
        },
        {
            name: '粘贴',
            shortcuts: `${isCtr} + V`,
        },
        {
            name: '删除',
            shortcuts: 'Delete',
        },
    ],
    keyboardFn: [
        {
            name: '多选',
            shortcuts: `按住${isCtr}进行多选/直接框选`,
        },
        {
            name: '片段预览',
            shortcuts: '空格/点击预览按钮',
        },
        {
            name: '保存',
            shortcuts: `${isCtr} + S`,
        },
        {
            name: '撤销',
            shortcuts: `${isCtr} + Z`,
        },
    ],
    keyboardMove: [
        {
            name: '上移',
            shortcuts: 'eqf-arrow-up',
        },
        {
            name: '下移',
            shortcuts: 'eqf-arrow-down',
        },
        {
            name: '左移',
            shortcuts: 'eqf-arrow-left',
        },
        {
            name: '右移',
            shortcuts: 'eqf-arrow-right',
        },
    ],
}
