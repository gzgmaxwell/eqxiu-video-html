import { routerRedux } from 'dva/router';
import { message, Message } from 'antd';
import { prev } from '../config/env';
import userApi from 'Api/user';
import storageLocal from 'Util/storageLocal';
import LoginModal from 'Components/login.js';
import InvitationCode from 'Components/InvitationCode';
import MobileModel from 'Components/mobile.js';

let loginPromise = null;
let mobilePromise = null;
/* global EqxLayout */
let waiteLoginQuery = 0;

const localKey = storageLocal.key.userInfo;

const layoutLogin = (data) => {
    if (window.eqxLayout) {
        window.eqxLayout.config.user = data;
    } else {
        window.eqxLayout = new EqxLayout({
            root: 'container',              // 容器元素ID
            user: data || {},   // 用户信息
        });
    }
};

export function isChuangYiyunVip() { //  判断是否为在¥创意云会员
    const { members } = window._dva_app._store.getState().user;
    // const companyMembers = [7, 8, 9, 202, 203, 204, 22, 21];
    const companyMembers = [7, 8, 9];
    if (members &&
        members.some(item => item.memberId === 14 || companyMembers.includes(item.memberId))) {
        return true;
    }
    return false;
}

export function isShowker() {
    const { members, type } = window._dva_app._store.getState().user;
    const showkerMembers = [4];
    if (members && members.some(i => showkerMembers.includes(i.memberId)) || type === 4) {
        return true;
    }
    return false;
}

export default {
    namespace: 'user',
    state: {
        needLogin: false,
        isLogin: false,
        headImg: '',
        id: 0,
        phone: null,
        name: null,
        nick: null,
        status: 1,
        type: 0,
        createEqXiuLayout: false,
    },

    effects: {
        * loginSuccess({ payload }, { select, call, put }) {
            const response = yield call(userApi.getInfo);
            const replace = payload && payload.replace || false;
            if (response.data.success) {
                layoutLogin(response.data.obj);
                yield put({
                    type: 'save',
                    payload: {
                        ...response.data.obj,
                        isLogin: true,
                        needLogin: false,
                    },
                });
            }
            if (replace) {
                window.location.reload();
            }
        },
        * logout(action, { call, put }) {
            yield put({
                type: 'afterLogout',
                payload: {},
            });
        },
        /**
         * 需要登录的时候跳转到这里来控制 在成功登录后 继续返回相应的请求结果
         * @param action
         * @param put
         * @returns {IterableIterator<*>}
         */* needLogin({ payload: { noMessage = false, ...payload } = {} }, { put }) {
            if (!payload) {
                return LoginModal();
            }
            const { config = null, msg1 = null } = payload;
            if (loginPromise) {
                if (waiteLoginQuery < 10) {
                    waiteLoginQuery += 1;
                    const res = yield loginPromise;
                    waiteLoginQuery = 0;
                    if (res) {
                        return Promise.resolve(axios(config));
                    } else {
                        return Promise.reject();
                    }
                } else { // 为了防止登录完毕后发生了一次请求了过多次，加入阻断；
                    return null;
                }
            } else {
                noMessage || message.error(msg1 ? msg1 : '未登录，请登录。');
                yield put({
                    type: 'logout',
                });
                loginPromise = new Promise((resolve, reject) => {
                    LoginModal(resolve, reject);
                }).then(suc => true)
                    .catch(error => false);
                const res = yield loginPromise;
                if (res) {
                    loginPromise = null;
                    return Promise.resolve(axios(config));
                } else {
                    loginPromise = null;
                    yield put(routerRedux.push({ pathname: `${prev}/index` }));
                    return Promise.reject();
                }
            }
        },
        /**
         *  手机为未验证的先先进行手机验证
         * */* mobileVerification(action, { put }) {
            const { payload: { config, msg1 } } = action;
            if (mobilePromise) {
                if (waiteLoginQuery < 10) {
                    waiteLoginQuery += 1;
                    const res = yield mobilePromise;
                    waiteLoginQuery = 0;
                    if (res) {
                        return Promise.resolve(axios(config));
                    } else {
                        return Promise.resolve({ data: {} });
                    }
                }
            } else {
                // message.error('请先绑定邀请码');
                mobilePromise = new Promise((resolve, reject) => {
                    MobileModel(resolve, reject);
                }).then(success => true)
                    .catch(error => false);
                const res = yield mobilePromise;
                if (res) {
                    mobilePromise = null;
                    return Promise.resolve(axios(config));
                } else {
                    mobilePromise = null;
                    message.error('请绑定手机');
                    return Promise.resolve({ data: {} });
                }
            }
        },
        * needInvitationCode(action, { put }) {
            const { payload: { config } } = action;
            if (loginPromise) {
                if (waiteLoginQuery < 10) {
                    waiteLoginQuery += 1;
                    const res = yield loginPromise;
                    waiteLoginQuery = 0;
                    if (res) {
                        return Promise.resolve(axios(config));
                    } else {
                        return Promise.resolve({ data: {} });
                    }
                } else { // 为了防止登录完毕后发生了一次请求了过多次，加入阻断；
                    return null;
                }
            } else {
                message.error('请先注册邀请码后再使用');
                loginPromise = new Promise((resolve, reject) => {
                    InvitationCode(resolve, reject);
                }).then(suc => true)
                    .catch(error => false);
                const res = yield loginPromise;
                if (res) {
                    loginPromise = null;
                    return Promise.resolve(axios(config));
                } else {
                    loginPromise = null;
                    yield put(routerRedux.push({ pathname: `${prev}/index` }));
                    return Promise.resolve({ data: {} });
                }
            }
        },
        * isLogin({ payload }, { select, call, put }) {
            let info = null;
            const { isLogin } = yield select(({ user }) => user);
            if (isLogin) {
                return false;
            }
            if (info === null) {
                // 尝试获取信息
                const res = yield call(userApi.getInfo, true);
                if (res.data.success) {
                    info = res.data.obj;
                    storageLocal.setItem(localKey, info);
                }
            }
            layoutLogin(info);
            if (!info) {
                yield put({
                    type: 'save',
                    payload: {
                        isLogin: false,
                        needLogin: true,
                        createEqXiuLayout: true,
                    },
                });
                return false;
            }
            window._tracker_.push(['user_id', info.id]);
            yield put({
                type: 'save',
                payload: {
                    ...info,
                    isLogin: true,
                    needLogin: false,
                    createEqXiuLayout: true,
                },
            });
            layoutLogin();
            return null;
        },
    },

    reducers: {
        save(state, action) {
            return {
                ...state,
                ...action.payload,
            };
        },
        afterLogout(state, action) {
            return {
                isLogin: false,
            };
        },
    },
    subscriptions: {
        isLogin({ dispatch, history }) {
            dispatch({
                type: 'isLogin',
            });
        },
    },
};
