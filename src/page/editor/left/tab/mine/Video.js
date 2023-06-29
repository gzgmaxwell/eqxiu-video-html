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
import ManageMenu from './manageMenu';
import Icon from '../../../../components/Icon';
import { userTemplateFind } from '../../../../../api/template';
import { getInfo } from '../../../../../api/user';
import VideoItem from './VideoItem';
import eventEmitter from '../../../../../services/EventListener';
import ScrollContainer from '../../../../components/scrollContainer';
import HeadAndTailList from './headAndTail';
import { CSSTransition } from 'react-transition-group';

@connect(({ editor }) => ({
    transverse: editor.transverse,
}))
class MineVideo extends React.Component {
    constructor(props) {
        super(props);
        this.prevVideo = React.createRef();
        this.state = {
            loading: true,
            list: [],
            page: 1,
            endPage: false,
            pageSize: 30,
            manage: false,
            checked: false,
            checkedList: {},
            active: 'upload',
            headTailTransverse: props.transverse,
            hoverItem: null,
        };
    }


    componentDidUpdate(prevProps, prevState) {
        if (this.prevVideo.current) {
            if (!prevState.hoverItem && this.state.hoverItem) {
                this.prevVideo.current.play();
            }
            if (prevState.hoverItem && !this.state.hoverItem) {
                this.prevVideo.current.pause();
            }
        }
    }

    componentDidMount() {
        this.getUser();
        eventEmitter.on('loadVideoLists', this.loadLists); // 重新加载
        eventEmitter.on('toggleThreeTab', this.activeTagByEvent);
    }

    componentWillUnmount() {
        this.setState = () => null;
        eventEmitter.removeListener('loadVideoLists', this.loadLists); // 重新加载
        eventEmitter.removeListener('toggleThreeTab', this.activeTagByEvent);
    }

    activeTagByEvent = (index) => {
        if (index === 2) {
            this.activeTag('headTail');
        }
    };


