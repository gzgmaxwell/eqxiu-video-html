import React from 'react';
import styles from './video.less';
import { prev, host } from 'Config/env';
import { genUrl } from 'Util/image';
import { compatibleVideo, genVideoUrl } from 'Util/file';
import { CANVAS_TYPE, SEGMENT_TYPE } from 'Config/staticParams';
import { deleteMineVideo } from '../../../../../api/mine';
import Infinite from 'react-infinite-scroller';
import { connect } from 'dva';
import Empty from 'Components/empty';
import Icon from '../../../../components/Icon';
import eventEmitter from '../../../../../services/EventListener';
import Button from '../../../../components/Button';
import { CSSTransition } from 'react-transition-group';
import { getHeadTail } from '../../../../../api/userVideo';
import { waitChoseModel } from '../../../../components/delete';

@connect(({ headAndTail }) => ({ headAndTail }))
class HeadAndTailList extends React.Component {
    constructor(props) {
        super(props);
        this.preivewCloseDely = null; // 预览弹窗关闭延时
        this.prevVideo = React.createRef();
    }

    state = {
        loading: true,
        list: [],
        page: 1,
        endPage: false,
        pageSize: 30,
        manage: false,
        checked: false,
        checkedList: {},
        hoverItem: null,
    };

    componentDidUpdate(prevProps, prevState) {
        if (this.props.transverse !== prevProps.transverse) {
            this.setState({
                list: [],
                page: 1,
                endPage: false,
            });
            this.loadLists(1);
        }
    }

    componentDidMount() {
        this.loadLists();
        eventEmitter.on('loadVideoLists', this.loadLists); // 重新加载
    }

    componentWillUpdate(prevProps, preState) {
        if (preState.hoverItem !== this.state.hoverItem) {
            this.prevVideo.current.pause();
        }
    }

    componentWillUnmount() {
        this.setState = () => null;
    }

