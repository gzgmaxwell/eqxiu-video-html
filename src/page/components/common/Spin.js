import React from 'react';
import { Spin } from 'antd';
import PropTypes from 'prop-types';

export default class Current extends React.PureComponent {
    render() {
        return <Spin {...this.props} />;
    }
}


/**
 * @param delay: 延迟显示加载效果的时间（防止闪烁）  number (毫秒)
 * @param indicator: 自定义加载指示符 ReactElement
 * @param size: 组件大小，可选值: small default large
 * @param spinning: 是否为加载中状态
 * @param tip: 加载时的描述文案
 *
 * */
Current.propTypes = {
    delay: PropTypes.number,
    indicator: PropTypes.element,
    size: PropTypes.string,
    spinning: PropTypes.bool,
    tip: PropTypes.string,
};
Current.defaultProps = {
    delay: 0,
    indicator: null,
    size: 'default',
    spinning: false,
    tip: '',
};
