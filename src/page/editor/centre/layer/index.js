import React, { PureComponent, Component } from 'react';
import { connect } from 'dva';
import styles from './layer.less';
import { Tooltip } from 'antd';
import { getMyFont } from 'Api/user';
import { host } from 'Config/env';
import { SortableContainer, SortableElement, arrayMove } from 'react-sortable-hoc';
import 'react-virtualized/styles.css';
import Icon from '../../../components/Icon';
import { CANVAS_TYPE } from '../../../../config/staticParams';
import lodash from 'lodash';
import { isPressedCtrl } from '../../../../util/event';
import eventEmitter from 'Services/EventListener';
import { message } from 'antd';

@SortableContainer
class LayerUlGroup extends Component {

    render() {
        const { props: { dataList, uuid, hiddenLayerChildren } } = this;
        return (<ul className={styles.groupUl}>
            {dataList.map((item, index) => {
                const key = item.uuid;
                const childProps = {
                    key,
                    index,
                    // isActive: activeIndex === (dataList.length - 1 - index),
                    // currentIndex: index,
                    hiddenLayer: (e, type) => hiddenLayerChildren(e, type, item.uuid),
                    hiddenLock: true,
                    collection: uuid,
                    disabled: true,
                    changeActive: () => {
                    },
                    item,
                };
                return <LayerRow {...childProps}/>;
            })}
        </ul>);
    }
}

@SortableElement
// @connect()
@connect(({ workspace }) => {
    const { groupList } = workspace;
    return {
        groupList,
    };
})
class LayerRowGroup extends Component {

    state = {
        opened: false,
    };

    changeOpen = (e) => {
        const { onOpenGroup, uuid } = this.props;
        onOpenGroup(uuid);
    };

    lockLayer = (e) => {
        const { dispatch, uuid, lock = false, groupList } = this.props;
        e.preventDefault();
        e.stopPropagation();
        const l = !lock;
        dispatch({
            type: 'workspace/changeGroup',
            payload: {
                lock: l,
                uuid,
            },
        })
            .then(() => {
                eventEmitter.emit('layerLockGroupEvent', l);
            });
    };

    hiddenLayer = () => {
        const { dispatch, uuid, visibility = 'visible' } = this.props;
        const newVisibility = visibility === 'hidden' ? 'visible' : 'hidden';
        dispatch({
            type: 'workspace/changeGroup',
            payload: {
                visibility: newVisibility,
                uuid,
            },
        });
    };

    onSortEnd = (index) => {
        let { oldIndex, newIndex } = index;
        console.log(oldIndex);
        console.log(newIndex);
    };

    hiddenLayerChildren = (e, type, uuid) => {
        const { dispatch } = this.props;
        e.preventDefault();
        e.stopPropagation();
        dispatch({
            type: 'workspace/saveLayerData',
            payload: {
                data: { visibility: type },
                uuid,
            },
        });
    };

    activeGroup = () => {
        const { dispatch, uuid, groupList } = this.props;
        //已选中的组 不用再次更新状态
        if (groupList.find(v => v.uuid === uuid).active === true) {
            return;
        }
        dispatch({
            type: 'workspace/activeElemGroup',
            payload: {
                activeGroupIndex: uuid,
            },
        })
            .then(() => {
                //传递当前组lock状态给右侧面板
                eventEmitter.emit('layerLockGroupEvent', (groupList.find(v => v.uuid === uuid) || {}).lock);
            });
    };

