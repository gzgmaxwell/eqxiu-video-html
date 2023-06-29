import React from 'react';
import { routerRedux } from 'dva/router';
import { setTitle } from 'Util/doc';
import styles from './index.less';
import VideoMake from './templates';
import Subtitles from './templates/subtitles';
import Icon from './components/Icon';
import HeadAndTailTemplate from './templates/headAndTail';
import Flash from './templates/flash';
import { prev } from '../config/env';
import Notice from './components/notice/notice';


const list = [
    {
        icon: 'iconmodel_f',
        iconStyle: {
            width: 26,
            height: 23,
        },
        title: '视频制作',
        component: VideoMake,
    },
    {
        icon: 'iconclick_f',
        iconStyle: {
            width: 26,
            height: 23,
        },
        title: '一键视频',
        component: Flash,
        notice: 'new',
    },
    {
        icon: 'icontext_f',
        iconStyle: {
            width: 25,
            height: 22,
        },
        title: '添加字幕',
        component: Subtitles,
    },
    {
        icon: 'iconvideo_f',
        iconStyle: {
            width: 26,
            height: 21,
        },
        title: '片头片尾',
        component: HeadAndTailTemplate,
    },
];



class Index extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            activeIndex: 0,
        };
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        const newState = { ...prevState };
        const { tab = 0 } = nextProps.match.params;
        newState.activeIndex = ~~tab;
        return newState;
    }

    componentDidMount() {
        if (window.leftSider) {
            try {
                window.leftSider.setActiveTab('创意模板');
            } catch (e) {
                console.log(e);
            }
        }
    }

    changeActiveIndex = (index) => {
        window._eqx_dispatch(routerRedux.push(`${prev}/index/${index}`));
    };

    onChose = (url) => {
        window._eqx_dispatch(routerRedux.push(url));
    }

    render() {
        const { state: { showNewTips, activeIndex }, props: { location } } = this;
        const chilrenProps = {
            location,
            onChose: this.onChose,
        };
        const ActiveItem = list[activeIndex];
        setTitle(ActiveItem.title);
        return (
            <div
                ref={this.body}
                style={{ marginTop: showNewTips ? 48 : 0 }}
            >
                <div className={styles.tabs}>
                    {list.map((item, i) => (
                        <div
                            key={item.title}
                            className={`${styles.tab} ${activeIndex === i ? styles.active : ''}`}
                            onClick={() => this.changeActiveIndex(i)}
                        >
                            <div className={`${styles.tab__left}`}>
                                <Icon
                                    type={`iconfont ${item.icon}`}
                                    className={`${activeIndex === i ? styles.iconActive : ''}`}
                                />
                            </div>
                            <div className={styles.tab__right}>
                                <div className={styles.tab__title}>{item.title}</div>
                            </div>
                            {item.notice && <Notice title={item.notice} />}
                        </div>))}
                </div>
                <ActiveItem.component {...chilrenProps} />
            </div>
        );
    }
}

export default Index;
