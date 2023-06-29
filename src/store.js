import './config/http';
import dva from 'dva';
import createLoading from 'dva-loading';
import React from 'react';
import router from './config/storeRoutes';
import onError from './config/onError';
import { createBrowserHistory } from 'history';
import models from './models/store';
import { apiClearExpired } from './util/apiCache';

require('./util/util');

require('./page/reset.css');
require('./page/common.css');
window._tracker_ = window._tracker_ || [];

const history = createBrowserHistory();
const app = dva(
    ...createLoading({
        effects: true,
    }),
    {
        history,
        onError,
    },
);

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
export default app._store;
