import React from 'react';
import { connect } from 'dva';
import styles from './videoOption.less';
import { Message, Tooltip } from 'antd';
import Input from '../../components/input/countInput';
import Radio from '../../components/input/radio';
import Button from '../../components/Button/index';
import Modal from '../../components/modal';
import env from '../../../config/env';
import { resetFilter, filter } from '../../../util/data';
import { genUrl } from '../../../util/image';
import { certainFunction } from '../../../util/object';
import { formatEQXMessage, isPressedCtrl } from '../../../util/event';
import Cropper from '../../components/cropper';
import { HD_RESOLUTION } from '../../../config/staticParams';
import eventEmitter from '../../../services/EventListener';
import { getSystemTailLeader } from '../../../api/user';
import { genVideoUrl } from '../../../util/file';
import Icon from '../../components/Icon';
import { sendBDEvent } from '../../../services/bigDataService';
import ShareSet from '../../components/shareSet';
import { getMediaAdPublisher } from '../../../api/ad';

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

@connect(({ typeMonkey }) => ({ typeMonkey }))
class videoOption extends React.PureComponent {
    constructor(props) {
        super(props);
        this.systemTailVideo = React.createRef();
        const { typeMonkey } = props;
        this.state = {
            title: typeMonkey.title,
            videoDescribe: typeMonkey.videoDescribe,
            coverImg: typeMonkey.coverImg,
            nowAspectRatio: null,
            systemTailLeaderOn: typeMonkey.systemTailLeaderOn,
            hoz: typeMonkey.transverse ? 'hoz' : 'vet',
            saving: false,
            chatSetVisible: false,
            isMediaAdDomain: false,
        };
    }

    componentDidMount() {
        this.props.event.on('saveError', this.onVaild);
        getSystemTailLeader(this.props.typeMonkey.transverse)
            .then(({ data }) => {
                if (data.success) {
                    this.setState({ systemTailLeaderUrl: data.obj });
                }
            });
        document.addEventListener('keydown', this.handleSave);
        this.handleMediaAdPublisher();
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
            const limit = this.state.hoz === 'hoz' ? {
                width: HD_RESOLUTION.hoz.x,
                height: HD_RESOLUTION.hoz.y,
            } : {
                    width: HD_RESOLUTION.ver.x,
                    height: HD_RESOLUTION.ver.y,
                };
            this.onOpen(() => {
            }, false, <Cropper hoz={this.state.hoz}
                limit={limit}
                aspectRatio={this.state.nowAspectRatio}
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
        this.setState({ coverImg: genUrl(url) });
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
            this.onSave();
        }
    };
    saveBtn = async () => {
        const { state } = this;
        const newState = {
            title: state.title,
            videoDescribe: state.videoDescribe,
            coverImg: state.coverImg,
            systemTailLeaderOn: state.systemTailLeaderOn,
        };
        await this.props.dispatch({
            type: 'typeMonkey/save',
            payload: newState,
        });
        this.cancelBtn();
        return true;
    };

    onGenerateVideo = () => {
        this.saveBtn()
            .then(res => eventEmitter.emit('onGenerateVideo'));

    };

    onSave = () => {
        eventEmitter.emit('onSaveVideo');
    };

    onChangeSystemTailLeaderOn = (e) => {
        this.setState({ systemTailLeaderOn: e.target.value });
    };

    play = (e) => {
        if (this.systemTailVideo.current) {
            this.systemTailVideo.current.play()
                .then(res => {
                    this.forceUpdate();
                });
        }
    };

    paused = (e) => {
        if (this.systemTailVideo.current) {
            this.systemTailVideo.current.pause();
            this.forceUpdate();
        }
    };
    chatSet = () => {
        this.setState({chatSetVisible: true});
    }
    chatSetClose = () => {
        this.setState({chatSetVisible: false});
    }
    shareSetParamsToModal = (shareSet) => {
        this.props.dispatch({
            type: 'typeMonkey/shareSetParamsToModal',
            payload: shareSet,
        });
    }
    handleMediaAdPublisher = () => {
        getMediaAdPublisher()
            .then((res) => {
                const { data: { success, obj } } = res;
                if (success && obj === true) {
                    this.setState({isMediaAdDomain: true});
                }
            });
    }


