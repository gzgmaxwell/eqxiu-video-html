import React, { useState, useRef, useEffect } from "react";
import styles from "./index.less";
import { connect } from "dva";

function LineBox({
    yArray = [],
    xArray = [],
    captureXArray,
    captureYArray,
    mainScale,
    updata,
    remove
}) {
    const bodyRef = useRef(null);
    const [parentRect, setParentReact] = useState({});
    const [workspaceRect, setWorkspaceReact] = useState({});
    const [activeUUID, setActiveUUID] = useState(false);
    useEffect(() => {
        function reset() {
            setParentReact(bodyRef.current.parentNode.getBoundingClientRect());
            setWorkspaceReact(document.getElementById("workspace").getBoundingClientRect());
        }
        reset();
        window.addEventListener("resize", reset);
        return () => {
            window.removeEventListener("resize", reset);
        };
    }, [mainScale]);

    function onMouseDown(downEvent, uuid, type) {
        setActiveUUID(uuid);
        downEvent.stopPropagation();
        function mouseMove(moveEvent) {
            const { clientX: moveX, clientY: moveY } = moveEvent;
            const value = type === "x" ? moveY : moveX;
            const key = type === "y" ? "left" : "top";
            const newPos = (value - workspaceRect[key]) / mainScale;
            if (newPos < -400 || newPos > 600) {
                remove({ uuid, type });
            } else {
                updata({ position: newPos, uuid, type });
            }
        }

        function mouseUp(upEvent) {
            setActiveUUID(false);
            document.removeEventListener("mousemove", mouseMove);
            document.removeEventListener("mouseup", mouseUp);
        }

        document.addEventListener("mousemove", mouseMove);
        document.addEventListener("mouseup", mouseUp);
    }

    return (
        <div ref={bodyRef}>
            {yArray.map(({ position, uuid, active }) => {
                const left = position * mainScale + workspaceRect.left - parentRect.left;
                const isActive = active || uuid === activeUUID;
                const pointerEvents = isActive ? "none" : "auto";
                return (
                    <div
                        key={uuid}
                        className={[styles.line, styles.y, "elements"].join(" ")}
                        style={{ left, pointerEvents }}
                        onMouseDown={e => onMouseDown(e, uuid, "y")}>
                        {isActive && <div className={styles.tip}>{position.toFixed(0)}</div>}
                    </div>
                );
            })}
            {xArray.map(({ position, uuid, active }) => {
                const top = position * mainScale + workspaceRect.top - parentRect.top;
                const isActive = active || uuid === activeUUID;
                const pointerEvents = isActive ? "none" : "auto";
                return (
                    <div
                        key={uuid}
                        className={[styles.line, styles.x, "elements"].join(" ")}
                        onMouseDown={e => onMouseDown(e, uuid, "x")}
                        style={{ top, pointerEvents }}>
                        {isActive && <div className={styles.tip}>{position.toFixed(0)}</div>}
                    </div>
                );
            })}
            {captureYArray.map((position, index) => {
                const left = position * mainScale + workspaceRect.left - parentRect.left;
                return (
                    <div
                        key={`capture-X${index}`}
                        className={[styles.line, styles.y, styles.capture].join(" ")}
                        style={{ left }}></div>
                );
            })}
            {captureXArray.map((position, index) => {
                const top = position * mainScale + workspaceRect.top - parentRect.top;
                return (
                    <div
                        key={`capture-X${index}`}
                        className={[styles.line, styles.x, styles.capture].join(" ")}
                        style={{ top }}></div>
                );
            })}
        </div>
    );
}

function mapStateTopProps({ rules, editor: { positionScale = 1 } }) {
    const { rulesYArray, rulesXArray, captureXArray, captureYArray, ruleIsShow } = rules;
    return {
        yArray: ruleIsShow ? rulesYArray : [],
        xArray: ruleIsShow ? rulesXArray : [],
        captureXArray,
        captureYArray,
        mainScale: positionScale
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

export default connect(mapStateTopProps, { updata, remove })(LineBox);
