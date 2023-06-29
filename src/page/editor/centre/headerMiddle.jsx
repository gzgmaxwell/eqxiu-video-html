/* eslint-disable react/prop-types */
import React from "react";
import {  Tooltip, Switch, Input } from "antd";
import { connect } from "dva";
import styles from "../userEditor.less";
import styles1 from "./headerMiddle.less";
import Icon from "../../components/Icon";
import { isMac } from "../../../util/util";
import Layer from "./layer";
import eventEmitter from "../../../services/EventListener";
import { getUserSetting, setUserSetting } from "../../../util/storageLocal";
import Button from "../../components/Button";

@connect(({ workspace, editor, rules }) => ({
    havePos: !workspace.history.isFirstPos,
    haveNext: !workspace.history.isLastPos,
    nowIndex: editor.nowIndex,
    positionScale: editor.positionScale,
    transverse: editor.transverse,
    ruleIsShow: rules.ruleIsShow,
    gridIsShow: rules.gridIsShow,
    gridCountY: rules.gridCountY,
    gridCountX: rules.gridCountX
}))
class HeaderMiddle extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            layerMgr: false, // 图层显示，
            gridMgr: false,
            gridX: props.gridCountX || 3,
            gridY: props.gridCountY || 3,
            rulesMgr: false
        };
    }

    componentDidMount() {
        eventEmitter.on("activeLayerMgr", this.activeLayerMgr);
        window.addEventListener("resize", this.getMediaRate);
        setTimeout(this.getMediaRate, 800);
    }

    // static getDerivedStateFromProps(nextProps, prevState) {
    //     return { gridX: nextProps.gridCountX, gridY: nextProps.gridCountY };
    // }

    componentDidUpdate(prevState, prevProps) {
        if (this.state.gridMgr || this.state.rulesMgr) {
            document.addEventListener("mouseup", this.clickOther);
        }
    }

    componentWillUnmount() {
        eventEmitter.removeListener("activeLayerMgr", this.activeLayerMgr);
        window.removeEventListener("resize", this.getMediaRate);
        document.removeEventListener("mouseup", this.clickOther);
    }
    getMediaRate = () => {
        const {
            props: { transverse, dispatch }
        } = this;
        const height = transverse ? 315 : 560;
        const width = transverse ? 560 : 315;
        const { innerHeight, innerWidth } = window;
        const heightNum = transverse ? 250 + 57 : 230 + 57;
        const widthNum = 600 + innerWidth * 0.1;
        const widthScale = (innerWidth - widthNum) / width;
        let scale = 1;
        scale = (innerHeight - heightNum) / height;
        if (scale > widthScale) {
            scale = widthScale;
        }
        setUserSetting(`${transverse}_Scale`, scale);
        dispatch({
            type: "editor/scaleSave",
            payload: scale
        });
    };
    activeLayerMgr = () => {
        this.setState({ layerMgr: !this.state.layerMgr });
    };

    clickOther = e => {
        if (e.path.some(v => v.classList && Array.from(v.classList).includes("optionBox"))) return;
        this.setState({ gridMgr: false, rulesMgr: false });
        document.removeEventListener("mouseup", this.clickOther);
    };

    handleBack = back => {
        this.props.dispatch({
            type: "workspace/changeHistory",
            back
        });
    };
    handleLayerMgr = () => {
        eventEmitter.emit("activeLayerMgr");
    };

    handleScale = scale => {
        this.props.dispatch({
            type: "editor/changeScale",
            payload: { scale }
        });
    };

    handleRulesMgr = () => {
        this.setState({ rulesMgr: !this.state.rulesMgr });
    };

    handleGridMgr = () => {
        this.setState({ gridMgr: !this.state.gridMgr });
    };

    changeRuleShow = checked => {
        const {
            props: { dispatch }
        } = this;
        const type = checked ? "showRule" : "hiddenRule";
        dispatch({
            type: `rules/${type}`
        });
    };

    changeGridShow = checked => {
        const {
            props: { dispatch }
        } = this;
        const type = checked ? "showGrid" : "hiddenGrid";
        dispatch({
            type: `rules/${type}`
        });
    };

    clearRuleLines = () => {
        this.props.dispatch({
            type: "rules/clearRuleLines"
        });
    };

    onChangeGridX = ({ target: { value: payload } }) => {
        const d = this.props.dispatch({
            type: "rules/updateGridX",
            payload
        });
        setTimeout(() => {
            this.setState({ gridX: this.props.gridCountX });
        }, 300);
    };
    onChangeGridXByState = ({ target: { value: value } }) => {
        this.setState({ gridX: Number(value) || "" });
    };
    onChangeGridYByState = ({ target: { value: value } }) => {
        this.setState({ gridY: Number(value) || "" });
    };

    onChangeGridY = ({ target: { value: payload } }) => {
        this.props.dispatch({
            type: "rules/updateGridY",
            payload
        });

        setTimeout(() => {
            this.setState({ gridY: this.props.gridCountY });
        }, 300);
    };

    render() {
        const { state, props } = this;
        const { havePos, haveNext, positionScale = 1, ruleIsShow, gridIsShow } = props;
        const { gridX, gridY } = state;
        const placement = "left";
        return (
            <div className={styles.headerMiddleBody}>
                <div className={styles.list}>
                    <div>
                        <Tooltip
                            placement={placement}
                            title={`撤销 ${isMac ? "⌘Z" : "Ctrl Z"}`}
                            overlayClassName={styles.tooltip}>
                            <Icon
                                onClick={!havePos ? null : () => this.handleBack(true)}
                                type='eqf-back'
                                className={[styles.eqf_back, !havePos && styles.disabled]}
                            />
                        </Tooltip>
                    </div>
                    <div>
                        <Tooltip
                            placement={placement}
                            title={`恢复 ${isMac ? "⌘Y" : "Ctrl Y"}`}
                            overlayClassName={styles.tooltip}>
                            <Icon
                                onClick={!haveNext ? null : () => this.handleBack(false)}
                                type='eqf-rework'
                                className={[styles.eqf_rework, !haveNext && styles.disabled]}
                            />
                        </Tooltip>
                    </div>

                    <div>
                        <Tooltip
                            placement={placement}
                            title={state.layerMgr ? "隐藏图层面板" : "显示图层面板"}
                            overlayClassName={styles.tooltip}>
                            <Icon
                                onClick={this.handleLayerMgr}
                                type='eqf-layers-l'
                                className={[styles.layer__mgr, state.layerMgr && styles.onSelected]}
                            />
                        </Tooltip>
                        {state.layerMgr && (
                            <div style={{ width: 0 }}>
                                <Layer onClose={this.activeLayerMgr} />
                            </div>
                        )}
                    </div>
                    <div>
                        <Tooltip
                            placement={placement}
                            title={`网格`}
                            overlayClassName={styles.tooltip}>
                            <Icon
                                onClick={this.handleGridMgr}
                                type='eqf-net'
                                className={[styles.eqf_rework, state.gridMgr && styles.onSelected]}
                            />
                        </Tooltip>
                        {state.gridMgr && (
                            <div
                                className={`${styles1.gridMgrBox} optionBox`}
                                style={{ height: 172 }}>
                                <div className={styles1.gridInputBox}>
                                    <div>
                                        横格
                                        <Input
                                            value={gridX}
                                            onChange={this.onChangeGridXByState}
                                            onBlur={this.onChangeGridX}
                                        />
                                    </div>
                                    <div>
                                        纵格
                                        <Input
                                            value={gridY}
                                            onChange={this.onChangeGridYByState}
                                            onBlur={this.onChangeGridY}
                                        />
                                    </div>
                                </div>
                                <div className={styles1.gridSwitch}>
                                    显示网格{" "}
                                    <Switch
                                        size='small'
                                        checked={gridIsShow}
                                        onChange={this.changeGridShow}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    <div>
                        <Tooltip
                            placement={placement}
                            title={`标尺`}
                            overlayClassName={styles.tooltip}>
                            <Icon
                                onClick={this.handleRulesMgr}
                                type='eqf-ruler'
                                className={[styles.eqf_rework, state.rulesMgr && styles.onSelected]}
                            />
                        </Tooltip>
                        {state.rulesMgr && (
                            <div
                                className={`${styles1.rulesMgrBox} optionBox`}
                                style={{ height: 144 }}>
                                <div className={styles1.rulesSwitch}>
                                    显示标尺{" "}
                                    <Switch
                                        size='small'
                                        checked={ruleIsShow}
                                        onChange={this.changeRuleShow}
                                    />
                                </div>
                                <Button onClick={this.clearRuleLines}>清除参考线</Button>
                            </div>
                        )}
                    </div>
                    <div>
                        <Tooltip
                            placement={placement}
                            title={"适应屏幕尺寸"}
                            overlayClassName={styles.tooltip}>
                            <Icon
                                onClick={this.getMediaRate}
                                type='eqf-bigger'
                                className={[styles.eqf_rework]}
                            />
                        </Tooltip>
                    </div>
                    <div>
                        <Tooltip
                            placement={placement}
                            title={`放大 ${isMac ? "⌘＋" : "Ctrl ＋"}`}
                            overlayClassName={styles.tooltip}>
                            <Icon
                                onClick={positionScale >= 3 ? null : () => this.handleScale(+0.05)}
                                type='eqf-plus-l'
                                className={[styles.layer__scale]}
                            />
                        </Tooltip>
                    </div>
                    <div className={styles.scaleValue}>{Math.round(positionScale * 100)}%</div>
                    <div>
                        <Tooltip
                            placement={placement}
                            title={`缩小 ${isMac ? "⌘－" : "Ctrl －"}`}
                            overlayClassName={styles.tooltip}>
                            <Icon
                                onClick={
                                    positionScale <= 0.5 ? null : () => this.handleScale(-0.05)
                                }
                                type='eqf-minus-l'
                                className={[styles.layer__scale]}
                            />
                        </Tooltip>
                    </div>
                </div>
            </div>
        );
    }
}

export default HeaderMiddle;
