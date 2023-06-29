import React from 'react';
import styles from './empty.less';
import noResultImg from 'Page/static/noResult.png';

const defaultText = '未能找到页面';

/**
 * 通用空白组件
 * @param props
 * @returns {*}
 * @constructor
 */
function Empty(props) {
    return (
        <div className={styles.body} style={{ ...props.style }}>
            <img src={noResultImg}/>
            <span>{props.text || defaultText}</span>
        </div>
    );
}


export default Empty;
