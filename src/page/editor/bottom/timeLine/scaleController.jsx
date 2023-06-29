import React from 'react';
import { Slider } from 'antd';
import styles from './scaleController.less';
import Icon from '../../../components/Icon';
import { limitNumber } from '../../../../util/data';

export default function ScaleController(props) {
    const { id, ...otherProps } = props;
    const sliderProps = {
        step: 0.1,
        max: 2,
        min: 0.2,
        tooltipVisible: false,
        ...otherProps,
    };

    const { onChange, value, step, min, max } = sliderProps;

    function limiter(numb) {
        return limitNumber(numb, [min, max]);
    }


    function onClickMinus() {
        onChange(limiter(value - step));
    }

    function onClickPlus() {
        onChange(limiter(value + step));
    }

    return (
        <div className={styles.body} id={id}>
            <Icon type='eqf-minus' onClick={onClickMinus} />
            <Slider {...sliderProps} />
            <Icon type="eqf-plus" onClick={onClickPlus} />
        </div>);
}
