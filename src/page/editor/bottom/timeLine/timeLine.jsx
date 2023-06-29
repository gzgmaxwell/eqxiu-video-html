import React, { Fragment } from 'react';
import { connect } from 'dva';
import { message } from 'antd';
import styles from './timeLine.less';
import SingleTimeBlock from './singleTimeBlock';
import { contrast, isSetTimerEle, handleMaxOrMinNum, limitNumber } from '../../../../util/data';
import { CANVAS_TYPE } from '../../../../config/staticParams';
import { genUrl } from '../../../../util/image';
import { isEqual } from 'lodash';
import ReactDom from 'react-dom';
import { isPressedCtrl } from '../../../../util/event';
import ScaleController from './scaleController';
import ScrollBarController from '../../../components/common/scrollBarController';
import CurrentTimeMark from '../../../components/timeController/currentTime';
import ScaleMark from '../../../components/scaleMark/scaleMark';


function stepTime(time) {
    return Number(time.toFixed(1));
}


function getBodyDuration(duration, scale) {
    return Math.max(duration * Math.abs(1.3), 10000);
    // const level = ~~(999 * 1000 / duration);
    // return 999 * 1000;
}

class MultiCard extends React.Component {


    render() {
        const { list = [], onActive = null, postion = {}, onHover = null, onLeave = null } = this.props;
        const dom = (
            <div
                className={styles.multiCard}
                onMouseEnter={onHover}
                onMouseLeave={onLeave}
                style={{
                    top: postion.top,
                    left: postion.left,
                }}
            >
                <div className={styles.content}>
                    {list.map(ele => {
                        return <div
                            key={ele.uuid}
                            className={`${styles.oneCard} ${ele._active
                                ? styles.onCardActive
                                : null}`}
                            onClick={(e) => {
                                if (onActive) {
                                    onActive(ele.uuid, e)
                                        .then(() => this.forceUpdate());
                                }
                                // const activeDom = document.querySelectorAll(`.${styles.oneCard}`);
                                // if (!isPressedCtrl(e)) {
                                //     for (let i = 0; i < activeDom.length; i++) {
                                //         activeDom[i].classList.remove(`${styles.onCardActive}`);
                                //     }
                                // }
                                // const currentDom = e.currentTarget;
                                // if (Array.from(currentDom.classList)
                                //     .includes(`${styles.onCardActive}`)) {
                                //     currentDom.classList.remove(`${styles.onCardActive}`);
                                // } else {
                                //     currentDom.classList.add(`${styles.onCardActive}`);
                                // }
                            }}>
                            {ele.children}
                        </div>;
                    })}
                </div>
                <div className={styles.triange}/>
            </div>);

        return ReactDom.createPortal(dom, document.body);
    }
}

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

/**
 * 归纳 合并时间轴
 * @param dataList [{}] 当前片段的元素列表
 * @param duration int 当前片段的时长
 * @param activeIndexes [] 哪些元素是激活状态
 * @return {Array}
 */
