import React, { useEffect, useState, useRef } from 'react';
import { connect } from 'dva';
import { message, Popover } from 'antd';
import styles from './LeftParty.less';
import EIcon from 'Components/Icon';
import { Tooltip } from 'antd';
import DeleteModal from 'Components/delete';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import Button from '../components/Button';
import Modal from '../components/modal';
import VideoStore from './videoStore';
import {
    CANVAS_TYPE, EDITOR_PRODUCT,
    LEFT_PARTY_SIZE, MAX_PARTY_COUNT,
    MIN_CONCAT_DURATION, MIN_CONCAT_TIME,
    WORKSPACE_SIZE, WORKSPACE_Z_INDEX, WorkspaceVideoType,
} from '../../config/staticParams';
import { genUrl } from '../../util/image';
import PreviewVideo from './right/previewVideo';
import { TRANSITIONS, TRANSITIONS_DURATION } from '../../dataBase/transitions';
import TransitionPreview from './left/transtitionPreview';
import Loading from '../components/loading';
import isEqual from 'lodash/isEqual';
import { contrast } from '../../util/data';
import transitionImg from '../static/icon/haveTransition.svg';
import noTransitionImg from '../static/icon/noTransition.svg';
import noAllowTransition from '../static/icon/noAllowTransition.svg';
import HeadOrTail from './right/headAndTailParty';
import { waitChoseModel } from '../components/delete';
import { createElement } from './centre/workspace';
import Icon from '../components/Icon';
import Infinite from 'react-infinite';
import eventEmitter from '../../services/EventListener';

const clearDefault = { // 清除默认事件
    draggable: false,
};


const LIST_HEIGHT = {
    ver: {
        active: 172.8,
        no: 134.8
    },
    hoz: {
        active: 113.8,
        no: 93.8
    },
    headNo: 53,
};

function initElementProps(...params) {
    const [{ editor }, props] = params;
    const { uuid, myIndex } = props;
    const { elementList: dataList } = editor.parties[myIndex];
    let index = null;
    const item = dataList.find((v, i) => {
        if (v.uuid === uuid) {
            index = i;
            return true;
        }
        return false;
    }) || {};
    const active = false;
    const paramsData = {
        width: item.width,
        height: item.height,
        rotate: item.rotate || 0,
        top: item.top || 0,
        left: item.left || 0,
        zIndex: WORKSPACE_Z_INDEX + index * 5, // 间隔5
    };
    const resizeprops = {
        ...props.resizeprops,
        paramsData,
        groupUuid: item.groupUuid,
        active,
        fixedaspectratio: item.resolutionW / item.resolutionH,
    };
    return {
        ...item,
        resizeprops,
    };
}


@SortableElement
class OneParty extends React.PureComponent {
    constructor(props) {
        super(props);
        this.input = React.createRef();
    }

    componentDidCatch(e, s) {
        console.log(e);
        console.log(s);
    }

    state = {
        transitionPreview: false,
    };
    onClick = (e) => {
        this.props.onClick();
    };
    handleChange = (key, value) => {
        const { myIndex, onChangeConcatSet } = this.props;
        onChangeConcatSet(myIndex, key, value);
        if (key === 'concatType' && value !== 'none') {
            onChangeConcatSet(myIndex, 'duration',
                (TRANSITIONS[value] || {}).defaultDuration || 800);
        }
    };
    openTransitions = (e) => {
        const { myIndex } = this.props;
        this.setState({ transitionPreviewModal: true });
        setTimeout(() => {
            this.props.drawPreview(myIndex, () => this.setState({ transitionPreviewGL: true }));
        }, 100);
    };
    closeTransitions = (e) => {
        this.setState({
            transitionPreviewModal: false,
            transitionPreviewGL: false,
        });
    };
    concatTypes = [
        ...Object.values(TRANSITIONS)
            .map((v) => ({
                title: v.cname,
                value: v.value,
            })),
    ];
    apllyAllconcat = () => {
        const { props: { myIndex, onChangeAllConcatSet } } = this;
        waitChoseModel({
            text: '确定将该转场设置应用于所有的片段吗？',
            type: 'eqf-why-f',
        })
            .then(() => {
                onChangeAllConcatSet(myIndex);
            });
    };