    getUser = () => {
        getInfo()
            .then(res => {
                const { data } = res;
                if (data.success) {
                    this.setState({
                        userId: data.obj.id,
                    });
                    this.loadLists();
                }
            });
    };
    loadLists = (page = 1) => {
        const { pageSize, list } = this.state;
        const params = {
            pageNo: page,
            pageSize,
            orderBy: 'create_time desc',
            userId: this.state.userId,
            title: '',
        };
        this.setState({ loading: true });
        userTemplateFind(params)
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
                    this.getPage1List();
                }
            })
            .catch(r => this.setState({ loading: false }));
    };
    getFirstTimer = null;
    // 获取第一页的数据
    getPage1List = () => {
        const { pageSize } = this.state;
        const params = {
            pageNo: 1,
            pageSize,
            orderBy: 'create_time desc',
            userId: this.state.userId,
            title: '',
        };
        userTemplateFind(params)
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
                    if (flag) {
                        clearTimeout(this.getFirstTimer);
                        this.getFirstTimer = setTimeout(() => {
                            this.getPage1List();
                        }, 2000);
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
    handleClick = (item) => {
        this.props.dispatch({
            type: 'workspace/insertVideo',
            payload: {
                id: item.id,
                type: CANVAS_TYPE.userVideo,
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
        }, () => {
            if (path === 'headTail') return false;
            this.loadLists();
        });
    };

    handleMouseLeave = (e) => {
        clearTimeout(this.preivewOpenDely);
        this.preivewCloseDely = setTimeout(() => this.setState({ hoverItem: null }), 300);
    };
    hoverPreivew = () => {
        clearTimeout(this.preivewCloseDely);
        this.preivewCloseDely = null;
    };
    _stopMouseEnter = false;
    stopMouseEnter = (state) => {
        this._stopMouseEnter = state;
    }
    handleMouseEnter = (e, hoverItem) => {
        if (this._stopMouseEnter) {
            clearTimeout(this.preivewOpenDely)
            return false;
        }

        if (this.preivewCloseDely) {
            this.hoverPreivew();
        }
        this.preivewOpenDely = setTimeout(() => this.setState({
            hoverItem,
        }), 300);
    };


    render() {
        const { list, endPage, loading, checked, manage, checkedList, active, headTailTransverse, hoverItem } = this.state;
        const textTile = loading ? '正在加载' : '未找到视频';
        const { resolutionW = 1, resolutionH = 1 } = hoverItem || {};
        const transverse = hoverItem ? hoverItem.resolutionW > hoverItem.resolutionH : true;
        // const manageRight = active === 'headTail' &&
        //     <div className={styles.manageRight}><span>
        //         <a className={`${headTailTransverse ? styles.active : ''}`}
        //            onClick={() => this.setState({ headTailTransverse: true })}>横板</a>丨
        //         <a className={`${!headTailTransverse ? styles.active : ''}`}
        //            onClick={() => this.setState({ headTailTransverse: false })}>竖板</a></span>
        //     </div> ||
        //     null;
        return (
            <ScrollContainer style={{ display: 'block' }}>
                <React.Fragment>
                    <ManageMenu
                        scrolling={this.props.scrolling}
                        checkedList={Object.keys(checkedList)}
                        active={active}
                        checkAll={this.checkAll}
                        activeTag={this.activeTag}
                        checked={checked}
                        manage={manage}
                        openManage={this.openManage}
                        deleteCheck={this.deleteCheck}
                        type={'video'}
                        right={null}
                    />
                    {active === 'headTail' ? <HeadAndTailList transverse={headTailTransverse} /> :
                        <div className={`${styles.decorate} scrollDiv`} id={'mine_image_container'}>
                            <Infinite
                                pageStart={0}
                                loadMore={this.loadMore}
                                hasMore={!endPage}
                                initialLoad={false}
                                threshold={400}
                                useWindow={false}
                                getScrollParent={() => document.getElementById(
                                    'mine_image_container')}>
                                {!list && <Empty text={textTile} style={{ marginTop: '30px' }} />}
                                {list.map(v =>
                                    <div key={`${v.id}${v.status}`} className={styles.singleBox}
                                        onClick={manage ? () => this.checkOne(v.id) : () => { }}
                                        onMouseEnter={(e) => this.handleMouseEnter(e, v)}
                                        onMouseLeave={this.handleMouseLeave}
                                    >
                                        <div className={styles.videoOuter}>
                                            <VideoItem
                                                {...v}
                                                afterModalHook={this.stopMouseEnter}
                                                key={`${v.id}${v.status}`}
                                                loadLists={this.loadLists}
                                                disabled={manage}
                                                insert={this.handleClick}
                                            />
                                            {manage && <div className={styles.shade} />}

                                            {checkedList[v.id] && <div className={styles.selected}>
                                                <Icon type="eqf-yes" className={styles.icon} />
                                            </div>}
                                        </div>
                                    </div>,
                                )}
                            </Infinite>
                            {list.length > 0 && loading && <Empty text={'加载中...'} />}
                            {list.length === 0 &&
                                <Empty text={textTile} style={{ marginTop: '30px' }} />}
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
                                                <div className={styles.info}>
                                                    <span className={styles.infoBefore}>
                                                        {resolutionW * resolutionH}
                                                    </span>
                                                    {hoverItem &&
                                                        moment(hoverItem.videoDuration, 'X')
                                                            .format('mm:ss')}
                                                </div>
                                            </div>
                                            <video
                                                ref={this.prevVideo}
                                                autoPlay={true}
                                                crossOrigin='Anonymous'
                                                src={hoverItem && genVideoUrl(
                                                    hoverItem.transcodeUrl
                                                    || hoverItem.templateUrl)}
                                                loop='loop' />
                                        </div>
                                    </div>
                                </CSSTransition>
                            </div>
                        </div>}
                </React.Fragment>
            </ScrollContainer>
        );
    }
}

export default MineVideo;
