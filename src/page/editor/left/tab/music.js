import React from 'react';
import styles from './music.less';
import { prev, name as envName, host } from 'Config/env';
import { getInfo, getListProdByParam, getMusicSearchList } from '../../../../api/user';
import Infinite from 'react-infinite-scroller';
import { connect } from 'dva';
import Empty from '../../../components/empty';
import Icon from '../../../components/Icon';
import { message, Tooltip, Input } from 'antd';
import { checkCollect, deleteFavorite, addFavorite, checkVipMaterial } from '../../../../api/music';
import { getAllSegment } from '../../../../api/templateShow';
import { decodeMusic, genMusicUrl } from '../../../../util/file';
import eventEmitter from '../../../../services/EventListener';
import VolumeSlider from '../../../components/transition/volumeSlider';
import ScrollContainer from '../../../components/scrollContainer';
import Labels from '../../../components/labels';
import { LABEL_LIST } from '../../../../config/staticParams';
import OrderBy from '../orderBy';
import Button from '../../../components/Button';
import { waitChoseModel } from 'Components/delete';
import { ComVip } from 'Components/vip';
import MusicSearch from './musicSearch';

// import { showGhost } from '../../../components/transition/ghostAfterImage';

const envFlag = ['pro', 'pre'].includes(envName);
const prices = [
    {
        title: '免费',
        data: {
            priceFloor: 0,
            priceCeiling: 0,
        },
        id: 0,
    },
    // {
    //     title: '1-10秀点',
    //     data: {
    //         priceFloor: 1,
    //         priceCeiling: 10,
    //     },
    //     id: 1,
    // },
    // {
    //     title: '11-20秀点',
    //     data: {
    //         priceFloor: 11,
    //         priceCeiling: 20,
    //     },
    //     id: 11,
    // },
    // {
    //     title: '21-30秀点',
    //     data: {
    //         priceFloor: 21,
    //         priceCeiling: 30,
    //     },
    //     id: 21,
    // },
];

@connect(({ editor }) => {
    const { music, templateId } = editor;
    return {
        music,
        templateId,
    };
})
class Music extends React.Component {
    constructor(props) {
        super(props);
        this.audio = React.createRef();
        this.state = {
            loading: true,
            list: [],
            page: 1,
            endPage: false,
            pageSize: 30,
            collection: {},
            checkedMusic: {},
            checkedVipMaterial: false, //创意云会员检测
            activeId: 0,
            activeUrl: null,
            checked: {
                price: 0,
                sortBy: envFlag ? 'sort' : 'create_time|desc', // test
                // sortBy: 'sort',
                category: props.topTag,
            },
            category: props.topTag,
        };
        this.searchParams = {
            category: props.topTag,
            // sortBy: 'sort',
            sortBy: envFlag ? 'sort' : 'create_time|desc', // test
            priceFloor: -1,
            priceCeiling: -1,
        };
        if (props.onRef) {
            props.onRef(this);
        }
    }


