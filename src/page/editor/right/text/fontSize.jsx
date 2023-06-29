import React from 'react';
import PropsTypes from 'prop-types';
import { Icon } from 'antd';
import Select from 'Components/input/select';
import styles from './text.less';
import { limitNumber } from '../../../../util/data';

const fontSizeList = [
    {
        key: 12,
        title: '12px',
    },
    {
        key: 13,
        title: '13px',
    },
    {
        value: 14,
        title: '14px',
    },
    {
        value: 16,
        title: '16px',
    },
    {
        value: 18,
        title: '18px',
    },
    {
        value: 20,
        title: '20px',
    },
    {
        value: 24,
        title: '24px',
    },
    {
        value: 32,
        title: '32px',
    },
    {
        value: 48,
        title: '48px',
    },
    {
        value: 64,
        title: '64px',
    },
    {
        value: 96,
        title: '96px',
    },
];


function FontSizeSelect(props) {
    const { value, onChange, limit = [12, 156] } = props;

    function onSearch(newValue) {
        // const nextValue = ~~newValue;
        if (!newValue) return;
        onChange(limitNumber(~~newValue, limit));
        return true;
    }

    function onAdd() {
        onChange(limitNumber(value + 1, limit));
    }

    function onReduce() {
        onChange(limitNumber(value - 1, limit));
    }

    return (
        <div className={styles.fontSize}>
            <div className={styles.center}>
                <Select
                    options={fontSizeList} placeholder={'请选择字号'}
                    suffixIcon={<Icon type="caret-down"/>}
                    showSearch={true}
                    dropdownClassName='selectDropdownClassName'
                    optionFilterProp="value"
                    value={value}
                    notFoundContent={'暂无匹配数据'}
                    onSearch={onSearch}
                    onSelect={onChange}
                />
            </div>
            <div className={styles.right}>
                <div
                    onClick={onAdd}>A+
                </div>
                <div
                    onClick={onReduce}>A-
                </div>
            </div>
        </div>
    );
}


FontSizeSelect.prototype = {
    value: PropsTypes.number,
    onChange: PropsTypes.func,
};

export default FontSizeSelect;
