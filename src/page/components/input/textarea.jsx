import React, { useState, useRef, useEffect } from "react";
import { Input } from "antd";
import propsTypes from "prop-types";
import styles from "./textarea.less";
import { dbLength } from "../../../util/util";

const { TextArea } = Input;

function Textarea(props) {
    const {
        labelName = "文本",
        defaultValue,
        value: propsValue,
        disabled = false,
        onUnmount,
        maxLength,
        unicode = true,
        onChange = null,
        onBlur = null,
        outerStyle = {},
        verification,
        autoSize = true,
        ...otherProps
    } = props;
    const [value, setValue] = useState(defaultValue || propsValue);
    const [errorInfo, setErrorInfo] = useState(false);
    const selections = useRef(null);
    const textRef = useRef(null);
    let isComposition = false;
    useEffect(() => {
        if (propsValue !== undefined && propsValue !== value && !isComposition) {
            setValue(propsValue);
        }
        const inputSelection = selections.current;
        if (inputSelection) {
            // 在 didUpdate 时根据情况恢复光标的位置
            // 如果光标的位置小于值的长度，那么可以判定属于中间编辑的情况
            // 此时恢复光标的位置
            if (inputSelection.start < value.length) {
                const input = textRef.current.resizableTextArea.textArea;
                requestAnimationFrame(() => {
                    input.selectionStart = inputSelection.start;
                    input.selectionEnd = inputSelection.end;
                    selections.current = null;
                });
            }
        }
    }, [propsValue]);

    /**
     * 在不自动改变大小的框里监听滚动事件
     */
    useEffect(() => {
        if (!autoSize && textRef.current) {
            const element = textRef.current.resizableTextArea.textArea;
            const scrollKey = "scrollTop";
            // 鼠标滚动事件
            const wheelAction = wheelEvent => {
                let delta = null;
                const { deltaY, wheelDelta } = wheelEvent;
                delta = wheelDelta || -deltaY * 40;
                element[scrollKey] = element[scrollKey] + delta / 4;
            };
            element.addEventListener("wheel", wheelAction);
            return () => {
                element.removeEventListener("wheel", wheelAction);
            };
        }
    });

    useEffect(() => {
        return onUnmount || undefined;
    }, []);

    useEffect(() => {}, [value, verification]);

    async function inOnBlur(e) {
        if (typeof verification === "function") {
            const verifyData = verification(value);
            if (verifyData && !verifyData.res) {
                setErrorInfo(verifyData.message);
            } else {
                setErrorInfo(false);
            }
        }

        if (typeof onBlur === "function") {
            const res = await onBlur(e);
        }
        if (propsValue !== undefined && value !== propsValue) {
            setValue(propsValue);
        }
    }

    function onInput(e) {
        const {
            target: { value: newValue, selectionStart, selectionEnd }
        } = e;
        selections.current = {
            start: selectionStart,
            end: selectionEnd
        };
        if (typeof onChange === "function" && propsValue !== undefined && !isComposition) {
            onChange(newValue);
        } else {
            setValue(newValue);
        }
    }

    function compositionStart(e) {
        isComposition = true;
    }

    function compositionEnd(e) {
        isComposition = false;
        onChange(value);
        // onChange(newValue);
        // setValue(newValue);
        return;
    }

    function getUnicodeLength(str) {
        return ~~(dbLength(str) / 2);
    }

    function focusText() {
        let textNode = textRef.current;
        if (
            textNode &&
            textNode.resizableTextArea.textArea &&
            textNode.resizableTextArea.textArea
        ) {
            textNode = textNode.resizableTextArea.textArea;
            if (document.activeElement === textNode) return false;
            setTimeout(() => {
                if (getSelection && document.createRange) {
                    const range = document.createRange();
                    range.selectNodeContents(textNode);
                    range.collapse(true);
                    range.setStart(textNode, 0);
                    range.setEnd(textNode, textNode.childNodes.length);
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
        }
    }

    const length = unicode ? getUnicodeLength(value) : String(value).length;
    const isOverFlow = errorInfo || (maxLength && maxLength < length);
    return (
        <React.Fragment>
            <div
                className={`${styles.outer} ${isOverFlow ? styles.overFlow : ""}`}
                onClick={focusText}
                style={outerStyle}>
                <div className={`${styles.labelName}`}>{labelName}</div>
                {maxLength && (
                    <div className={styles.limitContent}>
                        {`${length}/`}
                        <span>{maxLength}</span>
                    </div>
                )}
                <TextArea
                    autoSize={autoSize}
                    disabled={disabled}
                    value={value || propsValue}
                    onBlur={inOnBlur}
                    onCompositionEnd={compositionEnd}
                    spellCheck={false}
                    ref={textRef}
                    onCompositionUpdate={compositionStart}
                    onChange={onInput}
                    {...otherProps}
                />
            </div>
            <div className={styles.errorInfo}>{errorInfo || ""}</div>
        </React.Fragment>
    );
}

Textarea.propsTypes = {
    labelName: propsTypes.oneOfType([propsTypes.string, propsTypes.element]),
    defaultValue: propsTypes.string,
    value: propsTypes.string,
    maxLength: propsTypes.number,
    onChange: propsTypes.func,
    onBlur: propsTypes.func,
    paddingOut: propsTypes.number,
    verification: propsTypes.func
};

export default Textarea;
