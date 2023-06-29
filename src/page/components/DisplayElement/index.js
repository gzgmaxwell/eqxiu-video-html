import React from 'react';

/**
 *
 * @param {boolean} display
 * @param {obj} children
 * @returns {*}
 * @constructor
 */
function DisplayElement({ display, children }) {
    const style = { display: display ? 'unset' : 'none' };
    return (
        <div style={style}>
            {children}
        </div>
    );
}


export default DisplayElement;


