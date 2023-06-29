import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'dva';
// @ts-ignore
import styles from './resizeComponent.less';
import Icon from './Icon';
import eventEmitter from '../../services/EventListener';
import { isPressedCtrl } from 'Util/event';

/**
 * 得到旋转角度
 * @param center
 * @param movePoint
 * @returns {number}
 */
function setAngle(center, movePoint) {
    const ox = movePoint.x - center.x;
    const oy = movePoint.y - center.y;
    const to = Math.abs(ox / oy);
    let angle = Math.atan(to) / (2 * Math.PI) * 360;
    if (ox > 0 && oy < 0) { // 右上角，1象限
        // angle = 360 + angle
    } else if (ox >= 0 && oy > 0) { // 右下角，4象限，>=可解决180度时反转的问题
        angle = 180 - angle;
    } else if (ox < 0 && oy > 0) { // 左下角，3象限
        angle = 180 + angle;
    } else if (ox < 0 && oy <= 0) { // 左上角，2象限 <=解决270度反转的问题
        angle = 360 - angle;
    }
    return Math.floor(angle);
}

// 判断是否南北或者东西
const nsOrEw = (str) => {
    if (['N', 'S'].includes(str)) {
        return 'NS';
    }
    return 'EW';
};
// 对应函数
const homologousArray = {
    width: 'left',
    height: 'top',
};

const attrList = ['width', 'height', 'top', 'left', 'rotate', 'zIndex'];

@connect(({ workspace: { dataList, groupList, activeGroupIndex } }, { uuid }) => {
    const group = {
        ...groupList.find(v => v.uuid === uuid),
    };
    // const elementsUUID = group.activeElems.map(v => v.uuid);
    // const elements = elementsUUID.map(
    //     uuid => {
    //         const dom = document.querySelector(`#workspace #elements_${uuid}`);
    //         return dom && dom.getBoundingClientRect() || false;
    //     })
    //     .filter(v => v);
    // const { max, min } = Math;
    const size = {
        // width: max(...elements.map(v => v.right)) - min(...elements.map(v => v.left)) / 1.1,
        // height: max(...elements.map(v => v.bottom)) - min(...elements.map(v => v.top)) / 1.1,
        // left: min(...elements.map(v => v.x)) / 1.1,
        // top: min(...elements.map(v => v.y)) / 1.1,
    };

    return {
        ...group,
        ...size,
        activeGroupIndex,
    };
})

class ResizeComponentElemGroup extends React.Component {
    constructor(props) {
        super(props);
        this.moveBox = React.createRef();
        this.outSliderBox = React.createRef();
        this.fabricCanvas = null;
        this.aspectRatio = null;
    }

    state = {
        width: 100,
        height: 100,
        top: 0,
        left: 0,
        rotate: 0,
        clickPosition: {
            x: 0,
            y: 0,
        },
        center: null,
        paramsData: null,
        down: false, // 鼠标按下
    };

    limitState = {};

    upFunc = () => null;

    moveFunc = () => null;

    static getDerivedStateFromProps(nextProps, prevState) {
        let newState = {};
        const { down } = prevState;
        if (down) return null;
        attrList.forEach(value => {
            if (nextProps[value] !== undefined && nextProps[value] !==
                prevState[value]) {
                newState[value] = nextProps[value];
            }
        });
        return newState;
    }

    componentDidMount() {
        const { active } = this.props;
        /**
         * 用于处理其他移动
         * 如果激活了就绑定好
         */
        if (active) {
            eventEmitter.addListener('changeValue', this.changeValue);
            eventEmitter.addListener('mouseup', this.cancelDown);
        }
    }

    componentDidUpdate(prevProps, prevState) {
        // this.limitState = {};
        const { active } = this.props;
        /**
         * 用于处理其他移动
         * 如果激活了就绑定好
         */
        if (active && !prevProps.active) {
            eventEmitter.addListener('changeValue', this.changeValue);
            eventEmitter.addListener('mouseup', this.cancelDown);
        } else if (prevProps.active && !active) {
            eventEmitter.removeListener('changeValue', this.changeValue);
            eventEmitter.removeListener('mouseup', this.cancelDown);
        }
    }

    componentWillUnmount() {
        eventEmitter.removeListener('changeValue', this.changeValue);
        eventEmitter.removeListener('mouseup', this.cancelDown);
        this.cancelMove();
    }

    cancelDown = () => {
        this.setState({ down: false });
    };

