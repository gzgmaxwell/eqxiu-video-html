export const MARKET_TYPE = {
    phone: 1,
    wechat: 2,
    link: 3,
    goBuy: 4,
    enroll: 5,
    luck: 6,
    moreInfo: 7,
    applicant: 8,
    welfare: 9
};
export const USER_MARKET_NAME = {
    [MARKET_TYPE.phone]: "拨打电话",
    [MARKET_TYPE.wechat]: "关注公众号",
    [MARKET_TYPE.link]: "跳转链接",
    [MARKET_TYPE.goBuy]: "立即购买",
    [MARKET_TYPE.enroll]: "点击报名",
    [MARKET_TYPE.luck]: "点击抽奖",
    [MARKET_TYPE.moreInfo]: "了解更多",
    [MARKET_TYPE.applicant]: "我要应聘",
    [MARKET_TYPE.welfare]: "领取福利"
};

export const USER_MARKET_LABEL = {
    [MARKET_TYPE.phone]: "手机/电话号码",
    [MARKET_TYPE.wechat]: "微信公众号关注链接",
    [MARKET_TYPE.goBuy]: "购买链接",
    [MARKET_TYPE.enroll]: "报名链接",
    [MARKET_TYPE.luck]: "抽奖链接",
    [MARKET_TYPE.moreInfo]: "跳转链接",
    [MARKET_TYPE.applicant]: "应聘链接",
    [MARKET_TYPE.welfare]: "领取链接",
    [MARKET_TYPE.link]: "跳转链接"
};

