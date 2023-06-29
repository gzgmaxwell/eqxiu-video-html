import React from 'react';

/**
 * 生成色彩块
 * @param backgroundColor
 * @param size
 * @returns {*}
 */
const colorDiv = ({backgroundColor, size = 18}) => {
  return <div style={{
    display: 'inline-block',
    width: size,
    height: size,
    backgroundColor,
    verticalAlign: 'middle'
  }}/>;
};

export default colorDiv;
