import React from "react";
import styles from "./music.less";
import { prev, host } from "Config/env";
import { genUrl } from "Util/image";
import { compatibleVideo, genVideoUrl } from "Util/file";
import { CANVAS_TYPE, SEGMENT_TYPE } from "Config/staticParams";
import { deleteMine, getMineMusic, progressAudio } from "../../../../../api/mine";
import Infinite from "react-infinite-scroller";
import { connect } from "dva";
import Empty from "Components/empty";
import Modal from "../../../../components/modal";
import { limitInsert } from "Util/data";
import ManageMenu from "./manageMenu";
import Icon from "../../../../components/Icon";
import { Checkbox, Tooltip, message, Popover } from "antd";
import { addFavorite, checkCollect, deleteFavorite } from "../../../../../api/music";
import eventEmitter from "../../../../../services/EventListener";
import CutMusic from "../../../soundManage/cutMusic";
import VolumeSlider from "../../../../components/transition/volumeSlider";
import ScrollContainer from "../../../../components/scrollContainer";
import Button from "../../../../components/Button";
import { delay } from "../../../../../util/delayLoad";
import { RENDER_STATUS } from "../../../../../config/staticParams";

const imitParams = {
    upload: {
        fileType: 2
    },
    buy: {
        fileType: 2
    },
    favorite: {
        attrGroupId: 3,
        platform: 0
    }
};

@connect()
class MineMusic extends React.Component {
    constructor(props) {
        super(props);
        this.audio = React.createRef();
        this.state = {
            loading: true,
            list: [],
            audioList: [],
            page: 1,
            endPage: false,
            pageSize: 30,
            manage: false,
            checked: false,
            checkedList: {},
            collection: {},
            active: "upload",
            activeId: null
        };
    }

    componentDidUpdate(prevProps, prevState) {}

    componentDidMount() {
        this.loadProgressAudio();
        eventEmitter.on("leftSideCallback", this.callback); // 暂停音乐播放
        eventEmitter.on("loadMusicLists", this.loadProgressAudio); // 重新加载
    }

    componentWillUnmount() {
        this.setState = () => null;
    }

