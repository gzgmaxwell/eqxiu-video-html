import React from 'react';
import qs from 'qs';
import { connect } from 'dva';
import { Message } from 'antd';
import Icon from 'Components/Icon';
import userVideoApi from 'Api/userVideo';
import { host, prev, upload } from 'Config/env';
import fileUtil from 'Util/file';
import styles from './card.less';
import { hdFinishClear } from '../../api/userVideo';
import { sendBDDownload } from '../../services/bigDataService';
import env from '../../config/env';
import { getCosToken } from '../../api/upload';
import COS from 'cos-js-sdk-v5';

/**
 * 验证是否在渲染中的通用方法
 * @param type
 * @returns {boolean}
 */
const vaildIsRendering = (type) => {
    return type === 1 || type === 2;
};


let timer = null;

@connect(({ user }) => ({ userId: user.id }))
class DownLoad extends React.PureComponent {

    constructor(props) {
        super(props);
        this.timer = null;
        clearInterval(timer);
        this.Cos = null;
    }

    state = {
        id: '',
        createTime: '2018-11-02 17:31:58',
        videoDuration: 40,
        title: '',
        renderProgress: 0,
        videoDescribe: '',
        openDownLoadList: false,
        hdid: null,
        normalid: null,
        loading: false,
        giveUpRenderVideo: false, // 高清视频渲染中放弃渲染
    };

    componentDidMount() {
        this.getHdStatus();
        clearInterval(timer);
        timer = setInterval(this.getHdStatus, 5000);
        document.addEventListener('click', this.down);
        this.initCos();
    }


