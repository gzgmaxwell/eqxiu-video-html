/* eslint-disable no-console */
import { message } from 'antd';

message.config({
    top: 150,
});
/**
 *  错误处理中心
 * @param e
 * @param dispatch
 * @returns {null}
 */
const error = (e) => {
    console.error(e);
    console.trace();
    switch (e.name) {
        case -1:
            message.error('网络错误,请检查网络连通性或者联系管理员');
            break;
        case 1011:
            message.error('不存在该数据');
            break;
        case 200008: {
            const resm = window._eqx_dispatch({
                type: 'user/mobileVerification',
                payload: {
                    config: e.config,
                    msg1: e.msg,
                },
            });
            return resm;
        }
        case 401: {
            const res = window._eqx_dispatch({
                type: 'user/needLogin',
                payload: {
                    config: e.config,
                    msg1: e.msg,
                },
            })
                .then((res) => {
                    if (window.location && !window.location.href.includes('editor')) {
                        window.location.reload();
                    }
                    return res;
                });
            return res;
        }
        case 200303: {
            console.log(e.config);
            const res1 = window._eqx_dispatch({
                type: 'user/needInvitationCode',
                payload: {
                    config: e.config,
                    msg1: e.msg,
                },
            });
            return res1;
        }
        case 403:
            message.error('您的权限不够');
            break;
        default: {
            const msg = e.msg || e.message;
            console.log(msg);
            if (msg) {
                message.error(msg);
            } else {
                message.error('系统异常');
            }
            break;
        }
    }
    if (typeof e.preventDefault === 'function') {
        e.preventDefault();
    }
    return {
        data: {
            msg: e.msg,
            success: false,
        },
    };
};

export default error;
