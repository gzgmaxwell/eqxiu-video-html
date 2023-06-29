import React from 'react';
import styles from './advertMy.less';
import { advertList } from '../../../api/ad';
import delayLoad from '../../../util/delayLoad';
import env, { eqxAdID } from 'Config/env';

class AdvertShow extends React.PureComponent {
    constructor(props) {
        super(props);
        this.lun = React.createRef();
        this.swiper = null;
        this.state = {
            adContent: null,
        };
    }


    componentDidMount() {
        this.loadBanner();
    }
    componentWillUnmount() {
        if (this.swiper) {
            this.swiper.destroy();
        }
    }

    loadBanner = () => {
        advertList(eqxAdID.banner)
            .then((res) => {
                const { data: { success, list } } = res;
                if (success) {
                    this.setState({ adContent: list }, this.loadCropper);
                }
            });

    };

    loadCropper = () => {
        delayLoad.delayLoadCSS(env.css.swiper);
        delayLoad.delayLoadJS(env.plugin.swiper)
            .then((res) => {
                window.swiper = this.swiper = new Swiper(this.lun.current, {
                    width: 480,
                    height: 144,
                    loop: true,
                    autoplay: 2000,
                    pagination: '.swiper-pagination',
                    paginationClickable: '.swiper-pagination',
                    nextButton: '.swiper-button-next',
                    prevButton: '.swiper-button-prev',
                    spaceBetween: 30,
                });
            });
    };
    render() {
        const { state: { adContent } } = this;
        return (
            <div className={styles.adBox}>
                <div className="swiper-container" ref={this.lun}>
                    <div className="swiper-wrapper">
                        {adContent &&
                        adContent.map((item, index) =>
                            <div className="swiper-slide" key={index}>
                                <a className={styles.active} href={item.linkUrl} target='_blank'>
                                    <img src={item.picSrc} alt=""/>
                                </a>
                            </div>,
                        )
                        }
                    </div>
                    <div className="swiper-pagination" style={{ width: '480px' }}></div>
                    <div className="swiper-button-prev swiper-button-white"></div>
                    <div className="swiper-button-next swiper-button-white"></div>
                </div>
            </div>
        );
    }
}

export default AdvertShow;
