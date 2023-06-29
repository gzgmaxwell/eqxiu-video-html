import React, { useState } from "react";
import { connect } from "dva";
import styles from "../animateFont/animateFonts.less";
import RightTabs from "../../../components/tabs";
import UserMarketBaseOption from "./baseOption";
import UserMarketAnimation from "./animation";

function UserMarkRight({ uuid }) {
    const [activeTab, setActiveTab] = useState(0);
    const tabList = [
        {
            title: "样式",
            component: UserMarketBaseOption
        },
        {
            title: "动画",
            component: UserMarketAnimation
        }
    ];
    const tabProps = {
        activeTab,
        tabList,
        onChange: setActiveTab
    };

    const ChildrenComponent = tabList[activeTab].component;

    return (
        <div>
            <RightTabs {...tabProps} />
            <ChildrenComponent key={uuid} />
        </div>
    );
}
function mapStateToProps({ workspace }) {
    const { dataList, activeIndex } = workspace;
    const { uuid } = dataList[activeIndex] || {};
    return {
        uuid
    };
}

export default connect(mapStateToProps)(UserMarkRight);
