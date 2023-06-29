import React from "react";
import styles from "./bgImage.less";
import { prev, host } from "Config/env";
import { genUrl, getImgAspectRatioByUrl } from "../../../../util/image";
import {
    CANVAS_TYPE,
    FILE_TYPE,
    STATIC_BACKGROUND_CATEGROTY_ID,
    WORKSPACE_SIZE
} from "../../../../config/staticParams";
import { getListProdByParam } from "../../../../api/user";
import Infinite from "react-infinite-scroller";
import { connect } from "dva";
import Empty from "../../../components/empty";
import { limitInsert } from "../../../../util/data";
import Slider from "Components/slider";
import Popconfirm from "Components/common/Popconfirm";
import Cropper from "Components/cropper";
import { formatEQXMessage } from "../../../../util/event";
import { message } from "antd";
import * as env from "../../../../config/env";
import Modal from "../../../components/modal";
import Icon from "../../../components/Icon";

@connect(({ workspace, editor }) => ({
    workspace,
    transverse: editor.transverse
}))
class BgImage extends React.Component {
    constructor(props) {
        super(props);
        this.video = React.createRef();
        this.activeHeight = React.createRef();
        this.isLoading = false;
    }

    state = {
        playing: false, // 正在播放
        hoverObj: {}, // 预览对象
        showPreivew: false, // 预览
        loading: true,
        list: [],
        page: 1,
        endPage: false,
        pageSize: 30,
        slider: false, // 更多展开和收起
        height: 0 // 展开的高度
    };

    componentDidUpdate(prevProps, prevState) {}

    componentDidMount() {
        this.loadLists();
    }

    loadLists = (page = 1) => {
        const { pageSize, list } = this.state;
        const { transverse } = this.props;
        const params = {
            category: STATIC_BACKGROUND_CATEGROTY_ID[~~transverse],
            sortBy: "sort",
            priceFloor: -1,
            priceCeiling: -1,
            pageNo: page,
            pageSize
        };
        this.setState({ loading: true });
        getListProdByParam(params, page === 1)
            .then(res => {
                const { data } = res;
                if (data.success) {
                    this.loading = false;
                    const resList = data.list;
                    if (resList && resList.length > 0) {
                        const newState = {
                            list: page > 1 ? list.concat(resList) : resList,
                            page: params.pageNo,
                            count: data.map.count,
                            endPage: data.map.end,
                            redirect: ""
                        };
                        this.setState({
                            ...newState,
                            loading: false
                        });
                    } else {
                        this.setState({
                            list: page > 1 ? list : [],
                            loading: false,
                            endPage: true
                        });
                    }
                }
            })
            .catch(r => this.setState({ loading: false }));
    };
    loadMore = () => {
        if (!this.loading) {
            this.loading = true;
            this.loadLists(this.state.page + 1);
        }
    };
    handleClick = (e, item) => {
        if (limitInsert(this.props.workspace.dataList, CANVAS_TYPE.img) === false) return;
        const picUrl = `${host.font2}${item.path}`;
        // 先做裁剪
        // this.handleCut(picUrl);
        this.props.dispatch({
            type: "workspace/changeBackground",
            payload: { backgroundImg: genUrl(picUrl), cutParams: undefined }
        });
    };

    onChangeOpacity = data => {
        let value = 1 - ~~data / 100;
        if (Number.isNaN(value)) {
            return;
        }
        if (value < 0) {
            value = 0;
        }
        if (value > 1) {
            value = 1;
        }
        this.props.dispatch({
            type: "workspace/changeBackground",
            payload: { videoBackgroundPicOpacity: value }
        });
    };

    /**
     * 删除背景图
     * */
    handleDelete = () => {
        this.props.dispatch({
            type: "workspace/changeBackground",
            payload: { backgroundImg: "", cutParams: undefined }
        });
    };

    /**
     * 触发选择背景图的方法
     * */
    handleReplace = () => {
        this.setState({
            nowAspectRatio: false,
            callbackFunction: this.afterChangeBackgroundImg
        });
        this.onOpen(this.getImgMessage, "/material/image");
    };

