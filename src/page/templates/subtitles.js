import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styles from './subtitles.less';
import Icon from '../components/Icon';
import VideoStore from '../editor/videoStore';
import Modal from '../components/modal';
import { host, prev } from 'Config/env';
import Upload from '../editor/videoStore/upload';
import { userTemplateGetPhoneParam, getPhoneProgress } from '../../api/template';
import imageUtil from 'Util/image';
import { getUploadStatus } from '../../api/videoStore';
import Bar from '../components/bar';
import { message } from 'antd';
import { routerRedux } from 'dva/router';
import { connect } from 'dva';
import { name } from '../../config/env';
import { FILE_TYPE } from '../../config/staticParams';
import { sendBDEvent, sendBDPage } from '../../services/bigDataService';

class Subtitles extends Component {
    constructor(props) {
        super(props);
        this.qrcode = React.createRef();
        this.state = {
            openModal: false,
            // 0：手机二维码， 1：手机上传进度， 2：视频处理结果，3：视频库
            showIndex: null,
            progress: 0,
        };
    }

    componentDidMount() {
        // 字幕首页流量统计
        sendBDPage();
    }

    componentWillUnmount() {
        this.onClose();
        clearTimeout(this.timeOut);
    }

    open = () => {
        clearTimeout(this.timeOut);
        this.setState({
            openModal: true,
            showIndex: 0,
        });
        this.getPhone();
    };
    onReplace = () => {
        const { props: { openVideoStroe } } = this;
        if (openVideoStroe) {
            openVideoStroe();
            return;
        }
        // 视频库
        sendBDEvent({
            position: '创意模板-字幕',
            type: '视频库创建',
        });
        clearTimeout(this.timeOut);
        this.setState({
            openModal: true,
            showIndex: 3,
        });
    };
    /**
     * 关闭输入框
     */
    onClose = () => {
        clearTimeout(this.timeOut);
        this.setState({
            openModal: false,
            showIndex: null,
        });
    };
    createEqcode = () => {
        const { phoneToken } = this.state;
        const phoneUploadUrl = `${host.client}/upload.html?token=${phoneToken}&p=${this.state.phoneP}&a=.html`;
        imageUtil.genQrCode(this.qrcode.current, phoneUploadUrl, {
            width: 150,
            height: 150,
        });
        this.getProgress(phoneToken);
    };
    getProgress = (phoneToken) => {
        clearTimeout(this.timeOut);
        this.flag = true; // 第一次需要打开模态框
        this.flag2 = true; // 第一次需要弹窗提示
        getPhoneProgress(phoneToken)
            .then(({ data }) => {
                if (data.success) {
                    const { progress = 0, id = null, fileType } = data.obj || {};
                    if (fileType && fileType !== FILE_TYPE.video) {
                        if (progress > 0 && this.flag2) {
                            message.error('您上传的不是一个视频');
                            this.flag2 = false;
                        } else {
                            this.flag2 = true;
                        }
                        this.timeOut = setTimeout(() => {
                            this.getProgress(phoneToken);
                        }, 1000);
                        return;
                    }
                    if (progress > 0) {
                        if (this.flag) {
                            this.setState({
                                openModal: true,
                                showIndex: 1,
                                progress,
                            });
                            this.flag = false;
                        } else {
                            this.setState({ progress });
                        }
                    }
                    if (id) {
                        this.uploadSuccess(0, id);
                    } else {
                        this.timeOut = setTimeout(() => {
                            this.getProgress(phoneToken);
                        }, 1000);
                    }
                } else {
                    message.error(data.msg);
                    clearTimeout(this.timeOut);
                }
            })
            .catch((err) => {
                message.error(err);
                clearTimeout(this.timeOut);
            });
    };
    getPhone = () => {
        userTemplateGetPhoneParam()
            .then(res => {
                const { data } = res;
                if (data.success) {
                    sendBDEvent({
                        position: '创意模板-字幕',
                        type: '手机创建',
                    });
                    this.setState({
                        phoneToken: data.obj.token,
                        phoneP: data.obj.p,
                    }, this.createEqcode);
                } else {
                    message.error(data.msg);
                }
            });
    };
    //插入视频
    onInsert = (id) => {
        const { onClose, props: { onChose } } = this;
        onClose();
        if (typeof onChose === 'function') {
            onChose(`${prev}/subEditor/subtitles/${id}`);
        }

    };
    uploadSuccess = (index, videoId) => {
        // 手机上传视频
        sendBDEvent({
            position: '创意模板-字幕',
            type: '本地上传',
        });
        clearTimeout(this.timeOut);
        this.setState({
            openModal: true,
            showIndex: 2,
        });
        // 轮询视频处理进度
        this.getUpload(videoId);
    };