    changeValue = (data) => {
        if (this.props.active) {
            const newState = {};
            newState.top = Number(this.state.top) + Number(data.top || 0);
            newState.left = Number(this.state.left) + Number(data.left || 0);
            let limitState = this.limitHandler(newState);
            limitState = this.aspectRatioHandler(limitState);
            limitState = this.ratioHandler(limitState);
            this.setState({
                ...limitState,
                down: true,
            });
            this.limitState = limitState;
        }
    };

    // 取消选中事件
    selectstart = (e) => {
        e.preventDefault();
        e.preventDefault();
    };
    // 公共改变事件 方便以后提升到model里面
    onCommondChange = (newState, isMove, isRotate = false) => {
        let limitState = newState;
        this.isRotate = isRotate;
        if (!isRotate) {
            limitState = this.limitHandler(limitState);
            limitState = this.aspectRatioHandler(limitState);
        }
        limitState = this.ratioHandler(limitState);
        if (isMove) {
            const changeValue = {};
            changeValue.top = limitState.top ? Number(limitState.top) - Number(this.state.top) : 0;
            changeValue.left = limitState.left
                ? Number(limitState.left) - Number(this.state.left)
                : 0;
            eventEmitter.emit('changeValue', changeValue);

        } else {
            this.setState(limitState);
            this.limitState = limitState;
        }
    };
    /**
     * 角度控制 在45的倍数的时候设置忽视角度
     * @param {Object} nextState
     * @param ignore 忽视角度
     */
    ratioHandler = (nextState, ignore = 6) => {
        const newState = nextState;
        if (this.state.rotate % 45 === 0 &&
            (Math.abs(newState.rotate - this.state.rotate) < ignore)) {
            newState.rotate = this.state.rotate;
        }
        return newState;
    };

    // 比例限制器
    aspectRatioHandler = (nextState) => {
        const newState = nextState;
        if (this.aspectRatio) {
            if (newState.width) {
                newState.height = newState.width / this.aspectRatio;
            } else if (newState.height) {
                newState.width = newState.height * this.aspectRatio;
            }
        }
        return newState;
    };

    // 父组件限制器
    limitHandler = (newState) => {
        const result = newState;
        if (this.props.limit) {
            Object.keys(this.props.limit)
                .forEach((key) => {
                    const limit = this.props.limit[key];
                    if ((limit[0] !== null || limit[0] !== undefined) && limit[0] >=
                        newState[key]) {
                        // eslint-disable-next-line prefer-destructuring
                        result[key] = limit[0];
                        if (homologousArray[key] && result[homologousArray[key]]) {
                            result[homologousArray[key]] =
                                this.state.paramsData[homologousArray[key]] +
                                this.state.paramsData[key] - result[key];
                        }
                    } else if ((limit[1] !== null || limit[1] !== undefined) && limit[1] <=
                        newState[key]) {
                        // eslint-disable-next-line prefer-destructuring
                        result[key] = limit[1];
                        if (homologousArray[key] && result[homologousArray[key]]) {
                            this.state.paramsData[homologousArray[key]] +
                            this.state.paramsData[key] - result[key];
                        }
                    }
                });
        }
        return result;
    };

    changeStyles = (payload) => {
        this.props.dispatch({
            type: 'workspace/changeGroupStyles',
            payload: payload,
        });
    };

    // 旋转的方法
    onChangeRotate = (e) => {
        const { state: { center, top, left }, props: { bodyposition: { x, y } } } = this;
        if (!e.pageX || !e.pageY) return;
        const { positionScale = 1, uuid } = this.props;
        const movePoint = {
            x: e.pageX / positionScale - x / positionScale,
            y: e.pageY / positionScale - y / positionScale,
            t: 'point',
        };

        // 计算角度 如果等于360则置0
        let angle = setAngle(center, movePoint);
        angle = angle === 360 ? 0 : angle;
        this.onCommondChange({ rotate: angle }, false, true);

        this.changeStyles({
            uuid,
            rotate: angle,
            top,
            left,
            isRotate: true,
        });
    };
    // 改变位置的方法
    onChangePosition = (e) => {
        const { pageX, pageY } = e;
        if (!pageX || !pageY) return;
        const { positionScale = 1 } = this.props;
        const { x, y } = this.state.clickPosition;
        const newPosition = {
            top: pageY / positionScale - y,
            left: pageX / positionScale - x,
        };
        this.onCommondChange(newPosition, true);
    };
    aspectRelation = { // 方向映射 在旋转90度后方向切换
        N: 'N',
        S: 'S',
        E: 'E',
        W: 'W',
        NW: 'NW',
        NE: 'NE',
        SE: 'SE',
        SW: 'SW',
    };


