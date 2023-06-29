import React from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { prev } from '../../config/env';


@connect(({ user }) => ({ user }))
class LeftSider extends React.PureComponent {

    state = {
        tab_list: [
            //   {
            //   title: '帮助中心',
            //   href: ''
            // }
        ],
    };

    componentDidMount() {
        this.showSider();
    }

    componentDidUpdate(prevProps) {
        if (!prevProps.user.createEqXiuLayout && this.props.user.createEqXiuLayout) {
            this.showSider();
        }
    }

    componentWillUnmount() {
        if (window.leftSider) {
            window.leftSider.sideBarNavDom.style.display = 'none';
        }
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        const newState = { ...prevState };
        if (nextProps.tab_list) {
            newState.tab_list = nextProps.tab_list;
        }
        return newState;
    }

    showSider() {
        if (window.leftSider) {
            window.leftSider.sideBarNavDom.style.display = 'block';
        } else if (window.eqxLayout) {
            window.leftSider = window.eqxLayout.render('sidebar-nav');
            const { props: { dispatch } } = this;
            try {
                window.leftSider.customNavHandle([
                    {
                        name: '我的作品',
                        handle: (e) => {
                            dispatch(routerRedux.push(`${prev}/scene`));
                            e.stopPropagation();
                        },
                    }, {
                        name: '创意模板',
                        handle: (e) => {
                            dispatch(routerRedux.push(`${prev}/index`));
                            e.stopPropagation();
                        },
                    }]);
            } catch (e) {
                console.log(e);
            }

        }

    }

    render() {
        return null;
    }
}

export default LeftSider;