    getPartyPre = () => {
        const { props } = this;
        const { loadingObj, uuid, transverse, playSpeed, onCopy, onDelete, myIndex, active, isHeadTail, renderSetting: { segmentPartyDuration } } = props;
        const timeStr = moment(segmentPartyDuration * 1000)
            .format('mm:ss');
        const drawing = loadingObj[uuid] || false;
        // 判断横竖板缩略图的宽高
        const width = transverse ? LEFT_PARTY_SIZE.l : LEFT_PARTY_SIZE.s;
        const height = transverse ? LEFT_PARTY_SIZE.s : LEFT_PARTY_SIZE.l;
        const activeWidth = transverse ? LEFT_PARTY_SIZE.activeL : LEFT_PARTY_SIZE.activeS;
        const activeHeight = transverse ? LEFT_PARTY_SIZE.activeS : LEFT_PARTY_SIZE.activeL;
        const proWidth = transverse ? WORKSPACE_SIZE.l : WORKSPACE_SIZE.s;
        const proHeight = transverse ? WORKSPACE_SIZE.s : WORKSPACE_SIZE.l;
        const scale = width / proWidth;
        const activeScale = activeWidth / proWidth;
        return (<div className={styles.partyPre}>
            <div className={styles.canvas}>
                <Loading loading={drawing} title={'生成片段图层...'} isAbsolute={true} delay={2000}/>
                <div key={uuid} style={{
                    width: active ? activeWidth : width,
                    height: active ? activeHeight : height,
                    transform: `scale(${active ? activeScale : scale})`,
                    transformOrigin: 'top left',
                }}>
                    <div style={{
                        width: proWidth,
                        height: proHeight,
                    }} className={styles.partyLi}>
                        {Array.isArray(props.elementList) &&
                        props.elementList.map((item, index) => {
                            if (!item.type) {
                                const backgroundPicProps = { // 背景图的props
                                    src: genUrl(item.backgroundImg,
                                        `${proWidth}:${proHeight}`),
                                    style: { opacity: item.videoBackgroundPicOpacity },
                                };
                                return <div ref={this.background} key={'background'}
                                            style={{ backgroundColor: item.backgroundColor }}
                                            className={styles.background}>
                                    {item.backgroundImg ?
                                        <img {...clearDefault} {...backgroundPicProps}
                                             className={styles.videoBackgroundPic}
                                        /> : ''}
                                </div>;
                            }
                            const Element = createElement(item.type);

                            const resizeprops = { // 缩放组件的props
                                active: false,
                                paramsData: {
                                    width: item.width,
                                    height: item.height,
                                    rotate: item.rotate || 0,
                                    top: item.top || 0,
                                    left: item.left || 0,
                                    zIndex: WORKSPACE_Z_INDEX + index * 5, // 间隔5
                                },
                                limit: {
                                    width: [10],
                                    height: [10],
                                },
                                fixedaspectratio: item.resolutionW / item.resolutionH,
                            };
                            const itemProps = {
                                myIndex,
                                resizeprops,
                                elementprops: clearDefault,
                                initFunction: initElementProps,
                                ...item,
                                index,
                            };
                            return <Element key={`${item.uuid}-ele`} {...itemProps} />;
                        })}
                    </div>
                </div>
            </div>
            {!isHeadTail && <div className={styles.mask}>
                <div className={styles.icons}>
                    <Tooltip placement="left" title='复制' overlayClassName={styles.tooltip}>
                        <div className={styles.iconContainer} onClick={(e) => onCopy(e, myIndex)}>
                            <EIcon type="eqf-copy-l"/>
                        </div>
                    </Tooltip>
                    <Tooltip placement="left" title='删除' overlayClassName={styles.tooltip}>
                        <div className={styles.iconContainer} onClick={() => onDelete(myIndex)}>
                            <EIcon type="eqf-delete-l"/>
                        </div>
                    </Tooltip>
                </div>
            </div>}
            <div className={styles.partyTime}>
                {timeStr}
            </div>
        </div>);
    };

