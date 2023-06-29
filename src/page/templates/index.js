import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'dva';
import styles from './template.less';
import HorzCardStyles from '../index/card/horzCard.less';
import VertCardStyles from '../index/card/vertCard.less';
import Classify from '../store/class';
import HorzCard from '../index/card/horzCard';
import VertCard from '../index/card/vertCard';
import qs from 'qs';
import { setTitle } from 'Util/doc';
import template from 'Api/template';
import Empty from 'Components/empty';
import Icon from 'Components/Icon';
import { getPageSize } from '../../util/doc';
import VideoDetail from '../detail';
import Modal from '../components/modal';
import { name, prev } from '../../config/env';
import Infinite from 'react-infinite-scroller';
import Autoresponsive from 'autoresponsive-react';
import { sendBDPage } from '../../services/bigDataService';

const pageSizeArray = {
    hoz: {
        1279: 9,
        1500: 12,
        1700: 15,
    },
    ver: {
        1279: 9,
        1280: 12,
        1500: 15,
        1700: 18,
    },
};

export const sortArray = [
    {
        name: '排序',
        path: null,
        id: null,
        required: false,
        params: '',
        paramsname: 'sort',
        children: [
            {
                name: '综合排序',
                params: 'weight_score desc,create_time desc',
                default: true,
            },
            {
                name: '最新',
                params: 'create_time desc',
            },
            {
                name: '最热',
                params: 'use_quantity desc',
            },
        ],
    },
];

@connect(({ tags, user }) => ({
    tags,
    user,
}))
class Index extends React.PureComponent {
    constructor(props) {
        super(props);
        this.loading = false;
        this.pageRequest = false;
        this.page = 0;
        this.state = {
            list: [],
            isHorz: '',
            pageSize: getPageSize(pageSizeArray, 'hoz'),
            count: 25,
            page: 1,
            loading: false,
            openModal: false,
            detailId: null,
            endPage: false,
        };
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        const newState = { ...prevState };
        let { search } = nextProps.location;
        search = search.replace('?', '');
        const searchObj = qs.parse(search);
        // 更新横纵
        if ((searchObj.hoz || '') !== prevState.isHorz) {
            newState.isHorz = !searchObj.hoz ? '' : (searchObj.hoz || 'hoz');
            newState.pageSize = getPageSize(pageSizeArray, newState.isHorz === 'hoz');
            newState.list = [];
            newState.page = 1;
            newState.loading = true;
            newState.endPage = false;
        }
        return newState;
    }

