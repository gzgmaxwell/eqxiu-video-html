import React from 'react';
import styles from './bar.less';

/**
 *
 * @param {int} progress
 * @param {obj} outStyle
 * @param {obj} props
 * @returns {*}
 * @constructor
 */
function Bar({ progress, outStyle, ...props }) {
    const widthP = `${progress || 0}%`;
    const _style = props.style ? { ...props.style } : {};
    _style['width'] = widthP;
    return (
        <div {...props} className={[styles.outBody, props.className].join(' ')}
             style={outStyle || {}}>
            <div className={styles.progress} style={_style || {}}/>
        </div>
    );
}


export default Bar;

