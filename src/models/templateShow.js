import { Message } from 'antd';
import templateShow from 'Api/templateShow';
import template from '../api/template';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export default {
    namespace: 'templateShow',
    /**
     * 状态status: 0未开始,5提交后台中,10效验中,20效验完成 30效验失败
     * 渲染状态renderStatus： 0未请求，1请求中，3渲染失败，4渲染完成
     * 上传类型uploadType：0未设置，1模板组，2片段模板 3视频片段
     */
    state: {
        status: 0,
        uploadType: 0, // 模板状态
        templateId: null, // 模板ID
        isLockTemplate: false, // 模板锁，取消验证时就不会再重置
        errorMessage: '',
        delayTime: 2000,
        cancelFiled: false, // 取消字段
        renderId: null,
        renderStatus: 0,
        renderErrorMessage: null,
        renderVideoUrl: null,
    },

    effects: {
        *reset(action, { put }) {
            yield put({
                type: 'save',
                payload: {
                    status: 0,
                    uploadType: 0, // 模板状态
                    templateId: null, // 模板ID
                    isLockTemplate: false, // 模板锁，取消验证时就不会再重置
                    errorMessage: '',
                    delayTime: 2000,
                    cancelFiled: false, // 取消字段
                    renderId: null,
                    renderStatus: 0,
                    renderErrorMessage: null,
                    renderVideoUrl: null,
                },
            });
        },
        *update({ payload }, { put }) {
            yield put({
                type: 'save',
                payload: { ...payload },
            });
        },
        *setUploadType({ payload: { uploadType } }, { call, put }) {
            yield put({
                type: 'save',
                payload: { uploadType },
            });
        },
        *videoConcat({ payload }, { call, put }) {
            const { param } = payload;
            yield put({
                type: 'save',
                payload: {
                    renderStatus: 1,
                    renderErrorMessage: '',
                    cancelFiled: false,
                },
            });
            const response = yield call(templateShow.videoConcat, param);
            if (!response || !response.data || !response.data.success) {
                yield put({
                    type: 'save',
                    payload: {
                        renderStatus: 3,
                        renderErrorMessage: response && response.data && response.data.msg || '',
                        cancelFiled: false,
                    },
                });
                return null;
            }
            const id = payload.id;
            yield put({
                type: 'save',
                payload: {
                    renderId: id,
                    cancelFiled: false,
                },
            });
            yield put.resolve({
                type: 'getRenderStatus',
            });
        },

        *getRenderStatus(action, { select, call, put }) {
            const { renderId, delayTime, renderStatus } = yield select(
                ({ templateShow }) => templateShow);
            let time = 0;
            while (true) {
                const cancel = yield select(({ templateShow }) => (templateShow.cancelFiled));
                if (cancel) {
                    yield put({
                        type: 'save',
                        payload: { cancelFiled: false },
                    });
                    return '';
                }
                const response = yield call(templateShow.getRenderStatus, renderId);
                const re = response.data;
                if (time === 0) {
                    Message.info('已经申请渲染');
                }
                if (re.success) {
                    // 0:初始提交 1:提交验证 2:验证渲染 3:验证失败 4:验证成功 5:审核提交 6:审核失败 7审核成功//
                    switch (re.obj.status) {
                        case 4:
                        case 5:
                        case 7:
                            const videoRes = yield call(template.getDetail, renderId);
                            if (videoRes.data.success) {
                                Message.success('拼接完毕');
                                const renderVideoUrl = videoRes.data.obj.previewUrl;
                                yield put({
                                    type: 'save',
                                    payload: {
                                        renderStatus: 4,
                                        renderErrorMessage: re.obj.msg,
                                        renderVideoUrl,
                                    },
                                });
                                time = 0;
                                return null;
                            }
                            break;
                        case 3:
                        case 6:
                            yield put({
                                type: 'save',
                                payload: {
                                    renderStatus: 3,
                                    renderErrorMessage: re.obj.msg,
                                },
                            });
                            time = 0;
                            return '';
                        default:
                            break;
                    }
                }
                // 每7次请求提示下
                time += 1;
                if (time % 7 === 0) {
                    time = 1;
                    Message.info('正在拼接，请稍后...');
                }
                yield delay(delayTime);
            }
        },
        /**
         * 开始验证
         * @param payload
         * @param call
         * @param put
         */ *fetch({ payload }, { select, call, put }) {
            const { uploadType, templateId, status } = yield select(
                ({ templateShow }) => templateShow);
            if (uploadType === 0) {
                Message.error('请选择上传类型');
                return false;
            }
            if (status === 5) {
                Message.error('正在提交渲染，请稍等');
                return false;
            }
            yield put({
                type: 'save',
                payload: { status: 5 },
            });
            if (payload.videoLocation) {
                const response = yield call(templateShow.saveAndValid, payload.videoLocation,
                    templateId, uploadType);
                const { data } = response;
                if (data.success) {
                    yield put({
                        type: 'save',
                        payload: {
                            templateId: data.obj,
                            status: 10,
                            cancelFiled: false,
                            callBackFunction: payload.callBackFunction,
                        },
                    });
                    yield put.resolve({
                        type: 'getStatus',
                    });
                } else {
                    yield put({
                        type: 'save',
                        payload: { status: 0 },
                    });
                }
            }
        },
        /**
         * 定时获取状态
         * @param action
         * @param select
         * @param call
         * @param put
         */ *getStatus(action, { select, call, put }) {
            const { templateId, delayTime, callBackFunction, uploadType } = yield select(
                ({ templateShow }) => templateShow);
            let time = 0;
            while (true) {
                const cancel = yield select(({ templateShow }) => (templateShow.cancelFiled));
                if (cancel) {
                    yield put({
                        type: 'save',
                        payload: { cancelFiled: false },
                    });
                    return '';
                }
                const response = yield call(templateShow.getSegmentStatus, templateId);
                const re = response.data;
                if (time === 0) {
                    Message.info('已经提交验证,根据文件大小,花费时间可能不同。');
                }
                if (re.success) {
                    // 0:初始提交 1:提交验证 2:验证渲染 3:验证失败 4:验证成功 5:审核提交 6:审核失败 7审核成功//
                    switch (re.obj[re.obj.length - 1].status) {
                        case 4:
                        case 5:
                        case 7:
                            if (typeof callBackFunction === 'function') {
                                callBackFunction(uploadType === 1 ? re.obj : templateId);
                            }
                            time = 0;
                            return null;
                        case 3:
                        case 6:
                            yield put({
                                type: 'save',
                                payload: {
                                    status: 30,
                                    errorMessage: re.obj[re.obj.length - 1].msgDetail ||
                                        re.obj[re.obj.length - 1].msg,
                                },
                            });
                            time = 0;
                            return '';
                        default:
                            break;
                    }
                }
                // 每7次请求提示下
                time += 1;
                if (time % 7 === 0) {
                    time = 1;
                    Message.info('正在效验中，请稍后...');
                }
                yield delay(delayTime);
            }
        },
        *lock({ payload }, { put }) {
            yield put({
                type: 'save',
                payload: { isLockTemplate: payload },
            });
        },
        /**
         * 取消验证
         * @param action
         * @param select
         * @param call
         * @param put
         */ *cancelVaild(action, { select, call, put }) {
            const { uploadType, templateId, isLockTemplate } = yield select(
                ({ templateShow }) => templateShow);
            yield put({
                type: 'save',
                payload: {
                    cancelFiled: true,
                    status: 0,
                    templateId: isLockTemplate ? templateId : null,
                    uploadType: isLockTemplate ? uploadType : 0,
                    errorMessage: null,
                    renderId: null,
                    renderStatus: 0,
                },
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

        },
    },
}
;
