import React from 'react';
import { connect } from 'dva';
import styles from './workspace.less';
import { genUrl } from '../../../util/image';
import {
    CANVAS_TYPE,
    WORKSPACE_MOVE_STEP,
    WORKSPACE_Z_INDEX,
    WorkspaceVideoType,
} from '../../../config/staticParams';
import ResizeText, { needProperty as textNeed } from '../../editor/centre/element/text';
import ResizeImg, { needProperty as imgNeed } from '../../editor/centre/element/img';
import ResizeVideo, { needProperty as videoNeed } from '../../editor/centre/element/video';
import MenuComponent from '../../components/menu';
import { isPressedCtrl } from '../../../util/event';
import Loading from '../../components/loading';
import GuideLine from '../../guideLine/guideLine';
import BoxToChoose from '../../components/boxToChoose';
import lodash from 'lodash';
import { contrast } from '../../../util/data';
import eventEmitter from '../../../services/EventListener';
import UserMarketElement from '../../editor/centre/element/userMarket';

function Element({ type, ...props }) {
    if (type === CANVAS_TYPE.text
        || type === CANVAS_TYPE.artFont
        || type === CANVAS_TYPE.animateFont) {
        return <ResizeText type={type} {...props} />;
    } else if ([CANVAS_TYPE.img, CANVAS_TYPE.animateImg].includes(type)) {
        return <ResizeImg {...props} />;
    } else if (WorkspaceVideoType.includes(type)) {
        return <ResizeVideo {...props} type={type}/>;
    } else if ([CANVAS_TYPE.userMarket].includes(type)) {
        return <UserMarketElement {...props} type={type}/>;
    } else {
        console.log('错误素材', type, props);
        return null;
    }
}

@connect(({ editor, workspace, loading, timeLine }) => ({
    editor,
    workspace,
    loading,
    timeLine,
}))
class WorkSpace extends React.Component {
    constructor(props) {
        super(props);
        this.body = React.createRef();
        this.background = React.createRef();
        this.overOut = true;
        this.state = {
            changeResize: true,
            editorMenuOpen: false,
            menuOpen: false,
            menuX: 0,
            menuY: 0,
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (!lodash.isEqual(this.state, nextState)) {
            return true;
        }
        if (contrast(this.props, nextProps, [
            'workspace.activeIndex',
            'workspace.activeIndexes.>',
            'editor.positionScale',
            'workspace.dataList.>visibility',
            ...Object.keys(textNeed)
                .map(key => `workspace.dataList.>${key}`),
            ...Object.keys(imgNeed)
                .map(key => `workspace.dataList.>${key}`),
            ...Object.keys(videoNeed)
                .map(key => `workspace.dataList.>${key}`),
        ])) {
            return true;
        }
        const backGround = this.props.workspace.dataList[0] || {};
        const nextBackGround = nextProps.workspace.dataList[0] || {};
        if (contrast(backGround, nextBackGround, [
            'backgroundImg',
            'backgroundColor',
            'videoBackgroundPicOpacity',
        ])) {
            return true;
        }
        const { workspace: { uuid }, timeLine: { currentTimes } } = this.props;
        const { workspace: { uuid: nextPartyUuid }, timeLine: { currentTimes: nextCurrentTimes } } = nextProps;
        if (currentTimes[uuid] !== nextCurrentTimes[nextPartyUuid]) {
            return true;
        }
        if (this.props.workspace.dataList.length !== nextProps.workspace.dataList.length) {
            return false;
        }
        return false;
    }

    componentDidMount() {
        document.addEventListener('keydown', this.onKeyDown); // 键盘监听
        eventEmitter.on('saveWorkData', this.onActiveElement); // 在保存前失去焦点
        this.bindActiveLess();
        document.getElementById('previewBody')
            .addEventListener('scroll', this.onChangeBody);
        if (this.background.current) {
            this.onSaveELement(this.background.current, 0);
        }
    }

    componentDidUpdate() {
        if (this.background.current) {
            this.onSaveELement(this.background.current, 0);
        }
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.onKeyDown);
        eventEmitter.removeListener('saveWorkData', this.onActiveElement); // 取消监听
        this.removeActiveLess();
        document.getElementById('previewBody')
            .removeEventListener('scroll', this.onChangeBody);
    }

