import './config/http';
import dva from 'dva';
import createLoading from 'dva-loading';
import React from 'react';
// import * as Sentry from '@sentry/browser';
import router from './config/routes';
import onError from './config/onError';
import { createBrowserHistory } from 'history';
import models from './models';
import { apiClearExpired } from './util/apiCache';
import './page/global.less';
import './util/util';
import './page/reset.css';
import './page/common.css';
import { name } from './config/env';

window._tracker_ = window._tracker_ || [];
const history = createBrowserHistory();

// if (['pro', 'pre', 'test'].includes(name)) {
//     Sentry.init({ dsn: 'https://d5303b34a7464e7498ea0c0585c72e02@sentry-api.eqxiu.com/8' });
// }


console.log(name);
const app = dva({
        ...createLoading({
            effects: true,
        }),
        history,
        onError,
    },
);
app.use(require('dva-immer')
    .default());

// app.model(models)
for (const m of models) {
    if (m.namespace) {
        app.model(m);
    }
}
apiClearExpired();
app.router(router);
window._dva_app = app;
app.start('#root');
window._eqx_dispatch = app._store.dispatch;
// 工作台
// 导出dva 给其他组件使用
if (window._tracker_) {
    window._tracker_ = [];
}
window._tracker_.push(['client_type', 'PC']);
window._tracker_.push(['product', 'video']); // 填写产品名
window._tracker_.push(['b_v', '0']); // 数据版本
window._tracker_.push(['b_t', 'default']); // 业务类型
export default app._store;
