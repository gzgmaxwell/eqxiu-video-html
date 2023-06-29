import React from "react";
import { connect } from "dva";
import isEqual from "lodash/isEqual";
import styles from "./workspace.less";
import { genUrl } from "../../../util/image";
import {
    CANVAS_TYPE,
    WORKSPACE_MOVE_STEP,
    WORKSPACE_Z_INDEX,
    WorkspaceVideoType
} from "../../../config/staticParams";
import ResizeText, { needProperty as textNeed } from "./element/text";
import ResizeImg, { needProperty as imgNeed } from "./element/img";
import ResizeVideo, { needProperty as videoNeed } from "./element/video";
import MenuComponent from "../../components/menu";
import { isPressedAlt, isPressedCtrl } from '../../../util/event';
import Loading from "../../components/loading";
import GuideLine from "../../guideLine/guideLine";
import BoxToChoose from "../../components/boxToChoose";
import { contrast, isSetTimerEle } from "../../../util/data";
import Icon from "../../components/Icon";
import Modal from "../../components/modal";
import PreviewVideo from "../right/previewVideo";
import eventEmitter from "../../../services/EventListener";
import WorkspaceTips from "../../components/tips/workspaceTips";
import { genBackground } from "../../../services/editorData";
import { isMac } from "../../../util/util";
import { message } from "antd";
import { ANIMATION_TYPES } from "../../../dataBase/animations";
import { default as AnimationTypes } from "../../../dataBase/animeJsType";
import UserMarketElement from "./element/userMarket";
import { parseEffect } from "../../../services/animation";
import GridBox from "./grid";

// import ResizeComponentElemGroup from 'Components/resizeComponentElemGroup';

export function createElement(type) {
    if ([CANVAS_TYPE.text, CANVAS_TYPE.artFont, CANVAS_TYPE.animateFont].includes(type)) {
        return ResizeText;
    } else if ([CANVAS_TYPE.img, CANVAS_TYPE.animateImg].includes(type)) {
        return ResizeImg;
    } else if (WorkspaceVideoType.includes(type)) {
        return ResizeVideo;
    } else if ([CANVAS_TYPE.userMarket].includes(type)) {
        return UserMarketElement;
    } else {
        console.log("错误素材", type);
        return null;
    }
}

/**
 * 根据元素获取动画参数的方法
 */
const getAnimateData = (item, currentTime) => {
    const { animate = {}, renderSetting: { startTime = 0, endTime } = {} } = item;
    let animationName = undefined;
    let animationDuration = 0;
    let animationIteration = 1;
    const inAnimate = animate[ANIMATION_TYPES.ENTRANCE] || {};
    const stayAnimate = animate[ANIMATION_TYPES.STAY] || {};
    const outAnimate = animate[ANIMATION_TYPES.EXITS] || {};
    const totalDuation = endTime - startTime;
    let specialValue = `${totalDuation.toFixed(2)}`;
    const timeLineParams = [];
    if (inAnimate.animationName) {
        // 入场动画存在，并且在入场动画时间内
        animationName = inAnimate.animationName;
        animationDuration = inAnimate.animationDuration;
        animationIteration = inAnimate.animationIteration;
        specialValue += `|${animationName}:${animationDuration}`;
        timeLineParams.push({
            duration: animationDuration,
            ...parseEffect(AnimationTypes[animationName], animationDuration)
        });
    }
    if (stayAnimate.animationName) {
        // 强调动画存在，并且在强调动画时间内
        animationName = stayAnimate.animationName;
        animationDuration = stayAnimate.animationDuration;
        animationIteration = stayAnimate.animationIteration;
        specialValue += `|${animationName}:${animationDuration}`;
        timeLineParams.push({
            duration: animationDuration,
            delay: stayAnimate.delay || 0,
            ...parseEffect(AnimationTypes[animationName], animationDuration)
        });
    }
    if (outAnimate.animationName) {
        // 出场动画存在，并且在出场动画时间内
        animationName = outAnimate.animationName;
        animationDuration = outAnimate.animationDuration;
        animationIteration = outAnimate.animationIteration;
        specialValue += `|${animationName}:${animationDuration}`;
        timeLineParams.push({
            duration: animationDuration,
            offset: totalDuation * 1000 - animationDuration,
            ...parseEffect(AnimationTypes[animationName], animationDuration)
        });
    }
    return {
        animetionCurrent: currentTime - startTime,
        animationSpecialValue: specialValue,
        animetionTimeLineParams: timeLineParams,
        animetionTotalDuation: totalDuation * 1000
    };
};

