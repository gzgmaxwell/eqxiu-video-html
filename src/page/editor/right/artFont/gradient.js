import React, { Component } from 'react';
import { SingleColorPicker } from 'Components/colorPicker';
import styles from './gradient.less';
import { getMyFont } from 'Api/user';
import { host } from 'Config/env';
import { chunk } from 'lodash';
import { handleMaxOrMinNum } from '../../../../util/data';
import 'react-virtualized/styles.css';
import { gradient } from '../../../../util/style';
import { defaultGradientColors } from '../../left/artFontJsonList';
import { ScrollTextInput } from '../../../components/input/scrollInput';

export default class Gradient extends Component {
    onColorsChange = (key, value) => {
        const { artJson, onChange } = this.props;
        artJson.gradient.colors[key] = value;
        const newArtJson = {
            ...artJson,
            gradient: {
                ...artJson.gradient,
                colors: {
                    ...artJson.gradient.colors,
                    [key]: value,
                },
            },
        };
        onChange(newArtJson);
    };
    onAngleChange = (angle) => {
        const { artJson, onChange } = this.props;
        onChange({
            ...artJson,
            gradient: {
                ...artJson.gradient,
                angle,
            },
        });
    };
    onChange = (gradient) => {
        const { artJson, onChange } = this.props;
        onChange({
            ...artJson,
            gradient,
        });
    };

    render() {
        const { artJson } = this.props;
        const { gradient: { angle, colors } } = artJson;
        const color1 = colors[0];
        const color2 = colors[1];
        const css = gradient(artJson);
        return (<div className={styles.pb_8}>
            <div className={styles.spaceLine}/>
            <div className={styles.set__title}>渐变文字</div>
            <div className={styles.colors}>
                <div className={styles.left}>
                    <SingleColorPicker
                        width={27} height={27}
                        currentColor={color1}
                        onChange={(value) => this.onColorsChange('0', value)}
                    />
                </div>
                <div className={styles.center} style={{ backgroundImage: css.backgroundImage }}/>
                <div className={styles.right}>
                    <SingleColorPicker
                        width={27} height={27}
                        currentColor={color2}
                        onChange={(value) => this.onColorsChange('1', value)}
                    />
                </div>
            </div>
            {chunk(defaultGradientColors, 6)
                .map((item, index) => {
                    return (<div key={index} className={styles.gradientColors}>
                        {item.map((subItem, i) => {
                            const { backgroundImage } = gradient({ gradient: subItem });
                            return <div key={i} className={styles.gradientColor}
                                        style={{ backgroundImage }}
                                        onClick={() => this.onChange(subItem)}/>;
                        })}
                    </div>);
                })}
            <div className={styles.angle}>
                <ScrollTextInput
                    max={359}
                    leftWidth={50}
                    title={'角度'}
                    style={{ width: 108 }}
                    defaultValue={angle}
                    onChange={(value) => this.onAngleChange(handleMaxOrMinNum(value, 359))}
                />
            </div>
        </div>);
    }
}