    // 开始移动
    startMove = (e) => {
        const { positionScale = 1 } = this.props;
        if (e.button !== 0) return false; // 如果不是左键则不管
        const {
            props: {
                banMove = false, beforeMove = () => {
                },
            },
        } = this;
        if (banMove) return;
        if (beforeMove(e) === false) return;
        e.stopPropagation();
        e.target.classList.add('moving');
        const { offsetTop, offsetLeft } = this.moveBox.current;
        const clickPosition = {
            x: e.pageX / positionScale - offsetLeft,
            y: e.pageY / positionScale - offsetTop,
        };
        this.setState({ clickPosition });
        this.commonBind(this.onChangePosition);
    };
    // 开始旋转
    startRotate = (e) => {
        if (e.button !== 0) return false; // 如果不是左键则不管
        this.cancelMove(e);
        e.stopPropagation();
        e.preventDefault();
        const { state: { left, top, width, height, padding = 0 } } = this;
        const center = {
            x: left + width / 2,
            y: top + height / 2 + padding,
            t: 'centre',
        };
        this.setState({ center });
        // todo: 求旋转中心点 可以更好的解耦 不再需要外框的位置

        this.commonBind(this.onChangeRotate);
    };
    startMoveBar = (e, bar) => {
        // 缩放开始
        e.preventDefault();
        e.stopPropagation();
        const {
            state: { height, width, top, left, rotate }, aspectRelation,
            props: {
                beforeresize, bodyposition, positionScale = 1, activeGroupIndex,
            },
            changeStyles,
        } = this;
        if (typeof beforeresize === 'function') {
            beforeresize(e);
        }

        const ex = e.pageX / positionScale;
        const ey = e.pageY / positionScale;
        // 计算初始状态旋转后的rect
        const transformedRect = this.transform({
            x: left + bodyposition.x / positionScale,
            y: top + bodyposition.y / positionScale,
            width,
            height,
        }, rotate);
        // 取得旋转后的8点坐标
        const { point } = transformedRect;
        // 获取当前点和对角线点
        const pointAndOpposite = this.getPointAndOpposite(point, ex, ey);
        const { opposite } = pointAndOpposite;

        // 对角线点的索引即为缩放基点索引
        const baseIndex = opposite.index;
        const oppositeX = opposite.point.x;
        const oppositeY = opposite.point.y;

        // 鼠标释放点距离当前点对角线点的偏移量
        const offsetWidth = Math.abs(ex - oppositeX);
        const offsetHeight = Math.abs(ey - oppositeY);

        // 记录最原始的状态
        const oPoint = {
            x: left + bodyposition.x / positionScale,
            y: top + bodyposition.y / positionScale,
            width,
            height,
            rotate,
        };
        const moveBar = (e) => {
            const nex = e.pageX / positionScale;
            const ney = e.pageY / positionScale;

            const scale = {
                x: 1,
                y: 1,
            };
            let realScale = 1;

            // 判断是根据x方向的偏移量来计算缩放比还是y方向的来计算
            if (offsetWidth > offsetHeight) {
                realScale = Math.abs(nex - oppositeX) / offsetWidth;
            } else {
                realScale = Math.abs(ney - oppositeY) / offsetHeight;
            }

            if ([0, 2, 4, 6].indexOf(baseIndex) >= 0) {
                scale.y = realScale;
                scale.x = scale.y;
            } else if ([1, 5].indexOf(baseIndex) >= 0) {
                scale.y = realScale;
            } else if ([3, 7].indexOf(baseIndex) >= 0) {
                scale.x = realScale;
            }

            const newRect = this.getNewRect(oPoint, scale, transformedRect, baseIndex);
            const newRectCss = {
                height: newRect.height,
                width: newRect.width,
                top: newRect.y - bodyposition.y / positionScale,
                left: newRect.x - bodyposition.x / positionScale,
            };
            this.onCommondChange(newRectCss);
            changeStyles({
                uuid: activeGroupIndex,
                ...newRectCss,
                rotate,
                isScale: true,
            });
        };
        this.commonBind(moveBar);
    };

