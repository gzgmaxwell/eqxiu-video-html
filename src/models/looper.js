import { message } from 'antd';
import { getCutSource } from '../api/videoStore';
import { delay } from '../util/delayLoad';

// 用于超时控制
let loopCount = 0;

export default {
    namespace: 'looper',
    state: {
        cutVideoUUID: null,
    },
    effects: {
        * cutVideo({ payload: oriPayload }, { call, select, put }) {
            const {
                cutId, uuid, partyUUID, timeObj, first = true, ...payload
            } = oriPayload;
            // 第一次需要改变uuid
            if (first) {
                message.success('开始裁剪');
                yield put({
                    type: 'save',
                    payload: { cutVideoUUID: uuid },
                });
            }
            const {
                data: {
                    obj: {
                        status, url, coverImg, msg: failMsg = '视频剪裁失败',
                    }, success, msg,
                },
            } = yield call(getCutSource, cutId);
            if (!success) {
                message.error(msg);
                loopCount = 0;
                return false;
            }
            const { editor: { parties }, looper: { cutVideoUUID } } = yield select(
                ({ editor, looper }) => ({
                    editor,
                    looper,
                }));
            // 裁剪取消
            if (cutVideoUUID !== uuid) return false;
            const party = parties.find(v => v.uuid === partyUUID);
            if (!party) {
                loopCount = 0;
                // 如果parties 还有说明还在编辑器中,否则已经退出编辑器
                if (parties.length) {
                    throw new Error('裁剪视频所在的片段已经丢失');
                }
                yield put({
                    type: 'cancelCut',
                });
                return false;
            }
            if ([1, 2].includes(status)) {
                yield delay(3000);
                loopCount += 1;
                return yield put.resolve({
                    type: 'cutVideo',
                    payload: {
                        ...oriPayload,
                        first: false,
                    },
                });
            } else if (status === 4) {
                const { elementList } = party;
                const params = {
                    ...payload,
                    previewUrl: url,
                    coverImg,
                };
                const newDataList = elementList.map((item) => {
                    if (item.uuid === uuid) {
                        // 以之前的位置和长边为准
                        let longKey = 'width';
                        let shortKey = 'height';
                        if (params.height > params.width) {
                            longKey = 'height';
                            shortKey = 'width';
                        }
                        return {
                            ...item,
                            ...params,
                            top: item.top,
                            left: item.left,
                            [longKey]: item[longKey],
                            [shortKey]: (item[longKey] / params[longKey]) * params[shortKey],
                            cutId,
                            renderSetting: {
                                ...item.renderSetting,
                                startTime: timeObj.start,
                                endTime: timeObj.end,
                            },
                        };
                    }
                    return item;
                });
                yield put.resolve({
                    type: 'editor/changePartyByUuid',
                    payload: {
                        elementList: newDataList,
                        uuid: partyUUID,
                        saveCue: true,
                        haveChange: true,
                    },
                });
                yield put.resolve({
                    type: 'editor/reloadVideoDuration',
                    payload: {
                        uuid: partyUUID,
                    },
                });
                loopCount = 0;
                message.success('视频剪裁成功');
                yield put({
                    type: 'cancelCut',
                });
                return true;
            } else {
                yield put({
                    type: 'cancelCut',
                });
                message.error(failMsg);
                return false;
            }
        },
    },
    reducers: {
        save(state, { payload }) {
            return { ...state, ...payload };
        },
        cancelCut(state) {
            return {
                ...state,
                cutVideoUUID: null,
            };
        },
    },
    subscriptions: {},
};
