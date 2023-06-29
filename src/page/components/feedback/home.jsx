import React from 'react';
import styles from './home.less';
import linkManger from '../../static/linkman.jpg';
import feedback from '../../static/feedback.png';

export default function Feedback(props){
    function openFeedback () {
        window.open('http://h5.eqxiu.com/ls/juHtWq33', '_blank');
    };
    return (
       <div>
           <img className={styles.img} src={linkManger} width="150" height="150"
                alt="反馈"/>
           <div className={styles.title}>扫码获取帮助</div>
           <div className={styles.btn} onClick={openFeedback}>
               <div className={styles.dashed}/>
               <img src={feedback} alt=""/>
           </div>
       </div>
    );
}