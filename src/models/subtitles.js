import { message } from 'antd';
import { cloneDeep } from 'lodash';
import {
    CANVAS_TYPE,
    DEFAULT_FONT_FAMLIY,
    EDITOR_PRODUCT,
    NORMAL_RESOLUTION,
    SUB_BLANK_PIC,
    SUBTITLES_FONTS,
    SUBTITLES_H,
    SUBTITLES_TRANSVERSE_W,
    SUBTITLES_W,
    OPEN_FROM,
} from '../config/staticParams';
import { defaultSubTitleStyle } from '../services/editorData';
import { getMyFont, getAllFontBlob } from '../api/user';
import { getQiniuToken, getTencentToken, uploadQiniuByBase64 } from '../api/upload';
import { addGlobalStyle } from '../util/doc';
import { host, prev, version } from '../config/env';
import { createUUID } from '../util/data';
import EditorHistory from '../services/editorHistory';
import { isPromise, getURLObj } from '../util/util';
import Json2Ass from '../services/json2Ass';
import COS from 'cos-js-sdk-v5';
import { userTemplateId } from '../api/template';
import { addFilePath, genVideoUrl, compatibleVideoWebm, compatibleVideo } from '../util/file';
import { picUrltoBase64, genUrl } from '../util/image';
import { getMaterial } from '../api/userVideo';
import * as routerRedux from 'react-router-redux';
import userVideo from '../api/userVideo';
import LongforAsr from '../dataProvider/longForAsr';
import { img2Cover } from '../util/image';
import { sha256_digest } from '../services/sha256';
import env from '../config/env';
import eventEmitter from '../services/EventListener';
import { platformActions, sendPlatformPage } from '../util/platform';
import { getImageInfoByTag } from '../api/videoStore';

let longforAsr = null;
const uploadQiniu = async function (base64) {
    let res = await getQiniuToken();
    const { data } = res;
    if (data.success) {
        const token = data.obj;
        res = await uploadQiniuByBase64(base64, token);
        const { data: { key } } = res;
        return key;
    }
};

let defaultStyle = defaultSubTitleStyle;

