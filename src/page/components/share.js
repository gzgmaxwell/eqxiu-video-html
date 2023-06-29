import React, { Fragment } from 'react';
import { Message, Input, Tooltip } from 'antd';
import Icon from 'Components/Icon';
import styles from './share.less';
import imageUtil from 'Util/image';
import douYinIcon from '../static/icon/douYinIcon.png';
import { getDouyinLoginUrl, getDouyinShareResult } from '../../api/share';
import Modal from './modal';
import { delay } from '../../util/delayLoad';
import Button from './Button';
import ShareSet from './shareSet';


const gc = (...reset) => {
    return [...reset].join(' ');
};

class Share extends React.PureComponent {

    constructor(props) {
        super(props);
        this.qrCode = React.createRef();
        this.qrCodeObj = null;
        this.shareUrl = {};
        this.requesting = null;
        this.state = {
            title: null,
            coverImg: null,
            shareUrl: null,
            sinaUrl: null,
            qqUrl: null,
            zoneUrl: null,
            description: null,
            showAuthorSending: false,
            showIframe: false,
            weixinSetVisible:false,
        };

    }


    componentDidMount() {
        this.onShowQr();
    }

    componentDidUpdate() {
        this.onShowQr();
    }

    componentWillUnmount() {
        this.requesting = null;
        window.removeEventListener('message', this.listenerFrame);
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        const newState = { ...prevState, ...nextProps };
        return newState;
    }

    shareDouYin = async () => {
        const { videoId } = this.props;
        if (this.requesting) {
            Message.info('已经在分享到抖音...');
            return false;
        }
        if (!videoId) {
            return false;
        }
        const { data: { map, success } } = await getDouyinLoginUrl(videoId);
        if (success) {
            const { url, taskCode } = map;
            this.shareUrl.douyinUrl = url;
            this.douyinTaskCode = taskCode;
            window.open(url);
            window.addEventListener('message', this.listenerFrame);
            this.requesting = true;
            this.loadShareStatus();
        }
    };
    closeFrame = () => {
        this.setState({ showIframe: false });
        this.requesting = null;
    };
    closeWeixinSetVisible = () =>{
        this.setState({weixinSetVisible: false})
    }
    listenerFrame = (e) => {
        console.log(e);
    };
    loadShareStatus = async () => {
        await delay(1000);
        if (!this.requesting) return;
        const { data: { success, obj } } = await getDouyinShareResult(this.douyinTaskCode);
        if (success) {
            const { res, state } = obj;
            if (state === 'success') {
                Message.success('分享到抖音成功');
                this.requesting = null;
                return true;
            } else if (state === 'fail') {
                Message.error(res);
                this.requesting = null;
                return false;
            } else {
                if (this.state.showIframe && res === '抖音回调成功') {
                    this.closeFrame();
                    this.requesting = true;
                    Message.success('抖音登录成功,正在自动进行分享');
                }
                return this.loadShareStatus();
            }
        }
    };
    onShowQr = () => {
        const shareUrl = this.props.url;
        this.qrCodeObj = imageUtil.genQrCode(this.qrCode.current,
            shareUrl,
            {
                width: 150,
                height: 150,
                background: '#fff',
                foreground: '#000',
            });
        this.setState({ shareUrl }, this.genShare);
    };


