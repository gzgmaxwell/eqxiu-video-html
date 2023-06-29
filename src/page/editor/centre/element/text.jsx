import React from "react";
import { connect } from "dva";
import { isEqual } from "lodash";
import { Icon, message } from "antd";
import ResizeComponent, {
    needProperty as ResizeTextNeed,
    needProperty as ResizeNeedProperty
} from "../../../components/resizeComponent";
import { CANVAS_TYPE } from "../../../../config/staticParams";
import { getArtFontCss } from "../../../../util/style";
import styles from "./text.less";
import { contrast } from "../../../../util/data";
import { initElementProps } from "../workspace";
import { onInitAnimation } from "../../../../services/animation";
import { isEqualBy } from "../../../../util/object";
import animeJs from "animejs";

let anchorOffset = 0;

export const needProperty = {
    ...ResizeNeedProperty,
    lineHeight: 1,
    type: 1,
    artJson: {},
    fontSize: 1,
    wordBreak: "",
    content: "",
    fontFamily: "",
    color: "",
    backgroundColor: "",
    lock: false,
    fontStyle: "unset",
    textDecoration: "unset",
    fontWeight: "unset",
    textAlignLast: "",
    textAlign: "",
    letterSpacing: 1,
    animate: null,
    animationName: "",
    animationDuration: null,
    animationIteration: null,
    animationState: "unset"
};

@connect((...params) => {
    const { loading } = params[0];
    const other = initElementProps(...params);
    return { effects: loading.effects, ...other };
})
class ResizeText extends React.Component {
    constructor(props) {
        super(props);
        this.isWork = props.isWork || false;
        this.text = React.createRef();
        this.outer = React.createRef();
        this.orginzIndex = 0;
        this.height = props.height || 21;
        this.setTimeouer = null;
        if (props.onRef) {
            props.onRef(this);
        }
    }

    state = {
        showInput: false,
        height: null
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        const newState = {};
        if (!nextProps.resizeprops.active && prevState.showInput) {
            // 失去激活时候关闭输入
            newState.showInput = false;
        }
        return newState;
    }
    componentDidMount() {
        this.onSaveElement();
        this.initAnimation();
    }

    componentDidUpdate(prevProps, prevState) {
        const textNode = this.text.current;
        const {
            props: {
                resizeprops: { paramsData: { height: propsHeight = 0 } = {} } = {},
                borderWidth = 0,
                animationSpecialValue,
                animetionCurrent
            } = {},
            state: { height }
        } = this;
        const {
            props: { resizeprops: { paramsData: { height: prevHeight = 0 } = {} } = {} } = {}
        } = prevProps;
        if (!textNode) {
            return;
        }
        // 重新初始话动画
        if (prevProps.animationSpecialValue !== animationSpecialValue) {
            this.initAnimation();
        }
        if (this.animeJs && prevProps.animetionCurrent !== animetionCurrent) {
            this.animeJs.seek(animetionCurrent * 1000);
        }
        // 高度重绘
        if (propsHeight !== prevHeight && 2 * borderWidth + textNode.offsetHeight !== height) {
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({ height: 2 * borderWidth + textNode.offsetHeight });
        }
        if (prevState.showInput && !this.state.showInput) {
            // 关闭输入框
            textNode.parentNode.style.zIndex = this.orginzIndex;
            textNode.contentEditable = "false";
            this.text.current.oninput = "";
            this.props.onBeforeChangeActive();
            document.addEventListener("keydown", this.props.onKeyDown);
        }
        if (prevState.showInput === false && this.state.showInput) {
            // this.text.current.classList.remove('no-select');
        }
        if (
            prevProps.content !== this.props.content &&
            this.state.showInput &&
            this.props.content.length > 0 &&
            anchorOffset
        ) {
            // 用来重新定位光标
            try {
                const text = textNode.childNodes[0];
                const range = document.createRange();
                range.setEnd(text, anchorOffset);
                range.setStart(text, anchorOffset);
                const sel = getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
                anchorOffset = null;
            } catch (e) {
                // eslint-disable-next-line no-console
                console.log(e);
            }
        }
        this.onSaveElement();
        if (
            !isEqualBy(this.props, prevProps, [
                "animationName",
                "animationDuration",
                "animationIteration"
            ])
        ) {
            this.initAnimation();
        }
    }

