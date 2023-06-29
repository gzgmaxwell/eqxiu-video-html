import { routerRedux } from "dva/router";
import { Message } from "antd";
import { createUUID } from "../util/data";
import { hidden } from "ansi-colors";
import { getUserSetting, setUserSetting } from "../util/storageLocal";

const showRuleField = "showRule";

export default {
    namespace: "rules",
    state: {
        rulesYArray: [],
        rulesXArray: [],
        ruleIsShow: false,
        gridIsShow: false,
        gridCountX: 3,
        gridCountY: 3,
        captureXArray: [],
        captureYArray: []
    },

    effects: {},

    reducers: {
        addY(state, { payload }) {
            const { rulesYArray: oldArray } = state;
            const rulesYArray = [
                ...oldArray,
                {
                    uuid: createUUID(),
                    ...payload
                }
            ];
            return {
                ...state,
                rulesYArray
            };
        },
        addX(state, { payload }) {
            const { rulesXArray: oldArray } = state;
            const rulesXArray = [
                ...oldArray,
                {
                    uuid: createUUID(),
                    ...payload
                }
            ];
            return {
                ...state,
                rulesXArray
            };
        },
        updateRuleLine(state, { payload: { uuid, type, ...payload } }) {
            let oldArray = type === "y" ? state.rulesYArray : state.rulesXArray;
            const index = oldArray.findIndex(v => v.uuid === uuid);
            if (index === -1) return state;
            const key = type === "y" ? "rulesYArray" : "rulesXArray";
            const newArray = [...oldArray];
            newArray[index] = { ...oldArray[index], ...payload };
            return { ...state, [key]: newArray };
        },
        removeRuleLine(state, { payload: { uuid, type } }) {
            let oldArray = type === "y" ? state.rulesYArray : state.rulesXArray;
            const index = oldArray.findIndex(v => v.uuid === uuid);
            if (index === -1) return state;
            const key = type === "y" ? "rulesYArray" : "rulesXArray";
            const newArray = [...oldArray].filter(v => v.uuid !== uuid);
            return { ...state, [key]: newArray };
        },
        showRule(state) {
            setUserSetting(showRuleField, true);
            return { ...state, ruleIsShow: true };
        },
        hiddenRule(state) {
            setUserSetting(showRuleField, false);
            return { ...state, ruleIsShow: false };
        },
        showGrid(state) {
            setUserSetting("gridIsShow", true);
            return { ...state, gridIsShow: true };
        },
        hiddenGrid(state) {
            setUserSetting("gridIsShow", false);
            return { ...state, gridIsShow: false };
        },
        clearRuleLines(state) {
            return { ...state, rulesXArray: [], rulesYArray: [] };
        },
        updateGridX(state, { payload }) {
            if (isNaN(~~Number(payload))) return state;
            const gridCountX = Math.max(1, Math.min(~~Number(payload) || 3, 99));
            setUserSetting("gridCountX", gridCountX);
            return { ...state, gridCountX };
        },
        updateGridY(state, { payload }) {
            if (isNaN(~~Number(payload))) return state;
            const gridCountY = Math.max(1, Math.min(~~Number(payload) || 3, 99));
            setUserSetting("gridCountY", gridCountY);
            return { ...state, gridCountY };
        },
        updateCaputre(state, { payload }) {
            const {
                captureXArray = state.captureXArray,
                captureYArray = state.captureYArray
            } = payload;
            return { ...state, captureXArray, captureYArray };
        },
        clearCaputre(state) {
            return { ...state, captureYArray: [], captureXArray: [] };
        }
    },
    subscriptions: {
        setup({ dispatch, history }) {
            if (getUserSetting(showRuleField)) {
                dispatch({ type: "showRule" });
            }
            if (getUserSetting("gridIsShow")) {
                dispatch({ type: "showGrid" });
            }
            if (getUserSetting("gridCountY")) {
                dispatch({ type: "updateGridY", payload: getUserSetting("gridCountY") });
            }
            if (getUserSetting("gridCountX")) {
                dispatch({ type: "updateGridX", payload: getUserSetting("gridCountX") });
            }
        }
    }
};