export default {
    namespace: 'subtitles',
    state: {
        dataList: {}, // 插入的文字素材对象，key是uuid，value是文字素材的样式数据
        haveChange: false,
        myFonts: [],
        history: new EditorHistory({
            dataList: {},
            transverse: true,
        }),
        title: null, // 视频标题
        coverImg: null, // 封面图
        videoDescribe: null, // 视频描述
        isLoading: false,
        transverse: true,
        url: null,
        worksId: null,
        id: null,
        segmentId: null, // 片段ID
        videoBase64: null,
    },
    effects: {
        // 初始化视频数据
        * init({ payload: { id, worksId = null } }, { put, select, call }) {
            defaultStyle = defaultSubTitleStyle;
            const { openFrom, tabId } = getURLObj(window.location.search); // 长页进入
            const isLoading = openFrom ? false : true;
            yield put({
                type: 'reset',
            });
            yield put({
                type: 'save',
                payload: {
                    isLoading,
                    lockLoading: true,
                },
            });
            // 初始化字体
            const ss = yield put.resolve({
                type: 'getMyFonts',
            });
            if (isPromise(ss)) {
                console.log('出现promise了');
                yield ss.then(re => Promise.resolve(re));
            }
            let videoUrl = '';
            if (!worksId) {
                const { data: { success = false, obj = {} } } = yield call(userTemplateId, id);
                if (!success) return false;
                if (obj.videoDuration > 5 * 60) {
                    message.error('无法对时长大于5分钟的视频添加字幕');
                    setTimeout(() => {
                        window.location.replace('/video/index');
                    }, 3000);
                }
                const data = {
                    title: '我制作的视频',
                    videoDescribe: '我使用易企秀制作了一个视频，快来看看吧~',
                    coverImg: obj.coverImg,
                    oriCoverImg: obj.coverImg,
                    url: compatibleVideoWebm(obj, true),
                    resolutionW: obj.resolutionW,
                    resolutionH: obj.resolutionH,
                };
                const base64 = yield call(img2Cover, obj.coverImg, true);
                if (base64) {
                    const key = yield uploadQiniu(base64);
                    if (key) {
                        data.hozCoverImg = addFilePath(key, 2);
                    }
                }
                videoUrl = data.url;
                try {
                    data.id = obj.segments[0].elements[1].templateId || id;
                } catch (e) {
                    data.id = id;
                }
                // 初始化历史数据
                yield put({
                    type: 'saveHistory',
                    payload: {
                        isLoading: false,
                        history: new EditorHistory({
                            dataList: {},
                            transverse: true,
                        }),
                    },
                });
                yield put({
                    type: 'save',
                    payload: { ...data },
                });
            } else {
                const { data: { success = false, obj } } = yield call(getMaterial, worksId);
                if (!success) {
                    if (openFrom === OPEN_FROM.longPage) {
                        // 数据错误 通知集合页关闭tab
                        sendPlatformPage(platformActions.quite, {
                            tabId,
                            ...window.eqxCollectInfo
                        }, 'subtitle');
                    }
                    return false;
                };
                if (!obj.segments || !obj.segments[0] || !obj.segments[0].setting) return false;
                try {
                    const settingObj = JSON.parse(obj.segments[0].setting);
                    const videoObj = obj.segments[0].elements[1];
                    const coverImg = obj.coverImg;
                    // 为了避免封面被替换 ，重新设置对应的封面
                    const { width, height } = yield getImageInfoByTag(genUrl(coverImg));
                    let { hozCoverImg, verCoverImg } = settingObj;
                    if (width > height) {
                        hozCoverImg = coverImg;
                    } else {
                        verCoverImg = coverImg;
                    }
                    const data = {
                        ...settingObj,
                        title: obj.title,
                        coverImg: obj.coverImg,
                        url: compatibleVideo(videoObj, true),
                        videoDescribe: obj.videoDescribe,
                        segmentId: [obj.segments[0].id],
                        resolutionW: videoObj.resolutionW,
                        resolutionH: videoObj.resolutionH,
                        transverse: obj.templateId === 1,
                        hozCoverImg,
                        verCoverImg,
                    };
                    videoUrl = data.url;
                    yield put({
                        type: 'save',
                        payload: {
                            ...data,
                            worksId,
                            id: videoObj.templateId,
                        },
                    });
                    // 二次编辑时下载已选择的字体文件
                    const { dataList, myFonts } = yield select(({ subtitles }) => subtitles);
                    const dataArr = Object.values(dataList);
                    if (Array.isArray(dataArr)) {
                        dataArr.forEach((v, i) => {
                            if ([CANVAS_TYPE.text, CANVAS_TYPE.artFont].includes(v.type) &&
                                v.fontFamily !==
                                DEFAULT_FONT_FAMLIY) { // 是字体而且不是默认字体
                                const { fontFamily, woffPath, ttfPath } =
                                    myFonts.find(f => f.fontFamily === v.fontFamily) || {};
                                if (!fontFamily) {
                                    dataArr[i].fontFamily = DEFAULT_FONT_FAMLIY;
                                } else {
                                    addGlobalStyle(fontFamily, woffPath || ttfPath, true);
                                }
                            }
                        });
                    }
                    // 初始化历史数据
                    yield put({
                        type: 'saveHistory',
                        payload: {
                            isLoading: false,
                            history: new EditorHistory({
                                dataList,
                                transverse: data.transverse,
                            }),
                        },
                    });
                } catch (e) {
                    return false;
                }
            }
            yield put({
                type: 'save',
                payload: {
                    isLoading: false,
                    lockLoading: false,
                },
            });
            // 编辑器loading完成 通知集合页面
            if (openFrom === OPEN_FROM.longPage) {
                // 加载完成通知集合页面关闭loading
                sendPlatformPage(platformActions.messageReady, {
                    tabId,
                });
            }
            // 下载视频
            if (env.name !== 'local') {
                const videoBase64 = yield picUrltoBase64(videoUrl);
                yield put({
                    type: 'save',
                    payload: {
                        videoBase64,
                    },
                });
            }
        },
        // 插入文本
        * insertText({ payload: { type = CANVAS_TYPE.artFont, ...payload } }, { put, select }) {
            const { dataList, transverse } = yield select(
                ({ subtitles }) => subtitles);
            const uuid = createUUID();
            dataList[uuid] = {
                uuid,
                type,
                content: '双击替换文本',
                ...defaultStyle,
                fontSize: 18,
                height: 27,
                top: SUBTITLES_H / 5 * 4,
                left: (transverse ? SUBTITLES_TRANSVERSE_W : SUBTITLES_W) / 2 - 54,
                ...payload,
            };
            yield put({
                type: 'save',
                payload: {
                    dataList,
                    haveChange: true,
                },
            });
            eventEmitter.emit('addSubTitle', uuid);
            return '插入文字完毕';
        },
        // 修改字幕数据
        * changeNow({ payload: { uuid, ...payload } }, { put, select }) {
            const { dataList } = yield select(({ subtitles }) => subtitles);
            const preData = dataList[uuid];
            if (!preData) return;
            dataList[uuid] = {
                ...preData,
                ...payload,
            };
            yield put({
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
            const { dataList } = yield select(({ subtitles }) => subtitles);
            delete dataList[payload];
            yield put({
                type: 'save',
                payload: {
                    dataList,
                    haveChange: true,
                },
            });
            eventEmitter.emit('addSubTitle', null);
        },
        // 获取操作历史
        * changeHistory({ back }, { put, select }) {
            const { history } = yield select(({ subtitles }) => subtitles);
            let newDataList = {};
            if (back) {
                newDataList = history.back();
            } else {
                newDataList = history.forward();
            }
            yield put({
                type: 'saveHistory',
                payload: {
                    ...newDataList,
                    history,
                },
            });
        },
        // 获取已购买的字体
        * getMyFonts({ payload }, { put, select, call }) {
            const { myFonts } = yield select(({ subtitles }) => subtitles);
            if (myFonts.length > 3) {
                return;
            }
            const { data } = yield call(getMyFont);
            if (data.success) {
                const { list } = data;
                const urls = [];
                for (let i = 0; i < list.length; i++) {
                    const { font_family, name, woff_path, authedttf_path } = list[i];
                    const path = `store/fonts/${font_family}.woff?text=${name}`;
                    urls.push(`${host.font}${path}`);
                    addGlobalStyle(font_family, path);
                    const length = myFonts.filter(item => item.fontFamily === font_family).length;
                    if (length < 1 && SUBTITLES_FONTS[font_family]) {
                        myFonts.push({
                            fontFamily: font_family,
                            woffPath: woff_path,
                            ttfPath: authedttf_path,
                            name,
                        });
                    }
                }
                // 发送请求
                getAllFontBlob(urls);
            }
            yield put({
                type: 'save',
                payload: {
                    myFonts,
                },
            });
        },
        // 下载选择的字体
        * downloadFont({ payload }, { call }) {
            yield call(getAllFontBlob, [payload]);
        },
        // 提交数据
        * submit(
            { payload: { onlySave = true, postion: { left, top, width, height } = {} } },
            { call, select, put }) {
            yield put({
                type: 'save',
                payload: {
                    isLoading: true,
                    lockLoading: true,
                },
            });
            const { subtitles: { dataList, worksId, videoDuration, transverse, id, segmentId, title, videoDescribe, oriCoverImg, hozCoverImg, verCoverImg } } = yield select(
                ({ subtitles }) => ({ subtitles }));
            // 字幕文件生成
            const AssClass = new Json2Ass({
                data: Object.values(dataList),
                oriSize: {
                    y: SUBTITLES_H,
                    x: transverse ? SUBTITLES_TRANSVERSE_W : SUBTITLES_W,
                },
                targetSize: transverse ? NORMAL_RESOLUTION.hoz : NORMAL_RESOLUTION.ver,
            });
            const assContent = AssClass.exportString();
            const response = yield call(getTencentToken);
            const { userId, appId, bucket, region, ...tokenParams } = (res => {
                const { obj } = res.data;
                return {
                    TmpSecretId: obj.tmpSecretId,
                    TmpSecretKey: obj.tmpSecretKey,
                    XCosSecurityToken: obj.sessionToken,
                    ExpiredTime: obj.expiredTime,
                    userId: obj.userId,
                    appId: obj.appId,
                    bucket: obj.bucket,
                    region: obj.region,
                };
            })(response);
            const cos = new COS({
                // 必选参数
                getAuthorization: (options, callback) => {
                    callback({ ...tokenParams });
                },
                // 可选参数
                FileParallelLimit: 3, // 控制文件上传并发数
                ChunkParallelLimit: 3, // 控制单个文件下分片上传并发数
                ProgressInterval: 500, // 控制上传的 onProgress 回调的间隔
            });
            const key = `/tencent/${userId}/${sha256_digest(assContent)}-vid${id}.ass`;
            const uploadData = yield new Promise((resolve, reject) => cos.putObject({
                Bucket: `${bucket}-${appId}`, /* 必须 */
                Region: region, /* 必须 */
                Key: key, /* 必须 */
                Body: assContent, // 上传文件对象
            }, (err, data) => {
                if (err !== null || data.Location === undefined) {
                    console.log(err);
                    reject(err);
                }
                resolve(data);
            },
            ),
            );
            // 上传失败
            if (!uploadData.Location) {
                yield put({
                    type: 'save',
                    payload: {
                        isLoading: false,
                        lockLoading: true,
                    },
                });
                return;
            }
            // 准备参数
            const params = {
                id: worksId,
                product: EDITOR_PRODUCT.subtitles,
                version,
                title,
                videoDescribe,
                coverImg: transverse ? hozCoverImg : verCoverImg,
                onlySave,
                templateId: transverse ? 1 : 2,
                systemTailLeaderOn: false,
                segmentParams: [
                    {
                        id: Array.isArray(segmentId) ? segmentId[0] : null,
                        segmentSort: 0,
                        speed: 1,
                        templateId: null,
                        title,
                        setting: JSON.stringify({
                            dataList,
                            hozCoverImg,
                            verCoverImg,
                            oriCoverImg,
                        }),
                        renderSetting: JSON.stringify({
                            subtitles: key,
                            segmentPartyDuration: videoDuration,
                        }),
                        elementParams: [
                            {
                                bgmOn: false,
                                height: 0,
                                id: null,
                                layer: 1,
                                materialParams: [],
                                positionX: 0,
                                positionY: 0,
                                previewUrl: null,
                                templateType: 3,
                                transverse: true,
                                url: transverse ? SUB_BLANK_PIC.hoz : SUB_BLANK_PIC.ver,
                                uuid: '73f65b44-3a23-4f6c-a942-c9cb9e1ecbcf',
                                renderSetting: null,
                                videoMp4Url: null,
                                videoWebmUrl: null,
                                width: 0,
                            },
                            {
                                bgmOn: false,
                                coverImg: transverse ? hozCoverImg : verCoverImg,
                                height,
                                id: null,
                                layer: 2,
                                materialParams: [],
                                positionX: left,
                                positionY: top,
                                previewUrl: null,
                                renderSetting: null,
                                rotate: 0,
                                templateId: id,
                                templateType: 2,
                                url: null,
                                videoMp4Url: null,
                                videoWebmUrl: null,
                                width,
                            },
                        ],
                    },
                ],
                voiceoverVolume: null,
            };
            const { data: { success = false, obj = null } = {} } = yield call(userVideo.submit,
                params); // 发送保存请求
            yield put({
                type: 'save',
                payload: {
                    isLoading: false,
                    lockLoading: false,
                },
            });
            if (success) {
                const videoid = obj || worksId; // 作品ID
                if (onlySave) {
                    message.success('保存成功');
                    if (!worksId) {
                        yield put(routerRedux.push(`${prev}/subEditor/subtitles/${id}/${videoid}${window.location.search}`));
                        return;
                    }
                } else {
                    /*  yield put({
                          type: 'reset',
                      });*/
                      yield put(routerRedux.push(`${prev}/subEditor/subtitles/${id}/${videoid}${window.location.search}`));
                      yield put.resolve({
                          type: 'init',
                          payload: { id, worksId: videoid }
                      })
                    yield put({
                        type: 'save',
                        payload: { worksId: videoid, },
                    });
                   
                    // yield put(routerRedux.push(`${prev}/scene`));
                }
            }
            return success;
        },
        // 样式应用于全部页面, 如果选中则复制当前的样式到其他字幕
        * applyAll({ payload: { uuid } }, { put, select }) {
            const { lockLoading, dataList } = yield select(({ subtitles }) => (subtitles));
            if (lockLoading) {
                return;
            }
            const newDataList = dataList;
            const { uuid: currentUUID, top, left, width, height, rotate, begin, end, content, ...other } = dataList[uuid];

            defaultStyle = {
                ...defaultStyle,
                ...other,
            };
            for (let i in dataList) {
                newDataList[i] = {
                    ...dataList[i],
                    ...other,
                };
            }
            yield put({
                type: 'save',
                payload: { dataList: newDataList },
            });
            message.success('应用成功');
        },
        * overLoading(action, { put, select }) {
            const { lockLoading } = yield select(({ subtitles }) => (subtitles));
            if (lockLoading) {
                return;
            }
            yield put({
                type: 'save',
                payload: { loading: false },
            });
        },
        // 切换横竖板, 重新计算left
        * transverse({ payload: { transverse } }, { put, select }) {
            yield put({
                type: 'save',
                payload: {
                    isLoading: true,
                    lockLoading: true,
                },
            });
            const { dataList, hozCoverImg, verCoverImg, oriCoverImg } = yield select(
                ({ subtitles }) => (subtitles));
            const newDataList = dataList;
            for (let i in dataList) {
                const { left, width } = dataList[i];
                //计算中心点x坐标
                const x = left + width / 2;
                newDataList[i] = {
                    ...dataList[i],
                    left: (transverse ? x / SUBTITLES_W * SUBTITLES_TRANSVERSE_W : x /
                        SUBTITLES_TRANSVERSE_W * SUBTITLES_W) - width / 2,
                };
            }
            // 横版，并且没有横版封面图
            if (transverse && oriCoverImg && !hozCoverImg) {
                yield put.resolve({
                    type: 'img2Cover',
                    payload: {
                        coverImg: oriCoverImg,
                        transverse,
                    },
                });
            }
            // 竖版，并且没有竖版封面图
            if (!transverse && oriCoverImg && !verCoverImg) {
                yield put.resolve({
                    type: 'img2Cover',
                    payload: {
                        coverImg: oriCoverImg,
                        transverse,
                    },
                });
            }
            yield put({
                type: 'save',
                payload: {
                    transverse,
                    dataList: newDataList,
                    isLoading: false,
                    lockLoading: false,
                },
            });
        },
        * img2Cover({ payload = {} }, { call, put }) {
            const { transverse, coverImg } = payload;
            const paramName = transverse ? 'hozCoverImg' : 'verCoverImg';
            const base64 = yield call(img2Cover, coverImg, transverse);
            if (base64) {
                const key = yield uploadQiniu(base64);
                if (key) {
                    yield put({
                        type: 'save',
                        payload: {
                            [paramName]: addFilePath(key, 2),
                        },
                    });
                }
            }
        },
        // 语音识别
        * voiceRecognition({ payload }, { call, put, select }) {
            const { id, transverse } = yield select(({ subtitles }) => (subtitles));
            yield put.resolve({
                type: 'cancelVoiceRecognition',
            });
            longforAsr = new LongforAsr({
                videoId: id,
                intervalTime: 3000,
            });
            yield put({
                type: 'save',
                payload: {
                    longforAsr: longforAsr,
                },
            });
            message.info('字幕识别中，请稍后');
            const res = yield longforAsr.genAsr();
            if (res) {
                try {
                    const subtitles = JSON.parse(res.subtitles || '[]');
                    if (!subtitles.length) {
                        message.info('识别完成，没有找到人声。');
                        return false;
                    }
                    const newDataList = {};
                    // 循环字幕文字
                    const symbol = ['p', 'g'];
                    subtitles.map(item => {
                        const { bg, wordsResultList = [] } = item;
                        let content = '';
                        let currentBg = 0;
                        let currentEd = 0;
                        // 循环每一个词，遇到标点就结束
                        wordsResultList.map((item, index) => {
                            const { wordBg, wordEd, wordsName, wp } = item;
                            if (symbol.includes(wp)) {
                                if (content.length > 0) {
                                    const uuid = createUUID();
                                    const maxWidth = defaultStyle.fontSize * content.length;
                                    newDataList[uuid] = {
                                        uuid,
                                        ...defaultStyle,
                                        width: maxWidth,
                                        type: CANVAS_TYPE.artFont,
                                        content,
                                        top: SUBTITLES_H / 5 * 4,
                                        left: ((transverse ? SUBTITLES_TRANSVERSE_W : SUBTITLES_W) -
                                            maxWidth) / 2,
                                        begin: currentBg - 50 < 0 ? currentBg : currentBg - 50,
                                        end: currentEd - 50 < 0 ? currentEd : currentEd - 50,
                                    };
                                }
                                currentBg = 0;
                                currentEd = 0;
                                content = '';
                            } else {
                                if (!currentBg) {
                                    currentBg = Number(bg) + Number(wordBg) * 10;
                                }
                                currentEd = Number(bg) + Number(wordEd) * 10;
                                content += wordsName;
                                if (index === wordsResultList.length - 1 && content.length > 0) {
                                    const uuid = createUUID();
                                    const maxWidth = defaultStyle.fontSize * content.length;
                                    newDataList[uuid] = {
                                        uuid,
                                        ...defaultStyle,
                                        width: maxWidth,
                                        type: CANVAS_TYPE.artFont,
                                        content,
                                        top: SUBTITLES_H / 5 * 4,
                                        left: ((transverse ? SUBTITLES_TRANSVERSE_W : SUBTITLES_W) -
                                            maxWidth) / 2,
                                        begin: currentBg - 50 < 0 ? currentBg : currentBg - 50,
                                        end: currentEd - 50 < 0 ? currentEd : currentEd - 50,
                                    };
                                }
                            }

                        });
                    });
                    yield put({
                        type: 'save',
                        payload: {
                            dataList: newDataList,
                        },
                    });
                    message.destroy();
                    message.success('识别成功');
                    return true;
                } catch (e) {
                    message.destroy();
                    message.error(e);
                    return false;
                }
            } else {
                if (longforAsr.error) {
                    message.destroy();
                    message.error(longforAsr.error);
                }
                return false;
            }
        },
        // 取消语音识别
        * cancelVoiceRecognition({ payload }, { call, put, select }) {
            if (longforAsr) {
                longforAsr.isCancel = true;
            }
        },
    },
    reducers: {
        save(state, { payload }) {
            /**
             * 如果dataList改变则更新历史记录
             * */
            let { transverse } = state;
            if (payload.transverse !== undefined) {
                transverse = payload.transverse;
            }
            if (payload.dataList && Object.keys(payload.dataList).length > 0) {
                const editorHistory = state.history;
                editorHistory.data = {
                    dataList: payload.dataList,
                    transverse,
                };
                editorHistory.add();
                return {
                    ...state,
                    ...payload,
                    history: editorHistory,
                };
            }
            return {
                ...state,
                ...payload,
            };
        },
        saveHistory(state, { payload }) {
            return {
                ...state,
                ...payload,
            };
        },
        reset(state, action) {
            return {
                ...state,
                dataList: {}, // 插入的文字素材对象，key是uuid，value是文字素材的样式数据
                haveChange: false,
                history: new EditorHistory({
                    dataList: {},
                    transverse: true,
                }),
                title: null, // 视频标题
                coverImg: null, // 封面图
                hozCoverImg: null,
                verCoverImg: null,
                videoDescribe: null, // 视频描述
                isLoading: false,
                transverse: true,
                url: null,
                worksId: null,
                id: null,
                segmentId: null,
                videoBase64: null,
            };
        },
    },
    subscriptions: {
        setup({ dispatch, history }) {

        },
    },
};
