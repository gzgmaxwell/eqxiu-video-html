import React, { Component } from 'react';
import { SingleColorPicker } from 'Components/colorPicker';
import styles from './stroke.less';
import { getMyFont } from 'Api/user';
import { host } from 'Config/env';
import { handleMaxOrMinNum } from '../../../../util/data';
import Cube from './cube';
import 'react-virtualized/styles.css';
import { ScrollTextInput } from '../../../components/input/scrollInput';

export const defaultArtFontStroke = {
    color: '#000',
    size: 0,
};


export default class Stroke extends Component {

    onChange = (key, value) => {
        const { artJson, onChange } = this.props;
        const newArtJson = {
            ...artJson,
            stroke: {
                ...(artJson.stroke || defaultArtFontStroke),
                [key]: value,
            },
        };
        onChange(newArtJson);
    };

    render() {
        const { artJson, onChange } = this.props;
        const { stroke: { size, color } } = artJson;
        return (<div className={styles.pb_8}>
            <div className={styles.spaceLine}/>
            <Cube artJson={artJson} onChange={onChange}>
                <div className={`${styles.other} ${styles.pb_8}`}>
                    <div>
                        <ScrollTextInput
                            max={10}
                            leftWidth={50}
                            title={'描边'}
                            style={{ width: 70 }}
                            defaultValue={size}
                            onChange={(value) => this.onChange('size',
                                handleMaxOrMinNum(value, 500))}
                        />
                    </div>
                    <div><SingleColorPicker
                        currentColor={color}
                        width={32} height={32} title={'颜色'}
                        onChange={(value) => this.onChange('color', value)}/>
                    </div>
                </div>
            </Cube>
        </div>);
    }
}
