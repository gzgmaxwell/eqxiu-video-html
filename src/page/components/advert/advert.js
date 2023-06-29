import React from 'react';
import styles from './advert.less';
import env, { eqxAdID } from 'Config/env';
import delayLoad from 'Util/delayLoad.js';

/* global eqxAdSDK */


class AdvertShow extends React.PureComponent {
    constructor(props) {
        super(props);
        this.eqxAdSDK = null;
        this.adBox = React.createRef();
        this.banner = '';
        delayLoad.delayLoadCSS(env.plugin.eqxAdSDK);
        this.jsLoader = delayLoad.delayLoadJS(env.plugin.eqxAdSDK);
        this.state = {
            visible: false,
            adContent: null,
        };
    }


    componentDidMount() {
        this.loadBanner();
    }

    componentWillUnmount() {
        if (this.eqxAdSDK) {
            this.eqxAdSDK.apis.cancelAuto('clear');
        }
    }

    loadBanner = () => {
        try {
            this.jsLoader.then(() => {
                if (this.eqxAdSDK) {
                    this.eqxAdSDK.apis.cancelAuto('clear');
                }
                eqxAdSDK.carousel(
                    {
                        el: this.adBox.current, // 传原生dom,
                        mode: 'responsive',
                        mediaId: eqxAdID.banner,
                        fun: 'ease', // 动态曲线 , 默认值ease , 可选择 linear | ease | ease-in | ease-in-out
                        moveTime: 0.5, // 滑动动作时间 单位s，默认0.5
                        runTime: 3, // 总耗时 单位s，默认2，决定自动轮播速度
                        pagination: true, // 是否显示轮播图底部小圆点，默认true
                        navigation: true, // 是否开启前进后退按钮，默认true
                    },
                ).then((res) => {
                    this.eqxAdSDK = res;
                    if (this.eqxAdSDK) {
                        this.eqxAdSDK.apis.cancelAuto('clear');
                    }
                    this.setState({
                        adContent: res,
                    });
                });
            });
        } catch (e) {
            console.error(e);
        }
    };

    render() {
        const { state: { adContent }, props: { isShowAD } } = this;
        console.log(adContent);
        return (
            <div style={{ visibility: `${isShowAD ? 'visible' : ''}` }}
                 className={styles.adBox}>
                <div ref={this.adBox} className={styles.position}></div>
                <div className="swiper-container" ref={this.lun}>
                    <div className="swiper-wrapper">
                       {(adContent && adContent.data) &&
                        adContent.data.map((item, index) =>
                            <div className="swiper-slide" key={index}>
                                <a href={item.linkUrl}>
                                    <img src={item.picSrc} alt=""/>
                                </a>
                            </div>,
                        )
                        }
                    </div>
                    <div className="swiper-pagination"
                         style={{ width: '1200px' }}></div>
                </div>
            </div>
        );
    }
}

export default AdvertShow;