    componentWillUnmount() {}

    animeJs = null;
    /**
     * 初始化动画
     */
    initAnimation = async () => {
        const {
            props: { animetionTimeLineParams, animetionCurrent, animetionTotalDuation },
            text
        } = this;
        if(this.animeJs){
          this.animeJs.seek(0);
        }
        this.animeJs = await onInitAnimation(
            text.current,
            animetionTotalDuation,
            animetionTimeLineParams
        );
        if (this.animeJs) {
            // this.animeJs.seek();
            this.animeJs.seek(animetionCurrent * 1000);
            // this.animeJs.play();
        }
    };

    onSaveElement = () => {
        if (this.text.current && typeof this.props.onSaveELements === "function") {
            this.props.onSaveELements(this.text.current.parentNode);
        }
        // document.addEventListener('keydown', this.props.onKeyDown);
    };
    // eslint-disable-next-line react/sort-comp
    dbClickCount = 0;
    onMouseDown = e => {
        if (
            !this.state.showInput &&
            typeof this.props.resizeprops.onMouseDown === "function" &&
            !this.props.lock
        ) {
            this.dbClickCount += 1;
            // 在300毫秒内双击
            setTimeout(() => {
                this.dbClickCount = 0;
            }, 300);
            if (this.dbClickCount >= 2) {
                // active会重新渲染，其实就一次
                this.showInput();
            }
            this.props.resizeprops.onMouseDown(e);
        }
    };
    onChangeText = () => {
        if (!this.text.current) return;
        let content = this.text.current.innerText
            .replace(/\r?\n/g, "<br>")
            .replace(/\s/g, "&nbsp;")
            .replace(/style=".*"/g, "");
        if (!content) {
            content = "双击替换文本";
            this.text.current.innerText = "双击替换文本";
        }
        const width = this.text.current.offsetWidth;
        if (this.props.content === content) return true;
        anchorOffset = getSelection();
        this.onChange({
            content,
            width
        });
        return true;
    };
    onInputText = () => {
        const textNode = this.text.current;
        if (
            this.textLength < textNode.innerHTML.length && // 文本长度增加
            textNode.innerText.length > 255 // 文本长度 > 255
        ) {
            message.error("文字不能超过255个字符");
            textNode.innerText = textNode.innerText.substring(0, 255);
        }
        this.textLength = textNode.innerHTML.length;
        const { padding = 0, borderWidth = 0, autoWidth = false } = this.props;
        if (!textNode) return;
        const height = textNode.offsetHeight + (padding + borderWidth) * 2;
        textNode.parentNode.previousElementSibling.style.height = `${height}px`;
        textNode.parentNode.style.height = `${height}px`;
        if (autoWidth && textNode.parentNode.previousSibling) {
            textNode.parentNode.previousSibling.style.width = `${textNode.offsetWidth + 2}px`;
        }
    };
    // 改变事件拦截
    onChange = oriState => {
        const {
            props: { padding, borderWidth = 0, resizeprops: { onChange = () => {} } = {} }
        } = this;
        const state = oriState;
        if (this.state.showInput) {
            delete state.left;
            delete state.top;
        }
        const textNode = this.text.current;
        if (textNode) {
            clearTimeout(this.setTimeouer);
            this.setTimeouer = setTimeout(() => {
                const height = textNode.offsetHeight + 2 * (padding + borderWidth);
                // this.setState({ height });
                if (height) {
                    onChange({ height }, false);
                }
            }, 300);
        }
        return onChange(state, false);
    };
    showInput = () => {
        if (this.state.showInput) return;
        this.orginzIndex = this.text.current.parentNode.style.zIndex;
        this.text.current.parentNode.style.zIndex = 9999;
        this.text.current.parentNode.style.userSelect = "text";
        this.text.current.contentEditable = "true";
        this.text.current.oninput = this.onInputText;
        this.text.current.onblur = this.onBlur;
        this.props.onBeforeChangeActive(this.onChangeText);
        this.setState({ showInput: true }, this.selectAllContent);
    };
    onBlur = e => {
        const textNode = this.text.current;
        textNode.parentNode.style.zIndex = this.orginzIndex;
        textNode.contentEditable = "false";
        this.text.current.oninput = "";
        this.props.onBeforeChangeActive();
        this.text.current.onblur = "";
        this.onChangeText(e);
        this.setState({ showInput: false });
    };
    /**
     * 选中所有文字
     * @param {*}
     */
    selectAllContent = () => {
        const textNode = this.text.current;
        setTimeout(() => {
            if (getSelection && document.createRange) {
                const range = document.createRange();
                range.selectNodeContents(textNode);
                range.collapse(true);
                range.setEnd(textNode, textNode.childNodes.length);
                range.setStart(textNode, 0);
                const sel = getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            } else if (document.body.createTextRange) {
                const range = document.body.createTextRange();
                range.moveToElementText(textNode);
                range.collapse(true);
                range.select();
            }
            textNode.focus();
        }, 1);
    };
    beforeresize = () => {
        // this.text.current.classList.add('no-select');
    };

