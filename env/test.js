const { css, prev, version, projectname, plugin, host: { client }, bigData, eqxAdID } = require(
    './pro');

module.exports = {
    name: 'test',
    version,
    projectname,
    host: {
        cdn: '//www.yqxiu.cn/video',
        client: '//www.yqxiu.cn/video',
        auth: '//www.yqxiu.cn',
        uploadtoken: '//service.yqxiu.cn/',
        store: '//mall.yqxiu.cn',
        // store: '//store.eqxiu.com',
        preView: '//share.video.yqxiu.cn/video/player',
        preView1: '//share.video.yqxiu.cn',
        service: '//vt-api.video.yqxiu.cn',
        service2: '//vv-api.video.yqxiu.cn',
        service3: '//p1.yqxiu.cn', // h5轻设计艺术字
        mall: '//mall.yqxiu.cn',
        font: '//font.eqh5.com/', // 获取用户已购买的字体库
        // font2: '//test.res.eqh5.com/', // 获取字体文件
        font2: '//res1.eqh5.com/', // 获取字体文件
        passport: '//passport.yqxiu.cn',
        file: '//res6.eqh5.com/',
        musicFile: '//test.res.eqh5.com/',
        tencentcdn: '//video-test-1251586368.file.myqcloud.com',
        tencentimgcdn: '//video-test-1251586368.image.myqcloud.com',
        eqxiuzhan: '//chuangyiyun.eqxiuzhan.com', // 正版字体、正版动图
        qingshejihelp: '//qingsheji.help.eqxiu.com', // 月度更新
        xdCost: '//pay.yqxiu.cn/pay/xd-cost', // 秀点消耗弹窗
        // xdCost: '//pay.eqxiu.com/pay/xd-cost', // 秀点消耗弹窗
        malPayMember: '//www.yqxiu.cn/mall-pay/member', // 创意云会员弹窗
        // malPayMember: '//www.eqxiu.com/mall-pay/member', // 创意云会员弹窗
        mediaAd: '//s8-api.yqxiu.cn', // 新媒体中心视频广告 流量域名
        eqxAds: '//iom-api.yqxiu.cn', // 广告接口
        mediaPromoteAd: '//ad.yqxiu.cn' // 新媒体互动推广域名
    },
    prev,
    upload: {
        bucket: 'video-test',
        region: 'ap-shanghai',
        appid: '1251586368',
        host: '.myqcloud.com',
        upload_url: '',
        tokenUrl: '/store/qcloud/token',
    },
    plugin: {
        ...plugin,
        eqxLayout: '//lib.yqxiu.cn/eqx.layout/eqx.layout.js',
        eqxAdSDK: '//lib.yqxiu.cn/eqx.sdk.ad/index.js',
    },
    css: {
        ...css,
        eqxAdSDK: '//lib.yqxiu.cn/eqx.sdk.ad/index.css',
    },
    params: {
        musicTagId: 890498,
        // musicTagId: 890727, // 音乐库分类Id
    },
    bigData: {
        ...bigData,
        appkey: 'd2fd739500271934', // APPKEY
        debugMode: 2,
    },
    eqxAdID: {
        ...eqxAdID,
        advert: 175,
        newFun: 176,
        banner: 94,
    },
};