    /**
     * 快捷键绑定
     * @param e
     */
    onKeyDown = (e) => {
        e.stopPropagation();
        const { onMoveElement, moveStart, props: { workspace: { dataList, activeIndex } } } = this;

        const data = dataList[activeIndex] || {};
        const { left, top } = data;
        const { activeElement, body } = document;
        if ((e.keyCode === 8 || e.keyCode === 46) && activeElement === body) { // 删除事件
            this.deleteElement(e);
            this.dontAny(e);
        }
        const step = e.shiftKey ? WORKSPACE_MOVE_STEP * 10 : WORKSPACE_MOVE_STEP;
        if (e.keyCode === 37 && activeElement === body) { // 向左移动
            onMoveElement({ left: left - step }, activeIndex, true);
            moveStart();
            e.preventDefault();
        }
        if (e.keyCode === 38 && activeElement === body) { // 向上移动
            onMoveElement({ top: top - step }, activeIndex, true);
            moveStart();
            e.preventDefault();
        }
        if (e.keyCode === 39 && activeElement === body) { // 向右移动
            onMoveElement({ left: left + step }, activeIndex, true);
            moveStart();
            e.preventDefault();
        }
        if (e.keyCode === 40 && activeElement === body) { // 向下移动
            onMoveElement({ top: top + step }, activeIndex, true);
            moveStart();
            e.preventDefault();
        }
        if (e.keyCode === 90 && activeElement === body && isPressedCtrl(e)) { // 撤销
            this.handleBack(true);
            e.preventDefault();
        }
        if (e.keyCode === 89 && activeElement === body && isPressedCtrl(e)) { // 恢复
            this.handleBack(false);
            e.preventDefault();
        }
        if (e.keyCode === 67 && activeElement === body && isPressedCtrl(e)) {// 复制
            this.handleCopy(e);
            e.preventDefault();
        }
        if (e.keyCode === 86 && activeElement === body && isPressedCtrl(e)) {// 粘贴
            this.handlePaste(e);
            e.preventDefault();
        }
        if (e.keyCode === 187 && activeElement === body && isPressedCtrl(e)) {// 放大
            this.handleScale(0.05);
            e.preventDefault();
            e.stopPropagation();
        }
        if (e.keyCode === 189 && activeElement === body && isPressedCtrl(e)) {// 缩小
            this.handleScale(-0.05);
            e.preventDefault();
            e.stopPropagation();
        }
    };


    onloaded = () => {
        this.props.dispatch({
            type: 'editor/overLoading',
        });
    };
    onSaveELement = (element, index) => {
    };
    onChangeElement = async (state, index, changeActive = true) => {
        const { dispatch, workspace: { dataList, activeIndex } } = this.props;
        if (changeActive && activeIndex !== index) {
            await this.props.dispatch({
                type: 'workspace/changeActive',
                payload: {
                    index,
                    clear: false,
                    filter: false,
                },
            });
        }
        dispatch({
            type: 'workspace/changeNow',
            payload: {
                ...dataList[index],
                ...state,
                _index: index,
            },
        })
            .then(res => this.forceUpdate());
    };
    // 元素移动后计算移动的值
    onMoveElement = async (oldState, index, dontDraw = false) => {
        const state = { ...oldState };
        const { dispatch, workspace: { dataList, activeIndex } } = this.props;
        const newIndex = index > -1 ? index : activeIndex;
        if (!dataList[newIndex]) {
            return false;
        }
        // 变化的值 = 变化后的值 - 初始值
        state.top = state.top !== undefined ? state.top - dataList[newIndex].top : 0;
        state.left = state.left !== undefined ? state.left - dataList[newIndex].left : 0;
        dispatch({
            type: 'workspace/changeAllNow',
            payload: {
                ...state,
                dontDraw,
            },
        })
            .then(res => this.forceUpdate());
    };

    onActiveElement = (e, index = null) => {
        this.props.dispatch({
            type: 'workspace/changeActive',
            payload: {
                index,
                clear: !isPressedCtrl(e),
                filter: isPressedCtrl(e),
            },
        });
        this.setState({ overOut: false });
    };

    onBeforeChangeActive = (callBack = null) => {
        this.props.dispatch({
            type: 'workspace/changeCommon',
            payload: { beforeChangeActiveHook: callBack },
        });
    };
    onChangeBody = (e) => {
        this.setState({ changeResize: !this.state.changeResize });
    };

    /**
     * 多选框设置
     * @param {left:number,top:number,} boxCss
     **/
    setBoxSize = (boxCss) => {
        // 计算元素是否选中
        const { dataList } = this.props.workspace;
        const indexes = [];
        dataList.map((item, index) => {
            if (index > 0 && !item.lock && item.visibility !== 'hidden') {
                const { left, top, width, height } = item;
                const centerX = left + width / 2;
                const centerY = top + height / 2;
                const boxRightX = boxCss.left + boxCss.width;
                const boxBottomY = boxCss.top + boxCss.height;
                if (centerX > boxCss.left && centerX < boxRightX && centerY > boxCss.top &&
                    centerY < boxBottomY) {
                    indexes.push(index);
                }
            }
        });
        this.props.dispatch({
            type: 'workspace/boxActive',
            payload: indexes,
        });
    };

