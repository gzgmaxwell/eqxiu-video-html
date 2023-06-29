import { name, host } from "./env";
import subtitlesFonts from "../dataBase/subtitles_fonts";
import flash1 from "../page/static/icon/flash1.png";
import flash2 from "../page/static/icon/flash2.png";
import flash3 from "../page/static/icon/flash3.png";
import flash4 from "../page/static/icon/flash4.png";
import flash5 from "../page/static/icon/flash5.png";
import flash6 from "../page/static/icon/flash6.png";
import flash7 from "../page/static/icon/flash7.png";
import flash8 from "../page/static/icon/flash8.png";
import flash9 from "../page/static/icon/flash9.png";
import flash10 from "../page/static/icon/flash10.png";
import flash11 from "../page/static/icon/flash11.png";
import flash12 from "../page/static/icon/flash12.png";
import flash13 from "../page/static/icon/flash13.png";
import flash14 from "../page/static/icon/flash14.png";
import flash15 from "../page/static/icon/flash15.png";

// 字幕字体列表
export const SUBTITLES_FONTS = subtitlesFonts;
// 用户类型
export const USER_TYPE = {
    SHOWER: 4
};

export const PLATFORM_TYPE = {
    pc: 1,
    ios: 2,
    android: 3,
    all: 4,
    mobile: 5,
    applet: 6
};

export const PLATFORM_NAME = {
    1: { name: "pc" },
    2: { name: "ios" },
    3: { name: "andorid" },
    4: { name: "all" },
    5: { name: "mobile" },
    6: { name: "applet" }
};

export const EDITOR_PRODUCT = {
    main: 1,
    subtitles: 2,
    headTail: 3,
    flash: 4,
    typeMonkey: 5,
    selfieVideo: 210 // APP模板实拍
};

export const UPLOAD_LIMIT = 100;
// 背景图分类ID
export const STATIC_BACKGROUND_CATEGROTY_ID = ["local", "pro", "pre"].includes(name)
    ? [895451, 895450]
    : [894023, 894022];
export const NEW_FUNCTION_GIF = ["pro", "pre"].includes(name)
    ? `${host.musicFile}FqP8Dc3l6WICtgDJVVDgyNVWudN3`
    : `${host.musicFile}FqP8Dc3l6WICtgDJVVDgyNVWudN3`;

// 视频作品总时长 秒
export const MAX_WORKS_DURATION = 1800;
// 最大片段数
export const MAX_PARTY_COUNT = 30;
// 最小转场时长 秒
export const MIN_CONCAT_DURATION = 1;

export const ColorArray = {
    粉色: "#FF79A2",
    红色: "#FF4848",
    紫色: "#5C61FF",
    蓝色: "#00BEFF",
    绿色: "#16E263",
    青色: "#1BC7B1",
    黄色: "#FDE05B",
    橙色: "#FFB243",
    灰色: "#9593A8"
};

export const NoAudioPlay = "没有能播放的音频哦，快去添加吧。";

// 色系类ID
export const ColorLabelId = 3;

export const LABEL_LIST = {
    用途: 1,
    风格: 2,
    色系: 3,
    片段类型: 4,
    片段分类: 5,
    特效字风格: 6,
    特效字用途: 7,
    装饰素材分类: 8,
    平台分类: 9,
    背景: 85,
    背景风格: 1001,
    特效图用途: 1002,
    实拍素材内容: 1003,
    片头片尾: 1132,
    行业: 201,
    节假: 202,
    功能: 203,
    音乐价格: 2000,
    音乐用途: 2100
};

export const AUDIT_STATUS = {
    PASSIVITY_AUDIT: 0,
    INITIATIVE_AUDIT: 1,
    UN_AUDIT: 2,
    PASS: 3,
    NOT_PASS: 4,
    PASSIVITY_AUDIT_REJECT: 5,
    INITIATIVE_AUDIT_REJECT: 6
};

// 审核没通过。。
export const AUDIT_NOT_PASS = 4;
// 驳回待审核。。
export const AUDIT_PASSIVITY_AUDIT_REJECT = 5;
// fileType
export const FILE_TYPE = {
    img: 1,
    audio: 2,
    video: 3
};

