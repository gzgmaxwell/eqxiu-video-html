/* eslint-disable no-console */
/* eslint-disable import/first */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check

import { getNotSupportElements } from '../api/templateShow';
import { HASH_TYPE } from '../config/staticParams';

export default {
    namespace: 'supportElements',
    state: {
        notSupportElements: {},
    },
    effects: {
        * init(action, { put, select, call }) {
            const { supportElements: { notSupportElements } } = yield select(
                ({ supportElements }) => ({ supportElements }));
            if (notSupportElements.applet) {
                return;
            }
            const {
                data: {
                    success, map: {
                        appletElementLimit = [],
                        appElementLimit = [],
                    } = {},
                },
            } = yield call(getNotSupportElements);
            if (success) {
                const toCanvasType = (type) => HASH_TYPE[~~type];
                const newNotSupportElements = {
                    applet: Array.isArray(appletElementLimit) &&
                        appletElementLimit.map(toCanvasType) || [],
                    app: Array.isArray(appElementLimit) && appElementLimit.map(toCanvasType) || [],
                };
                yield put({
                    type: 'save',
                    payload: {
                        notSupportElements: newNotSupportElements,
                    },
                });
            }
        },
    },
    reducers: {
        save(state, { payload }) {
            return { ...state, ...payload };
        },
    },
    subscriptions: {
        getSupport({ dispatch, history }) {
            dispatch({
                type: 'init',
            });
        },
    },
};
