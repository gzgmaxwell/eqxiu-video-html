import React, { useEffect } from "react";
import { connect } from "dva";
import styles from "./userMarket.less";
import { UserMarketIndexBody, Tips, Ul, Title, Free, Info, Icon, HowUseA } from "./userMarketStyle";
import { MARKET_TYPE } from "../../../config/staticParams/userMarket";
import UserMarketNoob from "./userMarketNoob";
import { prev } from "../../../config/env";
import { sendBDEvent } from "../../../services/bigDataService";

export const List = [
    {
        icon: <Icon type={"eqf-telephone-l"} backgroundColor={"#1593FF"} />,
        title: "拨打电话",
        info: "让观看您视频的用户实现一键拨号，快速成单",
        isFree: true,
        type: MARKET_TYPE.phone
    },
    {
        icon: <Icon type={"eqf-wechat"} backgroundColor={"#50D5E2"} />,
        title: "关注公众号",
        info: "点击后进入公众号关注页，快速实现粉丝增长",
        isFree: true,
        type: MARKET_TYPE.wechat
    },
    {
        icon: <Icon type={"eqf-link"} backgroundColor={"#1BC7B1"} />,
        title: "跳转链接",
        info: "输入您的链接，用户点击后进入该页面，可实现立即购买/立即报名等",
        isFree: true,
        type: MARKET_TYPE.link
    },
    {
        icon: <Icon type={"eqf-writerin-f"} backgroundColor={"#1593FF"} />,
        title: "点击报名",
        info: "用户点击按钮进入报名页面，获客、 招生我总是快人一步",
        isFree: true,
        type: MARKET_TYPE.enroll
    },
    {
        icon: <Icon type={"eqf-user-f"} backgroundColor={"#1593FF"} />,
        title: "我要应聘",
        info: "应聘者快速提交简历，招人我最牛",
        isFree: true,
        type: MARKET_TYPE.applicant
    },
    {
        icon: <Icon type={"eqf-shopping-f"} backgroundColor={"#1BC7B1"} />,
        title: "立即购买",
        info: "用户点击按钮立即进入购买页面， 轻松在线成交，成为带货高手",
        isFree: true,
        type: MARKET_TYPE.goBuy
    },

    {
        icon: <Icon type={"eqf-interactive-f"} backgroundColor={"#1BC7B1"} />,
        title: "了解更多",
        info: "进入详情页面查看详细信息，助您准确传达",
        isFree: true,
        type: MARKET_TYPE.moreInfo
    },

    {
        icon: <Icon type={"eqf-financial-f"} backgroundColor={"#50D5E2"} />,
        title: "领取福利",
        info: "快速分发福利给你的用户",
        isFree: true,
        type: MARKET_TYPE.welfare
    },
    {
        icon: <Icon type={"eqf-redpacket-f"} backgroundColor={"#50D5E2"} />,
        title: "点击抽奖",
        info: "点击按钮进入抽奖页面，互动营销一步到位",
        isFree: true,
        type: MARKET_TYPE.luck
    }
];

function UserMarketIndex({ onChange }) {
    function insert(type) {
        onChange(type);
    }

    /**
     * 新手引导
     */
    useEffect(() => {
        const noob = UserMarketNoob();
        sendBDEvent({
            position: "左边栏",
            type: "展示营销组件"
        });
        return () => noob && noob.onClose();
    }, []);

    return (
        <UserMarketIndexBody>
            <Tips>
                营销组件在线分享时展示，下载时不展示。
                <a href={`${prev}/marketGuide`} target='_blank'>
                    如何使用?
                </a>
            </Tips>
            <Ul>
                {List.map(item => (
                    <li
                        key={item.title}
                        onClick={insert.bind(this, item.type)}
                        id={`userMark-${item.title}`}>
                        {item.icon}
                        <div className={styles.rightBLock}>
                            <Title>
                                {item.title}
                                {false && <Free>限时免费</Free>}
                            </Title>
                            <Info>{item.info}</Info>
                        </div>
                    </li>
                ))}
            </Ul>
           
        </UserMarketIndexBody>
    );
}

function onChange(type) {
    return {
        type: "workspace/insertUserMarket",
        payload: {
            type
        }
    };
}

export default connect(null, { onChange })(UserMarketIndex);
