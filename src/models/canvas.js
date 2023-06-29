/* eslint-disable no-console */
/* eslint-disable import/first */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check
import { delay } from '../util/delayLoad';
import produce from 'immer';
import { cloneDeep } from 'lodash';
import Party2Canvas from '../services/party2Canvas';
import { checkType } from '../util/util';

const party2CanvasObj = {};
export default {
    namespace: 'canvas',
    state: {
        canvasObj: {},
        loadingObj: {},
        promiseList: {},
    },
    effects: {
        * waitLoading(
            {
                payload: { uuid },
            },
            { select },
        ) {
            while (true) {
                const { loadingObj = {} } = yield select(({ canvas }) => canvas);
                if (!loadingObj[uuid]) {
                    return true;
                }
                yield delay(50);
            }
        },
        // 片段改变时重新转换成canvas
        * drawParties({ payload }, { select, put }) {
            const { uuidArr, dataList, uuid } = payload;
            if (!dataList || !uuid) {
                // 如果没有数据 或者没有修改并且已经出图则不管
                console.log('没有找到片段对应的数据');
                return;
            }
            const { editor, canvas } = yield select(({ editor: inEditor, canvas: inCanvas }) => ({
                editor: inEditor,
                canvas: inCanvas,
            }));
            const { canvasObj, loadingObj, promiseList } = canvas;
            const preParty2Canvas = party2CanvasObj[uuid];
            if (!preParty2Canvas || preParty2Canvas.destroyed) {
                // 如果上一个绘图对象不存在，或者已经被销毁，那么绘制新的图形
            } else {
                // 如果上一个绘图对象存在，并且没有被销毁，那么先销毁上一个绘图对象
                preParty2Canvas.destroy();
            }

            // 单个元素设置延时时间,只绘制一个元素但是片段不只一个元素
            const isDelay = payload.delay ||
                (uuidArr && uuidArr.length === 1 && dataList.length !== 1);
            let currentCanvasObj = canvasObj;
            if (uuidArr && checkType(uuidArr, 'array')) {
                // uuidArr表示需要更新的元素，从canvasObj里面把这些元素删除掉
                uuidArr.forEach(item => {
                    currentCanvasObj[item] = null;
                });
                yield put.resolve({
                    type: 'save',
                    payload: { canvasObj: currentCanvasObj },
                });
                return;
            }
            yield put.resolve({
                type: 'beginLoading',
                payload: { uuid },
            });
            const party2Canvas = new Party2Canvas(dataList, uuid, editor.transverse);
            party2CanvasObj[uuid] = party2Canvas;
            const mergeLayer = party2Canvas.mergeLayer(currentCanvasObj, isDelay);
            loadingObj[uuid] = false;
            promiseList[uuid] = mergeLayer;
            const resCanvasObj = yield mergeLayer.catch((err) => {
                console.error(err);
                return false;
            });
            if (resCanvasObj === false) {
                return resCanvasObj;
            }
            yield put.resolve({
                type: 'save',
                payload: {
                    canvasObj: { ...currentCanvasObj, ...resCanvasObj },
                    loadingObj,
                    promiseList,
                },
            });
        },
    },
    reducers: {
        save(state, { payload }) {
            return { ...state, ...payload };
        },
        beginLoading(
            { loadingObj, ...state },
            {
                payload: { uuid },
            },
        ) {
            // eslint-disable-next-line no-param-reassign
            const newLoadingObj = {
                ...loadingObj,
                [uuid]: true,
            };
            return {
                ...state,
                loadingObj: newLoadingObj,
            };
        },
    },
    subscriptions: {},
};
