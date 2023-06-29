import { message } from "antd";
import * as routerRedux from "react-router-redux";
import {
    getTypeMonkeyInfo,
    getTypeMonkeyVoiceNames,
    textsToVoice,
    textsToVoiceResult,
    typeMonkeySubmit
} from "../api/music";
import Say2Draw from "../services/say2Draw";
import { host, prev } from "../config/env";
import { HD_RESOLUTION, DEFAULT_COVER_PIC, OPEN_FROM } from "../config/staticParams";
import { COLOR_STYLES } from "../dataBase/typeMonkey";
import subtitle_fonts from "../dataBase/subtitles_fonts";
import { delay } from "../util/delayLoad";
import { genVideoUrl } from "../util/file";
import { getAllFontBlob, getMyFont } from "../api/user";
import { addGlobalStyle } from "../util/doc";
import { platformActions, sendPlatformPage } from "../util/platform";
import { getURLObj } from "../util/util";
import { wechatSetting } from '../api/userVideo';

export default {
    namespace: "typeMonkey",
    state: {
        animationStyle: null, // 动画效果
        animationType: 0, // 动画风格
        bgImg: "", // 背景图
        bgm: "背景音乐", // 背景音乐(声音文件) ？
        bgmVolume: 0, // 背景音乐音量大小 ？
        colorType: 0, // 主题配色
        coverImg: DEFAULT_COVER_PIC.hoz, // 封面
        font: "fangzheng_htjt", // 字体
        id: null, // 视频id
        worksId: null,
        onlySave: true, // 只保存数据，不做渲染（编辑中）
        platform: 1, // 平台 1:pc 2:ios 3:android
        product: 5, // 产品（不同平台自定义自己的产品类型，PC:1~1XX   APP:2XX  小程序：6XX）5:字说自话的作品
        systemPlatform: 0, // 系统平台 ？
        systemTailLeaderOn: true, // 系统片尾开关 ？
        text: [], // 文本
        title: "我制作的自说字画", // 标题 ？
        transverse: true,
        // userId: '用户ID', // 用户ID ？
        ver: 0, // 数据保存版本 * 传入值则进行数据编辑版本检查  为空则不检查
        version: 0, // 前端版本号（PC端使用）？
        videoDescribe: "我使用易企秀一键自说字画制作了一个视频，快来看看吧~", // 描述
        videoDuration: 0, // 视频时长
        voiceType: '', // 变声 xiaoyan
        voiceSpeed: 1, // // 变速
        voiceover: '', // 旁白--声音文件
        time: [], //  时间列表
        audio: null,
        myFonts: [],
        typeMonkeyVoice: [], // /config/getTypeMonkeyVoiceNames获取自说字画音库列表
        shareSet: null, // 流量主分享
    },
    effects: {
        // 初始化视频数据
        *init({ payload: { type, worksId = null } }, { put, select, call }) {
            yield put.resolve({
                type: "reset"
            });
            const { openFrom, tabId } = getURLObj(window.location.search); // 长页进入
            const { data } = yield call(getTypeMonkeyVoiceNames);
            if (data.success) {
                yield put.resolve({
                    type: "save",
                    payload: {
                        typeMonkeyVoice: data.obj,
                        voiceType: data.obj[0].voiceName
                    }
                });
            }
            if (worksId) {
                const {
                    data: { success = false, obj }
                } = yield call(getTypeMonkeyInfo, worksId);
                // 数据错误
                if (!success) {
                    if (openFrom === OPEN_FROM.longPage) {
                        // 数据错误 通知集合页关闭tab
                        sendPlatformPage(
                            platformActions.quite,
                            {
                                tabId,
                                ...window.eqxCollectInfo
                            },
                            "typeMonkey"
                        );
                    }
                    return false;
                }
                const resultText = obj.text.split("\n");
                const animationStyle = JSON.parse(obj.animationStyle || null);
                let time = [];
                let font = obj.font;
                for (const onefont of Object.keys(subtitle_fonts)) {
                    if (subtitle_fonts[onefont].ass === font) {
                        font = onefont;
                    }
                }
                if (animationStyle) {
                    animationStyle.animationDuration = animationStyle.animationDuration / 1000;
                    let preTime = 0;
                    time = animationStyle.audio.lrc.map((value, index, array) => {
                        const nextItem = array[index + 1] || {
                            time: animationStyle.animationDuration
                        };
                        const duration = nextItem.time - preTime;
                        preTime += duration;
                        return duration;
                    });
                }

                yield put.resolve({
                    type: "save",
                    payload: {
                        ...obj,
                        animationType: ~~obj.animationType,
                        colorType: ~~obj.colorType,
                        animationStyle,
                        text: resultText,
                        font,
                        time
                    }
                });
            }
            yield put.resolve({
                type: "initFonts"
            });
        },
        // 保存数据
        *saveOrRender({ payload: { onlySave } }, { put, select, call }) {
            const oldData = yield select(({ typeMonkey }) => typeMonkey);
            const {
                animationType,
                bgImg,
                bgm,
                bgmVolume,
                colorType,
                coverImg,
                font,
                id,
                // onlySave,
                platform,
                product,
                systemPlatform,
                systemTailLeaderOn,
                text,
                title,
                transverse,
                // userId: '用户ID', // 用户ID ？
                ver,
                version,
                videoDescribe,
                voiceType,
                voiceSpeed,
                time,
                shareSet,
            } = oldData;
            let { animationStyle, voiceover, videoDuration } = oldData;
            const newText = text.join("\n");
            if (
                !onlySave &&
                (!videoDuration || !voiceover || (time.length === 0 && !animationStyle))
            ) {
                const res = yield put.resolve({
                    type: "textToVoice"
                });
                if (res === false) {
                    return false;
                }
            }
            if (!onlySave && !animationStyle) {
                yield put.resolve({
                    type: "say2Draw"
                });
            }
            ({ animationStyle, voiceover, videoDuration } = yield select(
                ({ typeMonkey }) => typeMonkey
            ));
            const params = {
                animationStyle: animationStyle
                    ? JSON.stringify({
                          ...animationStyle,
                          data: {
                              ...animationStyle.data,
                              styles: {
                                  ...animationStyle.data.styles,
                                  fontFamily: (subtitle_fonts[font] || {}).ass || font
                              }
                          },
                          animationDuration: ~~(animationStyle.animationDuration * 1000)
                      })
                    : "",
                animationType,
                bgImg,
                bgm: bgm === "背景音乐" ? null : bgm,
                bgmVolume,
                colorType,
                coverImg,
                font: (subtitle_fonts[font] || {}).ass || font,
                id,
                onlySave,
                platform,
                product,
                systemPlatform,
                systemTailLeaderOn,
                text: newText,
                title,
                transverse,
                // userId: '用户ID', // 用户ID ？
                ver,
                version,
                videoDescribe,
                videoDuration,
                voiceType,
                voiceSpeed,
                voiceover
            };
            const {
                data: { obj, success, map: { ver: newVer } = {} }
            } = yield call(typeMonkeySubmit, params);
            if (!success) return false;
            if (onlySave) {
                message.success("保存成功");
                if (!id) {
                    yield put(routerRedux.replace(`${prev}/subEditor/typeMonkey/1/${obj}${window.location.search}`));
                    yield put({
                        type: "save",
                        payload: {
                            worksId: obj,
                            ver: newVer,
                        }
                    });
                }
                yield put({
                    type: "save",
                    payload: {
                        ver: newVer,
                    },
                });
                // 流量主微信分享设置
                if (shareSet) {
                    const shareJson = {
                        videoId: obj,
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
                        id: obj,
                        ver: newVer,
                    },
                });
                // 流量主微信分享设置
                if (shareSet) {
                    const shareJson = {
                        videoId: obj,
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
                yield put(routerRedux.replace(`${prev}/subEditor/typeMonkey/1/${obj}${window.location.search}`));
            }
            return id || obj;
        },
        /**
         * 文本转音请求
         * @param action
         * @param put
         * @param select
         * @param call
         * @return {IterableIterator<*>}
         */ *textToVoice(action, { put, select, call }) {
            const {
                typeMonkey: { text, voiceType, voiceSpeed }
            } = yield select(({ typeMonkey }) => ({ typeMonkey }));
            if (text.filter(v => v).length === 0) {
                message.error("请输入文字");
                return false;
            }
            const params = {
                textList: text.map(String),
                speedRatio: voiceSpeed,
                voiceName: voiceType
            };
            const getTextsToVoiceResult = async taskCode => {
                const {
                    data: {
                        obj: { res, state }
                    }
                } = await textsToVoiceResult(taskCode);
                if (state === "doing") {
                    await delay(1000);
                    return getTextsToVoiceResult(taskCode);
                } else if (state === "fail") {
                    message.error(res);
                    return false;
                }
                return res;
            };
            const { data } = yield call(textsToVoice, params);
            if (data.success) {
                const res = yield getTextsToVoiceResult(data.obj);
                if (!res) {
                    return false;
                }
                const { concatUrl } = res;
                const result = Object.values(res);
                const newResult = result.splice(0, result.length - 1);
                const sum = newResult.reduce((total, num) => total + num, 0);
                if (!concatUrl) {
                    message.error("字转音失败，请重试");
                    return false;
                }
                yield put({
                    type: "save",
                    payload: {
                        videoDuration: sum,
                        time: newResult,
                        voiceover: genVideoUrl(concatUrl)
                    }
                });
                return true;
            } else {
                return false;
            }
        },
        // handle 数据处理
        *say2Draw(action, { put, select }) {
            const {
                text,
                time,
                voiceover,
                bgImg,
                font,
                transverse,
                colorType,
                animationType,
                ...typeMonkey
            } = yield select(({ typeMonkey: typeModel }) => typeModel);
            let { videoDuration } = typeMonkey;
            const lrc = [];
            let startTime = 0;
            if (!videoDuration) {
                console.log("时间为0");
            }
            ({ videoDuration } = yield select(({ typeMonkey: typeModel }) => typeModel));
            console.log("重新生成动画数据");
            text.forEach((v, i) => {
                if (i > 0) {
                    startTime += Number(time[i - 1]);
                }
                lrc.push({
                    text: v,
                    time: startTime || 0
                });
            });
            const audio = {
                duration: videoDuration,
                lrcStyle: animationType + 1,
                lrc: [...lrc]
            };
            const colorItem = COLOR_STYLES[colorType] || COLOR_STYLES[0];
            const colors = colorItem.color.font;
            const say2Draw = new Say2Draw({
                styleType: animationType + 1,
                audio,
                colors
            });
            say2Draw.setRules();
            const hdResolution = HD_RESOLUTION[transverse ? "hoz" : "ver"];
            const params = {
                bgColor: colorItem.color.bg,
                animationName: "typeMonkey", // 类型 必须为 typeMonkey
                animationDuration: videoDuration, // 时长，等于音频时长
                data: {
                    styles: {
                        fontFamily: font, // 字体
                        width: hdResolution.x,
                        height: hdResolution.y
                    }
                },
                sourceType: "audio", // 不重要
                anim: [
                    {
                        type: 0,
                        count: 0,
                        countNum: 1,
                        delay: 0.2,
                        duration: 2,
                        interval: 0
                    }
                ],
                bgImg: {
                    src: bgImg // 背景图
                },
                initType: 1,
                zoom: 11,
                audio: {
                    ...say2Draw.audio,
                    url: voiceover
                }
            };
            yield put.resolve({
                type: "save",
                payload: {
                    animationStyle: params
                }
            });
        },
        *initFonts(action, { put, select, call }) {
            const { myFonts, font } = yield select(({ typeMonkey }) => typeMonkey);
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
                    // const sameNameIndex = Object.values(MyFonts)
                    //     .findIndex((item) => item.name === name);
                    // const { fontFamily } = sameNameIndex !== -1
                    //                        ? Object.keys(sameNameIndex)
                    //                        : { fontFamily: font_family };
                    // eslint-disable-next-line camelcase
                    if (font === font_family) {
                        addGlobalStyle(font_family, woff_path || authedttf_path, true);
                    } else {
                        const path = `store/fonts/${font_family}.woff?text=${name}`;
                        urls.push(`${host.font}${path}`);
                        addGlobalStyle(font_family, path);
                    }
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
                    myFonts,
                }
            });
        },
        // 流量主微信分享设置
        *shareSetParamsToModal({ payload }, { put }) {
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
                ...payload
            };
        },
        reset(state, action) {
            return {
                ...state
            };
        }
    },
    subscriptions: {
        setup({ dispatch, history }) {}
    }
};