    openMenu = (e, index) => {
        this.dontAny(e);
        if (this.props.workspace.activeIndexes.length > 0) { // 复制多个
            this.setState({
                menuOpen: true,
                menuX: e.clientX,
                menuY: e.clientY,
            });
            return;
        }
        if (!this.props.workspace.dataList[index].lock) {
            this.setState({
                menuOpen: true,
                menuX: e.clientX,
                menuY: e.clientY,
            });
            this.removeActiveLess();
        }
    };
    openEditorMenu = (e) => {
        this.dontAny(e);
        const { copyData: { dataList, groupList } = {} } = this.props.workspace;
        if (dataList && dataList.length || groupList && groupList.length) {
            this.setState({
                editorMenuOpen: true,
                menuX: e.clientX,
                menuY: e.clientY,
            });
        }
    };
    closeMenu = (e) => {
        this.bindActiveLess();
        this.setState({ menuOpen: false });
    };
    closeEditorMenu = (e) => {
        this.bindActiveLess();
        this.setState({ editorMenuOpen: false });
    };
    deleteElement = (e) => {
        if (this.props.workspace.activeIndexes.length < 1) return;
        this.props.dispatch({
            type: 'workspace/deleteElement',
        });
        this.closeMenu(e);
    };
    changeLayer = (e, oriOldIndex, oriNewIndex) => {
        const { props: { workspace: { activeIndex, dataList } } } = this;
        let oldIndex = oriOldIndex;
        let newIndex = oriNewIndex;
        if (oldIndex === null) {
            oldIndex = activeIndex;
            if (newIndex === 'top') {
                newIndex = dataList.length - 1;
            } else if (newIndex === 'bottom') {
                newIndex = 1;
            } else {
                newIndex = oldIndex + newIndex;
            }
        }
        this.props.dispatch({
            type: 'workspace/changeLayer',
            payload: {
                oldIndex,
                newIndex,
            },
        });
    };
    topLayer = (e) => {
        this.changeLayer(e, null, 'top');
    };
    bottomLayer = (e) => {
        this.changeLayer(e, null, 'bottom');
    };
    upLayer = (e) => {
        this.changeLayer(e, null, 1);
    };
    downLayer = (e) => {
        this.changeLayer(e, null, -1);
    };

    mouseEntry = (e) => {
        this.overOut = false;
    };
    mouseLeave = (e) => {
        this.overOut = true;
    };
    dontAny = (e) => {
        e.stopPropagation();
        e.preventDefault();
    };

    // 移除取消选中事件
    removeActiveLess = () => {
        document.querySelector('#previewBody')
            .removeEventListener('mousedown', this.activeLess);
    };
    // 绑定取消选中事件
    bindActiveLess = () => {
        document.querySelector('#previewBody')
            .addEventListener('mousedown', this.activeLess);
    };
    activeVideo = (e) => {
        this.props.dispatch({
            type: 'editor/triggerEvent',
            payload: 'activeVideo',
        });
    };
    activeLess = (e) => {
        if (this.overOut && document.activeElement === document.body && !isPressedCtrl(e)) {// 不在工作区
            this.props.dispatch({
                type: 'workspace/changeActive',
                payload: { index: null },
            });
        }
    };
    handleBack = (back) => {
        this.props.dispatch({
            type: 'workspace/changeHistory',
            back,
        });
    };
    handleCopy = (e) => {
        this.closeMenu(e);
        this.props.dispatch({
            type: 'workspace/copyData',
        });
    };
    handleScale = (scale) => {
        this.props.dispatch({
            type: 'editor/changeScale',
            payload: { scale },
        });
    };
    handlePaste = (e) => {
        this.closeMenu(e);
        this.closeEditorMenu(e);
        this.props.dispatch({
            type: 'workspace/pasteData',
        });
    };
    /**
     * 键盘开始移动
     * 用来阻止重绘
     *
     **/
    moveStart = (e) => {
        document.addEventListener('keyup', this.moveEnd);
    };
    moveEnd = (e) => {
        const { props: { dispatch, workspace: { dataList, activeIndex } } } = this;
        const data = dataList[activeIndex] || {};
        document.removeEventListener('keyup', this.moveEnd);
        dispatch({
            type: 'workspace/partyChange',
            payload: {
                uuid: [data.uuid],
                isMove: true,
            },
        });
    };

