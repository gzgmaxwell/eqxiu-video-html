import React, { Component } from 'react';
import styles from './subscriptionGuide.less';
import foot from '../static/marketGuide/foot.png';
import env from 'Config/env';

const videoSrc = ['pre', 'pro'].includes(env.name)
class subscriptionGuide extends Component {
    constructor(props) {
        super(props);
        const yqCloud = videoSrc ? 'https://res.eqh5.com/Fjn2r9OGhv6JtKqCP2477quAEkTG' : 'http://test.res.eqh5.com/Fjn2r9OGhv6JtKqCP2477quAEkTG';
        const yqCloud1 = videoSrc ? 'https://res.eqh5.com/FmQxvkexlkwx9OhryvyY0D85dHpR' : 'http://test.res.eqh5.com/FmQxvkexlkwx9OhryvyY0D85dHpR';
        const yqCloud2 = videoSrc ? 'https://res.eqh5.com/FrL0i9-qCLhEcKick9JGpuuRkCka' : 'http://test.res.eqh5.com/FrL0i9-qCLhEcKick9JGpuuRkCka';
        this.state = {
            videos: [
                yqCloud,
                yqCloud1,
                yqCloud2,
            ],
        };
    }
    render() {
        const { videos } = this.state;
        return (
            <React.Fragment>
                <div className={styles.top__container}>
                    <div className={styles.top__content}>
                        <div>
                            <h1>如何寻找公众号链接</h1>
                        </div>
                    </div>
                </div>
                <div className={styles.body__container}>
                    <div className={`${styles.item}`}>
                        <img src={videos[0]} alt=""/>
                    </div>
                    <div className={`${styles.item}`}>
                        <img src={videos[1]} alt=""/>
                    </div>
                    <div className={`${styles.item}`}>
                        <img src={videos[2]} alt=""/>
                    </div>
                </div>
                <div className={styles.bottom_container}>
                    <img src={foot}/>
                </div>
            </React.Fragment>
        );
    }
}

export default subscriptionGuide;