    onClick = async (type = 'sina') => {
        const { props: { beforeShare = () => {} } } = this;
        beforeShare(type);
        if (type === 'douyin') {
            return this.shareDouYin();
        }
        if (this.shareUrl[`${type}Url`]) {
            window.open(this.shareUrl[`${type}Url`]);
        } else {
            Message.error('哪里出错了，请等会再分享或者刷新试试');
        }
    };
    /**
     * 复制
     */
    onCopy = () => {
        const c = document.createElement('textarea');
        c.style.position = 'absolute';
        c.style.left = '-9999px';
        c.style.bottom = '0';
        document.body.appendChild(c);
        c.textContent = this.state.shareUrl;
        c.focus();
        c.setSelectionRange(0, c.value.length);
        let a;
        try {
            a = document.execCommand('copy');
        } catch (b) {
            a = false;
        }
        document.body.removeChild(c);
        if (a) {
            const { props: { beforeShare = () => {} } } = this;
            beforeShare('copyLink');
            Message.success('复制成功');
        } else {
            Message.error('复制失败,请自行复制');
        }
    };
    /**
     * 开始下载文件
     * @param data
     * @param filename
     */
    saveFile = (data, filename) => {
        const { props: { beforeShare = () => {} } } = this;
        beforeShare('downloadQR');
        let saveLink = document.createElement('a');
        saveLink.href = data;
        saveLink.download = filename;

        let event = document.createEvent('MouseEvents');
        event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false,
            false, 0, null);
        saveLink.dispatchEvent(event);
    };
    /**
     * 下载二维码
     */
    downloadQrcode = () => {
        if (this.qrCode.current.children[0]) {
            const imgPngSrc = this.qrCode.current.children[0].toDataURL('image/jpeg');
            const filename = `${this.state.title}-二维码.jpg`;
            this.saveFile(imgPngSrc, filename);
        }
    };

    changeShowAuthor = (e) => {
        const { props: { onCheckFunc = null } } = this;
        if (typeof onCheckFunc !== 'function') return;
        this.setState({ showAuthorSending: true });
        onCheckFunc(e)
            .then(res => this.setState({ showAuthorSending: false }));
    };

    /**
     * 生成分享按钮
     */
    genShare = () => {
        const { state } = this;
        const newState = { ...state };
        const url = this.props.url;
        const getUrl = imageUtil.genUrl;
        // 新浪微博
        newState.sinaUrl = 'http://service.weibo.com/share/share.php?url=' +
            encodeURIComponent(url) + '?from=sina_weibo' +
            '&title=' + encodeURIComponent('#易企秀分享# 这是我用@易企秀 做的【' + state.title + '】，赶紧打开看看吧！') +
            '&pic=' + encodeURIComponent(getUrl(state.coverImg)) +
            '&appkey=3508809852';
        // QQ朋友
        newState.qqUrl = 'http://connect.qq.com/widget/shareqq/index.html?url=' +
            encodeURIComponent(url) + '?from=sqq' +
            '&title=' + state.title +
            '&site=易企秀http://eqxiu.com' +
            '&summary=' + encodeURIComponent(state.describe) +
            '&pics=' + encodeURIComponent(getUrl(state.coverImg)) +
            '&desc=' + encodeURIComponent((state.describe)) +
            '&appkey=3508809852';
        newState.zoneUrl = 'http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=' +
            encodeURIComponent(url) + '?from=qzone' +
            '&title=' + encodeURIComponent(state.title) +
            '&site=易企秀http://eqxiu.com' +
            '&summary=' + encodeURIComponent((state.describe)) +
            '&pics=' + encodeURIComponent(getUrl(state.coverImg)) +
            '&desc=' + encodeURIComponent(state.describe) +
            '&appkey=3508809852';
        this.shareUrl = { ...newState };
    };
    weixinSet =()=> {
        this.setState({weixinSetVisible: true})
    }

    render() {
        const {
            props: { showAuthor = null, onCheckFunc = null, isMediaAdDomain },
            state: { showIframe, shareUrl, weixinSetVisible },
            changeShowAuthor,
        } = this;
        let _shareUrl = String(shareUrl) || '';
        return (
            <div className={styles.shareDiv}>
                <div className={styles.left}>
                    <div className={styles.title}>微信扫一扫，预览/分享</div>
                    <div className={styles.qrcode} ref={this.qrCode} />
                    <div className={styles.wrapBtn}>
                        {isMediaAdDomain && <Button lite={1}
                            onClick={this.weixinSet}
                            className={styles.downloadQrcode}>微信分享设置</Button>
                        }

                        <Tooltip title='下载二维码'>
                            <Icon onClick={this.downloadQrcode} className={styles.downIcon} type='eqf-download'/>
                        </Tooltip>
                    </div>

                </div>
                <div className={styles.right}>
                    <div className={styles.shareItem}>
                        <div className={styles.name}>分享作品至</div>
                        <div className={styles.shareButtonGroup}>
                            <Tooltip title={'抖音扫码登录后自动分享'}>
                          <span className={gc(styles.iconSpan, styles.douyin)}
                                onClick={() => this.onClick('douyin')}><img
                              src={douYinIcon} /></span>
                            </Tooltip>
                            <span className={gc(styles.iconSpan, styles.weibo)}
                                  onClick={() => this.onClick('sina')}><Icon type='eqf-weibo'
                                                                             className={styles.shareIcon} /></span>
                            <span className={gc(styles.iconSpan, styles.QQ)}
                                  onClick={() => this.onClick('qq')}><Icon
                                type='eqf-QQ'
                                className={styles.shareIcon} /></span>
                            <span className={gc(styles.iconSpan, styles.QQZone)}
                                  onClick={() => this.onClick('zone')}><Icon
                                type='eqf-QQzone'
                                className={styles.shareIcon} /></span>
                        </div>
                    </div>
                    <div className={styles.shareItem} style={{ marginTop: '16px' }}>
                        <div className={styles.name}>链接分享</div>
                        <div className={styles.copyBlock}>
                            <Input value={_shareUrl.length > 33
                                ? _shareUrl.substr(0, 33) + '...'
                                : _shareUrl} disabled={true} />
                            <div className={styles.copy} onClick={this.onCopy}>复制</div>
                        </div>
                    </div>
                </div>
                <Modal visible={showIframe} onCancel={this.closeFrame}>
                    <iframe
                        width={960} height={600}
                        src={this.shareUrl.douyinUrl} />
                </Modal>
                <Modal visible={weixinSetVisible} onCancel={this.closeWeixinSetVisible}>
                    <ShareSet videoId={this.props.videoId}
                              title={this.props.title}
                              describe={this.props.describe}
                              onClose={this.closeWeixinSetVisible}/>
                </Modal>
            </div>
        );
    }
}

export default Share;
