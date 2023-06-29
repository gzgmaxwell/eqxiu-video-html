import React, { Component } from 'react';
import { connect } from 'dva';
import { Message, Switch } from 'antd';
import Slider from 'Components/slider';
import { genUrl } from 'Util/image';
import { formatEQXMessage } from 'Util/event';
import NumberInput from 'Components/input/numberInput';
import styles from './gif.less';
import { SingleColorPicker } from '../../../components/colorPicker';
import BorderSet from '../borderSet';
import Input from '../../../components/input/input';
import { handleMaxOrMinNum } from '../../../../util/data';
import OpacityInput from '../../../components/input/opacityInput';

@connect(({ workspace }) => ({ workspace }))
export default class GifSet extends Component {
    /**
     * 改变背景图的透明度
     * */
    onOpacityChange = (data) => {
        let value = 1 - ~~data / 100;
        if (Number.isNaN(value)) {
            return;
        }
        if (value < 0) {
            value = 0;
        }
        if (value > 1) {
            value = 1;
        }
        this.changeNow({ opacity: value });
    };

    // 保存数据
    changeNow = (payload) => {
        this.props.dispatch({
            type: 'workspace/changeNow',
            payload,
        });
    };
    handleColorChange = (color) => {
        const payload = { backgroundColor: color };
        this.changeNow(payload);
    };
    changeLoop = (checked) => {
        this.changeNow({ loop: checked });
    };

    render() {
        const { workspace: { dataList, activeIndex } } = this.props;
        const { opacity = 1, backgroundColor, loop } = dataList[activeIndex] || {};
        const opacityValue = ~~(100 - Number(opacity) * 100);
        return (
            <div>
                <div className={styles.opacitySet}>
                    <div className={styles.input}>
                        <OpacityInput defaultValue={opacityValue} onChange={(value) => this.onOpacityChange(handleMaxOrMinNum(value, 100))} />
                    </div>
                    <div className={styles.right}>
                        <SingleColorPicker
                            width={32} height={32}
                            currentColor={backgroundColor}
                            onChange={this.handleColorChange}
                        />
                    </div>
                </div>
                <div className={styles.imageReversal}>
                    <div className={styles.left}>循环播放</div>
                    <div className={styles.switch}><Switch checked={loop} onChange={this.changeLoop}/></div>
                </div>
                < BorderSet/>
            </div>
        );
    }
}