    render() {
        const {
            state: { showInput, height },
            props: {
                resizeprops: { paramsData = {}, limit, onMouseDown, ...resizeprops },
                content = "",
                fontSize,
                padding = 0,
                color,
                backgroundColor,
                borderWidth = 0,
                lineHeight = 1.5,
                artJson,
                animationName,
                animationDuration,
                animationIteration,
                animationState,
                elementprops,
                type,
                index,
                loading,
                wordBreak = null,
                autoWidth = false,
                effects,
                ...props
            }
        } = this;
        const downloadFont = effects["workspace/downloadFont"];

        const newContent = content.replace(/style=".*"/g, "");
        paramsData.height = height || this.height;
        // paramsData.width = autoWidth
        //     && this.text.current && this.text.current.offsetWidth
        //     || paramsData.width;
        const textWidth = autoWidth ? "max-content" : "fit-content";
        if (limit) {
            limit.width[0] = Math.max(limit.width, fontSize + 2 * padding);
        }
        const otherStyles = {
            ...props,
            borderWidth,
            width: autoWidth ? "fit-content" : props.width,
            height: paramsData.height,
            color,
            backgroundColor,
            fontSize,
            padding,
            lineHeight,
            wordBreak: wordBreak || "break-word",
            caretColor: ["#000000", "rgba(0,0,0,0)"].includes(backgroundColor) ? "#fff" : "#000"
        };
        if (showInput) {
            delete elementprops.banMove;
            resizeprops.banMove = true;
        }
        resizeprops.beforeresize = this.beforeresize;
        let artFontCss = {};
        if (type === CANVAS_TYPE.artFont) {
            artFontCss = getArtFontCss(artJson);
        }
        const showdot = autoWidth ? [] : ["E", "W"];
        return (
            <ResizeComponent
                {...resizeprops}
                fixedaspectratio={0}
                showdot={showdot}
                paramsData={paramsData}
                limit={limit}
                ref={this.outer}
                autoWidth={autoWidth}
                index={index}
                onMouseDown={this.onMouseDown}
                onInput={this.onChangeText}
                otherStyle={otherStyles}
                onChange={this.onChange}>
                {downloadFont && <Icon type='loading' className={styles.loading} />}
                <div
                    {...elementprops}
                    id={`element_${props.uuid}`}
                    role='presentation'
                    ref={this.text}
                    onBlur={this.onBlur}
                    style={{
                        ...artFontCss,
                        minHeight: 20,
                        minWidth: "100%",
                        wordBreak: otherStyles.wordBreak,
                        width: textWidth,
                        // animation: animationName
                        //   ? `${animationName} ${animationDuration}ms ${animationIteration}`
                        //   : "unset",
                        // animationPlayState: animationState || "running"
                    }}
                    className={[
                        elementprops.className || "",
                        styles.textInput,
                        showInput ? "" : "no-select",
                        "globalFontFamily workspace__el"
                    ].join(" ")}
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{ __html: newContent }}
                />
            </ResizeComponent>
        );
    }
}

export default ResizeText;
