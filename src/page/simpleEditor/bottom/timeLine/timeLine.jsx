import React from 'react';
import { connect } from 'dva';
import styles from './timeLine.less';
import SingleTimeBlock from './singleTimeBlock';
import { contrast, isSetTimerEle, limitNumber } from '../../../../util/data';
import { CANVAS_TYPE } from '../../../../config/staticParams';
import { genUrl } from '../../../../util/image';
import { isEqual } from 'lodash';

const playBtnBase64 = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIJeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiCXdpZHRoPSI0MnB4IiBoZWlnaHQ9IjI4cHgiIHZpZXdCb3g9IjAgMCA0MiAyOCI+PHBhdGggZD0iTSAxOS41IDI1LjRDIDE5LjUgMjUuNCAyLjYxIDUuNjIgMi42MSA1LjYyIDEuMjcgNC4yOSAyLjIxIDIgNC4xIDIgNC4xIDIgMzcuODkgMiAzNy44OSAyIDM5Ljc4IDIgNDAuNzIgNC4yOSAzOS4zOCA1LjYyIDM5LjM4IDUuNjIgMjIuNDkgMjUuNCAyMi40OSAyNS40IDIxLjY2IDI2LjIyIDIwLjMzIDI2LjIyIDE5LjUgMjUuNFoiIGZpbGw9IiM1Nzc5RkEiIC8+PC9zdmc+';
/**
 *
 * @param {array} scaleMarkArray
 * @returns {*}
 * @constructor
 */
const ScaleMark = ({ duration }) => {
    const oneBigCell = Math.ceil(duration / 20000) * 1000;
    const scaleMarkArray = Array(~~(duration / oneBigCell) + 1)
        .fill(true);
    const oneWidth = (1 / (duration / oneBigCell)) * 100;
    return (
        <ul className={styles.scaleMark}>
            {
                scaleMarkArray.map((a, number) => {
                    const left = `${oneWidth * number}%`;
                    const width = `${oneWidth}%`;
                    const hiddenTerm = number === (scaleMarkArray.length - 1) &&
                        (duration % oneBigCell < oneBigCell / 2);
                    return (
                        <li key={number} style={{
                            width,
                            left,
                        }}>
                            <span>{~~(number * oneBigCell / 1000)}s</span>
                            {!hiddenTerm && <div className={styles.sortTerm}></div>}
                        </li>
                    );
                })
            }
        </ul>
    );
};

/**
 * 格式化单条时间数据
 * @param elementData
 * @returns {{}}
 */
function formatSingleTime(elementData) {
    const { renderSetting: { startTime, endTime }, uuid, content, type, coverImg, url, _active, _index } = elementData;
    return {
        startTime,
        endTime,
        uuid,
        content,
        type,
        url,
        coverImg,
        _index,
        _active,
    };
}

function formatSingleList(dataList, duration, activeIndexes) {
    const timeLineList = new Map();
    let index = 0;
    const activeGroup = new Set();
    const isOnlyActive = activeIndexes.length === 1;
    for (const oOneEle of dataList) {
        const oneEle = {
            ...oOneEle,
            _active: activeIndexes.includes(index),
            _index: index,
        };
        index += 1;
        const { type, visibility, renderSetting, lock } = oneEle;
        if (!type || visibility === 'hidden' || !renderSetting || lock) continue;
        const { startTime } = renderSetting;
        const listKey = timeLineList.size !== 0 && Array.from(timeLineList.keys())
            .find(value => (value <= startTime && (value + 0.5) > startTime));
        if (listKey !== false && listKey !== undefined && (!oneEle._active || !isOnlyActive)) {
            timeLineList.set(listKey, timeLineList.get(listKey)
                .concat(formatSingleTime(oneEle)));
            if (oneEle._active) {
                activeGroup.add(listKey);
            }
        } else {
            // const newKey = (~~(startTime * 10 / 5)) / 10 * 5;
            timeLineList.set(startTime, [formatSingleTime(oneEle)]);
            if (oneEle._active) {
                activeGroup.add(startTime);
            }
        }
    }
    const singleList = [];
    let active = false;
    if (activeGroup.size === 1) {
        if (isOnlyActive) {
            active = true;
        } else {
            const activeGroupIndex = Array.from(timeLineList.get(Array.from(activeGroup)[0]))
                .map(v => v._index);
            if (activeGroupIndex.sort()
                .join(',') === activeIndexes.sort()
                .join(',')) {
                active = true;
            }
        }
    }
    if (timeLineList.size) {
        timeLineList.forEach((oriValue, key) => {
            const thisActive = active && activeGroup.has(key);
            const value = (thisActive && isOnlyActive) ? oriValue.filter(
                v => activeIndexes.includes(v._index)) : oriValue;
            const firstEle = value[0];
            const genContent = (ele) => {
                return (
                    [CANVAS_TYPE.text, CANVAS_TYPE.artFont].includes(ele.type) ?
                    <span>文本</span> :
                    <img draggable='false' src={genUrl(ele.coverImg || ele.url)}/>
                );
            };
            const data = {
                duration: duration / 1000,
                key: firstEle.uuid,
                start: key,
                list: value.map(v => ({
                    ...v,
                    children: genContent(v),
                })),
                isGroup: value.length > 1,
                content: genContent(firstEle),
                end: Math.max.apply(null, value.map(v => v.endTime)),
                active: thisActive,
            };
            singleList.push(data);
        });
    }
    return singleList;
}

let lockState = false;

@connect(({ workspace, editor, timeLine }) => ({
    dataList: workspace.dataList.map((value) => ({
        renderSetting: value.renderSetting,
        coverImg: value.coverImg,
        url: value.url,
        uuid: value.uuid,
        content: value.content,
        type: value.type,
        visibility: value.visibility,
        lock: value.lock,
    })),
    activeIndex: workspace.activeIndex,
    activeIndexes: workspace.activeIndexes,
    editor,
    timeLine,
}))
class TimeLine extends React.Component {

