import React, { useState } from 'react';
import styles from './back.less';
import Icon from '../Icon';

export default function Back(props) {
    function onBack() {
        if (typeof props.onBack === 'function') {
            props.onBack();
        }
    }
    return (
        <div onClick={onBack} className={styles.backWrap}>
            <Icon
                className={styles.eqf_left} type='eqf-left'/>
            <span className={styles.back}>返回</span>
        </div>
    );
}