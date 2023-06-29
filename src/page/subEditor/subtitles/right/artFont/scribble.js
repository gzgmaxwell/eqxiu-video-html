import React, { Component } from 'react';
import { SingleColorPicker } from 'Components/colorPicker';
import styles from './stroke.less';
import NumberInput from 'Components/input/numberInput';
import { getMyFont } from 'Api/user';
import { host } from 'Config/env';
import { handleMaxOrMinNum } from '../../../../../util/data';
import 'react-virtualized/styles.css';

export default class Scribble extends Component {

    onStrokeChange = (key, value) => {
        const { artJson , onChange } = this.props;
        artJson.stroke[key] = value;
        onChange(artJson);
    };

    onShadowChange = (key, value) => {
        const { artJson , onChange } = this.props;
        artJson.shadow[key] = value;
        onChange(artJson);
    };

    render() {
        const { artJson } = this.props;
        const { stroke: { size, color }, shadow: { color: shadowColor, blur } } = artJson;
        return (<React.Fragment>
            <div className={styles.other}>
                <div className={styles.left}>描边</div>
                <div className={styles.center}><NumberInput
                    min={0}
                    max={10}
                    step={1}
                    value={typeof size === 'number' ? size : 0}
                    onChange={(value) => this.onStrokeChange('size', handleMaxOrMinNum(value, 10))}
                /></div>
                <div className={styles.right}>颜色&nbsp;<SingleColorPicker
                    currentColor={color}
                    width={47}
                    onChange={(value) => this.onStrokeChange('color', value)}/>
                </div>
            </div>
        </React.Fragment>);
    }
}
