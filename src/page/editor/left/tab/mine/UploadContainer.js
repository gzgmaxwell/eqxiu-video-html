import React, { PureComponent } from 'react';
import { message, Progress } from 'antd';
import imageUtil from 'Util/image';
import { host } from 'Config/env';
import styles from './UploadContainer.less';
import Icon from '../../../../components/Icon';
import Upload from '../../../videoStore/upload';
import Modal from '../../../../components/modal';
import { getPhoneProgress, userTemplateGetPhoneParam } from '../../../../../api/template';
import { FILE_TYPE, UPLOAD_LIMIT, UPLOAD_VIDEO_FORMAT } from '../../../../../config/staticParams';
import VideoCopyright from '../../../videoStore/copyright';
import ImageCopyright from '../../../../components/ImageCopyRight';
import MusicCopyright from '../../../../components/MusicCopyRight';
import eventEmitter from '../../../../../services/EventListener';
import WordVoice from '../../../soundManage/wordMusic';
import { sendBDEvent } from '../../../../../services/bigDataService';

const titles = {
    video: '易企秀视频版权许可与服务协议',
    image: '易企秀图片版权许可与服务协议',
    music: '易企秀音乐版权许可与服务协议',
};

const emitTypes = [
    'loadImageLists',
    'loadVideoLists',
    'loadMusicLists',
];

export default class UploadContainer extends PureComponent {
    constructor(props) {
        super(props);
        this.unmount = false;
        this.qrcode = React.createRef();
    }

    state = {
        progress: 0,
        openModal: false,
        openModalWordMusic: false,
        focus: false,

    };

    componentDidMount() {
        eventEmitter.on('focusUploadList', this.showUpload);
    }

    componentWillUnmount() {
        clearTimeout(this.timeout);
        this.unmount = true;
        eventEmitter.removeListener('focusUploadList', this.showUpload);
    }

    repeatTime = 1;

    getPhone = () => {
        userTemplateGetPhoneParam()
            .then(res => {
                const { data } = res;
                if (data.success) {
                    this.repeatTime = 1;
                    this.setState({
                        phoneToken: data.obj.token,
                        phoneP: data.obj.p,
                    }, this.createEqcode);
                } else {
                    message.error(data.msg);
                }
            });
    };

    createEqcode = () => {
        const { phoneToken } = this.state;
        const phoneUploadUrl = `${host.client}/upload.html?token=${phoneToken}&p=${this.state.phoneP}&a=.html`;
        console.log(phoneUploadUrl);
        imageUtil.genQrCode(this.qrcode.current, phoneUploadUrl, {
            width: 156,
            height: 156,
        });
        this.handler(phoneToken);
    };

    handler = (phoneToken) => {
        clearTimeout(this.timeout);
        // if (this.repeatTime > 30) {
        //     clearTimeout(this.timeout);
        //     return;
        // }
        getPhoneProgress(phoneToken)
            .then(({ data }) => {
                if (data.success) {
                    const { progress = 0, id = null } = data.obj || {};
                    if (id) {
                        this.uploadSuccess(0, id);
                        emitTypes.forEach(v => eventEmitter.emit(v));
                        return;
                    }
                    if (progress > 0) {
                        if (progress === this.state.progress) {
                            this.repeatTime += 1;
                        } else {
                            this.repeatTime = 1;
                        }
                        this.setState({
                            openModal: true,
                            progress,
                        });
                    } else {
                        this.setState({
                            openModal: false,
                            progress: 0,
                        });
                    }
                    if (this.unmount) return;
                    this.timeout = setTimeout(() => {
                        this.handler(phoneToken);
                    }, 1000);
                } else {
                    message.error(data.msg);
                }
            });
    };


    uploadSuccess = (index, videoId) => {
        this.setState({
            openModal: false,
            progress: 0,
            focus: false,
        });
    };

    setProgress = (progress) => {
        this.setState({ progress });
    };

    openModal = () => {
        this.setState({ openModal: true });
    };

    onClose = () => {
        this.setState({ openModal: false });
    };

    onSuccess = (type) => {
        this.onClose();
        eventEmitter.emit(type);
        const obj = {
            loadImageLists: 1,
            loadVideoLists: 2,
            loadMusicLists: 3,
        };
        clearTimeout(this.timeout);
        eventEmitter.emit('toggleActiveTab', [7, obj[type] || 1]);
        this.hideUpload();
    };

    showUpload = () => {
        this.setState({
            focus: true,
            progress: 0,
            openModal: false,
        });
        this.getPhone();
        this.handleMouseOut();
    };

    hideUpload = () => {
        this.setState({ focus: false });
        clearTimeout(this.timeout);
        document.removeEventListener('click', this.hideUpload);
    };

    handleMouseOut = () => {
        document.addEventListener('click', this.hideUpload);
    };

    handleMouseOver = () => {
        document.removeEventListener('click', this.hideUpload);
    };

    allow = (type) => {
        this.setState({
            copyRight: type,
        });
        document.removeEventListener('click', this.hideUpload);
    };
    closeCopyRight = () => {
        this.setState({
            copyRight: null,
        });
        setTimeout(() => {
            document.addEventListener('click', this.hideUpload);
        }, 200);
    };
    closeWordMusic = () => {
        this.setState({
            openModalWordMusic: false,
        });
    };
    wordTomusic = () => {
        sendBDEvent({
            position: '编辑器-我的-上传',
            type: '字转音',
        });
        this.setState({
            openModalWordMusic: true,
        });
    };