    constructor(props) {
        super(props);
        this.body = React.createRef();
        this.mouseDown = null;
    }

    state = {
        duration: 4000, // 毫秒
        currentTime: 0,
        dataList: [],
    };

    shouldComponentUpdate(nextProps, nexState) {
        if (!isEqual(this.state, nexState)) {
            return true;
        }
        const { editor: { parties, nowIndex }, activeIndex } = this.props;
        const {
            editor: { parties: nextParties },
            activeIndex: nextActiveIndex,
        } = nextProps;
        if (activeIndex !== nextActiveIndex) {
            return true;
        }
        const prev = parties[nowIndex];
        const next = nextParties[nowIndex];
        if (!prev || !next) return true;
        if (prev.renderSetting.segmentPartyDuration !==
            next.renderSetting.segmentPartyDuration) {
            return true;
        }
        if (prev.elementList.length !== next.elementList.length) {
            return true;
        }
        return false;
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        const newState = { ...prevState };
        const { editor: { parties, nowIndex }, timeLine: { currentTimes } } = nextProps;
        const next = parties[nowIndex];
        if (!next) return newState;
        if (!lockState) {
            newState.duration = next.renderSetting.segmentPartyDuration * 1000;
            newState.currentTime = currentTimes[next.uuid];
            newState.dataList = nextProps.dataList;
        }
        return newState;
    }

    changeCurrentByMouse = (e) => {
        const { pageX } = e;
        if (!this.mouseDown) {
            return this.endCurrentMove(e);
        }
        const { x, width } = this.mouseDown;
        const { state: { duration } } = this;
        const currentTime = limitNumber((pageX - x) / width * duration, [0, duration]);
        const { editor: { parties, nowIndex } } = this.props;
        lockState = false;
        this.props.dispatch({
            type: 'timeLine/changeCurrentTime',
            payload: {
                currentTime,
                uuid: parties[nowIndex].uuid,
            },
        });
    };


    beginCurrentMove = (e) => {
        this.mouseDown = this.body.current.getBoundingClientRect();
        document.addEventListener('mousemove', this.changeCurrentByMouse);
        document.addEventListener('mouseup', this.endCurrentMove);
    };

    endCurrentMove = (e) => {
        this.mouseDown = null;
        document.removeEventListener('mousemove', this.changeCurrentByMouse);
        document.removeEventListener('mouseup', this.endCurrentMove);
    };

    activeElementByUuid = (uuid) => {
        const { dataList } = this.props;
        const index = dataList.findIndex(v => v.uuid === uuid);
        this.activeElements([index]);
    };

    activeElements = (indexes) => {
        let promise = null;
        if (indexes.length > 1) {
            promise = this.props.dispatch({
                type: 'workspace/boxActive',
                payload: indexes,
            });
        } else {
            promise = this.props.dispatch({
                type: 'workspace/changeActive',
                payload: { index: indexes[0] },
            });
        }
        return promise;
    };

    onChangeTime = (uuidArr, timeObj, updateModel = false) => {
        const { state: { dataList, currentTime } } = this;
        if (updateModel) {
            // 提交到model
            const { editor: { parties, nowIndex } } = this.props;
            lockState = false;
            this.props.dispatch({
                type: 'timeLine/changeCurrentTime',
                payload: {
                    currentTime,
                    uuid: parties[nowIndex].uuid,
                },
            });
            return this.props.dispatch({
                type: 'workspace/changeELementsTime',
                payload: {
                    timeObj: {
                        ...timeObj,
                    },
                    uuidArr,
                },
            });
        } else {
            // 不提交到model 则需要自己计算
            lockState = true;
            const { start, end } = timeObj;
            let newDuration = end;
            let newCurrentTime = currentTime;
            if (currentTime < start * 1000) {
                newCurrentTime = start * 1000;
            } else if (currentTime > end * 1000) {
                newCurrentTime = end * 1000;
            }
            const newData = dataList.map((value, index) => {
                const { uuid } = value;
                if (uuidArr.includes(uuid)) {
                    return {
                        ...value,
                        renderSetting: {
                            ...value.renderSetting,
                            startTime: start,
                            endTime: end,
                        },
                    };
                } else {
                    if (isSetTimerEle(value)) {
                        newDuration = Math.max(value.renderSetting.endTime, newDuration);
                    }
                    return { ...value };
                }
            });
            const newState = {
                ...this.state,
                dataList: newData,
                duration: newDuration * 1000,
                currentTime: newCurrentTime,
            };
            return new Promise(resolve => this.setState(newState, resolve));
        }
    };

    render() {
        const { state: { duration, currentTime, dataList }, props: { activeIndexes } } = this;
        // 处理子类数据
        const singleList = formatSingleList(dataList, duration, activeIndexes);
        // 播放标位置
        const left = `${currentTime / duration * 100}%`;
        return (
            <div className={styles.body} ref={this.body}>
                <ScaleMark duration={duration}/>
                <div className={styles.mainLine}>
                    <div
                        role="presentation"
                        onMouseDown={this.beginCurrentMove}
                        className={styles.currentMark}
                        draggable={false}
                        style={{ left }}
                    >
                        <img src={playBtnBase64} draggable={false}/>
                    </div>
                    {singleList.length
                    && singleList.map(v => <SingleTimeBlock
                        key={v.uuid} {...v}
                        onClick={this.activeElements}
                        onChange={this.onChangeTime}
                        onActive={this.activeElementByUuid}
                    />) || false
                    }
                </div>
            </div>
        );
    }
}

export default TimeLine;
