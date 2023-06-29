import React from 'react';
import style from './pie.less';


/**
 * 圆形进度条
 * @param progress
 * @param className
 * @returns {*}
 * @constructor
 */
function Pie({ progress, className }) {

    return <svg className={[style.body, className].join(' ')} viewBox="0 0 32 32">
        <circle className={style.circle} style={{ strokeDasharray: ` ${progress || 0} 100` }}
                r="16" cx="16"
                cy="16"/>
    </svg>;
}


export default Pie;
