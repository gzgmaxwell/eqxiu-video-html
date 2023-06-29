import React, { Component, Fragment } from "react";
import { connect } from "dva";
import { Button, Progress, message } from "antd";
import { CANVAS_TYPE, FILE_TYPE } from "Config/staticParams";
import ScrollContainer from "Components/scrollContainer";
import Infinite from "react-infinite-scroller";
import Upload from "Page/editor/videoStore/upload";
import Empty from "Components/empty";
import Cropper from "Components/cropper";
import Modal from "Components/modal";
import { genQrCode, genUrl } from "Util/image";
import { host } from "Config/env";
import { getMine } from "Api/mine";
import { userTemplateGetPhoneParam, getPhoneProgress } from "Api/template";
import ImageCopyright from "Components/ImageCopyRight";
import styles from "./pictures.less";

@connect(({ flash }) => ({ flash }))
class DragPictures extends Component {
    constructor(props) {
        super(props);
        this.qrcode = React.createRef();
        this.state = {
            loading: true,
            endPage: false,
            page: 1,
            pageSize: 40,
            lists: [],
            progress: 0,
            openModal: false
        };
    }
    componentDidMount() {
        const {
            uploadPhoneTokenObj: { token, p }
        } = this.props.flash;
        //加载第一页
        this.loadLists();
        this.createEqcode();
    }
    componentWillUnmount() {
        clearTimeout(this.timeout);
    }
    /**
     * 创建二维码
     */
    createEqcode = () => {
        const {
            uploadPhoneTokenObj: { token, p: phoneP }
        } = this.props.flash;
        const phoneUploadUrl = `${host.client}/upload.html?token=${token}&p=${phoneP}&source=flash_pictures&a=.html`;
        console.log("phoneUploadUrl=>", phoneUploadUrl);
        genQrCode(this.qrcode.current, phoneUploadUrl, {
            width: 148,
            height: 148
        });
        this.getProgress(token);
    };
    lastUploadId = null;
    repeatTime = 1;
    /**
     * 获取上传进度
     * @param phoneToken 当前登陆token
     */
    getProgress = phoneToken => {
        clearTimeout(this.timeout);
        if (this.repeatTime > 30) {
            clearTimeout(this.timeout);
            return;
        }
        getPhoneProgress(phoneToken)
            .then(({ data }) => {
                if (data.success) {
                    let { progress = 0, id = null } = data.obj || {};
                    progress = Number(progress);
                    if (id && this.lastUploadId !== id) {
                        this.lastUploadId = id;
                        // this.uploadSuccess(0, id);
                        // emitTypes.forEach(v => eventEmitter.emit(v));
                        //上传成功
                        this.setState(
                            {
                                progress: 0
                            },
                            () => {
                                //刷新数据
                                this.loadLists();
                            }
                        );
                    }
                    if (progress > 0) {
                        if (progress === this.state.progress) {
                            this.repeatTime += 1;
                        } else {
                            this.repeatTime = 1;
                        }
                        this.setState({
                            progress
                        });
                    } else {
                        this.setState({
                            progress: 0
                        });
                    }
                    this.timeout = setTimeout(() => {
                        this.getProgress(phoneToken);
                    }, 1000);
                } else {
                    message.error(data.msg);
                    clearTimeout(this.timeout);
                }
            })
            .catch(err => {
                clearTimeout(this.timeout);
            });
    };
    /**
     * 拖拽开始
     */
    handleDragStart = (e, pathId, id) => {
        const { lists } = this.state;
        let arr = Object.assign(lists);
        arr.map(l => {
            if (l.id === id) {
                l.dragImg = true;
            }
        });
        this.setState({
            lists: arr
        });
        //存储当前拖拽图片id
        e.dataTransfer.setData("pathId", pathId);
    };
    /**
     * 拖拽结束
     */
    onDragEnd = (e, pathId, id) => {
        const { lists } = this.state;
        let arr = Object.assign(lists);
        arr.map(l => {
            if (l.id === id) {
                l.dragImg = false;
            }
        });
        this.setState({
            lists: arr
        });
    };
    /**
     * 点击图片新增或替换片段内容
     */
    handleClick = (e, pathId) => {
        const { dataList } = this.props.flash;
        //当前激活片段uuid
        let uuid = null;
        for (let key in dataList) {
            if (dataList[key].activeStatus) {
                uuid = key;
                break;
            }
        }
        //图片裁剪
        this.handleCut(`${host.musicFile}${pathId}`, uuid);
        // this.props.dispatch({
        //     type: 'flash/updatePictures'
        // })
    };
    /**
     * 插入图片
     */
    insert = (type, content) => {
        const {
            flash: { uuidSort },
            dispatch,
            elementProps
        } = this.props;
        if (uuidSort.length >= 30) {
            message.error("最多添加30个片段");
            return;
        }
        dispatch({
            type: "flash/insert",
            payload: {
                type,
                content
            }
        });
        // .then(elementProps.openInput);
    };