/**
 * 公共的mapStateToProps方法
 */
export function initElementProps(...params) {
    const [{ workspace, subtitles, timeLine }, props] = params;
    const { uuid, isWork, initFunction } = props;
    if (typeof initFunction === "function") {
        return initFunction(...params);
    }
    const isSubTitle = !workspace && subtitles;
    const { dataList, activeIndex, activeIndexes = [], groupList = [] } = workspace || subtitles;
    let currentTime = 0;
    if (!isSubTitle && timeLine) {
        const { uuid: partyUUID } = workspace;
        const { currentTimes } = timeLine;
        currentTime = currentTimes[partyUUID] / 1000 || 0;
    }
    let index = null;
    const item =
        dataList.find((v, i) => {
            if (v.uuid === uuid) {
                index = i;
                return true;
            }
            return false;
        }) || {};
    const active =
        (isWork && (activeIndex === index || (activeIndexes && activeIndexes.includes(index)))) ||
        false;
    const paramsData = {
        width: item.width,
        height: item.height,
        rotate: item.rotate || 0,
        top: item.top || 0,
        left: item.left || 0,
        zIndex: WORKSPACE_Z_INDEX + index * 5 // 间隔5
    };
    const group = groupList.find(v => v.uuid === item.groupUuid) || {};
    const animationObj = getAnimateData(item, currentTime);
    const animationState = timeLine.playing ? "running" : "paused";
    const resizeprops = {
        ...props.resizeprops,
        paramsData,
        groupUuid: item.groupUuid,
        grouplock: `${group.lock || false}`,
        uuid,
        active,
        fixedaspectratio: item.resolutionW / item.resolutionH
    };
    return {
        ...item,
        resizeprops,
        currentTime,
        ...(animationObj || {}),
        animationState,
        playing: timeLine.playing
    };
}

