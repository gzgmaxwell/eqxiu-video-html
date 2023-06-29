import React from 'react';
import styles from './index.less';
import linkManger from '../../static/welfareewm.png';


export default function Welfare(){
    return (
       <div>
           <img className={styles.img} src={linkManger} width="180" height="180"
                alt="反馈"/>
           <div className={styles.title}>进群获取更多福利</div>
       </div>
    );
}