    render() {
        const { progress, openModal, focus, copyRight, openModalWordMusic } = this.state;
        return <React.Fragment>
            <div className={styles.uploadBtn}
                 onMouseOver={this.handleMouseOver}
                 onMouseOut={this.handleMouseOut}>
                <div onClick={this.showUpload} className={styles.btn}>
                    <Icon type="eqf-plus" />
                    <span>上传</span>
                </div>
                <div className={styles.uploadContainer}
                     style={{ display: focus ? 'flex' : 'none' }}>
                    <div className={styles.item}>
                        <Icon type="eqf-image-l" />
                        <span>上传图片</span>
                        <div className={styles.hideUpload}>
                            <Upload type={FILE_TYPE.img} hide={true}
                                    multiple={20}
                                    onSuccessUpload={() => this.onSuccess('loadImageLists')}
                                    progressStyle={{
                                        height: 2,
                                        borderRadius: 2,
                                        color: '#1392FE',
                                        bottom: 0,
                                        top: 'unset',
                                        background: '#CCD5DB',
                                    }} />
                        </div>
                    </div>
                    <div className={styles.item}>
                        <Icon type="eqf-video-l" />
                        <span>上传视频</span>
                        <div className={styles.hideUpload}>
                            <Upload type={FILE_TYPE.video} hide={true}
                                    multiple={9}
                                    onSuccessUpload={() => this.onSuccess('loadVideoLists')}
                                    progressStyle={{
                                        height: 2,
                                        borderRadius: 2,
                                        color: '#1392FE',
                                        bottom: 0,
                                        top: 'unset',
                                        background: '#CCD5DB',
                                    }} />
                        </div>
                    </div>
                    <div className={styles.item}>
                        <Icon type="eqf-music-l" />
                        <span>上传音乐</span>
                        <div className={styles.hideUpload}>
                            <Upload type={FILE_TYPE.audio} hide={true}
                                    multiple={9}
                                    onSuccessUpload={() => this.onSuccess('loadMusicLists')}
                                    progressStyle={{
                                        height: 2,
                                        borderRadius: 2,
                                        color: '#1392FE',
                                        bottom: 0,
                                        top: 'unset',
                                        background: '#CCD5DB',
                                    }} />
                        </div>
                    </div>
                    <div className={styles.item} onClick={this.wordTomusic}>
                        <Icon type="eqf-t" />
                        <span>字转成音</span>
                        <div className={styles.freeWrap}>限时免费</div>
                    </div>
                    <div className={styles.line} />
                    <div className={styles.text}>
                        微信“扫一扫”上传手机文件
                    </div>
                    <div className={styles.erqcode}>
                        <div className={styles.erqcodeImg} ref={this.qrcode} />
                        {openModal && <div className={styles.erqcodeProcess}>
                            <Progress type="circle" percent={progress} />
                            <div className={styles.processText}>已上传</div>
                        </div>}
                    </div>
                    <div className={styles.footer}>
                        <div className={styles.localBoxAll}>
                            <div>易企秀为广大用户提供原创正版视频上传渠道、信息储存空间等网络技术服务，用户可在遵守：<br />
                                <a onClick={() => this.allow('video')}>《易企秀视频版权法律风险声明》</a><br />
                                <a onClick={() => this.allow('music')}>《易企秀音乐版权法律风险声明》</a><br />
                                <a onClick={() => this.allow('image')}>《易企秀图片版权法律风险声明》</a><br />
                                的前提下自行上传并对其上传作品承担全部责任，请谨慎使用上传功能。
                            </div>
                            <div className={styles.title}>
                                通过本地电脑上传视频：
                            </div>
                            <div>非会员大小不超过100M，会员大小不超过200M，支持格式：{UPLOAD_VIDEO_FORMAT.map(
                                (v, index) => v.filesSuffix +
                                    `${(UPLOAD_VIDEO_FORMAT.length - 1) !== index ? '、' : ''}`)}。单次只能上传1个，最多保留100个。为了保证裁剪质量，请上传大于4秒的视频。
                            </div>
                            <div className={styles.title}>
                                通过本地电脑上传图片：
                            </div>
                            <div>非会员大小不超过10M，会员大小不超过15M，支持格式：jpg、png、gif。</div>
                            <div className={styles.title}>
                                通过本地电脑上传音乐：
                            </div>
                            <div>大小不超过10M，支持格式：MP3、WAV、APE、FLAC、WMA、M4A 。</div>
                            <div className={styles.title}>
                                手机扫码上传音乐：
                            </div>
                            <div>仅支持安卓系统，不支持ios系统。</div>
                        </div>
                        <div>上传须知</div>
                    </div>
                </div>
            </div>
            <Modal visible={!!copyRight} onCancel={this.closeCopyRight} header={titles[copyRight]}>
                {copyRight === 'video' && <VideoCopyright />}
                {copyRight === 'image' && <ImageCopyright />}
                {copyRight === 'music' && <MusicCopyright />}
            </Modal>
            <Modal visible={openModalWordMusic} onCancel={this.closeWordMusic}>
                <div className={styles.wordVoice}>
                    <WordVoice onClose={this.closeWordMusic} />
                </div>
            </Modal>
        </React.Fragment>;
    }
}
