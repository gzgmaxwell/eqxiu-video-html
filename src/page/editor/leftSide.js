import React from 'react';
import styles from './leftSide.less';
import Icon from 'Components/Icon';
import Text from './left/text';
import { CSSTransition } from 'react-transition-group';
import Picture from './left/Picture';
import Music from './left/music';
import Background from './left/background';
import DisplayElement from '../components/DisplayElement';
import linkManger from '../static/linkman.jpg';
import VideoMart from './left/videoMart';
import Mine from './left/Mine';
import eventEmitter from '../../services/EventListener';
import Advert from '../components/advert';
import { getItem, localStorageKey, setItem } from '../../util/storageLocal';
import { version } from '../../config/env';
import { connect } from 'dva';
import { TYPE_EDITOR } from '../../config/staticParams';
import { isNoobGuideIng } from '../../util/data';
import UserMarketIndex from './left/userMarket';
import NewMark from '../static/icon/newMark.svg';
import FreeMark from '../static/icon/freeMarket.png';

const LiArray = [
    {
        name: '文字',
        icon: 'eqf-t',
        children: Text,
    },
    {
        name: '图片',
        icon: 'eqf-image-l',
        children: Picture,
    },
    {
        name: '视频',
        icon: 'eqf-video-l',
        children: VideoMart,
    },
    {
        name: '背景',
        icon: 'eqf-background-l',
        children: Background,
    },
    {
        name: '声音',
        icon: 'eqf-music-l',
        children: Music,
    },
    {
        name: '营销组件',
        icon: 'eqf-widgets-l',
        children: UserMarketIndex,
        newMark: false,
        freeMark: true,
    },
    {
        name: '我的',
        icon: 'eqf-user-l',
        children: Mine,
    },
];


@connect(({ user }) => ({ user }))
class Left extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isOpen: true,
            openNode: 1,
            openNodes: { 1: true },
            scrolling: false,
        };
    }

    componentDidMount() {
        // 调用方式
        // eventEmitter.emit('toggleActiveTab', [5, 2]);
        eventEmitter.on('scrolling', this.handleScroll);
        eventEmitter.on('toggleActiveTab', this.toggleActiveTab);
    }


    componentWillUnmount() {
        eventEmitter.removeListener('scrolling', this.handleScroll);
        eventEmitter.removeListener('toggleActiveTab', this.toggleActiveTab);
        document.getElementById('leftSide')
            .removeEventListener('mousemove', this.handleScroll);
    }


    handleScroll = () => {
        const scrolling = $('.scrollDiv:visible')
            .scrollTop() > 0;
        if (scrolling !== this.state.scrolling) {
            this.setState({ scrolling });
        }
        if (scrolling) {
            const dom = document.getElementById('leftSide');
            if (!dom) return;
            dom.removeEventListener('mousemove', this.handleScroll);
            dom.addEventListener('mousemove', this.handleScroll);
        }
    };

    stopScroll = () => {
        this.setTimeout = setTimeout(() => {
            this.setState({ scrolling: false });
        }, 200);

    };

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { index, activeSecondTab } = this.state;
        if (activeSecondTab !== undefined) {
            eventEmitter.emit(`toggleSecondTabOf${index}`, activeSecondTab);
            this.setState({
                activeSecondTab: undefined,
                index: undefined,
            });
        }
    }

    toggleActiveTab = ([firstTab, ...secondTab]) => {
        this.toggleDiv(firstTab, false);
        if (secondTab !== undefined) {
            this.setState({
                activeSecondTab: secondTab,
                index: firstTab,
            });
        }
    };
    /**
     * 切换显示块 如果是本身就关闭
     */
    toggleDiv = (index, close = true) => {
        if (this.state.isOpen && this.state.openNode === index && close) {
            this.setState({
                isOpen: false,
            });
        } else {
            const { openNodes } = this.state;
            openNodes[index] = true;
            this.setState({
                isOpen: true,
                openNode: index,
                openNodes,
            });
        }
        eventEmitter.emit('leftSideCallback');
    };

    render() {
        const { state: { scrolling, ...state }, props: { user: { id: userId } } } = this;
        const content = (
            <div className={styles.feedback}>
                <img src={linkManger} width="277" height="382" alt="反馈"/>
            </div>
        );
        const sendBDEvent = {
            position: '主编辑器',
            type: '左侧边栏-福利',
            editor: 'editor',
        };
        return (
            <div className={styles.leftSideOut}
                 id='leftSide'
                 style={state.isOpen ? { flexBasis: 360 } : { flexBasis: 68 }}>
                <div className={styles.leftSide}>
                    <ul>
                        {LiArray.map((item, index) => {
                                const isOpen = state.isOpen && state.openNode === index + 1;
                                return (
                                    <li key={item.name}
                                        onClick={() => this.toggleDiv(index + 1)}
                                        className={[
                                            styles.leftSideLi,
                                            isOpen ? styles.active : ''].join(' ')}
                                    >
                  <span className={styles.leftSideLiSpan}>
                    <Icon style={{ fontSize: '22px' }} type={item.icon}/>
                    <div style={{
                        marginTop: `${item.icon === 'eqf-video-l'
                            ? '5px'
                            : '4px'}`,
                    }}>{item.name}</div>
                  </span>
                                        {item.freeMark &&
                                        <img src={FreeMark} className={styles.newMark}/>}
                                        {isOpen && <div className={styles.litleMark}></div>}
                                    </li>);
                            },
                        )}
                    </ul>
                    <Advert
                        editorType={TYPE_EDITOR.editor.editor}
                        autoShow={!isNoobGuideIng()}
                    />
                </div>
                {
                    <CSSTransition
                        in={state.isOpen} classNames='slider' timeout={300}
                    >
                        <div className={styles.userCentre}>
                            {LiArray.map((li, index) => {
                                if (state.openNodes[index + 1]) {
                                    const Element = li.children;
                                    const name = li.name;
                                    return <DisplayElement
                                        display={state.openNode === index + 1}
                                        key={name}>
                                        <Element index={state.openNode}
                                                 scrolling={scrolling}/>
                                    </DisplayElement>;
                                }
                                return null;
                            })}
                        </div>
                    </CSSTransition>}
            </div>
        );
    }
}

export default Left;
