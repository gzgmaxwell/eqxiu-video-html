import React from 'react';
import ScrollInput from './scrollInput';
import styles from './opacityInput.less';

function OpacityInput(props) {
    return <div className={styles.opacityInput}>
        <div className={styles.title}>透明度：</div>
        <ScrollInput style={{ border: 'unset!important', width: 56 }} valueSuffix={'%'} step={1} {...props} />
    </div>;
}

export default OpacityInput;