// 模板类型
export const SEGMENT_TYPE = {
    SEGMENT_GROUP: 1, // 模板组
    SEGMENT_PARTY: 2, // 片段模板
    SEGMENT_VIDEO: 3, // 视频片段
    VIDEO_GROUP_TEMPLATE: 4, // 作品模板
    SEGMENT_WORD: 201, // 特效字
    SEGMENT_IMAGE: 202, // 特效文字
    SEGMENT_ORNAMENT: 203, // 装饰素材
    SEGMENT_COATING: 204, // 覆层素材
    SEGMENT_BACKGROUND: 205, // 背景素材
    REAL_SHOOT: 206, // 实拍素材
    HEAD_TAIL: 207, // 片头片尾
    VIDEO_HEAD_TAIL: 401, // 片头片尾模板
    APP_VIDEO_IMAGE: 5 // app自拍素材
};
// 模板类型详情
export const SEGMENT_NAME = {
    [SEGMENT_TYPE.SEGMENT_GROUP]: { name: "模板组" },
    [SEGMENT_TYPE.SEGMENT_PARTY]: { name: "片段模板" },
    [SEGMENT_TYPE.SEGMENT_VIDEO]: { name: "视频片段" },
    [SEGMENT_TYPE.VIDEO_GROUP_TEMPLATE]: { name: "作品模板" },
    [SEGMENT_TYPE.SEGMENT_WORD]: { name: "特效字" },
    [SEGMENT_TYPE.SEGMENT_IMAGE]: { name: "特效图" },
    [SEGMENT_TYPE.SEGMENT_ORNAMENT]: { name: "装饰素材" },
    [SEGMENT_TYPE.SEGMENT_BACKGROUND]: { name: "背景素材" },
    [SEGMENT_TYPE.SEGMENT_COATING]: { name: "覆层素材" },
    [SEGMENT_TYPE.REAL_SHOOT]: { name: "视频素材" },
    [SEGMENT_TYPE.HEAD_TAIL]: { name: "AE片头" },
    [SEGMENT_TYPE.VIDEO_HEAD_TAIL]: { name: "作品片头" },
    [SEGMENT_TYPE.APP_VIDEO_IMAGE]: { name: "自拍素材" }
};
// LabelIdList 分类对应id组
export const LABEL_ID_LIST = {
    [SEGMENT_TYPE.APP_VIDEO_IMAGE]: [LABEL_LIST.色系], // 自拍素材
    [SEGMENT_TYPE.SEGMENT_GROUP]: [
        LABEL_LIST.平台分类,
        LABEL_LIST.风格,
        LABEL_LIST.用途,
        LABEL_LIST.色系,
        LABEL_LIST.行业,
        LABEL_LIST.节假,
        LABEL_LIST.功能
    ], // 模板组
    [SEGMENT_TYPE.VIDEO_GROUP_TEMPLATE]: [
        LABEL_LIST.平台分类,
        LABEL_LIST.风格,
        LABEL_LIST.用途,
        LABEL_LIST.色系,
        LABEL_LIST.行业,
        LABEL_LIST.节假,
        LABEL_LIST.功能
    ], // 作品模板
    [SEGMENT_TYPE.SEGMENT_PARTY]: [LABEL_LIST.片段分类, LABEL_LIST.风格, LABEL_LIST.色系], // 片段
    [SEGMENT_TYPE.SEGMENT_VIDEO]: [
        LABEL_LIST.平台分类,
        LABEL_LIST.片段分类,
        LABEL_LIST.风格,
        LABEL_LIST.色系
    ], // 视频片段
    [SEGMENT_TYPE.SEGMENT_WORD]: [LABEL_LIST.特效字风格, LABEL_LIST.特效字用途, LABEL_LIST.色系], // 特效字
    [SEGMENT_TYPE.SEGMENT_IMAGE]: [LABEL_LIST.色系, LABEL_LIST.特效图用途], // 特效图
    [SEGMENT_TYPE.SEGMENT_ORNAMENT]: [LABEL_LIST.风格, LABEL_LIST.色系],
    [SEGMENT_TYPE.SEGMENT_COATING]: [LABEL_LIST.风格, LABEL_LIST.色系],
    [SEGMENT_TYPE.SEGMENT_BACKGROUND]: [LABEL_LIST.背景风格],
    [SEGMENT_TYPE.REAL_SHOOT]: [LABEL_LIST.实拍素材内容],
    [SEGMENT_TYPE.HEAD_TAIL]: [LABEL_LIST.片头片尾],
    [SEGMENT_TYPE.VIDEO_HEAD_TAIL]: [LABEL_LIST.片头片尾]
};
// 工作区类型
export const CANVAS_TYPE = {
    background: 0, // 背景
    text: 1, // 文字
    img: 2, // 图片
    templateVideo: 3, // 模板视频
    userVideo: 4, // 用户视频
    userVideoNew: 55, // 新用户视频
    specialText: 201, // 特效字
    spacialImg: 202, // 特效图
    ornament: 203, // 装饰素材
    artFont: 1001, // 艺术字
    sticker: 1002, // 贴纸
    clad: 204, // 覆层
    dynamicBg: 205, // 动态背景
    gif: 101, // gif
    svg: 1001,
    realShoot: 206, // 实拍素材
    headTail: 51, // 片头片尾
    animateFont: 1003, // 动画字
    animateImg: 1004, // 动画图
    userMarket: 1200 // 营销组件
};

