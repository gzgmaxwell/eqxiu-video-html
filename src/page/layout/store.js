import React from 'react';
import { Route, Switch, Link, routerRedux } from 'dva/router';
import Header from './header/index.js';
import Footer from './footer';
import { connect } from 'dva';
import Store from 'Page/store/index';
import VideoDetail from 'Page/detail';
import { prev, storePrev, host } from 'Config/env';
import noPage from '../components/404';
import styles from './store.less';
import { Breadcrumb } from 'antd';
import qs from 'qs';
import { name } from '../../config/env';

let setInvaltime = null;

function getDetailsComponent({ location, match: { params = {} } }) {
    let { search } = location;
    search = search.replace('?', '');
    const searchObj = qs.parse(search) || {};
    if (name === 'pro') {
        window._hmt && window._hmt.push([`_trackPageview`, `store/video/detail/${params.id}`]);
    }

    const onChose = (e, videoWorksId) => {
        let url = '';
        if (videoWorksId) {
            url = `${host.client}/editor/${videoWorksId}?workTpl=${params.id}`;
        } else {
            url = `${host.client}/editor/${params.id}`;
        }
        window.location = url;
    };

    return (<div className={styles.details}>
        <div className={styles.Breadcrumb}>
            <Breadcrumb separator=">">
                <Breadcrumb.Item><Link to={`${window.__storePrev
                                              ? storePrev
                                              : `${prev}/store`}/video`}>全部视频</Link></Breadcrumb.Item>
                <Breadcrumb.Item>{searchObj.title}</Breadcrumb.Item>
            </Breadcrumb>
        </div>
        <VideoDetail id={params.id} onChose={onChose}/>
        <div className={styles.space}/>
        <Footer/>
    </div>);
};

class Layout extends React.PureComponent {

    componentDidMount() {
        this.showRightBlock();
    }

    componentDidUpdate() {
        this.showRightBlock();
    }


    componentWillUnmount() {
        if (window._rightBlock) {
            window._rightBlock.style.display = 'none';
        }
        clearInterval(setInvaltime);
        setInvaltime = null;
    }

    showRightBlock() {
        if (window._rightBlock) {
            window._rightBlock.style.display = 'block';
            clearInterval(setInvaltime);
            setInvaltime = null;
        } else if (window.eqxLayout) {
            try {
                window._rightBlock = window.eqxLayout.render('block');
            } catch (e) {
                console.log(e);
            }

            clearInterval(setInvaltime);
            setInvaltime = null;
        } else if (setInvaltime === null) {
            console.log('创建边栏定时器');
            setInvaltime = setInterval(this.showRightBlock, 30);
        }
    }

    render() {
        const { props } = this;
        return (
            <div>
                <Header location={props.location}/>
                <Switch>
                    <Route exact path={`${window.__storePrev ? storePrev : `${prev}/store`}/video`}
                           component={Store}/>
                    <Route exact path={`${window.__storePrev
                                          ? storePrev
                                          : `${prev}/store`}/video/detail/:id`}
                           component={getDetailsComponent}/>
                    <Route component={noPage}/>
                </Switch>
            </div>
        );
    }
}

export default Layout;
