import React from 'react';
import styles from './picture.less';
import { prev } from 'Config/env';
import RecommendGoogle from '../recommendGoogle/index';
import { isChrome } from '../../../util/util';
import { connect } from 'dva';
import EffectsPicture from './tab/effectsPicture';
import Gif from './tab/gif';
import DynamicGif from './tab/dynamicGif';
import Paster from './tab/paster';
import AnimateImg from './tab/animateImg';
import CoumlunClass from './class/index.jsx';
import eventEmitter from '../../../services/EventListener';
import SupportTips from '../../components/tips/supportTips';
import { CANVAS_TYPE, USER_TYPE } from '../../../config/staticParams';
import { isNoSupportELemnt } from '../../../util/showker';

@connect(({ supportElements }) => ({ notSupportElements: supportElements.notSupportElements }))
export default class SpecialEffects extends React.Component {
    state = {
        activeMenu: 1,
    };

    componentDidMount() {
        eventEmitter.on(`toggleSecondTabOf${this.props.index}`, this.activeMenu);
    }

    componentWillUnmount() {
        this.setState = () => null;
    }

    activeMenu = (index = 1) => {
        this.setState({ activeMenu: index });
    };

    insertAnimateImg = (payload) => {
        this.props.dispatch({
            type: 'workspace/insertImg',
            payload: payload,
        });
    };

    render() {
        const { state: { activeMenu }, props: { scrolling, notSupportElements } } = this;
        const data = [
            {
                name: '特效图',
                index: 1,
                type: CANVAS_TYPE.spacialImg,
            },
            {
                name: '动态元素',
                index: 2,
                type: CANVAS_TYPE.ornament,
            },
            {
                name: 'Gif图',
                index: 3,
                type: CANVAS_TYPE.gif,
            },
            {
                name: '贴纸',
                index: 4,
                type: CANVAS_TYPE.sticker,
            },
            {
                name: '动画图',
                index: 5,
                type: CANVAS_TYPE.animateImg,
            },
        ];
        const activeOne = data.find(v => v.index === activeMenu) || {};
        const tips = isNoSupportELemnt(activeOne.type, notSupportElements);
        return (
            <React.Fragment>
                <SupportTips tips={tips}/>
                <CoumlunClass
                    className={scrolling && ![1, 2, 4].includes(activeMenu) ? 'scrollShadow' : ''}
                    index={activeMenu} classTitle={data} activeMenu={this.activeMenu}/>
                {!isChrome && <div><RecommendGoogle/></div>}
                {activeMenu === 1 && <EffectsPicture scrolling={scrolling}/>}
                {activeMenu === 2 && <DynamicGif scrolling={scrolling}/>}
                {activeMenu === 3 && <Gif/>}
                {activeMenu === 4 && <Paster scrolling={scrolling}/>}
                {activeMenu === 5 && <AnimateImg insertAnimateImg={this.insertAnimateImg}/>}
            </React.Fragment>
        );
    }
}