// 工作区视频类型列表
export const WorkspaceTextType = [
    CANVAS_TYPE.text,
    CANVAS_TYPE.animateFont,
    CANVAS_TYPE.artFont,
];
// 工作区类型中文名字
export const CANVAS_TYPE_NAME = {
    [CANVAS_TYPE.background]: "背景",
    [CANVAS_TYPE.text]: "文字",
    [CANVAS_TYPE.img]: "图片",
    [CANVAS_TYPE.templateVideo]: "模板视频",
    [CANVAS_TYPE.userVideo]: "用户视频",
    [CANVAS_TYPE.specialText]: "特效字",
    [CANVAS_TYPE.spacialImg]: "特效图",
    [CANVAS_TYPE.ornament]: "装饰",
    [CANVAS_TYPE.artFont]: "艺术字",
    [CANVAS_TYPE.animateFont]: "动画字",
    [CANVAS_TYPE.animateImg]: "动画图",
    [CANVAS_TYPE.clad]: "覆层",
    [CANVAS_TYPE.dynamicBg]: "动态背景",
    [CANVAS_TYPE.gif]: "动图",
    [CANVAS_TYPE.realShoot]: "视频素材",
    [CANVAS_TYPE.userMarket]: "营销组件"
};

// 艺术字类型
export const ART_TEXT_TYPE = {
    shadow: 0, // 阴影文字
    gradient: 1, // 渐变文字
    cube: 2, // 立体文字
    stroke: 3, // 描边立体文字
    shake: 4, // 颤抖文字
    chartlet: 5, // 贴图文字
    normal: 6, // 常规文字
    scribble: 7 // 描边文字
};

// 需要设置时间点的视频类型列表
export const TimeSetVideoType = Object.values(CANVAS_TYPE).filter(
    i =>
        ![
            CANVAS_TYPE.dynamicBg,
            CANVAS_TYPE.clad,
            CANVAS_TYPE.background,
            CANVAS_TYPE.headTail,
            CANVAS_TYPE.userMarket
        ].includes(i)
);
//     [
//     CANVAS_TYPE.userVideo,
//     CANVAS_TYPE.templateVideo,
//     CANVAS_TYPE.specialText,
//     CANVAS_TYPE.spacialImg,
//     CANVAS_TYPE.ornament,
//     CANVAS_TYPE.gif,
//     CANVAS_TYPE.text,
//     CANVAS_TYPE.img,
//     CANVAS_TYPE.artFont,
//     CANVAS_TYPE.animateFont,
//     CANVAS_TYPE.animateImg,
//     CANVAS_TYPE.realShoot,
//     CANVAS_TYPE.sticker,
//     CANVAS_TYPE.userVideoNew,
// ];

/**
 * 需要非自定义才参数时长的类型
 * @type {number[]}
 */
export const CustomSetTimerType = [
    CANVAS_TYPE.artFont,
    CANVAS_TYPE.img,
    CANVAS_TYPE.text,
    CANVAS_TYPE.animateFont,
    CANVAS_TYPE.animateImg
];

