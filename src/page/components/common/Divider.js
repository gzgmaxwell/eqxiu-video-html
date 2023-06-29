import React from 'react';
import { Divider } from 'antd';
import PropTypes from 'prop-types';

export default class Current extends React.PureComponent {
    render() {
        const {text, ...other} = this.props;
        return <Divider {...other}>{text}</Divider>;
    }
}


/**
 * @param type: 水平还是垂直类型  可选值：horizontal vertical
 * @param text: 水平分割线的标题
 * @param orientation: 分割线标题的位置  可选值：left right center
 * @param dashed: 是否虚线
 *
 * */
Current.propTypes = {
    type: PropTypes.string,
    text: PropTypes.string,
    dashed: PropTypes.bool,
    orientation: PropTypes.string,
};
Current.defaultProps = {
    type: 'vertical',
    text: '',
    dashed: false,
    orientation: 'center',
};
