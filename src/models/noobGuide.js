import { message } from 'antd';
import { getDetail } from '../api/template';
import { byReason, NOOD_GUIDE_TEMPLATE_ID } from '../config/staticParams';
import { getInfo } from '../api/user';
import { prev } from '../config/env';
import { getItem, localStorageKey, setItem } from '../util/storageLocal';
import { sendBDPage } from '../services/bigDataService';
import { genStoreData } from '../util/util';

let localKey = ''; // localStorage 的key值

export default {
    namespace: 'noobGuide',
    state: {
        localKey: '', // localStore 存放Key；
        previewUrl: '',
        coverImg: '',
        title: '',
        isNoob: null, // 是否是新手
        pathname: '',
    },

    effects: {
        * init({ payload: { pathname } }, { select, call, put }) {
            const { noobGuide: { isNoob } } = yield select(
                ({ noobGuide }) => ({ noobGuide }));
            if (isNoob || isNoob === false ||
                ![`${prev}/index`, `${prev}/index/0`].includes(pathname)) {
                return;
            }
            const { data: { success: userSuccess = false, obj: userObj } = {} } = yield call(
                getInfo, true);
            if (!userObj) return;
            const { phone, id: userId } = userObj;
            if (!userId) return;
            localKey = `${localStorageKey.endNoobGuide}-${userId}`;
            if (!userSuccess) { // 没有请求成功
                yield put({
                    type: 'save',
                    payload: {
                        isNoob: false,
                    },
                });
                return;
            }
            const isPassed = getItem(localKey); // 看localStore里面是否已经通过
            if (isPassed) {
                yield put({
                    type: 'save',
                    payload: {
                        isNoob: false,
                    },
                });
                return;
            }
            if (!phone) { // 没有手机
                yield put({
                    type: 'save',
                    payload: {
                        localKey,
                        isNoob: false,
                    },
                });
                return;
            }
            const { data: { success = false, obj = {} } = {} } =
                yield call(getDetail, NOOD_GUIDE_TEMPLATE_ID);
            if (success) {
                yield put({
                    type: 'save',
                    payload: {
                        ...obj,
                        isNoob: true,
                        localKey,
                    },
                });
                sendBDPage('noobGuide/show');
            }
        },

        * passed(action, { put }) {
            yield put({
                type: 'save',
                payload: { isNoob: false },
            });
            setItem(localKey, genStoreData(byReason.passed));
        },

        * cancel(action, { put }) {
            yield put({
                type: 'save',
                payload: { isNoob: false },
            });
            setItem(localKey, genStoreData(byReason.refuse));
        },

        * close(action, { put }) {
            yield put({
                type: 'save',
                payload: { isNoob: false },
            });
        },
    },

    reducers: {
        save(state, action) {
            return {
                ...state,
                ...action.payload,
            };
        },
    },
    subscriptions: {
        setup({ dispatch, history }) {
            history.listen(({ pathname }) => {
                dispatch({
                    type: 'init',
                    payload: { pathname },
                });
                dispatch({
                    type: 'save',
                    payload: { pathname },
                });
            });
        },
    },
};