    render() {
        const {
            props: {
                active,
                isOpened,
                activeElems = [], lock = false,
                uuid,
                visibility = 'visible', currentIndex,
                name: groupName,
            },
            changeOpen, hiddenLayer, lockLayer,
            onSortEnd, hiddenLayerChildren, activeGroup,
        } = this;
        const ulProps = {
            onSortEnd,
            dataList: activeElems,
            uuid,
            hiddenLayerChildren,
        };
        return (
            <React.Fragment>
                <li className={`video-layer ${styles.layer__set} ${styles.groupRow}
                 ${active
                    ? styles.layer__active
                    : ''} `}
                    onClick={activeGroup}>
                    <div className={styles.layer__name__div}><Icon
                        className={styles.openBtn}
                        type={isOpened ? 'eqf-menu-down' : 'eqf-menu-right'}
                        onClick={changeOpen}
                    />{groupName}
                    </div>
                    <div className={styles.layer__option}>
                        <Tooltip placement="top" title={lock ? '解锁' : '锁定'}
                                 overlayClassName={styles.tooltip}>
                            {lock ? <Icon type="eqf-lock-l"
                                          className={styles.disabled}
                                          onClick={(e) => lockLayer(e)}/> :
                                <Icon className={'iconfont iconunlock-l'}
                                      onClick={(e) => lockLayer(e)}/>}
                        </Tooltip>
                        <Tooltip placement="top" title={visibility !== 'hidden' ? '隐藏' : '显示'}
                                 overlayClassName={styles.tooltip}>
                            {visibility !== 'hidden' ?
                                <Icon type="eqf-eye-l"
                                      onClick={(e) => hiddenLayer()}/> :
                                <Icon type="eqf-hidden-l"
                                      className={styles.disabled}
                                      onClick={(e) => hiddenLayer()}/>}
                        </Tooltip>
                    </div>
                </li>
                {isOpened &&
                <LayerUlGroup {...ulProps} />}
            </React.Fragment>
        );
    }
}


@SortableElement
class LayerRow extends Component {
    constructor(props) {
        super(props);
        this.input = React.createRef();
        this.title = React.createRef();
    }

    /**
     * 双击事件委托被侵占 需要在此绑定
     */
    componentDidMount() {
        this.title.current.addEventListener('dblclick', this.openInput, true);
    }

    openInput = (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.props.handleSelected(e.currentTarget.innerHTML, this.props.currentIndex);
    };

    /**
     * 解除事件绑定
     */
    componentWillUnmount() {
        this.title.current.removeEventListener('dblclick', this.openInput, true);
    }

    render() {
        const {
            isActive,
            selected,
            changeActive,
            hiddenLayer,
            onChange,
            changeLayerName,
            lockLayer,
            item,
            currentIndex,
            curentUuid,
            hiddenLock = false,
        } = this.props;
        const { layerName, lock, visibility, uuid, type } = item;
        const key = `${currentIndex}${layerName}`;
        return (
            <li className={`video-layer ${styles.layer__set} ${isActive ? styles.layer__active : ''}`}
                draggable={false}
                onClick={(e) => changeActive(e, curentUuid)}>

                <div ref={this.title} className={styles.layer__name__div}>
                    {selected !== key ? layerName :
                        <input ref={this.input}
                               maxLength={15}
                               defaultValue={layerName}
                               className={styles.layer__name__input}
                               onBlur={(e) => changeLayerName(e, uuid)}
                               onChange={(e) => onChange(e, uuid)}
                               autoFocus/>}
                </div>
                <div className={styles.layer__option}>
                    {!hiddenLock && type !== CANVAS_TYPE.dynamicBg &&
                    <Tooltip placement="top" title={lock ? '解锁' : '锁定'}
                             overlayClassName={styles.tooltip}>
                        {lock ? <Icon type="eqf-lock-l"
                                      className={styles.disabled}
                                      onClick={(e) => {
                                          if (type === CANVAS_TYPE.dynamicBg) return null;
                                          lockLayer(e, false, uuid);
                                      }
                                      }/> :
                            <Icon className={'iconfont iconunlock-l'}
                                  onClick={(e) => lockLayer(e, true, uuid)}/>}
                    </Tooltip>}
                    <Tooltip placement="top" title={visibility !== 'hidden' ? '隐藏' : '显示'}
                             overlayClassName={styles.tooltip}>
                        {visibility !== 'hidden' ?
                            <Icon type="eqf-eye-l"
                                  onMouseDown={(e) => hiddenLayer(e, 'hidden', uuid)}/> :
                            <Icon type="eqf-hidden-l"
                                  className={styles.disabled}
                                  onMouseDown={(e) => hiddenLayer(e, 'visible', uuid)}/>}
                    </Tooltip>
                </div>
            </li>
        );
    }
}

@SortableContainer
class LayerContainer extends Component {
    state = {
        openGroupUUID: null,
    };

    onOpenGroup = (uuid) => {
        const { openGroupUUID } = this.state;
        if (openGroupUUID === uuid) {
            this.setState({ openGroupUUID: null });
        } else {
            this.setState({ openGroupUUID: uuid });
        }

    };

