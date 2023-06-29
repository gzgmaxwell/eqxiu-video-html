import React from "react";
import { connect } from "dva";
import styles from "./LeftParty.less";
import EIcon from "Components/Icon";
import { Tooltip } from "antd";
import { SortableContainer, SortableElement } from "react-sortable-hoc";
import {
    CANVAS_TYPE,
    LEFT_PARTY_SIZE,
    MIN_CONCAT_TIME,
    WORKSPACE_SIZE,
    WORKSPACE_Z_INDEX,
    WorkspaceVideoType
} from "../../config/staticParams";
import { genUrl } from "../../util/image";
import { TRANSITIONS, TRANSITIONS_DURATION } from "../../dataBase/transitions";
import Loading from "../components/loading";
import ResizeText from "../editor/centre/element/text";
import ResizeVideo from "../editor/centre/element/video";
import ResizeImg from "../editor/centre/element/img";
import { isEqual } from "lodash";
import { contrast } from "../../util/data";

function Element({ type, ...props }) {
    if (
        type === CANVAS_TYPE.text ||
        type === CANVAS_TYPE.artFont ||
        type === CANVAS_TYPE.animateFont
    ) {
        return <ResizeText type={type} {...props} />;
    } else if ([CANVAS_TYPE.img, CANVAS_TYPE.animateImg].includes(type)) {
        return <ResizeImg {...props} />;
    } else if (WorkspaceVideoType.includes(type)) {
        return <ResizeVideo {...props} type={type} />;
    } else {
        console.log("错误素材", type, props);
        return null;
    }
}
const clearDefault = {
    // 清除默认事件
    draggable: false
};