    render() {
        const {
            props: { editor, workspace, loading: { effects } },
            state: { editorMenuOpen, menuOpen, menuX, menuY, ...state },
            onBeforeChangeActive, closeMenu, openMenu, closeEditorMenu,
        } = this;
        const { workspace: { uuid }, timeLine: { currentTimes } } = this.props;
        const layerLi = <ul className={styles.layerUl}>
            <li onClick={this.topLayer}>置顶</li>
            <li onClick={this.bottomLayer}>置底</li>
            <li onClick={this.upLayer}>上移</li>
            <li onClick={this.downLayer}>下移</li>
        </ul>;
        const { transverse } = editor;
        const positionScale =  0.7;
        const bodyStyle = { // 外框的属性 transverse positionScale
            width: transverse ? 560 : 315,
            height: transverse ? 315 : 560,
            zIndex: 1,
            transform: `scale(${positionScale})`,
            transformOrigin: 'center center',
        };
        const clearDefault = { // 清除默认事件
            onDrag: this.dontAny,
            draggable: false,
        };
        const paste = {
            title: '粘贴',
            onClick: this.handlePaste,
        };
        const bodyposition = {
            x: this.body.current &&
                this.body.current.getBoundingClientRect().left || 0,
            y: this.body.current &&
                this.body.current.getBoundingClientRect().top || 0,
        };
        const data = [
            {
                title: '删除',
                isDelete: true,
                onClick: this.deleteElement,
            },
            {
                title: '复制',
                onClick: this.handleCopy,
            },
            {
                title: layerLi,
                noHover: true,
            },
        ];
        const { copyData: { dataList, groupList } = {} } = workspace;
        if (dataList && dataList.length || groupList && groupList.length) {
            data.push(paste);
        }
        if (workspace.activeIndexes.length > 1) {
            data.splice(2, 2);
        }
        const downloadFont = effects['workspace/downloadFont'];

        return (
            <div className={styles.body} id='workspace' style={bodyStyle} ref={this.body}
                 onChange={this.onChangeBody}
                 onContextMenu={this.openEditorMenu}>
                <div className={styles.mask}/>
                {workspace.isLoading && <Loading title='读取中'/>}
                {Array.isArray(workspace.dataList) && workspace.dataList.map((item, index) => {
                    const { renderSetting: { startTime, endTime } = {} } = item;
                    if (item.type === undefined) {
                        const backgroundPicProps = { // 背景图的props
                            src: genUrl(item.backgroundImg,
                                `${bodyStyle.width}:${bodyStyle.height}`),
                            style: { opacity: item.videoBackgroundPicOpacity },
                        };
                        return <div ref={this.background} key={'background'}
                                    style={{ backgroundColor: item.backgroundColor }}
                                    className={styles.background}>
                            {item.backgroundImg ? <img {...clearDefault} {...backgroundPicProps}
                                                       className={styles.videoBackgroundPic}
                            /> : ''}
                        </div>;
                    }
                    const active = (workspace.activeIndexes.includes(index));
                    const resizeprops = { // 缩放组件的props
                        active,
                        positionScale,
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
                        bodyposition,
                        fixedaspectratio: item.resolutionW / item.resolutionH,
                        // 数据改变后保存
                        onChange: (state, changeActive = true) => this.onChangeElement(state, index,
                            changeActive),
                        onMoveElement: (state) => this.onMoveElement(state, index),
                        // 鼠标移入
                        onMouseOver: this.mouseEntry,
                        // 鼠标移出
                        onMouseLeave: this.mouseLeave,
                        // 鼠标按下事件
                        onMouseDown: (e) => this.onActiveElement(e, index),
                        // beforeMove: active ? () => {} : (e) => this.onActiveElement(e, index),
                        onContextMenu: (e) => this.openMenu(e, index),
                    };
                    const elementprops = {
                        ...clearDefault,
                        onLoad: this.onloaded,
                        onMouseOver: this.mouseEntry,
                        onMouseLeave: this.mouseLeave,
                        onContextMenu: (e) => this.openMenu(e, index),
                    };
                    const itemProps = {
                        resizeprops,
                        elementprops,
                        onKeyDown: this.onKeyDown,
                        ...item,
                        index,
                        onBeforeChangeActive,
                        onSaveELements: (e) => this.onSaveELement(e, index),
                        isWork: true,
                    };
                    const loading = workspace.activeIndex === index && downloadFont;
                    return <Element key={`${item.uuid}-ele`} {...itemProps} loading={loading}/>;
                })
                }
                <BoxToChoose positionScale={positionScale} setBoxSize={this.setBoxSize}/>
                <GuideLine/>
                <MenuComponent visible={menuOpen} close={closeMenu} dataList={data} menuY={menuY}
                               menuX={menuX} style={{ width: 144 }}/>
                <MenuComponent visible={editorMenuOpen} close={closeEditorMenu} dataList={[paste]}
                               menuY={menuY} menuX={menuX} style={{ width: 144 }}/>
            </div>
        );
    }
}

export default WorkSpace;
