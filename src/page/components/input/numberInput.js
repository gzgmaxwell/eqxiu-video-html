import React, { PureComponent } from 'react';
import { InputNumber } from 'antd';
import styles from './numberInput.less';
import Icon from '../Icon';
import up from '../../static/icon/up.png';
import down from '../../static/icon/down.png';

export default class NumberInput extends PureComponent {
    constructor(props) {
        super(props);
    }

    static getDerivedStateFromProps(nextProps, preState) {
        const newState = nextProps;
        return newState;
    }

    state = {};
    down = () => {
        const { state: { value, step }, props: { min } } = this;
        let newValue = value - step;
        if (min !== undefined) {
            newValue = Math.max(newValue, min);
        }
        this.props.onChange(newValue);
    };
    up = () => {
        const { state: { value, step }, props: { max } } = this;
        let newValue = value + step;
        if (max !== undefined) {
            newValue = Math.min(newValue, max);
        }
        this.props.onChange(newValue);
    };

    render() {
        const { state, props: { disabled, onlyRead } } = this;
        const canChange = !onlyRead && !disabled;
        return (
            <div className={styles.wrap}>
                <InputNumber {...state} />
                <div className={styles.wrapIcon}>
                    <img width='10' src={up} onClick={!canChange ? null : this.up} className={styles.up}/>
                    <img width='10' src={down} onClick={!canChange ? null : this.down} className={styles.down}/>
                </div>
            </div>
        );
    }
}