    /**
     * 取得鼠标释放点在rect8点坐标中的对应点及其对角线点
     * @param  {[type]} point [description]
     * @param  {[type]} ex    [description]
     * @param  {[type]} ey    [description]
     */
    getPointAndOpposite = (point, ex, ey) => {
        let oppositePoint = {};
        let currentPoint = {};

        let minDelta = 1000;
        let currentIndex = 0;
        let oppositeIndex = 0;

        point.forEach((p, index) => {
            const delta = Math.sqrt(Math.pow(p.x - ex, 2) + Math.pow(p.y - ey, 2));
            if (delta < minDelta) {
                currentPoint = p;
                currentIndex = index;
                minDelta = delta;
                // 对角线点index相差4
                let offset = 4;
                let oIndex = index - offset;
                if (oIndex < 0) {
                    oIndex = index + offset;
                }
                // 取对角线点坐标
                oppositePoint = point.slice(oIndex, oIndex + 1)[0];
                oppositeIndex = oIndex;
            }
        });

        return {
            current: {
                index: currentIndex,
                point: currentPoint,
            },
            opposite: {
                index: oppositeIndex,
                point: oppositePoint,
            },
        };
    };
    /**
     * 根据缩放基点和缩放比例取得新的rect
     * @param  {Object} oPoint               [description]
     * @param  {[type]} scale            [description]
     * @param  {Object} oTransformedRect [description]
     * @param  {[type]} baseIndex        [description]
     * @return {[type]}                  [description]
     */
    getNewRect = (oPoint, scale, oTransformedRect, baseIndex) => {
        const scaledRect = this.getScaledRect({
            x: oPoint.x,
            y: oPoint.y,
            width: oPoint.width,
            height: oPoint.height,
            scale,
        });
        const transformedRotateRect = this.transform(scaledRect, oPoint.rotate);
        // 计算到平移后的新坐标
        const translatedX = oTransformedRect.point[baseIndex].x -
            transformedRotateRect.point[baseIndex].x + transformedRotateRect.left;
        const translatedY = oTransformedRect.point[baseIndex].y -
            transformedRotateRect.point[baseIndex].y + transformedRotateRect.top;

        // 计算平移后元素左上角的坐标
        const newX = translatedX + transformedRotateRect.width / 2 - scaledRect.width / 2;
        const newY = translatedY + transformedRotateRect.height / 2 - scaledRect.height / 2;

        // 缩放后元素的高宽
        const newWidth = scaledRect.width;
        const newHeight = scaledRect.height;

        return {
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
        };
    };
    /**
     * 获取旋转指定角度后的rect
     * @param  {[type]} options rect
     * @param  {[type]} angle   旋转角度
     * @return {[type]}
     */
    transform = (options, angle) => {
        const {
            x, y, width, height,
        } = options;

        const { pow } = Math;
        const r = Math.sqrt(pow(width, 2) + pow(height, 2)) / 2;
        const a = Math.round(Math.atan(height / width) * 180 / Math.PI);
        const tlbra = 180 - angle - a;
        const trbla = a - angle;
        const ta = 90 - angle;
        const ra = angle;

        let halfWidth = width / 2;
        let halfHeight = height / 2;

        let middleX = x + halfWidth;
        let middleY = y + halfHeight;

        let topLeft = {
            x: middleX + r * Math.cos(tlbra * Math.PI / 180),
            y: middleY - r * Math.sin(tlbra * Math.PI / 180),
        };
        let top = {
            x: middleX + halfHeight * Math.cos(ta * Math.PI / 180),
            y: middleY - halfHeight * Math.sin(ta * Math.PI / 180),
        };
        let topRight = {
            x: middleX + r * Math.cos(trbla * Math.PI / 180),
            y: middleY - r * Math.sin(trbla * Math.PI / 180),
        };
        let right = {
            x: middleX + halfWidth * Math.cos(ra * Math.PI / 180),
            y: middleY + halfWidth * Math.sin(ra * Math.PI / 180),
        };
        let bottomRight = {
            x: middleX - r * Math.cos(tlbra * Math.PI / 180),
            y: middleY + r * Math.sin(tlbra * Math.PI / 180),
        };
        let bottom = {
            x: middleX - halfHeight * Math.sin(ra * Math.PI / 180),
            y: middleY + halfHeight * Math.cos(ra * Math.PI / 180),
        };
        let bottomLeft = {
            x: middleX - r * Math.cos(trbla * Math.PI / 180),
            y: middleY + r * Math.sin(trbla * Math.PI / 180),
        };
        let left = {
            x: middleX - halfWidth * Math.cos(ra * Math.PI / 180),
            y: middleY - halfWidth * Math.sin(ra * Math.PI / 180),
        };
        let minX = Math.min(topLeft.x, topRight.x, bottomRight.x, bottomLeft.x);
        let maxX = Math.max(topLeft.x, topRight.x, bottomRight.x, bottomLeft.x);
        let minY = Math.min(topLeft.y, topRight.y, bottomRight.y, bottomLeft.y);
        let maxY = Math.max(topLeft.y, topRight.y, bottomRight.y, bottomLeft.y);
        return {
            point: [topLeft, top, topRight, right, bottomRight, bottom, bottomLeft, left],
            width: maxX - minX,
            height: maxY - minY,
            left: minX,
            right: maxX,
            top: minY,
            bottom: maxY,
        };
    };
    /**
     * 取得缩放指定倍数后的坐标
     * @param  {[type]} params    rect
     * @param  {[type]} baseIndex 基点索引
     */
    getScaledRect = (params, baseIndex) => {
        let { x, y, width, height, scale } = params;
        let offset = {
            x: 0,
            y: 0,
        };
        let deltaXScale = scale.x - 1;
        let deltaYScale = scale.y - 1;
        let deltaWidth = width * deltaXScale;
        let deltaHeight = height * deltaYScale;
        let newWidth = width + deltaWidth;
        let newHeight = height + deltaHeight;
        let newX = x - deltaWidth / 2;
        let newY = y - deltaHeight / 2;
        if (baseIndex) {
            let points = [
                {
                    x,
                    y,
                }, {
                    x: x + width,
                    y,
                }, {
                    x: x + width,
                    y: y + height,
                }, {
                    x,
                    y: y + height,
                }];
            let newPoints = [
                {
                    x: newX,
                    y: newY,
                }, {
                    x: newX + newWidth,
                    y: newY,
                }, {
                    x: newX + newWidth,
                    y: newY + newHeight,
                }, {
                    x: newX,
                    y: newY + newHeight,
                }];
            offset.x = points[baseIndex].x - newPoints[baseIndex].x;
            offset.y = points[baseIndex].y - newPoints[baseIndex].y;
        }
        return {
            x: newX + offset.x,
            y: newY + offset.y,
            width: newWidth,
            height: newHeight,
        };
    };

