import React, { PureComponent } from 'react';
import { SingleColorPicker } from 'Components/colorPicker';
import { ConfigProvider } from 'antd';
import { getMyFont } from 'Api/user';
import { host } from 'Config/env';
import TextSet from '../text';
import 'react-virtualized/styles.css';
import TextShadowSet from './textShadowSet';
import Stroke from './stroke';
import Scribble from './scribble';
import { ART_TEXT_TYPE } from '../../../../../config/staticParams';
import PropTypes from 'prop-types';

export default class ArtFont extends PureComponent {
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
        return (
            <ConfigProvider getPopupContainer={(triggerNode) => triggerNode.parentElement}>
                <TextSet hideTextColor={[ART_TEXT_TYPE.chartlet, ART_TEXT_TYPE.gradient].includes(type)} {...this.props}>
                    {/*文字阴影*/}
                    {type === ART_TEXT_TYPE.shadow ? <TextShadowSet artJson={artJson} onChange={this.handleArtJsonChange}/> : null}
                    {/*描边文字*/}
                    {type === ART_TEXT_TYPE.scribble ? <Scribble artJson={artJson} onChange={this.handleArtJsonChange} /> : null}
                    {/*描边立体文字*/}
                    {type === ART_TEXT_TYPE.stroke ? <Stroke artJson={artJson} onChange={this.handleArtJsonChange} /> : null}
                </TextSet>
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


