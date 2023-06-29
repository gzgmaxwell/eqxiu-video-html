import React from 'react';
import ReactDom from 'react-dom';
import lodash from 'lodash';
import { message } from 'antd';
import styles from './timeLine.less';
import { contrast, limitNumber } from '../../../../util/data';
import { EDITOR_PRODUCT } from '../../../../config/staticParams';
import { toFixedTime } from '../../../../util/timestamp';

/* global moment */

const trackOffset = 30;

class SingleTimeBlock extends React.Component {

    constructor(props) {
        super(props);
        this.body = React.createRef();
        this.timeLineRect = null;
        this.mouseDown = null;
        this.type = 'range';
        this.mouseLeaveTimer = null;
        this.bodyBound = {};
        this.boxBound = {};
        this.moveRangePosition = 0;
        this.parentNode = null;
        this.messagePromise = false; // 全局提示的promise
        this.state = {
            isHover: false,
            moveType: null,
        };
        this.overTracker = null;
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (!lodash.isEqual(this.state, nextState)) {
            return true;
        }
        if (contrast(this.props, nextProps,
            [
                'duration',
                'start',
                'list.length',
                'active',
                'isGroup',
                'end',
                'content',
                'checked'])) {
            return true;
        }
        return false;
    }


    componentDidMount() {
        this.bodyBound = this.body.current.getBoundingClientRect();
        const { props: { boxElement } } = this;
        if (!boxElement) return;
        this.boxBound = boxElement.getBoundingClientRect();
    }

    componentDidUpdate() {
        this.bodyBound = this.body.current.getBoundingClientRect();
    }

