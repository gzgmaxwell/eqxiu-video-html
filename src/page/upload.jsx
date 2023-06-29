// @ts-check

import React from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { Tooltip, message as Message, Radio } from 'antd';
import COS from 'cos-js-sdk-v5';
import Button from './components/Button/index';
import Bar from './components/bar';
import Tips from './components/tips/fixed';
import env, { prev } from '../config/env';
import { triggerEvent } from '../util/event';
import Icon from './components/Icon';
import Popconfirm from './components/common/Popconfirm';
import { setTitle } from '../util/doc';
import styles from './upload.less';
import fileUtil from '../util/file';
import { SEGMENT_TYPE } from '../config/staticParams';

// 上传提示
const tooltip_text = '视频验证指的是验证上传的素材和aepx工程文件能否渲染生成完整的视频，视频验证通过后，才可提交审核。';
// 速度格式化Kb 到 MB
const byteFormat = (value) => {
    if (value < 1024 * 1024) {
        return `${Math.round(value / 1024)} kb`;
    }
    return `${Math.round(value / (1024 * 1024))} mb`;
};

/**
 * 上传中 上传成功 和上传失败的页面
 * @param props
 * @returns {*}
 * @constructor
 */
const UploadingDiv = (props) => {
    const deleteDiv = props.delete && (
        <Popconfirm
            title={props.delete.title}
            onConfirm={props.delete.confirm}
            onCancel={props.delete.cancel}
            okText="确定"
            cancelText="取消"
        >
            <a
                style={{
                    float: 'right',
                    color: '#999999',
                }}
                href="#"
            >
                删除&nbsp;&nbsp;
                <Icon style={{ color: '#1BC7B1' }} type="eqf-yes-f"/>
            </a>
        </Popconfirm>
    );
    return (
        <div style={props.outDivStyle || {}}>
      <span
          style={{
              display: 'inline-block',
              paddingTop: 120,
              marginRight: 20,
              marginBottom: 50,
          }}
      >
        <Icon
            type="eqf-videocorder-l"
            style={{
                fontSize: 60,
                color: '#4298ef',
            }}
        />
      </span>
            <span
                style={{
                    display: 'inline-block',
                    width: 500,
                    textAlign: 'left',
                    lineHeight: '36px',
                }}
            >
        <div
            style={{
                color: '#333333',
                fontSize: 14,
            }}
        >
          {props.title || '模板文件名.zip'} {deleteDiv}
        </div>
        <div
            style={{
                color: '#999999',
                fontSize: 12,
            }}
        >
          {props.info || '模板信息..........'}
        </div>
        <Bar {...props.bar} />
      </span>
        </div>
    );
};

@connect(({ templateShow, user }) => ({
    templateShow,
    user,
}))
class UploadPage extends React.PureComponent {
    constructor(props) {
        super(props);
        this.dndDiv = React.createRef();
        this.uploadBtn = React.createRef();
        this.uploadInput = React.createRef();
        this.userId = '';
    }

    /**
     * status 0=未上传  1=正在上传  10=上传成功 20=上传失败 30=提交审核 40=校验失败请重新上传
     * @type {{status: number, progress: number}}
     */
    state = {
        fileName: '',
        cos: false,
        status: 0,
        progress: 10,
        speed: 0,
        load: 0,
        total: 0,
        info: '',
        hoverState: null,
        videoLocation: '', // '/tencent/a15069e48182488689315e38fd7961b7/1543540829698-c5d182c34f550622745dee6a6cea31344332.zip',
    };

