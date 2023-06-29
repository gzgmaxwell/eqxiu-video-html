import React from 'react';
import { connect } from 'dva';
import Logo from '../Logo';
import styles from './index.less';
import UserInfo from './userInfo';
import LoginButton from './loginButton';
import qs from 'qs';

const regexp = (path) => {
    const regu = /^\/templateShow/;
    const re = new RegExp(regu);
    return re.test(path);
};

function eqxLayoutShowAuth(opts) {
    //EqxLayout提供的登录注册中间件，可根据业务特征选用。例如ng项目可以使用eqx.ng.auth代替;
    headerComps.showAuth(opts)
        .then((res) => {
            if (res.type === 'register') {
                //...
                console.log('登录成功');
            } else if (res.type === 'login') {
                //...
                console.log('登录成功');
            } else if (res.type === 'reset') {
                //...
            }
        }, (data) => {
            //...
        });
}


@connect(({ user }) => ({ user }))
class Header extends React.PureComponent {


    componentDidMount() {
        this.showHeader();
    }

    componentDidUpdate(prevProps) {
        if (!prevProps.user.createEqXiuLayout && this.props.user.createEqXiuLayout) {
            this.showHeader();
        }
    }

    showHeader() {
        if (window.headerComps) {
            window.headerComps.headerDom.style.display = 'block';
        } else if (window.eqxLayout) {
            window.headerComps = window.eqxLayout.render('header', {
                activeTab: '视频商城', // 例：上导航‘产品中心’获焦，不传默认首页获焦
            })
                .setLogin((...e) => {
                    // 注册 登录回调
                    // eqxLayoutShowAuth({
                    //     type: 'login'
                    // });

                    this.props.dispatch({
                        type: 'user/needLogin',
                        payload: { noMessage: true },
                    })
                        .then(re => {
                            window.history.go(0); // 登录后刷新
                        });
                })
                .setRegister(() => {
                    // 注册 注册回调
                    eqxLayoutShowAuth({
                        type: 'register',
                    });

                });
        }
    }

    componentWillUnmount() {
        if (window.headerComps) {
            window.headerComps.headerDom.style.display = 'none';
        }
    }

    componentDidUpdate() {
        this.showHeader();
    }


    render() {
        return null;
    }
}

export default connect(({ user }) => ({ user }))(Header);
