import React from 'react';
import { connect } from 'dva';
import styles from './center.less';
import {
    SUBTITLES_H,
    SUBTITLES_TRANSVERSE_W, SUBTITLES_W,
    WORKSPACE_MOVE_STEP,
    WORKSPACE_Z_INDEX,
} from '../../../../config/staticParams';
import ResizeText from '../../../editor/centre/element/text';
import { isPressedCtrl } from '../../../../util/event';
import Loading from '../../../components/loading';
import eventEmitter from '../../../../services/EventListener';

@connect(({ subtitles, loading }) => ({
    subtitles,
    loading,
}))
class Index extends React.Component {
    constructor(props) {
        super(props);
        this.body = React.createRef();
        this.activeText = null;
        this.overOut = true;
        this.state = {
            changeResize: true,
            overOut: true,
        };
    }

    componentDidMount() {
        document.addEventListener('keydown', this.listenerKeyDown); // 键盘监听
        this.bindActiveLess();
        eventEmitter.on('saveWorkData', this.onActiveElement); // 在保存前失去焦点
        eventEmitter.on('inputText', this.inputText); // 在保存前失去焦点
        document.getElementById('previewBody')
            .addEventListener('scroll', this.onChangeBody);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.listenerKeyDown);
        eventEmitter.removeListener('saveWorkData', this.onActiveElement); // 取消监听
        eventEmitter.removeListener('inputText', this.inputText);
        document.getElementById('previewBody')
            .removeEventListener('scroll', this.onChangeBody);
        this.removeActiveLess();
    }

    listenerKeyDown = (e) => {
        this.onKeyDown(e, this.props.uuid);
    };
    onKeyDown = (e) => {
        e.stopPropagation();
        const { onMoveElement, props: { subtitles: { dataList } } } = this;
        const uuid = this.props.uuid;
        const data = dataList[uuid] || {};
        const { left, top } = data;
        const { activeElement, body } = document;
        if ((e.keyCode === 8 || e.keyCode === 46) && activeElement === body) { // 删除事件
            this.deleteElement(e);
            this.dontAny(e);
        }
        const step = e.shiftKey ? WORKSPACE_MOVE_STEP * 10 : WORKSPACE_MOVE_STEP;
        if (e.keyCode === 37 && activeElement === body) { // 向左移动
            onMoveElement({ left: left - step });
            e.preventDefault();
        }
        if (e.keyCode === 38 && activeElement === body) { // 向上移动
            onMoveElement({ top: top - step });
            e.preventDefault();
        }
        if (e.keyCode === 39 && activeElement === body) { // 向右移动
            onMoveElement({ left: left + step });
            e.preventDefault();
        }
        if (e.keyCode === 40 && activeElement === body) { // 向下移动
            onMoveElement({ top: top + step });
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
    };
    handleBack = (back) => {
        this.props.dispatch({
            type: 'subtitles/changeHistory',
            back,
        });
    };
    onloaded = () => {
        this.props.dispatch({
            type: 'subtitles/overLoading',
        });
    };
    onChangeElement = async (state) => {
        const { dispatch, subtitles: { dataList }, uuid } = this.props;
        dispatch({
            type: 'subtitles/changeNow',
            payload: {
                ...dataList[uuid],
                ...state,
            },
        });
    };
    // 元素移动后计算移动的值
    onMoveElement = async (state) => {
        const { dispatch, uuid } = this.props;
        dispatch({
            type: 'subtitles/changeNow',
            payload: {
                ...state,
                uuid,
            },
        });
    };
    bindActiveText = (obj) => {
        this.activeText = obj;
    };
    onActiveElement = (e) => {
        if (this.state.uuid !== this.props.uuid) {
            this.setState({
                overOut: false,
                uuid: this.props.uuid,
            });
        }
    };
    onChangeBody = (e) => {
        this.setState({ changeResize: !this.state.changeResize });
    };
    // 绑定取消选中事件
    bindActiveLess = () => {
        document.querySelector('#previewBody')
            .addEventListener('mousedown', this.activeLess);
    };
    // 移除取消选中事件
    removeActiveLess = () => {
        document.querySelector('#previewBody')
            .removeEventListener('mousedown', this.activeLess);
    };
    activeLess = (e) => {
        if (this.overOut && document.activeElement === document.body && !isPressedCtrl(e)) {// 不在工作区
            this.setState({ uuid: null });
        }
    };
    dontAny = (e) => {
        e.stopPropagation();
        e.preventDefault();
    };
    mouseEntry = (e) => {
        this.overOut = false;
    };
    mouseLeave = (e) => {
        this.overOut = true;
    };
    deleteElement = (e) => {
        this.props.dispatch({
            type: 'subtitles/deleteElement',
            payload: {
                uuid: this.props.uuid,
            },
        });
    };

    onBeforeChangeActive = (callBack = null) => {
        this.props.dispatch({
            type: 'subtitles/save',
            payload: { beforeChangeActiveHook: callBack },
        });
    };
    inputText = () => {
        if (this.activeText) {
            this.activeText.showInput();
        }
    };

    render() {
        const { props: { subtitles, loading: { effects }, uuid, children, active = true }, state, onBeforeChangeActive } = this;
        const { transverse, dataList, positionScale } = subtitles;
        const bodyStyle = { // 外框的属性
            width: transverse ? SUBTITLES_TRANSVERSE_W : SUBTITLES_W,
            height: SUBTITLES_H,
            zIndex: 1,
            transform: `scale(${positionScale})`,
            top: 2,
            transformOrigin: 'top',
        };
        const clearDefault = { // 清除默认事件
            onDrag: this.dontAny,
            draggable: false,
        };
        const bodyposition = {
            x: this.body.current &&
                this.body.current.getBoundingClientRect().left || 0,
            y: this.body.current &&
                this.body.current.getBoundingClientRect().top || 0,
        };
        const downloadFont = effects['subtitles/downloadFont'];
        const item = dataList[uuid] || {};
        const resizeprops = { // 缩放组件的props
            active,
            paramsData: {
                width: item.width,
                height: item.height,
                rotate: item.rotate || 0,
                top: item.top || 0,
                left: item.left || 0,
                zIndex: WORKSPACE_Z_INDEX, // 间隔5
            },
            limit: {
                width: [10],
                height: [10],
            },
            positionScale,
            bodyposition,
            fixedaspectratio: item.resolutionW / item.resolutionH,
            // 数据改变后保存
            onChange: (state) => this.onChangeElement(state),
            onMoveElement: (state) => this.onMoveElement(state),
            // 鼠标移入
            onMouseOver: this.mouseEntry,
            // 鼠标移出
            onMouseLeave: this.mouseLeave,
            // 鼠标按下事件
            onMouseDown: (e) => this.onActiveElement(e),
            // beforeMove: active ? () => {} : (e) => this.onActiveElement(e, index),
            onContextMenu: null,
        };
        const elementprops = {
            ...clearDefault,
            onLoad: this.onloaded,
            onMouseOver: this.mouseEntry,
            onMouseLeave: this.mouseLeave,
            onContextMenu: null,
        };
        const itemProps = {
            resizeprops,
            elementprops,
            onKeyDown: this.onKeyDown,
            ...item,
            index: uuid,
            autoWidth: true,
            onBeforeChangeActive,
        };
        return (
            <div className={styles.body} id='subtitles' style={bodyStyle} ref={this.body}
                 onChange={this.onChangeBody}
            >
                {/*<div className={styles.mask}/>*/}
                {/*{subtitles.isLoading && <Loading title='读取中'/>}*/}
                {children}
                {dataList[uuid] &&
                <ResizeText key={`${uuid}-ele`} onRef={this.bindActiveText} {...itemProps}
                            initFunction={() => ({ ...itemProps })}
                            loading={downloadFont}/>}
            </div>
        );
    }
}

export default Index;
