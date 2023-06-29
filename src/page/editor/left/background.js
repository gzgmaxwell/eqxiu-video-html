import React from 'react';
import { prev } from 'Config/env';
import RecommendGoogle from '../recommendGoogle/index';
import { isChrome } from '../../../util/util';
import DynamicBg from './tab/dynamicBg';
import BgImage from './tab/bgImage';
import DecorateTab from './tab/decorate';
import BgColor from './tab/bgColor';
import ColumnClass from './class/index.jsx';
import eventEmitter from '../../../services/EventListener';
import SupportTips from '../../components/tips/supportTips';
import { getItem } from '../../../util/storageLocal';
import { CANVAS_TYPE, USER_TYPE } from '../../../config/staticParams';
import { connect } from 'dva';
import { isNoSupportELemnt } from '../../../util/showker';

const data = [
    {
        name: '动态',
        index: 1,
        type: CANVAS_TYPE.dynamicBg,
    },
    {
        name: '覆层',
        index: 2,
        type: CANVAS_TYPE.clad,
    },
    {
        name: '背景色',
        index: 3,
        type: null,
    },
    {
        name: '背景图',
        index: 4,
        type: null,
    },
];

@connect(({ supportElements }) => ({ notSupportElements: supportElements.notSupportElements }))
class Decorate extends React.Component {
    constructor(props) {
        super(props);
        this.threeActive = null;
    }

    state = {
        activeMenu: 1, // tab 选项是否激活
    };

    componentDidMount() {
        eventEmitter.on(`toggleSecondTabOf${this.props.index}`, this.activeMenu);
    }

    componentDidUpdate() {
        if (this.threeActive) {
            eventEmitter.emit('toggleThreeTab', this.threeActive);
            this.threeActive = null;
        }
    }

    componentWillUnmount() {
        this.setState = () => null;
    }

    activeMenu = (params = 1) => {
        let index = params;
        if (Array.isArray(params)) {
            index = params[0];
            this.threeActive = params[1];
        }
        this.setState({ activeMenu: index });
    };

    render() {
        const { activeMenu } = this.state;
        const { scrolling, notSupportElements } = this.props;
        const activeOne = data.find(v => v.index === activeMenu) || {};
        const tips = isNoSupportELemnt(activeOne.type, notSupportElements);
        return (
            <React.Fragment>
                <SupportTips tips={tips}/>
                <div className={scrolling && ![1, 2].includes(activeMenu) ? 'scrollShadow' : ''}>
                    <ColumnClass index={activeMenu} classTitle={data} activeMenu={this.activeMenu}/>
                </div>
                {!isChrome && <div><RecommendGoogle/></div>}
                {activeMenu === 1 && <DynamicBg scrolling={scrolling}/>}
                {activeMenu === 2 && <DecorateTab scrolling={scrolling}/>}
                {activeMenu === 3 && <BgColor/>}
                {activeMenu === 4 && <BgImage/>}
            </React.Fragment>
        );
    }
}

export default Decorate;
