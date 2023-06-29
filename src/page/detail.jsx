import React from 'react';
import { Link, routerRedux } from 'dva/router';
import { Message } from 'antd';
import styles from './detail.less';
import Icon from './components/Icon';
import Video from './components/video/index';
import Button from './components/Button';
import template from 'Api/template';
import { setTitle } from 'Util/doc';
import imageUtil from 'Util/image';
import { host, prev } from 'Config/env';
import storeageLocal from 'Util/storageLocal';
import { genAvatar } from '../util/image';
import { name } from '../config/env';
import { genVideoUrl } from '../util/file';

const genQrCode = imageUtil.genQrCode;

// @connect()
class VideoDetail extends React.PureComponent {

    constructor(props) {
        super(props);
        this.qrcode = React.createRef();
    }

    state = {
        title: '模板名称',
        bread: [
            {
                breadcrumbName: '视频商城',
                path: `${prev}/index`,
            },
            {
                breadcrumbName: null,
                path: '#',
            },
        ],
        videoUrl: '',
        coverImg: '',
        videoDescribe: '模板信息加载中...',
        userName: '', // 易企秀官方
        userAvatar: null, // 'https://res.eqh5.com/group2/M00/7F/9B/yq0KXlZNGfWAbZo_AAAdI0Feqt0138.png?imageMogr2/auto-orient/thumbnail/212x212>/strip'
        videoDuration: 20,
        changeAbleImg: 5,
        changeAbleText: 2,
        playCount: 1200,
        price: '',
        loading: true,
    };

    componentDidMount() {
        window.scroll(0, 0);
        const { id } = this.props;
        genQrCode(this.qrcode.current, `${host.preView}/${id}`, {
            width: 98,
            height: 98,
        });
        if (name === 'pro') {
            window._hmt && window._hmt.push([`_trackPageview`, `/video/detail/${id}`]);

        }
        if (id) {
            template.getDetail(id)
                .then(res => {
                    const { data } = res;
                    if (data.success) {
                        const obj = data.obj;
                        const newState = {
                            videoUrl: obj.videoComposeUrl || obj.previewUrl,
                            coverImg: obj.coverImg,
                            changeAbleImg: obj.imageNum,
                            changeAbleText: obj.textNum,
                            videoDescribe: obj.templateDescribe,
                            title: obj.title,
                            videoDuration: obj.videoDuration,
                            playCount: obj.pv,
                            userAvatar: obj.userHeadImg,
                            userName: obj.userName,
                            videoWorksId: obj.videoWorksId || null, // 作品模板才有此ID
                        };
                        setTitle(obj.title);
                        // 大数据埋点
                        window.scene = {
                            ...obj,
                            id: `vt-${obj.id}`,
                        };
                        const bigDataParams = {
                            e_t: 'page_view',
                            b_t: 'default',
                            scene_id: window.scene.id,
                        };
                        if (window._tracker_api_ && typeof window._tracker_api_.report ===
                            'function') {
                            window._tracker_api_.report(bigDataParams);
                        }
                        this.setState({
                            ...newState,
                            loading: false,
                        });
                    } else {
                        setTitle('模板详情');
                    }
                })
                .catch(err => {
                    console.log(err);
                    setTitle('模板详情');
                });

        }
    }


