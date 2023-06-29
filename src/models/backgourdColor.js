import { routerRedux } from 'dva/router';
import { Message } from 'antd';

const queryCurrent = '';

export default {
    namespace: 'backgruondColor',
    state: {
        backgroundWhite: false,
    },

    effects: {
        *setWhite(_, { call, put }) {
            // const response = yield call(queryCurrent);
            yield put({
                type: 'white',
            });
        },
        *removeWhite({ payload }, { call, put }) {
            yield put({
                type: 'cancel',
            });
        },
    },

    reducers: {
        white(state, action) {
            return {
                ...state,
                backgroundWhite: true,
            };
        },
        cancel(state, action) {
            return {
                ...state,
                backgroundWhite: false,
            };
        },

    },
    subscriptions: {
        setup({ dispatch, history }) {

        },
    },
};
