import React, { Component } from 'react';
import { connect } from 'dva';
import { Button, message as antdMessage } from 'antd';
import Modal from '../../components/modal';
import Slider from '../../components/slider';
import env from '../../../config/env';
import { genUrl } from '../../../util/image';
import { formatEQXMessage } from '../../../util/event';
import Cropper from '../../components/cropper';
import Icon from '../../components/Icon';
import NumberInput from 'Components/input/numberInput';
import Popconfirm from 'Components/common/Popconfirm';
import styles from './backgroundSet.less';

@connect(({ workspace, editor }) => ({
    workspace,
    editor,
}))
export default class BackgroundImage extends Component {
    state = {
        nowAspectRatio: null,
    };

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
        this.props.dispatch({
            type: 'workspace/changeBackground',
            payload: { videoBackgroundPicOpacity: value },
        });
    };

    /**
     * 删除背景图
     * */
    handleDelete = () => {
        this.props.dispatch({
            type: 'workspace/changeBackground',
            payload: { backgroundImg: '' },
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
        this.props.dispatch({
            type: 'workspace/changeBackground',
            payload: { backgroundImg: genUrl(url) },
        });
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
            const picUrl = env.host.musicFile + data.data[0].path;
            if (picUrl.endsWith('.gif')) {
                antdMessage.info('片段背景无法设置成动图');
            }
            this.onOpen(() => {
            }, false, <Cropper hoz={this.props.editor.transverse ? 'hoz' : 'ver'}
                               image={picUrl}
                               onClose={this.onClose}
                               onChange={this.state.callbackFunction}/>);
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
    onBackgroundImageLoad = () => {
        if (this.state.callbackFunction === this.afterChangeBackgroundImg) {
            this.setState({ callbackFunction: null });
        }
    };

    render() {
        const { modalProps, modalContent, modalOpen } = this.state;
        const { dataList = [] } = this.props.workspace;
        const { backgroundImg = null, videoBackgroundPicOpacity = 1 } = dataList[0] || {};
        const opacityValue = ~~(100 - Number(videoBackgroundPicOpacity) * 100);

        return (
            <div>
                <div className={styles.backgroundImage}>
                    <div className={styles.left}>背景图片</div>
                    <div className={styles.center} onClick={this.handleReplace}>
                        {
                            backgroundImg ?
                            <img src={genUrl(backgroundImg)}
                                 onLoad={this.onBackgroundImageLoad}/>
                                          :
                            <Icon type='eqf-plus'/>
                        }
                    </div>
                    {backgroundImg ?
                     <div className={styles.right}>
                         <Button onClick={this.handleReplace}>更换图片</Button>
                         <Popconfirm placement="topRight" title={'确定要删除该图片吗？'}
                                     onConfirm={this.handleDelete} okText="确定" cancelText="取消">
                             <Button>删除图片</Button>
                         </Popconfirm>

                     </div>
                                   : null
                    }
                </div>
                {backgroundImg ?
                 <div className={styles.opacitySet}>
                     <div className={styles.left}>透明度</div>
                     <div className={styles.center}>
                         <Slider
                             className={'slider'}
                             min={0}
                             max={100}
                             step={1}
                             onChange={this.onOpacityChange}
                             value={opacityValue}
                         />
                     </div>
                     <div className={styles.right}>
                         <NumberInput
                             min={0}
                             max={100}
                             step={1}
                             value={opacityValue}
                             onChange={this.onOpacityChange}
                         />
                     </div>
                 </div>
                               : null
                }
                <Modal {...modalProps} onCancel={this.onClose}
                       visible={modalOpen}>{modalContent}</Modal>
            </div>
        );
    }
}
