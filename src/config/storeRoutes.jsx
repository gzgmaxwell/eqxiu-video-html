import React from 'react';
import { Router, Route, Switch, Redirect } from 'dva/router';
import dynamic from 'dva/dynamic';
const prev  = '';

function RouterConfig({ history, app }) {

    const routes = [
        {
            path: `${prev}/`,
            component: () => import('Page/layout/store'),
        },
    ];
    console.log(history);
    return (
        <div>
            <Router history={history}>
                <Switch>
                    {
                        routes.map(({ path, children, ...dynamics }, key) => (
                            <Route key={key}
                                   path={path}
                                   component={dynamic({
                                       app,
                                       ...dynamics,
                                   })}
                            />
                        ))
                    }
                </Switch>
            </Router>
        </div>
    );
}

export default RouterConfig;