    /**
     *公共绑定事件
     * @param {function} func
     */
    commonBind = (func) => {
        // 如果有 则不能再重复绑定
        if (this.state.down) return;
        const { otherStyle = {}, onMoveElement } = this.props;
        if (otherStyle.lock) {
            return;
        }
        document.removeEventListener('mousemove', this.moveFunc);
        document.removeEventListener('mouseup', this.upFunc);
        this.moveFunc = (event) => {
            // todo:event suofang
            func(event);
        };
        this.upFunc = (event) => {
            this.cancelMove(event, this.moveFunc);
            // if (typeof this.props.afterresize === 'function') {
            //     this.props.afterresize(event);
            // }
            // if (typeof onMoveElement === 'function' && Object.keys(this.limitState).length > 0) {
            //     const { width, height, rotate } = this.limitState;
            //     if (width === undefined && height === undefined && rotate === undefined) { // 只移动了位置
            //         onMoveElement({ ...this.limitState });
            //     } else {
            //         this.changeStyles({
            //             ...this.limitState,
            //             isRotate: this.isRotate,
            //         });
            //     }
            //     this.limitState = {};
            // }
        };
        this.setState({ down: true }, () => {
            document.addEventListener('mousemove', this.moveFunc);
            document.addEventListener('mouseup', this.upFunc);
        });
    };

    /**
     * 公共取消事件
     * @param e
     */
    cancelMove = (e, func) => {
        this.aspectRatio = null; // 重置长宽比
        this.setState({
            center: null,
            down: false,
        });
        eventEmitter.emit('mouseup');
        document.removeEventListener('selectstart', this.selectstart);
        document.removeEventListener('mousemove', this.moveFunc);
        document.removeEventListener('mouseup', this.upFunc);
        this.upFunc = () => null;
        e && e.target && e.target.classList.remove('moving');
    };
    /**
     * 移动组合盒子
     * @param downEvent
     */
    handleMouseDownGroup = (downEvent, uuid) => {
        const { changeStyles, props: { activeGroup } } = this;
        this.startMove(downEvent);
        //记录当前激活当前组合

        //获取当前位置
        let startPostion = {
            x: downEvent.clientX,
            y: downEvent.clientY,
        };
        //组合移动事件
        const movingGroup = (movingEvent) => {
            const { left, top, rotate } = this.state;
            const { activeGroup } = this.props;
            const clientX = movingEvent.clientX;
            const clientY = movingEvent.clientY;
            //设置移动后元素新的位置
            const newState = {
                left: clientX - startPostion.x + left,
                top: clientY - startPostion.y + top,
            };
            //更新初始位置
            startPostion = {
                x: clientX,
                y: clientY,
            };
            this.setState(newState);
            //更新盒子位置
            if (typeof changeStyles === 'function') {
                changeStyles({
                    uuid,
                    ...newState,
                    rotate,
                });
            }
        };
        const mouseUp = (ev) => {
            document.removeEventListener('mousemove', movingGroup);
            document.removeEventListener('mouseup', mouseUp);
        };
        if (typeof activeGroup === 'function') {
            activeGroup(downEvent, uuid);
        }
        document.addEventListener('mousemove', movingGroup);
        document.addEventListener('mouseup', mouseUp);

    };