    /**
     * 改变背景图
     * @param url
     */
    afterChangeBackgroundImg = (url, cutParams) => {
        this.props.dispatch({
            type: "workspace/changeBackground",
            payload: { backgroundImg: genUrl(url), cutParams }
        });
        this.onClose();
    };
    _oldUrl = null;
    /**
     * 裁剪图片
     * */
    handleCut = (bgUrl = null) => {
        const {
            workspace: { dataList },
            transverse
        } = this.props;
        const { backgroundImg, cutParams = {} } = dataList[0];
        const url =
            (bgUrl && String(bgUrl).split("?")[0]) ||
            cutParams.oriUrl ||
            String(backgroundImg).split("?")[0];
        this._oldUrl = url;
        this.onOpen(
            () => {},
            false,
            <Cropper
                image={url}
                cutParams={cutParams}
                onClose={this.onClose}
                aspectRatio={transverse ? 16 / 9 : 9 / 16}
                onChange={(curl, cutParams) => this.afterChangeBackgroundImg(curl, cutParams)}
            />
        );
    };
    /**
     * 打开的通用方法
     * @param callBack 回调函数
     * @param isFrame 是否frame 是的话直接传入地址会自动拼接
     * @param children 不是frame 的话可以传入子组件
     */
    onOpen = (callBack, isFrame = false, children = "", modalProps = {}) => {
        const content = isFrame ? (
            <iframe
                onLoad={() => {}}
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
     * 改变背景图
     * @param url
     */
    afterChangeBackgroundImg = (url, cutParams) => {
        this.handleCropperImg(genUrl(url), cutParams);
        this.onClose();
    };

    handleCropperImg = (backgroundImg, cutParams = {}) => {
        const {
            workspace: { dataList }
        } = this.props;
        const { cutParams: oldCutParams = {} } = dataList[0];
        this.changeNow({
            backgroundImg,
            cutParams: { oriUrl: oldCutParams.oriUrl || this._oldUrl, ...cutParams }
        });
    };

    // 保存数据
    changeNow = payload => {
        this.props.dispatch({
            type: "workspace/changeBackground",
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
     * 抓取图片选择的URL地址
     * @param message
     */
    getImgMessage = message => {
        const data = formatEQXMessage(message);
        if (data === false) {
            return;
        }
        if (data.type === "close") {
            this.onClose(true);
        }
        if (data.type === "success") {
            this.onClose();
            const url = env.host.musicFile + data.data[0].path;
            // this.changeNow({ cutParams: { oriUrl: url } })
            // 从图库选择完毕进入裁剪
            this.handleCut(url);
            // this.handleCropperImg(url);
        }
    };

    render() {
        const { list, endPage, loading, modalProps, modalContent, modalOpen } = this.state;
        const {
            workspace: { dataList }
        } = this.props;
        const textTile = loading ? "正在加载" : "未找到背景图";
        const { backgroundImg = null, videoBackgroundPicOpacity = 1 } = dataList[0] || {};
        const opacityValue = ~~(100 - Number(videoBackgroundPicOpacity) * 100);
        return (
            <React.Fragment>
                <div className={styles.top}>
                    <div className={styles.btns}>
                        <div className={styles.upload} onClick={this.handleReplace}>
                            <div>从图片库选择</div>
                        </div>
                        {backgroundImg && (
                            <div className={styles.cut} onClick={e => this.handleCut()}>
                                裁剪
                            </div>
                        )}
                        {backgroundImg && (
                            <div className={styles.del} onClick={this.handleDelete}>
                                删除
                            </div>
                        )}
                    </div>
                    <div className={styles.opacity}>
                        <div>透明度</div>
                        <Slider
                            className={`slider ${backgroundImg ? "" : styles.disabled}`}
                            disabled={!backgroundImg}
                            min={0}
                            max={100}
                            step={1}
                            onChange={this.onChangeOpacity}
                            value={opacityValue}
                            tooltipVisible={false}
                        />
                        <div>{opacityValue}%</div>
                    </div>
                </div>
                <div className={styles.decorate}>
                    {
                        <Infinite
                            pageStart={0}
                            loadMore={this.loadMore}
                            hasMore={!endPage}
                            initialLoad={false}
                            threshold={400}
                            useWindow={false}
                            getScrollParent={() =>
                                document.getElementById("specialEffect__container")
                            }>
                            {list.map(v => {
                                const active = (backgroundImg || "").includes(v.path);
                                return (
                                    <div
                                        key={v.id}
                                        className={styles.singleBox}
                                        onClick={
                                            active ? this.handleDelete : e => this.handleClick(e, v)
                                        }>
                                        <div className={styles.videoOuter}>
                                            {active && (
                                                <div className={styles.selected}>
                                                    <Icon type='eqf-yes' className={styles.icon} />
                                                </div>
                                            )}
                                            <img src={`${host.font2}${v.path}`} />
                                        </div>
                                    </div>
                                );
                            })}
                        </Infinite>
                    }
                    {list.length > 0 && loading && <Empty text={"加载中..."} />}
                    {list.length === 0 && <Empty text={textTile} style={{ marginTop: "30px" }} />}
                </div>
                <Modal {...modalProps} onCancel={this.onClose} visible={modalOpen}>
                    {modalContent}
                </Modal>
            </React.Fragment>
        );
    }
}

export default BgImage;
