import React from 'react';
import { Input } from 'antd';
const Search = Input.Search;


function search(props) {
    return <Search style={{ width: props.width || 200 }} {...props} />;
}

export default search;