    loadLists = (page = 1) => {
        const { transverse } = this.props;
        const { pageSize, list } = this.state;
        const params = {
            pageNo: page,
            pageSize,
            orderBy: 'create_time desc',
            transverse,
        };
        this.setState({ loading: true });
        getHeadTail(params)
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
                            redirect: '',
                        };
                        this.setState({
                            ...newState,
                            loading: false,
                        });
                    } else {
                        this.setState({
                            list: page > 1 ? list : [],
                            loading: false,
                            endPage: true,
                        });
                    }
                }
            })
            .catch(r => this.setState({ loading: false }));
    };
    // 获取第一页的数据
    getPage1List = () => {
        const { transverse } = this.props;
        const { pageSize } = this.state;
        const params = {
            pageNo: 1,
            pageSize,
            orderBy: 'create_time desc',
            transverse,
        };
        getHeadTail(params)
            .then(res => {
                const { data } = res;
                if (data.success) {
                    let flag = false;
                    const resList = data.list;
                    if (resList && resList.length > 0) {
                        let newList = this.state.list;
                        resList.forEach(item => {
                            flag = item.status === 1 || flag;
                            newList = newList.map(value => {
                                if (value.id === item.id && value.status === 1 && item.status !==
                                    1) {
                                    return item;
                                }
                                return value;
                            });
                        });
                        this.setState({ list: newList });
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
    onChange = async (e, type = 'head', item) => {
        const { props: { headAndTail, dispatch } } = this;
        if (headAndTail[type] && headAndTail[type].uuid) {
            const result = await waitChoseModel({
                type: 'eqf-why-f',
                text: `当前作品已经设置了${type === 'head' ? '片头' : '片尾'}，确定替换吗？`,
            })
                .then(res => true)
                .catch(res => false);
            if (!result) {
                return false;
            }
        }
        dispatch({
            type: 'headAndTail/change',
            payload: {
                item,
                type,
            },
        });
    };
    checkAll = (flag) => {
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
            checked: flag,
        });
    };
    openManage = (flag) => {
        this.setState({
            manage: flag,
            checked: false,
            checkedList: {},
        });
    };
    checkOne = (id) => {
        const { list, checkedList } = this.state;
        if (checkedList[id]) {
            delete checkedList[id];
        } else {
            checkedList[id] = true;
        }
        this.setState({
            checkedList,
            checked: list.length === Object.keys(checkedList).length,
        });
    };
    deleteCheck = () => {
        const { checkedList } = this.state;
        deleteMineVideo({
            ids: Object.keys(checkedList),
        })
            .then(() => {
                this.setState({
                    checked: false,
                    checkedList: {},
                    loading: false,
                    list: [],
                    endPage: true,
                }, this.loadLists);
            });
    };
    activeTag = (path) => {
        this.setState({
            active: path,
            pageNo: 1,
            loading: false,
            list: [],
            endPage: true,
        }, this.loadLists);
    };

    goMakeHT = () => {
        const { transverse } = this.props;
        window.open(`${prev}/index/3?hoz=${transverse ? 'hoz' : 'ver'}`);
        waitChoseModel({
            text: '请您在新打开的页面完成片头片尾制作',
            info: '制作完成前请不要关闭此窗口',
            sureBtn: '已完成',
        })
            .then((res) => this.loadLists(1))
            .catch(() => false);
    };

    overMakeHT = () => {
        this.loadLists();
        this.setState({ goMaking: false });
    };

    handleMouseLeave = (e) => {
        clearTimeout(this.preivewOpenDely);
        this.preivewCloseDely = setTimeout(() => this.setState({ hoverItem: null }), 300);
    };
    hoverPreivew = () => {
        clearTimeout(this.preivewCloseDely);
        this.preivewCloseDely = null;
    };
    handleMouseEnter = (e, hoverItem) => {
        if (this.preivewCloseDely) {
            this.hoverPreivew();
        }
        this.preivewOpenDely = setTimeout(() => this.setState({
            hoverItem,
        }), 300);
    };


    render() {
        const { transverse } = this.props;
        const { list, endPage, loading, checked, manage, checkedList, hoverItem } = this.state;
        const textTile = loading ? '正在加载' : <span className={styles.noHT}>暂无片头片尾作品</span>;
        return (
            <div className={`${styles.decorate} ${styles.HTbody} scrollDiv`}
                 id={'mine_image_container'}>
                <Infinite
                    pageStart={0}
                    loadMore={this.loadMore}
                    hasMore={!endPage}
                    initialLoad={false}
                    threshold={400}
                    useWindow={false}
                    getScrollParent={() => document.getElementById('mine_image_container')}>
                    {!list && <Empty text={textTile} style={{ marginTop: '30px' }}/>}
                    {list.map(v => {
                            const timeLong = moment(v.videoDuration, 'X')
                                .format('mm:ss');
                            return (<div key={`${v.id}${v.status}`} className={styles.singleBox}
                                         onMouseEnter={(e) => this.handleMouseEnter(e, v)}
                                         onMouseLeave={this.handleMouseLeave}
                            >
                                <div className={`${transverse
                                                   ? styles.videoOuterHoz
                                                   : styles.videoOuterVer} ${styles.item}`}>
                                    <div className={styles.coverImg}>< img
                                        src={genUrl(v.coverImg, '124:142')}/></div>
                                    <div className={styles.videoBaseInfo}>
                                        <div className={styles.title}>{v.title}</div>
                                        <div className={styles.info}>{timeLong}
                                        </div>
                                    </div>
                                    <div className={styles.hoverButton}>
                                        <Button
                                            onClick={(e) => this.onChange(e, 'head', v)}>设为片头</Button>
                                        <Button
                                            onClick={(e) => this.onChange(e, 'tail', v)}>设为片尾</Button>
                                    </div>
                                    {manage && <div className={styles.shade}/>}

                                    {checkedList[v.id] && <div className={styles.selected}>
                                        <Icon type="eqf-yes" className={styles.icon}/>
                                    </div>}
                                </div>
                            </div>);
                        }
                        ,
                    )}
                </Infinite>
                {list.length > 0 && loading && <Empty text={'加载中...'}/>}
                {list.length === 0 &&
                <div>
                    <Empty text={textTile} style={{ marginTop: '30px' }}/>
                    <Button className={styles.goMakeHT} onClick={this.goMakeHT}>去制作</Button>
                </div>
                }
                <div className={`${styles.preivewOut} ${transverse ? '' : styles.ver}`}
                     onMouseEnter={this.hoverPreivew}
                     onMouseLeave={this.handleMouseLeave}
                     style={{ pointerEvents: hoverItem ? 'auto' : 'none' }}>
                    <CSSTransition in={hoverItem !== null} timeout={300}
                                   classNames='rotate-y-left'>
                        <div className={styles.preivew}>
                            <div className={styles.content}>
                                <div className={styles.videoBaseInfo}>
                                    <div className={styles.title}>{hoverItem &&
                                    hoverItem.title}</div>
                                    <div className={styles.info}>{hoverItem &&
                                    moment(hoverItem.videoDuration, 'X')
                                        .format('mm:ss')}
                                    </div>
                                </div>
                                <video
                                    ref={this.prevVideo}
                                    autoPlay={true}
                                    crossOrigin='Anonymous'
                                    src={hoverItem && compatibleVideo(hoverItem, true)}
                                    loop='loop'/>
                            </div>
                        </div>
                    </CSSTransition>
                </div>
            </div>
        );
    }
}

export default HeadAndTailList;
