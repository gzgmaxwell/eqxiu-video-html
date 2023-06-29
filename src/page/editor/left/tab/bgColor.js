import React, { Component } from 'react';
import { connect } from 'dva';
import { SingleColorPicker } from '../../../components/colorPicker';
import styles from './bgColor.less';
import { DEFAULT_BACKGROUND_COLOR } from 'Config/staticParams';
import bgColors from '../../../../dataBase/bgColor';
import { rgbToHex } from '../../../../util/data';
import ScrollContainer from '../../../components/scrollContainer';

@connect(({ workspace }) => {
    const dataList = workspace.dataList || [];
    const { backgroundColor = DEFAULT_BACKGROUND_COLOR } = dataList[0] || {};
    return { backgroundColor };
})
export default class BgColor extends Component {
    shouldComponentUpdate(nextProps, nextState, nextContext) {
        return this.props.backgroundColor !== nextProps.backgroundColor;
    }

    handleColorChange = (color) => {
        this.props.dispatch({
            type: 'workspace/changeBackground',
            payload: { backgroundColor: color },
        });
    };

    render() {
        const { backgroundColor = DEFAULT_BACKGROUND_COLOR } = this.props;
        return (
            <ScrollContainer>
                <div className={`${styles.bgColor} scrollDiv`}>
                    <div className={styles.top}>
                        <SingleColorPicker
                            placement="right"
                            currentColor={backgroundColor}
                            width={170} height={30}
                            onChange={this.handleColorChange}/>
                        <input value={rgbToHex(backgroundColor)} readOnly/>
                    </div>

                    {bgColors.map((row, i) => <div key={i} className={styles.colors}>
                        {row.map(color =>
                            <div
                                onClick={() => this.handleColorChange(color)}
                                key={color}
                                style={{
                                    background: color,
                                    border: color === 'rgba(255,255,255,1)'
                                            ? '1px solid #d9d9d9'
                                            : 'unset',
                                }}/>)}
                    </div>)}
                </div>
            </ScrollContainer>
        );
    }
}