    /**
     * 裁剪图片
     * */
    handleCut = (oriUrl, uuid) => {
        const {
            props: {
                flash: { transverse }
            },
            changeNow
        } = this;
        this.onOpen(
            () => {},
            false,
            <Cropper
                image={oriUrl}
                onClose={this.onClose}
                hoz={transverse ? "hoz" : "ver"}
                onChange={url => {
                    if (uuid) {
                        changeNow({
                            uuid,
                            flash_type: CANVAS_TYPE.img,
                            flash_content: genUrl(url)
                        });
                    } else {
                        this.insert(CANVAS_TYPE.img, genUrl(url));
                    }
                }}
            />
        );
    };
    /**
     * 修改片段数据
     */
    changeNow = payload => {
        this.props.dispatch({
            type: "flash/changeNow",
            payload
        });
    };
    /**
     * 关闭 modal框,取消监听事件
     */
    onClose = (clearSelect = false) => {
        window.removeEventListener("message", this.getImgMessage);
        this.setState({
            modalOpen: false,
            modalProps: {},
            modalContent: ""
        });
        if (clearSelect) {
            this.setState({
                callbackFunction: null
            });
        }
    };

    /**
     * 打开的通用方法
     * @param callBack 回调函数
     * @param isFrame 是否frame 是的话直接传入地址会自动拼接
     * @param children 不是frame 的话可以传入子组件
     * @param modalProps
     */
    onOpen = (callBack, isFrame = false, children = "", modalProps = {}) => {
        const content = isFrame ? (
            <iframe
                onLoad={this.onLoadIframe}
                src={`${
                    env.host.auth
                }${isFrame}?t=${new Date().getTime()}&source=music&notShowSys=true`}
                scrolling='no'
                frameBorder='0'
                style={{
                    width: 960,
                    height: 600,
                    display: "block",
                    lineHeight: 0,
                    fontSize: 0
                }}
            />
        ) : (
            children
        );
        window.addEventListener("message", callBack);
        this.setState({
            modalOpen: true,
            modalProps,
            modalContent: content
        });
    };
    
    /**
     * 加载图片数据
     */
    loadLists = (page = 1) => {
        const { pageSize, lists } = this.state;
        const params = {
            fileType: 1,
            pageNo: page,
            pageSize
        };
        this.setState({ loading: true });
        getMine(params, page === 1)
            .then(res => {
                const { data } = res;
                if (data.success) {
                    this.loading = false;
                    const resList = data.list;
                    if (resList && resList.length > 0) {
                        resList.map(item => (item.dragImg = false));
                        const newState = {
                            lists: page > 1 ? lists.concat(resList) : resList,
                            page: params.pageNo,
                            endPage: data.map.end
                        };
                        this.setState({
                            ...newState,
                            loading: false
                        });
                    } else {
                        this.setState({
                            lists: page > 1 ? lists : [],
                            loading: false,
                            endPage: true
                        });
                    }
                }
            })
            .catch(r => this.setState({ loading: false }));
    };

    /**
     * 加载更多
     */
    loadMore = () => {
        if (!this.loading) {
            this.loading = true;
            this.loadLists(this.state.page + 1);
        }
    };
    /**
     * 图片上传成功回调
     */
    successCallBack = () => {
        this.setState({
            page: 1
        });
        message.success("图片上传成功");
        this.loadLists(1);
    };
    handleMOver = () => {
        this.setState({
            showPhoneErqCode: true
        });
    };
    handleMOverN = () => {
        this.setState({
            showNotice: true
        });
    };
    handleMOut = () => {
        this.setState({
            showPhoneErqCode: false
        });
    };
    handleMOutN = () => {
        this.setState({
            showNotice: false
        });
    };
    //版权
    copyRight = () => {
        this.setState({
            copyRight: true
        });
    };
    closeCopyRight = () => {
        this.setState({
            copyRight: false
        });
    };

