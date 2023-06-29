import React from 'react';
import styles from './image.less';
import { prev, host } from 'Config/env';
import { genUrl } from 'Util/image';
import { message as antMessage } from 'antd';
import { compatibleVideo, genVideoUrl } from 'Util/file';
import { CANVAS_TYPE, SEGMENT_TYPE } from 'Config/staticParams';
import { deleteMine, getMine } from '../../../../../api/mine';
import Infinite from 'react-infinite-scroller';
import { connect } from 'dva';
import Empty from 'Components/empty';
import { limitInsert } from 'Util/data';
import ManageMenu from './manageMenu';
import Icon from '../../../../components/Icon';
import eventEmitter from '../../../../../services/EventListener';
import ScrollContainer from '../../../../components/scrollContainer';
import { getImgInfoByQiNiu } from '../../../../../api/upload';

const imitParams = {
    'upload': {
        fileType: 1,
    },
    'buy': {
        fileType: 1,
    },
    'favorite': {
        attrGroupId: 3,
        platform: 0,
    },
};

@connect()
class MineImage extends React.Component {
    constructor(props) {
        super(props);
    }

    state = {
        loading: true,
        list: [],
        page: 1,
        endPage: false,
        pageSize: 30,
        type: '893064', //tab列表 893064 推荐默认
        manage: false,
        checked: false,
        checkedList: {},
        active: 'upload',
    };

    componentDidUpdate(prevProps, prevState) {
    }

    componentDidMount() {
        this.loadLists();
        eventEmitter.on('loadImageLists', this.loadLists); //重新加载
    }

    componentWillUnmount() {
        this.setState = () => null;
    }

    loadLists = (page = 1) => {
        const { pageSize, list, active } = this.state;
        const params = {
            ...imitParams[active],
            pageNo: page,
            pageSize,
        };
        this.setState({ loading: true });
        getMine(params, page === 1)
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
    loadMore = () => {
        if (!this.loading) {
            this.loading = true;
            this.loadLists(this.state.page + 1);
        }
    };
    handleClick = async (item) => {
        const picUrl = `${host.musicFile}${item.path}`;
        const { data: { format, frameNumber } } = await getImgInfoByQiNiu(`${picUrl}?imageInfo`);
        if (~~(frameNumber) > 1) {
            antMessage.info('您插入的是gif图,正在处理');
            this.props.dispatch({
                type: 'workspace/insertGif',
                payload: {
                    url: picUrl,
                },
            });
        } else {
            this.props.dispatch({
                type: 'workspace/insertImg',
                payload: {
                    picUrl,
                },
            });
        }
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
            checked: flag
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
        deleteMine({
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

    render() {
        const { list, endPage, loading, checked, manage, checkedList, active } = this.state;
        const textTile = loading ? '正在加载' : '未找到图片';
        return (
            <ScrollContainer>
                <React.Fragment>
                    <ManageMenu
                        scrolling={this.props.scrolling}
                        checkedList={Object.keys(checkedList)}
                        checkAll={this.checkAll}
                        active={active}
                        activeTag={this.activeTag}
                        checked={checked}
                        manage={manage}
                        openManage={this.openManage}
                        deleteCheck={this.deleteCheck}
                    />
                    <div className={`${styles.decorate} scrollDiv`} id={'mine_image_container'}>
                        {this.state.type && <Infinite
                            pageStart={0}
                            loadMore={this.loadMore}
                            hasMore={!endPage}
                            initialLoad={false}
                            threshold={400}
                            useWindow={false}
                            getScrollParent={() => document.getElementById('mine_image_container')}>
                            {!list && <Empty text={textTile} style={{ marginTop: '30px' }}/>}
                            {list.map(v =>
                                <div key={v.id} className={styles.singleBox}
                                     onClick={manage ? () => this.checkOne(v.id) : () => this.handleClick(v)}>
                                    <div className={styles.videoOuter}>
                                        <img
                                            src={`${host.musicFile}${v.path}?imageMogr2/auto-orient/strip/thumbnail/124x124`}/>
                                        {manage && <div
                                            className={`${styles.selected} ${!checkedList[v.id] ? styles.defaultSelected : ''}`}>
                                            <Icon type="eqf-yes" className={styles.icon}/>
                                        </div>}
                                    </div>
                                </div>,
                            )}
                        </Infinite>
                        }
                        {list.length > 0 && loading && <Empty text={'加载中...'}/>}
                        {list.length === 0 &&
                        <Empty text={textTile} style={{ marginTop: '30px' }}/>}
                    </div>
                </React.Fragment>
            </ScrollContainer>
        );
    }
}

export default MineImage;