@connect(({ editor, workspace, loading, timeLine }) => ({
    editor: {
        positionScale: editor.positionScale,
        transverse: editor.transverse
    },
    workspace,
    loading,
    timeLine,
    groupLength: workspace.groupList.length
}))
class WorkSpace extends React.Component {
    constructor(props) {
        super(props);
        this.body = React.createRef();
        this.background = React.createRef();
        this.overOut = true;
        // this.elemGroup = {
        //     activeGroup: false
        // };
        this.state = {
            changeResize: true,
            editorMenuOpen: false,
            menuOpen: false,
            menuX: 0,
            menuY: 0,
            grouping: false //已组合状态
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (!isEqual(this.state, nextState)) {
            return true;
        }
        const isDataChange = nextProps.workspace.dataList.find((item, index) => {
            const {
                workspace: { dataList }
            } = this.props;
            return item.uuid !== (dataList[index] || {}).uuid;
        });
        if (isDataChange) {
            return true;
        }
        if (
            contrast(this.props, nextProps, [
                // 'workspace.activeIndex',
                // 'workspace.activeIndexes.>',
                "editor.positionScale",
                "groupLength",
                "workspace.dataList.>renderSetting.startTime",
                "workspace.dataList.>renderSetting.endTime"
                // ...Object.keys(textNeed)
                //     .map(key => `workspace.dataList.>${key}`),
                // ...Object.keys(imgNeed)
                //     .map(key => `workspace.dataList.>${key}`),
                // ...Object.keys(videoNeed)
                //     .map(key => `workspace.dataList.>${key}`),
            ])
        ) {
            return true;
        }
        const backGround = this.props.workspace.dataList[0] || {};
        const nextBackGround = nextProps.workspace.dataList[0] || {};
        if (
            contrast(backGround, nextBackGround, [
                "backgroundImg",
                "backgroundColor",
                "videoBackgroundPicOpacity"
            ])
        ) {
            return true;
        }
        const {
            workspace: { uuid },
            timeLine: { currentTimes }
        } = this.props;
        const {
            workspace: { uuid: nextPartyUuid },
            timeLine: { currentTimes: nextCurrentTimes }
        } = nextProps;
        if (currentTimes[uuid] !== nextCurrentTimes[nextPartyUuid]) {
            return true;
        }
        if (this.props.workspace.dataList.length !== nextProps.workspace.dataList.length) {
            return true;
        }
        return false;
    }

    componentDidMount() {
        document.addEventListener("keydown", this.onKeyDown); // 键盘监听
        eventEmitter.on("saveWorkData", this.onActiveElement); // 在保存前失去焦点
        this.bindActiveLess();
        document.getElementById("previewBody").addEventListener("scroll", this.onChangeBody);
        if (this.background.current) {
        }
    }

    componentDidUpdate() {}

    componentDidCatch(e) {
        console.log(e);
    }

    componentWillUnmount() {
        document.removeEventListener("keydown", this.onKeyDown);
        eventEmitter.removeListener("saveWorkData", this.onActiveElement); // 取消监听
        this.removeActiveLess();
        document.getElementById("previewBody").removeEventListener("scroll", this.onChangeBody);
    }

    /**
     * 快捷键绑定
     * @param e
     */
    onKeyDown = e => {
        e.stopPropagation();
        const {
            onMoveElement,
            moveStart,
            props: { workspace: { dataList, activeIndex, activeIndexes, activeGroupIndex }
            }
        } = this;
        // 修复框选多个元素时键盘移动bug
        const newIndex =
            Array.isArray(activeIndex) && activeIndex.length > 1 ? activeIndex[0] : activeIndex;
        const data = dataList[newIndex] || {};
        const { left, top } = data;
        const { activeElement, body } = document;
        if ((e.keyCode === 8 || e.keyCode === 46) && activeElement === body) {
            // 删除事件
            this.deleteElement(e);
            this.dontAny(e);
        }
        const step = e.shiftKey ? WORKSPACE_MOVE_STEP * 10 : WORKSPACE_MOVE_STEP;
        if (e.keyCode === 37 && activeElement === body) {
            // 向左移动
            onMoveElement({ left: left - step }, newIndex, true);
            moveStart();
            e.preventDefault();
        }
        if (e.keyCode === 38 && activeElement === body) {
            // 向上移动
            onMoveElement({ top: top - step }, newIndex, true);
            moveStart();
            e.preventDefault();
        }
        if (e.keyCode === 39 && activeElement === body) {
            // 向右移动
            onMoveElement({ left: left + step }, newIndex, true);
            moveStart();
            e.preventDefault();
        }
        if (e.keyCode === 40 && activeElement === body) {
            // 向下移动
            onMoveElement({ top: top + step }, newIndex, true);
            moveStart();
            e.preventDefault();
        }
        if (e.keyCode === 70 && isPressedAlt(e) && activeElement === body && isPressedCtrl(e)) { // 元素适应画布：Command+Alt+F
            e.preventDefault();
            this.responsiveElements();
        }
        if (e.keyCode === 90 && activeElement === body && isPressedCtrl(e)) {
            // 撤销
            this.handleBack(true);
            e.preventDefault();
        }
        if (e.keyCode === 89 && activeElement === body && isPressedCtrl(e)) {
            // 恢复
            this.handleBack(false);
            e.preventDefault();
        }
        if (e.keyCode === 67 && activeElement === body && isPressedCtrl(e)) {
            // 复制
            this.handleCopy(e);
            e.preventDefault();
        }
        if (e.keyCode === 86 && activeElement === body && isPressedCtrl(e)) {
            // 粘贴
            this.handlePaste(e);
            e.preventDefault();
        }
        if (e.keyCode === 187 && activeElement === body && isPressedCtrl(e)) {
            // 放大
            this.handleScale(0.05);
            e.preventDefault();
            e.stopPropagation();
        }
        if (e.keyCode === 189 && activeElement === body && isPressedCtrl(e)) {
            // 缩小
            this.handleScale(-0.05);
            e.preventDefault();
            e.stopPropagation();
        }
        // if (e.keyCode === 71 && activeElement === body && isPressedCtrl(e)) {// 组合/取消组合
        //     this.handleGroup(e, activeGroupIndex);
        //     e.preventDefault();
        // }
    };

    onloaded = () => {
        this.props.dispatch({
            type: "editor/overLoading"
        });
    };
    onChangeElement = async (state, index, changeActive = true) => {
        const {
            dispatch,
            workspace: { dataList, activeIndex }
        } = this.props;
        if (changeActive && activeIndex !== index) {
            await this.props.dispatch({
                type: "workspace/changeActive",
                payload: {
                    index,
                    clear: false,
                    filter: false
                }
            });
        }
        dispatch({
            type: "workspace/changeNow",
            payload: {
                // ...dataList[index],
                ...state,
                _index: index
            }
        }).then(res => this.forceUpdate());
    };
    //改变组元素
    onChangeElementGroup = payload => {
        this.props
            .dispatch({
                type: "workspace/changeGroupStyles",
                payload: {
                    ...payload
                }
            })
            .then(res => this.forceUpdate());
    };
    //激活组元素
    onActiveElementGroup = (e, uuid) => {
        this.props
            .dispatch({
                type: "workspace/activeElemGroup",
                payload: {
                    activeGroupIndex: uuid,
                    clear: !isPressedCtrl(e),
                    filter: isPressedCtrl(e)
                }
            })
            .then(res => this.forceUpdate());
    };
    // 元素移动后计算移动的值
    onMoveElement = async (oldState, index, dontDraw = false) => {
        const state = { ...oldState };
        const {
            dispatch,
            workspace: { dataList, activeIndex }
        } = this.props;
        // 修复框选多个元素时键盘移动bug
        const newActiveIndex =
            Array.isArray(activeIndex) && activeIndex.length > 1 ? activeIndex[0] : activeIndex;
        const newIndex = index > -1 ? index : newActiveIndex;
        if (!dataList[newIndex]) {
            return false;
        }
        // 变化的值 = 变化后的值 - 初始值
        state.top = state.top !== undefined ? state.top - dataList[newIndex].top : 0;
        state.left = state.left !== undefined ? state.left - dataList[newIndex].left : 0;
        dispatch({
            type: "workspace/changeAllNow",
            payload: {
                ...state,
                dontDraw
            }
        }).then(res => this.forceUpdate());
    };

    onActiveElement = (e, index = null) => {
        if (e && e.button === 2) return;
        const { dataList, activeIndexes } = this.props.workspace;
        let activeElemGroupUuid = null;
        dataList.forEach((list, idx) => {
            if (activeIndexes.includes(idx) && list.groupUuid) {
                activeElemGroupUuid = list.groupUuid;
            }
        });
        //组合内元素禁用ctrl点击多选
        this.props.dispatch({
            type: "workspace/changeActive",
            payload: {
                index,
                clear: activeElemGroupUuid ? true : !isPressedCtrl(e),
                filter: activeElemGroupUuid ? true : isPressedCtrl(e)
            }
        });
        this.setState({ overOut: false });
    };

    onBeforeChangeActive = (callBack = null) => {
        this.props.dispatch({
            type: "workspace/changeCommon",
            payload: { beforeChangeActiveHook: callBack }
        });
    };
    onChangeBody = e => {
        this.setState({ changeResize: !this.state.changeResize });
    };
    /**
     * 多选框设置
     * @param {left:number,top:number,} boxCss
     **/
    setBoxSize = boxCss => {
        // 计算元素是否选中
        const {
            timeLine: { currentTimes }
        } = this.props;
        const { dataList, activeIndexes: oldIndexes, uuid } = this.props.workspace;
        const indexes = [];
        const currentTime = currentTimes[uuid] / 1000;
        dataList.map((item, index) => {
            if (item.type === CANVAS_TYPE.userMarket) return;
            const {
                renderSetting: { startTime, endTime }
            } = item;
            const isInCurrent = startTime <= currentTime && endTime >= currentTime;
            if (index > 0 && !item.lock && item.visibility !== "hidden" && isInCurrent) {
                const { left, top, width, height } = item;
                const centerX = left + width / 2;
                const centerY = top + height / 2;
                const boxRightX = boxCss.left + boxCss.width;
                const boxBottomY = boxCss.top + boxCss.height;
                if (
                    centerX > boxCss.left &&
                    centerX < boxRightX &&
                    centerY > boxCss.top &&
                    centerY < boxBottomY
                ) {
                    indexes.push(index);
                }
            }
        });
        if (isEqual(oldIndexes, indexes)) {
            return true;
        }
        this.props.dispatch({
            type: "workspace/boxActive",
            payload: indexes
        });
    };
    responsiveElements = () => {
        this.props.dispatch({
            type: "workspace/responsive",
            payload: {},
        });
    };
    openMenu = (e, index, isGroup = false) => {
        const {
            workspace: { activeIndexes, dataList, activeGroupIndex, groupList }
        } = this.props;
        this.dontAny(e);
        // 单元素复制多个/组合元素复制单个组
        if (activeIndexes.length > 0 || (isGroup && activeGroupIndex != null)) {
            this.setState({
                menuOpen: true,
                menuX: e.clientX,
                menuY: e.clientY
            });
            return;
        }
        if (!dataList[index].lock) {
            this.setState({
                menuOpen: true,
                menuX: e.clientX,
                menuY: e.clientY
            });
            this.removeActiveLess();
        }
    };
    openEditorMenu = e => {
        this.dontAny(e);
        this.setState({
            editorMenuOpen: true,
            menuX: e.clientX,
            menuY: e.clientY
        });
        // if (dataList && dataList.length || groupList && groupList.length) {
        //
        // }
    };
    closeMenu = e => {
        this.bindActiveLess();
        this.setState({ menuOpen: false });
    };
    closeEditorMenu = e => {
        this.bindActiveLess();
        this.setState({ editorMenuOpen: false });
    };
    deleteElement = e => {
        const {
            workspace: { activeIndexes, activeGroupIndex }
        } = this.props;
        //删除组
        if (activeGroupIndex != null) {
            this.props.dispatch({
                type: "workspace/deleteGroupElement"
            });
        }
        //删除单个元素
        if (activeIndexes.length > 0) {
            this.props.dispatch({
                type: "workspace/deleteElement"
            });
        }
        this.closeMenu(e);
    };
    changeLayer = (e, oriOldIndex, oriNewIndex) => {
        const {
            props: {
                workspace: { activeIndex, dataList }
            }
        } = this;
        let oldIndex = oriOldIndex;
        let newIndex = oriNewIndex;
        if (oldIndex === null) {
            oldIndex = activeIndex;
            if (newIndex === "top") {
                newIndex = dataList.length - 1;
            } else if (newIndex === "bottom") {
                newIndex = 1;
            } else {
                newIndex = oldIndex + newIndex;
            }
        }
        this.props.dispatch({
            type: "workspace/changeLayer",
            payload: {
                oldIndex,
                newIndex
            }
        });
    };
    /**
     * 置顶/置顶/上移/下移右键操作
     * @param type
     */
    handleLayer = (e, type) => {
        const {
            dispatch,
            workspace: { activeGroupIndex, groupList }
        } = this.props;
        // 组操作
        if (activeGroupIndex) {
            const group = groupList.find(v => v.uuid === activeGroupIndex) || {};
            const UUIDs = group.activeElems.map(v => v.uuid);
            dispatch({
                type: "workspace/changeManyLayer",
                payload: {
                    UUIDs,
                    type
                }
            });
        } else {
            // 元素操作
            dispatch({
                type: "workspace/changeManyLayer",
                payload: {
                    type
                }
            });
            // const _type = type === 'up' ? '1' : type === 'down' ? '-1' : type;
            // this.changeLayer(e, null, _type);
        }
    };
    topLayer = e => {
        this.changeLayer(e, null, "top");
    };
    bottomLayer = e => {
        this.changeLayer(e, null, "bottom");
    };
    upLayer = e => {
        this.changeLayer(e, null, 1);
    };
    downLayer = e => {
        this.changeLayer(e, null, -1);
    };

    mouseEntry = e => {
        this.overOut = false;
    };
    mouseLeave = e => {
        this.overOut = true;
    };
    dontAny = e => {
        e.stopPropagation();
        e.preventDefault();
    };

    // 移除取消选中事件
    removeActiveLess = () => {
        document.querySelector("#previewBody").removeEventListener("mousedown", this.activeLess);
    };
    // 绑定取消选中事件
    bindActiveLess = () => {
        document.querySelector("#previewBody").addEventListener("mousedown", this.activeLess);
    };
    activeVideo = e => {
        this.props.dispatch({
            type: "editor/triggerEvent",
            payload: "activeVideo"
        });
    };
    activeLess = e => {
        if (e.button === 2) return;
        const clickElement = (() => {
            return (
                e.target.className &&
                (e.target.className.includes("workspace__el") ||
                    e.target.className.includes("elements") ||
                    e.target.className.includes("resizeComponent__"))
            );
        })();
        if (!clickElement && document.activeElement === document.body && !isPressedCtrl(e)) {
            // 不在工作区
            this.props.dispatch({
                type: "workspace/changeActive",
                payload: { index: null }
            });
        }
    };
    handleBack = back => {
        this.props.dispatch({
            type: "workspace/changeHistory",
            back
        });
    };
    handleCopy = e => {
        this.closeMenu(e);
        this.props.dispatch({
            type: "workspace/copyData"
        });
    };
    handleScale = scale => {
        this.props.dispatch({
            type: "editor/changeScale",
            payload: { scale }
        });
    };
    handlePaste = e => {
        this.closeMenu(e);
        this.closeEditorMenu(e);
        this.props.dispatch({
            type: "workspace/pasteData"
        });
    };
    /**
     * 多个元素组合/单个组合取消组合
     * @param {*} groupUuid 组合uuid
     */
    handleGroup = (e, groupUuid) => {
        this.closeMenu(e);
        this.closeEditorMenu(e);
        const {
            workspace: { activeIndexes }
        } = this.props;
        if (groupUuid) {
            //取消当前组合
            this.props.dispatch({
                type: "workspace/cancelElemGroup",
                payload: {
                    groupUuid
                }
            });
            return;
        }
        if (activeIndexes.length < 2) return;
        this.props.dispatch({
            type: "workspace/addElemGroup",
            payload: {}
        });
    };
    /**
     * 键盘开始移动
     * 用来阻止重绘
     *
     **/
    moveStart = e => {
        document.addEventListener("keyup", this.moveEnd);
    };
    moveEnd = e => {
        const {
            props: {
                dispatch,
                workspace: { dataList, activeIndex }
            }
        } = this;
        const data = dataList[activeIndex] || {};
        document.removeEventListener("keyup", this.moveEnd);
        dispatch({
            type: "workspace/partyChange",
            payload: {
                uuid: [data.uuid],
                isMove: true
            }
        });
    };

    render() {
        const {
            props: {
                editor,
                workspace,
                loading: { effects }
            },
            state: { editorMenuOpen, menuOpen, menuX, menuY, ...state },
            onBeforeChangeActive,
            closeMenu,
            openMenu,
            closeEditorMenu
        } = this;
        const {
            workspace: { uuid, activeGroupIndex, activeIndexes, dataList, groupList },
            timeLine: { currentTimes }
        } = this.props;
        const currentTime = currentTimes[uuid] || 0;
        //是否有组激活
        // const groupActive = groupList.some(v => v.active);
        //组内单个元素右键显示组合快捷功能
        // let activeElemGroupUuid = null;
        // dataList.forEach((list, idx) => {
        //     if(activeIndexes.includes(idx) && list.groupUuid) {
        //         activeElemGroupUuid = list.groupUuid;
        //     }
        // });
        const layerLi = (
            <ul className={styles.layerUl}>
                <li onClick={e => this.handleLayer(e, "top")}>置顶</li>
                <li onClick={e => this.handleLayer(e, "bottom")}>置底</li>
                <li onClick={e => this.handleLayer(e, "up")}>上移</li>
                <li onClick={e => this.handleLayer(e, "down")}>下移</li>
            </ul>
        );
        const { transverse, positionScale } = editor;
        const bodyStyle = {
            // 外框的属性
            width: transverse ? 560 : 315,
            height: transverse ? 315 : 560,
            zIndex: 1,
            transform: `scale(${positionScale})`,
            transformOrigin: "center center",
            marginTop: transverse ? 0 : 72
        };
        const clearDefault = {
            // 清除默认事件
            onDrag: this.dontAny,
            draggable: false
        };
        const bodyposition = {
            x: (this.body.current && this.body.current.getBoundingClientRect().left) || 0,
            y: (this.body.current && this.body.current.getBoundingClientRect().top) || 0
        };
        let data = [
            {
                title: "复制",
                onClick: this.handleCopy,
                keyboard: `${isMac ? "⌘+C" : "Ctrl+C"}`
            },
            {
                title: "删除",
                isDelete: true,
                onClick: this.deleteElement,
                keyboard: `${isMac ? "Delete" : "Backspace"}`
            },
            {
                title: layerLi,
                noHover: true,
                type: "zIndex"
            }
        ];
        const {
            copyData: { dataList: copyDataList, groupList: copyGroupList } = {}
        } = this.props.workspace;
        const paste =
            (copyDataList && copyDataList.length) || (copyGroupList && copyGroupList.length)
                ? {
                      title: "粘贴",
                      onClick: this.handlePaste,
                      keyboard: `${isMac ? "⌘+V" : "Ctrl+V"}`
                  }
                : null;
        //组合
        // const gUuid = activeElemGroupUuid != null || activeGroupIndex != null;
        // const group = ( gUuid || activeIndexes.length > 1) ? {
        //     title: `${gUuid ? '取消组合' : '组合'}`,
        //     onClick: e => this.handleGroup(e, activeElemGroupUuid || activeGroupIndex),
        //     keyboard: `${isMac ? '⌘+G' : 'Ctrl+G'}`,
        //     type: 'group',
        // } : null;
        // if (workspace.copyData.length) {
        //     data.push(paste);
        // }
        if (workspace.activeIndexes.length > 1) {
            data.splice(1, 0);
        }
        //选中元素>=2时可组合
        // if (group && (activeElemGroupUuid || workspace.activeIndexes.length >= 2 || groupActive)) {
        //     data.unshift(group);
        // }
        const downloadFont = effects["workspace/downloadFont"];
        const backgroundEle = workspace.dataList[0] || {};
        const defaultBg = genBackground();
        const isEmpty =
            workspace.dataList.length === 1 &&
            defaultBg.backgroundImg === backgroundEle.backgroundImg &&
            defaultBg.backgroundColor === backgroundEle.backgroundColor;

        // const pasterMenu = [paste, group].filter(v => v);
        const pasterMenu = [paste].filter(v => v);
        return (
            <div
                className={styles.body}
                id='workspace'
                style={bodyStyle}
                ref={this.body}
                onChange={this.onChangeBody}
                onContextMenu={this.openEditorMenu}>
                {isEmpty && <WorkspaceTips />}
                <div className={styles.mask} />
                <GridBox />
                {workspace.isLoading && <Loading title='读取中' />}
                {Array.isArray(workspace.dataList) &&
                    workspace.dataList.map((item, index) => {
                        if (!item.type) {
                            const backgroundPicProps = {
                                // 背景图的props
                                src: genUrl(
                                    item.backgroundImg,
                                    `${bodyStyle.width}:${bodyStyle.height}`
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
                        const { renderSetting: { startTime, endTime } = {} } = item;
                        const Element = createElement(item.type);
                        if (
                            (isSetTimerEle(item) &&
                                (startTime * 1000 > currentTime || endTime * 1000 < currentTime)) ||
                            !Element
                        ) {
                            return null;
                        }

                        const resizeprops = {
                            // 缩放组件的props
                            positionScale,
                            limit: {
                                width: [10],
                                height: [10]
                            },
                            bodyposition,
                            // 数据改变后保存
                            onChange: (cState, changeActive = true) =>
                                this.onChangeElement(cState, index, changeActive),
                            onMoveElement: cState => this.onMoveElement(cState, index),
                            // 鼠标移入
                            onMouseEnter: this.mouseEntry,
                            // 鼠标移出
                            onMouseLeave: this.mouseLeave,
                            // 鼠标按下事件
                            onMouseDown: e => this.onActiveElement(e, index)
                            // beforeMove: active ? () => {} : (e) => this.onActiveElement(e, index),
                        };
                        const elementprops = {
                            ...clearDefault,
                            onLoad: this.onloaded,
                            onContextMenu: e => this.openMenu(e, index)
                            // onMouseOver: this.mouseEntry,
                            // onMouseLeave: this.mouseLeave,
                            // onContextMenu: (e) => this.openMenu(e, index),
                        };
                        const itemProps = {
                            resizeprops,
                            elementprops,
                            onKeyDown: this.onKeyDown,
                            uuid: item.uuid,
                            index,
                            onBeforeChangeActive,
                            isWork: true
                        };
                        const loading = workspace.activeIndex === index && downloadFont;
                        return (
                            <Element
                                key={`${item.uuid}-ele`}
                                {...itemProps}
                                type={item.type}
                                loading={loading}
                            />
                        );
                    })}
                <BoxToChoose positionScale={positionScale} setBoxSize={this.setBoxSize} />
                {/* <GuideLine /> */}
                <MenuComponent
                    visible={menuOpen}
                    close={closeMenu}
                    dataList={data}
                    menuY={menuY}
                    menuX={menuX}
                    style={{ width: 144 }}
                />
                <MenuComponent
                    visible={editorMenuOpen && pasterMenu.length > 0}
                    close={closeEditorMenu}
                    dataList={pasterMenu}
                    menuY={menuY}
                    menuX={menuX}
                    style={{ width: 144 }}
                />
                <Modal visible={state.openPreviewModal} onCancel={this.onCloseModal}>
                    <PreviewVideo visible={state.openPreviewModal} />
                </Modal>
            </div>
        );
    }
}

export default WorkSpace;
