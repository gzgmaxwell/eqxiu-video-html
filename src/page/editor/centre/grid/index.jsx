import React, { useState, useEffect } from "react";
import styles from "./index.less";
import { connect } from "dva";

function GridBox(props) {
    const { gridCountY, gridCountX, gridIsShow, mainScale } = props;
    if (!gridIsShow) return null;
    const baseScale = 0.3;
    const yUnit = 1 / gridCountY;
    const xUnit = 1 / gridCountX;
    return (
        <div className={styles.gridBox}>
            {Array(gridCountY - 1)
                .fill(1)
                .map((v, i) => (
                    <div
                        key={`y-${i}`}
                        className={[styles.line, styles.y].join(" ")}
                        style={{
                            left: `${(i + 1) * yUnit * 100}%`,
                            transform: `scaleX(${baseScale / mainScale}) translateX(-4px)`
                        }}
                    />
                ))}
            {Array(gridCountX - 1)
                .fill(1)
                .map((v, i) => (
                    <div
                        key={`x-${i}`}
                        className={[styles.line, styles.x].join(" ")}
                        style={{
                            top: `${(i + 1) * xUnit * 100}%`,
                            transform: `scaleY(${baseScale / mainScale}) translateY(-4px)`
                        }}
                    />
                ))}
        </div>
    );
}

function mapStateToProps({ rules, editor: { positionScale = 1 } }) {
    const { gridIsShow, gridCountX, gridCountY } = rules;
    return { gridIsShow, gridCountX, gridCountY, mainScale: positionScale };
}
export default connect(mapStateToProps)(GridBox);
