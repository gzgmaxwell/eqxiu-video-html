import React from 'react';
import { connect } from 'dva';
import isEqual from 'lodash/isEqual';
import cloneDeep from 'lodash/cloneDeep';
import styles from './guideLine.less';

@connect(({ editor }) => {
    const { positionScale } = editor;
    return { positionScale };
})
class GuideLine extends React.Component {
    constructor(props) {
        super(props);
        this.threshold = 1.5; // 吸附的阀值
        this.guideRects = []; // 需要参考的矩形位置
        this.bigRect = {}; // 多选组件的大矩形位置
        this.startBigRect = {}; // 多选组件的大矩形初始位置
        this.moveObj = { // 移动的对象
            left: 0,
            top: 0,
        };
    }

    state = {
        shiftTop: '',// y 轴上便宜量
        shiftLeft: '',// x 轴上便宜量
        css: {
            topCss: {
                display: 'none',
                top: 0,
            },
            centerYCss: {
                display: 'none',
                top: 0,
            },
            bottomCss: {
                display: 'none',
                top: 0,
            },
            leftCss: {
                display: 'none',
                left: 0,
            },
            centerXCss: {
                display: 'none',
                left: 0,
            },
            rightCss: {
                display: 'none',
                left: 0,
            },
        },
    };


    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { positionScale: nexPositionScale = 1 } = nextProps;
        const { positionScale } = this.props;
        return positionScale !== nexPositionScale || !isEqual(this.state, nextState);
    }


    componentWillUnmount() {
        document.removeEventListener('mousedown', this.down, { passive: true });
        document.removeEventListener('mousemove', this.func, {
            passive: true,
            capture: true,
        });
        document.removeEventListener('mouseup', this.upFunc, { passive: true });
        this.setState = () => null;
    }

    componentDidMount() {
        document.addEventListener('mousedown', this.down, { passive: true });
        this.shiftPostion();
    }

    down = (e) => {
        setTimeout(() => {
            const elementsActive = document.getElementsByClassName('activeEle')[0];
            if (elementsActive) {
                this.commonBind();
            }
        }, 16);
    };
    commonBind = () => {
        document.addEventListener('mousemove', this.func, {
            passive: true,
            capture: true,
        });
        document.addEventListener('mouseup', this.upFunc, { passive: true });
    };
    func = (e) => {
        this.guidelineClear();
        this.setBigRect();
        this.setGuideRects(e);
    };
    upFunc = (e) => {
        document.removeEventListener('mousemove', this.func, {
            passive: true,
            capture: true,
        });
        document.removeEventListener('mouseup', this.upFunc, { passive: true });
        this.guidelineClear();
    };
    /**
     * 启动时需要重置的一些变量
     * @param {[startBigRect]} [description]
     */
    start = () => {
        this.startBigRect = {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            width: 0,
            height: 0,
            centerX: 0,
            centerY: 0,
        };
    };


    /**
     * 设置多选组件的大矩形位置，在移动时动态设置
     */
    setBigRect = () => {
        // 移动的目标对象
        const activeEle = document.getElementsByClassName('activeEle');
        const leftArr = [];
        const topArr = [];
        const rightArr = [];
        const bottomArr = [];
        for (let i = 0; i < activeEle.length; i++) {
            leftArr.push(activeEle[i].getBoundingClientRect().left);
            topArr.push(activeEle[i].getBoundingClientRect().top);
            rightArr.push(activeEle[i].getBoundingClientRect().right);
            bottomArr.push(activeEle[i].getBoundingClientRect().bottom);
        }
        const left = Math.min(...leftArr);
        const top = Math.min(...topArr);
        const right = Math.max(...rightArr);
        const bottom = Math.max(...bottomArr);
        const width = (right - left);
        const height = (bottom - top);

        // 垂直方向上的参考
        const rectY = {};
        // 为了减少循环的次数，而且需要考虑0的情况
        if (top !== undefined) this.bigRect.top = top;
        if (bottom !== undefined) this.bigRect.bottom = bottom;
        if (height !== undefined) this.bigRect.centerY = top + height / 2;

        // 水平方向上的参考
        // 为了减少循环的次数，而且需要考虑0的情况
        if (left !== undefined) this.bigRect.left = left;
        if (right !== undefined) this.bigRect.right = right;
        if (width !== undefined) this.bigRect.centerX = left + width / 2;
    };

    /**
     * 设置需要参考的矩形
     */
    setGuideRects(e) {
        this.guideRects = [];
        if (!document.getElementById('workspace')) return;
        // 将画布作为参考线
        const editorReact = document.getElementById('workspace')
            .getBoundingClientRect();
        this.guideRects.push(editorReact);

        // 将每个组件作为参考,出去激活的组件
        const elements = document.getElementsByClassName('elements');
        for (let i = 0; i < elements.length; i++) {
            if (elements[i].getAttribute('attr') === 'activeNone') {
                const react = elements[i].getBoundingClientRect();
                this.guideRects.push({
                    ...react,
                    left: react.left,
                    top: react.top,
                });
            }
        }
        this.showGuideLine(e);
    }

    /**
     * 显示参考线
     */
    showGuideLine = (e) => {
        this.guideRects.forEach(rect => {
            const { left, top, right, bottom, width, height } = rect;

            // 垂直方向上的参考
            const rectY = {};
            // 为了减少循环的次数，而且需要考虑0的情况
            if (top !== undefined) rectY.top = top;
            if (bottom !== undefined) rectY.bottom = bottom;
            if (height !== undefined) rectY.centerY = (top + height / 2);

            // 水平方向上的参考
            const rectX = {};
            // 为了减少循环的次数，而且需要考虑0的情况
            if (left !== undefined) rectX.left = left;
            if (right !== undefined) rectX.right = right;
            if (width !== undefined) rectX.centerX = (left + width / 2);

            // 移动的框选组件坐标
            // 垂直方向上的坐标
            const bigRect = this.bigRect;
            const bigRectY = {
                top: bigRect.top,
                bottom: bigRect.bottom,
                centerY: bigRect.centerY,
            };

            // 水平方向上的坐标
            const bigRectX = {
                left: bigRect.left,
                right: bigRect.rights,
                centerX: bigRect.centerX,
            };

            // 分别显示垂直参考线和水平参考线，最多能显示6条线
            this.showGuideLinePart(e, 'left', rectX, bigRectX);
            this.showGuideLinePart(e, 'top', rectY, bigRectY);
        });
    };
    showGuideLinePart = (e, type, eqxElementRect, activeElement) => {
        const { props: { positionScale = 1 } } = this;
        const positionBox = document.getElementById('workspace')
            .getBoundingClientRect();
        for (let key1 in eqxElementRect) {
            for (let key2 in activeElement) {
                // 吸附时移动的距离
                this.moveObj = {};
                this.moveObj[type] = eqxElementRect[key1] - activeElement[key2];
                // 吸附
                // this.handleThreshold(e,this.moveObj)
                if (Math.abs(eqxElementRect[key1] - activeElement[key2]) < this.threshold) {
                    if (type === 'left') {
                        const obj = {
                            display: 'block',
                            [type]: (eqxElementRect[key1] - positionBox.left) / positionScale,
                        };
                        this.commit(key2, obj);
                    } else {
                        const obj = {
                            display: 'block',
                            [type]: (eqxElementRect[key1] - positionBox.top) / positionScale,
                        };
                        this.commit(key2, obj);
                    }
                }
            }
        }
    };
    handleThreshold = (e, value) => {
        if (Math.abs(value.left < this.threshold) || Math.abs(value.top < this.threshold)) {
            setTimeout(() => {
                e.stopPropagation();
            }, 5000);
        } else {

        }
        /* const activeEle = document.getElementsByClassName('activeEle')
         for(let i=0;i<activeEle.length;i++){
             activeEle[i].style.left = activeEle[i].offsetLeft + value.left + 'px'
             activeEle[i].style.top = activeEle[i].offsetTop + value.top + 'px'
         }*/
    };
    guidelineClear = () => {
        const { state: { css: oldCss } } = this;
        const css = cloneDeep(oldCss);
        for (const value of Object.values(css)) {
            value.display = 'none';
        }
        this.setState({ css });
    };

    commit = (key2, obj) => {
        const { css: oldCss } = this.state;
        const css = cloneDeep(oldCss);
        if (css[`${key2}Css`]) {
            css[`${key2}Css`] = obj;
            this.setState({ css });
        }
    };

    shiftPostion = () => {
        this.setState({
            shiftTop: document.getElementById('workspace').offsetTop,
            shiftLeft: document.getElementById('workspace').offsetLeft,
        });
    };

    render() {
        const { state: { css: { topCss, centerYCss, bottomCss, leftCss, centerXCss, rightCss }, positionScale = 1, ...state } } = this;
        return (
            <div className={styles.eqc_guide}>
                <div className={`${styles.line} ${styles.h}`}
                     style={{
                         ...topCss,
                         left: 0,
                     }}/>
                <div className={`${styles.line} ${styles.h}`}
                     style={{
                         ...bottomCss,
                         left: 0,
                     }}/>
                <div className={`${styles.line} ${styles.h}`}
                     style={{
                         ...centerYCss,
                         left: 0,
                     }}/>
                <div className={`${styles.line} ${styles.v}`}
                     style={{
                         ...leftCss,
                         top: 0,
                     }}/>
                <div className={`${styles.line} ${styles.v}`}
                     style={{
                         ...rightCss,
                         top: 0,
                     }}/>
                <div className={`${styles.line} ${styles.v}`}
                     style={{
                         ...centerXCss,
                         top: 0,
                     }}/>
            </div>
        );
    }
}

export default GuideLine;