    render() {
        const { props, state: { transitionPreviewModal, transitionPreviewGL } } = this;
        const { transverse, myIndex, uuid, active, height, renderSetting = {}, haveConcat, isHeadTail, isShow } = props;
        const { concatSet } = renderSetting;
        const { duration = 400, concatType = 'none' } = concatSet || {};
        // 片段的序号和转场图标
        const haveTransitions = concatType && concatType !== 'none'; // 是否有转场
        // 转场设置区域
        const disabledCss = haveTransitions ? '' : styles.disabled;
        const Concat = (<div className={styles.selectContainer}>
            <div className={styles.concatTitle}>转场动画</div>
            {haveConcat ? <div className={styles.typesContainer}>
                {this.concatTypes.map(item => {
                    const checked = concatType === item.value ? styles.checked : '';
                    return <div className={checked} key={item.value}
                                onClick={() => this.handleChange('concatType',
                                    item.value)}>{item.title}</div>;
                })}
            </div> : <Tooltip placement="top" title='前后片段时长均不能小于1秒'>
                <div className={styles.typesContainer}>
                    {this.concatTypes.map(item => {
                        return <div className={styles.disabled}
                                    key={item.value}>{item.title}</div>;
                    })}
                </div>
            </Tooltip>}
            <div className={styles.concatTitle}>转场速度</div>
            <div className={styles.time}>
                {TRANSITIONS_DURATION.map(item => {
                    const durationCss = duration === item.value ? styles.checked : '';
                    return <div className={[durationCss, disabledCss].join(' ')} key={item.value}
                                onClick={() => this.handleChange('duration', item.value)}>
                        {item.title}
                    </div>;
                })}
            </div>
            <div className={styles.applyAllDiv}>
                <a className={styles.applyAll} onClick={this.apllyAllconcat}>应用到全部片段</a>
            </div>
            <div className={[styles.play, disabledCss].join(' ')}
                 onClick={haveTransitions ? (e) => this.openTransitions(e) : null}>
                <EIcon type="eqf-play"/>
            </div>
        </div>);
        return (
            <li
                key={uuid} className={active ? styles.active : ''}
                onClick={this.onClick}
                style={{ height }}
                onContextMenu={this.onRightClick}
            >
                <div
                    className={[styles.container, transverse ? '' : styles.verContainer].join(' ')}>
                    {!isHeadTail && <div className={styles.concat}>
                        <Popover
                            placement="left" title={null}
                            content={Concat} trigger={haveConcat ? 'click' : ''}
                            arrowPointAtCenter={true}
                            overlayClassName={styles.concatPopover}
                        >
                            <Tooltip placement="top" title={haveConcat ? '转场' : '低于1s的片段无法添加转场'}>
                                <img src={haveConcat ? (haveTransitions
                                    ? transitionImg
                                    : noTransitionImg)
                                    : noAllowTransition}/>
                            </Tooltip>
                        </Popover>
                    </div>}
                    {/*缩略图区域组件*/}
                    {isShow && this.getPartyPre()}
                </div>
                <Modal visible={transitionPreviewModal} onCancel={this.closeTransitions}>
                    {transitionPreviewGL ?
                        <TransitionPreview partyIndex={myIndex} type={concatType}
                                           duration={duration}/>
                        : <div className={styles.notice}>正在初始化转场预览...</div>
                    }
                </Modal>
            </li>
        );
    }
}