    render() {
        const {
            props: { dataList: oldDataList, groupList, activeIndex, activeIndexes, moving, ...parentProps }, state: {
                openGroupUUID,
            },
            onOpenGroup,
        } = this;
        const dataList = lodash.cloneDeep(oldDataList);
        const liArray = [];
        const groupInserted = [];
        let height = 0;
        let index = 0;
        //当前激活元素uuid 支持多选
        let eleActiveUuids = [];
        // if(activeIndex != null && !Array.isArray(activeIndex)) {
        //     eleActiveUuid = dataList[activeIndex].uuid;
        // }
        eleActiveUuids = dataList.map((v, i) => {
            if (activeIndexes.includes(i)) {
                return v.uuid;
            }
        })
            .filter(v => v);
        dataList.reverse()
            .forEach((item) => {
                const group = groupList.find(
                    value => value.activeElems.find(v => v.uuid === item.uuid));
                if (group) {
                    if (groupInserted.includes(group.uuid)) {
                        index += 1;
                        return;
                    }
                    groupInserted.push(group.uuid);
                    let isOpened = false;
                    height += 37;
                    if (group.uuid === openGroupUUID) {
                        isOpened = true;
                        height += group.activeElems.length * 37;
                    }
                    const key = group.uuid;
                    if (moving) {
                        isOpened = false;
                    }
                    const childProps = {
                        key,
                        index,
                        currentIndex: index,
                        curentUuid: key,
                        ...group,
                        ...parentProps,
                        isOpened,
                        activeElems: group.activeElems.map((value, index) => {
                            const one = dataList.find(ele => ele.uuid === value.uuid);
                            if (one) {
                                return {
                                    ...one,
                                    _sort: index,
                                };
                            } else {
                                return false;
                            }
                        })
                            .filter(v => v)
                            .sort((a, b) => b._sort - a._sort),
                        onOpenGroup,
                    };
                    liArray.push(<LayerRowGroup {...childProps} />);
                } else {
                    if (!item || !item.type || item.type === CANVAS_TYPE.background) {
                        return null;
                    }
                    height += 37;
                    const key = item.uuid;
                    const childProps = {
                        key,
                        index,
                        isActive: eleActiveUuids.includes(key),
                        currentIndex: index,
                        curentUuid: key,
                        item,
                        ...parentProps,
                    };
                    index += 1;
                    liArray.push(<LayerRow {...childProps} />);
                }
            });
        height = Math.min(height, 300);
        return (
            <ul
                style={{
                    height,
                    overflowY: 'auto',
                }}>
                {liArray}
            </ul>
        );
    }
}

@connect(({ workspace }) => {
    const { dataList, activeIndex, activeIndexes, groupList } = workspace;
    return {
        // dataList: dataList.filter(v => v.type !== CANVAS_TYPE.userMarket),
        dataList,
        activeIndex,
        activeIndexes,
        groupList,
    };
})
export default class Layer extends PureComponent {
    constructor(props) {
        super(props);
        this.len = props.dataList.length;
        this.state = {
            top: 80,
            left: 400,
            moving: false,
        };
    }

    layerData = null;

    componentDidUpdate() {
        this.getLength();
    }

    componentDidMount() {
        this.getLength();
    }

    componentWillUnmount() {
        if (this.layerData) {
            const { layerName, index } = this.layerData;
            this.saveLayerData({ layerName }, uuid);
        }
    }

    getLength = () => {
        const { groupList, dataList } = this.props;
        const len = dataList.length + groupList.length;
        const groupLen = groupList.reduce((prv, cur) => cur.activeElems.length + prv, 0);
        this.len = len - groupLen;
    };

    reverseIndex = (index) => {
        return this.len - 1 - index;
    };

