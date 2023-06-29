import React, { Component } from 'react';
import { SingleColorPicker } from 'Components/colorPicker';
import styles from './cube.less';
import NumberInput from 'Components/input/numberInput';
import Slider from 'Components/slider';
import { getMyFont } from 'Api/user';
import { host } from 'Config/env';
import { handleMaxOrMinNum } from '../../../../util/data';
import 'react-virtualized/styles.css';
import TextShadowSet, { defaultArtFontShadow } from './textShadowSet';
import { ScrollTextInput } from '../../../components/input/scrollInput';

export const defaultArtFontCube = {
    color: '#000',
    size: 1,
};

export default class Cube extends Component {


    onChange = (key, value) => {
        const { artJson, onChange } = this.props;
        const newArtJson = {
            ...artJson,
            cube: [
                {
                    ...(artJson.cube && artJson.cube[0] || defaultArtFontCube),
                    [key]: value,
                }],
        };
        onChange(newArtJson);
    };

    onAngleChange = (angle) => {
        const { artJson, onChange } = this.props;
        const newArtJson = {
            ...artJson,
            angle,
        };
        onChange(newArtJson);
    };

    render() {
        const { artJson, children, onChange } = this.props;
        const { angle, cube = [] } = artJson;
        const { size, color } = cube[0] || {};
        return (<div className={styles.pb_8}>
            <div className={styles.spaceLine}/>
            <div className={styles.set__title}>
                立体层次
            </div>
            <div className={styles.other}>
                <div>
                    <ScrollTextInput
                        max={10}
                        leftWidth={50}
                        title={'尺寸'}
                        style={{ width: 70 }}
                        defaultValue={size}
                        onChange={(value) => this.onChange('size', handleMaxOrMinNum(value, 10))}
                    />
                </div>
                <div><SingleColorPicker
                    currentColor={color}
                    width={32} height={32} title={'颜色'}
                    onChange={(value) => this.onChange('color', value)}/>
                </div>
            </div>
            <div className={`${styles.angle} ${styles.mb_8}`}>
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
            {children}
            <TextShadowSet artJson={artJson} onChange={onChange}/>
        </div>);
    }
}
