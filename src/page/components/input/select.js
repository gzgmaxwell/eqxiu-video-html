import React from 'react';
import { Select } from 'antd';
import PropTypes from 'prop-types'

const Option = Select.Option;

function select(props) {
  const { options, ...others } = props;
  return <Select {...others} >
    {options.map((item, index) => {
      if(typeof item === "object") {
        return <Option {...item} key={index}>{item.title}</Option>
      }
      return <Option value={item} key={index}>{item}</Option>
    })}
  </Select>;
}

/**
 * options的数据项如果是对象的话，可以包含以下参数
 * disabled: 是否禁用
 * title： 选中后select展示的标题
 * value： 选中后select的值
 * className： option的类名
 * */
select.propTypes = {
  options: PropTypes.array.isRequired,
  onSelect: PropTypes.func,
  onChange: PropTypes.func,
  allowClear: PropTypes.bool,
  disabled: PropTypes.bool,
  mode: PropTypes.oneOf(['multiple', 'tags']),
  placeholder: PropTypes.string,
  defaultValue: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.array
  ]),
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.array
  ]),
};

export default select;
