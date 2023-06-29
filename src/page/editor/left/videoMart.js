import React from 'react';
import styles from './videoMart.less';
import { prev } from 'Config/env';
import RecommendGoogle from '../recommendGoogle/index';
import { isChrome } from '../../../util/util';
import { connect } from 'dva';
import MouldMaterial from './tab/mouldMaterial';
import RealMaterial from './tab/realMaterial';
import CoumlunClass from './class/index.jsx';
import eventEmitter from '../../../services/EventListener';
import SupportTips from '../../components/tips/supportTips';
import { getItem } from '../../../util/storageLocal';
import { CANVAS_TYPE, USER_TYPE } from '../../../config/staticParams';
import { isNoSupportELemnt } from '../../../util/showker';

@connect(({ supportElements }) => ({ notSupportElements: supportElements.notSupportElements }))
export default class VideoMart extends React.Component {
    state = {
        activeMenu: 1,
    };

    componentDidMount() {
        eventEmitter.on(`toggleSecondTabOf${this.props.index}`, this.activeMenu);
    }

    componentWillUnmount() {
        this.setState = () => null;
        eventEmitter.removeListener(`toggleSecondTabOf${this.props.index}`, this.activeMenu);
    }

    activeMenu = (index = 1) => {
        this.setState({ activeMenu: index });
    };

    render() {
        const { state: { activeMenu } } = this;
        const { scrolling, notSupportElements } = this.props;
        const data = [
            {
                name: '模板素材',
                index: 1,
                type: CANVAS_TYPE.templateVideo,
            },
            {
                name: '视频素材',
                index: 2,
                isNew: true,
                type: CANVAS_TYPE.realShoot,
            },
        ];
        const activeOne = data.find(v => v.index === activeMenu) || {};
        const tips = isNoSupportELemnt(activeOne.type, notSupportElements);
        return (
            <React.Fragment>
                <SupportTips tips={tips}/>
                <CoumlunClass index={activeMenu} classTitle={data} activeMenu={this.activeMenu}/>
                {!isChrome && <div><RecommendGoogle/></div>}
                {activeMenu === 1 && <MouldMaterial scrolling={scrolling}/>}
                {activeMenu === 2 && <RealMaterial scrolling={scrolling}/>}
            </React.Fragment>
        );
    }
}
