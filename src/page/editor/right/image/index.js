import React, { Component } from 'react';
import { connect } from 'dva';
import lodash from 'lodash';
import ImageSet from '../image/image.js';
import styles from './image.less';
import BorderSet from '../borderSet';
import { contrast } from '../../../../util/data';

@connect(({ workspace }) => ({ workspace }))
export default class Image extends Component {
    constructor(props) {
        super(props);
        this.body = React.createRef();
        this.video = React.createRef();
    }

    state = {
        row: false,
        column: false,
    };

    shouldComponentUpdate(nextProps, nextState) {
        if (!lodash.isEqual(this.state, nextState)) {
            return true;
        }
        const { workspace: { dataList, activeIndex } } = this.props;
        const { workspace: { dataList: newDataList, activeIndex: newIndex } } = nextProps;
        const nowData = dataList[activeIndex] || {};
        const newData = newDataList[newIndex] || {};
        if (contrast(nowData, newData, ['borderStyle'])) {
            return true;
        }
        return false;
    }

    // 背景颜色改变
    handleColorChange = (backgroundColor) => {
        this.changeNow({ backgroundColor });
    };

    // 图片翻转
    handleImageReversal = (name, checked) => {
        this.setState({
            [name]: checked,
        });
        // this.changeNow({[name]: checked})
    };

    // 保存数据
    changeNow = (payload) => {
        this.props.dispatch({
            type: 'workspace/changeNow',
            payload,
        });
    };

    render() {
        const { column, row } = this.state;
        const { dataList, activeIndex } = this.props.workspace;
        if (!dataList[activeIndex]) return null;
        return (
            <div className={styles.right__image__set}>

                <ImageSet/>
                {/*  <div className={styles.imageReversal}>
                    <div className={styles.left}>图片翻转</div>
                    <div className={styles.right}>
                        <Checkbox defaultChecked={row}
                                  onChange={(e) => this.handleImageReversal('row',
                                      e.target.checked)}>左右</Checkbox>
                        <Checkbox defaultChecked={column}
                                  onChange={(e) => this.handleImageReversal('column',
                                      e.target.checked)}>上下</Checkbox>
                    </div>
                </div>*/}
                <div className={styles.spaceLine}/>
                <BorderSet data={dataList[activeIndex]} changeNow={this.changeNow}/>
            </div>
        );
    }
}