function formatSingleList(dataList, duration, activeIndexes, scale = 1) {
    // 用于合并的map  key值为 {startTime:'开始时间',active: '是否激活:bool' }
    const timeLineList = new Map();
    // 获得原始排序数据
    const newData = [...dataList].map((item, index) => ({
        item,
        index
    }));
    // 根据时间先后排序
    const sortDataList = newData.sort((a, b) => a.item.renderSetting.startTime - b.item.renderSetting.startTime);
    for (const { item: oOneEle, index } of sortDataList) {
        const oneEle = {
            ...oOneEle,
            renderSetting: { ...oOneEle.renderSetting },
            _active: activeIndexes.includes(index),
            _index: index,
        };
        // index += 1;
        const { type, visibility, renderSetting, lock } = oneEle;
        // 如果是背景|| 不可见|| 没有时间设置 || 锁定 || 不是时间元素 则跳过；
        if (!type || visibility === 'hidden' || !renderSetting || lock ||
            !isSetTimerEle(oneEle)) {
            continue;
        }
        // 取出开始时间
        const { startTime } = renderSetting;
        // 从map的key里面找到开始时间解决和同样的激活状态的
        const listKey = timeLineList.size !== 0 && Array.from(timeLineList.keys())
            .find(value => Math.abs((value.startTime - startTime)) <= ~~(duration / scale / 4000) / 10 &&
                (value.active === oneEle._active));
        if (listKey !== false && listKey !== undefined) {
            timeLineList.set(listKey, timeLineList.get(listKey)
                .concat(formatSingleTime(oneEle)));
        } else {
            // 没有找到则新建
            timeLineList.set({
                startTime,
                active: oneEle._active,
            }, [formatSingleTime(oneEle)]);
        }
    }
    const singleList = [];

    if (timeLineList.size) {
        // 转换为数组形式
        timeLineList.forEach((oriValue, key) => {
            const thisActive = key.active;
            const value = oriValue;
            const checkedEle = activeIndexes.length === 1;
            // const firstEle = (checkedEle
            //     ? oriValue.filter(v => activeIndexes.includes(v._index))[0]
            //     : value[0]) || {};
            const firstEle = value[0];
            // 小标签页的样式
            const genContent = (ele) => {
                return (
                    [CANVAS_TYPE.text, CANVAS_TYPE.artFont, CANVAS_TYPE.animateFont].includes(
                        ele.type) ?
                        <span>{ele.content}</span> :
                        <img draggable='false' src={genUrl(ele.coverImg || ele.url, '60:60:png')}/>
                );
            };
            const hasActive = value.find(v => v._active);
            const isGroup = value.length > 1;
            const showGroupCard = isGroup ||
                thisActive && Array.from(timeLineList.keys())
                    .some(item => item.startTime === key.startTime && !item.active);
            const data = {
                key: (hasActive || value[0]).uuid,
                duration: duration / 1000,
                start: key.startTime,
                list: value.map(v => ({
                    ...v,
                    children: genContent(v),
                })),
                isGroup,
                showGroupCard,
                checked: checkedEle,
                content: genContent(firstEle),
                activeUuid: value.filter((v, i) => activeIndexes.includes(i))
                    .map(v => v.uuid),
                end: hasActive ? Math.max.apply(null, value.filter(v => v._active)
                        .map(v => v.endTime))
                    : Math.max.apply(null, value.map(v => v.endTime)),
                active: thisActive,
            };
            singleList.push(data);
        });
    }
    return singleList;
}

let lockState = false;

