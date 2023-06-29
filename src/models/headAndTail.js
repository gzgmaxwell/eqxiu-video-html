/* eslint-disable no-console */
/* eslint-disable import/first */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check
import { cloneDeep } from "lodash";
import { message } from "antd";
import {
    CANVAS_TYPE,
    EDITOR_PRODUCT,
    HD_RESOLUTION,
    MIN_CONCAT_TIME,
    VIDEO_TYPE
} from "../config/staticParams";
import { getMaterial } from "../api/userVideo";
import MainEditorDataProvider from "../dataProvider/mainEdtior";
import { encodeMusic, genVideoUrl } from "../util/file";
import { createUUID } from "../util/data";

export default {
    namespace: "headAndTail",
    state: {
        head: {},
        tail: {}
    },
    effects: {
        *init({ payload: { head, tail } }, { put }) {
            yield put({
                type: "save",
                payload: {
                    head,
                    tail
                }
            });
        },
        *change({ payload: { type, item: oldItem } }, { put, select, call }) {
            const types = ["head", "tail"];
            const typeName = type === types[0] ? "片头" : "片尾";
            const {
                editor: { transverse, parties, product }
            } = yield select(({ editor }) => ({ editor }));
            if (product === EDITOR_PRODUCT.headTail) {
                message.error("片头片尾作品不能增加片头片尾片段");
                return false;
            }
            const { videoDuration, transverse: videoTransverse } = oldItem;
            const resloution = HD_RESOLUTION[videoTransverse ? "hoz" : "ver"];
            const {
                data: { obj, success }
            } = yield call(getMaterial, oldItem.id);
            if (!types.includes(type) || !success) {
                return false;
            }
            const editorDataProvider = new MainEditorDataProvider({
                videoId: oldItem.id,
                templateId: transverse ? 1 : 2,
                obj
            });
            let newData = null;
            try {
                newData = yield editorDataProvider.getPariesData(true).then(res => res[0]);
            } catch (e) {
                message.error("片头片尾更改失败，可能数据过旧");
                return false;
            }

            const defaultConcat = {
                duration: 400,
                concatType: "fade"
            };
            newData.renderSetting.concat = defaultConcat;
            newData.type = type === "head" ? 1 : 3;
            newData.title = type === "head" ? "片头" : "片尾";
            newData.elementList = newData.elementList.map(item => ({
                ...item,
                uuid: createUUID()
            }));
            newData = {
                ...newData,
                uuid: createUUID(),
                voice: {
                    name: "BGM",
                    url: genVideoUrl(oldItem.previewUrl),
                    volume: 100
                },
                transverse,
                voiceLoop: false
            };
            const editorSaveData = {};
            if (type === types[0]) {
                const newParties = cloneDeep(parties);
                const party = newParties[0];
                if (
                    party.renderSetting.segmentPartyDuration > MIN_CONCAT_TIME / 1000 &&
                    party.renderSetting.concatSet.concatType === "none"
                ) {
                    party.renderSetting.concatSet = defaultConcat;
                }
                newParties[0] = party;
                editorSaveData.parties = newParties;
            }
            editorSaveData.saveCue = true;
            yield put.resolve({
                type: "editor/save",
                payload: editorSaveData
            });
            message.success(`设置${typeName}成功`);
            yield put({
                type: "save",
                payload: {
                    [type]: newData
                }
            });
        },

        *delete({ payload: { type } }, { put }) {
            yield put.resolve({
                type: "editor/save",
                payload: { saveCue: true }
            });
            yield put({
                type: "save",
                payload: {
                    [type]: {}
                }
            });
        },

        *changeConcatSet({ payload }, { put, select }) {
            const {
                headAndTail: { tail: data },
                editor: { parties }
            } = yield select(({ headAndTail, editor }) => ({
                headAndTail,
                editor
            }));
            const concatSet = { ...payload };
            if (!data || !data.renderSetting) return;
            const newData = cloneDeep(data);
            if (
                data.renderSetting.segmentPartyDuration < 1 ||
                parties[parties.length - 1].renderSetting.segmentPartyDuration < 1
            ) {
                concatSet.concatType = "none";
            }
            newData.renderSetting.concatSet = { ...newData.renderSetting.concatSet, ...concatSet };
            yield put({
                type: "save",
                payload: {
                    tail: newData
                }
            });
        }
    },
    reducers: {
        save(state, { payload }) {
            return { ...state, ...payload };
        }
    },
    subscriptions: {}
};
