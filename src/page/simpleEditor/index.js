import React from 'react';
import { connect } from 'dva';
import styles from './index.less';
import subtraction from '../static/simpleEditor/Subtraction.png';
import { message } from 'antd';
import Button from '../components/Button';
import Input from '../components/input/input';
import RightSide from './right';
import { setTitle } from 'Util/doc';
import EventEmitter from 'events';
import WorkSpace from './centre/workspace';
import EditorBottom from './bottom';
import Modal from '../components/modal';
import { name, prev, version } from '../../config/env';
import { filter } from '../../util/data';
import { localStorageKey, getItem, setItem } from '../../util/storageLocal';
import { getLimt } from '../../api/userVideo';
import eventEmitter from '../../services/EventListener';
import Loading from '../components/loading';
import DownLoadGoogle from '../components/google';
import LeftParty from './LeftParty';
import env from 'Config/env';
import { isPastDue } from '../../util/timestamp';
import { genStoreData } from '../../util/util';
import { Tooltip } from 'antd';
import Icon from '../components/Icon';
import qs from 'qs';
import { sendBDEvent, sendBDPage } from '../../services/bigDataService';
import { AD_TIME } from '../../config/staticParams';
import { waitChoseModel } from '../components/delete';


const { parent } = window;
const oriUrl = '*';

const commonFilterRules = [
    {
        attr: 'title',
        rules: [
            {
                name: 'required',
                msg: '必须填写标题',
            },
            {
                name: 'max',
                value: 24,
                msg: '长度不可超过24',
            },
        ],
    },
];
// 通过原因
const byReason = {
    passed: 1, // 通过
    refuse: 0, // 拒绝
};

@connect(({ editor, canvas, looper }) => ({
    editor,
    canvas,
    looper,
}))
export default class simpleEditor extends React.Component {
    constructor(props) {
        super(props);
        this.right = React.createRef();
        this.event = new EventEmitter();
        this.video = React.createRef();
        document.querySelector('#draw_canvas_div')
            .classList
            .remove('hidden');
        this.detailBody = React.createRef();
        this.state = {
            changeTitle: false, // 修改标题状态
            title: '', // 标题内容
            worksChecked: false, // 另存为我的作品
            saving: false,
            closeWindow: false,
            openOptions: false,
            loading: false,
            openModal: false,
            openOptionsed: false,
            modalContent: '',
            modalOpen: false,
            modalProps: {},
            modalContent: '',
            disapear: false, // 提示消失
        };
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        const newState = {};
        const { editor } = nextProps;
        if (editor.id !== prevState.id) {
            newState.loading = false;
        }
        if (editor.videoId) {
            newState.videoId = editor.videoId;
        }
        newState.title = editor.title;
        newState.saving = editor.isLoading && !prevState.saving;
        return newState;
    }

