import { routerRedux } from 'dva/router';
import {
    CANVAS_TYPE,
    DEFAULT_COVER_PIC,
    EDITOR_PRODUCT,
    SUB_BLANK_PIC, VIDEO_COLOR,
} from '../config/staticParams';
import {
    createEleRenderSetting,
    createUUID,
    getCommonTextStyles,
    getImageStyles,
    getTextStyles,
} from '../util/data';
import { flashVideoSubmit, getMaterial, splitWord, wechatSetting } from '../api/userVideo';
import { genBackground } from '../services/editorData';
import { getMyFont } from '../api/user';
import { addGlobalStyle } from '../util/doc';
import { animateColors, animateFontFamily, bgms } from '../dataBase/animations';
import { randomValue } from '../util/util';
import { message } from 'antd';
import { host, version } from 'Config/env';
import { decodeMusic } from '../util/file';
import { prev } from '../config/env';

export default {
    namespace: 'flash',
    state: {
        id: null,
        transverse: true, // 横竖板
        coverImg: null, // 封面图
        title: null, // 视频标题
        worksId: null,
        dataList: {}, // 插入的文字素材对象，key是uuid，value是文字素材的样式数据
        uuidSort: [], // 已添加片段的uuid数组
        haveChange: false,
        videoDescribe: null, // 视频描述
        isLoading: false,
        oldSegments: {}, // 编辑时存放旧的数据
        systemTailLeaderOn: true, // 是否有默认水印
        fontFamily: '', // 随机的字体
        music: {},
        status: null,
        speed: 2, // 快闪节奏
        colorTypes: [], // 视频配色（可多选）
        updateStates: false, //更新状态 调去裁剪方法
        updateUuid: null,
        uploadPhoneTokenObj: {}, //upload token
        submitVer: 1,
        shareSet: null, // 流量主分享
    },
    effects: {
        // 初始化视频数据
        * init({ payload: { type, worksId = null } }, { put, select, call }) {
            yield put.resolve({
                type: 'reset',
            });
            yield put.resolve({
                type: 'editor/reset',
            });
            yield put.resolve({
                type: 'save',
                payload: {
                    isLoading: true,
                    lockLoading: true,
                },
            });
            // 获取随机的字体
            let fontFamily = randomValue(Object.keys(animateFontFamily));
            // 判断是编辑还是新增
            if (worksId) {
                const { data: { success = false, obj } } = yield call(getMaterial, worksId);
                // const newObj = obj.videoFlash.colorTypes.map(Number)
                // const formatNewObj = newObj.length > VIDEO_COLOR.length ? newObj.slice(0, VIDEO_COLOR.length) : newObj;
                if (!success) return false;
                const { segments, ver, status, bgm = '', ...others } = obj || {};
                if (!segments || !segments[0] || !segments[0].setting) return false;
                try {
                    // 保留之前的数据，保存或者生产视频时进行对比
                    const oldSegments = {};
                    const dataList = {};
                    const uuidSort = [];
                    // 根据已有数据生成flash格式的数据fontFamily
                    segments.forEach(item => {
                        const settingObj = JSON.parse(item.setting);
                        settingObj.uuid = settingObj.uuid || createUUID();
                        oldSegments[settingObj.uuid] = settingObj;
                        uuidSort.push(settingObj.uuid);
                        fontFamily = settingObj.fontFamily || fontFamily;
                        dataList[settingObj.uuid] = {
                            id: item.id,
                            activeStatus: false,
                            flash_content: settingObj.flash_content, // 文字的内容或图片的地址
                            flash_type: Number(settingObj.flash_type), // 片段的类型
                            flash_oriContent: settingObj.flash_oriContent, // 图片的原始地址
                        };
                    });
                    if (!obj.videoFlash) {
                        obj.videoFlash = {
                            colorTypes: [
                                '0',
                                '1',
                                '2',
                                '3',
                                '4',
                                '5',
                                '6',
                                '7',
                                '8',
                                '9',
                                '10',
                                '11',
                                '12',
                                '13',
                                '14'],
                            speed: 2,
                        };
                    }
                    yield put.resolve({
                        type: 'save',
                        payload: {
                            music: {
                                ...decodeMusic(bgm),
                                volume: 100,
                            },
                            status,
                            fontFamily,
                            ...others,
                            dataList,
                            uuidSort,
                            worksId,
                            systemTailLeaderOn: obj.systemTailLeaderOn,
                            oldSegments,
                            speed: obj.videoFlash.speed,
                            colorTypes: Array.from(new Set(obj.videoFlash.colorTypes.map(Number))),
                            bgm: obj.bgm,
                            submitVer: obj.ver,
                        },
                    });
                    yield put.resolve({
                        type: 'editor/save',
                        payload: {
                            saveVersion: ver,
                        },
                    });
                } catch (e) {
                    return false;
                }
            } else {

                yield put.resolve({
                    type: 'save',
                    payload: {
                        //随机的音乐
                        music: {
                            name: 'BGM',
                            url: host.font2 + randomValue(bgms),
                            volume: 100,
                        },
                        fontFamily,
                        templateId: type,
                        title: '我制作的快闪视频',
                        videoDescribe: '我使用易企秀一键快闪制作了一个视频，快来看看吧~',
                        coverImg: type === 1 ? DEFAULT_COVER_PIC.hoz : DEFAULT_COVER_PIC.ver,
                        transverse: type === 1,
                        systemTailLeaderOn: true,
                    },
                });
            }
            //下载随机的字体
            getMyFont()
                .then(({ data: { list = [] } }) => {
                    const { font_family, woff_path, authedttf_path } =
                        list.find(f => f.font_family === fontFamily) || {};
                    if (font_family) {
                        addGlobalStyle(font_family, woff_path || authedttf_path, true);
                    }
                });
            yield put.resolve({
                type: 'save',
                payload: {
                    isLoading: false,
                    lockLoading: false,
                },
            });
        },
        // 插入内容
        * insert({ payload: { type = CANVAS_TYPE.text, content = null } }, { put, select }) {
            const { dataList, uuidSort } = yield select(
                ({ flash }) => flash);
            const uuid = createUUID();
            dataList[uuid] = {
                activeStatus: false,
                flash_content: content, // 文字的内容或图片的地址
                flash_type: type, // 片段的类型
                flash_oriContent: content, // 图片的原始地址
            };
            uuidSort.push(uuid);
            yield put.resolve({
                type: 'save',
                payload: {
                    dataList,
                    uuidSort,
                    haveChange: true,
                },
            });
            return uuid;
        },
        //点击激活当前片段
        * activeStatus({ payload: { uuid, type = null } }, { put, select }) {
            const { dataList } = yield select(({ flash }) => flash);
            for (let i in dataList) {
                dataList[i].activeStatus = false;
                if (i === uuid && 'remove' !== type) {
                    dataList[i].activeStatus = true;
                }
            }
            yield put.resolve({
                type: 'save',
                payload: {
                    dataList,
                    haveChange: true,
                },
            });
        },
        * removeActiveStatus({ payload }, { put, call }) {
            yield put.resolve({
                type: 'activeStatus',
                payload: {
                    type: 'remove',
                },
            });

        },
        //保存手机上传token
        * savePhoneToken({ payload: { uploadPhoneTokenObj = {} } }, { put, call }) {
            yield put.resolve({
                type: 'save',
                payload: {
                    uploadPhoneTokenObj,
                },
            });

        },
        //点击我的图片新增或替换当前片段内容
        * updatePictures({ payload: { type = CANVAS_TYPE.img, content = null, update = false } }, { put, call, select }) {
            const { dataList, uuidSort } = yield select(({ flash }) => flash);
            const list = Object.values(dataList);
            //被替换片段uuid
            let uuid = null;
            let isActive = false;
            for (let key in dataList) {
                if (dataList[key].activeStatus) {
                    uuid = key;
                    isActive = true;
                    break;
                }
            }
            yield put.resolve({
                type: 'save',
                payload: {
                    updateStates: update,
                    updateUuid: uuid,
                },
            });
            //是否激活判断
            if (isActive) {
                //替换当前片段内容
                yield put.resolve({
                    type: 'changeNow',
                    payload: {
                        uuid,
                        flash_type: type,
                        flash_content: content,
                    },
                });
            } else {
                //未激活 新增片段
                yield put.resolve({
                    type: 'insert',
                    payload: {
                        type,
                        content,
                    },
                });
            }


        },
        // 修改字幕数据
        * changeNow({ payload: { uuid, ...payload } }, { put, select }) {
            const { dataList } = yield select(({ flash }) => flash);
            const preData = dataList[uuid];
            if (!preData) return;
            dataList[uuid] = {
                ...preData,
                ...payload,
            };
            yield put.resolve({
                type: 'save',
                payload: {
                    dataList,
                    haveChange: true,
                },
            });
            return '修改文字完毕';
        },
        // 删除某一条数据
        * delete({ payload }, { put, select }) {
            const { dataList, uuidSort } = yield select(({ flash }) => flash);
            delete dataList[payload];
            const findIndex = uuidSort.findIndex(item => item === payload);
            uuidSort.splice(findIndex, 1);
            yield put.resolve({
                type: 'save',
                payload: {
                    dataList,
                    uuidSort,
                    haveChange: true,
                },
            });
        },
        // 保存数据，处理数据成主编辑器格式
        * saveOrRender({ payload }, { call, select, put }) {
            const { onlySave } = payload;
            const {
                dataList, uuidSort, oldSegments, transverse, coverImg, title, worksId, bgm, submitVer,
                haveChange, videoDescribe, templateId, fontFamily, music, systemTailLeaderOn, colorTypes, speed, shareSet
            } = yield select(({ flash }) => (flash));
            if (uuidSort.length < 1) {
                message.error('请至少添加一个片段');
                return;
            }
            const parties = [];
            const contentArr = uuidSort.map(key => {
                const { flash_content, flash_type } = dataList[key];
                if (flash_type === CANVAS_TYPE.img) { // 图片
                    return '这是一个图片';
                }
                return (flash_content || '这是一段文本').trim();
            });
            // 取出每一段文案，组成新的数组
            const segments = uuidSort.map(key => {
                const { flash_content, flash_type, id = null } = dataList[key];
                if (flash_type === CANVAS_TYPE.img) { // 图片
                    return {
                        id,
                        title: flash_content,
                        type: 2,
                    };
                }
                return {
                    id,
                    title: (flash_content && flash_content.trim() || '这是一段文本'),
                    type: 1,
                };
            });
            const params = {
                coverImg,
                id: worksId || null,
                onlySave,
                segments,
                systemTailLeaderOn,
                title,
                transverse,
                version,
                videoDescribe,
                colorTypes: colorTypes.map(String),
                speed,
                bgm,
                ver: submitVer,
            };
            // 调用分词接口，获取分词数据
            const { data: { obj, success, map } } = yield call(flashVideoSubmit, params);
            if (!success) return false;
            if (onlySave) {
                message.success('保存成功');
                if (!worksId) {
                    yield put(routerRedux.replace(
                        `${prev}/subEditor/flash/${transverse ? 1 : 2}/${obj}${window.location.search}`));
                }
                yield put({
                    type: 'save',
                    payload: {
                        worksId: obj,
                        submitVer: map.ver,
                    },
                });
                // 流量主微信分享设置
                if (shareSet) {
                    const shareJson = {
                        videoId: worksId || obj,
                        ...shareSet,

                    }
                    const { data } = yield call(wechatSetting, shareJson);
                    if (data.success) {
                        yield put.resolve({
                            type: 'save',
                            payload: {
                                shareSet: null,
                            },
                        });
                    }
                }
                return obj;
            } else {
                yield put({
                    type: 'save',
                    payload: {
                        worksId: obj,
                        submitVer: map.ver,
                    },
                });
                // 流量主微信分享设置
                if (shareSet) {
                    const shareJson = {
                        videoId: worksId || obj,
                        ...shareSet,

                    }
                    const { data } = yield call(wechatSetting, shareJson);
                    if (data.success) {
                        yield put.resolve({
                            type: 'save',
                            payload: {
                                shareSet: null,
                            },
                        });
                    }
                }
                yield put(routerRedux.replace(`${prev}/subEditor/flash/${transverse ? 1 : 2}/${obj}${window.location.search}`));
            }
            return worksId || obj;
            // 前端生成一键快闪的方法（废弃）
            const res = yield call(splitWord, contentArr);
            let resArr = [];
            if (res.data.success) {
                resArr = res.data.obj;
                if (resArr.length < contentArr.length) {
                    message.error('片段分词错误，请联系管理员');
                    return;
                }
            } else {
                return;
            }
            //循环片段，生成符合editor格式的数据
            uuidSort.forEach((key, index) => {
                const elementList = [
                    {
                        ...genBackground(transverse),
                        uuid: createUUID(),
                        renderSetting: createEleRenderSetting({}),
                    },
                ];
                const { flash_content, flash_type, flash_oriContent } = dataList[key];
                let haveChange = false;
                let segmentPartyDuration = 0;
                if (oldSegments[key] && flash_content === oldSegments[key].flash_content) {
                    // 和原始数据相等，使用原始数据
                    parties.push({
                        ...oldSegments[key],
                        haveChange,
                    });
                } else {
                    haveChange = true;
                    if (flash_type === CANVAS_TYPE.img) { // 图片
                        const data = {
                            url: flash_content,
                            transverse,
                        };
                        //获取图片的样式
                        const imageStyles = getImageStyles(data);
                        //设置片段的随机背景颜色
                        elementList[0].backgroundColor = randomValue(Object.keys(animateColors));
                        elementList.push({
                            ...imageStyles,
                            oriUrl: flash_oriContent,
                        });
                        segmentPartyDuration = imageStyles.renderSetting.endTime;
                    } else { // 文本，需要先分词
                        //获取文本的公共样式
                        const commonStyles = getCommonTextStyles();
                        // 片段的背景色
                        const animateColor = randomValue(Object.keys(animateColors));
                        elementList[0].backgroundColor = animateColor;
                        //文字的颜色
                        commonStyles.color = randomValue(animateColors[animateColor]);
                        //文字的字体
                        commonStyles.fontFamily = fontFamily;
                        // flash_content.split('，').forEach((item, index) => {
                        //循环分词数据，生成元素信息
                        resArr[index].forEach((item, index) => {
                            //获取单个文本的样式
                            const data = {
                                index,
                                startTime: segmentPartyDuration,
                                transverse,
                                content: item.text,
                            };
                            const textStyles = getTextStyles(data);
                            //更新片段时长
                            segmentPartyDuration = textStyles.renderSetting.endTime;
                            elementList.push({ ...commonStyles, ...textStyles });
                        });
                    }
                    elementList[0].renderSetting.endTime = segmentPartyDuration;
                    parties.push({
                        id: (oldSegments[key] || {}).id,
                        title: flash_content,
                        flash_content,
                        flash_type,
                        flash_oriContent,
                        uuid: key,
                        elementList,
                        renderSetting: {
                            filter: 'none',
                            concatSet: {
                                duration: 800,
                                concatType: 'none',
                            },
                            bgmVolume: 100,
                            segmentPartyDuration,
                        },
                        haveChange,
                        segmentPartyDuration,
                    });
                }
            });
            const { videoId } = yield select(({ editor }) => (editor));
            yield put.resolve({
                type: 'editor/save',
                payload: {
                    music,
                    transverse,
                    coverImg, // 封面图
                    title, // 视频标题
                    videoId: worksId || videoId,
                    templateId,
                    haveChange,
                    videoDescribe, // 视频描述
                    parties,
                    product: EDITOR_PRODUCT.flash,
                    systemTailLeaderOn,
                },
            });
            yield put.resolve({
                type: 'editor/saveOrRender',
                payload,
            });
            return true;
        },
        * overLoading(action, { put, select }) {
            const { lockLoading } = yield select(({ flash }) => (flash));
            if (lockLoading) {
                return;
            }
            yield put.resolve({
                type: 'save',
                payload: { loading: false },
            });
        },
        // 调整节奏
        * speed({ payload }, { put }) {
            yield put.resolve({
                type: 'save',
                payload: {
                    speed: payload.speed,
                },
            });
        },
        // 调整节奏
        * colorTypes({ payload: { colorTypes } }, { put }) {
            yield put.resolve({
                type: 'save',
                payload: {
                    colorTypes,
                },
            });
        },
        // 添加快闪音乐
        * bgm({ payload: { bgm } }, { put }) {
            yield put.resolve({
                type: 'save',
                payload: {
                    bgm,
                },
            });
        },
        // 流量主微信分享设置
        * shareSetParamsToModal({ payload }, { put }) {
            yield put.resolve({
                type: 'save',
                payload: {
                    shareSet: payload,
                },
            });
        },
    },
    reducers: {
        save(state, { payload }) {
            return {
                ...state,
                ...payload,
            };
        },
        reset(state, action) {
            return {
                ...state,
                id: null,
                transverse: true,
                coverImg: null, // 封面图
                title: null, // 视频标题
                worksId: null,
                dataList: {}, // 插入的文字素材对象，key是uuid，value是文字素材的样式数据
                uuidSort: [],
                haveChange: false,
                videoDescribe: null, // 视频描述
                isLoading: false,
                oldSegments: {}, // 编辑时存放旧的数据
                systemTailLeaderOn: true,
                speed: 2, // 快闪节奏
                colorTypes: [
                    '0',
                    '1',
                    '3',
                ], // 视频配色（可多选）
                updateStates: false,
                updateUuid: null,
                uploadPhoneTokenObj: {} //upload token
            };
        },
    },
    subscriptions: {
        setup({ dispatch, history }) {
        },
    },
};
