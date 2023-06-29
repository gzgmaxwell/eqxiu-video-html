/* eslint-disable no-console */
import qs from 'qs';
import { isString } from '../util/util';
import onError from './onError';
/* global axios */

const type = 'application/x-www-form-urlencoded';
const accept = '*/*';
axios.defaults.headers['Content-Type'] = type;
axios.defaults.headers.Accept = accept;
axios.defaults.withCredentials = true;

function commonError(data) {
  const error = {};
  switch (data.code) {
    case 1001:
    case 1002:
      error.name = 401;
      error.msg = data.msg;
      error.config = data.config;
      return onError(error);
    case 200001:
      error.name = 200001;
      error.msg = data.msg;
      return onError(error);
    case 1010:
      error.name = 1010;
      error.msg = data.msg;
      return onError(error);
    case 200201:
      error.name = 200201;
      error.msg = data.msg;
      return onError(error);
    case 200008:
      error.name = 200008;
      error.msg = data.msg;
      error.config = data.config;
      return onError(error);
    default:
      error.name = data.code;
      error.msg = data.msg;
      error.config = data.config;
      return onError(error);
  }
}
// 在发送请求之前做某件事
axios.interceptors.request.use(
  (config) => {
    // 不需要拦截器统一处理
    if (config.ignoreInterceptor) {
      return config;
    }

    if (
      config.method === 'post' &&
      config.headers['Content-Type'] === type &&
      !isString(config.data)
    ) {
      // 默认是{arrayFormat: 'indices'}，jquery默认是brackets，ng默认是repeat
      // 参考https://www.npmjs.com/package/qs
      // eslint-disable-next-line no-param-reassign
      config.data = qs.stringify(config.data);
    }
    return config;
  },
  err => Promise.reject(err),
);

// 在发送响应之前做某件事
axios.interceptors.response.use(
  (res) => {
    // 不需要拦截器统一处理
    if (res.config.ignoreInterceptor) {
      return res;
    }

    // 如果是字符串则不处理data，比如取svg内容时
    if (isString(res.data)) {
      return res;
    }

    if (!res.data) {
      res.data = {};
    }

    const { data } = res;

    if ('list' in data) {
      data.list = data.list || [];
    }

    // true正常返回，根据code单独处理
    if (data.success) {
      return res;
    }
    // 1001 未登录，刷新的时候会进来
    data.config = res.config;
    return commonError(data);
  },
  (err) => {
    let error = '';
    if (err.__CANCEL__ || err.config.ignoreInterceptor) {
      return Promise.reject(err);
    }
    if (!err.response) {
      console.log('网络请求失败，请稍后重试');
      error = new Error('网络请求失败，请稍后重试');
      error.name = -1;
      onError(error);
      return Promise.resolve({ data: {} });
    }

    const { status } = err.response;
    // 1002 登录超时，操作的时候会进来
    if (status === 401) {
      error = {
        code: 1001,
        config: err.config,
      };
      return commonError(error);
    } else if (status === 403) {
      error = { code: 403 };
    }

    if (status === 500) {
      error = { code: 500 };
    }
    return Promise.resolve({ data: {} });
  },
);
