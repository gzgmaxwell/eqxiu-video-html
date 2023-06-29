import React from 'react';
import { Input } from 'antd';
import styles from './countInput.less';

class CountInput extends React.PureComponent {


    state = {
        count: 0,
        value: '',
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        const newState = {};
        if (nextProps.value !== undefined && nextProps.value !== null
            && (nextProps.value !== prevState.value)) {
            newState.value = nextProps.value;
            newState.count = nextProps.value.length;
        }
        return newState;
    }

    /**
     * 计算和限制字符长度 并调用props回调
     * @param e
     * @returns {boolean}
     */
    change = (e) => {
        let val = e.target.value;
        const len = this.props.len;
        const count = e.target.value.length || 0;
        if (this.props.sub && count > len) {
            e.stopPropagation();
            e.preventDefault();
            return false;
        }
        if (this.props.sub) {
            val = val.substring(0, len);
        }
        if (typeof(this.props.onChange) === 'function') {
            this.props.onChange(val);
        }
        this.setState({
            count,
            value: val,
        });
    };

    render() {
        const { state: { count }, props: { errorBorder = false, ...props } } = this;
        const maxLen = props.len;
        const suffix = <span>{`${count}/${maxLen}`}</span>;
        let className = '';
        if (maxLen < count && errorBorder) {
            className += styles.errorInput;
        }
        if (props.render_textarea) {
            return (<span className='ant-input-affix-wrapper'>
      <Input.TextArea key='textarea' {...props} onChange={this.change}
                      value={this.state.value}
      />
        <span className='ant-input-suffix'>{suffix}</span>
      </span>);
        }
        return <Input
            {...props} className={className} onChange={this.change} value={this.state.value}
            suffix={suffix}
        />;
    }
}

export default CountInput;
