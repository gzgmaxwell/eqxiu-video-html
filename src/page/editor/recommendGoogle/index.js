import React from 'react';
import styles from './index.less';
import { prev } from 'Config/env';
import Modal from '../../components/modal';
import IsChrome from '../../static/isChrome.png';
import NotChrome from '../../static/notChrome.png';
import Button from '../../components/Button';
import Icon from '../../components/Icon';

class RecommendGoogle extends React.Component {

    constructor(props) {
        super(props);
    }

    state = {
        openModal: false,
    };


    details = () => {
        this.setState({ openModal: true });
    };
    onClose = () => {
        this.setState({ openModal: false });
    };
    install = () => {
        window.open('https://pc.qq.com/detail/1/detail_2661.html');
    };

    render() {
        const { props, state } = this;
        return (
            <div className={styles.google}>
                <span className={styles.chrome}>推荐使用Chrome谷歌浏览器</span>
                <span onClick={this.details} className={styles.details}>查看详情</span>
                <Modal visible={state.openModal} onCancel={this.onClose}>
                    <div className={styles.downloadBox}>
                        <Icon type='eqf-alert-f' className={styles.left}/>
                        <div className={styles.right}>
                            <p className={styles.title}>为了更好的编辑体验，请使用Chrome谷歌浏览器进行特效字/图的编辑。</p>
                            <p className={styles.titleS}>特效字和特效图在谷歌浏览器中编辑时，才能正常显示。
                                但最终生成视频效果不受浏览器限制。</p>
                            <div className={styles.imgBox}>
                                <img src={NotChrome} alt="非谷歌浏览器"/>
                                <img src={IsChrome} alt="谷歌浏览器"/>
                            </div>
                            <div className={styles.twoTitle}>
                                <span className={styles.notChrome}>非Chrome浏览器特效字预览样式</span> <span
                                className={styles.isChrome}>Chrome浏览器特效预览样式（所有浏览器生成视频效果）</span>
                            </div>
                            <div className={styles.BtnBox}>
                                <div onClick={this.onClose} className={styles.uninstall}>暂不安装</div>
                                <Button onClick={this.install}
                                        className={styles.install}>下载安装</Button>
                            </div>
                        </div>
                    </div>
                </Modal>
            </div>
        );
    }
}

export default RecommendGoogle;
