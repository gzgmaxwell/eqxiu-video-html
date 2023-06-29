import React, { Component } from 'react';
import { connect } from 'dva';
import { Message } from 'antd';
import lodash from 'lodash';
import Modal from 'Components/modal';
import Button from 'Components/Button';
import env from 'Config/env';
import { genUrl } from 'Util/image';
import { formatEQXMessage } from 'Util/event';
import Cropper from 'Components/cropper';
import styles from './image.less';
import { getImgAspectRatioByUrl } from '../../../../util/image';
import { CANVAS_TYPE, WORKSPACE_SIZE } from '../../../../config/staticParams';
import { contrast, handleMaxOrMinNum } from '../../../../util/data';
import { SingleColorPicker } from '../../../components/colorPicker';
import OpacityInput from '../../../components/input/opacityInput';
import eventEmitter from '../../../../services/EventListener';

@connect(({ workspace }) => ({ workspace }))
export default class Image extends Component {
    state = {
        nowAspectRatio: null,
    };

    shouldComponentUpdate(nextProps, nextState) {
        if (!lodash.isEqual(this.state, nextState)) {
            return true;
        }
        let { workspace: { dataList = [], activeIndex = null } = {} } = this.props;
        const nowData = dataList[activeIndex] || {};
        ({
            workspace: {
                dataList =[],
                activeIndex = null,
            } = {},
        } = nextProps);
        const newData = dataList[activeIndex] || {};
        if (contrast(nowData, newData, ['backgroundColor', 'url', 'opacity'])) {
            return true;
        }
        return false;
    }

    /**
     * 改变背景图的透明度
     * */
    onOpacityChange = (data) => {
        let value = 1 - ~~data / 100;
        if (Number.isNaN(value)) {
            return;
        }
        if (value < 0) {
            value = 0;
        }
        if (value > 1) {
            value = 1;
        }
        this.changeNow({ opacity: value });
    };


    // 保存数据
    changeNow = (payload) => {
        this.props.dispatch({
            type: 'workspace/changeNow',
            payload,
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
     * 裁剪图片
     * */
    handleCut = () => {
        const { dataList, activeIndex } = this.props.workspace;
        const { url, cutParams = null } = dataList[activeIndex];
        const cutUrl = cutParams && cutParams.oriUrl || url;
        this.onOpen(() => {
        }, false, <Cropper
            image={cutUrl}
            cutParams={cutParams}
            onClose={this.onClose}
            onChange={(curl, positionObj) => this.afterChangeBackgroundImg(curl, cutUrl, positionObj)} />);
    };
    /**
     * 改变背景图
     * @param url
     */
    afterChangeBackgroundImg = (url, oriUrl = false, positionObj = {}) => {
        this.handleCropperImg(genUrl(url), oriUrl, positionObj);
        this.onClose();
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
            if (data.data[0].path.includes('.gif')) {
                Message.info('您选择了gif图片,正在处理中...');
                this.props.dispatch({
                    type: 'workspace/insertGif',
                    payload: {
                        url: url,
                        replaceCurrent: true,
                    },
                })
                    .then(res => {
                        if (res) {
                            Message.success('gif处理完成');
                            eventEmitter.emit('activeType', CANVAS_TYPE.gif);
                        } else {
                            Message.error('gif无法处理');
                        }
                    });
            } else {
                this.handleCropperImg(url, false);
            }
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
    // 封面改变后清除毁掉函数
    onImageLoad = () => {
        if (this.state.callbackFunction === this.afterChangeBackgroundImg) {
            this.setState({ callbackFunction: null });
        }
    };

    handleCropperImg = (url, oriUrl, cutParams) => {
        const { dataList, activeIndex } = this.props.workspace;
        const { width, height } = dataList[activeIndex];
        getImgAspectRatioByUrl(url)
            .then(aspectRatio => {
                this.changeNow({
                    url: genUrl(url),
                    width: aspectRatio >= 1 ? width : Math.min(WORKSPACE_SIZE.l,
                        height * aspectRatio),
                    height: aspectRatio >= 1
                        ? Math.min(WORKSPACE_SIZE.s, width / aspectRatio)
                        : height,
                    aspectRatio,
                    cutParams: { ...cutParams, oriUrl },
                });
            });
    };

    // 背景颜色改变
    handleColorChange = (backgroundColor) => {
        this.changeNow({ backgroundColor });
    };

    render() {
        const { modalProps, modalContent, modalOpen } = this.state;
        const { dataList, activeIndex } = this.props.workspace;
        const { url, opacity = 1, backgroundColor } = dataList[activeIndex];
        const opacityValue = ~~(100 - Number(opacity) * 100);
        return (
            <div>
                <div className={styles.image}>
                    <div className={styles.left} onClick={this.handleReplace}>
                        <img src={genUrl(url)} onLoad={this.onImageLoad} />
                    </div>
                    <div className={styles.right}>
                        <Button onClick={this.handleReplace}>更换图片</Button>
                        <Button onClick={this.handleCut}>裁剪图片</Button>
                    </div>
                </div>
                <div className={styles.opacitySet}>
                    <div>
                        <OpacityInput defaultValue={opacityValue}
                            step={1}
                            onChange={(value) => this.onOpacityChange(
                                handleMaxOrMinNum(value, 100))} />
                    </div>
                    <div className={styles.right}>
                        <SingleColorPicker
                            title={'背景颜色'}
                            width={32} height={32}
                            currentColor={backgroundColor}
                            onChange={this.handleColorChange}
                        />
                    </div>
                </div>
                <Modal {...modalProps} onCancel={this.onClose}
                    visible={modalOpen}>{modalContent}</Modal>
            </div>
        );
    }
}