const SortUl = SortableContainer((props) => {
    const bodyRef = useRef();
    const [scrollHeight, setScrollHeight] = useState(0);
    useEffect(() => {
        function reSetScroll() {
            setScrollHeight(bodyRef.current.scrollTop);
        }

        if (bodyRef.current) {
            bodyRef.current.addEventListener('scroll', reSetScroll);
        }
        return () => {
            bodyRef.current.removeEventListener('scroll', reSetScroll);
        };
    }, []);
    const maxHeight = window.innerHeight - 220;
    const minConcatTime = MIN_CONCAT_TIME / 1000; // 有转场的话的最小时长
    const { head, list, isHeadTail, liProps, onChangeParty } = props;
    const { transverse } = liProps;
    const heightObj = LIST_HEIGHT[transverse ? 'hoz' : 'ver'];
    const minView = scrollHeight;
    const maxView = scrollHeight + maxHeight;
    const headHeight = heightObj.no;
    let totalHeight = headHeight;
    const childrenList = list.map((item, myIndex) => {
        const active = props.activeIndex === myIndex; // 是否激活
        const { renderSetting: { segmentPartyDuration } } = item;
        const { renderSetting: { segmentPartyDuration: prevSegmentPartyDuration = null } = {} } = props.list[myIndex -
        1] || {};
        const haveConcat = (myIndex > 0 // 不是第一个片段则需要上下两个片段
            && segmentPartyDuration >= minConcatTime
            && prevSegmentPartyDuration >= minConcatTime) ||
            (segmentPartyDuration >= minConcatTime && head.renderSetting && // 第一个片段则需要判断片头
                head.renderSetting.segmentPartyDuration >= minConcatTime);
        const height = heightObj[active ? 'active' : 'no'];
        const isShow = totalHeight >= (minView - heightObj.active) && (totalHeight + height) <= (maxView + heightObj.active);
        totalHeight += height;
        const newLiProps = {
            ...liProps,
            haveConcat,
            active,
            myIndex,
            height,
            isShow,
            ...item,
        };
        return {
            element: (<OneParty
                key={`${item.uuid}`}
                index={myIndex} {...newLiProps}
                onClick={() => onChangeParty(myIndex)}
            />),
            height,
        };
    });
    return (
        <ul
            ref={bodyRef}
            id={'partyListUl'}
            className={styles.partyUl}
            style={{ maxHeight }}
        >
            {!isHeadTail && <HeadOrTail key='head' type={'head'}/>}
            {childrenList.map(({ element }) => element)}
            {!isHeadTail && <HeadOrTail key='tail' type={'tail'} preParty={list[list.length - 1]}/>}
        </ul>
    );
});


/* global moment */

@connect(({ tags, editor, canvas, headAndTail }) => {
    const {
        head: { renderSetting: { segmentPartyDuration: headSegmentPartyDuration = 0 } = {} } = {},
        tail: { renderSetting: { segmentPartyDuration: tailSegmentPartyDuration = 0 } = {} } = {},
    } = headAndTail;
    const totalDuration = editor.parties.reduce((previousValue, item) => {
        return previousValue + (item.renderSetting && item.renderSetting.segmentPartyDuration || 4);
    }, headSegmentPartyDuration + tailSegmentPartyDuration);
    return ({
        tags,
        editor,
        canvas,
        head: headAndTail.head,
        totalDuration,
    });
})
class Segment extends React.Component {
    constructor(props) {
        super(props);
        this.sortUl = React.createRef();
    }

    state = {
        list: [],
        showDelete: false,
        activeIndex: 0,
        preIndex: 0,
        partiesVer: 0,
    };

    shouldComponentUpdate(nextProps, nextState) {
        if (!isEqual(nextState, this.state)) {
            return true;
        }
        if (contrast(this.props.editor, nextProps.editor,
            [
                'partiesVer',
                'nowIndex',
                'transverse',
                'parties.>renderSetting.segmentPartyDuration',
                'parties.>renderSetting.concatSet.duration',
                'parties.>renderSetting.concatSet.concatType',
            ])) {
            return true;
        }
        return false;
    }

