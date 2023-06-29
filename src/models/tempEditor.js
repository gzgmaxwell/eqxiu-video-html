import { getMyTemplates, statistics } from '../api/templateShow';
import { TEMPLATE_STATUS } from '../config/staticParams';
import { delay } from '../util/delayLoad';

let cancel = false;

export default {
    namespace: 'tempEditor',
    state: {
        list: [],
        total: 0,
        statisticsList: [],
        statisticsTotal: 0,
    },
    effects: {

        * loopRequest({ payload }, { call, put }) {
            const { data } = yield call(getMyTemplates, payload);
            if (data.success) {
                const { list, map: { count } } = data;
                yield put({
                    type: 'save',
                    payload: {
                        list,
                        total: count,
                    },
                });
                if (!cancel && list.some(item => item.status === TEMPLATE_STATUS.rendering)) {
                    yield delay(2000);
                    yield put.resolve({
                        type: 'loopRequest',
                        payload,
                    });
                }
            }
        },


        * getData({ payload }, { select, put }) {
            cancel = true;
            const { loading: { effects } } = yield select(({ loading }) => ({ loading }));
            if (effects['tempEditor/loopRequest']) {
                // 如果还在运行 等运行结束
                yield delay(200);
                yield put.resolve({
                    type: 'getData',
                    payload,
                });
            } else {
                cancel = false;
                yield put.resolve({
                    type: 'loopRequest',
                    payload,
                });
            }

        },


        * statistics({ payload }, { call, put }) {
            const { data } = yield call(statistics, payload);
            if (data.success) {
                const { list, map: { count } } = data;
                yield put({
                    type: 'save',
                    payload: {
                        statisticsList: list,
                        statisticsTotal: count,
                    },
                });
            }
        },
    },
    reducers: {
        save(state, { payload }) {
            return { ...state, ...payload };
        },
        reset(state, { payload }) {
            return { ...state, ...payload };
        },
    },
    subscriptions: {},
};
