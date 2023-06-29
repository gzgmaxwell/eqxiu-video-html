import React, { useState } from 'react';
import styles from './close.less';
import Icon from '../Icon';

export default function Close(props) {
    const { type = 'eqf-no-f', styleObj = {} } = props;

    function onClose() {
        if (typeof props.onClose === 'function') {
            props.onClose();
        }
    }

    return (
        <Icon {...props} onClick={onClose}
              className={styles.eqf_no}
              type={type}/>
    );
}