@connect(({ workspace, editor, timeLine }) => {
    const { product, parties, nowIndex } = editor;
    const { renderSetting } = parties[nowIndex] || {};
    const { uuid } = workspace;
    const { currentTimes, maxTime, minTimeObj } = timeLine;
    return ({
        dataList: workspace.dataList.map((value) => ({
            renderSetting: { ...value.renderSetting },
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
        product,
        renderSetting,
        uuid,
        currentTime: currentTimes[uuid],
        maxTime,
        minTimeObj,
    });
})
class TimeLine extends React.Component {

    constructor(props) {
        super(props);
        this.content = React.createRef();
        this.body = React.createRef();
        // 是否鼠标按下状态
        this.mouseDown = null;
        // 保存超量信息提示的promise 避免重复显示
        this.messagePromise = false;
        // 保存关闭标签的问题
        this.mouseLeaveTimer = 0;
        const scale = props.dataList.length > 1 ? 1 : 1;
        // getBodyDuration(props.renderSetting && props.renderSetting.segmentPartyDuration * 1000 || 4000) / 3000;
        this.state = {
            duration: 4000, // 毫秒
            bodyDuration: 20000, // 轨道毫秒数
            currentTime: 0,
            dataList: [],
            scale,
            minCard: null,
        };
    }


    shouldComponentUpdate(nextProps, nexState) {
        if (!isEqual(this.state, nexState)) {
            return true;
        }
        const { renderSetting = {}, activeIndex, dataList } = this.props;
        const {
            renderSetting: nextRenderSetting = {},
            activeIndex: nextActiveIndex,
            dataList: nextDataList,
        } = nextProps;
        if (activeIndex !== nextActiveIndex) {
            return true;
        }
        if (renderSetting.segmentPartyDuration !==
            nextRenderSetting.segmentPartyDuration) {
            return true;
        }
        if (nextDataList.length !== dataList.length) {
            return true;
        }
        return false;
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        const newState = { ...prevState };
        const { scale } = prevState;
        const { renderSetting, currentTime, dataList } = nextProps;
        if (!renderSetting) return newState;
        if (!lockState) {
            newState.duration = renderSetting.segmentPartyDuration * 1000;
            newState.bodyDuration = getBodyDuration(newState.duration, scale);
            newState.currentTime = currentTime;
            newState.dataList = dataList;
        }
        if (prevState.minCard && nextProps.activeIndexes) {
            const activeUUIDs = nextProps.dataList.filter(
                (v, i) => nextProps.activeIndexes.includes(i))
                .map(v => v.uuid);
            newState.minCard.list = newState.minCard.list.map(v => ({
                ...v,
                _active: activeUUIDs.includes(v.uuid),
            }));
        }
        return newState;
    }

    tempList = [];

    componentDidUpdate(prvProps, prevState) {
        // const { props: { activeIndex, activeIndexes } } = this;
        // if (activeIndex !== prvProps.activeIndex || activeIndexes !== prvProps.activeIndexes) {
        //     this.handleResetScale();
        // }
    }

    /**
     * 激活时重新设计缩放值
     */
    handleResetScale = () => {
        const { state: { bodyDuration } } = this;
        const activeItem = this.tempList.find(item => item.active);
        if (!activeItem) return;
        const activeDuration = activeItem.end - activeItem.start;
        const scale = bodyDuration / getBodyDuration(activeDuration * 1000);
        this.setState({ scale }, () => {
            const position = activeItem.start * 1000 / bodyDuration * this.body.current.lastElementChild.offsetWidth;
            requestAnimationFrame(() => {
                this.content.current.scrollLeft = position;
            });
        });
    };

    onChangeScale = (scale) => {
        // const { target: { value: scale = 1 } = {} } = e;
        this.setState({ scale });
    };


    /**
     * 点击小框框事件
     * @param uuid
     */
    activeElementByUuid = async (uuid, e) => {
        e.persist();
        const { dataList } = this.props;
        if (!isPressedCtrl(e)) {
            await this.props.dispatch({
                type: 'workspace/changeActive',
                payload: {
                    index: null,
                    clear: !isPressedCtrl(e),
                    filter: isPressedCtrl(e),
                },
            });
        }
        const index = dataList.findIndex(v => v.uuid === uuid);
        return this.activeElements([index], e);
    };

    /**
     * 激活某个元素
     * @param indexes
     * @return {*}
     */
    activeElements = (indexes, e) => {
        let promise = null;
        if (indexes.length > 1) {
            promise = this.props.dispatch({
                type: 'workspace/boxActive',
                payload: indexes,
            });
        } else {
            promise = this.props.dispatch({
                type: 'workspace/changeActive',
                payload: {
                    index: indexes[0],
                    clear: !isPressedCtrl(e),
                    filter: isPressedCtrl(e),
                },
            });
        }
        return promise;
    };


    showMinCard = (minCard) => {
        if (!minCard.list) return false;
        const { startTime } = minCard.list[0];
        let list = [];
        this.tempList.forEach((item) => {
            if (startTime === item.start && item.list) {
                list = [...list, ...item.list];
            }
        });
        if (list.length < 2) return false;
        clearTimeout(this.mouseLeaveTimer);
        this.setState({
            minCard: {
                ...minCard,
                list,
                onActive: this.activeElementByUuid,
                onHover: () => clearTimeout(this.mouseLeaveTimer),
                onLeave: this.closeMinCard,
            },
        });
    };

    closeMinCard = () => {
        clearTimeout(this.mouseLeaveTimer);
        this.mouseLeaveTimer = setTimeout(
            () => this.setState({ minCard: null }), 1000,
        );
    };
    /**
     * 改变时间
     * @param uuidArr {Array} 要改变的元素UUID列表
     * @param oriTimeObj {start ,end, type} 改变的开始时间 结束时间，这次改变的类型
     * @param updateModel {Boolean} 是否更新到Model
     * @return {*}
     */
    onChangeTime = (uuidArr, oriTimeObj, updateModel = false) => {
        const timeObj = { ...oriTimeObj };
        const { state: { currentTime, scale }, props: { minTimeObj, dataList } } = this;
        // 验证是否有最小值
        let minTime = null;
        uuidArr.forEach((uuid) => {
            if (minTimeObj[uuid]) {
                minTime = Math.max(minTimeObj[uuid], minTime);
            }
        });
        let { start, end, type } = timeObj;
        if (minTime > (end - start)) {
            if (!this.messagePromise) {
                this.messagePromise = true;
                message.warning(`由于动画效果，元素最小时长不能低于${minTime.toFixed(1)}秒`)
                    .then(() => this.messagePromise = false);
            }
            // return;
            if (type === 'end') {
                timeObj.end = Math.round(start + minTime);
            } else {
                timeObj.start = Math.round(end - minTime);
            }
            ({
                start,
                end,
                type,
            } = timeObj);
        }
        if (updateModel) {
            // 提交到model
            const { uuid } = this.props;
            lockState = false;
            const newTimeObj = {
                start: stepTime(timeObj.start),
                end: stepTime(timeObj.end),
            };
            const newCurrentTime = limitNumber(currentTime, [newTimeObj.start * 1000, newTimeObj.end * 1000]);
            this.props.dispatch({
                type: 'timeLine/changeCurrentTime',
                payload: {
                    currentTime: newCurrentTime,
                    uuid,
                },
            });
            return this.props.dispatch({
                type: 'workspace/changeELementsTime',
                payload: {
                    timeObj: newTimeObj,
                    uuidArr,
                },
            });
        } else {
            // 不提交到model 则需要自己计算
            lockState = true;
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
                minCard: null,
                dataList: newData,
                duration: newDuration * 1000,
                // bodyDuration: getBodyDuration(newDuration * 1000, scale),
                currentTime: ~~(newCurrentTime / 100) * 100,
            };
            // if (newState.duration >= this.state.bodyDuration) {
            //     newState.bodyDuration = this.state.bodyDuration + 2 * newState.duration;
            // }
            return new Promise(resolve => this.setState(newState, resolve));
        }
    };

    render() {
        const {
            state: { duration, bodyDuration, minCard, scale, currentTime, dataList }, props: {
                activeIndexes, maxTime,
                product,
            },
        } = this;
        // 处理各个元素的时间轴合并,激活等处理.
        const singleList = formatSingleList(dataList, bodyDuration, activeIndexes, scale);
        const multipleActive = singleList.filter(item => item.active).length > 1;
        this.tempList = singleList;
        const bodyWidth = scale;
        // 缩放尺度
        const max = bodyDuration / 3000;
        const min = 1;
        const scaleControllerProps = {
            id: 'time-scale-bar',
            value: scale,
            onChange: this.onChangeScale,
            min,
            max,
        };
        const currentMarkProps = {
            element: this.body.current,
            bodyDuration,
            scale,
        };
        if (lockState) {
            currentMarkProps.currentTime = currentTime;
        }
        return (
            <React.Fragment>
                <div className={styles.content} id="time-content" ref={this.content}>
                    <div
                        className={styles.body}
                        style={{
                            width: `${bodyWidth * 100}%`,
                        }}
                        ref={this.body}>
                        <ScaleMark duration={bodyDuration} scale={scale}/>
                        {minCard && <MultiCard {...minCard} />}
                        <div className={styles.mainLine} id="time-track">
                            <CurrentTimeMark
                                {...currentMarkProps}
                            />
                            {singleList.length
                            && singleList.map(v => <SingleTimeBlock
                                {...v}
                                maxTime={maxTime}
                                product={product}
                                onClick={this.activeElements}
                                multipleActive={multipleActive}
                                onChange={this.onChangeTime}
                                onActive={this.activeElementByUuid}
                                isMouse={this.mouseDown}
                                realDuration={duration / 1000}
                                boxElement={this.content.current}
                                showMinCard={this.showMinCard}
                                closeMinCard={this.closeMinCard}
                            />) || false
                            }
                        </div>
                    </div>
                </div>
                <div className={styles.controllerBox}>
                    <div className={styles.scrollBarBox}>
                        {this.content.current &&
                        <ScrollBarController
                            id={'time-scrollbar'}
                            element={this.content.current} axis={'x'}
                            scale={scale}/>
                        }
                    </div>
                    <div className={styles.scaleControllerBox}>
                        <ScaleController {...scaleControllerProps} />
                    </div>
                    {/*{this.content.current && <TimeLineNoob />}*/}
                </div>
            </React.Fragment>
        );
    }
}

export default TimeLine;
