import React from 'react';
import { connect } from 'dva';
import styles from './videoSet.less';
import Input from 'Components/input/countInput';
import Button from 'Components/Button/index';
import Modal from 'Components/modal';
import env from 'Config/env';
import { resetFilter, filter } from 'Util/data';
import { genUrl } from 'Util/image';
import { decodeMusic, encodeMusic, genMusicUrl, isTencent } from 'Util/file';
import { certainFunction } from 'Util/object';
import { formatEQXMessage } from 'Util/event';
import Cropper from 'Components/cropper';
import { getAllSegment } from 'Api/templateShow';
import { HD_RESOLUTION, NoAudioPlay } from 'Config/staticParams';
import { isPressedCtrl } from '../../../../util/event';
import { sendBDEvent } from 'Services/bigDataService';

const dataFilterRules = [
    {
        attr: 'title',
        rules: [
            {
                name: 'required',
                msg: '必须填写标题',
            }, {
                name: 'max',
                value: 24,
                msg: '长度不可超过24',
            }],
    },
    {
        attr: 'videoDescribe',
        rules: [
            {
                name: 'required',
                msg: '必须有填写视频介绍',
            }, {
                name: 'max',
                value: 50,
                msg: '长度不可超过50',
            }],
    },
];

@connect(({ subtitles }) => ({
    subtitles,
    transverse: subtitles.transverse
}))
export default class VideoSet extends React.PureComponent {

    constructor(props) {
        super(props);
        const { title, videoDescribe, coverImg, hozCoverImg, verCoverImg } = props.subtitles;
        this.state = {
            title,
            videoDescribe,
            coverImg,
            hozCoverImg,
            verCoverImg,
        };
    }

    componentDidMount() {
        this.props.event.on('saveError', this.onVaild);
        document.addEventListener('keydown', this.handleSave);
    }

    componentWillUnmount() {
        this.props.event.removeListener('saveError', this.onVaild);
        document.removeEventListener('keydown', this.handleSave);
    }

    /**
     * 输入验证
     * @returns {boolean}
     */
    onVaild = () => {
        const error = filter(dataFilterRules, this.state);
        if (error !== true) {
            this.setState({
                ...error,
                activeTab: 1,
                saving: false,
            });
        } else {
            const newState = resetFilter(dataFilterRules);
            this.setState({
                ...newState,
            });
        }
        this.props.overSaving();
        return false;
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
        window.removeEventListener('message', this.getVoiceMessage);
        window.removeEventListener('message', this.getMusicMessage);
        window.removeEventListener('message', this.getImgMessage);
        this.setState({
            modalOpen: false,
            modalProps: {},
            modalContent: '',
        });
        if (clearSelect) {
            this.setState({
                callbackFunction: null,
                modalIndex: null,
            });
        }
    };

    // 触发改变封面事件
    onChangeCoverImg = () => {
        this.setState({
            nowAspectRatio: false,
            callbackFunction: this.afterChangeCoverImg,
        });
        sendBDEvent({
            position: '视频设置-更换封面',
            type: '点击更换按钮',
        });
        this.onOpen(this.getImgMessage, '/material/image');
    };
    /**
     * 抓取图片选择的URL地址
     * @param message
     */
    getImgMessage = (message) => {
        const data = formatEQXMessage(message);
        const { props: { subtitles: { transverse } } } = this;
        if (data === false) {
            return;
        }
        if (data.type === 'close') {
            this.onClose(true);
        }
        if (data.type === 'success') {
            this.onClose();
            const picUrl = env.host.musicFile + data.data[0].path;
            // 宽高限制
            const limit = transverse ? {
                width: HD_RESOLUTION.hoz.x,
                height: HD_RESOLUTION.hoz.y,
            } : {
                    width: HD_RESOLUTION.ver.x,
                    height: HD_RESOLUTION.ver.y,
                };
            this.onOpen(() => {
            }, false, <Cropper
                    limit={limit}
                    aspectRatio={transverse ? 16 / 9 : 9 / 16}
                    image={picUrl}
                    backgroundColor={'#fff'}
                    onClose={this.onClose}
                    onChange={this.state.callbackFunction} />);
        }
    };

    // 封面改变后清除毁掉函数
    onCoverLoad = () => {
        if (this.state.callbackFunction === this.afterChangeCoverImg) {
            this.setState({ callbackFunction: null });
        }
    };
    // 改变标题
    onChangeTitle = (value) => {
        this.setState({ title: value }, this.onVaild);
    };
    // 改变描述
    onChangeDescribe = (value) => {
        this.setState({ videoDescribe: value }, this.onVaild);
    };
    /**
     * 改变封面
     * @param url
     */
    afterChangeCoverImg = (url) => {
        const { transverse } = this.props.subtitles;
        const paramName = transverse ? 'hozCoverImg' : 'verCoverImg';
        this.setState({ [paramName]: genUrl(url) });
        this.onClose();
        sendBDEvent({
            position: '视频设置-更换封面',
            type: '更换成功',
        });
    };

    cancelBtn = () => {
        this.props.onClose();
    };
    handleSave = (e) => {
        if (e.keyCode === 83 && isPressedCtrl(e)) {
            e.preventDefault();
            this.saveBtn();
        }
    };
    saveBtn = () => {
        const { state, props } = this;
        const { transverse } = props.subtitles;
        const paramName = transverse ? 'hozCoverImg' : 'verCoverImg';
        const newState = {
            title: state.title,
            videoDescribe: state.videoDescribe,
            [paramName]: state[paramName],
        };
        this.props.dispatch({
            type: 'subtitles/save',
            payload: newState,
        });
        this.cancelBtn();
    };

    render() {
        const { state, props } = this;
        const { transverse } = props.subtitles;
        const paramName = transverse ? 'hozCoverImg' : 'verCoverImg';
        return (
            <div className={styles.body}>
                <div className={styles.header}>
                    <span className={styles.title}>视频设置</span>
                    <span className={styles.closeIcon} onClick={props.onClose}>×</span>
                </div>
                <div className={styles.videoCover}
                    onClick={this.onChangeCoverImg}>
                    <img src={genUrl(state[paramName], '228:224')} onLoad={this.onCoverLoad} />
                    <span className={styles.changeCover}>更换封面</span>
                </div>
                <div className={styles.inputDiv}>
                    <label>标题</label>
                    <Input len={24} value={state.title}
                        style={{ paddingRight: 5 }}
                        onChange={this.onChangeTitle} />
                    <span
                        className={styles.errorSpan}
                        style={{ paddingLeft: 0 }}>{state.titleError}</span>
                </div>
                <div className={styles.inputDiv} style={{ marginTop: 16 }}>
                    <label>描述</label>
                    <Input render_textarea='true'
                        len={50}
                        value={state.videoDescribe}
                        style={{ paddingRight: 5 }}
                        onChange={this.onChangeDescribe} />
                    <span
                        className={styles.errorSpan}>{state.videoDescribeError}</span>
                </div>
                <div className={styles.saveBox}>
                    <Button onClick={this.saveBtn} className={styles.saveBtn}>保存</Button>
                    <Button onClick={this.cancelBtn} lite={1}
                        className={styles.cancelBtn}>取消</Button>
                </div>
                <Modal {...state.modalProps} onCancel={this.onClose}
                    visible={state.modalOpen}>{state.modalContent}</Modal>
            </div>
        );
    }
}
