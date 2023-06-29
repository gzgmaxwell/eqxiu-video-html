/* eslint-disable operator-assignment,no-param-reassign */
import React, { useState, useEffect, useRef } from 'react';
import PropsTypes from 'prop-types';
import styles from './scrollBarController.less';

const axisParams = {
    y: {
        size: 'height',
        position: 'top',
    },
    x: {
        size: 'width',
        position: 'left',
    },
};

/**
 * 首字母大写的方法
 * @param name
 * @return {string}
 */
function upperCaseFirst(name) {
    return name.slice(0, 1)
        .toUpperCase() + name.slice(1);
}

function ScrollBarController({ element, axis = 'y', hideNoSize = true, wheelChange = false, scale = 1, id, isPadding = 0 }) {
    const { size: sizeFiled, position: positionFiled } = axisParams[axis];
    const scrollSizeKey = `scroll${upperCaseFirst(sizeFiled)}`;
    const boxSizeKey = `offset${upperCaseFirst(sizeFiled)}`;
    const {
        [scrollSizeKey]: scrollS, [boxSizeKey]: offsetS,
    } = element;
    element.style.overflow = 'hidden';
    if (isPadding === 1) {
        element.style.padding = '92px 10px 0 10px';
    } else if (isPadding === 2) {
        element.style.padding = '94px 0px 0 28px';
    }
    const scrollKey = `scroll${upperCaseFirst(positionFiled)}`;
    // 轨道元素
    const trackNode = useRef();
    // 是否需要监听外部滚动
    const noListen = useRef(false);

    /**
     * @var lef Number 表示位置的比值
     */
    const [left, setLeft] = useState(0);
    const [barWidth, setBarWidth] = useState(Math.min(1, offsetS / scrollS));

    useEffect(() => {
        setBarWidth(Math.min(1, element[boxSizeKey] / element[scrollSizeKey]));
    }, [element[scrollSizeKey], element[boxSizeKey], scale]);

    const { min, max } = Math;
    // 移动时改变 元素位置
    useEffect(() => {
        if (!element) return;
        element[scrollKey] = scrollS * left;
    }, [left, scrollS]);
    // 监听外部滚动
    useEffect(() => {
        const setFunc = () => {
            if (noListen.current) return;
            setLeft(element[scrollKey] / element[scrollSizeKey]);
        };
        // 鼠标滚动事件
        const wheelAction = (wheelEvent) => {
            let delta = null;
            const { deltaY, deltaX, wheelDelta } = wheelEvent;
            if (wheelChange) {
                delta = wheelDelta || -(deltaY || deltaX) * 40;
            } else {
                delta = wheelDelta || -(axis === 'y' ? deltaY : deltaX) * 40;
            }
            element[scrollKey] = element[scrollKey] + delta / 4;
        };
        element.addEventListener('scroll', setFunc);
        element.addEventListener('wheel', wheelAction);
        return () => {
            element.removeEventListener('scroll', setFunc);
            element.removeEventListener('wheel', wheelAction);
        };
    }, []);
    if (hideNoSize && barWidth === 1) return <div></div>;

    // 移动事件
    function mouseDown(downEvent) {
        const eventKey = `page${axis.toUpperCase()}`;
        let { [eventKey]: beginEventPoint } = downEvent;
        const { offsetWidth = 1 } = trackNode.current || {};
        noListen.current = true;

        function moveMouse(moveEvent) {
            const { [eventKey]: currentPoint } = moveEvent;
            setLeft((currentLeft) => {
                const change = currentPoint - beginEventPoint;
                const changeScale = change / offsetWidth;
                return max(0, min(1 - barWidth, currentLeft + changeScale));
            });
            beginEventPoint = currentPoint;
        }

        function upMouse() {
            window.removeEventListener('mousemove', moveMouse);
            window.removeEventListener('mouseup', upMouse);
            noListen.current = false;
        }

        window.addEventListener('mousemove', moveMouse);
        window.addEventListener('mouseup', upMouse);
    }


    return (<div className={styles.content} id={id}>
        <div className={styles.track} ref={trackNode}>
            <div
                className={styles.bar} onMouseDown={mouseDown}
                style={{
                    width: `${barWidth * 100}%`,
                    [positionFiled]: `${left * 100}%`,
                }}><span className={styles.handler}>|</span>
            </div>
        </div>
    </div>);
}


ScrollBarController.propTypes = {
    element: PropsTypes.node,
    axis: PropsTypes.oneOf(Object.keys(axisParams)),
    hideNoSize: PropsTypes.bool,
};

ScrollBarController.defaultProps = {
    element: {},
    axis: 'y',
    hideNoSize: true,
};

export default ScrollBarController;