    componentDidMount() {

    }

    static getDerivedStateFromProps(nextProps, prevState) {
        const newState = {};
        const { editor } = nextProps;
        if (editor.partiesVer !== prevState.partiesVer) {
            newState.list = editor.parties;
            newState.partiesVer = nextProps.partiesVer;
        }
        if (editor.nowIndex !== prevState.activeIndex) {
            newState.activeIndex = editor.nowIndex;
        }
        return newState;
    }

    componentWillUnmount() {

        // this.onSave();
    }

    componentDidCatch(e, s) {
        console.log(e);
        console.log(s);
    }


    onSave = () => {
        this.props.dispatch({
            type: 'editor/saveParties',
            payload: { list: this.state.list },
        });
    };
    /**
     * 关闭输入框
     */
    onClose = () => {
        this.setState({
            openModal: false,
            openPreviewModal: false,
        });
    };
    /**
     * 改变分段
     * @param index
     * @returns {boolean}
     */
    onChangeParty = (index) => {
        if (index === this.state.activeIndex) {
            return false;
        }
        this.setState({
            activeIndex: index,
        });
        this.props.dispatch({
            type: 'editor/changeParty',
            payload: { index },
        });
        this.onClose();
    };
    /**
     * 删除片段
     */
    onDelete = (index) => {
        this.setState({
            showDelete: true,
            activeIndex: index,
        });
    };
    didDelete = () => {
        const { activeIndex } = this.state;
        this.onCancelDelete();
        this.props.dispatch({
            type: 'editor/deleteParties',
            payload: { activeIndex },
        });
    };
    /**
     * 关闭删除片段的modal
     */
    onCancelDelete = () => {
        this.setState({ showDelete: false });
    };
    /**
     * 复制片段
     * @returns {boolean}
     */
    onCopy = (e, activeIndex) => {
        e.stopPropagation();
        e.preventDefault();
        this.setState({ activeIndex: activeIndex + 1 });
        const { list } = this.state;
        if (list.length >= MAX_PARTY_COUNT) {
            message.error(`最大只支持${MAX_PARTY_COUNT}个片段`);
            return false;
        }
        this.props.dispatch({
            type: 'editor/copyParties',
            payload: { activeIndex },
        });
    };
    onAddEmpty = () => {
        const { list } = this.state;
        if (list.length >= MAX_PARTY_COUNT) {
            message.error(`最大只支持${MAX_PARTY_COUNT}个片段`);
            return false;
        }
        this.props.dispatch({
            type: 'editor/addEmptyParty',
        });
    };
    onInsert = (id, type = 1) => {
        this.setState({ openModal: false });
        this.props.dispatch({
            type: 'editor/addParty',
            payload: {
                id,
                type,
            },
        });
    };
    /**
     * 重新排序
     * @param oldIndex 原索引
     * @param newIndex 新索引
     * @returns {boolean}
     */
    onSortEnd = ({ oldIndex, newIndex }) => {
        const { list } = this.state;
        if (newIndex < 0 || newIndex > list.length) {
            return false;
        }
        this.props.dispatch({
            type: 'editor/moveParties',
            payload: {
                oldIndex,
                newIndex,
            },
        });
        this.onChangeParty(newIndex);
    };
    /**
     * 改变片段的转场设置
     * @param partyIndex
     * @param key
     * @param value
     */
    onChangeConcatSet = (partyIndex, key, value) => {
        const { list } = this.state;
        if (!list[partyIndex]) {
            return;
        }
        const { renderSetting = { concatSet: {} } } = list[partyIndex];
        renderSetting.concatSet[key] = value || 0;
        list[partyIndex].renderSetting = renderSetting;
        this.props.dispatch({
            type: 'editor/saveParties',
            payload: { list },
        });
    };
    /**
     * 改变全部片段的转场设置
     * @param formIndex
     */
    onChangeAllConcatSet = (formIndex) => {
        const { list } = this.state;
        if (!list[formIndex]) {
            return;
        }
        const { renderSetting: { concatSet } = { concatSet: {} } } = list[formIndex];
        this.props.dispatch({
            type: 'editor/onChangeAllConcatSet',
            payload: { concatSet },
        });
    };
    // 绘制转场预览需要的片段数据
    drawPreview = (index, callback) => {
        const { list } = this.state;
        const { head } = this.props;
        if (index >= list.length || index < 0) {
            return;
        }
        const { uuid: preUUID, elementList: preElementList } = index === 0 ? head : list[index -
        1] || {};
        const { uuid, elementList } = list[index] || {};
        this.props.dispatch({
            type: 'canvas/drawParties',
            payload: {
                dataList: preElementList,
                uuid: preUUID,
            },
        })
            .then(() => {
                this.props.dispatch({
                    type: 'canvas/drawParties',
                    payload: {
                        dataList: elementList,
                        uuid,
                    },
                })
                    .then(callback);
            });
    };

