import { Checkbox, Popconfirm } from 'antd';
import Icon from './Icon';
import React from 'react';
import Button from './Button';

export function Confirm(props) {
    const placement = props.placement || 'topRight';
    const IconInfo = props.icon || 'eqf-why-f';
    const checked = props.checked || false;
    const content = (
        <React.Fragment>
            <div style={{
                width: '250px',
                paddingBottom: '26px',
            }}>{props.title}
            </div>
            <div style={{
                position: 'absolute',
                top: '84px',
                left: '0px',
            }}><Checkbox checked={checked}
                         onChange={props.onChange}>不再提示</Checkbox></div>
        </React.Fragment>
    );
    return (
        <Popconfirm
            visible={props.visible}
            overlayClassName='PopconfirmRight'
            title={content}
            placement={placement}
            icon={<Icon
                type={IconInfo}
                style={{
                    color: '#faad14',
                    display: 'inline-block',
                    marginTop: '2px',
                }}/>}
            cancelText='取消'
            okText='确定'
            onConfirm={props.onConfirm}
            onCancel={props.onCancel}>
            <Button {...props.btnInfo} />
        </Popconfirm>
    )
}