const _USER_MARKET_STYLE_LIST = {
    [MARKET_TYPE.phone]: [ // 大类
        {
            key: 1,  // 单项不能重复
            prevUrl: import("../../page/static/userMarketStyles/拨打电话/1.svg"), // 预览图地址
            backgroundUrl: import("../../page/static/userMarketStyles/拨打电话/1-1.png"), // 背景图地址
            fontStyle: { //字体框
                top: 0.20999999999999996, //y轴定位相对值 %
                left: 0.36928571428571433, //x轴定位相对值 %
                fontSize: 14, // 字号
                color: "#fff", // 字色
                width: 0.42857142857142855, // 字体框宽度相对于外面的宽度 %
                height: 0.48,
                title: "拨打电话"  // 字体框的默认文本
            },
            defaultSize: { width: 140, height: 40 }  // 默认放进去外框的宽度 高度
        },
        {
            key: 2,
            prevUrl: import("../../page/static/userMarketStyles/拨打电话/2.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/拨打电话/2-1.png"),
            fontStyle: {
                top: 0.20968547179231148,
                left: 0.3959285714285714,
                fontSize: 14,
                color: "#1593FF",
                width: 0.42857142857142855,
                height: 0.39940089865202194,
                title: "立即来电"
            },
            defaultSize: { width: 140, height: 40.06 }
        },
        {
            key: 3,
            prevUrl: import("../../page/static/userMarketStyles/拨打电话/3.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/拨打电话/3-1.png"),
            fontStyle: {
                top: 0.21775000000000003,
                left: 0.10714285714285714,
                fontSize: 14,
                color: "#1593ff",
                width: 0.42857142857142855,
                height: 0.48,
                title: "联系我们"
            },
            defaultSize: { width: 140, height: 40 }
        },
        {
            key: 4,
            prevUrl: import("../../page/static/userMarketStyles/拨打电话/4.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/拨打电话/4-1.png"),
            fontStyle: {
                top: 0.22474999999999995,
                left: 0.16185714285714287,
                fontSize: 14,
                color: "#1593FF",
                width: 0.42857142857142855,
                height: 0.48,
                title: "联系我们"
            },
            defaultSize: { width: 140, height: 40 }
        },
        {
            key: 5,
            prevUrl: import("../../page/static/userMarketStyles/拨打电话/5.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/拨打电话/5-1.png"),
            fontStyle: {
                top: 0.20800000000000002,
                left: 0.19757142857142856,
                fontSize: 14,
                color: "#1593FF",
                width: 0.42857142857142855,
                height: 0.48,
                title: "拨打热线"
            },
            defaultSize: { width: 140, height: 40 }
        }
    ],
    [MARKET_TYPE.enroll]: [
        {
            key: 1,
            prevUrl: import("../../page/static/userMarketStyles/点击报名/1.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/点击报名/1-1.png"),
            fontStyle: {
                top: 0.22149999999999997,
                left: 0.3021428571428571,
                fontSize: 14,
                color: "#fff",
                width: 0.42857142857142855,
                height: 0.48,
                title: "立即报名"
            },
            defaultSize: { width: 140, height: 40 }
        }
    ],
    [MARKET_TYPE.luck]: [
        {
            key: 1,
            prevUrl: import("../../page/static/userMarketStyles/点击抽奖/1.gif"),
            backgroundUrl: import("../../page/static/userMarketStyles/点击抽奖/1-1.gif"),
            fontStyle: {
                width: 0.14,
                left: 0.44,
                top: 0.42,
                height: 0.2,
                color: "#fff",
                fontSize: 14,
                title: "开始",
            },
            defaultSize: { width: 200, height: 200 },
        },
        {
            key: 2,
            prevUrl: import("../../page/static/userMarketStyles/点击抽奖/2.gif"),
            backgroundUrl: import("../../page/static/userMarketStyles/点击抽奖/2-1.gif"),
            fontStyle: {
                width: 0.14,
                left: 0.44,
                top: 0.39,
                height: 0.2,
                color: "rgb(180,0,1)",
                fontSize: 14,
                title: "立即抽奖",
            },
            defaultSize: { width: 200, height: 200 },
        },
    ],
    [MARKET_TYPE.wechat]: [
        {
            key: 1,
            prevUrl: import("../../page/static/userMarketStyles/关注公众号/1.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/关注公众号/1-1.png"),
            fontStyle: {
                top: 0.20999999999999996,
                left: 0.25,
                fontSize: 14,
                color: "#fff",
                width: 0.51857142857142855,
                height: 0.48,
                title: "关注公众号"
            },
            defaultSize: { width: 140, height: 40 }
        },
        {
            key: 2,
            prevUrl: import("../../page/static/userMarketStyles/关注公众号/2.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/关注公众号/2-1.png"),
            fontStyle: {
                top: 0.21025,
                left: 0.10120964855772671,
                fontSize: 14,
                color: "#50d5e2",
                width: 0.6094610264118531,
                height: 0.48,
                title: "关注公众号"
            },
            defaultSize: { width: 139.71, height: 40 }
        },
        {
            key: 3,
            prevUrl: import("../../page/static/userMarketStyles/关注公众号/3.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/关注公众号/3-1.png"),
            fontStyle: {
                top: 0.20999999999999996,
                left: 0.31937584997494806,
                fontSize: 14,
                color: "#fff",
                width: 0.5494610264118531,
                height: 0.48,
                title: "关注公众号"
            },
            defaultSize: { width: 139.71, height: 40 }
        },
        {
            key: 4,
            prevUrl: import("../../page/static/userMarketStyles/关注公众号/4.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/关注公众号/4-1.png"),
            fontStyle: {
                top: 0.075,
                left: 0.10,
                fontSize: 14,
                color: "#fff",
                width: 0.80,
                height: 0.48,
                title: "点击关注公众号"
            },
            defaultSize: { width: 140, height: 40 }
        },
        {
            key: 5,
            prevUrl: import("../../page/static/userMarketStyles/关注公众号/5.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/关注公众号/5-1.png"),
            fontStyle: {
                top: 0.025,
                left: 0.10,
                fontSize: 14,
                color: "#fff",
                width: 0.80,
                height: 0.48,
                title: "点击关注公众号"
            },
            defaultSize: { width: 140, height: 40 }
        }
    ],
    [MARKET_TYPE.moreInfo]: [
        {
            key: 1,
            prevUrl: import("../../page/static/userMarketStyles/了解更多/1.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/了解更多/1-1.png"),
            fontStyle: {
                top: 0.13224999999999998,
                left: 0.2017857142857143,
                fontSize: 14,
                color: "#fff",
                width: 0.66857142857142855,
                height: 0.48,
                title: "点击查看更多"
            },
            defaultSize: { width: 140, height: 40 }
        }
    ],
    [MARKET_TYPE.goBuy]: [
        {
            key: 1,
            prevUrl: import("../../page/static/userMarketStyles/立即购买/1.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/立即购买/1-1.png"),
            fontStyle: {
                top: 0.3052488122030508,
                left: 0.2998571428571428,
                fontSize: 14,
                color: "#fff",
                width: 0.42857142857142855,
                height: 0.48601000250062515,
                title: "立即购买"
            },
            defaultSize: { width: 140, height: 39.99 }
        },
        {
            key: 2,
            prevUrl: import("../../page/static/userMarketStyles/立即购买/2.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/立即购买/2-1.png"),
            fontStyle: {
                top: 0.09952488122030508,
                left: 0.2998571428571428,
                fontSize: 14,
                color: "rgb(86, 183, 134)",
                width: 0.42857142857142855,
                height: 0.48001000250062515,
                title: "立即抢购"
            },
            defaultSize: { width: 140, height: 39.99 }
        },
        {
            key: 3,
            prevUrl: import("../../page/static/userMarketStyles/立即购买/3.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/立即购买/3-1.png"),
            fontStyle: {
                top: 0.19952488122030508,
                left: 0.0298571428571428,
                fontSize: 14,
                color: "#000",
                width: 0.77857142857142855,
                height: 0.58001000250062515,
                title: "立即购买"
            },
            defaultSize: { width: 140, height: 39.99 }
        }
    ],
    [MARKET_TYPE.welfare]: [
        {
            key: 1,
            prevUrl: import("../../page/static/userMarketStyles/领取福利/1.gif"),
            backgroundUrl: import("../../page/static/userMarketStyles/领取福利/1-1.gif"),
            fontStyle: {
                top: 0.42,
                left: 0.18,
                fontSize: 12,
                color: "#ffffff",
                width: 0.602,
                height: 0.25,
                title: "点击领取"
            },
            defaultSize: { width: 110, height: 110 },
        },
        {
            key: 2,
            prevUrl: import("../../page/static/userMarketStyles/领取福利/2.gif"),
            backgroundUrl: import("../../page/static/userMarketStyles/领取福利/2-1.gif"),
            fontStyle: {
                top: 0.06,
                left: 0.10,
                fontSize: 12,
                color: "#ffffff",
                width: 0.602,
                height: 0.29,
                title: "百万好礼待瓜分"
            },
            defaultSize: { width: 168, height: 61.5 },
        },
    ],
    [MARKET_TYPE.link]: [
        {
            key: 1,
            prevUrl: import("../../page/static/userMarketStyles/跳转链接/1.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/跳转链接/1-1.png"),
            fontStyle: {
                top: 0.21600000000000003,
                left: 0.3157857142857143,
                fontSize: 14,
                color: "#fff",
                width: 0.42857142857142855,
                height: 0.48,
                title: "查看地址"
            },
            defaultSize: { width: 140, height: 40 }
        },
        {
            key: 2,
            prevUrl: import("../../page/static/userMarketStyles/跳转链接/2.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/跳转链接/2-1.png"),
            fontStyle: {
                top: 0.14000000000000004,
                left: 0.106,
                fontSize: 14,
                color: "#1bc7b1",
                width: 0.82857142857142855,
                height: 0.48,
                title: "点击查看公司地址"
            },
            defaultSize: { width: 140, height: 40 }
        },
        {
            key: 3,
            prevUrl: import("../../page/static/userMarketStyles/跳转链接/3.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/跳转链接/3-1.png"),
            fontStyle: {
                top: 0.2165,
                left: 0.0655,
                fontSize: 14,
                color: "#fff",
                width: 0.64857142857142855,
                height: 0.48,
                title: "点击查看地址"
            },
            defaultSize: { width: 140, height: 40 }
        },
        {
            key: 4,
            prevUrl: import("../../page/static/userMarketStyles/跳转链接/4.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/跳转链接/4-1.png"),
            fontStyle: {
                top: 0.19124999999999998,
                left: 0.3642,
                fontSize: 14,
                color: "#fff",
                width: 0.62857142857142855,
                height: 0.48,
                title: "加入购物车"
            },
            defaultSize: { width: 140, height: 40 }
        },
        {
            key: 6,
            prevUrl: import("../../page/static/userMarketStyles/跳转链接/6.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/跳转链接/6-1.png"),
            fontStyle: {
                top: 0.19124999999999998,
                left: 0.1042,
                fontSize: 13,
                color: "#fff",
                width: 0.88857142857142855,
                height: 0.66,
                title: "点我哟！"
            },
            defaultSize: { width: 69, height: 32 }
        }
        // {
        //     key: 5,
        //     prevUrl: import("../../page/static/userMarketStyles/跳转链接/5.svg"),
        //     backgroundUrl: import("../../page/static/userMarketStyles/跳转链接/5-1.png"),
        //     fontStyle: {
        //         top: 0.22149999999999997,
        //         left: 0.3021428571428571,
        //         fontSize: 14,
        //         color: "#fff",
        //         width: 0.42857142857142855,
        //         height: 0.48,
        //         title: "立即报名"
        //     },
        //     defaultSize: { width: 140, height: 40 }
        // },
        // {
        //     key: 6,
        //     prevUrl: import("../../page/static/userMarketStyles/我要应聘/1.svg"),
        //     backgroundUrl: import("../../page/static/userMarketStyles/我要应聘/1-1.png"),
        //     fontStyle: {
        //         top: 0.19775,
        //         left: 0.41257142857142853,
        //         fontSize: 14,
        //         color: "#1bc7b1",
        //         width: 0.51857142857142855,
        //         height: 0.48,
        //         title: "应聘戳这里"
        //     },
        //     defaultSize: { width: 140, height: 40 }
        // },
        // {
        //     key: 7,
        //     prevUrl: import("../../page/static/userMarketStyles/领取福利/1.gif"),
        //     backgroundUrl: import("../../page/static/userMarketStyles/领取福利/1-1.gif"),
        //     fontStyle: {
        //         top: 0.61,
        //         left: 0.34,
        //         fontSize: 14,
        //         color: "#ea9442",
        //         width: 0.3423,
        //         height: 0.8,
        //         title: "获得了一份大礼包"
        //     },
        //     defaultSize: { width: 335, height: 335 }
        // },
        // {
        //     key: 8,
        //     prevUrl: import("../../page/static/userMarketStyles/立即购买/2.svg"),
        //     backgroundUrl: import("../../page/static/userMarketStyles/立即购买/2-1.png"),
        //     fontStyle: {
        //         top: 0.09952488122030508,
        //         left: 0.2998571428571428,
        //         fontSize: 14,
        //         color: "rgb(86, 183, 134)",
        //         width: 0.42857142857142855,
        //         height: 0.48001000250062515,
        //         title: "立即抢购"
        //     },
        //     defaultSize: { width: 140, height: 39.99 }
        // },
        // {
        //     key: 9,
        //     prevUrl: import("../../page/static/userMarketStyles/立即购买/1.svg"),
        //     backgroundUrl: import("../../page/static/userMarketStyles/立即购买/1-1.png"),
        //     fontStyle: {
        //         top: 0.3352488122030508,
        //         left: 0.2998571428571428,
        //         fontSize: 14,
        //         color: "#fff",
        //         width: 0.42857142857142855,
        //         height: 0.48601000250062515,
        //         title: "立即购买"
        //     },
        //     defaultSize: { width: 140, height: 39.99 }
        // },
        // {
        //     key: 10,
        //     prevUrl: import("../../page/static/userMarketStyles/了解更多/1.svg"),
        //     backgroundUrl: import("../../page/static/userMarketStyles/了解更多/1-1.png"),
        //     fontStyle: {
        //         top: 0.13224999999999998,
        //         left: 0.2017857142857143,
        //         fontSize: 14,
        //         color: "#fff",
        //         width: 0.66857142857142855,
        //         height: 0.48,
        //         title: "点击查看了解更多"
        //     },
        //     defaultSize: { width: 140, height: 40 }
        // },
        // {
        //     key: 11,
        //     prevUrl: import("../../page/static/userMarketStyles/点击抽奖/1.gif"),
        //     backgroundUrl: import("../../page/static/userMarketStyles/点击抽奖/1-1.gif"),
        //     fontStyle: {
        //         width: 0.14,
        //         left: 0.45,
        //         top: 0.42,
        //         height: 0.2,
        //         color: "rgb(204,92,1)",
        //         title: "开始抽奖"
        //     },
        //     defaultSize: { width: 200, height: 200 }
        // }
    ],
    [MARKET_TYPE.applicant]: [
        {
            key: 1,
            prevUrl: import("../../page/static/userMarketStyles/我要应聘/1.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/我要应聘/1-1.png"),
            fontStyle: {
                top: 0.19775,
                left: 0.41257142857142853,
                fontSize: 14,
                color: "#1bc7b1",
                width: 0.51857142857142855,
                height: 0.48,
                title: "应聘戳这里"
            },
            defaultSize: { width: 140, height: 40 }
        },
        {
            key: 2,
            prevUrl: import("../../page/static/userMarketStyles/我要应聘/2.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/我要应聘/2-1.png"),
            fontStyle: {
                top: 0.20775,
                left: 0.02257142857142853,
                fontSize: 14,
                color: "#000",
                width: 0.62857142857142855,
                height: 0.48,
                title: "我要应聘"
            },
            defaultSize: { width: 140, height: 40 }
        }
    ]
};

