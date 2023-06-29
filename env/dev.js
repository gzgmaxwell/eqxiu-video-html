const { css, prev, projectname, version, storePrev } = require('./pro');
const { host: { font, font2, client }, plugin, params, bigData, eqxAdID } = require('./test');
module.exports = {
    name: 'dev',
    projectname,
    version,
    host: {
        cdn: '//video.eqshow.cn',
        client,
        auth: '//www.eqshow.cn',
        uploadtoken: '//service.eqshow.cn/',
        store: '//store.eqxiu.com',
        preView: 'http://video-share.yqxiu.cn/video/player',
        service: '//vt-api.video.eqshow.cn',
        service2: '//vv-api.video.eqshow.cn',
        service3: '//p1.eqxiu.com', //h5轻设计艺术字
        mall: '//mall.eqshow.cn',
        passport: '//passport.eqshow.cn',
        font,
        font2,
        file: '//res6.eqh5.com/',
        musicFile: '//test.res.eqh5.com/',
        tencentcdn: '//video-test-1251586368.file.myqcloud.com',
        tencentimgcdn: '//video-test-1251586368.image.myqcloud.com',
        eqxiuzhan: '//chuangyiyun.eqxiuzhan.com', // 正版字体、正版动图
        qingshejihelp: '//qingsheji.help.eqxiu.com', // 月度更新
        xdCost: '//pay.yqxiu.cn/pay/xd-cost', // 秀点消耗弹窗
        malPayMember: '//www.yqxiu.cn/mall-pay/member', // 创意云会员弹窗
    },
    prev,
    storePrev,
    upload: {
        bucket: 'video-test',
        region: 'ap-shanghai',
        appid: '1251586368',
        host: '.myqcloud.com',
        upload_url: '',
        tokenUrl: '/store/qcloud/token',
    },
    plugin,
    css,
    params,
    bigData,
    eqxAdID,
};
