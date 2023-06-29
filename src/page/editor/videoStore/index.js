import React from 'react';
import { prev, host } from 'Config/env';
import styles from './index.less';
import Icon from '../../components/Icon';
import { Popover } from 'antd';
import Upload from './upload';
import imageUtil from 'Util/image';
import MineVideo from './mineVideo';
import VideoSegment from './videoSegment';
import { userTemplateGetPhoneParam, getPhoneProgress } from '../../../api/template';
import Modal from '../../components/modal';
import VideoCopyright from './copyright';
import { FILE_TYPE, UPLOAD_LIMIT, UPLOAD_VIDEO_FORMAT } from '../../../config/staticParams';


const LiArray = [
    {
        name: '我的视频',
    },
    {
        name: '正版视频',
    },
];

class VideoStore extends React.PureComponent {
    constructor(props) {
        super(props);
        this.video = React.createRef();
        this.qrcode = React.createRef();
        this.state = {
            Index: props.defualtIndex || 0,
            loading: true,
            openModal: false,
        };
    }

    componentDidMount() {
        this.getPhone();
    }

    createEqcode = () => {
        if (this.state.phoneToken) {
            const phoneUploadUrl = `${host.client}/upload.html?token=${this.state.phoneToken}&p=${this.state.phoneP}&a=.html`;
            imageUtil.genQrCode(this.qrcode.current, phoneUploadUrl, {
                width: 150,
                height: 150,
            });
        }
    };
    getPhone = () => {
        userTemplateGetPhoneParam()
            .then(res => {
                const { data } = res;
                if (data.success) {
                    this.setState({
                        phoneToken: data.obj.token,
                        phoneP: data.obj.p,
                    });
                }
                this.createEqcode();
            });
    };

    onClose = () => {
        if (typeof this.props.onClose === 'function') {
            return this.props.onClose();
        }
    };
    toggleNav = (index) => {
        this.setState({
            Index: index,
        });
    };
    allow = () => {
        this.setState({
            openModal: true,
        });
    };
    closeCopyRight = () => {
        this.setState({
            openModal: false,
        });
    };

    render() {
        const { state, props } = this;
        const content = (
            <div className={styles.acceptBox}>
                <span className={styles.accept}>使用视频即代表同意并接受 </span> <a
                className={styles.acceptEqx} onClick={this.allow}>《易企秀视频版权法律风险声明》</a>
            </div>
        );
        return (
            <div className={styles.videoBox}>
                <div className={styles.videoLeftBox}>
                    <div className={styles.videoLeftRowOne}>
                        <p className={styles.videoLeftRowOneTile}>视频库</p>
                        <Popover content={content} placement='top' overlayClassName='andy'>
                            <Icon type='eqf-info-f' className={styles.eqf_info_f}/>
                        </Popover>
                    </div>
                    {LiArray.map((item, index) => {
                        if (props.only_list && !props.only_list.includes(index)) return;
                        return (
                            <div key={index} onClick={() => this.toggleNav(index)}
                                 className={`${styles.videoLeftRowTwo} ${index === state.Index
                                                                         ? styles.videoLeftRowTwoHover
                                                                         : ''}`}>
                                <p className={styles.videoLeftRowTwoTile}>{item.name}</p>
                            </div>
                        );
                    })
                    }
                    <div className={styles.uploadBox}>
                        <div className={styles.phoneUploadBtnAll}>
                            <div className={styles.phoneUploadBtn}>
                                <div className={styles.phoneWrap}>
                                    <Icon type='eqf-cloudupload-f'
                                          className={styles.eqf_cloudupload_i}/> <span
                                    className={styles.phoneWord}>手机上传</span>
                                    <div className={styles.erqcodeBox}>
                                        <div className={styles.ercodeTriangle}></div>
                                        <p className={styles.weixin}>微信 "扫一扫" 上传手机视频</p>
                                        <div className={styles.erqcodeImg} ref={this.qrcode}/>
                                    </div>
                                </div>
                                <div className={styles.progressBox}>
                                    <div className={styles.phoneProgress}></div>
                                </div>
                            </div>
                        </div>
                        <div className={styles.computerUploadBtn}>
                            <Upload onSuccessUpload={this.toggleNav} type={FILE_TYPE.video}/>
                            <Icon type='eqf-why-f' className={styles.eqf_why_f}/>
                            <div className={styles.localBoxAll}>
                                <div className={styles.localBox}>
                                    <div className={styles.localTriangle}></div>
                                    <div className={styles.contentWhy}>
                                        <p className={styles.contentWhyNotice}>上传须知</p>
                                        <p className={styles.contentWhyInfo}>易企秀为广大用户提供原创正版视频上传渠道、信息储存空间等网络技术服务，用户可在遵守 <a
                                            onClick={this.allow}>《易企秀视频版权法律风险声明》</a> 的前提下自行上传并对其上传作品承担全部责任，请谨慎使用上传功能。
                                        </p>
                                        <p className={styles.contentWhyInfo}>通过本地电脑上传视频，大小不超过{UPLOAD_LIMIT}M，支持格式：{UPLOAD_VIDEO_FORMAT.map(
                                            (v, index) => v.filesSuffix +
                                                `${(UPLOAD_VIDEO_FORMAT.length - 1) !== index
                                                   ? '、'
                                                   : ''}`)}。单次只能上传1个，最多保留20个。为了保证裁剪质量，请上传大于4秒的视频。</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={styles.videoRightBox}>
                    {state.Index === 0 &&
                    <MineVideo onChange={props.onChange} onClose={this.onClose}/>}
                    {state.Index === 1 && <VideoSegment {...props} onClose={this.onClose}/>}
                </div>
                <Modal visible={state.openModal} onCancel={this.closeCopyRight} header={'视频版权声明'}>
                    <VideoCopyright/>
                </Modal>
            </div>
        );
    }
}

export default VideoStore;