export const USER_MARKET_STYLE_LIST = (() => {
    const a = { ..._USER_MARKET_STYLE_LIST };
    const linkChildren = [
        MARKET_TYPE.luck,
        MARKET_TYPE.moreInfo,
        MARKET_TYPE.welfare,
        MARKET_TYPE.goBuy,
        MARKET_TYPE.enroll,
        MARKET_TYPE.applicant
    ];
    for (const key of Object.keys(_USER_MARKET_STYLE_LIST)) {
        if (linkChildren.includes(Number(key))) {
            a[MARKET_TYPE.link] = a[MARKET_TYPE.link].concat(
                _USER_MARKET_STYLE_LIST[key].map(v => {
                    return { ...v, key: key * 100 + v.key };
                })
            );
        }
    }
    return a;
})();

function create(count, format) {
    const array = [];
    for (let i = 1; i <= count; i += 1) {
        array.push({
            key: i,
            prevKey: `${i}.${format}`,
            background: `${i}-1.${format}`
        });
    }

    const c = document.createElement("textarea");
    c.style.position = "absolute";
    c.style.left = "-9999px";
    c.style.bottom = "0";
    document.body.appendChild(c);
    c.textContent = JSON.stringify(array);
    c.focus();
    c.setSelectionRange(0, c.value.length);
    let a;
    try {
        a = document.execCommand("copy");
    } catch (b) {
        a = false;
    }
    document.body.removeChild(c);
    return "复制成功";
}

// (function(list) {
//     const keys = Object.keys(list);
//     keys.forEach(key => {
//         console.log(JSON.stringify(getStylesList({ type: key })).replace(/"/g, ""));
//     });
// })(USER_MARKET_STYLE_LIST);
