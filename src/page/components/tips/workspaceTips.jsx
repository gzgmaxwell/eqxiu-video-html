import React from 'react';
import styles from './workspaceTips.less';
import Icon from '../Icon';
import eventEmitter from '../../../services/EventListener';


export default function WorkspaceTips() {
    function openFeedback() {
        window.open('https://bbs.eqxiu.com/forum.php?mod=viewthread&tid=108462&extra=', '_blank');
    };

    function openBgTab() {
        eventEmitter.emit('toggleActiveTab', [7, 1]);
        setTimeout(() => {
            eventEmitter.emit('focusUploadList');
        }, 100);
    }

    return (
        <div className={styles.wrap}>
            <Icon type='eqf-press' className={styles.eqfPress}/>
            <p>从<span onClick={openBgTab}>上传</span>您的素材开始，或者先看看<span
                onClick={openFeedback}>教程</span></p>
        </div>
    );
}
