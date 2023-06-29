import React from "react";
import { connect } from "dva";
import styles from "./right.less";
import { Message } from "antd";
import { formatEQXMessage } from "Util/event.js";
import { certainFunction } from "Util/object.js";
import { filter, resetFilter } from "Util/data";
import AnimateFontSet from "./right/animateFont";
import AnimateImgSet from "./right/animateImg";
import CustomVideoSet from "./right/video/custom";
import LegalCopyVideoSet from "./right/video/legalCopy";
import SpecialEffectSet from "./right/video/specialEffectSet";
import ArtFontSet from "./right/artFont";
import TimeSet from "./right/timeSet";
import { CANVAS_TYPE, CANVAS_TYPE_NAME, TimeSetVideoType } from "../../config/staticParams";
import MateriaList from "../editor/right/materiaList";
import GifSet from "./right/image/gifSet";
import Empty from "../components/empty";
import LeftParty from "./LeftParty";
import eventEmitter from "../../services/EventListener";
import Ornament from "./right/video/ornament";
import Clad from "./right/clad/index";
import ElemGroup from "./right/group/elemGroup";
import UserMarkRight from "./right/userMaket";
import { USER_MARKET_NAME } from "../../config/staticParams/userMarket";

const titps = <div className={styles.noOption}>暂不支持编辑，敬请期待</div>;
const noOption = { marginTop: 40 };

/**
 * 用于组件直接链接model
 * @param ele
 * @return {*}
 */
export function connectActiveElement(ele) {
    return connect(({ workspace }) => ({ data: workspace.dataList[workspace.activeIndex] || {} }))(
        ele
    );
}

const tabList = [
    {
        [CANVAS_TYPE.text]: {
            label: "文本",
            component: connectActiveElement(AnimateFontSet)
        },
        [CANVAS_TYPE.img]: {
            label: "图片",
            component: connectActiveElement(AnimateImgSet)
        },
        [CANVAS_TYPE.animateImg]: {
            label: "动画图",
            component: connectActiveElement(AnimateImgSet)
        },
        [CANVAS_TYPE.templateVideo]: {
            label: "素材编辑",
            component: LegalCopyVideoSet
        },
        [CANVAS_TYPE.userVideo]: {
            label: "上传视频",
            component: CustomVideoSet
        },
        [CANVAS_TYPE.userVideoNew]: {
            label: "上传视频",
            component: CustomVideoSet
        },
        [CANVAS_TYPE.specialText]: {
            label: "特效字",
            component: SpecialEffectSet
        },
        [CANVAS_TYPE.spacialImg]: {
            label: "特效图",
            component: SpecialEffectSet
        },
        [CANVAS_TYPE.artFont]: {
            label: "艺术字",
            component: connectActiveElement(ArtFontSet)
        },
        [CANVAS_TYPE.animateFont]: {
            label: "动画字",
            component: connectActiveElement(AnimateFontSet)
        },
        [CANVAS_TYPE.ornament]: {
            label: "装饰",
            component: connectActiveElement(Ornament)
        },
        [CANVAS_TYPE.clad]: {
            label: "覆层",
            component: connectActiveElement(Clad)
        },
        [CANVAS_TYPE.dynamicBg]: {
            label: "背景",
            component: () => <Empty text={titps} style={noOption} />
        },
        [CANVAS_TYPE.realShoot]: {
            label: "视频素材",
            component: () => <CustomVideoSet haveSound={false} canChange={false} />
        },
        [CANVAS_TYPE.gif]: {
            label: "动图",
            component: GifSet
        },
        [CANVAS_TYPE.userMarket]: {
            label: CANVAS_TYPE_NAME[CANVAS_TYPE.userMarket],
            component: UserMarkRight
        }
    },
    {
        label: "片段列表",
        component: LeftParty,
        component1: LeftParty
    }
];

/**
 * 编辑器右边的组件   改变图片的顺序为   before||on =>    open => message => cropper => after
 *                                  配置参数和index   打开模态框 监听       裁剪       保存
 */
@connect(({ workspace }) => {
    const { activeIndex, activeIndexes, groupList = [], dataList } = workspace;
    const oldChoseMulti =
        (activeIndexes && activeIndexes.length > 1) ||
        (groupList.find(v => v.active) && !activeIndex && true);
    // 组隐藏/锁定
    const groupLayer = !!(groupList.find(v => v.active) || {}).visibility === "hidden";
    const choseMulti = oldChoseMulti && !groupLayer;
    const activeData = dataList[activeIndex] || {};
    const choseType = choseMulti ? "multi" : activeData.type;
    let label = (tabList[0][choseType] || {}).label || "组件";
    if (choseType === CANVAS_TYPE.userMarket) {
        label = USER_MARKET_NAME[activeData.componentType] || "营销组件";
    }
    return {
        choseMulti,
        choseType,
        label
    };
})
class RightSide extends React.PureComponent {
    constructor(props) {
        super(props);
        // this.iframe = React.createRef();
        this.voice = React.createRef();
        this.bgm = React.createRef();
        this.animationTimer = null;
    }

    state = {
        activeTab: 2,
        activeType: null,
        activeSubTab: 1,
        layerLock: false,
        animationing: false
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        const { choseType: type } = nextProps;
        const activeSubTab = type === CANVAS_TYPE.templateVideo ? 0 : 1;
        const newState = {
            activeType: type,
            activeSubTab,
            activeTab: type ? 0 : 1
        };
        return newState;
    }