    beginMove = (e, type) => {
        if (!this.props.active) return;
        this.setState({ isHover: false });
        const { parentNode } = this.body.current;
        this.timeLineRect = parentNode.getBoundingClientRect();
        this.parentNode = parentNode;
        this.mouseDown = {
            pageX: e.pageX,
            pageY: e.pageY,
        };
        if (type === 'range') {
            this.moveRangePosition = e.pageX - this.timeLineRect.left;
        }
        this.type = type;
        this.setState({ moveType: type });
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.endMove);
    };

    onMouseMove = (e, noTraceker = false) => {
        const { pageX } = e;
        if (!this.timeLineRect) {
            return this.endMove(e);
        }
        const { left, width } = this.timeLineRect;
        // const { pageX: prevPageX } = this.mouseDown;
        const {
            props: { onChange, list, duration, maxTime, product, activeUuid, boxElement, realDuration },
        } = this;
        const { startTime: start = 0, endTime: end = 4 } = list.find(v => v._active) || {};
        const distence = (pageX - left);
        const nowTime = distence / width * duration;
        this.timeLineRect = this.parentNode.getBoundingClientRect();
        if (!noTraceker && this.handleOverTracker(pageX)) {
            return true;
        }
        // if (!distanceTime) return;
        const newState = {
            start,
            end,
            type: this.type,
        };
        if (this.type === 'range') {
            const beginTime = this.moveRangePosition / width * duration;
            this.moveRangePosition = pageX - this.body.current.parentNode.getBoundingClientRect().left;
            let distanceTime = nowTime - beginTime;
            // 极限值卡住
            if (start + distanceTime < 0) {
                distanceTime = 0 - start;
            } else if (end + distanceTime > duration) {
                distanceTime = duration - end;
            }
            newState.start = toFixedTime(start + distanceTime);
            newState.end = toFixedTime(end + distanceTime);
        } else {
            newState[this.type] = Math.max(toFixedTime(nowTime), 0);
        }
        this.mouseDown = {
            pageX: e.pageX,
            pageY: e.pageY,
        };
        if ((newState.end - newState.start < 0.2)) {
            if (!this.messagePromise) {
                this.messagePromise = true;
                message.warning(`元素最小时长不能低于0.2秒`)
                    .then(() => {
                        this.messagePromise = false;
                    });
            }
            if (this.type === 'end') {
                newState.end = (Math.round(newState.start * 10) + 2) / 10;
            } else {
                newState.start = (Math.round(newState.end * 10) - 2) / 10;
            }
        }
        if ((newState.end > maxTime)) {
            newState.end = maxTime;
            if (!this.messagePromise) {
                this.messagePromise = true;
                message.warning(
                    `${product === EDITOR_PRODUCT.headTail ? '片头片尾' : '片段'}时长不能超过${maxTime}秒`)
                    .then(() => {
                        this.messagePromise = false;
                    });
            }
        }
        onChange(list.filter(v => v._active)
            .map(v => v.uuid), newState);
    };

    /**
     * 贴边拖动触发事件
     * @type {number}
     */
    pageTrackerOffset = 0;
    handleOverTracker = (pageX) => {
        const { props: { boxElement } } = this;
        const { abs } = Math;
        if (boxElement.scrollLeft && abs(pageX - this.boxBound.left) < trackOffset) {
            this.pageTrackerOffset = pageX - this.boxBound.left - trackOffset;
        } else if (abs(pageX - this.boxBound.right) < trackOffset) {
            this.pageTrackerOffset = pageX - this.boxBound.right + trackOffset;
        } else {
            this.pageTrackerOffset = 0;
        }
        if (this.pageTrackerOffset) {
            if (!this.overTracker) {
                // document.removeEventListener('mousemove', this.onMouseMove);
                const trackerFunc = () => {
                    if (this.overTracker) {
                        boxElement.scrollLeft += this.pageTrackerOffset;
                        this.timeLineRect = this.body.current.parentNode.getBoundingClientRect();
                        this.onMouseMove({ pageX }, true);
                        requestAnimationFrame(trackerFunc);
                    }
                };
                this.overTracker = requestAnimationFrame(trackerFunc);
            }
            return true;
        } else {
            cancelAnimationFrame(this.overTracker);
            this.overTracker = null;
            // document.addEventListener('mousemove', this.onMouseMove);
            return false;
        }
    };

    endMove = (e) => {
        this.timeLineRect = null;
        cancelAnimationFrame(this.overTracker);
        this.overTracker = null;
        this.setState({ moveType: null });
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.endMove);
        document.removeEventListener('mouseover', this.onMouseMove);
        const {
            props: { onChange, list, start, end, activeUuid },
        } = this;
        onChange(list.filter(v => v._active)
            .map(v => v.uuid), {
            start,
            end,
        }, true);
    };


    onHover = (e) => {
        this.props.showMinCard({
            postion: this.bodyBound,
            list: this.props.list,
        });
    };

    onMouseLeave = () => {
        this.props.closeMinCard();
    };

    render() {
        const {
            state: {
                isHover,
                moveType,
            },
            props: {
                active,
                isGroup,
                checked,
                list,
                content = null,
                onClick,
                duration = 10,
                start = 0,
                end = 1,
                multipleActive = false,
                showGroupCard,
                onActive = null,
                isMouse,
            },
        } = this;
        const left = `${start / duration * 100}%`;
        const widthPrc = (end - start) / duration;
        const width = `calc(${widthPrc * 100}% + 4px)`;

        const getTimeTips = (type) => {
            const str = moment(this.props[type] * 1000)
                .format('mm:ss.S');
            const style = {};
            let trueWidth = 500;
            try {
                trueWidth = this.body.current.parentNode.getBoundingClientRect().width * widthPrc;
            } catch (e) {

            }
            if (type === 'start' && trueWidth < 60) {
                style.left = -40;
            }
            return <div className={styles.timeTips} style={style} >{str}</div>;
        };

        return (
            <div
                className={styles.singleTimeRange}
                ref={this.body}
                style={{
                    left,
                    width,
                    zIndex: ~~(start * 10 + (active ? 1000 : 0)),
                }}
                onMouseOut={this.onMouseLeave}
                onMouseEnter={() => clearTimeout(this.mouseLeaveTimer)}
            >
                <React.Fragment>
                    <div
                        className={`${styles.bar} ${active ? '' : styles.noActive}`}
                        onMouseDown={event => this.beginMove(event, 'start')}
                    >
                        {active && !multipleActive && getTimeTips('start')}
                        <span className={styles.slide_rect}></span>
                    </div>
                    <div
                        className={`${styles.singleRange} ${active ? '' : styles.noActive}`}
                        onMouseDown={event => this.beginMove(event, 'range')}
                    />
                    <div
                        className={`${styles.bar} ${active ? '' : styles.noActive}`}
                        onMouseDown={event => this.beginMove(event, 'end')}
                    >
                        {active && !multipleActive && getTimeTips('end')}
                        <span className={styles.slide_rect}></span>
                    </div>
                </React.Fragment>
                <div
                    className={`${styles.tipIcon}
                    ${showGroupCard ? styles.groupIcon : ''} ${active ? styles.active : ''}`}
                    onClick={(e) => onClick(list.filter(v => v.startTime === start).map(v => v._index), e)}
                    onMouseEnter={this.onHover}
                    onMouseDown={event => this.beginMove(event, 'start')}
                >
                    {!checked && list.length > 1
                        ? ((list.filter(v => v._active).length) || list.length)
                        : content}
                </div>
            </div>
        );
    }
}

export default SingleTimeBlock;
