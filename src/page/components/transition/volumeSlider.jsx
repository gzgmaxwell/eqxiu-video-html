import React from 'react';
import styles from './volumeSlider.less';

/**
 * 动态音乐条
 * @param dynamic 是否动态
 * @param className 额外的外框class
 * @return {*}
 * @constructor
 */
function VolumeSlider({ dynamic = true, className = '' }) {
    const classNames = `${styles.line} ${dynamic ? styles.dynamic : ''}`;
    return (
        <div className={`${styles.mBox} ${className}`}>
            <div className={classNames}></div>
            <div className={classNames}></div>
            <div className={classNames}></div>
            <div className={classNames}></div>
            <div className={classNames}></div>
        </div>
    );
}


export default VolumeSlider;
