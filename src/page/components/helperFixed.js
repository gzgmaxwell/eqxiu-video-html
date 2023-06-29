import React from 'react';
import styles from './helperFiexed.less';
import { connect } from 'dva';
import fankui from '../static/fankui.png';
import Button from './Button';
import { openFankui, showKefu } from '../../util/kefu';
import Icon from "./Icon";
import Feedback from "./feedback/home";

/**
 * 帮助菜单组件
 * @param user
 * @param goTop
 * @returns {*}
 */
function helperFixed({ user, goTop }) {
    const {name, loginName, phone, id, type, memberType} = user;
    const showkefu = () => {
        showKefu({name, loginName, phone, id, type, memberType});
    };
    function lesson() {
        window.open('https://bbs.eqxiu.com/forum.php?mod=viewthread&tid=108462&extra=','_blank')
    }
    return (
        <div className={styles.body}>
            <div className={`${styles.wrap} ${styles.feedbackBtn}`}>
                <Icon type='eqf-interactive-l' className={styles.feedbackIcon}/>
                <span>反馈</span>
            </div>
            <div className={`${styles.wrap}`} onClick={showkefu} >
                <Icon style={{fontSize:'22px'}} type='iconfont iconcustomservice-l' className={styles.feedbackIcon}/>
                <span>客服</span>
            </div>
            <div className={`${styles.wrap}`} onClick={lesson} >
                <Icon style={{fontSize:'20px',marginTop:'3px'}} type='eqf-activity-l' className={styles.feedbackIcon}/>
                <span>教程</span>
            </div>
            {goTop && <div className={`${styles.wrap}`} onClick={goTop} >
                <Icon style={{fontSize:'19px',marginTop:'3px'}} type='eqf-ontop' className={styles.feedbackIcon}/>
                <span>置顶</span>
            </div>
            }
            <div className={styles.feedback}>
                <div className={styles.wrap}><Feedback/></div>
            </div>
    </div>);
}

const Helper = connect(({ user }) => ({ user }))(helperFixed);

export { Helper };
