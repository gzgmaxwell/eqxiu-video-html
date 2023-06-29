import React, { PureComponent } from 'react';
import styles from './manageMenu.less';
import { Checkbox } from 'antd';

export default class ManageMenu extends PureComponent {
    handleActive = (path) => {
        this.props.activeTag(path);
    };
    openManage = (flag) => {
        this.props.openManage(flag);
    };
    checkAll = (e) => {
        this.props.checkAll(e.target.checked);
    };
    deleteCheck = () => {
        this.props.deleteCheck();
    };

    render() {
        const { type, checked, manage, active, scrolling, checkedList = [], right = null } = this.props;
        const params = [
            {
                title: '上传',
                path: 'upload',
            },
        ];
        if (type === 'music') {
            params.push({
                title: '已购',
                path: 'buy',
            }, {
                title: '收藏',
                path: 'favorite',
            });
        }
        if (type === 'video') {
            params.push({
                title: '片头片尾',
                path: 'headTail',
            });
        }
        return <div className={`${styles.container} ${scrolling ? 'scrollShadow' : ''}`}>
            <div className={styles.left}>
                {manage
                 ? <div className={styles.checkAll}>
                     <input type="checkbox" onChange={this.checkAll}/>
                     <span>全选</span>
                 </div>
                 : params.map((item, i) => {
                        return <React.Fragment key={i}>
                            {i !== 0 && <span>丨</span>}
                            <div
                                onClick={() => this.handleActive(item.path)}
                                className={`${active === item.path
                                              ? styles.hover
                                              : ''}`}>{item.title}</div>
                        </React.Fragment>;
                    })}
            </div>
            {manage
             ? <div className={styles.right}>
                 {(checkedList.length > 0 || checked) &&
                 <div onClick={this.deleteCheck} className={styles.deleteBtn}>删除</div>}
                 {!(checkedList.length > 0 || checked) &&
                 <div className={`${styles.deleteBtn} ${styles.disabled}`}>删除</div>}
                 <div onClick={() => this.openManage(false)} className={styles.hover}>完成</div>
             </div>
             : <div className={styles.right}>
                 {active === 'upload' && <div onClick={() => this.openManage(true)}>管理</div>}
                 {right}
             </div>
            }
        </div>;
    }
}
