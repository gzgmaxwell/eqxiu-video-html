import React, { Component } from 'react';
import { SingleColorPicker } from 'Components/colorPicker';
import styles from './textShadowSet.less';
import { ScrollTextInput } from 'Components/input/scrollInput';
import { getMyFont } from 'Api/user';
import { host } from 'Config/env';
import 'react-virtualized/styles.css';
import { handleMaxOrMinNum } from '../../../../util/data';

export const defaultArtFontShadow = {
    h: 0,
    v: 0,
    blur: 0,
    color: 'rgba(0,0,0,0)',
};


export default class TextShadowSet extends Component {
    onChange = (key, value) => {
        const { artJson, onChange } = this.props;
        const newArtJson = {
            ...artJson,
            shadow: {
                ...(artJson.shadow || defaultArtFontShadow),
                [key]: value,
            },
        };
        onChange(newArtJson);
    };

    render() {
        const { shadow = {} } = this.props.artJson;
        const { color, h, v, blur } = shadow;
        return (<div className={styles.pb_8}>
            <div className={styles.spaceLine}/>
            <div className={styles.set__title}>文字阴影</div>
            <div className={styles.offset}>
                <div>
                    <ScrollTextInput
                        max={10}
                        leftWidth={32}
                        title={'X'}
                        style={{ width: 44 }}
                        defaultValue={h}
                        onChange={(value) => this.onChange('h', handleMaxOrMinNum(value, 10))}
                    />
                </div>
                <div>
                    <ScrollTextInput
                        max={10}
                        leftWidth={32}
                        title={'Y'}
                        style={{ width: 44 }}
                        defaultValue={v}
                        onChange={(value) => this.onChange('v', handleMaxOrMinNum(value, 10))}
                    />
                </div>
            </div>
            <div className={styles.other}>
                <div>
                    <ScrollTextInput
                        max={500}
                        leftWidth={50}
                        title={'模糊'}
                        style={{ width: 70 }}
                        defaultValue={blur}
                        onChange={(value) => this.onChange('blur', handleMaxOrMinNum(value, 500))}
                    />
                </div>
                <div><SingleColorPicker
                    currentColor={color}
                    width={32} height={32} title={'阴影颜色'}
                    onChange={(value) => this.onChange('color', value)}/>
                </div>
            </div>
        </div>);
    }
}