// 工作区视频类型列表
export const WorkspaceVideoType = [
    CANVAS_TYPE.userVideo,
    CANVAS_TYPE.templateVideo,
    CANVAS_TYPE.specialText,
    CANVAS_TYPE.spacialImg,
    CANVAS_TYPE.ornament,
    CANVAS_TYPE.clad,
    CANVAS_TYPE.dynamicBg,
    CANVAS_TYPE.gif,
    CANVAS_TYPE.realShoot,
    CANVAS_TYPE.headTail,
    CANVAS_TYPE.userVideoNew
];
// 视频系统的type
export const LAYER_TYPE = {
    templateVideo: 1, // 正版视频
    userVideo: 2, // 用户视频
    img: 3, // 图片
    specialText: 201, // 特效字
    spacialImg: 202, // 特效图
    ornament: 203, // 装饰
    clad: 204, // 遮罩
    dynamicBg: 205, // 动态背景
    gif: 101, // gif
    realShoot: 206,
    headTail: 51,
    animationFont: 52, // 动画
    animationImg: 53, // 动画
    userVideoNew: 55 // 中台用户类型
};

// 需要设置时间点的图层类型列表
export const TimeSetLayerType = [
    LAYER_TYPE.userVideo,
    LAYER_TYPE.templateVideo,
    LAYER_TYPE.specialText,
    LAYER_TYPE.spacialImg,
    LAYER_TYPE.ornament,
    LAYER_TYPE.gif,
    LAYER_TYPE.realShoot,
    LAYER_TYPE.animationFont,
    LAYER_TYPE.animationImg
];

export const DEFAULT_ELE_BACKGROUND_COLOR = "rgba(255,255,255,0)";

// 视频系统的type
export const TEMPLATE_STATUS = {
    rendering: 2,
    render_failed: 3,
    not_apply: 4,
    applying: 5,
    apply_failed: 6,
    apply_successful: 7
};

export const VIDEO_TYPE = {
    ...LAYER_TYPE
};
export const HASH_TYPE = {
    [VIDEO_TYPE.templateVideo]: CANVAS_TYPE.templateVideo,
    [VIDEO_TYPE.userVideo]: CANVAS_TYPE.userVideo,
    [VIDEO_TYPE.specialText]: CANVAS_TYPE.specialText,
    [VIDEO_TYPE.spacialImg]: CANVAS_TYPE.spacialImg,
    [VIDEO_TYPE.ornament]: CANVAS_TYPE.ornament,
    [VIDEO_TYPE.clad]: CANVAS_TYPE.clad,
    [VIDEO_TYPE.dynamicBg]: CANVAS_TYPE.dynamicBg,
    [VIDEO_TYPE.gif]: CANVAS_TYPE.gif,
    [VIDEO_TYPE.realShoot]: CANVAS_TYPE.realShoot,
    [VIDEO_TYPE.headTail]: CANVAS_TYPE.headTail,
    [VIDEO_TYPE.userVideoNew]: CANVAS_TYPE.userVideoNew,
    [VIDEO_TYPE.animationFont]: CANVAS_TYPE.animateFont,
    [VIDEO_TYPE.animationImg]: CANVAS_TYPE.animateImg
};
// 默认封面
export const DEFAULT_COVER_PIC = {
    hoz: "//res6.eqh5.com/Fq9Gpy9OzlhLfz_uwEBZDbPsAkux",
    ver: "//res6.eqh5.com/FlvNM76EEhLp7LX-Ht_L341VcyAT"
};

// 工作区大小
export const WORKSPACE_SIZE = {
    l: 560,
    s: 315
};
// 左侧片段列表缩略图大小
export const LEFT_PARTY_SIZE = {
    l: 98,
    s: 57,
    activeL: 136,
    activeS: 77
};
// 默认图片宽度
export const DEFAULT_WORKSPACE_IMG_HEIGHT = 172;
// 移动步进
export const WORKSPACE_MOVE_STEP = 1;
// 默认工作板背景色
export const DEFAULT_BACKGROUND_COLOR = "#FFFFFF";
// 普清分辨率
export const NORMAL_RESOLUTION = {
    hoz: {
        x: 640,
        y: 360
    },
    ver: {
        x: 376,
        y: 668
    }
};
// 高清分辨率
export const HD_RESOLUTION = {
    hoz: {
        x: 1280,
        y: 720
    },
    ver: {
        x: 750,
        y: 1334
    }
};
// 编辑器zIndex 起始值；
export const WORKSPACE_Z_INDEX = 520;
// 用户引导模板ID 线上和预发布不同
export const NOOD_GUIDE_TEMPLATE_ID = ["pro", "pre"].includes(name) ? 2406 : 1574;
// 最小视频时长(秒)
export const LIMIT_VIDEO_DURATION = 0.2;
// 默认字体
export const DEFAULT_FONT_FAMLIY = "fangzheng_htjt";
//默认动画字体
export const DEFAULT_ANIMATE_FONT_FAMILY = "ZhankuxiaoweiLOGOti";
// 空白图片
export const BLANK_PARTY = {
    hoz: "FjvBYs3vQMGAwAttKMCUolJmIIc6",
    ver: "Fo3b_5QlEsvbY983JIEUWntT6CdA"
};
// 空白视频，用来控制空白模板的播放
export const BLANK_VIDEO = ["pre", "pro"].includes(name)
    ? "//video-1251586368.file.myqcloud.com/tencent/0/blank.aac"
    : "//video-test-1251586368.file.myqcloud.com/tencent/0/blank.aac";
