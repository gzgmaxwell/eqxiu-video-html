import React, { Component } from 'react';
import { SingleColorPicker } from 'Components/colorPicker';
import styles from './chartlet.less';
import { getMyFont } from 'Api/user';
import { host } from 'Config/env';
import { formatEQXMessage } from 'Util/event';
import 'react-virtualized/styles.css';
import Modal from 'Components/modal';
import env from 'Config/env';
import { genUrl } from '../../../../util/image';
import Button from '../../../components/Button';

export default class Chartlet extends Component {

    state = {};

    onChange = (value) => {
        const { artJson, onChange } = this.props;
        onChange({
            ...artJson,
            backgroundImage: value,
        });
    };

    /**
     * 触发选择背景图的方法
     * */
    handleReplace = () => {
        this.setState({
            nowAspectRatio: false,
            callbackFunction: this.afterChangeBackgroundImg,
        });
        this.onOpen(this.getImgMessage, '/material/image');
    };

    /**
     * 改变背景图
     * @param url
     */
    afterChangeBackgroundImg = (url) => {
        this.onChange(genUrl(url));
        this.onClose();
    };

    /**
     * 打开的通用方法
     * @param callBack 回调函数
     * @param isFrame 是否frame 是的话直接传入地址会自动拼接
     * @param children 不是frame 的话可以传入子组件
     */
    onOpen = (callBack, isFrame = false, children = '', modalProps = {}) => {
        const content = isFrame ? <iframe
            onLoad={this.onLoadIframe}
            src={`${env.host.auth}${isFrame}?t=${new Date().getTime()}&source=music&notShowSys=true`}
            scrolling="no" frameBorder="0"
            style={{
                width: 960,
                height: 600,
                display: 'block',
                lineHeight: 0,
                fontSize: 0,
            }}
        /> : children;
        window.addEventListener('message', callBack);
        this.setState({
            modalOpen: true,
            modalProps,
            modalContent: content,
        });
    };

    /**
     * 关闭 modal框,取消监听事件
     */
    onClose = (clearSelect = false) => {
        window.removeEventListener('message', this.getImgMessage);
        this.setState({
            modalOpen: false,
            modalProps: {},
            modalContent: '',
        });
        if (clearSelect) {
            this.setState({
                callbackFunction: null,
            });
        }
    };

    /**
     * 抓取图片选择的URL地址
     * @param message
     */
    getImgMessage = (message) => {
        const data = formatEQXMessage(message);
        if (data === false) {
            return;
        }
        if (data.type === 'close') {
            this.onClose(true);
        }
        if (data.type === 'success') {
            this.onClose();
            const url = env.host.musicFile + data.data[0].path;
            this.onChange(url);
        }
    };

    onLoadIframe = (e) => {
        // console.log(e.target.contentWindow.document.getElementsByClassName('iconW')
        //     .forEach(item => {
        //         if (item.class === 'iconW eqf-why-f ') {
        //             item.style = 'display: none';
        //         }
        //     }));
    };

    // 封面改变后清除毁掉函数
    onBackgroundImageLoad = () => {
        if (this.state.callbackFunction === this.afterChangeBackgroundImg) {
            this.setState({ callbackFunction: null });
        }
    };

    render() {
        const { artJson } = this.props;
        const { modalProps, modalContent, modalOpen } = this.state;
        const { backgroundImage } = artJson;
        return (<div className={styles.pb_20}>
            <div className={styles.spaceLine}/>
            <div className={styles.set__title}>
                贴图文字
            </div>

            <div className={styles.backgroundImage}>
                <div className={styles.left} onClick={this.handleReplace}>
                    <img src={genUrl(backgroundImage)} onLoad={this.onBackgroundImageLoad}/>
                </div>
                <div className={styles.right}>
                    <Button onClick={this.handleReplace}>更换图片</Button>
                </div>
            </div>
            <Modal {...modalProps} onCancel={this.onClose}
                   visible={modalOpen}>{modalContent}</Modal>
        </div>);
    }
}