    render() {
        const {
            props: {
                otherStyle = {}, fixedaspectratio = 0, showdot = null, positionScale = 1,
                onContextMenu, uuid, bodyposition, active, lock = false, visibility,
            },
            state,
        } = this;
        const { left, top, width, height, zIndex = 0, rotate } = state;
        // 调整框样式
        const { borderStyle, borderColor, borderWidth, borderRadius, overflow, ...compBoxOtherStyle } = otherStyle;
        const compBoxStyle = {
            transform: `rotateZ(${rotate}deg)`,
            ...compBoxOtherStyle,
            backgroundColor: 'none',
            opacity: active && !lock ? 1 : 0,
            visibility: visibility,
            pointerEvents: lock ? 'none' : 'auto',
            zIndex: lock ? zIndex + 200 : zIndex,
            left,
            top,
            width,
            height,
        };
        // 边列表
        const showDot = showdot
            || (fixedaspectratio !== 0
                ? ['NE', 'SE', 'SW', 'NW']
                : ['N', 'S', 'E', 'W', 'NE', 'SE', 'SW', 'NW']);
        // 角列表
        const angleList = [
            // {
            //     aspect: 'NE',
            //     dot: showDot.includes('NE'),
            // },
            // {
            //     aspect: 'NW',
            //     dot: showDot.includes('NW'),
            // },
            // {
            //     aspect: 'SE',
            //     dot: showDot.includes('SE'),
            // },
            // {
            //     aspect: 'SW',
            //     dot: showDot.includes('SW'),
            // },
        ];
        const attrProps = {
            index: uuid,
            bodyposition: bodyposition,
            onContextMenu: onContextMenu,
        };
        return (
            <div {...attrProps}
                 className={`${styles.compBox} elementCompBox-group`}
                 id={uuid}
                 style={{
                     ...compBoxStyle,
                 }}
                 onMouseDown={(e) => this.handleMouseDownGroup(e, uuid)}
                 ref={this.moveBox}
            >
                <div className={`${styles.bar} ${styles.barLine}`}/>
                <div
                    className={`${styles.bar} ${styles.barRotate} ${styles.dot} barRotateBtn`} // 用于标记点击旋转
                    onMouseDownCapture={this.startRotate} style={{
                    transform: `scale(${1 / positionScale})`,
                    transformOrigin: 'bottom',
                }}>
                    {state.center &&
                    <div className={`${styles.barRotateText}`}
                         style={{ transform: `rotateZ(${-rotate}deg)` }}>
                        {rotate}°</div>}
                    <Icon type="eqf-rotate-cw"/>
                </div>

                {angleList.map(item => item.dot && (
                    <div key={item.aspect}
                         onMouseDown={(e) => this.startMoveBar(e, item.aspect)}
                         className={`${styles.bar} ${styles[`bar${item.aspect}`]} ${styles.dot} `}/>
                ))}
            </div>
        );
    }
};

ResizeComponentElemGroup.propTypes = {
    limit: PropTypes.object,
    fixedaspectratio: PropTypes.number,
    bodyposition: PropTypes.object,
    active: PropTypes.bool,
    onChange: PropTypes.func,
    beforeresize: PropTypes.func,
    afterresize: PropTypes.func,
    showdot: PropTypes.array,
    otherStyle: PropTypes.object,
};

export const needProperty = {
    height: 1,
    width: 1,
    left: 1,
    top: 1,
    rotate: 1,
    borderWidth: 1,
    borderColor: 1,
    borderStyle: '',
    backgroundColor: 1,
    borderRadius: 1,
    color: 1,
    padding: 1,
};

export default React.forwardRef((props, ref) => <ResizeComponentElemGroup {...props} inRef={ref}/>);
