import React from 'react';
import { prev } from 'Config/env';
import styles from './mainTab.less';

/**
 * 商城和我的作品切换标签组件
 */
class MainTab extends React.PureComponent {

    state = {
        list: [
            {
                href: `${prev}/index`,
                title: '视频商城',
                mainWidth: 1200,
            },
            {
                href: `${prev}/scene`,
                title: '我的作品',
                mainWidth: 1000,
            },
        ],
    };

    render() {
        const { state, props } = this;
        const { path } = props.match;
        const isScene = (path === `${prev}/scene`);
        const mainWidth = isScene ? 1000 : 1200;
        const children = (
            <div className='mainTabDiv' style={{ width: mainWidth }}>
                {state.list.map((item, index) =>
                    <span key={index}
                          className={`mainTab  ${path === item.href ? 'mainTab_checked' : ''}`}>
                            <a href={item.href}>{item.title}</a>
                            </span>)}
            </div>
        );
        if (isScene) {
            return <div style={{
                width: '100%',
                backgroundColor: '#fff',
            }}>
                {children}
            </div>;
        }else {
            return children;
        }
    }
}

export default MainTab;
