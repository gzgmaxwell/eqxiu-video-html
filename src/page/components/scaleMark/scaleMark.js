import React, { useState, useEffect } from 'react';
import styles from './scaleMark.less';

/**
 * 优化：整个片段4秒内的视频时间刻度再细分到0.1s
 */
const MinllisecondLine = ({ lastTerm }) => {
    const lineArr = ['10', '20', '30', '40'];
    return lineArr.map((item, index) => {
        return (
            <React.Fragment key={item}>
                {lastTerm >= (5 - index - 1) &&
                <div className={`${styles.sortTerm} ${styles.sortTermMinllisecond}`}
                     style={{ marginLeft: `-${item}%` }}></div>}
                {lastTerm >= (5 + index + 1) &&
                <div className={`${styles.sortTerm} ${styles.sortTermMinllisecond}`}
                     style={{ marginLeft: `${item}%` }}></div>}
            </React.Fragment>
        );
    });
};

export default function ScaleMark(props) {
    const { duration, scale = 1 } = props;
    // 单个大块的时间
    const oneBigCell = Math.max(Math.ceil(duration / scale / 20000) * 1000, 1000);
    // 时间数组
    const scaleMarkArray = Array(~~(duration / oneBigCell) + 1)
        .fill(true);
    // 单个大块的长度
    const showDetail = oneBigCell <= 2000;
    const oneWidth = (1 / (duration / oneBigCell)) * 100;
    return (
        <ul className={styles.scaleMark}>
            {
                scaleMarkArray.map((a, number) => {
                    const left = `${oneWidth * number}%`;
                    const width = `${oneWidth}%`;
                    let lastTerm = 9;
                    let hiddenTerm = false;
                    if (number === (scaleMarkArray.length - 1)) {
                        // 余下的秒速
                        const surplusTime = duration % oneBigCell;
                        hiddenTerm = (surplusTime < oneBigCell / 2);
                        lastTerm = Math.round(surplusTime / oneBigCell * 9);
                    }
                    return (
                        <li key={number} style={{
                            width,
                            left,
                        }}>
                            <span>{~~(number * oneBigCell / 1000)}s</span>
                            {!hiddenTerm && <div className={styles.sortTerm}></div>}
                            {
                                showDetail
                                ? <MinllisecondLine lastTerm={lastTerm}/>
                                : null
                            }
                        </li>
                    );
                })
            }
        </ul>
    );
};