    componentDidMount() {
        window.addEventListener('resize', this.resizeWindow, false);
        setTitle('模板商城');
        sendBDPage();
        this.loadMore();
        // 视频首页流量统计
        if (name === 'pro') {
            window._hmt && window._hmt.push([`_trackPageview`, `/video/index`]);
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (window.leftSider) {
            try {
                window.leftSider.setActiveTab('创意模板');
            } catch (e) {
                console.log(e);
            }
        }
        if (this.props.location.search !== prevProps.location.search) {
            this.page = 0;
            this.setState({ list: [] });
            this.loadMore();
        }
    }

    componentWillUnmount() {
        this.pageRequest = null;
        this.page = 0;
        window.removeEventListener('resize', this.resizeWindow);
    };

    openDetail = (id) => {
        this.setState({
            openModal: true,
            detailId: id,
        });
    };
    onClose = (f = () => {
    }) => {
        setTitle('模板商城');
        if (typeof f === 'function') {
            this.setState({
                openModal: false,
                detailId: null,
            }, f);
        } else {
            this.setState({
                openModal: false,
                detailId: null,
            });
        }
    };
    onChose = (e, videoWorksId) => {
        const { state: { detailId }, props: { dispatch } } = this;
        if (!videoWorksId) {
            this.onClose(() => {
                window.open(`${prev}/editor/${detailId}`);
            });
        } else {
            this.onClose(() => {
                window.open(`${prev}/editor/${videoWorksId}?workTpl=${detailId}`);
            });
        }
    };
    loadMore = () => {
        if (!this.loading) {
            this.loading = true;
            this.page += 1;
            this.loadLists(this.page);
        }
    };
    /**
     * 读取列表
     */
    loadLists = async (page = 1) => {
        let { search } = this.props.location;
        const { pageSize, isHorz } = this.state;
        this.setState({
            loading: true,
        });
        search = search.replace('?', '');
        const searchObj = qs.parse(search);
        const params = {
            pageNo: Math.max(page || searchObj.page || 1, 1),
            pageSize,
            orderBy: searchObj.sort || 'weight_score desc,create_time desc',
            labelIds: [...(searchObj.tag || []), 1135],
            transverse: !isHorz ? null : isHorz === 'hoz',
            videoDuration: searchObj.timelong,
            key: searchObj.key || null,
            showPv: true,
        };
        if (this.pageRequest) {
            console.log('有请求正在请求');
            console.log(await this.pageRequest);
        }
        this.pageRequest = template.getIndex(params, false)
            .then(res => {
                this.pageRequest = null;
                const { data } = res;
                if (data.success) {
                    const resList = data.list;
                    if (resList) {
                        const newState = {
                            list: page > 1
                                ? Array.from(new Set(this.state.list.concat(resList)))
                                : resList,
                            count: data.map.count,
                            endPage: data.map.end,
                            redirect: '',
                        };
                        this.setState({
                            ...newState,
                            loading: false,
                        }, () => {
                            this.loading = false;
                        });
                    }
                } else {
                    this.loading = false;
                }
            })
            .catch(e => {
                this.pageRequest = null;
                this.loading = false;
            });
    };

    getAutoResponsiveProps() {
        let containerWidth = this.state.containerWidth || document.body.clientWidth - 287;
        let itemMargin = 20;
        const floor = Math.floor(containerWidth / 285);
        if (floor > 2) {
            itemMargin = Math.floor((containerWidth - floor * 285) / (floor - 1));
            containerWidth = containerWidth + 200; // 预留足够的宽度，防止由于精度问题导致的换行
        }
        return {
            itemMargin,
            itemClassName: 'item',
            containerWidth,
            gridWidth: 5,
            transitionDuration: '.5',
        };
    }

    resizeWindow = () => {
        this.setState({
            containerWidth: document.body.clientWidth - 287,
        });
    };
    openNewTab = (oriTemplateId) => {
        const { isHorz } = this.state;
        if (isHorz) {
            oriTemplateId = isHorz === 'hoz' ? 1 : 2;
        }
        window.open(`${prev}/editor/${oriTemplateId}`);
    };

    render() {
        const { state, props } = this;
        const { isHorz, list } = state;
        const horzStyle = !isHorz || isHorz === 'hoz';
        const className = horzStyle ? HorzCardStyles.Card : VertCardStyles.Card;
        return (
            <React.Fragment>
                <Infinite
                    pageStart={0}
                    loadMore={this.loadMore}
                    hasMore={!state.endPage}
                    initialLoad={false}
                    threshold={500}
                    useWindow={false}
                    getScrollParent={() => document.getElementById('video-container')}

                >
                    <Classify location={props.location} sort={sortArray}/>
                    <div className={styles.cardBox}>
                        <Autoresponsive {...this.getAutoResponsiveProps()}>
                            {isHorz ? <div style={{
                                width: 285,
                                height: horzStyle ? 262 : 609,
                            }}>
                                <div
                                    className={`${className} ${styles.blankCard} index-Card scale-enter-done`}
                                    id='empty_create'
                                    onClick={this.openNewTab}>
                                    <Icon type='eqf-plus' className={styles.newCardIcon}/>
                                    <div>空白创建</div>
                                </div>
                            </div> : <div style={{
                                width: 285,
                                height: 262,
                            }} id='empty_create'>
                                <div
                                    className={`${styles.mode} ${styles.blankCard} index-Card scale-enter-done`}
                                    onClick={() => this.openNewTab(2)}>
                                    <div className={styles.ver}>
                                        <Icon type="eqf-plus"/>
                                    </div>
                                    <div className={styles.right}>
                                        <div className={styles.title}>空白创建</div>
                                        <div className={styles.desc}>竖板视频 9:16</div>
                                    </div>
                                </div>
                                <div
                                    className={`${styles.mode} ${styles.blankCard} index-Card scale-enter-done`}
                                    onClick={() => this.openNewTab(1)}>
                                    <div className={styles.hoz}>
                                        <Icon type="eqf-plus"/>
                                    </div>
                                    <div className={styles.right}>
                                        <div className={styles.title}>空白创建</div>
                                        <div className={styles.desc}>横板视频 16:9</div>
                                    </div>
                                </div>
                            </div>}
                            {list.map(item => {
                                    const Card = item.transverse ? HorzCard : VertCard;
                                    return (<div key={item.id + '-div'} style={{
                                        width: 285,
                                        height: item.transverse ? 262 : 609,
                                    }}>
                                        <Card {...item} key={item.id} onChose={this.openDetail}/>
                                    </div>);
                                },
                            )}
                        </Autoresponsive>
                    </div>
                    <div className={`${styles.onEnded} ${state.endPage ? '' : styles.hidden}`}>
                        <span>——————到底了——————</span>
                    </div>
                </Infinite>
                {(state.list.length === 0 || state.loading) && <Empty
                    style={{
                        width: 338,
                        height: 400,
                        margin: 'auto',
                    }}
                    text={state.loading && '读取中...'}
                />}
                <Modal visible={state.openModal} onCancel={this.onClose} header={'详情'}>
                    <VideoDetail id={state.detailId} onChose={this.onChose}/>
                </Modal>
            </React.Fragment>
        );
    }
}

export default Index;
