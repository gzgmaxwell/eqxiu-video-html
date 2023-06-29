/* eslint-disable no-console */
/* eslint-disable import/first */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-check
import cloneDeep from 'lodash/cloneDeep';
import qs from 'qs';
import LikeVideo from '../services/likeVideo';
import { ANIMATION_TYPES } from '../dataBase/animations';
import eventEmitter from '../services/EventListener';

let likeVideo = null;

export default {
    namespace: 'timeLine',
    state: {
        currentTimes: {},
        maxTime: 999,
        minTimeObj: {},
        playing: false,
        onWait: [],
    },
    effects: {
        * init(action, { select, put }) {
            const { editor: { parties } } = yield select(({ editor }) => ({ editor }));
            const currentTimes = {};
            const minTimeObj = {};
            const isWorkTpl = (qs.parse(window.location.search.replace('?', '')) || {}).workTpl;
            parties.forEach((v) => {
                v.elementList.forEach(item => {
                    if (item.animate) {
                        const { startTime } = item.renderSetting || {};
                        const { animationDuration: inDuration = 0 } = item.animate[ANIMATION_TYPES.ENTRANCE] ||
                        {};
                        const { animationDuration: stayDuration = 0, delay = 0 } = item.animate[ANIMATION_TYPES.STAY] ||
                        {};
                        const { animationDuration: outDuration = 0 } = item.animate[ANIMATION_TYPES.EXITS] ||
                        {};
                        minTimeObj[item.uuid] = (inDuration + delay + stayDuration + outDuration) /
                            1000;
                    }
                });
                currentTimes[v.uuid] = isWorkTpl ? Math.max(0,
                    (v.renderSetting.segmentPartyDuration - 1) * 1000) : 0;
            });
            yield put({
                type: 'save',
                payload: {
                    currentTimes,
                    minTimeObj,
                },
            });
        },
        * changeCurrentTime2({ payload }, { put }) {
            yield put({
                type: 'saveCurrentTime',
                payload,
            });
        },
        * setMinTime({ payload: { uuid, minTime } }, { put, select }) {
            const { timeLine: { minTimeObj } } = yield select(({ timeLine }) => ({ timeLine }));
            minTimeObj[uuid] = minTime;
            yield put({
                type: 'save',
                payload: {
                    minTimeObj,
                },
            });
        },
        * play(action, { put, select, call }) {
            const { timeLine: { playing, currentTimes }, workspace: { uuid } } = yield select(({ timeLine, workspace }) => ({
                timeLine,
                workspace
            }));
            yield put({ type: 'setPlay' });
            return true;
        },

        * pause(action, { put, select }) {
            const { timeLine: { playing } } = yield select(({ timeLine }) => ({ timeLine }));
            yield put({ type: 'setPause' });
            return true;
        },
        * addWait({ payload: { uuid } }, { put, select }) {
            const { timeLine: { onWait = [] }, } = yield select(({ timeLine, }) => ({ timeLine, }));
            if (onWait.includes(uuid)) {
                return true;
            }
            const newOnWait = onWait.concat([uuid]);
            yield put({
                type: 'save',
                payload: { onWait: newOnWait }
            });
        },
        * removeWait({ payload: { uuid } }, { put, select }) {
            const { timeLine: { onWait = [] }, } = yield select(({ timeLine, }) => ({ timeLine, }));
            if (!onWait.includes(uuid)) {
                return true;
            }
            const newOnWait = onWait.filter(item => item !== uuid);
            yield put({
                type: 'save',
                payload: { onWait: newOnWait }
            });
        },

        * changeCurrentTime({ payload: { currentTime, uuid, keepPlaying = false } }, { put, select }) {
            const { timeLine: { playing } } = yield select(({ timeLine }) => ({ timeLine }));
            // let newPlaying = playing;
            if (playing && !keepPlaying) {
                eventEmitter.emit('resetPlayer');
                yield put({
                    type: 'setPause',
                });
            }
            yield put({
                type: 'saveCurrentTime',
                payload: {
                    currentTime,
                    uuid,
                },
            });
        }
    },
    reducers: {
        save(state, { payload }) {
            return { ...state, ...payload };
        },
        setPlay(state) {
            return {
                ...state,
                playing: true,
            };
        },
        setPause(state) {
            return {
                ...state,
                playing: false,
            };
        },
        saveCurrentTime(state, { payload: { currentTime, uuid, } }) {
            return {
                ...state,
                currentTimes: {
                    ...state.currentTimes,
                    [uuid]: currentTime,
                },
            };
        },
        clearWaiting(state) {
            return {
                ...state,
                onWait: [],
            };
        },
        stepCurrentTime(state, { payload: { uuid } }) {
            const currentTime = ~~(state.currentTimes[uuid] / 100) * 100;
            return {
                ...state,
                currentTimes: {
                    ...state.currentTimes,
                    [uuid]: currentTime,
                },
            };
        },
        beginLoading({ loadingObj, ...state },
                     {
                         payload: { uuid },
                     },) {
            // eslint-disable-next-line no-param-reassign
            loadingObj[uuid] = true;
            return {
                ...state,
                loadingObj,
            };
        },
    },
    subscriptions: {},
};