    componentDidMount() {
        // eventEmitter.on('activeType', this.changeTabByEvent);
        eventEmitter.on("layerLockGroupEvent", this.lockGrounpListener);
        setTimeout(() => eventEmitter.addListener("editorInit", this.forceRefer), 300);
    }

    // shouldComponentUpdate(nextProps, nextState) {
    //     if (!isEqual(this.state, nextState)) {
    //         return true;
    //     }
    //
    //     if (contrast(this.props, nextProps, [
    //         'workspace.activeIndex',
    //     ])) {
    //         return true;
    //     }
    //     const { workspace: { dataList, activeIndex } } = this.props;
    //     const { workspace: { dataList: nextDataList, activeIndex: nextAtiveIndex } } = nextProps;
    //     const dataListElement = dataList[activeIndex] || {};
    //     const nextDataListElement = nextDataList[nextAtiveIndex] || {};
    //     if (!isEqual(dataListElement, nextDataListElement)) {
    //         return true;
    //     }
    //     if (!isEqual(dataListElement.animate, nextDataListElement.animate)) {
    //         return true;
    //     }
    //     return false;
    // }
    static getDerivedStateFromError() {
        return {
            activeTab: 2,
            activeType: null,
            activeSubTab: 1
        };
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.activeType !== prevState.activeType) {
            let animationing = 1;
            if (this.state.activeType === undefined) {
                animationing = 2;
            }
            clearTimeout(this.animationTimer);
            this.setState({ animationing: animationing }, () => {
                clearTimeout(this.animationTimer);
                this.animationTimer = setTimeout(() => {
                    this.setState({ animationing: false });
                }, 600);
            });
        }
    }

    componentDidCatch(e) {
        console.log(e);
    }

    componentWillUnmount() {
        eventEmitter.removeListener("activeType", this.changeTabByEvent);
        eventEmitter.removeListener("layerLockGroupEvent", this.lockGrounpListener);
        eventEmitter.removeListener("editorInit", this.forceRefer);
    }

    forceRefer = () => {
        setTimeout(() => {
            this.forceUpdate();
        }, 300);
    };

    lockGrounpListener = lock => {
        this.setState({
            layerLock: lock
        });
    };

    changeTab = (index = 2) => {
        this.setState({ activeTab: index });
    };
    changeTabByEvent = type => {
        const activeSubTab = type === CANVAS_TYPE.templateVideo ? 0 : 1;
        this.setState({
            activeType: type,
            activeSubTab
        });
        if (type !== null) {
            this.changeTab(0);
        } else {
            this.changeTab(1);
        }
    };
    tabClick = index => {
        this.setState({ activeSubTab: index });
    };
    changeNow = payload => {
        return this.props.dispatch({
            type: "workspace/changeNow",
            payload
        });
    };

    render() {
        const {
            props: { choseMulti, label, ...props },
            state: { activeType, animationing, ...state },
            state: { layerLock }
        } = this;
        const ActiveComponent =
            state.activeTab === 0 ? tabList[0][activeType] : tabList[state.activeTab];
        const PartyList = tabList[1].component;
        const showSubTab = state.activeTab === 0 && TimeSetVideoType.includes(activeType);
        const showTip = false;
        const height =
            !ActiveComponent || ActiveComponent.label === "片段列表"
                ? `calc(100vh - 56px)`
                : `calc(100vh - 96px)`;
        // const label = activeType===CANVAS_TYPE.userMarket? :ActiveComponent.label;
        let boxStyle = { overflow: "hidden" };
        if (animationing === 1) {
            boxStyle = { animation: "slideInLeft 600ms", overflow: "hidden" };
        } else if (animationing == 2) {
            boxStyle = { animation: "fadeBigOutRight 600ms", overflow: "hidden" };
        }
        // 组合元素
        return (
            <div className={styles.toolsBodyOut}>
                <div
                    className={styles.toolsBody}
                    style={{
                        position: "relative"
                    }}>
                    {(state.activeTab === 1 || animationing) && <PartyList />}
                    {(state.activeTab === 0 || animationing) && (
                        <div className={styles.functionBox} style={boxStyle}>
                            {/*选中元素才有标题*/}
                            {// state.activeTab === 0 && ActiveComponent.component && !choseMulti &&
                            state.activeTab === 0 &&
                                ((ActiveComponent && ActiveComponent.component) || choseMulti) && (
                                    <div className={styles.titleBar}>
                                        {choseMulti ? "组件" : label}
                                    </div>
                                )}
                            {/*是否显示提示*/}
                            {showTip && (
                                <div className={styles.tip}>
                                    <div className={styles.text}>
                                        提示：正版视频、特效字、特效图生成视频后，内容才被替换。
                                    </div>
                                </div>
                            )}
                            {showSubTab && state.activeSubTab === 0 && <MateriaList />}
                            {((showSubTab && state.activeSubTab === 1) || !showSubTab) && (
                                <div className={styles.contentDiv} style={{ height }}>
                                    {choseMulti && !layerLock ? (
                                        <ElemGroup />
                                    ) : (
                                        state.activeTab === 0 && (
                                            <ActiveComponent.component
                                                type={activeType}
                                                changeNow={this.changeNow}
                                            />
                                        )
                                    )}
                                </div>
                            )}
                            {showSubTab && state.activeSubTab === 2 && <TimeSet />}
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

export default RightSide;