    render() {
        const { props, state } = this;
        const { activeIndex, list } = state;
        const { props: { totalDuration } } = this;
        const { loadingObj } = props.canvas;
        const { transverse, product } = props.editor;
        const isHeadTail = product === EDITOR_PRODUCT.headTail;
        const totalDurationStr = moment(totalDuration * 1000 || 0)
            .format('mm:ss');
        const liProps = {
            transverse,
            loadingObj,
            drawPreview: this.drawPreview,
            dispatch: props.dispatch,
            onChangeConcatSet: this.onChangeConcatSet,
            onChangeAllConcatSet: this.onChangeAllConcatSet,
            onCopy: this.onCopy,
            onDelete: this.onDelete,
            isHeadTail,
        };
        const ulProps = {
            activeIndex,
            list,
            liProps,
            lockToContainerEdges: true,
            helperContainer: document.getElementById('partyListUl') || document.body,
            onChangeParty: this.onChangeParty,
            onSortEnd: this.onSortEnd,
            distance: 10,
            pressThreshold: 10,
            axis: 'y',
            lockAxis: 'y',
            helperClass: styles.sortingDiv,
            head: props.head,
            isHeadTail,
        };
        return (
            <React.Fragment>
                <div className={styles.totalTimeBox}>
                    视频总时长：{totalDurationStr}
                    <Tooltip
                        title={'视频总时长为所有片段时长之和'} arrowPointAtCenter={true}
                        placement={'topLeft'}
                    >
                        <Icon type='eqf-why-f' onClick={null}/>
                    </Tooltip>
                </div>
                <div className={styles.tempListDiv}>
                    <div className={styles.index}>{`${activeIndex + 1} / ${list.length}`}</div>
                    <SortUl {...ulProps} ref={this.sortUl}/>
                    <div className={styles.line}/>
                    <div className={styles.insertDiv}>
                        {!isHeadTail && <Button className={styles.insertButton}
                                                icon={'eqf-plus'}
                                                onClick={this.onAddEmpty}>添加片段</Button>}
                    </div>
                </div>
                <Modal visible={state.openModal} onCancel={this.onClose}>
                    <VideoStore onChange={this.onInsert}
                                onClose={this.onClose}
                                defualtIndex={1}
                                isHorz={props.editor.transverse ? 'hoz' : 'ver'}
                                tags={props.tags}
                                dispatch={props.dispatch}
                                prevTime={props.tags.prevTime}
                    />
                </Modal>
                <Modal visible={state.openPreviewModal} onCancel={this.onClose}>
                    <PreviewVideo visible={state.openPreviewModal} partyIndex={state.preIndex}/>
                </Modal>
                <DeleteModal
                    visible={state.showDelete}
                    onClose={this.onCancelDelete}
                    text={<React.Fragment>
                        删除片段后无法恢复，确定删除？
                    </React.Fragment>}
                    onDelete={this.didDelete}
                />
            </React.Fragment>
        );
    }
}

export default Segment;
