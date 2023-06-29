// @ts-check
/* eslint-disable react/prop-types */
import React from 'react';
import { Router, Route, Switch, Redirect } from 'dva/router';
import dynamic from 'dva/dynamic';
import { prev, host } from './env';
import NoobGuide from '../page/noob';

const Redir = () => <Redirect to={`${prev}/index`}/>;

const reprev = (history) => {
    const {
        location: { pathname },
    } = history;
    if (pathname.indexOf(prev) !== 0) {
        const newLocation = history.location;
        window.location.href = `${host.client}/store/video`;
        newLocation.pathname = `${prev}/store/video`;
        return <Redirect to={newLocation}/>;
    }
};

function RouterConfig({ history, app }) {
    const routes = [
        {
            // 编辑器
            path: `${prev}/HTEditor/:oriTemplateId/:id?`,
            component: () => import('../page/editor/userEditor'),
            models: () => [
                import('../models/workspace'),
                import('../models/canvas'),
                import('../models/multiple'),
                import('../models/timeLine'),
                import('../models/headAndTail'),
                import('../models/supportElements'),
                import('../models/looper'),
                import('../models/rules'),
            ],
        },
        {
            // 主编辑器
            path: `${prev}/editor/:oriTemplateId/:id?`,
            component: () => import('../page/editor/userEditor'),
            models: () => [
                import('../models/workspace'),
                import('../models/canvas'),
                import('../models/multiple'),
                import('../models/timeLine'),
                import('../models/headAndTail'),
                import('../models/supportElements'),
                import('../models/looper'),
                import('../models/rules'),
            ],
        },
        {
            // c策四
            path: `${prev}/cover`,
            component: () => import('../page/components/cover'),
        },
        {
            // 时间轴引导教程
            path: `${prev}/timeGuide`,
            component: () => import('../page/guide/timeGuide'),
        },
        {
            // 如何使用营销组件引导教程
            path: `${prev}/marketGuide`,
            component: () => import('../page/guide/marketGuide'),
        },
        {
            // 如何使用微信公众号引导教程
            path: `${prev}/subscriptionGuide`,
            component: () => import('../page/guide/subscriptionGuide'),
        },
        {
            // 一键快闪编辑器
            path: `${prev}/subEditor/flash/:type/:worksId?`,
            component: () => import('../page/subEditor/flashEditor'),
            models: () => [
                import('../models/flash'),
                import('../models/headAndTail'),
                import('../models/canvas')],

        },
        {
            // 字说字话编辑器
            path: `${prev}/subEditor/typeMonkey/:type/:worksId?`,
            component: () => import('../page/subEditor/typeMonkey'),
            models: () => [
                import('../models/headAndTail'),
                import('../models/typeMonkey'),
            ],

        },
        {
            // 字幕编辑器
            path: `${prev}/subEditor/subtitles/:id/:worksId?`,
            component: () => import('../page/subEditor/subtitles'),
            models: () => [
                import('../models/subtitles'),
                import('../models/multiple'),
            ],
        },
        {
            // 简易编辑器
            path: `${prev}/simpleEditor/:oriTemplateId/:id?`,
            component: () => import('../page/simpleEditor'),
            models: () => [
                import('../models/workspace'),
                import('../models/canvas'),
                import('../models/multiple'),
                import('../models/timeLine'),
                import('../models/headAndTail'),
                import('../models/looper'),
            ],
        },
        {
            path: `${prev}/store`,
            component: () => import('../page/layout/store'),
        },
        {
            path: `${prev}/introduce`,
            component: () => import('../page/introduce/index'),
        },
        {
            path: `${prev}/share`,
            component: () => import('../page/components/shareSet/index'),
        },
        {
            path: `${prev}/subtitles`,
            component: () => import('../page/subEditor/subtitles/time'),
        },
        {
            path: 'video',
            component: () => import('../page/introduce/index'),
        },
        {
            path: `${prev}/test`,
            component: () => import('../page/editor/videoStore/index'),
        },
        {
            path: `${prev}/`,
            component: () => import('../page/layout/index'),
        },
        {
            path: '',
            component: () => import('../page/layout/store'),
        },
    ];
    return (
        <div>
            <NoobGuide history={history}/>
            <Router history={history}>
                <Switch>
                    {reprev(history)}
                    <Route exact path={`${prev}/`} component={Redir}/>
                    {routes.map(({ path, children, ...dynamics }) => (
                        <Route
                            key={path}
                            path={path}
                            component={dynamic({
                                // @ts-ignore
                                app,
                                ...dynamics,
                            })}
                        />
                    ))}
                </Switch>
            </Router>
        </div>
    );
}

export default RouterConfig;