    render() {
        const { state, props } = this;
        const { typeMonkey: { transverse = true } = {} } = props;
        const paused = !this.systemTailVideo.current || this.systemTailVideo.current.paused;
        return (
            <div className={styles.body}>
                <div className={styles.box}>
                    <div className={styles.header}>
                        <span className={styles.title}>视频设置</span>
                        <span className={styles.closeIcon} onClick={props.onClose}>×</span>
                    </div>

                    <div className={styles.textContainer}>
                        <div>
                            <div className={styles.left}>
                                <div className={styles.videoCover}
                                    onClick={this.onChangeCoverImg}>
                                    <img src={genUrl(state.coverImg, '228:224')}
                                        onLoad={this.onCoverLoad} />
                                    <span className={styles.changeCover}>更换封面</span>
                                </div>
                            </div>
                            <div className={styles.right}>
                                <div className={styles.inputDiv}>
                                    <label>标题</label>
                                    <Input len={24} value={state.title}
                                        style={{
                                            paddingRight: 5,
                                            width: '100%!important',
                                        }}
                                        onChange={this.onChangeTitle} />
                                    <p
                                        className={styles.errorSpan}>{state.titleError}</p>
                                </div>
                                <div className={styles.inputDiv}>
                                    <label>描述</label>
                                    <Input render_textarea='true' len={50}
                                        value={state.videoDescribe}
                                        style={{ paddingRight: 5 }}
                                        onChange={this.onChangeDescribe} />
                                    <p
                                        className={styles.errorSpan}>{state.videoDescribeError}</p>
                                </div>
                            </div>
                        </div>
                        {this.state.isMediaAdDomain &&  <div className={styles.weixinSet}>
                            <div className={styles.weixinLeft}>微信分享设置</div>
                            <div onClick={this.chatSet} className={styles.weixinRight}>去设置 &gt;</div>
                        </div>}
                        <div>
                            <div className={styles.leftTitle}>尾部水印设置</div>
                            <div className={styles.right}>
                                <div className={styles.inputDiv}>
                                    <Radio.Group onChange={this.onChangeSystemTailLeaderOn}
                                        value={this.state.systemTailLeaderOn}>
                                        <Radio value={true}>默认水印</Radio>
                                        <Radio value={false}>无水印
                                            <span className={styles.freeTips}>限时免费</span>
                                        </Radio>
                                    </Radio.Group>
                                    <p className={styles.errorSpan}>{state.titleError}</p>
                                </div>
                                {this.state.systemTailLeaderOn &&
                                    <div className={styles.systemVideo}
                                        onClick={paused ? this.play : this.paused}
                                    >
                                        <div className={styles.videoWrap}>
                                            <video
                                                src={genVideoUrl(state.systemTailLeaderUrl)}
                                                preload='auto'
                                                controls={false}
                                                loop={true}
                                                ref={this.systemTailVideo}/>
                                        </div>
                                        {paused && <div className={`${styles.videoMask}
                                    ${paused
                                                ? styles.hover
                                                : ''}`}
                                        >
                                            <Icon type={`iconfont ${paused
                                                ? 'iconplay-f'
                                                : 'iconpause-f'}`} />
                                        </div>}
                                    </div>}
                            </div>
                        </div>
                    </div>
                    <div className={styles.headerButtonGroup}>
                        <Button onClick={this.cancelBtn} lite={1}
                            className={styles.cancelBtn}>取消</Button>

                        <Button className={`${styles.saveBtn} ${state.saving
                            ? styles.displayButton
                            : ''}`}
                            onClick={this.saveBtn}>
                            保存
                        </Button>
                        <Button
                            className={state.saving ? styles.displayButton : ''}
                            onClick={this.onGenerateVideo}
                            style={{
                                width: 84,
                            }}
                            rdt="3" cat="flash" act="duration"
                        >
                            预览和生成
                        </Button>
                    </div>
                </div>
                <Modal {...state.modalProps} onCancel={this.onClose}
                    visible={state.modalOpen}>{state.modalContent}</Modal>
                <Modal visible={this.state.chatSetVisible} onCancel={this.chatSetClose}>
                    <ShareSet videoId={this.props.typeMonkey.worksId || this.props.typeMonkey.id}
                              title={this.state.title}
                              describe={this.state.videoDescribe}
                              shareSetParamsToModal={this.shareSetParamsToModal}
                              onClose={this.chatSetClose}/>
                </Modal>
            </div>
        );
    }
}

export default videoOption;