export const SUB_BLANK_PIC = {
    hoz: "//res6.eqh5.com/FuTaqQlC4pvP3c-xqP7yaApSYfrH",
    ver: "//res6.eqh5.com/Fr9L4w8Z_OG1zMEhXkCgXMZKjKIo"
};
// 最小片段时长
export const MIN_CONCAT_TIME = 1000;
export const MIN_NO_CONCAT_TIME = 200;

// 字幕编辑区大小
export const SUBTITLES_TRANSVERSE_W = 752;
export const SUBTITLES_W = 237.94;
export const SUBTITLES_H = 423;
export const BOTTOM_HEIGHT = 207;
export const TOP_HEIGHT = 57;

// 最小字幕时间
export const SUBTITLES_MIN_DURATION = 200;

// 改变后需要重新绘图的元素属性
export const ELEMENT_PARAMS = [
    "type",
    "content",
    "width",
    "height",
    "padding",
    "fontFamily",
    "fontSize",
    "color",
    "borderColor",
    "borderWidth",
    "borderStyle",
    "textAlign",
    "textAlignLast",
    "lineHeight",
    "letterSpacing",
    "fontStyle",
    "textDecoration",
    "fontWeight",
    "artJson",
    "backgroundColor",
    "url",
    "opacity"
];

// 上传视频格式
export const UPLOAD_VIDEO_FORMAT = [
    {
        type: "video",
        format: "mp4", // ok
        filesSuffix: "mp4"
    },
    {
        type: "video",
        format: "quicktime", // ok
        filesSuffix: "mov"
    },
    {
        type: "video",
        format: "avi", // ok
        filesSuffix: "avi"
    },
    {
        type: "video",
        format: "x-ms-wmv", // ok
        filesSuffix: "wmv"
    },
    {
        type: "video",
        format: "*",
        filesSuffix: "mkv"
    },
    {
        type: "video",
        format: "3gpp", // ok
        filesSuffix: "3gp"
    },
    {
        type: "video",
        format: "mpeg", // ok
        filesSuffix: "peg"
    },
    {
        type: "video",
        format: "*",
        filesSuffix: "flv"
    },
    {
        type: "video",
        format: "*",
        filesSuffix: "f4v"
    }
];
// 组件名称
export const COMPONENT_TYPE = {
    specialEffectText: "1" // 特效字
};
export const VOICE_JSON = [
    {
        name: "职业女生",
        id: 0,
        voice_name: "xiaoyan",
        voiceSpeed: 40, // 50正常速度
        voiceVolume: 56, // 50正常速度
        voiceHight: 48 // 50正常速度
    },
    {
        name: "干练女声",
        id: 1,
        voice_name: "aisxping",
        voiceSpeed: 50, // 50正常速度
        voiceVolume: 56, // 50正常速度
        voiceHight: 55 // 50正常速度
    },
    {
        name: "欢快女声",
        id: 2,
        voice_name: "aisbabyxu",
        voiceSpeed: 50, // 50正常速度
        voiceVolume: 56, // 50正常速度
        voiceHight: 55 // 50正常速度
    },
    {
        name: "青年女声",
        id: 3,
        voice_name: "aisjinger",
        voiceSpeed: 55, // 50正常速度
        voiceVolume: 56, // 50正常速度
        voiceHight: 57 // 50正常速度
    },
    {
        name: "青年男声",
        id: 4,
        voice_name: "aisjiuxu",
        voiceSpeed: 46, // 50正常速度
        voiceVolume: 56, // 50正常速度
        voiceHight: 40 // 50正常速度
    }
];

