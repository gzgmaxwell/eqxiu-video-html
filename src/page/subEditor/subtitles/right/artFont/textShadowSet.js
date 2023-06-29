import React, { Component } from 'react';
import { SingleColorPicker } from 'Components/colorPicker';
import styles from './textShadowSet.less';
import NumberInput from 'Components/input/numberInput';
import { getMyFont } from 'Api/user';
import { host } from 'Config/env';
import 'react-virtualized/styles.css';
import { handleMaxOrMinNum } from '../../../../../util/data';

export default class TextShadowSet extends Component {
    onChange = (key, value) => {
        const { artJson , onChange } = this.props;
        artJson.shadow[key] = value;
        onChange(artJson);
    };

    render() {
        const { shadow } = this.props.artJson;
        const { color, h, v, blur } = shadow;
        return (<div>
            <div className={styles.set__title}>
                文字阴影
            </div>
            <div className={styles.offset}>
                <div className={styles.left}>偏移</div>
                <div className={styles.center}>x:&nbsp;<NumberInput
                    min={0}
                    max={10}
                    step={1}
                    value={typeof h === 'number' ? h : 0}
                    onChange={(value) => this.onChange('h', handleMaxOrMinNum(value))}
                /></div>
                <div className={styles.right}>y:&nbsp;<NumberInput
                    min={0}
                    max={10}
                    step={1}
                    value={typeof v === 'number' ? v : 0}
                    onChange={(value) => this.onChange('v', handleMaxOrMinNum(value))}
                /></div>
            </div>
            <div className={styles.other}>
                <div className={styles.left}>模糊</div>
                <div className={styles.center}><NumberInput
                    min={0}
                    max={500}
                    step={1}
                    value={typeof blur === 'number' ? blur : 0}
                    onChange={(value) => this.onChange('blur', handleMaxOrMinNum(value, 500))}
                /></div>
                <div className={styles.right}>颜色&nbsp;<SingleColorPicker
                    currentColor={color}
                    width={47}
                    onChange={(value) => this.onChange('color', value)}/>
                </div>
            </div>
        </div>);
    }
}