    onSortEnd = (index) => {
        const { dataList, activeIndex } = this.props;
        let { oldIndex, newIndex } = index;
        oldIndex = this.reverseIndex(oldIndex);
        newIndex = this.reverseIndex(newIndex);

        this.props.dispatch({
            type: 'workspace/changeLayer',
            payload: {
                oldIndex,
                newIndex,
            },
        });
        this.setState({ moving: false });
        //拖动结束显示元素
        const layerDom = document.querySelectorAll('.video-layer');
        for (let i = 0; i < layerDom.length; i++) {
            layerDom[i].style.visibility = 'visible';
            layerDom[i].style.opacity = '1';
        }
    };
    // 隐藏图层
    hiddenLayer = (e, hidden, uuid) => {
        e.preventDefault();
        e.stopPropagation();
        this.saveLayerData({ visibility: hidden }, uuid);
    };
    // 锁定图层
    lockLayer = (e, lock, uuid) => {
        e.preventDefault();
        e.stopPropagation();
        this.saveLayerData({
            lock,
            pointerEvents: lock ? 'none' : 'auto',
        }, uuid);
    };
    // 修改图层名字
    changeLayerName = (e, uuid) => {
        this.saveLayerData({ layerName: e.target.value }, uuid);
        this.setState({ selected: null });
    };
    // 保存图层名字，以免丢失
    onChange = (e, uuid) => {
        this.layerData = {
            layerName: e.target.value,
            uuid,
        };
    };
    // 保存数据
    saveLayerData = (data, uuid) => {
        this.props.dispatch({
            type: 'workspace/saveLayerData',
            payload: {
                data,
                uuid,
            },
        })
            .then(() => {
                this.layerData = null;
            });
    };
    changeActive = (e, curentUuid) => {
        const { dataList } = this.props;
        const index = dataList.findIndex(v => v.uuid === curentUuid);
        this.props.dispatch({
            type: 'workspace/changeActive',
            payload: {
                index,
                clear: !isPressedCtrl(e),
            },
        });
    };
    // 双击图层名字时触发修改输入框
    handleSelected = (layerName, uuid) => {
        this.layerData = {
            layerName,
            uuid,
        };
        this.setState({
            selected: `${uuid}${layerName}`,
        });
    };
    beginMoveBody = (e) => {
        let startPostion = {
            x: e.clientX,
            y: e.clientY,
        };
        const movingBody = (movingEvent) => {
            const { left, top } = this.state;
            const newState = {
                left: movingEvent.clientX - startPostion.x + left,
                top: movingEvent.clientY - startPostion.y + top,
            };
            startPostion = {
                x: movingEvent.clientX,
                y: movingEvent.clientY,
            };
            const { offsetWidth, offsetHeight } = document.getElementById('container');
            const layerW = 194;
            const layerH = 340;
            // 如果宽高超过限度 则不动
            if (newState.left < 0 || newState.left > offsetWidth - layerW
                || newState.top < 0 || newState.top > offsetHeight - layerH) {
                return;
            }
            this.setState(newState);
        };
        const moveOver = (moEvent) => {
            document.removeEventListener('mousemove', movingBody);
            document.removeEventListener('mouseup', moveOver);
        };
        document.addEventListener('mousemove', movingBody);
        document.addEventListener('mouseup', moveOver);
    };

    onSortStart = (e) => {
        this.setState({ moving: true });
    };

    render() {
        const { dataList, activeIndex, groupList, activeIndexes } = this.props;
        const { props: { onClose } } = this;
        const { selected, left, top, moving } = this.state;

        const ulProps = {
            onSortEnd: this.onSortEnd,
            distance: 10,
            pressThreshold: 10,
            axis: 'y',
            lockAxis: 'y',
            dataList,
            activeIndex,
            activeIndexes,
            selected,
            changeActive: this.changeActive,
            hiddenLayer: this.hiddenLayer,
            handleSelected: this.handleSelected,
            onChange: this.onChange,
            onSortStart: this.onSortStart,
            changeLayerName: this.changeLayerName,
            lockLayer: this.lockLayer,
            lockToContainerEdges: true,
            groupList,
            moving,
        };
        return (
            <div className={styles.layer_body}

                 style={{
                     left,
                     top,
                 }}>
                <div
                    className={styles.header}
                    onMouseDown={this.beginMoveBody}
                >
                    图层
                    <Icon type='eqf-no' onClick={onClose}/>
                </div>
                {dataList.length < 2 ?
                    <React.Fragment>
                        <div className={styles.emptyBox}/>
                        <div className={styles.emptyBoxText}>该片段暂无图层</div>
                    </React.Fragment> :
                    <LayerContainer {...ulProps} />
                }

            </div>
        );
    }
}
