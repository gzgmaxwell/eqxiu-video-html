import React, { Component } from "react";
import { delay } from "../../../util/delayLoad";
import styles from "./scrollInput.less";
import { Tooltip } from "antd";
import Icon from "../../userCentre";
import { TYPE_SCROLL_INPUT } from "../../../config/staticParams/goodsParams";
import { time2fs } from "../../../util/util";

export default class ScrollInput extends Component {
    constructor(props) {
        super(props);
        this.input = React.createRef();
        this.changeX = 0;
        this.state = {
            focus: false
        };
    }

    componentDidMount() {
        this.input.current.addEventListener("mousedown", this.handleMouseDown);
        this.input.current.addEventListener("input", this.handleInput);
    }

    handleMouseDown = e => {
        const { type = TYPE_SCROLL_INPUT.line_height } = this.props;
        this.startX = e.clientX;
        if (type === TYPE_SCROLL_INPUT.line_height) {
            this.defaultValue = Number(this.input.current.value.replace(/[^0-9]/gi, "")) || 0;
        } else if (type === TYPE_SCROLL_INPUT.mm_ss) {
            this.defaultValue = this.props.time;
        }
        document.addEventListener("mousemove", this.handleMouseMove);
        document.addEventListener("mouseup", this.handleMouseUp);
    };
    handleInput = e => {
        if (this.props.disabled) return;
        let value = e.target.value;
        if (isNaN(value)) {
            value = parseInt(value) || 0;
        }
        this.input.current.value = value;
        this.props.onChange(value);
    };
    handleMouseUp = e => {
        document.removeEventListener("mousemove", this.handleMouseMove);
        document.removeEventListener("mouseup", this.handleMouseUp);
    };
    handleMouseMove = e => {
        if (this.props.disabled) return;
        e.stopPropagation();
        e.preventDefault();
        const { scale = 0.4, step = 1 } = this.props;
        this.changeX = parseInt((e.clientX - this.startX) * scale) || 0;
        this.startX = e.clientX;
        const value = this.defaultValue + this.changeX * step;
        this.defaultValue = value;
        this.setValue(value);
    };
    onFocus = () => {
        const { type = TYPE_SCROLL_INPUT.line_height, position } = this.props;
        if (type === TYPE_SCROLL_INPUT.mm_ss) {
            this.setState({ focus: true });
            document.onkeydown = event => {
                let e = event;
                const value = this.props.time;
                if (e && e.keyCode === 37) {
                    this.setValue(value - 0.1, type);
                }

                if (e && e.keyCode === 39) {
                    this.setValue(value + 0.1, type);
                }
            };
        }
    };
    onBlur = () => {
        this.setState({ focus: false });
    };
    setValue = (value, type = TYPE_SCROLL_INPUT.line_height) => {
        const { max = 100, min = 0, step = 1, valueSuffix = "" } = this.props;
        const length = String(step).length - String(step).indexOf(".") - 1 || 0;
        let number = Math.min(max, Math.max(min, value)) || 0;
        if (length > 1) {
            number = number.toFixed(length);
        }
        if (type === TYPE_SCROLL_INPUT.line_height) {
            this.input.current.value = `${number}${valueSuffix}`;
        } else if (type === TYPE_SCROLL_INPUT.mm_ss && this.state.focus) {
            this.input.current.value = time2fs(number);
        }
        if (type === TYPE_SCROLL_INPUT.mm_ss) {
            const index = this.input.current.getAttribute("index");
            if (this.state.focus) {
                this.props.handleOnKeyDown(number, index, this.props.position);
            }
            return;
        }
        this.props.onChange(number);
    };

    render() {
        const {
            overlayStyle = 130,
            trigger = "hover",
            index,
            title = "左右拖动改变大小",
            placement = "bottom",
            defaultValue,
            onChange,
            valueSuffix,
            ...props
        } = this.props;
        return (
            <Tooltip
                trigger={trigger}
                title={title}
                placement={placement}
                overlayStyle={{ width: overlayStyle, fontSize: "12px" }}>
                <input
                    index={index}
                    onFocus={this.onFocus}
                    onBlur={this.onBlur}
                    defaultValue={defaultValue || 0}
                    {...props}
                    className={`${styles.input} ${this.state.focus ? styles.active : ""}`}
                    ref={this.input}
                />
            </Tooltip>
        );
    }
}

export function ScrollTextInput(props) {
    const { leftWidth, title, ...others } = props;
    return (
        <div className={styles.opacityInput}>
            <div className={styles.title} style={{ width: leftWidth }}>
                {title}：
            </div>
            <ScrollInput style={{ border: "unset!important" }} {...others} />
        </div>
    );
}