    getUpload = (videoId) => {
        getUploadStatus(videoId)
            .then(({ data }) => {
                if (data.success) {
                    if (data.obj === 4) {
                        clearTimeout(this.timeOut);
                        this.onInsert(videoId);
                    } else {
                        this.getUpload(videoId);
                    }
                } else {
                    message.error(data.msg);
                    clearTimeout(this.timeOut);
                }
            });
    };

    render() {
        const { state, props } = this;
        const { isIframe } = props;
        const bodyStyle = isIframe ? { backgroundColor: 'transparent', pointerEvents: 'none' } : {}
        const modalClass = `${styles.erqcodeBox}`;
        return <React.Fragment>
            <div className={styles.tabs} style={bodyStyle}>
                <div className={`${styles.tab} index-Card scale-enter-done`}>
                    <div className={styles.tab__left}>
                        <Icon type="eqf-pc-l" />
                    </div>
                    <div className={styles.tab__center}>
                        <div className={styles.tab__title}>选择</div>
                        <div className={styles.tab__desc}>本地视频</div>
                    </div>
                    <div className={styles.tab__right}>
                        <Icon type="eqf-plus" />
                    </div>
                    <div className={styles.hideUpload}>
                        <Upload hide={true} onSuccessUpload={this.uploadSuccess}
                            type={FILE_TYPE.video}
                            progressStyle={{
                                height: 4,
                                borderRadius: 2,
                            }} />
                    </div>
                </div>
                <div className={`${styles.tab} index-Card scale-enter-done`} onClick={this.open}>
                    <div className={`${styles.tab__left} ${styles.eqfPhone}`}>
                        <Icon type="eqf-phone-l" />
                    </div>
                    <div className={styles.tab__center}>
                        <div className={styles.tab__title}>选择</div>
                        <div className={styles.tab__desc}>手机视频</div>
                    </div>
                    <div className={styles.tab__right}>
                        <Icon type="eqf-plus" />
                    </div>
                </div>
                <div className={`${styles.tab} index-Card scale-enter-done`}
                    onClick={this.onReplace}>
                    <div className={styles.tab__left}>
                        <Icon type="eqf-live-l" />
                    </div>
                    <div className={styles.tab__center}>
                        <div className={styles.tab__title}>选择</div>
                        <div className={styles.tab__desc}>视频库</div>
                    </div>
                    <div className={styles.tab__right}>
                        <Icon type="eqf-plus" />
                    </div>
                </div>
            </div>
            <Modal visible={state.openModal} onCancel={this.onClose}>
                {/*手机二维码*/}
                {state.showIndex === 0 && <div className={modalClass}>
                    <span className={styles.closeable} onClick={this.onClose}>×</span>
                    <div className={styles.erqcodeImg} ref={this.qrcode} />
                    <p className={styles.weixin}>微信 "扫一扫" 上传手机视频</p>
                    <p className={styles.desc}>上传成功后会直接进入“字幕编辑器”</p>
                </div>}
                {/*手机上传的进度*/}
                {state.showIndex === 1 && <div className={modalClass}>
                    <span className={styles.closeable} onClick={this.onClose}>×</span>
                    <div className={styles.progress__title}>已上传{state.progress}%</div>
                    <Bar progress={state.progress} className={styles.progress}
                        style={{
                            height: 4,
                            background: 'rgba(21,147,255,1)',
                            borderRadius: 2,
                        }} />
                    <p className={styles.weixin}>正在上传手机视频</p>
                    <p className={styles.desc}>上传的视频会同步保存至视频库</p>
                </div>}
                {/*视频上传成功后处理中*/}
                {state.showIndex === 2 && <div className={modalClass}>
                    <span className={styles.closeable} onClick={this.onClose}>×</span>
                    <p className={styles.weixin}>正在处理上传的视频</p>
                    <p className={styles.desc}>视频已经存入视频库</p>
                    <p className={styles.desc}>处理完成后会直接进入“字幕编辑器”</p>
                </div>}
                {/*视频库*/}
                {state.showIndex === 3 && <VideoStore
                    onChange={this.onInsert}
                    onClose={this.onClose}
                    defualtIndex={0}
                    only_list={[0]}
                />}
            </Modal>
        </React.Fragment>;
    }
}


Subtitles.propTypes = {
    onChose: PropTypes.func.isRequired,
    onClose: PropTypes.func,
    openVideoStroe: PropTypes.func,
    isIframe: PropTypes.bool,
}

Subtitles.defaultProps = {
    openVideoStroe: false,
    isIframe: false,
}

export default Subtitles;