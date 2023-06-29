import React from 'react';
import styles from './paster.less';
import { prev, host } from 'Config/env';
import RecommendGoogle from '../../recommendGoogle/index';
import { isChrome } from '../../../../util/util';
import { genUrl } from '../../../../util/image';
import { compatibleVideo, genVideoUrl } from '../../../../util/file';
import { CANVAS_TYPE, SEGMENT_TYPE } from '../../../../config/staticParams';
import { getListProdByParam } from '../../../../api/user';
import Infinite from 'react-infinite-scroller';
import { connect } from 'dva';
import Empty from '../../../components/empty';
import Autoresponsive from 'autoresponsive-react';
import { CSSTransition } from 'react-transition-group';
import Icon from '../../../components/Icon';
import { limitInsert } from '../../../../util/data';
import ScrollContainer from '../../../components/scrollContainer';


@connect(({ workspace }) => ({ workspace }))
class Gif extends React.Component {

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
        labels: [
            {
                id: 893065,
                name: '边框',
            }, {
                id: 893073,
                name: '文字',
            }, {
                id: 893074,
                name: '图标',
            }, {
                id: 893075,
                name: '手绘',
            }, {
                id: 893076,
                name: '节日',
            }, {
                id: 893077,
                name: '商业',
            }], // 标签
        list: [],
        page: 1,
        endPage: false,
        pageSize: 30,
        type: 893582, // '893571', //tab列表 893064 推荐默认
        slider: false, // 更多展开和收起
        height: 0,// 展开的高度
    };


    componentDidUpdate(prevProps, prevState) {
    }

    componentDidMount() {
        this.loadLists();
    }

    componentWillUnmount() {
        this.setState = () => null;
    }

    loadLists = (page = 1) => {
        const { pageSize, list } = this.state;
        const params = {
            category: this.state.type,
            sortBy: 'sort',
            priceFloor: -1,
            priceCeiling: -1,
            pageNo: page,
            pageSize,
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
    handleClick = (e, item) => {
        if (limitInsert(this.props.workspace.dataList, CANVAS_TYPE.img) === false) return;
        const picUrl = `${host.font2}${item.path}`;
        this.props.dispatch({
            type: 'workspace/insertGif',
            payload: {
                url: picUrl,
            },
        });
    };

    tabClick = (value) => {
        this.setState({
            type: value,
            endPage: false,
            list: [],
            page: 0,
        }, () => this.loadLists());
    };
    mouseEnter = () => {
        this.setState({
            slider: true,
            height: Math.ceil(this.state.labels.length / 3) * 40,
        });
    };
    mouseLeave = () => {
        this.setState({
            slider: false,
            height: 0,
        });
    };

    render() {
        const { state, state: { list, endPage, loading } } = this;
        const textTile = this.state.loading ? '正在加载' : '未找到Gif图';
        return (
            <ScrollContainer>
                <React.Fragment>
                    {!isChrome && <div><RecommendGoogle/></div>}
                    <div className={`${styles.decorate} scrollDiv`} id={'gif_container'}>
                        {this.state.type && <Infinite
                            pageStart={0}
                            loadMore={this.loadMore}
                            hasMore={!endPage}
                            initialLoad={false}
                            threshold={400}
                            useWindow={false}
                            getScrollParent={() => document.getElementById('gif_container')}>
                            {list.length === 0 &&
                            <Empty text={textTile} style={{ marginTop: '30px' }}/>}
                            {list.map(v =>
                                <div key={v.id} className={styles.singleBox}
                                     onClick={(e) => this.handleClick(e, v)}>
                                    <div className={styles.videoOuter}>
                                        <img src={`${host.font2}${v.path}`}/>
                                    </div>
                                </div>,
                            )}
                        </Infinite>
                        }
                    </div>
                </React.Fragment>
            </ScrollContainer>
        );
    }
}

export default Gif;