    componentDidMount() {
        // body禁止滚动
        document.body.style.overflow = 'hidden';
        const { oriTemplateId, id } = this.props.match.params;
        if (this.handleSearch()) {
            return true;
        }
        this.onLoad();
        getLimt()
            .then((res) => {
                if (res.data.success) {
                    const {
                        remainSaveCount, remainRenderCount, maxSaveCount, maxRenderCount,
                    } = res.data.obj;
                    if (remainSaveCount <= 0 && !id) {
                        // 如果是新建而且保存数量已满 就不能再编辑了.
                        message.error('您的作品数量已经达到上限');
                        setTimeout(() => {
                            location.replace('/video/scene');
                        }, 1000);
                    } else if (remainRenderCount <= 0) {
                        message.error('您今日的渲染次数已达到上限');
                    } else {
                        return;
                    }
                    window.history.back(1);
                }
            });
        // 视频首页流量统计
        sendBDPage(`/video/simpleEditor/${oriTemplateId}`);
        eventEmitter.on('onGenerateVideo', this.onGenerateVideo);
        eventEmitter.on('onSaveVideo', this.onSave);
        // 交互动画：用户点击【知道了】，每隔7天的第一次登录编辑器时显示5s后自动消失， 点击【不再提醒】就再也不显示了
        this.handleProductVideoTips();
        window.addEventListener('message', this.receiveMessage, false);
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.location.pathname !== this.props.location.pathname) {
            this.onLoad();
        }
        if (prevProps.editor.id !== this.props.editor.id) {
            this.overSaving();
        }
    }

    componentWillUnmount() {
        window.removeEventListener('message', this.receiveMessage, false);

        // 取消body禁止滚动
        document.body.style.overflow = 'auto';
        document.querySelector('#draw_canvas_div')
            .classList
            .add('hidden');
        // 取消自动保存
        this.props.dispatch({
            type: 'editor/saveCommon',
            payload: {
                cancelAutoSave: true,
            },
        });
    }

    handleSearch = () => {
        const search = qs.parse(window.location.search.replace('?', '')) || {};
        const { oriTemplateId, id } = this.props.match.params;
        if (id) {
            return false;
        }
        if (~~search.type === 4) {
            window.location.href = `${prev}/simpleEditor/1?workTpl=${oriTemplateId}`;
            return true;
        }
    };
    /**
     * 打开的通用方法
     * @param callBack 回调函数
     * @param isFrame 是否frame 是的话直接传入地址会自动拼接
     * @param children 不是frame 的话可以传入子组件
     */
    onOpen = (callBack, isFrame = false, children = '', modalProps = {}) => {
        const { oriTemplateId, id } = this.props.match.params;
        const content = isFrame ? <iframe
            src={`http://video.eqshow.cn${isFrame}${oriTemplateId}/${id}?t=${new Date().getTime()}`}
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
    handerIframes = () => {
        this.onOpen(this.getImgMessage, '/video/simpleEditor/');
    };
    /**
     * 抓取图片选择的URL地址
     * @param message
     */
    getImgMessage = () => {
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

    /**
     * 关闭窗口时的确认，大多数浏览器无效
     * @param e
     */
    onClose = (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.setState({ closeWindow: true });
        this.onClickQuite();
    };
    /**
     *根据url地址读取编辑器信息
     */
    onLoad = () => {
        const { oriTemplateId, id } = this.props.match.params;
        this.props.dispatch({
            type: 'editor/create',
            payload: {
                templateId: oriTemplateId,
                videoId: id,
            },
        });
        // .then((res) => {
        //     const jsonData = {
        //         type: 'domReady',
        //     };
        //     if (parent) {
        //         parent.postMessage(JSON.stringify(jsonData), oriUrl);
        //     }
            // });
    };
    /**
     * 保存事件
     * @param e 事件；
     * @param showMessage 显示信息
     */
    onSave = (e, showMessage = true) => {
        if (this.state.saving) {
            return false;
        }
        if (!showMessage) {
            message.config({
                maxCount: 0,
            });
        }
        const submit = () => {
            const { oriTemplateId, id } = this.props.match.params;
            return this.props.dispatch({
                type: 'editor/saveOrRender',
                payload: {
                    onlySave: true,
                    oriTemplateId,
                    id,
                },
            });
        };
        if (filter(commonFilterRules, this.props.editor) !== true) {
            if (showMessage) message.error('资料填写有误');
            this.openOption(e, () => this.event.emit('saveError'));
            return false;
        }
        return submit()
            .then((res) => {
                message.config({
                    maxCount: 5,
                });
            });
    };
    /**
     * 生成视频事件
     */
    onGenerateVideo = (e) => {
        if (this.state.saving) {
            return false;
        }
        const submit = () => {
            // 百度统计
            sendBDEvent({
                position: '简易编辑器',
                type: '生成视频',
            });
            if (!this.props.editor.videoId) {
                sendBDEvent({
                    position: '简易编辑器',
                    type: '新建作品',
                });
            }
            return this.props.dispatch({
                type: 'editor/saveOrRender',
                payload: {
                    onlySave: false,
                    dontJump: true,
                },
            })
                .then((res) => {
                    if (res) {
                        this.sendMsg();
                    }
                });
        };
        if (filter(commonFilterRules, this.props.editor) !== true) {
            message.error('标题填写有误');
            return false;
        }
        return submit();
    };
    receiveMessage = (e) => {
        const { oriTemplateId, id } = this.props.match.params;
        if (e.origin === `${env.host.auth}${oriTemplateId}/${id}}`) {
            this.originSource = e.origin;
            this.buildData = JSON.parse(e.data);
        }
    };
    sendMsg = () => {
        const { props: { editor: { videoId, coverImg } } } = this;
        const jsonData = {
            coverImg,
            videoId,
            type: 'generate',
            url: '',
        };
        if (parent) {
            parent.postMessage(JSON.stringify(jsonData), oriUrl);
        }
    };
    /**
     * 调速
     * @param e
     */
    onPlay = (e) => {
        // 视频调速
        this.video.current.playbackRate = this.props.editor.playSpeed;
    };
    /**
     * 点击关闭
     */
    onClickQuite = () => {
        const { props: { editor: { videoId } } } = this;
        waitChoseModel({ text: '确认退出么？' })
            .then(res => {
                const jsonData = {
                    videoId,
                    type: 'close',
                };
                sendBDEvent({
                    position: '简易编辑器',
                    type: '退出',
                });
                if (parent) {
                    parent.postMessage(JSON.stringify(jsonData), oriUrl);
                }
            })
            .catch(re => re);
    };
    handleProductVideoTips = () => {
        // 交互动画：用户点击【知道了】，每隔7天的第一次登录编辑器时显示5s后自动消失， 点击【不再提醒】就再也不显示了 1:提醒 0:永不提醒
        if (!getItem(localStorageKey.simpleTip)) {
            this.setState({ disapear: true });
            setItem(localStorageKey.simpleTip, genStoreData(byReason.passed));
        } else {
            if (isPastDue(AD_TIME.sevenDay, `${localStorageKey.simpleTip}`) &&
                getItem(localStorageKey.simpleTip).reason === byReason.passed) {
                setItem(localStorageKey.simpleTip, genStoreData(byReason.passed));
                this.setState({ disapear: true });
                setTimeout(() => {
                    this.setState({ disapear: false });
                }, 5000);
            }
        }
    };
    noneTips = () => {
        setItem(localStorageKey.simpleTip, genStoreData(byReason.refuse));
        this.setState({ disapear: false });
    };
    known = () => {
        setItem(localStorageKey.simpleTip, genStoreData(byReason.passed));
        this.setState({ disapear: false });
    };
    /**
     * 关闭模态框
     */
    onCloseModal = () => {
        this.setState({
            closeWindow: false,
            openPreviewModal: false,
        });
    };
    /**
     * google 谷歌浏览器判断提示
     */
    downloadGoogle = () => {
        this.setState({ downloadGoogle: false });
    };
    /**
     * 开启视频设置
     * @param e
     * @param callback
     */
    openOption = (e, callback = () => {}) => {
        this.setState(
            {
                openOptions: true,
                openOptionsed: true,
            },
            callback,
        );
    };
    /**
     * 保存完毕调用
     */
    overSaving = () => {
        this.setState({ saving: false });
    };

    /**
     *修改标题
     * @andy
     */
    clickTitle = () => {
        this.setState({
            changeTitle: true,
        });
    };
    changeTitle = (e) => {
        this.setState({
            changeTitle: true,
        });
        const newState = {
            title: e.target.value,
        };
        this.props.dispatch({
            type: 'editor/saveCommon',
            payload: newState,
        });
    };
    onBlur = () => {
        this.setState({
            changeTitle: false,
        });
    };

    /**
     *另存为我的作品
     * @andy
     */
    worksChecked = (e) => {
        this.setState({ worksChecked: e.target.checked });
        sendBDEvent({
            position: '简易编辑器',
            type: `另存为新作品-${e.target.checked ? '打开' : '取消'}`,
        });
        let newState = {};
        if (e.target.checked) {
            newState = {
                videoId: null,
            };
        } else {
            newState = {
                videoId: this.state.videoId,
            };
        }
        this.props.dispatch({
            type: 'editor/saveCommon',
            payload: newState,
        });
    };
    /**
     *
     *进入高级编辑模式
     * @andy
     */
    goSuperEditor = () => {
        const search = qs.parse(window.location.search.replace('?', '')) || {};
        const { oriTemplateId, id } = this.props.match.params;
        sendBDEvent({
            position: '简易编辑器',
            type: '进入高级编辑模式',
        });
        let url = '';
        if (id) {
            url = `${env.host.auth}/video/editor/${(~~oriTemplateId) || 1}/${id}`;
        }
        if (!id) {
            if (search.workTpl) {
                url = `${env.host.auth}/video/editor/1?workTpl=${search.workTpl}`;
            } else {
                url = `${env.host.auth}/video/editor/${oriTemplateId}`;
            }
        }
        window.open(url);
        const { props: { editor: { videoId } } } = this;
        const jsonData = {
            videoId,
            type: 'refresh',
        };
        if (parent) {
            parent.postMessage(JSON.stringify(jsonData), oriUrl);
        }
    };

    render() {
        const { props, state } = this;
        setTitle('模板编辑');
        const { isLoading } = props.editor;
        return (
            <div className={styles.detailBody} ref={this.detailBody}>
                <div
                    className={`${styles.tipWrap} ${state.disapear ? styles.tipWrapPosition : ''}`}>
                    <div className={styles.info}>
                        <Icon type='eqf-alert-f' className={styles.icon}/>
                        <span>编辑的内容在视频生成后才可见</span>
                    </div>
                    <div className={styles.btn}>
                        <div className={styles.tipsBtn} onClick={this.noneTips}>不再提醒</div>
                        <Button className={styles.tipsKnow} onClick={this.known}>知道了</Button>
                    </div>
                </div>
                {isLoading && <Loading title={isLoading === true ? '加载中' : isLoading}/>}
                <div className={styles.header}>
                    <div className={styles.left}>
                        {!state.changeTitle && <Tooltip placement="bottom" title={`点击修改标题`}>
                            <span onClick={this.clickTitle}
                                  className={styles.title}>{state.title}</span>
                        </Tooltip>
                        }
                        {state.changeTitle &&
                        <Input placeholder={state.title}
                               value={state.title}
                               autoFocus={true}
                               onChange={this.changeTitle}
                               onBlur={this.onBlur}/>}
                    </div>
                    <div className={styles.center} onClick={this.goSuperEditor}>
                        <img src={subtraction} height='16' alt='进入高级编辑模式'/>
                        <span className={styles.title}>进入高级编辑模式</span>
                    </div>
                    <div className={styles.right}>
                        <div className={styles.works}>
                            <input type="checkbox" value='另存为新作品'
                                   id='newWorks'
                                   onClick={this.worksChecked}/>
                            <label htmlFor='newWorks'>另存为新作品</label>
                        </div>
                        <div className={styles.btnWrap}>
                            <Button className={styles.produce}
                                    onClick={this.onGenerateVideo}
                            >预览和生成</Button>
                            <Button className={styles.close}
                                    onClick={this.onClickQuite}
                                    lite={1}>关闭</Button>
                        </div>
                    </div>
                </div>
                <div className={styles.rowBody}>
                    <div className={styles.leftWrap}>
                        <LeftParty/>
                    </div>
                    <div className={styles.centerWrap}>
                        <div className={styles.main} id='previewBody'>
                            <WorkSpace/>
                        </div>
                        <EditorBottom showTime={true}/>
                    </div>
                    <div className={styles.rightWrap}>
                        <RightSide ref={this.right} event={this.event}
                                   overSaving={this.overSaving}/>
                    </div>
                </div>
                <Modal {...state.modalProps} onCancel={this.onClose}
                       visible={state.modalOpen}>{state.modalContent}</Modal>
                <DownLoadGoogle/>
            </div>
        );
    }
}