export const VIDEO_COLOR = [
    {
        value: 0,
        url: flash1
    },
    {
        value: 1,
        url: flash2
    },
    {
        value: 2,
        url: flash3
    },
    {
        value: 3,
        url: flash4
    },
    {
        value: 4,
        url: flash5
    },
    {
        value: 5,
        url: flash6
    },
    {
        value: 6,
        url: flash7
    },
    {
        value: 7,
        url: flash8
    },
    {
        value: 8,
        url: flash9
    },
    {
        value: 9,
        url: flash10
    },
    {
        value: 10,
        url: flash11
    },
    {
        value: 11,
        url: flash12
    },
    {
        value: 12,
        url: flash13
    },
    {
        value: 13,
        url: flash14
    },
    {
        value: 14,
        url: flash15
    }
];

export const byReason = {
    // 通过原因
    passed: 1, // 通过
    refuse: 0 // 拒绝
};

export const TYPE_EDITOR = {
    subtitlesEditor: {
        position: "字幕编辑",
        editor: "subtitlesEditor"
    },
    flashEditor: {
        position: "一键快闪",
        editor: "flashEditor"
    },
    typeMonkeyEditor: {
        position: "字说字话编辑器",
        editor: "typeMonkeyEditor"
    },
    editor: {
        position: "主编辑器",
        editor: "editor"
    }
};
export const AD_TIME = {
    // oneDay: 86400000, // 一天时间
    oneDay: name === "test" ? 30000 : 86400000, // 30s 测试时间
    sevenDay: 604800000 // 1000*60*60*24*7; 7天
};

export const XIU_DIAN = {
    type: "5", // 可选，商品类型，消耗优惠券
    orderAppId: 1300,
    productCode: "P010011", // 用户
    orderType: "PAYXB"
};
export const VIDEO_RENDER_TYPE = {
    SDWaterMark: 201, // 标清有水印
    SDNoWaterMark: 202, // 标清无水印
    HDNoWaterMark: 203 // 高清无水印
};

export const RENDER_STATUS = {
    success: 4, // 生成成功
    fail: 3, // 生成失败
    rendering: 2, // 正在渲染中
    init: 1,
    cancelRendering: 5 // 取消渲染
};

export const VIDEO_RENDER_NAME = {
    [VIDEO_RENDER_TYPE.SDWaterMark]: {
        name: "标清有水印"
    },
    [VIDEO_RENDER_TYPE.SDNoWaterMark]: {
        name: "标清无水印"
    },
    [VIDEO_RENDER_TYPE.HDNoWaterMark]: {
        name: "高清无水印"
    }
};
export const PAY_STATUS = {
    pay: "pay", // 购买
    done: "done", // 生成成功
    rendering: "rending", // 正在渲染中
    render: "render" // 可以渲染
};

export const OPEN_FROM = {
    longPage: "collect-platform", // 来自长页面
    H5: "H5" // 来自H5
};
export const SHARE_OPTIONS = {
    title: [
        {
            title: "作品标题",
            value: 1,
            content: "直接取作品的标题作为微信分享的标题",
            forbidden: true
        },
        {
            title: "自定义",
            value: 2,
            content: "#分享者#大力推荐",
            forbidden: false
        },
        {
            title: "我是#分享者#",
            value: 3,
            content: "这是我用易企秀制作的视频，你也来试试吧",
            forbidden: false
        },
        {
            title: "我是第X位",
            value: 4,
            content: "分享的人，你也一起来吧!",
            forbidden: false
        },
        {
            title: "我是#分享者#,我是第X位",
            value: 5,
            content: "分享的人，你也一起来吧!",
            forbidden: false
        }
    ],
    description: [
        {
            title: "作品描述",
            value: 1,
            content: "直接取作品的描述作为微信分享的描述",
            forbidden: true
        },
        {
            title: "自定义",
            value: 2,
            content: "这是#分享者#大力推荐的易企秀视频",
            forbidden: false
        },
        {
            title: "我是#分享者#",
            value: 3,
            content: "这是我用易企秀制作的视频，你也来试试吧",
            forbidden: false
        },
        {
            title: "我是第X位",
            value: 4,
            content: "分享的人，你也一起来吧!",
            forbidden: false
        },
        {
            title: "我是#分享者#,我是第X位",
            value: 5,
            content: "分享的人，你也一起来吧!",
            forbidden: false
        }
    ],
    coverImg: [
        {
            title: "作品封面",
            value: 1
        },
        {
            title: "自定义",
            value: 2
        },
        {
            title: "微信头像",
            value: 3
        }
    ]
};
