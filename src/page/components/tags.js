import React from 'react';
import Icon from './Icon';
import styles from './tags.less';

class MyTag extends React.PureComponent {
    state = { checked: false };

    static getDerivedStateFromProps(nextProps, prvState) {
        let newState = {};
        if (nextProps.checked !== undefined) {
            newState.checked = nextProps.checked;
        }
        return newState;
    }

    handleChange = () => {
        const checked = !this.state.checked;
        this.setState({ checked });
        if (typeof this.props.onChange === 'function') {
            this.props.onChange(checked);
        }
    };

    render() {
        const { state, props } = this;
        const checked = this.props.checked === undefined ? this.state.checked : this.props.checked;
        const closable = props.closable;
        return (
            <div
                className={[
                    styles.tag,
                    props.className,
                    props.checked !== undefined && styles.canChecked,
                    checked && styles.active].join(' ')
                }
                style={{ ...props.style }}
                onClick={this.handleChange}
            >{props.children}
                {closable && <Icon className={styles.closeIcon} onClick={props.onClose} type='eqf-minus-f' />}
            </div>
        );
    }
}

export default MyTag;
