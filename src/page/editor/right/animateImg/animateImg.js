import React, { Component } from "react";
import { connect } from "dva";
import "react-virtualized/styles.css";
import styles from "./animateImg.less";
import { animations, ANIMATION_TYPES } from "../../../../dataBase/animations";
import animationIcon from "../../../static/icon/animationIcon.png";
import Input from "../../../components/input/NumberInput2";
import {
    CANVAS_TYPE,
    DEFAULT_ANIMATE_FONT_FAMILY,
    SUBTITLES_FONTS
} from "../../../../config/staticParams";
import { Drawer, Tooltip } from "antd";
import Icon from "../../../components/Icon";
import { limitInsert } from "../../../../util/data";

@connect()
export default class AnimateImg extends Component {
    handleAnimateDataChange = async payload => {
        const { dispatch } = this.props;
        const { animate = {}, type, renderSetting, uuid } = this.props.data;
        const { startTime = 0, endTime } = renderSetting || {};

        //取消当前的动画
        const element = document.getElementById("previewBody").querySelector(`#element_${uuid}`);
        if (element) {
            element.style.animation = "unset";
        }

        if (payload.animationName && type !== CANVAS_TYPE.animateImg) {
            if (limitInsert(null, CANVAS_TYPE.animateImg) === false) return;
        }
        const stageType = payload.stageType; //动画阶段类型
        animate[stageType] = {
            ...(animate[stageType] || {}),
            ...payload
        };
        const { animationDuration: inDuration = 0 } = animate[ANIMATION_TYPES.ENTRANCE] || {};
        const { animationDuration: stayDuration = 0, delay = 0 } =
            animate[ANIMATION_TYPES.STAY] || {};
        const { animationDuration: outDuration = 0 } = animate[ANIMATION_TYPES.EXITS] || {};
        const minTime = (inDuration + delay + stayDuration + outDuration) / 1000;
        const minEndTime = startTime + minTime;
        this.props
            .changeNow({
                animate,
                renderSetting: {
                    ...renderSetting,
                    endTime: Math.max(endTime, minEndTime)
                }
            })
            .then(() => {
                dispatch({
                    type: "editor/reloadVideoDuration",
                    payload: {}
                });
            });
        dispatch({
            type: "timeLine/setMinTime",
            payload: {
                uuid,
                minTime
            }
        });
        this.onClose();
    };
    state = {
        activeTab: ANIMATION_TYPES.ENTRANCE,
        focusName: null,
        visible: false
    };
    showDrawer = stageType => {
        this.setState({
            visible: true,
            activeTab: stageType
        });
    };
    clearSelect = () => {
        getSelection().removeAllRanges();
        const { activeElement } = document;
        if (activeElement) {
            activeElement.blur();
        }
    };
    onClose = () => {
        this.setState(
            {
                visible: false
            },
            this.clearSelect
        );
    };
    // 返回
    back = () => {
        this.setState(
            {
                visible: false
            },
            this.clearSelect
        );
    };
    handleAnimateChange = ({ animationDuration, stageType }) => {
        const { animate = {} } = this.props.data;
        const { animationName, animationIteration } = animate[stageType] || {};
        this.handleAnimateDataChange({
            animationDuration,
            stageType
        });
        this.handleFocus({
            name: animationName,
            duration: animationDuration,
            iteration: animationIteration,
            stageType
        });
    };
    changeActive = index => {
        this.setState({ activeTab: index });
    };
    handleFocus = (v = {}) => {
        const stageType = v.stageType || this.state.activeTab;
        const { animate = {}, uuid } = this.props.data;
        const { animationName, animationDuration } = animate[stageType] || {};
        const element = document.getElementById("previewBody").querySelector(`#element_${uuid}`);
        if (!element) return;
        element.style.animation = "unset";
        setTimeout(function() {
            element.style.animation = `${v.name || animationName} ${animationDuration ||
                v.duration}ms ${v.iteration || 1}`;
        }, 20);
        this.setState({ focusName: v.name || animationName });
    };
    handleBlur = () => {
        this.setState({ focusName: null });
    };
    tabs = [
        {
            index: ANIMATION_TYPES.ENTRANCE,
            title: "进入动画",
            start: "跟随元素进入时间"
        },
        {
            index: ANIMATION_TYPES.STAY,
            title: "强调特效"
        },
        {
            index: ANIMATION_TYPES.EXITS,
            title: "退出动画",
            start: "跟随元素退出时间"
        }
    ];
    indexes = ["①", "②", "③"];
    timer = 0;
    previewAnimate = () => {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = 0;
        }
        const { animate = {}, renderSetting: { startTime = 0, endTime } = {} } = this.props.data;
        const inAnimate = animate[ANIMATION_TYPES.ENTRANCE] || {};
        const stayAnimate = animate[ANIMATION_TYPES.STAY] || {};
        const outAnimate = animate[ANIMATION_TYPES.EXITS] || {};
        if (inAnimate.animationName) {
            this.handleFocus({ stageType: ANIMATION_TYPES.ENTRANCE });
        }
        if (stayAnimate.animationName) {
            this.timer = setTimeout(() => {
                this.handleFocus({ stageType: ANIMATION_TYPES.STAY });
            }, (inAnimate.animationDuration || 0) + stayAnimate.delay);
        }
        if (outAnimate.animationName) {
            this.timer = setTimeout(() => {
                this.handleFocus({ stageType: ANIMATION_TYPES.EXITS });
            }, (endTime - startTime) * 1000 - outAnimate.animationDuration);
        }
    };
    handleDelete = stageType => {
        const { animate = {} } = this.props.data;
        delete animate[stageType];
        this.props.changeNow({ animate });
    };

    render() {
        const { filterTabs = [] } = this.props;
        const { animate = {}, type } = this.props.data;
        const { focusName, activeTab } = this.state;
        const animationList = animations.filter(item => item.type === activeTab);
        return (
            <div className={styles.animate_font__set}>
                <div className={styles.preview} onClick={this.previewAnimate}>
                    <Icon type='eqf-play' />
                    预览动画
                </div>

                {!this.state.visible &&
                    this.tabs.map((item, index) => {
                        if (filterTabs.includes(item.index)) return null;
                        const stageType = item.index;
                        const animateElement = animate[stageType] || {};
                        const animationName = animateElement.animationName;
                        const currentAnimate =
                            animations.filter(i => i.name === animationName)[0] || {};
                        return (
                            <React.Fragment key={index}>
                                <div className={styles.spaceLine} />
                                <div className={styles.animate_title}>
                                    <div>{`${this.indexes[index]} ${item.title}`}</div>
                                    {animationName ? (
                                        <div
                                            onClick={() =>
                                                this.handleAnimateDataChange({
                                                    animationName: undefined,
                                                    animationDuration: 0,
                                                    animationIteration: 0,
                                                    stageType,
                                                    delay: 0
                                                })
                                            }>
                                            <Tooltip
                                                title='是否清除当前设置'
                                                placement='topRight'
                                                arrowPointAtCenter>
                                                <Icon type='eqf-delete-l' />
                                            </Tooltip>
                                        </div>
                                    ) : (
                                        <div className={styles.disabledIcon}>
                                            <Icon type='eqf-delete-l' />
                                        </div>
                                    )}
                                </div>
                                <div className={styles.animate_type}>
                                    <div>动画类型</div>
                                    <div>
                                        <div onClick={() => this.showDrawer(stageType)}>
                                            {currentAnimate.title || "无动画"}
                                            <Icon type='eqf-right' />
                                        </div>
                                        <div
                                            onClick={() =>
                                                animationName
                                                    ? this.handleFocus({
                                                          stageType,
                                                          ...currentAnimate
                                                      })
                                                    : {}
                                            }>
                                            <Icon type='eqf-play-l' />
                                        </div>
                                    </div>
                                </div>
                                {animationName && (
                                    <div className={styles.animate_start}>
                                        <div>开始时间</div>
                                        {stageType === ANIMATION_TYPES.STAY && (
                                            <Tooltip title={"开始于进入动画结束后"}>
                                                <Icon className={styles.why} type='eqf-why-f' />
                                            </Tooltip>
                                        )}
                                        {stageType === ANIMATION_TYPES.STAY ? (
                                            <Input
                                                disabled={!animationName}
                                                scale={1000}
                                                step={100}
                                                max={2000}
                                                min={0}
                                                onChange={v =>
                                                    this.handleAnimateDataChange({
                                                        delay: v,
                                                        stageType
                                                    })
                                                }
                                                defaultValue={animateElement.delay || 0}
                                            />
                                        ) : (
                                            <div className={styles.desc}>{item.start}</div>
                                        )}
                                    </div>
                                )}
                                {animationName && (
                                    <div className={styles.animate_time}>
                                        <div>动画时长</div>
                                        <Input
                                            disabled={!animationName}
                                            scale={1000}
                                            step={100}
                                            max={2000}
                                            min={200}
                                            onChange={v =>
                                                this.handleAnimateChange({
                                                    animationDuration: v,
                                                    stageType
                                                })
                                            }
                                            defaultValue={animateElement.animationDuration || 0}
                                        />
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                {this.state.visible && <div className={styles.spaceLine} />}
                <Drawer
                    title={null}
                    placement='right'
                    closable={false}
                    onClose={this.onClose}
                    visible={this.state.visible}
                    getContainer={false}
                    mask={false}
                    width={200}>
                    {/*<div className={styles.subTabs}>*/}
                    {/*{this.tabs.map(tab => {*/}
                    {/*const active = activeTab === tab.index ? styles.active : '';*/}
                    {/*return <div*/}
                    {/*key={tab.index}*/}
                    {/*className={`${styles.tab} ${active}`}*/}
                    {/*onClick={() => this.changeActive(tab.index)}*/}
                    {/*>*/}
                    {/*<div>{tab.title}</div>*/}
                    {/*</div>;*/}
                    {/*})}*/}
                    {/*</div>*/}
                    <div className={styles.typesContainer}>
                        {/*{type !== CANVAS_TYPE.animateImg && <div*/}
                        {/*className={`${styles.types} ${styles.noAnimate} ${data.animate === undefined ? styles.activeNoAnimate : ''}`}*/}
                        {/*onMouseEnter={this.handleFocus}*/}
                        {/*onMouseLeave={this.handleBlur}*/}

                        {/*>*/}
                        {/*<div className={styles.icon}>*/}
                        {/*<div className={styles.line}/>*/}
                        {/*</div>*/}
                        {/*<div className={styles.title}>无动画</div>*/}
                        {/*</div>}*/}
                        {
                            <div className={styles.back} onClick={this.back}>
                                <Icon type='eqf-left' />
                                返回
                            </div>
                        }
                        {animationList.map(item => {
                            const animateElement = animate[activeTab] || {};
                            const position = [focusName, animateElement.animationName].includes(
                                item.name
                            )
                                ? item.hover
                                : item.icon;
                            return (
                                <div
                                    key={item.name}
                                    className={styles.types}
                                    onMouseEnter={() => this.handleFocus(item)}
                                    onMouseLeave={this.handleBlur}
                                    onClick={() =>
                                        this.handleAnimateDataChange({
                                            animationName: item.name,
                                            animationDuration:
                                                animateElement.animationDuration || item.duration,
                                            animationIteration: item.iteration,
                                            stageType: activeTab,
                                            delay: animateElement.delay || item.delay || 0
                                        })
                                    }>
                                    <div
                                        className={`${styles.icon}`}
                                        style={{
                                            background: `url(${animationIcon}) ${position}`
                                        }}></div>
                                    <div className={styles.title}>{item.title}</div>
                                </div>
                            );
                        })}
                        {animationList.length < 1 && "暂无可用动画"}
                    </div>
                </Drawer>
            </div>
        );
    }
}