    static getDerivedStateFromProps(nextProps, prevState) {
        const newState = { ...prevState };
        if (nextProps.music.url !== prevState.checkedMusic.url) {
            newState.checkedMusic = nextProps.music || {};
        }
        return newState;
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.topTag !== this.props.topTag) {
            this.changeParams({ category: this.props.topTag });
            this.setState({
                loading: false,
                list: [],
                endPage: false,
            }, this.loadLists);
        }
    }

    componentDidMount() {
        this.loadLists();
        eventEmitter.on('leftSideCallback', this.callback); // 暂停音乐播放
        this.getUser();
        // 检查是否创意云会员
        this.checkVipMaterial();
    }

    changeParams = (payload) => {
        if (!Array.isArray(payload)) {
            this.searchParams = {
                ...this.searchParams,
                ...payload,
            };
        } else {
            delete this.searchParams.sourceType;
            this.labelActiveArray = payload;
            if ([null, 1, -1, 2000, 2001, 2002, 2100].includes(payload[0]) && [null].includes(payload[1])) {
                this.searchParams.category = this.props.topTag;
            } else {
                this.searchParams.category = payload[1];
            }
            if ([2002, null].includes(payload[0]) || [null].includes(payload[1])) {
                // 会员免费/全部
                this.searchParams.priceFloor = -1;
                this.searchParams.priceCeiling = -1;
            }
            if ([2001].includes(payload[0])) {
                // 免费为0
                this.searchParams.priceFloor = 0;
                this.searchParams.priceCeiling = 0;
            }
            if ([2002].includes(payload[0])) {
                // 会员免费
                this.searchParams.sourceType = 8;
            }
        }
        this.currentPrice();
        this.loadLists();
    };
    getUser = () => {
        getInfo()
            .then(res => {
                const { data } = res;
                if (data.success) {
                    this.setState({
                        isVip: data.obj.type === 1 && data.obj.membertype === 14,
                    });
                }
            });
    };

    componentWillUnmount() {
        this.setState = () => null;
    }

    callback = () => {
        this.pause();
    };
    loadLists = (page = 1) => {
        const { pageSize, list, checked } = this.state;
        const params = {
            ...this.searchParams,
            pageNo: page,
            pageSize,
        };
        const testParams = {
            // category: params.category,
            category: 890523,
            keywords: params.keyWords,
            pageNo: params.pageNo,
            pageSize: params.pageSize,
            sortBy: params.sortBy,
            platform: '1,4',
            searchCode: 94233,
        };
        if (params.sourceType && params.priceFloor == -1) {
            testParams.sourceType = params.sourceType;
            delete testParams.priceRange;
        }

        if (params.priceFloor == 0) {
            testParams.priceRange = `${params.priceFloor}a${params.priceCeiling}`;
        }

        this.setState({ loading: true });

        // 临时测试接口
        const requestApi = envFlag ? getListProdByParam(params, page === 1) : getMusicSearchList(testParams);
        requestApi
            .then(res => {
                const { data } = res;
                if (data.success) {
                    this.loading = false;
                    const resList = envFlag ? data.list : data.obj.dataList;
                    if (resList && resList.length > 0) {
                        let newState = {
                            list: page > 1 ? list.concat(resList) : resList,
                            page: params.pageNo,
                            // count: data.map.count,
                            // endPage: data.obj.end,
                            redirect: '',
                        };
                        if (envFlag) {
                            newState = {
                                ...newState,
                                count: data.map.count,
                                endPage: data.map.end,
                            };
                        } else {
                            newState = {
                                ...newState,
                                endPage: data.obj.end,
                            };
                        }
                        this.setState({
                            ...newState,
                            loading: false,
                            checked: {
                                ...checked,
                                category: this.searchParams.category,
                            },
                        });
                    } else {
                        this.setState({
                            list: page > 1 ? list : [],
                            loading: false,
                            endPage: true,
                            checked: {
                                ...checked,
                                category: this.searchParams.category,
                            },
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
    play = (playObj) => {
        const audio = this.audio.current;
        let activeUrl = envFlag ? playObj.path : playObj.productTypeMap.path;
        audio.src = `${host.font2}${activeUrl}`;
        audio.currentTime = 0;
        this.setState({
            activeUrl,
            activeId: playObj.id,
        });
    };
    playCurrent = (activeUrl) => {
        const audio = this.audio.current;
        audio.src = genMusicUrl(activeUrl);
        audio.currentTime = 0;
        this.setState({
            activeUrl,
        });
    };
    pause = () => {
        const audio = this.audio.current;
        if (!audio) return;
        audio.src = '';
        audio.currentTime = 0;
        this.setState({
            activeUrl: null,
            activeId: null,
        });
    };
    collect = (e, id) => {
        // const start = {
        //     x: e.clientX,
        //     y: e.clientY,
        // };
        // 检查是否已收藏
        checkCollect({ productId: id })
            .then(({ data }) => {
                if (data.success) {
                    const { collection: oldCollection } = this.state;
                    const collection = { ...oldCollection };
                    collection[id] = data.map.collectStatus === 1;
                    this.setState({
                        collection,
                    });
                    if (data.map.collectStatus === 0) {
                        // 未收藏，调用收藏接口
                        // const re = showGhost(start,
                        //     ({ className, style }) => <Icon
                        //         className={`${styles.collection} ${className}`}
                        //         type="eqf-love"
                        //         style={style}
                        //     />);
                        addFavorite(id)
                            .then(({ data: cData }) => {
                                if (cData.success) {
                                    message.success('收藏成功');
                                    collection[id] = true;
                                    this.setState({
                                        collection,
                                    });
                                }
                            });
                    } else {
                        message.warning('请在我的标签里取消收藏');
                    }
                }
            });
    };

    // 判断是否创意云会员
    checkVipMaterial = () => {
        checkVipMaterial()
            .then(res => {
                const { success, obj } = res.data;
                if (success && obj) {
                    this.setState({
                        checkedVipMaterial: true,
                    });
                } else {
                    this.setState({
                        checkedVipMaterial: false,
                    });
                }
            });
    };

    // 打开创意云会员弹窗
    openComVip = () => {
        ComVip({
            source: '升级会员音乐',
            benefitId: 37,
            clickPosition: '升级会员音乐',
        })
            .then(res => {
                // 开通成功
                this.checkVipMaterial();
            })
            .catch(re => re);
    };

    checked = (v) => {
        const { checked: { isVip: isVipAccount }, checkedVipMaterial } = this.state;
        // 不是会员用户使用会员免费音乐需开通会员权益
        const memberFreeFlag = envFlag ? v.memberFreeFlag : v.attrMap.memberFreeFlag;
        if (memberFreeFlag && !isVipAccount && !checkedVipMaterial) {
            // 会员提示
            waitChoseModel({
                text: '升级会员后才能使用会员音乐',
                info: '升级会员后，可免费使用会员音乐、免费下载高清无水印视频等，年费会员低至6毛/天。',
                sureBtn: '升级会员',
            })
                .then(res => {
                    console.log('升级会员');
                    this.openComVip();
                })
                .catch(err => {
                    console.log('取消');
                });
            return false;
        }

        this.pause();
        const checkedMusic = {
            name: v.name,
            url: `${host.font2}${envFlag ? v.path : v.productTypeMap.path}`,
            volume: 100,
        };
        this.saveCommon({ music: checkedMusic });
        this.setState({
            checkedMusic,
        });
    };
    // 重置背景音乐
    reset = () => {
        this.pause();
        const templateId = this.props.templateId;
        getAllSegment(templateId)
            .then(res => {
                if (res.data.success) {
                    const bgm = decodeMusic(res.data.obj.bgm);
                    this.setState({ checkedMusic: bgm });
                    this.saveCommon({ music: bgm });
                }
            });
    };
    // 打开背景音乐操作框
    open = () => {
        this.setState({ opened: true });
        document.addEventListener('click', this.handleMouseClick);
    };
    handleMouseClick = () => {
        this.setState({ opened: false });
        document.removeEventListener('click', this.handleMouseClick);
    };
    // 删除背景音乐
    deleteMusic = () => {
        this.pause();
        this.setState({
            checkedMusic: {},
        });
        this.saveCommon({ music: {} });
    };
    // 保存背景音乐
    saveCommon = (payload) => {
        this.props.dispatch({
            type: 'editor/saveCommon',
            payload,
        })
            .then(() => {
                eventEmitter.emit('openSoundManage');
            });
    };
    currentPrice = () => {
        let price = null;
        const { category, sortBy, sourceType, priceFloor } = this.searchParams;
        if (sourceType) {
            price = 999;
        } else if (priceFloor === -1) {
            price = -1;
        } else if (priceFloor === 0) {
            price = 0;
        } else if (priceFloor === 1) {
            price = 1;
        } else if (priceFloor === 11) {
            price = 11;
        } else if (priceFloor === 21) {
            price = 21;
        }
        this.setState({
            loading: false,
            list: [],
            page: 1,
            endPage: false,
            checked: {
                price: price,
                sortBy: sortBy,
                category: category,
            },
        });
    };
    closeMore = () => {
        this.setState({
            moreTag: false,
            morePrice: false,
        });
    };
    handleMoreTag = (flag) => {
        this.setState({
            moreTag: flag,
            morePrice: false,
        });
    };
    handleMorePrice = (flag) => {
        this.setState({
            moreTag: false,
            morePrice: flag,
        });
    };
    // 搜索筛选
    searchChange = (value, type) => {
        this.searchParams.keyWords = value;
        if ('change' === type) return;
        // todo: 修改事件
        // eventEmitter.emit('musicSearchReset', [null, null]);
        this.changeParams([2000, null]);
        // this.loadLists();
    };
    labelActiveArray = [2000, null];

    render() {
        const {
            list, endPage, loading, activeUrl, collection,
            activeId,
            checkedMusic, opened, moreTag, morePrice,
            checked: { price, isVip, category },
        } = this.state;
        const { topTag, tags = [], scrolling, musicTags = [] } = this.props;
        const textTile = loading ? '正在加载' : '未找到音乐';
        // 过滤掉需要秀点购买的音乐
        let newList = list.filter(v => v.memberFreeFlag || (!v.memberFreeFlag && v.price == 0));
        if (!envFlag) {
            newList = list.filter(v => v);
        }
        const orderList = [
            {
                name: '最新',
                value: envFlag ? 'sort' : 'create_time|desc',
            },
            {
                name: '最热',
                value: envFlag ? 'product_usage' : 'seven_refer_count2|desc',
            },
        ];
        return (
            <React.Fragment>
                <MusicSearch onSearchChange={this.searchChange} />
                <ScrollContainer>
                    <React.Fragment>
                        <div onMouseLeave={this.closeMore}>
                            <div className={`${styles.tags} ${scrolling ? 'scrollShadow' : ''}`}>
                                {musicTags.length > 0 && <Labels width={80} textAlign={'left'}
                                    activeLabels={this.labelActiveArray}
                                    typeData={[LABEL_LIST.音乐价格, LABEL_LIST.音乐用途]}
                                    musicTags={musicTags} key={topTag} checked={category}
                                    refreshList={(category) => this.changeParams(category)} />
                                }
                                <OrderBy defaultValue={orderList[0].value}
                                    dataList={orderList}
                                    changeOrderBy={(sortBy) => this.changeParams({ sortBy })} />
                            </div>
                        </div>
                        <div className={`${styles.decorate} scrollDiv`} id={'music_container'}>
                            <Infinite
                                pageStart={0}
                                loadMore={this.loadMore}
                                hasMore={!endPage}
                                initialLoad={false}
                                threshold={100}
                                useWindow={false}
                                getScrollParent={() => document.getElementById('music_container')}>
                                {newList.map(v =>
                                    <div key={v.sourceId}
                                        className={`${styles.singleBox} ${activeId === v.id
                                            ? styles.active
                                            : ''}`}>
                                        <div className={styles.left}>
                                            <VolumeSlider className={styles.playing}
                                                dynamic={true} />
                                            <div className={styles.title}>{v.name}</div>
                                            <Tooltip
                                                title={envFlag ? v.brand.name : v.brandDTO.name}>
                                                <a className={styles.logo}
                                                    href={envFlag ? v.brand.url : v.brandDTO.url}
                                                    target='_blank'>
                                                    <img
                                                        src={envFlag ? v.brand.logo : v.brandDTO.logo} />
                                                </a>
                                            </Tooltip>
                                        </div>
                                        <div className={styles.right}>
                                            {
                                                (envFlag ? v.memberFreeFlag : v.attrMap.memberFreeFlag) ?
                                                    <div className={styles.vipFree}>会员免费</div>
                                                    :
                                                    <div className={styles.free}>免费</div>
                                            }
                                        </div>
                                        <div className={styles.right2}>
                                            {activeId !== v.id ?
                                                <Tooltip title={'试听'}>
                                                    <Icon className={`${styles.use} ${styles.play}`}
                                                        type="iconfont iconplay-line"
                                                        onClick={() => this.play(v)} />
                                                </Tooltip>
                                                : <Tooltip title={'暂停'}>
                                                    <Icon
                                                        className={`${styles.use} ${styles.pause}`}
                                                        type="eqf-pause"
                                                        onClick={this.pause} />
                                                </Tooltip>}
                                            {collection[v.id] ?
                                                <Icon
                                                    className={`${styles.use} ${styles.collection}`}
                                                    onClick={(e) => this.collect(e,
                                                        v.id)}
                                                    type="eqf-love" /> :
                                                <Tooltip title={'收藏'}>
                                                    <Icon
                                                        className={`${styles.use} ${styles.collection}`}
                                                        onClick={(e) => this.collect(e, v.id)}
                                                        type="eqf-love-line"
                                                    />
                                                </Tooltip>
                                            }
                                            <Button
                                                className={styles.useButton}
                                                onClick={() => this.checked(v)}>
                                                使用
                                            </Button>
                                        </div>
                                        <div className={styles.line}></div>
                                    </div>,
                                )}
                            </Infinite>
                            {list.length > 0 && loading && <Empty text={'加载中...'} />}
                            {list.length === 0 &&
                                <Empty text={textTile} style={{ marginTop: '30px' }} />}
                        </div>
                        <audio ref={this.audio} autoPlay loop style={{ display: 'none' }} />
                        <div className={styles.bgMusicFooter}>
                            <div className={styles.footerLeft}>
                                背景音乐：
                                {checkedMusic.name ?
                                    <div>
                                        <VolumeSlider className={styles.VolumeSlider}
                                            dynamic={activeUrl === checkedMusic.url} />
                                        <div className={styles.title}>{checkedMusic.name}</div>
                                    </div> : '无'}
                            </div>
                            {checkedMusic.name &&
                                <div className={`${styles.options} ${opened ? styles.opened : ''}`}>
                                    <Icon className={styles.menu} type="eqf-menu-p"
                                        onClick={this.open} />
                                    <div className={styles.option_modal}>
                                        {activeUrl !== checkedMusic.url
                                            ?
                                            <div
                                                onClick={() => this.playCurrent(checkedMusic.url)}>播放</div>
                                            : <div onClick={this.pause}>暂停</div>
                                        }
                                        <div onClick={this.reset}>重置</div>
                                        <div onClick={this.deleteMusic}>删除</div>
                                        <div onClick={() => eventEmitter.emit('openSoundManage')}>声音管理
                                    </div>
                                    </div>
                                </div>}
                        </div>
                    </React.Fragment>
                </ScrollContainer>
            </React.Fragment>
        );
    }
}

export default Music;
