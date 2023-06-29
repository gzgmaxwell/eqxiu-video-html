import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from './index.less';
import { connect } from 'dva';
import Icon from '../../components/Icon';
import { tag } from 'postcss-selector-parser';

/**
 * 单个标签组
 * @param {Object} props 
 */
function LabelsGroup(props) {
    const { data, width, textAlign, onChange, activeIndex } = props;


    let { name } = data;
    const activeItem = data.children.find(v => v.id === activeIndex);
    if (activeItem && activeItem.id) {
        ({ name } = activeItem);
    }

    return (
        <div
            style={{ width, textAlign }}
            className={`${styles.tagType} `}>
            <span>{name}</span>
            {name.length < 3 &&
                <Icon type='eqf-down' className={`${styles.eqf_down} `} />}
            <div className={`${styles.decBox}`} >
                <ul className={`${styles.tagNameBox}`}>
                    {data.children && data.children.map((item, i) =>
                        <li onClick={() => onChange(item)} key={i}
                            className={`${styles.tagName} ${String(item.id) === String(activeIndex)
                                ? styles.hover : ''}`}>
                            <span>{item.name}</span>
                        </li>,
                    )}
                </ul>
            </div>
        </div>);
}


/**
 * 多个标签组
 * @param {} props 
 */
function CustomLabels(props) {
    const { width, tags = [], textAlign = 'center', refreshList = () => null, activeLabels: propsActiveLabels = null } = props;
    const [activeLabels, setActiveLabels] = useState(propsActiveLabels || tags.map(v => v.defualt || null));

    // 激活元素完全控制
    useEffect(() => {
        if (Array.isArray(propsActiveLabels)) {
            setActiveLabels(propsActiveLabels);
        }
    }, [propsActiveLabels]);

    // 子组件改变的方法
    function onChange(i, item) {
        const newActiveLabels = activeLabels.map((v, index) => {
            if (index === i) {
                return item.id;
            } else {
                return v;
            }
        })
        setActiveLabels(newActiveLabels);
        refreshList(newActiveLabels);
    }
    // 子组件公共props
    const groupProps = {
        width,
        textAlign,
    }
    return (
        <div className={styles.tagBox}>
            <div className={styles.wrap}>
                {tags.map((v, i) => <LabelsGroup key={v.name} data={v} activeIndex={activeLabels[i]} onChange={(item) => onChange(i, item)} {...groupProps} />)}
            </div>
        </div>
    );
}


const mapStateToProps = ({ tags: tagsModel }, props) => {
    const { typeData, musicTags, needAll = true } = props;
    let { tags = [] } = props;
    const all = needAll ? {
        name: '全部',
        id: null,
    } : null;
    // 重新格式化名字和添加all
    function formatNameAndAll(item) {
        const name = item.name.length < 4 ? item.name : item.name.substring(
            item.name.length - 2);
        return {
            name,
            children: [all, ...item.children].filter(v => v),
        }
    }
    // 如果有typeData 说明要从model里面读取
    if (typeData) {
        const { list } = tagsModel;
        typeData.forEach((id) => {
            const styleList = list.find(v => v.id === id);
            if (!styleList) return;
            tags.push(formatNameAndAll(styleList));
        });
    }
    if (musicTags) {
        tags = musicTags.map(formatNameAndAll);
    }

    return { tags, length: tag.length }
};


function areEqual(preProps, nextProps) {
    const { width, textAlign, typeData, tags = [] } = preProps;
    const { width: nWidth, textAlign: nTextAlign, typeData: nTypeData, tags: nTags = [] } = nextProps;
    if (width !== nWidth || textAlign !== nTextAlign || (typeData || []).length !== (nTypeData || []).length || tags.length !== nTags.length) {
        return false;
    }
    const isEqual = !(typeData || []).some((a, i) => {
        return nTypeData[i] !== a;
    })
    return isEqual;
}

CustomLabels.PropTypes = {
    tags: PropTypes.array,
    typeData: PropTypes.array,
    musiceTags: PropTypes.array,
    activeLabels: PropTypes.array,
    refreshList: PropTypes.func.isRequired,
    width: PropTypes.string,
    textAlign: PropTypes.oneOf(['centre', 'left', 'right']),
}

// export default TagLabels;
export default connect(mapStateToProps)(React.memo(CustomLabels, areEqual));
