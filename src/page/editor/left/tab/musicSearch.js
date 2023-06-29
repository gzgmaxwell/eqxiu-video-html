import React, { useState, useEffect, useRef } from 'react';
import { connect } from 'dva';
import propTypes from 'prop-types';
import { Input } from 'antd';
import styles from './music.less';
import Icon from '../../../components/Icon';

/**
 * 音乐搜索
 */
function MusicSearch({ placeholder="搜索音乐", onSearchChange }) {
    const [searchVal, setSearchVal] = useState('');
    const [showCancel, setShowCancel] = useState(false);

    const handChange = (e) => {
        let value = e.target.value;
        setSearchVal(value);
        onSearchChange(value, 'change')
    }
    const blur = () => {
        setTimeout(() => {
            setShowCancel(false);
        }, 200);
    }
    const cancel = () => {
        setSearchVal('');
        onSearchChange('');
    }
    const search = () => {
        if(searchVal.length == 0) return;
        onSearchChange(searchVal)
    }
    const keyDown = (e) => {
        if(e.keyCode === 13 && searchVal.length > 0) {
            onSearchChange(searchVal)
        }
    }
    // useEffect(() => {
        
    // }, []);
    return (
        <Input placeholder={placeholder}
        prefix={
            <Icon type="eqf-search-l" className={`${styles.icon}`} onClick={search} />
        }
        suffix={
            showCancel && <Icon type="eqf-no-l" className={`${styles.icon} ${styles.no}`} onClick={cancel} />
        }
        value={searchVal}
        maxLength={10}
        className={styles.musicSearch}
        onKeyDown={(e) => keyDown(e)}
        onFocus={() => setShowCancel(true)}
        onBlur={blur}
        onChange={handChange} />
    );
}


MusicSearch.propTypes = {
    onSearchChange: propTypes.func,
    placeholder: propTypes.string,
};

export default MusicSearch;