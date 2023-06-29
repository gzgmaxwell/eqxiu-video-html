import React from 'react';
import { connect } from 'dva';
import AnimateImg from '../animateImg/animateImg';
import { ANIMATION_TYPES } from '../../../../dataBase/animations';


function UserMarketAnimation(props) {
    return (
        <AnimateImg {...props} filterTabs={[ANIMATION_TYPES.EXITS, ANIMATION_TYPES.STAY]}/>
    );
}

function mapStateToProps({ workspace }) {
    const { dataList, activeIndex } = workspace;
    const data = dataList[activeIndex];
    return { data };
}

function changeNow({ animate }) {
    return {
        type: 'workspace/changeNow',
        payload: { animate },
    };
}


export default connect(mapStateToProps, { changeNow })(UserMarketAnimation);
