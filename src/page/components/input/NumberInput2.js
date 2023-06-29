import React, { Component } from 'react';
import styles from './NumberInput2.less';
import { handleMaxOrMinNum } from '../../../util/data';
import Input from './input';
import Icon from '../Icon';

export default class NumberInput2 extends Component {
    state = {};
    handleTimeBlur = (e) => {
        const { scale = 1, max = 1, min = 0 } = this.props;
        const oriValue = e.target.value * scale;
        if (oriValue > max || oriValue < min) {
            this.setState({ update: !this.state.update });
        }
    };

    render() {
        const { defaultValue, scale = 1, step = 1, max = 1, min = 0, onChange, disabled = false } = this.props;
        const { update } = this.state;
        const canMinus = defaultValue > min;
        const canPlus = defaultValue < max;
        return <div className={styles.time_set}>
            <Input
                disabled={disabled}
                key={`${defaultValue}${update}`}
                addonBefore={<Icon
                    onClick={canMinus && !disabled ? () => onChange(handleMaxOrMinNum(defaultValue - step, max, min)) : () => {}}
                    className={`${styles.minus} ${canMinus ? '' : styles.disabled}`}
                    type="eqf-minus"/>}
                addonAfter={<Icon
                    onClick={canPlus && !disabled ? () => onChange(handleMaxOrMinNum(defaultValue + step, max, min)) : () => {}}
                    className={`${styles.plus} ${canPlus ? '' : styles.disabled}`}
                    type="eqf-plus"/>}
                onChange={(e) => onChange(handleMaxOrMinNum(e.target.value * scale, max, min))}
                onBlur={this.handleTimeBlur}
                defaultValue={defaultValue / scale}/>
        </div>;
    }
}
