const { plugin, css, version, prev, projectname, storePrev, host, params, bigData, eqxAdID, } = require(
    './pro');

module.exports = {
    name: 'pre',
    version,
    projectname,
    host: {
        ...host,
        cdn: '//www.eqxiu.com/video',
        // preView: '//video-share.eqxiu.cc/video/player',
        // mediaAd: '//s8-qpi.eqxiu.cc', //新媒体中心视频广告
    },
    prev: '/video',
    storePrev,
    upload: {
        bucket: 'video',
        region: 'ap-shanghai',
        appid: '1251586368',
        host: '.myqcloud.com',
        upload_url: '',
        tokenUrl: '/store/qcloud/token',
    },
    plugin: {
        ...plugin,
    },
    css,
    params,
    bigData,
    eqxAdID,
};
