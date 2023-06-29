import React, { useState, useEffect, useRef } from 'react';
import styles from './cardTag.less';

/**
 * 作品状态标签
 * status: 0= 未完成 1/2=渲染中 3=渲染失败  4=渲染成功
 * 0 && previewUrl有值=有修改
 * @param {*} props 
 */
function CardTag({ status }) {
  const tags = [{
    name: '有修改',
    color: '#fff',
    bgColor: '#FFB243',
    status: 'update',
  }, {
    name: '未完成',
    color: '#333',
    bgColor: '#E6EBED',
    status: 0,
  }, {
    name: '渲染失败',
    color: '#fff',
    bgColor: '#FF5448',
    status: 3,
  }, {
    name: '审核失败',
    color: '#fff',
    bgColor: '#FF296A',
    status: 'auditFail',
  }, {
    name: '审核中',
    color: '#333',
    bgColor: '#E6EBED',
    status: 'auditWait',
  }];

  const [tag, setTag] = useState([]);

  useEffect(() => {
    const newTag = tags.map((item, index) => {
      if (item.status === status) {
        return item;
      }
      return null;
    }).filter(v => v);
    setTag(newTag);
  }, [status]);

  return (
    tag.length > 0 && <div className={styles.cardTag} style={{ backgroundColor: tag[0].bgColor, color: tag[0].color }}>{tag[0].name}</div>
  );

}


export default CardTag;