import React, { useState } from 'react';
import { name as envName } from 'Config/env';
import styles from './orderBy.less';


export default function OrderBy({
                                    defaultValue = 'create_time desc',
                                    changeOrderBy = () => {
                                    },
                                    dataList,
                                }) {
    const [activeValue, setActiveValue] = useState(defaultValue || 'create_time|desc');
    const change = (type) => {
        setActiveValue(type);
        if (typeof changeOrderBy === 'function') {
            changeOrderBy(type);
        }
    };
    let newValue = 'create_time desc';
    let hotValue = 'use_quantity desc';
    if (dataList) {
        newValue = dataList[0].value;
        hotValue = dataList[1].value;
    }
    return (
        <div className={styles.orderBy}>
            <div
                className={`${styles.time} ${activeValue === newValue
                    ? styles.active
                    : ''}`}
                onClick={() => change(newValue)}
            >最新
            </div>
            <div className={styles.verLine}/>
            <div
                className={`${styles.use} ${activeValue === hotValue
                    ? styles.active
                    : ''}`}
                onClick={() => change(hotValue)}
            >最热
            </div>
        </div>
    );
}
