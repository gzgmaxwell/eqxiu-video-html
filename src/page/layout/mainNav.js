import React from 'react';
import { connect } from 'dva';
import styles from './mainNav.less';
import { projectname, host, prev } from '../../config/env';
import Icon from '../components/Icon';

const { auth } = host;

@connect(({ user }) => ({ user }))
class MainNav extends React.PureComponent {

    state = {
        tab_list: [
            {
                name: 'H5',
                url: `${auth}/eip/scene`,
                urlTemp: `${auth}/eip/template?type=H5`,
            },
            {
                name: '轻设计',
                url: `${auth}/h2/eip/scene`,
                urlTemp: `${auth}/h2/eip/template`,
            },
            {
                name: '长页',
                url: `${auth}/eip/scene?type=lc`,
                urlTemp: `${auth}/eip/template?type=lc`,
                mark: 'hot',
            },
            {
                name: '易表单',
                url: `${auth}/eip/scene?type=lf`,
                urlTemp: `${auth}/eip/template?type=lf`,
                mark: 'new',
            },
            {
                name: '互动',
                url: `${auth}/eip/scene?type=GC`,
                urlTemp: `${auth}/scene/gc/template`,
                mark: 'beta',
            },
            {
                name: projectname,
                url: `${auth}/video/scene`,
                urlTemp: `${auth}/video/index`,
                mark: 'new',
            },
            {
                name: '秀站',
                url: `http://service.eqxiu.com/m/vip/xz/redirect?userId=${this.props.user.id}`,
                blank: true,
            },

        ],
    };

    componentDidMount() {
    }


    componentWillUnmount() {
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        const newState = { ...prevState };
        if (nextProps.tab_list) {
            newState.tab_list = nextProps.tab_list;
        }
        return newState;
    }


    render() {
        const { state, props } = this;
        const isTemplate = props.location.pathname === `${prev}/index`;
        return (
            <ul className={styles.menu}>
                {state.tab_list.map((item, i) => {
                    if (!isTemplate || isTemplate && item.urlTemp) {
                        return (<li key={i}>
                            <a href={isTemplate ? item.urlTemp : item.url}
                               className={item.name === projectname && styles.active || ''}
                               target={item.blank ? '_blank' : ''}>{item.name}</a>
                            {item.mark && <span className={styles.red}>{item.mark}</span>}
                        </li>);
                    } else {
                        return '';
                    }
                })
                }
                <div className={styles.rightBlock}>
                    {/* <a href="http://h5.eqxiu.com/ls/XhbraL3x" target="_blank">
                        <Icon type={'eqf-comment-l'}/>用户调研
                    </a> */}
                </div>
            </ul>);
    }
}

export default MainNav;
