import React, { Component } from 'react';
import { SingleColorPicker } from 'Components/colorPicker';
import styles from './shakeSet.less';
import NumberInput from 'Components/input/numberInput';
import Slider from 'Components/slider';
import { getMyFont } from 'Api/user';
import { host } from 'Config/env';
import { handleMaxOrMinNum } from '../../../../util/data';
import 'react-virtualized/styles.css';
import { ScrollTextInput } from '../../../components/input/scrollInput';


export const defualtArtFontShake = {};

export default class ShakeSet extends Component {
    onColorsChange = (key, value) => {
        const { artJson, onChange } = this.props;
        const oldShake = artJson.shake || defualtArtFontShake;
        onChange({
            ...artJson,
            shake: {
                ...oldShake,
                colors: {
                    ...oldShake.colors,
                    [key]: value,
                },
            },
        });
    };
    onSizeChange = (value) => {
        const { onChange, artJson } = this.props;
        artJson.shake.size = value;
        onChange({
            ...artJson,
            shake: {
                ...(artJson.shake || defualtArtFontShake),
                size: value,
            },
        });
    };

    onAngleChange = (angle) => {
        const { artJson, onChange } = this.props;
        onChange({
            ...artJson,
            angle,
        });
    };

    render() {
        const { angle, shake: { size, colors } } = this.props.artJson;
        const color1 = colors[0];
        const color2 = colors[1];
        return (<div className={styles.pb_8}>
            <div className={styles.spaceLine}/>
            <div className={styles.set__title}>
                颤抖文字
            </div>
            <div className={styles.color}>
                <SingleColorPicker
                    currentColor={color1}
                    width={76} height={32} title={'阴影颜色'}
                    onChange={(value) => this.onColorsChange(0, value)}/>
                <SingleColorPicker
                    currentColor={color2}
                    width={76} height={32} title={'阴影颜色'}
                    onChange={(value) => this.onColorsChange(1, value)}/>
            </div>

            <div className={styles.other}>
                <div>
                    <ScrollTextInput
                        max={10}
                        leftWidth={50}
                        title={'尺寸'}
                        style={{ width: 108 }}
                        defaultValue={size}
                        onChange={(value) => this.onSizeChange(handleMaxOrMinNum(value, 10))}
                    />
                </div>
            </div>

            <div className={`${styles.other} ${styles.pb_8}`}>
                <div>
                    <ScrollTextInput
                        max={359}
                        leftWidth={50}
                        title={'角度'}
                        style={{ width: 108 }}
                        defaultValue={angle}
                        onChange={(value) => this.onAngleChange(handleMaxOrMinNum(value, 359))}
                    />
                </div>
            </div>
        </div>);
    }
}
