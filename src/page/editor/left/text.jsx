import React from 'react';
import { connect } from 'dva';
import isEqual from 'lodash/isEqual';
import styles from './text.less';
import { isChrome } from '../../../util/util';
import RecommendGoogle from '../recommendGoogle/index';
import ArtFont from './tab/artFont';
import SpecialEffectText from './tab/specialEffectText';
import AnimateFont from './tab/animateFont';
import { CANVAS_TYPE, USER_TYPE } from '../../../config/staticParams';
import { limitInsert } from '../../../util/data';
import CoumlunClass from './class/index.jsx';
import eventEmitter from '../../../services/EventListener';
import ScrollContainer from '../../components/scrollContainer';
import SupportTips from '../../components/tips/supportTips';
import { getItem } from '../../../util/storageLocal';
import { isNoSupportELemnt } from '../../../util/showker';


@connect(({ workspace, supportElements }) => {
    return {
        dataList: workspace.dataList,
        notSupportElements: supportElements.notSupportElements,
    };
})
export default class Text extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            activeMenu: 1,
        };
    }

    componentDidMount() {
        eventEmitter.on(`toggleSecondTabOf${this.props.index}`, this.activeMenu);
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (!isEqual(this.state, nextState)) {
            return true;
        }
        if (this.props.scrolling !== nextProps.scrolling) {
            return true;
        }
        if (this.props.notSupportElements !== nextProps.notSupportElements) {
            return true;
        }
        return false;
    }

    componentWillUnmount() {
        this.setState = () => null;
        eventEmitter.removeListener(`toggleSecondTabOf${this.props.index}`, this.activeMenu);
    }

    activeMenu = (index = 1) => {
        this.setState({ activeMenu: index });
    };
    // 插入文字
    insertText = (payload = {}) => {
        if (limitInsert(this.props.dataList, CANVAS_TYPE.text) === false) return;
        this.props.dispatch({
            type: 'workspace/insertText',
            payload,
        });
    };

    // 插入动画字
    insertAnimateFont = (payload = {}) => {
        if (limitInsert(this.props.dataList, CANVAS_TYPE.animateFont) === false) return;
        this.props.dispatch({
            type: 'workspace/insertText',
            payload,
        });
    };

    render() {
        const bigTitleStyle = {
            fontSize: 34,
            fontWeight: 'bold',
            height: 51,
        };
        const secondTitleStyle = {
            fontSize: 24,
            fontWeight: 'bold',
            height: 36,
        };
        const { activeMenu } = this.state;
        const { insertText, props: { scrolling, notSupportElements } } = this;
        const data = [
            {
                name: '特效字',
                index: 1,
                type: CANVAS_TYPE.specialText,
            },
            {
                name: '动画字',
                index: 2,
                isNew: true,
                type: CANVAS_TYPE.animateFont,
            },
            {
                name: '艺术字',
                index: 3,
                type: CANVAS_TYPE.artFont,
            },
        ];
        const activeOne = data.find(v => v.index === activeMenu) || {};
        const tips = isNoSupportELemnt(activeOne.type, notSupportElements);
        return (
            <div className={styles.container}>
                <SupportTips tips={tips}/>
                <div className={scrolling && activeMenu !== 1 ? 'scrollShadow' : ''}>
                    <div className={styles.titleWrap}>
                        <div onClick={() => insertText(bigTitleStyle)}>大标题</div>
                        <div onClick={() => insertText(secondTitleStyle)}>小标题</div>
                        <div onClick={() => insertText({})}>正文</div>
                    </div>
                    <CoumlunClass index={activeMenu} classTitle={data}
                                  activeMenu={this.activeMenu}/>
                </div>
                {activeMenu === 1 && !isChrome &&
                <div style={{ marginTop: -16 }}><RecommendGoogle/></div>}
                {/* 特效字*/}
                {activeMenu === 1 &&
                <SpecialEffectText scrolling={scrolling}/>
                }
                {/*动画字*/}
                {activeMenu === 2 && <AnimateFont insertAnimateFont={this.insertAnimateFont}/>}
                {/*艺术字*/}
                {activeMenu === 3 && <ScrollContainer><ArtFont/></ScrollContainer>}
            </div>
        );
    }
}
