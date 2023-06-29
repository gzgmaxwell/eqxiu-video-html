module.exports = {
    name: 'pro',
    version: 210.0,
    projectname: '视频',
    prev: '/video',
    host: {
        cdn: '//www.eqxiu.com/video',
        // cdn: '//as.eqh5.com/video',
        client: '', // 项目域名
        auth: '//www.eqxiu.com', // 账号地址
        store: '//store.eqxiu.com', // 公共库地址
        uploadtoken: '//service.eqxiu.com', // 上传token地址
        preView: '//a.veqxiu.com/video/player', // 分享页地址
        preView1: 'https://a.veqxiu.com',
        service: '//vt-api.eqxiu.com', // 视频模板服务地址
        service2: '//vv-api.eqxiu.com', // 视频服务地址
        service3: '//p1.eqxiu.com', // h5轻设计艺术字
        mall: '//mall.eqxiu.com', // 服务地址
        passport: '//passport.eqxiu.com', // 用户信息地址
        font: '//font.eqh5.com/', // 获取用户已购买的字体库
        font2: '//res1.eqh5.com/', // 获取字体文件
        file: '//res6.eqh5.com/', // 七牛图片地址
        musicFile: '//res.eqh5.com/', // 音乐/用户头像地址
        tencentcdn: '//video-1251586368.file.myqcloud.com', // 腾讯视频地址
        tencentimgcdn: '//video-1251586368.image.myqcloud.com', // 腾讯图片地址
        eqxiuzhan: '//chuangyiyun.eqxiuzhan.com', // 正版字体、正版动图
        qingshejihelp: '//qingsheji.help.eqxiu.com', // 月度更新
        xdCost: '//pay.eqxiu.com/pay/xd-cost', // 秀点消耗弹窗
        malPayMember: '//www.eqxiu.com/mall-pay/member', // 创意云会员弹窗
        // mediaAd: '//s8-api-cdn.eqxiu.com', //新媒体中心视频广告 流量域名
        mediaAd: '//s8-api.eqxiu.com', // 流量域名
        eqxAds: '//iom-api.eqxiu.com', // 广告接口
        mediaPromoteAd: '//ad.eqxiu.com' // 新媒体互动推广域名
    },
    storePrev: '',
    upload: {
        bucket: 'video',
        region: 'ap-shanghai',
        appid: '1251586368',
        host: '.myqcloud.com',
        upload_url: '',
        tokenUrl: '/store/qcloud/token',
    },
    plugin: {
        react: '//lib.eqh5.com/react/16.8.2/react.production.min.js',
        axios: '//lib.eqh5.com/axios/0.17.1/axios.min.js',
        cropper: '//lib.eqh5.com/cropperjs/1.3.5/cropper.min.js',
        moment: '//lib.eqh5.com/moment.js/2.7.0/moment.min.js',
        moment_lang: '//lib.eqh5.com/moment.js/2.7.0/lang/zh-cn.min.js',
        jquery: '//lib.eqh5.com/jquery/3.3.1/jquery.min.js',
        eqxLayout: '//lib.eqh5.com/eqx.layout/1.5.4/eqx.layout.min.js',
        qrcode: '//lib.eqh5.com/@eqxiu/lrsjng.jquery-qrcode/0.14.0.1/jquery-qrcode.min.js',
        swiper: '//lib.eqh5.com/Swiper/3.4.2/js/swiper.jquery.min.js',
        html2canvas: '//lib.eqh5.com/html2canvas/1.0.0-alpha.12/html2canvas.min.js',
        fabric: 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/2.4.6/fabric.min.js',
        ygfz: '//lib.eqh5.com/ygfz/4.3.1/AnalysysAgent_JS_SDK.min.js',
        eqxAdSDK: '//lib.eqh5.com/eqx.sdk.ad/1.2.1/index.js',
    },
    css: {
        cropper: '//lib.eqh5.com/cropperjs/1.3.5/cropper.min.css',
        swiper: '//lib.eqh5.com/Swiper/3.4.2/css/swiper.min.css',
        eqxAdSDK: '//lib.eqh5.com/eqx.sdk.ad/1.2.1/index.css',
    },
    params: {
        musicTagId: 890727, // 音乐库分类Id
    },
    bigData: {
        appkey: 'f1cc0ae3e0d07822', // APPKEY
        uploadURL: 'https://ark-push1.eqxiu.com', // 上传数据的地址
        visitorConfigURL: 'https://ark-push1.eqxiu.com', // 上传数据的地址
        debugMode: 0,
        autoWebstay: true, // 浏览深度线
    },
    eqxAdID: {
        advert: 61,
        newFun: 62,
        banner: 94,
    },
};
