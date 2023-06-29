import React, { Component } from 'react';
import { Tooltip, Icon } from 'antd';
import styles from './elemGroup.less';
import Button from 'Components/Button';
import { connect } from 'dva';

const elemAlignList = [
    {
        title: '顶部对齐',
        icon: 'eqf-puttop',
        type: 'top',
    }, {
        title: '横向对齐',
        icon: 'eqf-putcenter',
        type: 'center',
    }, {
        title: '底部对齐',
        icon: 'eqf-putunder',
        type: 'bottom',
    }, {
        title: '左对齐',
        icon: 'eqf-putleft',
        type: 'left',
    }, {
        title: '纵向对齐',
        icon: 'eqf-putmiddle',
        type: 'middle',
    }, {
        title: '右对齐',
        icon: 'eqf-putright',
        type: 'right',
    }];

const hvEquallys = [
    {
        title: '垂直均分',
        icon: 'eqf-putright',
    }, {
        title: '水平均分',
        icon: 'eqf-putright',
    }];

const elemZIndex = [
    {
        title: '上移一层',
        icon: 'eqf-arrow-up',
        type: 'up',
    }, {
        title: '下移一层',
        icon: 'eqf-arrow-down',
        type: 'down',
    }, {
        title: '置于顶层',
        icon: 'eqf-ontop',
        type: 'top',
    }, {
        title: '置于底层',
        icon: 'eqf-onground',
        type: 'bottom',
    }];

@connect(({ workspace: { activeGroupIndex, groupList } }) => ({
    ...groupList.find(v => v.uuid === activeGroupIndex),
    activeGroupIndex,
}))

class ElemGroup extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    /**
     * 多个元素组合/取消
     */
    handleGroup = (e) => {
        const { activeGroupIndex, dispatch } = this.props;
        if (activeGroupIndex) {
            //取消组合
            dispatch({
                type: 'workspace/cancelElemGroup',
                payload: {
                    groupUuid: activeGroupIndex,
                },
            });
        } else {
            //组合元素
            dispatch({
                type: 'workspace/addElemGroup',
                payload: {},
            });
        }
    };
    /**
     * 设置元素对其方式
     */
    handleChangeElemAlign = (e, type) => {
        this.props.dispatch({
            type: 'workspace/changeElemAlign',
            payload: {
                type,
            },
        });
    };

    handleChangeLayer = (e, type) => {
        const { props: { dispatch } } = this;
        dispatch({
            type: 'workspace/changeManyLayer',
            payload: {
                type,
            },
        });
    };

    render() {
        const { activeGroupIndex } = this.props;
        const isGrouping = activeGroupIndex != null;
        return (
            <div className={styles.elemGroup}>
                {/* <Button onClick={this.handleGroup}>{ isGrouping ? '取消组合' : '组合'}</Button> */}
                {/* <Tooltip title={'敬请期待'}>
                    <Button disabled={true}
                            className={styles.disabled}
                            onClick={this.handleGroup}>{isGrouping ? '取消组合' : '组合'}</Button>
                </Tooltip> */}
                {
                    !isGrouping &&
                    <React.Fragment>
                        <div className={styles.elemAlign}>
                            {
                                elemAlignList.map((ele, index) =>
                                    <Tooltip placement="top" key={index} title={ele.title}
                                             onMouseDown={e => this.handleChangeElemAlign(e,
                                                 ele.type)}>
                                        <i className={`icon ${ele.icon}`} type={ele.icon}></i>
                                    </Tooltip>,
                                )
                            }
                        </div>
                        <div className={styles.elemZIndex}>
                            {
                                elemZIndex.map((ele, index) =>
                                    <Tooltip placement="top" key={index} title={ele.title}
                                             onMouseDown={e => this.handleChangeLayer(e,
                                                 ele.type)}>
                                        <i className={`icon ${ele.icon}`} type={ele.icon}></i>
                                    </Tooltip>,
                                )
                            }
                        </div>
                    </React.Fragment>
                }
            </div>
        );
    }
}

export default ElemGroup;