    render() {
        const {
            state: {
                lists,
                loading,
                endPage,
                modalContent,
                modalProps,
                modalOpen,
                progress,
                showPhoneErqCode = false,
                showNotice = false,
                dragImg = false,
                copyRight = false
            },
            handleDragStart,
            onDragEnd,
            handleClick,
            active = false,
            loadMore
        } = this;
        return (
            <ScrollContainer>
                <div className={`${styles.myPictures} scrollDiv`} id='picturesContainer'>
                    <p className={styles.rhythm}>
                        单击图片或拖拽图片至左侧编辑区可新增图片/替换原图片
                    </p>
                    {lists.length === 0 && (
                        <Empty
                            text={loading ? "加载中..." : "未找到图片"}
                            style={{ marginTop: "30px" }}
                        />
                    )}
                    {
                        <Infinite
                            className={styles.container}
                            pageStart={0}
                            loadMore={loadMore}
                            hasMore={!endPage}
                            initialLoad={false}
                            threshold={400}
                            useWindow={false}
                            getScrollParent={() => document.getElementById("picturesContainer")}>
                            {lists.map((pic, index) => (
                                <div
                                    key={pic.id}
                                    className={styles.item}
                                    onDragStart={e => handleDragStart(e, pic.path, pic.id)}
                                    onDragEnd={e => onDragEnd(e, pic.path, pic.id)}
                                    id={`pic-${pic.id}`}
                                    draggable='true'
                                    onClick={e => handleClick(e, pic.path)}>
                                    <img
                                        style={{ opacity: pic.dragImg ? ".5" : "1" }}
                                        src={`${host.musicFile}${pic.path}?imageMogr2/auto-orient/strip/thumbnail/124x124`}
                                    />
                                </div>
                            ))}
                        </Infinite>
                    }
                    <div className={styles.bottom}>
                        <span>
                            本地上传
                            <Upload
                                type={FILE_TYPE.img}
                                hide={true}
                                multiple={20}
                                onSuccessUpload={this.successCallBack}
                                progressStyle={{
                                    height: 2,
                                    borderRadius: 2,
                                    color: "#1392FE",
                                    bottom: 0,
                                    top: "unset",
                                    background: "#CCD5DB"
                                }}
                                flashPicUpload={true}
                            />
                        </span>
                        <span
                            className={styles.phoneUpload}
                            onMouseOver={this.handleMOver}
                            onMouseOut={this.handleMOut}>
                            手机上传
                        </span>
                        <span
                            className={styles.notice}
                            onMouseOver={this.handleMOverN}
                            onMouseOut={this.handleMOutN}>
                            上传须知
                        </span>
                    </div>
                    <div
                        className={`${styles.erqcodeBox} ${showPhoneErqCode ? styles.active : ""}`}>
                        <p>微信“扫一扫”上传图片</p>
                        <div className={styles.erqcodeImg} ref={this.qrcode} />
                        {progress > 0 && (
                            <div className={styles.erqcodeProcess}>
                                <Progress type='circle' percent={progress} />
                                <div className={styles.processText}>已上传</div>
                            </div>
                        )}
                    </div>
                    <div className={`${styles.noticeBox} ${showNotice ? styles.active : ""}`}>
                        <p>
                            易企秀为广大用户提供原创正版图片上传渠道、信息储存空间等网络技术服务，用户可在遵守：
                        </p>
                        <p>
                            <a onClick={this.copyRight}>《易企秀图片版权法律风险声明》</a>
                            <br />
                            的前提下自行上传并对其上传作品承担全部责任，请谨慎使用上传功能。
                        </p>
                        <h3>图片上传要求：</h3>
                        <p>
                            非会员大小不超过10M，会员大小不超过15M，支持格式：jpg、png、gif。一次最多上传20张。
                        </p>
                    </div>
                </div>
                <Modal {...modalProps} onCancel={this.onClose} visible={modalOpen}>
                    {modalContent}
                </Modal>
                <Modal
                    visible={!!copyRight}
                    onCancel={this.closeCopyRight}
                    header='易企秀图片版权许可与服务协议'>
                    <ImageCopyright />
                </Modal>
            </ScrollContainer>
        );
    }
}

export default DragPictures;
