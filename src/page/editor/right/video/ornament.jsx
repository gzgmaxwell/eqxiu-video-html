import React from 'react';
import { Switch } from 'antd';
import styles from '../image/gif.less';

function Ornament({ dispatch, data: { loop } }) {

    function changeNow(payload) {
        dispatch({
            type: 'workspace/changeNow',
            payload,
        });
    }

    const changeLoop = (checked) => {
        changeNow({ loop: checked });
    };


    return (
        <div>
            <div className={styles.imageReversal}>
                <div className={styles.left}>循环播放</div>
                <div className={styles.switch}>
                    <Switch checked={loop} onChange={changeLoop} />
                </div>
            </div>
        </div>
    );
}

export default Ornament;
//
// export default connect(({ editor, workspace, looper }) => {
//     const { transverse } = editor;
//     const { dataList = [], activeIndex = 0, uuid } = workspace;
//     const data = dataList[activeIndex] || {};
//     return {
//         activeIndex,
//         transverse,
//         loop: data.loop,
//         partyUUID: uuid,
//         cutVideoUUID: looper.cutVideoUUID,
//     };
// })(Ornament);
