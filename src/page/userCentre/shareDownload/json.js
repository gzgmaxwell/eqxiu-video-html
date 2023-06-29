import { VIDEO_RENDER_TYPE } from '../../../config/staticParams';

export const jsonList = [
    {
        choiceType: VIDEO_RENDER_TYPE.SDWaterMark,
        boxDOM: 'freeBg',
        titleDom: 'titleColor1',
        titleText: '标清有水印',
        xiuDotText: '免费',
        xiuDotPrice: '',
        leftLabel: [{
            className: 'yes',
            type: 'eqf-yes-f',
        }, {
            className: 'no',
            type: 'eqf-no-f',
        }, {
            className: 'no',
            type: 'eqf-no-f',
        }, {
            className: 'no',
            type: 'eqf-no-f',
        }],
        rightLabel: [{
            className: 'give',
            text: '在线分享/下载',
        }, {
            className: 'noGive',
            text: '无水印',
        }, {
            className: 'noGive',
            text: '适合正式场合使用',
        }, {
            className: 'noGive',
            text: '适合大屏幕上播放',
        }],
    },
    {
        choiceType: VIDEO_RENDER_TYPE.SDNoWaterMark,
        boxDOM: 'SDBg',
        titleDom: 'titleColor2',
        titleText: '标清无水印',
        xiuDotText: '秀点',
        xiuDotPrice: 'priceSD',
        priceRate: 'SDprice',
        leftLabel: [{
            className: 'yes',
            type: 'eqf-yes-f',
        }, {
            className: 'yes',
            type: 'eqf-yes-f',
        }, {
            className: 'no',
            type: 'eqf-no-f',
        }, {
            className: 'no',
            type: 'eqf-no-f',
        }],
        rightLabel: [{
            className: 'give',
            text: '在线分享/下载',
        }, {
            className: 'give',
            text: '无水印',
        }, {
            className: 'noGive',
            text: '适合正式场合使用',
        }, {
            className: 'noGive',
            text: '适合大屏幕上播放',
        }],
    },
    {
        choiceType: VIDEO_RENDER_TYPE.HDNoWaterMark,
        boxDOM: 'SDBg',
        titleDom: 'titleColor3',
        titleText: '高清无水印',
        xiuDotText: '秀点',
        xiuDotPrice: 'priceHD',
        priceRate: 'HDprice',
        leftLabel: [{
            className: 'yes',
            type: 'eqf-yes-f',
        }, {
            className: 'yes',
            type: 'eqf-yes-f',
        }, {
            className: 'yes',
            type: 'eqf-yes-f',
        }, {
            className: 'yes',
            type: 'eqf-yes-f',
        }],
        rightLabel: [{
            className: 'give',
            text: '在线分享/下载',
        }, {
            className: 'give',
            text: '无水印',
        }, {
            className: 'give',
            text: '适合正式场合使用',
        }, {
            className: 'give',
            text: '适合大屏幕上播放',
        }],
    },
];