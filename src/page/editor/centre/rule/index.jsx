import React, { useState, useEffect, useRef } from "react";
import styles from "./index.less";
import { connect } from "dva";
import LineBox from "./lineBox";
import { createUUID } from "../../../../util/data";

let devicePixelRatio = window.devicePixelRatio;

function RulesBox({ mainScale = 1, ruleIsShow, addX, addY, updata, remove }) {
    const px1 = 0;
    const unit = 10 * devicePixelRatio;
    const unitScale = unit * mainScale;
    const fontTop = 4;
    const fontWidth = 50 * devicePixelRatio;
    const fontSize = 12 * devicePixelRatio;
    const boxRef = useRef(null);
    const canvasYRef = useRef(null);
    const canvasXRef = useRef(null);
    function drawLeft() {
        const pageRect = document.getElementById("workspace").getBoundingClientRect();
        const workspaceRect = boxRef.current.getBoundingClientRect();
        const width = 20 * devicePixelRatio;
        const height = workspaceRect.height * devicePixelRatio * Math.max(mainScale, 1) - width;
        const origin = (pageRect.top - workspaceRect.top) * devicePixelRatio;
        const ctx = initCtx(canvasYRef.current, width, height);

        // 画右边的竖线
        ctx.moveTo(width - devicePixelRatio + 1 - px1, 0);
        ctx.lineTo(width - devicePixelRatio + 1 - px1, height);

        const renderRuler = i => {
            const y = Math.round(origin + i * unitScale);
            if (i % 10 === 0) {
                ctx.moveTo(0, y - px1);
                ctx.lineTo(width, y - px1);

                // 旋转文字
                ctx.save();
                ctx.translate(fontTop - 4, y - 4 + fontTop);
                ctx.rotate((Math.PI / 180) * 270);
                ctx.translate(-(fontTop - 4), -(y - 4 + fontTop));
                ctx.fillText(
                    (i * unit) / devicePixelRatio,
                    fontTop,
                    y + fontTop,
                    fontWidth * devicePixelRatio
                );
                ctx.restore();
            } else if (i % 5 === 0) {
                ctx.moveTo(width * 0.5, y - px1);
                ctx.lineTo(width, y - px1);
            } else {
                ctx.moveTo(width * 0.75, y - px1);
                ctx.lineTo(width, y - px1);
            }
        };
        // 画正刻度
        for (
            let i = 0;
            i <= ((workspaceRect.bottom - pageRect.top) * devicePixelRatio) / unitScale;
            i++
        ) {
            renderRuler(i);
        }
        // 画负刻度
        for (
            let i = 0;
            i >= ((workspaceRect.top - pageRect.top) * devicePixelRatio) / unitScale;
            i--
        ) {
            renderRuler(i);
        }
        ctx.stroke();
    }
    function drawTop() {
        const pageRect = document.getElementById("workspace").getBoundingClientRect();
        const workspaceRect = boxRef.current.getBoundingClientRect();
        const height = 20 * devicePixelRatio;
        const width = workspaceRect.width * devicePixelRatio;
        const origin = (pageRect.left - workspaceRect.left) * devicePixelRatio;
        const ctx = initCtx(canvasXRef.current, width, height);

        // 画底部的横线
        ctx.moveTo(0, height - devicePixelRatio + 1 - px1);
        ctx.lineTo(width, height - devicePixelRatio + 1 - px1);

        const renderRuler = i => {
            const x = Math.round(origin + i * unitScale);
            if (i % 10 === 0) {
                // 大刻度
                ctx.moveTo(x - px1, 0);
                ctx.lineTo(x - px1, height);

                ctx.fillText(
                    (i * unit) / devicePixelRatio,
                    x + fontTop,
                    fontTop,
                    fontWidth * devicePixelRatio
                );
            } else if (i % 5 === 0) {
                // 中刻度
                ctx.moveTo(x - px1, height * 0.5);
                ctx.lineTo(x - px1, height);
            } else {
                // 小刻度
                ctx.moveTo(x - px1, height * 0.75);
                ctx.lineTo(x - px1, height);
            }
        };
        // 画正刻度
        for (
            let i = 0;
            i <= ((workspaceRect.right - pageRect.left) * devicePixelRatio) / unitScale;
            i++
        ) {
            renderRuler(i);
        }
        // 画负刻度
        for (
            let i = 0;
            i >= ((workspaceRect.left - pageRect.left) * devicePixelRatio) / unitScale;
            i--
        ) {
            renderRuler(i);
        }
        ctx.stroke();
    }
    useEffect(() => {
        if (ruleIsShow) {
            function draw() {
                drawLeft();
                drawTop();
            }
            draw();
            window.addEventListener("resize", draw);
            return () => {
                window.removeEventListener("resize", draw);
            };
        }
    }, [ruleIsShow, mainScale]);
    function initCtx(canvas, width, height) {
        const ctx = canvas.getContext("2d");
        canvas.width = width;
        canvas.height = height;
        Object.assign(canvas.style, {
            width: width / devicePixelRatio + "px",
            height: height / devicePixelRatio + "px"
        });

        // 画背景
        ctx.fillStyle = "#F6F9FA";
        ctx.fillRect(0, 0, width, height);

        // 设置画刻度的样式
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textBaseline = "top";
        ctx.lineWidth = 1 * devicePixelRatio;
        ctx.fillStyle = "#A3AFB7";
        ctx.strokeStyle = "#CCD5DB";

        return ctx;
    }

    function onMouseEnter(event) {
        const pageRect = document.getElementById("workspace").getBoundingClientRect();
        const workspaceRect = boxRef.current.getBoundingClientRect();
        const { clientX, clientY, target } = event;
        const isY = target === canvasXRef.current;
        const type = isY ? "y" : "x";
        let downFlag = false;
        let value = (clientY - pageRect.top) / mainScale;
        const uuid = createUUID();
        if (isY) {
            value = (clientX - pageRect.left) / mainScale;
            addY({ position: value, active: true, uuid });
        } else {
            addX({ position: value, active: true, uuid });
        }
        function mouseMove(moveEvent) {
            const { clientX: moveX, clientY: moveY } = moveEvent;
            const value = type === "x" ? moveY : moveX;
            const key = type === "y" ? "left" : "top";
            const newPos = (value - pageRect[key]) / mainScale;
            updata({ position: newPos, uuid, type, active: true });
        }

        function mouseDown(upEvent) {
            downFlag = true;
            updata({ uuid, type, active: false });
            document.removeEventListener("mousemove", mouseMove);
        }

        function mouseLeave() {
            if (!downFlag) {
                remove({ uuid, type });
            }
            document.removeEventListener("mousemove", mouseMove);
            document.removeEventListener("mousedown", mouseDown);
            target.removeEventListener("mouseleave", mouseLeave);
        }

        document.addEventListener("mousemove", mouseMove);
        document.addEventListener("mousedown", mouseDown);
        target.addEventListener("mouseleave", mouseLeave);
    }

    return (
        <div className={styles.box} ref={boxRef}>
            {ruleIsShow && (
                <React.Fragment>
                    <div className={styles.square} />
                    <canvas
                        onMouseEnter={onMouseEnter}
                        ref={canvasYRef}
                        className={[styles.canvas, styles.y].join(" ")}
                    />
                    <canvas
                        onMouseEnter={onMouseEnter}
                        ref={canvasXRef}
                        className={[styles.canvas, styles.x].join(" ")}
                    />
                </React.Fragment>
            )}
            <LineBox />
        </div>
    );
}

function mapStateToProps({ editor: { positionScale = 1 }, rules: { ruleIsShow } }) {
    return { mainScale: positionScale, ruleIsShow };
}

function addX(payload) {
    return {
        type: "rules/addX",
        payload
    };
}
function addY(payload) {
    return {
        type: "rules/addY",
        payload
    };
}
function updata(payload) {
    return {
        type: "rules/updateRuleLine",
        payload
    };
}

function remove(payload) {
    return {
        type: "rules/removeRuleLine",
        payload
    };
}

export default connect(mapStateToProps, { addX, addY, updata, remove })(RulesBox);
