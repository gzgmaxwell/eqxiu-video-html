import React from 'react';
import { Popconfirm } from 'antd';

export default class PopConfirm extends React.PureComponent {
    render() {
        return <Popconfirm {...this.props} />;
    }
}