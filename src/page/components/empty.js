import React from 'react';
import styles from './empty.less';
import noResultImg from 'Page/static/box.png';



/**
 * 通用空白组件
 * @param props
 * @returns {*}
 * @constructor
 */
function Empty(props) {
    const defaultText =  '模板尚未更新。';
  return (
    <div className={styles.body} style={{ ...props.style }}>
      <img src={noResultImg}/>
      <span>{props.text || defaultText}</span>
    </div>
  );
}


export default Empty;
