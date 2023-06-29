import React from 'react';
import PropTypes from 'prop-types';
import Icon from 'Components/Icon';
import Style from './index.less';


function Button(props) {
    // `icon ${Style.button} ${props.className}`

    const className = [
        'button',
        Style.button,
        props.disabled ? (props.lite ? 'disabled-lite' : 'disabled') : '',
        props.lite ? 'liteBtn' : 'darkBtn',
        props.className,
    ].join(' ');
    return <button onClick={props.onClick}  {...props} className={className}>
        {props.icon ? <Icon type={props.icon} style={{ marginRight: '5px' }} /> : ''}
        {props.children || props.value}
    </button>;
}

Button.propTypes = {
    style: PropTypes.object,
    value: PropTypes.string,
    icon: PropTypes.string,
    onClick: PropTypes.func,
    lite: PropTypes.number,
    className: PropTypes.string,
    disabled: PropTypes.bool,
};


export default Button;
