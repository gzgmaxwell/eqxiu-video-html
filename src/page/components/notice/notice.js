import React, { Component } from 'react';
import styles from './notice.less';

export default class notice extends Component {
    render() {
        const { className, right = -5, top = -9, width = 32, height = 16, title } = this.props;
        return (<div
            className={`${styles.notice} ${className}`}
            style={{ right, top, width, height }}
        >
            {title}
        </div>);
    }
}