    componentDidUpdate(prevProps, prevState) {
        if (prevProps.id !== this.props.id) {
            this.onLoadDetail();
        }
        if (timer === null) {
            this.getHdStatus();
        }
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.down);
        clearInterval(timer);
    }


    down = (e) => {
        if (e.path.some(v => v === document.getElementById('downModel'))) return;
        document.removeEventListener('click', this.down);
        this.props.closeModalDownLoad();
    };


    initCos = () => {
        const cosToken = getCosToken(true);
        this.Cos = new COS({
            // 必选参数
            getAuthorization: (options, callback) => {
                cosToken
                    .then(
                        (res) => {
                            if (res.data && res.data.success) {
                                const data = res.data.obj;
                                callback({
                                    TmpSecretId: data.tmpSecretId,
                                    TmpSecretKey: data.tmpSecretKey,
                                    XCosSecurityToken: data.sessionToken,
                                    ExpiredTime: data.expiredTime,
                                });
                            }
                        }, (error) => {
                            console.log('获取Token错误');
                            console.log(error);
                        });
            },
            FileParallelLimit: 20, // 控制文件上传并发数
            ChunkParallelLimit: 9, // 控制单个文件下分片上传并发数
            ProgressInterval: 100, // 控制上传的 onProgress 回调的间隔
        });

    };

    /**
     * 改变loading状态
     * @param state
     */
    changeLoading = (state) => {
        this.setState({ loading: state });
    };
    /**
     * 获取标题 视频等详情
     */
    onLoadDetail = () => {
        const id = this.props.videoId;
        this.changeLoading(true);
        // 查询详情
        userVideoApi.getDetail(id)
            .then(
                res => {
                    this.changeLoading(false);
                    if (res.data.success) {
                        this.setState({ ...res.data.obj });
                    }
                },
            )
            .catch(e => this.changeLoading(false));
    };

    /**
     * 获取高清渲染状态
     */
    getHdStatus = () => {
        const id = this.props.videoId;
        this.changeLoading(true);
        if (!this.state.previewUrl) {
            this.onLoadDetail();
        }
        // 查询状态
        userVideoApi.getRenderStatus(id)
            .then(
                res => {
                    this.changeLoading(false);
                    const { data } = res;
                    if (data.success) {
                        const hdArray = data.map['2'];
                        const normalArray = data.map['1'];
                        let newState = {};
                        if (normalArray) {
                            newState.normalid = normalArray.id;
                        }
                        if (hdArray !== undefined) {
                            newState = {
                                ...newState,
                                hdid: hdArray.id,
                                hdstatus: hdArray.status,
                                hdurl: hdArray.url,
                                renderProgress: hdArray.renderProgress,
                            };
                            // 如果已经渲染成功，则删除
                            if (timer && hdArray.status === 4) {
                                clearInterval(this.timer);
                            }
                        }
                        this.setState({ ...newState });
                    }
                },
            )
            .catch(e => this.changeLoading(false));
    };
    cancelRedDot = () => {
        const { id } = this.props;
        hdFinishClear(id);
    };
    /**
     * 点击下载高清，有则直接下载 没有则请求
     * @returns {boolean}
     */
    onDownLoadHd = () => {
        const { props: { videoId }, state } = this;
        if (state.loading || vaildIsRendering(state.hdstatus)) {
            if (timer === null) {
                this.getHdStatus();
            }
            return false;
        }
        if (state.hdurl) {
            userVideoApi.addDownLoad(videoId, 2, state.hdurl)
                .then(res => {
                    let { data } = res;
                });
            this.cancelRedDot();
            this.sendBigData('hd');
            // window.open(fileUtil.genVideoUrl(state.hdurl));
            this.commonDownLoad(true);
            return;
        }
        this.setState({ loading: true });
        userVideoApi.renderHd(videoId)
            .then(
                res => {
                    if (res.data.success) {
                        this.getHdStatus();
                        Message.success('请求成功,请等待渲染完毕后即可下载');
                        this.props.refresh(false);
                    }
                    this.setState({ loading: false });
                },
            )
            .catch(err => this.setState({ loading: false }));
    };

    /**
     * 公共下载方法
     * @param isHd {boolean} 是否高清
     */
    commonDownLoad(isHd = false) {
        const { state } = this;
        const { hdurl, previewUrl, title } = state;
        const fileName = `${title.replace(/;/g, '')}-${isHd ? '高清' : '标清'}.mp4`;
        this.Cos.getObjectUrl({
            Bucket: `${upload.bucket}-${upload.appid}`, /* 必须 */
            Region: upload.region, /* 必须 */
            Key: isHd && hdurl || previewUrl,
            Sign: true,
        }, (err, data) => {
            const { Url } = data;
            const downLoadParams = {
                ['response-content-disposition']: `attachment;filename=${fileName}`,
                ['response-content-type']: 'video/mp4',
            };
            const url = `${Url}${(Url.indexOf('?') > -1 ? '&' : '?')}${qs.stringify(
                downLoadParams)}`;
            const a = document.createElement('a');
            const event = new MouseEvent('click');
            a.download = fileName;
            a.href = url;
            a.dispatchEvent(event);
        });
    }

    /**
     * 标清下载
     */
    onDownLoad = () => {
        const { state: { normalid, previewUrl, title }, props: { videoId } } = this;
        userVideoApi.addDownLoad(videoId, 1, previewUrl);
        // 大数据
        this.sendBigData();
        // 下载
        // const a = document.createElement('a');
        // const params = {
        //     ['response-content-disposition']: `attachment; filename*="UTF-8' ${title}-normal.mp4"`,
        //     ['response-content-type']: 'video/mp3',
        // };
        // a.href = `${fileUtil.genVideoUrl(previewUrl)}&${qs.stringify(params)}`;
        // a.download = 'test.mp4';
        // a.click();
        this.commonDownLoad();
    };

    sendBigData(resolution = 'sd') {
        sendBDDownload({
            id: this.props.videoId,
            userId: this.props.userId,
            resolution,
        });
    }

    /**
     * 打开下载列表
     */
    openList = () => {
        this.setState({ openDownLoadList: true });
    };
    /**
     * 关闭下载列表
     */
    onCancel = () => {
        this.setState({ openDownLoadList: false });
    };

    closeModalDownLoad = () => {
        this.props.closeModalDownLoad();
    };
    /**
     * 高清视频渲染中放弃渲染
     */
    giveUpRenderEnter = () => {
        this.setState({ giveUpRenderVideo: true });
    };
    giveUpRenderLeave = () => {
        this.setState({ giveUpRenderVideo: false });
    };
    onCancelRender = (props) => {
        this.props.onCancelRender(props);
    };

    render() {
        const { state, props } = this;
        let downloadText = '';
        let downloadStatus = '';
        const renderProgress = `${parseInt(props.hdRenderProgress || state.renderProgress) || 0}%`;
        switch (state.hdstatus) {
            case 1:
                if (!state.giveUpRenderVideo) {
                    downloadStatus = <span onClick={() => this.onDownLoadHd(props)}
                                           className={styles.HDdescri}>
                        <span>已生成{renderProgress}</span>
                        <div className={styles.HDprogress} style={{
                            width: renderProgress,
                            borderRadius: ~~state.renderProgress < 80 ? '16px 0 0 16px' : 16,
                        }}/>

                    </span>;
                } else {
                    downloadStatus = <span onClick={() => this.onCancelRender(props)}
                                           className={styles.giveUpHD}>放弃生成</span>;
                }
                break;
            case 2:
                downloadText = '渲染中';
                downloadStatus = <span onClick={() => this.onDownLoadHd(props)}
                                       className={styles.HDdescri}>已生成{renderProgress}</span>;
                break;
            case 3:
                downloadText = '渲染错误';
                downloadStatus = <span onClick={() => this.onDownLoadHd(props)}
                                       className={styles.HDdescri}>重新渲染</span>;
                break;
            case 4:
                downloadText = '立即下载';
                downloadStatus = <span onClick={() => this.onDownLoadHd(props)}
                                       className={styles.HDdescri}>下载</span>;
                break;
            case 5:
                downloadText = '取消渲染';
                downloadStatus = <span onClick={() => this.onDownLoadHd(props)}
                                       className={styles.HDdescri}>重新渲染</span>;
                break;
            default:
                downloadText = '预计耗时20分钟';
        }
        if (state.hdstatus == undefined) {
            downloadStatus =
                <span onClick={() => this.onDownLoadHd(props)}
                      className={styles.HDdescri}>生成</span>;
        }
        return (
            <div className={styles.downModel} id="downModel">
                <div onClick={this.closeModalDownLoad} className={styles.closeModal}>×</div>
                <div className={styles.standard}>
                    <Icon type='iconfont iconSD' className={styles.iconSD}/>
                    <span>标清</span>
                    <div onClick={() => this.onDownLoad(props)}>下载</div>
                </div>
                <div className={styles.super}>
                    <Icon type='iconfont iconHD' className={styles.iconHD}/>
                    <span>高清</span>
                    <div onMouseEnter={this.giveUpRenderEnter} onMouseLeave={this.giveUpRenderLeave}
                         className={styles.giveUp}>
                        {downloadStatus}
                    </div>
                </div>
                <p className={styles.downloadDescription}>生成后可下载</p>
            </div>
        );
    }
}

export default DownLoad;