    /**
     * 使用模板的跳转，先把地址放入storeageLocal
     */
    onLink = (e) => {
        if (this.state.loading) return;
        this.props.onChose(e, this.state.videoWorksId);
    };
    /**
     * 复制链接
     */
    copyLink = () => {
        const c = document.createElement('textarea');
        c.style.position = 'absolute';
        c.style.left = '-9999px';
        c.style.bottom = '0';
        document.body.appendChild(c);
        c.textContent = `${host.client}/store/video/detail/${this.props.id}`;
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
            Message.success('复制成功');
        } else {
            Message.error('复制失败,请自行复制');
        }
    };

    render() {
        const { props, state } = this;
        const shareUrl = `${host.preView}/${props.id}?onlyView=1`;
        const red = '#FF5448';
        return (
            <div className={styles.detailBody}>
                <div className={styles.detailCard}>
                    <div className={styles.videoDiv}>
                        {/*{state.videoUrl && <Video controls={true} width="480" height="480"*/}
                        {/*poster={imageUtil.genUrl(state.coverImg,*/}
                        {/*'480:480')}*/}
                        {/*src={genVideoUrl(state.videoUrl)} />}*/}
                        <iframe src={shareUrl} width={'100%'} height={'100%'} allowfullscreen="true" />
                    </div>
                    <div className={styles.videoInfo}>
                        <span className={styles.title}>{state.title}</span>
                        <span className={styles.describe}>{state.videoDescribe}</span>
                        <div className={styles.authorInfo}>
                            <div className={styles.avatar}>
                                <img src={genAvatar(state.userAvatar, '54:54')} />
                            </div>
                            <span>{state.userName}</span>
                        </div>
                        <div className={styles.videoIntro}>
                            <div className={styles.timeAndItem}>
                                <div style={{ marginBottom: 8 }}>时长：<span
                                    style={{ color: red }}>{`${moment(state.videoDuration, 'X')
                                    .format('mm:ss')}`}</span></div>
                                {state.videoWorksId ? '' : <div>可替换内容：<Icon type='eqf-t'
                                                                            style={{ color: red }} />&nbsp;{state.changeAbleText}
                                    <Icon type='eqf-image-f'
                                          style={{
                                              color: red,
                                              marginLeft: 20,
                                          }} />&nbsp;{state.changeAbleImg}</div>}
                            </div>
                            <span className={styles.flow}><Icon
                                type='eqf-eye-f' />&nbsp;{state.playCount}</span>
                            <span className={styles.flow}><a onClick={this.copyLink}><Icon
                                type='eqf-link' />&nbsp;复制链接</a></span>
                        </div>
                        <div className={styles.qrcodeOut}>
                            <div className={styles.qrcode} ref={this.qrcode}></div>
                            <div className={styles.qrTip}>微信扫一扫预览</div>
                        </div>
                        <div className={styles.bottom}>
                            <div className={styles.price}>{state.price}</div>
                            <a onClick={this.onLink}>
                                <Button className={`${styles.useButton} ${state.loading
                                    ? styles.display
                                    : ''}`}>立即使用</Button>
                            </a>
                            <div className={styles.useInfoBox}>
                                <span className={styles.useInfo}>模板使用说明</span>
                                <div className={styles.useTitleBox}>
                                    <div className={styles.popOverTranigle}></div>
                                    <div className={styles.useTitleMain}>
                                        <p className={styles.useMainTitle}>模板使用说明</p>
                                        <p
                                            className={styles.useMainList}>易企秀官方模板内容（包含但不限于板式、图片、音乐、字体等素材），来源于第三方原创作者，其版权归原创作者拥有。若作为商业用途，请获取模板原作者授权或替换相应素材，易企秀不承担由此引发的一切版权纠纷。</p>
                                        <p
                                            className={styles.useMainList}>易企秀仅提供模板的设计工具、展示平台和网络服务，同时提供第三方正版图片、字体、音乐等素材内容服务；对于用户在使用易企秀平台服务过程中自行上传的素材和作品，易企秀不具备审查其内容是否存在侵权等情节的能力。</p>
                                        <p
                                            className={styles.useMainList}>用户自行上传和使用素材等内容应遵守相关法律、法规，不得侵犯本网站及权利人的合法权利，情节严重者将依法追究其法律责任，易企秀不承担出现权利纠纷时的任何责任。</p>
                                        <p
                                            className={styles.useMainList}>若发现您的权利被侵害，请将您的权属证明等信息发送至：vip@eqxiu.com，我们将尽快处理。</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default VideoDetail;
