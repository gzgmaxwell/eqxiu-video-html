import styles from './container.less';
import React from 'react';

export default class container extends React.PureComponent {


    render() {
        const { children, computedMatch, ...reset } = this.props;
        return (
            <div id={'video-container'} className={`${styles.container} `} {...reset}>
                {this.props.children}
            </div>
        );
    }
}
