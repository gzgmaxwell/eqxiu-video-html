import React from 'react';
import styles from './supportTips.less';


export default function SupportTips(props) {
    return (
        <div className={styles.wrap}>
            {props.tips}
        </div>
    );
}