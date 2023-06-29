import React from 'react';
import styles from './index.less';
import linkManger from '../../static/linkman.jpg';
import feedback from '../../static/feedback.png';
import { sendBDEvent } from '../../../services/bigDataService';

export default function Feedback() {
    function openFeedback() {
        sendBDEvent({
            position: '主编辑器',
            type: '左边栏-反馈-banner',
        });
        window.open('http://h5.ebdan.net/ls/rSV5r7kB', '_blank');
    };
    return (
        <div>
            <div className={styles.title}>扫码获取帮助</div>
            <img className={styles.img} src={linkManger} width="244" height="244"
                 alt="反馈"/>
            <div className={styles.btn} onClick={openFeedback}>
                <div className={styles.dashed}/>
                <img src={feedback} alt=""/>
            </div>
        </div>
    );
}