function initElementProps(...params) {
    const [{ editor }, props] = params;
    const { uuid, myIndex } = props;
    const { elementList: dataList } = editor.parties[myIndex];
    let index = null;
    const item =
        dataList.find((v, i) => {
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
        zIndex: WORKSPACE_Z_INDEX + index * 5 // 间隔5
    };
    const resizeprops = {
        ...props.resizeprops,
        paramsData,
        groupUuid: item.groupUuid,
        active,
        fixedaspectratio: item.resolutionW / item.resolutionH
    };
    return {
        ...item,
        resizeprops
    };
}

@SortableElement
class OneParty extends React.Component {
    constructor(props) {
        super(props);
        this.input = React.createRef();
    }

    componentDidCatch(e, s) {
        console.log(e);
        console.log(s);
    }

    state = {
        transitionPreview: false
    };
    onClick = e => {
        this.props.onClick();
    };
    handleChange = (key, value) => {
        const { myIndex, onChangeConcatSet } = this.props;
        onChangeConcatSet(myIndex, key, value);
        if (key === "concatType" && value !== "none") {
            onChangeConcatSet(
                myIndex,
                "duration",
                (TRANSITIONS[value] || {}).defaultDuration || 800
            );
        }
    };
    openTransitions = e => {
        const { myIndex } = this.props;
        this.setState({ transitionPreviewModal: true });
        setTimeout(() => {
            this.props.drawPreview(myIndex, () => this.setState({ transitionPreviewGL: true }));
        }, 100);
    };
    concatTypes = [
        ...Object.values(TRANSITIONS).map(v => ({
            title: v.cname,
            value: v.value
        }))
    ];
    getPartyPre = () => {
        const { props } = this;
        const {
            loadingObj,
            uuid,
            transverse,
            playSpeed,
            onCopy,
            onDelete,
            myIndex,
            active
        } = props;
        const drawing = loadingObj[uuid] || false;
        // 判断横竖版缩略图的宽高
        const width = transverse ? LEFT_PARTY_SIZE.l : LEFT_PARTY_SIZE.s;
        const height = transverse ? LEFT_PARTY_SIZE.s : LEFT_PARTY_SIZE.l;
        const activeWidth = transverse ? LEFT_PARTY_SIZE.activeL : LEFT_PARTY_SIZE.activeS;
        const activeHeight = transverse ? LEFT_PARTY_SIZE.activeS : LEFT_PARTY_SIZE.activeL;
        const proWidth = transverse ? WORKSPACE_SIZE.l : WORKSPACE_SIZE.s;
        const proHeight = transverse ? WORKSPACE_SIZE.s : WORKSPACE_SIZE.l;
        const scale = width / proWidth;
        const activeScale = activeWidth / proWidth;
        return (
            <div className={styles.partyPre}>
                <div className={styles.canvas}>
                    <Loading
                        loading={drawing}
                        title={"生成片段图层..."}
                        isAbsolute={true}
                        delay={2000}
                    />
                    <div
                        key={uuid}
                        style={{
                            width: active ? activeWidth : width,
                            height: active ? activeHeight : height,
                            transform: `scale(${active ? activeScale : scale})`,
                            transformOrigin: "top left"
                        }}>
                        <div
                            style={{
                                width: proWidth,
                                height: proHeight
                            }}
                            className={styles.partyLi}>
                            {Array.isArray(props.elementList) &&
                                props.elementList.map((item, index) => {
                                    if (!item.type) {
                                        const backgroundPicProps = {
                                            // 背景图的props
                                            src: genUrl(
                                                item.backgroundImg,
                                                `${proWidth}:${proHeight}:png:3`
                                            ),
                                            style: { opacity: item.videoBackgroundPicOpacity }
                                        };
                                        return (
                                            <div
                                                ref={this.background}
                                                key={"background"}
                                                style={{ backgroundColor: item.backgroundColor }}
                                                className={styles.background}>
                                                {item.backgroundImg ? (
                                                    <img
                                                        {...clearDefault}
                                                        {...backgroundPicProps}
                                                        className={styles.videoBackgroundPic}
                                                    />
                                                ) : (
                                                    ""
                                                )}
                                            </div>
                                        );
                                    }
                                    const resizeprops = {
                                        // 缩放组件的props
                                        active: false,
                                        paramsData: {
                                            width: item.width,
                                            height: item.height,
                                            rotate: item.rotate || 0,
                                            top: item.top || 0,
                                            left: item.left || 0,
                                            zIndex: WORKSPACE_Z_INDEX + index * 5 // 间隔5
                                        },
                                        limit: {
                                            width: [10],
                                            height: [10]
                                        },
                                        fixedaspectratio: item.resolutionW / item.resolutionH
                                    };
                                    const itemProps = {
                                        resizeprops,
                                        elementprops: clearDefault,
                                        ...item,
                                        index,
                                        myIndex,
                                        initFunction: initElementProps,
                                    };
                                    return <Element key={`${item.uuid}-ele`} {...itemProps} />;
                                })}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    render() {
        const {
            props,
            state: { transitionPreviewModal, transitionPreviewGL }
        } = this;
        const { transverse, id, active, renderSetting = {}, haveConcat } = props;
        const { concatSet } = renderSetting;
        const { duration = 400, concatType = "none" } = concatSet || {};
        // 片段的序号和转场图标
        const haveTransitions = concatType && concatType !== "none"; // 是否有转场
        // 转场设置区域
        const disabledCss = haveTransitions ? "" : styles.disabled;
        const Concat = (
            <div className={styles.selectContainer}>
                <div className={styles.concatTitle}>转场动画</div>
                {haveConcat ? (
                    <div className={styles.typesContainer}>
                        {this.concatTypes.map(item => {
                            const checked = concatType === item.value ? styles.checked : "";
                            return (
                                <div
                                    className={checked}
                                    key={item.value}
                                    onClick={() => this.handleChange("concatType", item.value)}>
                                    {item.title}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <Tooltip placement='top' title='前后片段时长均不能小于1秒'>
                        <div className={styles.typesContainer}>
                            {this.concatTypes.map(item => {
                                return (
                                    <div className={styles.disabled} key={item.value}>
                                        {item.title}
                                    </div>
                                );
                            })}
                        </div>
                    </Tooltip>
                )}
                <div className={styles.concatTitle}>转场速度</div>
                <div className={styles.time}>
                    {TRANSITIONS_DURATION.map(item => {
                        const durationCss = duration === item.value ? styles.checked : "";
                        return (
                            <div
                                className={[durationCss, disabledCss].join(" ")}
                                key={item.value}
                                onClick={() => this.handleChange("duration", item.value)}>
                                {item.title}
                            </div>
                        );
                    })}
                </div>
                <div
                    className={[styles.play, disabledCss].join(" ")}
                    onClick={haveTransitions ? e => this.openTransitions(e) : null}>
                    <EIcon type='eqf-play' />
                </div>
            </div>
        );
        return (
            <li
                key={id}
                className={active ? styles.active : ""}
                onClick={this.onClick}
                onContextMenu={this.onRightClick}>
                <div
                    className={[styles.container, transverse ? "" : styles.verContainer].join(" ")}>
                    {/*缩略图区域组件*/}
                    {this.getPartyPre()}
                </div>
            </li>
        );
    }
}

@SortableContainer
class SortUl extends React.Component {
    render() {
        const { props } = this;
        const maxHeight = window.innerHeight - 140;
        const minConcatTime = MIN_CONCAT_TIME / 1000; // 有转场的话的最小时长
        return (
            <ul id={"partyListUl"} className={styles.partyUl} style={{ maxHeight }}>
                {props.list.map((item, myIndex) => {
                    const active = props.activeIndex === myIndex; // 是否激活
                    const {
                        renderSetting: { segmentPartyDuration }
                    } = item;
                    const {
                        renderSetting: {
                            segmentPartyDuration: prevSegmentPartyDuration = null
                        } = {}
                    } = props.list[myIndex - 1] || {};
                    const haveConcat =
                        myIndex > 0 &&
                        segmentPartyDuration >= minConcatTime &&
                        prevSegmentPartyDuration >= minConcatTime;
                    const newLiProps = {
                        ...props.liProps,
                        haveConcat,
                        active,
                        myIndex,
                        ...item
                    };
                    return (
                        <OneParty
                            key={`${item.uuid}`}
                            index={myIndex}
                            {...newLiProps}
                            onClick={() => props.onChangeParty(myIndex)}
                        />
                    );
                })}
            </ul>
        );
    }
}

// 存放滚动高度
let ulscrollTop = 0;

@connect(({ tags, editor, canvas }) => ({
    tags,
    editor,
    canvas
}))
class Segment extends React.Component {
    constructor(props) {
        super(props);
        this.sortUl = React.createRef();
    }

    state = {
        list: [],
        activeIndex: 0,
        preIndex: 0,
        partiesVer: 0
    };

    shouldComponentUpdate(nextProps, nextState) {
        if (!isEqual(nextState, this.state)) {
            return true;
        }
        if (
            contrast(this.props.editor, nextProps.editor, [
                "partiesVer",
                "nowIndex",
                "transverse",
                "parties.>renderSetting.segmentPartyDuration",
                "parties.>renderSetting.concatSet.duration",
                "parties.>renderSetting.concatSet.concatType"
            ])
        ) {
            return true;
        }
        return false;
    }

    componentDidMount() {
        if (document.getElementById("partyListUl")) {
            document.getElementById("partyListUl").scrollTop = ulscrollTop;
        }
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
        ulscrollTop = document.getElementById("partyListUl").scrollTop;
        this.onSave();
    }

    componentDidCatch(e, s) {
        console.log(e);
        console.log(s);
    }

    onSave = () => {
        this.props.dispatch({
            type: "editor/saveParties",
            payload: { list: this.state.list }
        });
    };
    /**
     * 关闭输入框
     */
    onClose = () => {
        this.setState({
            openModal: false,
            openPreviewModal: false
        });
    };
    /**
     * 改变分段
     * @param index
     * @returns {boolean}
     */
    onChangeParty = index => {
        if (index === this.state.activeIndex) {
            return false;
        }
        this.setState({
            activeIndex: index
        });
        this.props.dispatch({
            type: "editor/changeParty",
            payload: { index }
        });
        this.onClose();
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
            type: "editor/moveParties",
            payload: {
                oldIndex,
                newIndex
            }
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
            type: "editor/saveParties",
            payload: { list }
        });
    };
    // 绘制转场预览需要的片段数据
    drawPreview = (index, callback) => {
        const { list } = this.state;
        if (index >= list.length || index - 1 < 0) {
            return;
        }
        const { uuid: preUUID, elementList: preElementList } = list[index - 1] || {};
        const { uuid, elementList } = list[index] || {};
        this.props
            .dispatch({
                type: "canvas/drawParties",
                payload: {
                    dataList: preElementList,
                    uuid: preUUID
                }
            })
            .then(() => {
                this.props
                    .dispatch({
                        type: "canvas/drawParties",
                        payload: {
                            dataList: elementList,
                            uuid
                        }
                    })
                    .then(callback);
            });
    };

    render() {
        const { props, state } = this;
        const { activeIndex, list } = state;
        const { loadingObj } = props.canvas;
        const { transverse } = props.editor;
        const liProps = {
            transverse,
            loadingObj,
            drawPreview: this.drawPreview,
            dispatch: props.dispatch,
            onChangeConcatSet: this.onChangeConcatSet
        };
        const ulProps = {
            activeIndex,
            list,
            liProps,
            lockToContainerEdges: true,
            helperContainer: document.getElementById("partyListUl") || document.body,
            onChangeParty: this.onChangeParty,
            onSortEnd: this.onSortEnd,
            distance: 10,
            pressThreshold: 10,
            axis: "y",
            lockAxis: "y",
            helperClass: styles.sortingDiv
        };
        return (
            <React.Fragment>
                <div className={styles.tempListDiv}>
                    <div className={styles.index}>{`${activeIndex + 1} / ${list.length}`}</div>
                    <SortUl {...ulProps} ref={this.sortUl} />
                </div>
            </React.Fragment>
        );
    }
}

export default Segment;
