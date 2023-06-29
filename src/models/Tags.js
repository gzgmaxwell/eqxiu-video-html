import { Message } from 'antd';
import { routerRedux } from 'dva/router';
import template from 'Api/template';
import { genTag } from '../util/tag';
import SEGMENT_TYPE, { LABEL_LIST } from '../config/staticParams';
import { delay } from '../util/delayLoad';

const queryCurrent = '';

const color = {
    width: 20,
    height: 20,
};


function genTree(arr, parentId = null) {
    return arr.map(item => ({
        ...genTag(item, parentId),
        paramsname: 'tag',
        children: Array.isArray(item.children)
            ? genTree(item.children, item.id)
            : null,
    }));
}

export default {
    namespace: 'tags',
    state: {
        list: [],
        ids: new Map(),
        prevTime: 0,
    },

    effects: {
        *fetch(_action, { select, call, put }) {
            const { list } = yield select(({ tags }) => tags);
            if (list.length !== 0) {
                return;
            }
            const response = yield call(template.getTagsTree);
            const { prevTime } = yield select(({ tags }) => (tags));
            if (Date.parse(new Date()) / 1000 - prevTime < 24 * 60 * 60) {
                return false;
            }
            const { data } = response;
            if (data.success) {
                const list = genTree(data.obj);
                yield put({
                    type: 'save',
                    payload: {
                        list,
                        prevTime: Date.parse(new Date()) / 1000,
                    },
                });
            }
        },
    },

    reducers: {
        save(state, action) {
            return {
                ...action.payload,
            };
        },
        afterLogout(state, action) {
            return {
                ...state,
                isLogin: false,
            };
        },
    },
    subscriptions: {
        setup({ dispatch, history }) {
            dispatch({
                type: 'fetch',
            });
        },
    },
};
