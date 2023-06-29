import React from 'react';
import { Radio as AntRadio } from 'antd';


function Radio({ className, ...props }) {
    return <AntRadio className={`eqxRadio ${className}`} {...props}/>;
}

Radio.Group = AntRadio.Group;

export default Radio;
