export default {
    namespace: 'multiple',
    state: {
        changeValue: null,
    },
    effects: {
        * changeValue({ payload: { changeValue } }, { select, put }) {
            yield put({
                type: 'save',
                payload: {
                    changeValue,
                }
            });
        },
    },
    reducers: {
        save(state, { payload }) {
            return { ...state, ...payload };
        },
        reset(state) {
            return {
                ...state,
                changeValue: null
            };
        },
    },
    subscriptions: {}
    ,
}
;
