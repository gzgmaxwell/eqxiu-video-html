import React, { useState, useEffect } from 'react';
import { connect } from 'dva';
import styles from './index.less';
import { Switch } from 'antd';


/**
 * 覆层组件
 */
function Clad({ uuid = null, dispatch, defaultChecked = true }) {
    // 定义置顶变量
    const [positionTop, setPositionTop] = useState(defaultChecked);

    useEffect(() => {
        setPositionTop(defaultChecked);
    }, [defaultChecked]);

    function handleChange(checked) {
        setPositionTop(checked);
        dispatch({
            type: 'workspace/changeClad',
            payload: {
                uuid,
                positionTop: checked,
            }
        });
    }
    return (
        <div className={styles.cladBox}>
            是否保持置顶
            <Switch className={styles.cladSwitch} checked={positionTop} onChange={handleChange} />
        </div>
    );
}


function mapStateToProps({ workspace }) {
    const { dataList, activeIndex } = workspace;
    // 当前选中覆层uuid
    const uuid = activeIndex && dataList[activeIndex].uuid; 
    const defaultChecked = activeIndex && dataList[activeIndex].positionTop; 

    return {
        uuid,
        defaultChecked,
    };
}

export default connect(mapStateToProps)(Clad);