    callback = () => {
        this.pause();
    };
    loadLists = (page = 1, showLoading = true) => {
        const { pageSize, list, active, audioList } = this.state;
        const params = {
            ...imitParams[active],
            pageNo: page,
            pageSize
        };
        if (showLoading) {
            this.setState({ loading: true });
        }
        getMineMusic(params, active, page === 1)
            .then(res => {
                const { data } = res;
                if (data.success) {
                    this.loading = false;
                    const resList = data.list;
                    if (resList && resList.length > 0) {
                        const musicList = page > 1 ? list.concat(resList) : resList;
                        /* if (audioList.length) {
                            audioList.map((item,index) => {
                                musicList[index].musicTranscode = item.status;
                            });
                        } else {
                            musicList.map((item,index) => {
                                if (item.musicTranscode) {
                                    musicList[index].musicTranscode = 0;
                                }
                            });
                        }*/
                        const newState = {
                            list: musicList,
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
    loadProgressAudio = async () => {
        const res = await progressAudio();
        const {
            data: { success, obj }
        } = res;
        if (obj.length) {
            this.setState({ audioList: obj });
            this.loadLists(1, false);
            if (
                obj.some(item =>
                    [RENDER_STATUS.init, RENDER_STATUS.rendering].includes(item.status)
                )
            ) {
                await delay(4000);
                this.loadProgressAudio();
            }
        } else {
            this.setState({ audioList: [] });
            this.loadLists();
        }
    };
    loadMore = () => {
        if (!this.loading) {
            this.loading = true;
            this.loadLists(this.state.page + 1);
        }
    };
    handleClick = item => {
        const picUrl = `${host.font2}${item.path}`;
        this.props.dispatch({
            type: "workspace/insertImg",
            payload: {
                picUrl
            }
        });
    };
    checkAll = flag => {
        const { checkedList, list } = this.state;
        list.forEach(item => {
            if (flag) {
                checkedList[item.id] = true;
            } else {
                delete checkedList[item.id];
            }
        });
        this.setState({
            checkedList,
            checked: flag
        });
    };
    openManage = flag => {
        this.pause();
        this.setState({
            manage: flag,
            checked: false,
            checkedList: {}
        });
    };
    checkOne = id => {
        const { list, checkedList } = this.state;
        if (checkedList[id]) {
            delete checkedList[id];
        } else {
            checkedList[id] = true;
        }
        this.setState({
            checkedList,
            checked: list.length === Object.keys(checkedList).length
        });
    };
    deleteCheck = () => {
        const { checkedList } = this.state;
        deleteMine({
            ids: Object.keys(checkedList)
        }).then(() => {
            this.setState(
                {
                    checked: false,
                    checkedList: {},
                    loading: false,
                    list: [],
                    endPage: true
                },
                this.loadLists
            );
        });
    };
    deleteOne = id => {
        this.pause();
        deleteMine({
            ids: [id]
        }).then(() => {
            this.setState(
                {
                    loading: false,
                    list: [],
                    endPage: true
                },
                this.loadLists
            );
        });
    };
    play = ({ path: activeUrl, id }) => {
        const audio = this.audio.current;
        audio.src = `${host.musicFile}${activeUrl}`;
        audio.currentTime = 0;
        this.setState({
            activeUrl,
            activeId: id
        });
    };
    pause = () => {
        const audio = this.audio.current;
        if (!audio) return;
        audio.src = "";
        audio.currentTime = 0;
        this.setState({
            activeUrl: null,
            activeId: null
        });
    };
    collect = ({ productId: id, favoriteId }) => {
        // 检查是否已收藏
        checkCollect({ productId: id }).then(({ data }) => {
            if (data.success) {
                const collection = this.state.collection;
                if (data.map.collectStatus === 0) {
                    // 未收藏，调用收藏接口
                    addFavorite(id).then(({ data }) => {
                        if (data.success) {
                            message.success("收藏成功");
                            collection[id] = true;
                            this.setState({
                                collection
                            });
                        }
                    });
                } else {
                    // 已收藏，取消收藏
                    deleteFavorite(favoriteId).then(({ data }) => {
                        if (data.success) {
                            message.success("取消收藏成功");
                            this.setState(
                                {
                                    collection: []
                                },
                                this.loadLists
                            );
                        }
                    });
                }
            }
        });
    };
    checkedMusic = (key, v) => {
        this.pause();

        const checkedMusic = {
            name: v.name,
            url: v.path,
            volume: 100
        };
        const voiceIndex = key === "partyVoice" ? "now" : key === "voice" ? false : null;
        if (voiceIndex !== null) {
            return this.props
                .dispatch({
                    type: "editor/setVoice",
                    payload: {
                        ...checkedMusic,
                        partyIndex: voiceIndex
                    }
                })
                .then(() => {
                    eventEmitter.emit("openSoundManage");
                });
        } else {
            this.saveCommon({ [key]: checkedMusic });
        }
    };
    saveCommon = payload => {
        this.props
            .dispatch({
                type: "editor/saveCommon",
                payload
            })
            .then(() => {
                eventEmitter.emit("openSoundManage");
            });
    };
    activeTag = path => {
        this.setState(
            {
                active: path,
                loading: false,
                list: [],
                endPage: true
            },
            this.loadLists
        );
    };
    onClose = () => {
        this.setState({ showCut: false });
    };
    onOpen = v => {
        const { name, path } = v;
        const dom = document.createElement("audio");
        dom.src = `${host.musicFile}${path}`;
        this.checkedAudio = {
            dom,
            name
        };
        this.setState({ showCut: true });
    };

    render() {
        const {
            list,
            endPage,
            loading,
            audioList,
            collection,
            activeId,
            checked,
            manage,
            checkedList,
            active,
            showCut
        } = this.state;
        const textTile = loading ? "正在加载" : "未找到音乐";
        return (
            <ScrollContainer>
                <React.Fragment>
                    <ManageMenu
                        scrolling={this.props.scrolling}
                        checkedList={Object.keys(checkedList)}
                        type={"music"}
                        active={active}
                        checkAll={this.checkAll}
                        activeTag={this.activeTag}
                        checked={checked}
                        manage={manage}
                        openManage={this.openManage}
                        deleteCheck={this.deleteCheck}
                    />
                    <div className={`${styles.decorate} scrollDiv`} id={"mine_image_container"}>
                        <Infinite
                            pageStart={0}
                            loadMore={this.loadMore}
                            hasMore={!endPage}
                            initialLoad={false}
                            threshold={400}
                            useWindow={false}
                            getScrollParent={() => document.getElementById("mine_image_container")}>
                            {audioList.length > 0 &&
                                active === "upload" &&
                                audioList.map(item => (
                                    <div key={item.id} className={styles.musicFormatting}>
                                        <p>{item.name}</p>
                                        <h1>
                                            {item.status === RENDER_STATUS.fail
                                                ? "转码失败"
                                                : "转码中..."}
                                        </h1>
                                    </div>
                                ))}
                            {list.map((v, index) => (
                                <div
                                    key={v.id}
                                    onClick={manage ? () => this.checkOne(v.id) : () => {}}
                                    className={`${styles.singleBox} ${
                                        activeId === v.id ? styles.active : ""
                                    }`}>
                                    <div className={styles.left}>
                                        {manage && (
                                            <div className={styles.checkBox}>
                                                <Checkbox checked={checkedList[v.id]} />
                                            </div>
                                        )}
                                        <VolumeSlider className={styles.playing} dynamic={true} />
                                        <div className={styles.title}>{v.name}</div>
                                        {v.brand && (
                                            <Tooltip title={v.brand.name}>
                                                <a
                                                    className={styles.logo}
                                                    href={v.brand.url}
                                                    target='_blank'>
                                                    <img src={v.brand.logo} />
                                                </a>
                                            </Tooltip>
                                        )}
                                    </div>
                                    {!manage && (
                                        <div className={styles.right}>
                                            {v.price === 0 ? (
                                                <div className={styles.free}>免费</div>
                                            ) : v.price > 0 ? (
                                                <React.Fragment>
                                                    <div className={styles.price}>
                                                        {v.price}秀点
                                                    </div>
                                                    <div className={styles.vipFree}>会员免费</div>
                                                </React.Fragment>
                                            ) : (
                                                <div className={styles.time}>
                                                    {/*{moment(v.size, 'X').format('mm:ss')}*/}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {!manage && (
                                        <div className={styles.right2}>
                                            {/*不是收藏会有音乐剪切按钮*/}
                                            {active !== "favorite" && (
                                                <Tooltip title={"裁剪"}>
                                                    <Icon
                                                        className={styles.use}
                                                        type='eqf-cut'
                                                        onClick={() => this.onOpen(v)}
                                                    />
                                                </Tooltip>
                                            )}
                                            {/*上传的音乐有删除按钮*/}
                                            {active === "upload" && !manage && (
                                                <Tooltip title={"删除"}>
                                                    <Icon
                                                        className={styles.use}
                                                        type='eqf-delete-l'
                                                        onClick={() => this.deleteOne(v.id)}
                                                    />
                                                </Tooltip>
                                            )}

                                            {/*不是用户上传的音乐没有收藏*/}
                                            {active !== "upload" && (
                                                <React.Fragment>
                                                    {collection[v.id] || active === "favorite" ? (
                                                        <Tooltip title={"取消收藏"}>
                                                            <Icon
                                                                className={`${styles.use} ${styles.collection}`}
                                                                onClick={() => this.collect(v)}
                                                                type='eqf-love'
                                                            />
                                                        </Tooltip>
                                                    ) : (
                                                        <Tooltip title={"收藏"}>
                                                            <Icon
                                                                className={`${styles.use} ${styles.collection}`}
                                                                onClick={() => this.collect(v)}
                                                                type='eqf-love-line'
                                                            />
                                                        </Tooltip>
                                                    )}
                                                </React.Fragment>
                                            )}
                                            {activeId !== v.id ? (
                                                <Tooltip title={"试听"}>
                                                    <Icon
                                                        className={`${styles.use} ${styles.play}`}
                                                        type='iconfont iconplay-line'
                                                        onClick={() => this.play(v)}
                                                    />
                                                </Tooltip>
                                            ) : (
                                                <Tooltip title={"暂停"}>
                                                    <Icon
                                                        className={`${styles.use} ${styles.pause}`}
                                                        type='eqf-pause'
                                                        onClick={this.pause}
                                                    />
                                                </Tooltip>
                                            )}
                                            <div className={styles.options}>
                                                <Popover
                                                    content={
                                                        <div className={styles.option_modal}>
                                                            <div
                                                                onClick={() =>
                                                                    this.checkedMusic("music", v)
                                                                }>
                                                                设为背景音乐
                                                            </div>
                                                            <div
                                                                onClick={() =>
                                                                    this.checkedMusic(
                                                                        "partyVoice",
                                                                        v
                                                                    )
                                                                }>
                                                                设为当前片段旁白
                                                            </div>
                                                            <div
                                                                onClick={() =>
                                                                    this.checkedMusic("voice", v)
                                                                }>
                                                                设为整个视频旁白
                                                            </div>
                                                        </div>
                                                    }
                                                    getPopupContainer={() =>
                                                        document.getElementsByClassName(
                                                            styles.options
                                                        )[index]
                                                    }
                                                    arrowPointAtCenter={true}
                                                    placement='bottomRight'>
                                                    <Button className={styles.useButton}>
                                                        设为
                                                    </Button>
                                                </Popover>
                                            </div>
                                        </div>
                                    )}
                                    <div className={styles.line}></div>
                                </div>
                            ))}
                        </Infinite>
                        {list.length > 0 && loading && <Empty text={"加载中..."} />}
                        {audioList.length === 0 && list.length === 0 && (
                            <Empty text={textTile} style={{ marginTop: "30px" }} />
                        )}
                        <audio ref={this.audio} autoPlay loop style={{ display: "none" }} />
                    </div>
                    <Modal visible={!!showCut} onCancel={this.onClose}>
                        {showCut && (
                            <CutMusic
                                audio={this.checkedAudio.dom}
                                title={this.checkedAudio.name}
                                onClose={this.onClose}
                                onChange={() => {
                                    this.onClose();
                                    this.setState({
                                        list: [],
                                        endPage: false
                                    });
                                    this.loadLists(1);
                                }}
                            />
                        )}
                    </Modal>
                </React.Fragment>
            </ScrollContainer>
        );
    }
}

export default MineMusic;
