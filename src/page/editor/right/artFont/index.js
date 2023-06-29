import React, { PureComponent } from 'react';
import { SingleColorPicker } from 'Components/colorPicker';
import { ConfigProvider } from 'antd';
import { getMyFont } from 'Api/user';
import { host } from 'Config/env';
import TextSet from '../text';
import 'react-virtualized/styles.css';
import TextShadowSet from './textShadowSet';
import ShakeSet from './shakeSet';
import Cube from './cube';
import Stroke from './stroke';
import Chartlet from './chartlet';
import Gradient from './gradient';
import Scribble from './scribble';
import { ART_TEXT_TYPE } from '../../../../config/staticParams';
import PropTypes from 'prop-types';
import AnimateFonts from '../animateFont/animateFonts.js';
import styles from '../animateFont/animateFonts.less';

export default class ArtFont extends PureComponent {
    state = {
        activeTab: 1,
    };

    tabs = [
        {
            index: 1,
            title: '样式',
        },
        {
            index: 2,
            title: '动画',
        },
    ];
    changeActive = (index) => {
        this.setState({ activeTab: index });
    };

    handleArtJsonChange = (value) => {
        this.props.changeNow({ artJson: value });
    };

    render() {
        const { data } = this.props;
        if (!data) {
            return null;
        }
        const { artJson = {} } = data;
        const { type } = artJson;
        const { activeTab } = this.state;
        return (
            <ConfigProvider getPopupContainer={(triggerNode) => triggerNode.parentElement}>
                <div className={styles.tabs}>
                    {this.tabs.map(tab => {
                        const active = activeTab === tab.index ? styles.active : '';
                        return <div key={tab.index}
                                    className={`${styles.tab} ${active}`}
                                    onClick={() => this.changeActive(tab.index)}
                        >
                            <div>{tab.title}</div>
                        </div>;
                    })}
                </div>
                {
                    activeTab === 1 &&
                    <TextSet hideTextColor={[ART_TEXT_TYPE.chartlet, ART_TEXT_TYPE.gradient].includes(type)} {...this.props}>
                        {/*文字阴影*/}
                        {type === ART_TEXT_TYPE.shadow ? <TextShadowSet artJson={artJson} onChange={this.handleArtJsonChange}/> : null}
                        {/*颤抖文字*/}
                        {type === ART_TEXT_TYPE.shake ? <ShakeSet artJson={artJson} onChange={this.handleArtJsonChange} /> : null}
                        {/*立体文字*/}
                        {type === ART_TEXT_TYPE.cube ? <Cube artJson={artJson} onChange={this.handleArtJsonChange} /> : null}
                        {/*描边文字*/}
                        {type === ART_TEXT_TYPE.scribble ? <Scribble artJson={artJson} onChange={this.handleArtJsonChange} /> : null}
                        {/*描边立体文字*/}
                        {type === ART_TEXT_TYPE.stroke ? <Stroke artJson={artJson} onChange={this.handleArtJsonChange} /> : null}
                        {/*贴图文字*/}
                        {type === ART_TEXT_TYPE.chartlet ? <Chartlet artJson={artJson} onChange={this.handleArtJsonChange} /> : null}
                        {/*渐变文字*/}
                        {type === ART_TEXT_TYPE.gradient ? <Gradient artJson={artJson} onChange={this.handleArtJsonChange} /> : null}
                    </TextSet>
                }
                {activeTab === 2 && <AnimateFonts {...this.props} />}
            </ConfigProvider>
        );
    }
}

/**
 * @param data: 字体样式数据
 * @param myFonts: 字体文件
 * @param stateName: models的命名空间
 *
 * */
TextSet.propTypes = {
    data: PropTypes.object,
    myFonts: PropTypes.array,
    hideElements: PropTypes.array,
    stateName: PropTypes.string,
};
TextSet.defaultProps = {
    data: null,
    myFonts: [],
    stateName: "workspace",
    hideElements: [],
};


