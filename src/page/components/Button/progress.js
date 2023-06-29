import React from 'react';
import styles from './progress.less';

/**
 *
 * @param {int} progress
 * @param props
 * @returns {*}
 * @constructor
 */
function ProgressBtn({ progress, ...props }) {
    const width = `${progress}%`;
    const { children } = props
    return (
        <div className={styles.uploadBox} {...props}>
            <div className={styles.progressBox}>
                <div className={styles.progress} style={{ width }}></div>
            </div>
            <div className={styles.tip}>{children}</div>
        </div>
    );
}


export default ProgressBtn;
