import React from 'react';
import styles from './index.less';
import noResultImg from 'Page/static/box.png';



/**
 * 暂未开放组件
 * @param props
 * @returns {*}
 * @constructor
 */
function Waitting(props) {
  const defaultText =  '暂未开放';
  return (
    <div className={styles.body} style={{ ...props.style }}>
      <img src={noResultImg}/>
      <span style={{color:'#999',fontSize:'14px',lineHeight:'21px'}}>{props.text || defaultText}</span>
    </div>
  );
}


export default Waitting;
