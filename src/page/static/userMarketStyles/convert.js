var fs = require("fs");
var path = require("path"); //解析需要遍历的文件夹
var filePath = path.resolve("./");
const sharp = require("sharp");

const str = `
{
    [MARKET_TYPE.phone]: [
        {
            key: 1,
            prevUrl: import("../../page/static/userMarketStyles/拨打电话/1.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/拨打电话/1-1.svg")
        },
        {
            key: 2,
            prevUrl: import("../../page/static/userMarketStyles/拨打电话/2.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/拨打电话/2-1.svg")
        },
        {
            key: 3,
            prevUrl: import("../../page/static/userMarketStyles/拨打电话/3.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/拨打电话/3-1.svg")
        },
        {
            key: 4,
            prevUrl: import("../../page/static/userMarketStyles/拨打电话/4.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/拨打电话/4-1.svg")
        },
        {
            key: 5,
            prevUrl: import("../../page/static/userMarketStyles/拨打电话/5.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/拨打电话/5-1.svg")
        }
    ],
    [MARKET_TYPE.enroll]: [
        {
            key: 1,
            prevUrl: import("../../page/static/userMarketStyles/点击报名/1.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/点击报名/1-1.svg")
        }
    ],
    [MARKET_TYPE.luck]: [
        {
            key: 1,
            prevUrl: import("../../page/static/userMarketStyles/点击抽奖/1.gif"),
            backgroundUrl: import("../../page/static/userMarketStyles/点击抽奖/1-1.gif"),
            elementStley: {
                width: 0.14,
                left: 0.46,
                top: 0.42,
                height: 0.2
            }
        }
    ],
    [MARKET_TYPE.wechat]: [
        {
            key: 1,
            prevUrl: import("../../page/static/userMarketStyles/关注公众号/1.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/关注公众号/1-1.svg")
        },
        {
            key: 2,
            prevUrl: import("../../page/static/userMarketStyles/关注公众号/2.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/关注公众号/2-1.svg")
        },
        {
            key: 3,
            prevUrl: import("../../page/static/userMarketStyles/关注公众号/3.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/关注公众号/3-1.svg")
        },
        {
            key: 4,
            prevUrl: import("../../page/static/userMarketStyles/关注公众号/4.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/关注公众号/4-1.svg")
        },
        {
            key: 5,
            prevUrl: import("../../page/static/userMarketStyles/关注公众号/5.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/关注公众号/5-1.svg")
        }
    ],
    [MARKET_TYPE.moreInfo]: [
        {
            key: 1,
            prevUrl: import("../../page/static/userMarketStyles/了解更多/1.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/了解更多/1-1.svg")
        }
    ],
    [MARKET_TYPE.goBuy]: [
        {
            key: 1,
            prevUrl: import("../../page/static/userMarketStyles/立即购买/1.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/立即购买/1-1.svg")
        },
        {
            key: 2,
            prevUrl: import("../../page/static/userMarketStyles/立即购买/2.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/立即购买/2-1.svg")
        }
    ],
    [MARKET_TYPE.welfare]: [
        {
            key: 1,
            prevUrl: import("../../page/static/userMarketStyles/领取福利/1.gif"),
            backgroundUrl: import("../../page/static/userMarketStyles/领取福利/1-1.gif")
        }
    ],
    [MARKET_TYPE.link]: [
        {
            key: 1,
            prevUrl: import("../../page/static/userMarketStyles/跳转链接/1.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/跳转链接/1-1.svg")
        },
        {
            key: 2,
            prevUrl: import("../../page/static/userMarketStyles/跳转链接/2.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/跳转链接/2-1.svg")
        },
        {
            key: 3,
            prevUrl: import("../../page/static/userMarketStyles/跳转链接/3.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/跳转链接/3-1.svg")
        },
        {
            key: 4,
            prevUrl: import("../../page/static/userMarketStyles/跳转链接/4.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/跳转链接/4-1.svg")
        },
        {
            key: 5,
            prevUrl: import("../../page/static/userMarketStyles/跳转链接/5.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/跳转链接/5-1.svg")
        }
    ],
    [MARKET_TYPE.applicant]: [
        {
            key: 1,
            prevUrl: import("../../page/static/userMarketStyles/我要应聘/1.svg"),
            backgroundUrl: import("../../page/static/userMarketStyles/我要应聘/1-1.svg")
        }
    ]
};`;
const reg = /backgroundUrl\:\simport\(\"(.+?\.svg)/gm;
const basePath = "D:/git/src/page/static";
const pathList = str
    .match(reg)
    .map(v =>
        v
            .replace('backgroundUrl: import("', "")
            .replace("../../page/static", "D:/git/src/page/static")
    );
const textReg = /\<text.+?\<\/text>/;
const tranReg = /translate\(.+?\)/;
const viewReg = /viewBox="(.+?)"/;
let reuslt = [];
const plist = [];
pathList.forEach(v => {
    var content = fs.readFileSync(v, "utf-8");
    const text = content.match(textReg)[0];
    if (!text) {
        console.log("空：", v);
    }
    console.log(v);
    const [aLeft, aTop, aWidth, aHeight] = (viewReg.exec(content) || [1, "0"])[1]
        .split(" ")
        .map(Number);
    const [left, top] = text
        .match(tranReg)[0]
        .replace("translate(", "")
        .replace(")", "")
        .split(" ");
    // console.log(text);
    const color = (/fill="(.+?)"/gim.exec(text) ||
        /fill\:(\#.+?)[;"]/gim.exec(text) || [0, "#fff"])[1];
    const fontSize = Number((/font-size="(.+?)"/gim.exec(text) || [0, 14])[1]);
    const roundedCorners = Buffer.from(content.replace(text, ""));
    const roundedCornerResizer = sharp(roundedCorners)
        .png()
        .toFile(v.replace("-1.svg", "-1.png"), (err, info) => {
            if (err) {
                console.log(v);
            }
            // console.log(v, ": ", err, info);
        });
    plist.push(roundedCornerResizer);
    const defaultHeight = 16;
    reuslt.push({
        path: v.replace("D:/git/src/page/static", "../../page/static"),
        newPath: v
            .replace("-1.svg", "-1.png")
            .replace("D:/git/src/page/static", "../../page/static"),
        fontStyle: {
            top: (top - defaultHeight) / aHeight,
            left: left / aWidth,
            fontSize,
            color,
            width: 60 / aWidth,
            height: defaultHeight / aHeight
        },
        defaultSize: {
            width: aWidth,
            height: aHeight
        }
    });
});
console.log(reuslt);
Promise.all(plist).then(v => v);
