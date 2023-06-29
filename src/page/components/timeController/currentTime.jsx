import React, { useEffect, useState } from 'react';
import { connect } from 'dva';
import styles from './currentTime.less';
import { limitNumber } from '../../../util/data';

/* global moment  */

function CurrentTimeMark(props) {
    const { currentTime, element, duration, onChange } = props;
    const markOffset = -16;

    const oriOffsetWidth = element && element.querySelector('#time-track').offsetWidth || 0;
    const oriScrollLeft = element && element.parentNode && element.parentNode.scrollLeft || 0;

    function getCurrentTimeStr(time) {
        return moment(time)
            .format('mm:ss.S');
    }

    const [scrollLeft, setScrollLeft] = useState(oriScrollLeft);
    const [currentTimeStr, setCurrentTimeStr] = useState(getCurrentTimeStr(currentTime));
    const [currentMarkX, setCurrentMarkX] = useState(0);

    useEffect(() => {
        setCurrentTimeStr(getCurrentTimeStr(currentTime));
    }, [currentTime]);
    /**
     * 监听外部变动
     */
    useEffect(() => {
        if (!element) return;

        function reScroll() {
            const { parentNode: { scrollLeft: newLeft } } = element;
            setScrollLeft(newLeft);
        }

        element.parentNode.addEventListener('scroll', reScroll);
        const ele = element.querySelector('#time-track') || { offsetWidth: 0 };
        const newCurrentMarkX = currentTime / duration *
            (ele.offsetWidth) +
            markOffset -
            (scrollLeft);
        setCurrentMarkX(newCurrentMarkX);
        return () => {
            element.removeEventListener('scroll', reScroll);
        };
    }, [scrollLeft, oriOffsetWidth, currentTime, duration, element]);

    if (!element) return <div />;


    /**
     * 开始改变蓝色三角位置
     * @param e
     */
    const beginCurrentMove = (beginEvent) => {
        let mouseDown = null;
        let lastCurrentTime = currentTime;
        const beginX = beginEvent.pageX;

        /**
         * 改变蓝色三角形位置
         * @param e
         */
        function changeCurrentByMouse(e) {
            const { pageX } = e;
            if (!mouseDown) {
                // eslint-disable-next-line no-use-before-define
                return endCurrentMove(e);
            }
            const { x, width } = mouseDown;
            lastCurrentTime = limitNumber((pageX - x) / width * duration, [0, duration]);
            if (lastCurrentTime !== currentTime) {
                onChange(Math.round(lastCurrentTime / 100) * 100);
            }
            // setCurrentMarkX(limitNumber(beginPosition + offset, [markOffset - element.parentNode.scrollLeft, Infinity]));
            // setCurrentTimeStr(getCurrentTimeStr(lastCurrentTime));
        }

        function endCurrentMove() {
            mouseDown = null;
            if (lastCurrentTime !== currentTime) {
                onChange(Math.round(lastCurrentTime / 100) * 100);
            }
            document.removeEventListener('mousemove', changeCurrentByMouse);
            document.removeEventListener('mouseup', endCurrentMove);
        }


        mouseDown = element.querySelector('#time-track')
            .getBoundingClientRect();
        document.addEventListener('mousemove', changeCurrentByMouse);
        document.addEventListener('mouseup', endCurrentMove);
    };


    return (
        <div
            role="presentation"
            onMouseDown={beginCurrentMove}
            className={styles.currentMark}
            draggable={false}
            style={{ transform: `translateY(-30px) translateX(${currentMarkX}px)` }}
        >
            <div className={styles.timeBox}>{currentTimeStr}</div>
            <div className={styles.triangle} draggable={false} />
            <div className={styles.line} />
        </div>
    );
}


function mapStateToProps({ editor, timeLine, }, { currentTime }) {
    const { parties, nowIndex } = editor;
    const party = parties[nowIndex];
    if (!party || currentTime) {
        return {
            currentTime: currentTime || 0,
            duration: 4,
        };
    }
    const { uuid, renderSetting: { segmentPartyDuration: duration = 4 } } = party;
    const { currentTimes } = timeLine;
    return {
        currentTime: currentTimes[uuid] || 0,
        duration: duration * 1000,
        uuid,
    };
}

function onChangeF(currentTime, uuid) {
    return {
        type: 'timeLine/changeCurrentTime',
        payload: {
            currentTime,
            uuid,
        },
    };
}

function mergeProps({ currentTime, uuid }, dispatchProps, owenProps) {
    return {
        duration: owenProps.bodyDuration,
        onChange: time => dispatchProps.onChange(time, uuid),
        currentTime,
        element: owenProps.element,
    };
}

export default connect(mapStateToProps, { onChange: onChangeF }, mergeProps)(CurrentTimeMark);
export { CurrentTimeMark };