    /**
     * 加载完毕后加载上传插件
     */
    componentDidMount() {
        this.genUploader();
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.user.id !== this.props.user.id) {
            // 如果在获取token时需要登录，则清空重新上传
            if (this.state.status === 1) {
                this.clearFile();
            }
            this.genUploader();
        }
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        const newState = { ...prevState };
        const { match: { params: { success } = {} } = {} } = nextProps;
        if (success === 'success') {
            newState.status = 30;
        }
        return newState;
    }

    /**
     * 卸载组件时执行清理
     */
    componentWillUnmount() {
        this.props.dispatch({
            type: 'templateShow/cancelVaild',
        });
    }

    // 继续上传
    onGoOnUpload = () => {
        this.clearFile();
        this.props.dispatch(routerRedux.push(`${prev}/templateShow`));
    };

    /**
     * 验证
     */
    onVaild = () => {
        const { dispatch, onViladSuccess } = this.props;
        const { videoLocation } = this.state;
        dispatch({
            type: 'templateShow/fetch',
            payload: {
                videoLocation: fileUtil.genZip(videoLocation),
                callBackFunction: (id) => {
                    onViladSuccess(id);
                    this.clearFile();
                },
            },
        });
    };
    /**
     *点击按钮触发fileInput点击事件
     */
    click_upload = () => {
        const input = this.uploadInput.current;
        triggerEvent(input);
    };
    /**
     * 清空上传文件
     * @param file
     * @returns {boolean}
     */
    resetFileInput = (file) => {
        // eslint-disable-next-line no-param-reassign
        file.value = '';
        return false;
    };

    /**
     * 上传
     */
    upload = (e, fz = null) => {
        const file = this.uploadInput.current;
        const files = fz || this.uploadInput.current.files;
        if (!files) return;
        // 名称限制
        if (!files[0] || !fileUtil.isCompressed(files[0].name)) {
            Message.error('必须上传zip和mov格式、mp4格式文件');
            this.resetFileInput(file);
            return;
        }
        // 大小限制
        if (files[0].size > 500 * 1024 * 1024) {
            Message.error('文件大小过大');
            this.resetFileInput(file);
            return;
        }
        const { upload } = env;
        const fileName = files[0].name.replace('+', '');
        const key = `/tencent/${this.userId}/${new Date().getTime()}-${fileName}`;
        this.state.cos.putObject(
            {
                Bucket: `${upload.bucket}-${upload.appid}` /* 必须 */,
                Region: upload.region /* 必须 */,
                Key: key /* 必须 */,
                Body: files[0], // 上传文件对象
                onProgress: (progressData) => {
                    const newState = {
                        ...progressData,
                        progress: progressData.percent * 100,
                        status: 1,
                    };
                    this.setState(newState);
                },
            },
            (err, data) => {
                if (err !== null || data.Location === undefined) {
                    console.log(err);
                    this.setState({
                        status: 20,
                        info: err,
                    });
                    return false;
                }
                this.setState(
                    {
                        status: 10,
                        videoLocation: key,
                    },
                    () => console.log(this.state),
                );
                return true;
            },
        );
        this.setState({
            fileName: files[0].name,
            status: 1,
        });
    };
    // 更改类型
    changeType = (e) => {
        this.props.dispatch({
            type: 'templateShow/setUploadType',
            payload: { uploadType: e.target.value },
        });
    };
    /**
     * 清理数据重新上传
     */
    clearFile = () => {
        this.props.dispatch({
            type: 'templateShow/cancelVaild',
        });
        this.setState({
            templateId: '',
            fileName: '',
            status: 0,
            progress: 10,
            speed: 0,
            loaded: 0,
            total: 0,
            info: '',
            videoLocation: '',
        });
        // this.props.dispatch(routerRedux.push(`${prev}/templateShow`));
    };
    genUploader = () => {
        const uploadConfig = env.upload;
        const getToken = () =>
            axios.get(`${env.host.service}${uploadConfig.tokenUrl}`)
                .then(
                    (res) => {
                        const { obj } = res.data;
                        this.tokenParams = {
                            TmpSecretId: obj.tmpSecretId,
                            TmpSecretKey: obj.tmpSecretKey,
                            XCosSecurityToken: obj.sessionToken,
                            ExpiredTime: obj.expiredTime,
                        };
                        this.userId = obj.userId;
                    },
                    (error) => {
                        console.log('获取Token错误');
                        console.log(error);
                    },
                );
        getToken();
        const cos = new COS({
            // 必选参数
            getAuthorization: (options, callback) => {
                if (this.tokenParams) {
                    callback({ ...this.tokenParams });
                } else {
                    getToken.then(() => callback({ ...this.tokenParams }));
                }
                getToken();
            },
            // 可选参数
            FileParallelLimit: 3, // 控制文件上传并发数
            ChunkParallelLimit: 3, // 控制单个文件下分片上传并发数
            ProgressInterval: 500, // 控制上传的 onProgress 回调的间隔
        });
        this.setState({ cos });
    };

    tokenParams = null;

    /**
     * 拖拽时改变Div颜色
     * @param e
     */
    handleDragOver = (e) => {
        if ('preventDefault' in e) {
            e.stopPropagation();
            e.preventDefault();
        }
        if (this.state.status !== 0) return;
        const hoverState = e.type === 'dragover' ? styles.hover : null;
        this.setState({
            hoverState,
        });
    };
    /**
     * 放下时上传文件
     * @param e
     */
    handleFileSelect = (e) => {
        this.handleDragOver(e);
        if (this.state.status !== 0) return;
        const files = e.target.files || e.dataTransfer.files;
        this.upload(e, files);
    };

    render() {
        const { state, props } = this;
        let child = '';
        setTitle('视频模板上传');
        // 中心显示props
        let childProps = false;
        // 提示文本DIV
        let tipDiv = (
            <Tips
                style={{
                    height: 60,
                    padding: 12,
                }}
            >
        <span
            style={{
                float: 'left',
                width: '3em',
                lineHeight: '18px',
            }}
        >
          提示：
        </span>
                <span
                    style={{
                        display: 'inline-block',
                        width: 530,
                        lineHeight: '18px',
                    }}
                >
          要求上传的AE工程压缩包中包含.apex文件及相应的素材文件。
          若上传的素材不完整，视频验证将不会通过，只有视频验证通过，才可提交审核。
        </span>
            </Tips>
        );
        // 外框样式
        const outDivStyle = {
            width: 1160,
            margin: '0 auto 20px auto',
            textAlign: 'center',
        };
        switch (this.state.status) {
            case 1: // 上传中
                childProps = {
                    outDivStyle,
                    title: `正在上传:${state.fileName}`,
                    info: `上传速度 ${byteFormat(state.speed)}/s  已经上传 ${byteFormat(
                        state.loaded,
                    )}/${byteFormat(state.total)}`,
                    bar: { progress: state.progress },
                };
                break;
            case 10: {
                // 上传完成
                childProps = {
                    outDivStyle,
                    title: `${state.fileName} 上传完成`,
                    info: '上传成功',
                    bar: { progress: 100 },
                    delete: {
                        title: '确定要删除这个模板吗?',
                        confirm: this.clearFile,
                        cancel: () => {},
                    },
                };
                // 按钮样式
                const buttonStyles = {
                    lineHeight: '17px',
                    display: 'inline',
                    margin: 0,
                    width: 92,
                    height: 30,
                    marginBottom: 0,
                    marginRight: 10,
                };
                // 按钮信息
                let info = '';
                switch (props.templateShow.status) {
                    case 10:
                        info = (
                            <Button
                                style={{
                                    ...buttonStyles,
                                    backgroundColor: '#eee',
                                    cursor: 'not-allowed',
                                }}
                                disabled
                            >
                                验证中
                            </Button>
                        );
                        break;
                    default:
                        info = (
                            <Button style={buttonStyles} onClick={this.onVaild}>
                                视频验证
                            </Button>
                        );
                }
                if (props.templateShow.status === 30) {
                    childProps = {
                        outDivStyle,
                        title: `${state.fileName} 验证失败`,
                        info:
                            props.templateShow.errorMessage ||
                            '验证失败,可能不是正确的模板文件,请重新上传',
                        bar: { progress: 100 },
                        delete: {
                            title: '确定要删除这个模板吗?',
                            confirm: this.clearFile,
                            cancel: () => {},
                        },
                    };
                    info = (
                        <Button
                            key="fail-button"
                            onClick={this.clearFile}
                            style={{
                                ...buttonStyles,
                                backgroundColor: '#FF296A',
                            }}
                        >
                            重新上传
                        </Button>
                    );
                }
                tipDiv = (
                    <div
                        style={{
                            width: 135,
                            margin: 'auto',
                        }}
                    >
                        {info}
                        <Tooltip placement="right" title={tooltip_text}>
              <span>
                <Icon type="eqf-why-f"/>
              </span>
                        </Tooltip>
                    </div>
                );
                break;
            }
            case 20:
                childProps = {
                    outDivStyle,
                    title: `${state.fileName} 上传失败`,
                    info: `上传失败${state.info}`,
                    bar: {
                        style: { backgroundColor: '#FF296A' },
                        progress: state.progress,
                    },
                };
                tipDiv = (
                    <div>
                        <Button
                            onClick={this.clearFile}
                            style={{
                                margin: 'auto',
                                display: 'block',
                                marginBottom: 50,
                                width: 110,
                                height: 30,
                                lineHeight: '15px',
                                backgroundColor: '#FF296A',
                            }}
                        >
                            请重新上传
                        </Button>
                    </div>
                );
                break;
            case 30:
                child = (
                    <div style={outDivStyle}>
                        <div
                            style={{
                                width: 226,
                                margin: 'auto',
                                paddingTop: 120,
                            }}
                        >
                            <div>
                                您的视频已经开始审核,审核完毕后用户即可在视频模板商城中看到您的视频模板。
                            </div>
                        </div>
                    </div>
                );
                tipDiv = (
                    <div>
                        <Button
                            onClick={this.onGoOnUpload}
                            style={{
                                margin: 'auto',
                                display: 'block',
                                marginBottom: 50,
                                width: 110,
                                height: 30,
                                lineHeight: '15px',
                            }}
                        >
                            继续上传
                        </Button>
                    </div>
                );
                break;
            default:
                child = (
                    <div style={outDivStyle}>
                        <div
                            style={{
                                width: 226,
                                margin: 'auto',
                                paddingTop: 120,
                            }}
                        >
                            <Button
                                icon="eqf-cloudupload-f"
                                ref={this.uploadBtn}
                                style={{
                                    fontSize: 20,
                                    margin: 'auto',
                                    lineHeight: '43px',
                                    height: 55,
                                    width: 226,
                                }}
                                onClick={this.click_upload}
                            >
                                上传AE工程压缩包
                            </Button>
                            <span
                                style={{
                                    width: 219,
                                    display: 'inline-block',
                                    margin: 'auto',
                                    lineHeight: '50px',
                                    textAlign: 'center',
                                }}
                            >
                拖拽文件到此处也可上传
              </span>
                            <input
                                type="file"
                                ref={this.uploadInput}
                                id="upload_btn"
                                style={{ display: 'none' }}
                                onChange={this.upload}
                                accept=""
                            />
                        </div>
                    </div>
                );
        }
        if (childProps) {
            child = <UploadingDiv {...childProps} />;
        }
        return (
            <div
                style={{
                    width: 1160,
                    height: 355,
                    margin: 'auto',
                    backgroundColor: '#fff',
                    marginTop: 30,
                    position: 'relative',
                }}
                className={state.hoverState}
                onDragOver={this.handleDragOver}
                onDragLeave={this.handleDragOver}
                onDrop={this.handleFileSelect}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: 5,
                        left: 5,
                    }}
                >
                    <label className={styles.typeLabel}>上传类型：</label>
                    <Radio.Group
                        onChange={this.changeType}
                        disabled={
                            props.templateShow && props.templateShow.templateId && true
                        }
                        value={props.templateShow && props.templateShow.uploadType}
                    >
                        <Radio value={SEGMENT_TYPE.SEGMENT_GROUP}>模板组</Radio>
                        <Radio value={SEGMENT_TYPE.SEGMENT_VIDEO}>视频片段</Radio>
                        <Radio value={SEGMENT_TYPE.SEGMENT_WORD}>特效字</Radio>
                        <Radio value={SEGMENT_TYPE.SEGMENT_IMAGE}>特效图片</Radio>
                        <Radio value={SEGMENT_TYPE.SEGMENT_ORNAMENT}>装饰素材</Radio>
                        <Radio value={SEGMENT_TYPE.SEGMENT_COATING}>覆层素材</Radio>
                        <Radio value={SEGMENT_TYPE.SEGMENT_BACKGROUND}>背景素材</Radio>
                        <Radio value={SEGMENT_TYPE.REAL_SHOOT}>视频素材</Radio>
                        <Radio value={SEGMENT_TYPE.HEAD_TAIL}>片头片尾</Radio>
                        <Radio value={SEGMENT_TYPE.APP_VIDEO_IMAGE}>APP自拍素材</Radio>
                    </Radio.Group>
                </div>
                {child}
                <div
                    style={{
                        margin: 'auto',
                        width: 602,
                    }}
                >
                    {tipDiv}
                </div>
            </div>
        );
    }
}

export default UploadPage;
