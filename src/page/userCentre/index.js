import React from 'react';
import { routerRedux, Link } from 'dva/router';
import { connect } from 'dva';
import styles from './index.less';
import qs from 'qs';
import { prev, name } from 'Config/env';
import { setTitle } from 'Util/doc';
import userVideoApi from 'Api/userVideo';
import Pagination from 'Components/pagination';
import Icon from '../components/Icon';
import Card from './card.js';
import { Tooltip } from 'antd';
import { getLimt } from '../../api/userVideo';
import { getPageSize } from '../../util/doc';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { EDITOR_PRODUCT, USER_TYPE } from '../../config/staticParams';
import ChooseVideoType, { waitChooseVideoType } from '../editor/chooseVideoType';
import { hasHdRendering } from '../../util/data';
import { sendBDEvent } from '../../services/bigDataService';
import BlankCreate from './blankCreate';

const newCardType = {
    Module: 0,
    Blank: 1,
    Subtitle: 2,
    flash: EDITOR_PRODUCT.flash,
};

const tabs = [
    {
        name: '我的作品',
        stateCount: 'totalCount',
        product: '0',
        default: true,
        index: 0,
        editor: 'editor',
    },
    {
        name: '片头片尾',
        stateCount: 'headTailCount',
        product: String(EDITOR_PRODUCT.headTail),
        index: 3,
        editor: 'HTEditor',
    },
    {
        name: '字幕作品',
        stateCount: 'subTitleCount',
        product: String(EDITOR_PRODUCT.subtitles),
        index: 2,
        editor: 'subEditor/subtitles',
    },
    {
        name: '一键视频作品',
        stateCount: 'flashVideoCount',
        product: `${EDITOR_PRODUCT.flash},${EDITOR_PRODUCT.typeMonkey}`,
        index: 1,
    },
];

const pageSizeArray = {
    hoz: {
        1279: 9,
        1280: 12,
        1500: 15,
        1700: 18,
    },
};
const NewCard = ({ product = null, ...props }) => {

    const activeProduct = tabs.find(v => String(v.product) === String(product)) || {};
    const info = product !== '0' && activeProduct.name;
    const onlyOne = [
        `${EDITOR_PRODUCT.flash},${EDITOR_PRODUCT.typeMonkey}`,
        String(EDITOR_PRODUCT.subtitles)].includes(product);
    return (<div className={`${styles.newCard} index-Card`}>
        <div className={`${styles.newCardInner}  ${info ? styles.hasInfo : ''}
        ${onlyOne ? styles.onlyOne : ''}`}
             onClick={() => props.onClick(newCardType.Module)}>
            <Icon type='eqf-plus' className={styles.newCardIcon}/>
            <div className={styles.name}>{onlyOne ? '创建作品' : '模板创建'}</div>
            {info && <div className={styles.info}>{info}</div>}
        </div>
        {!onlyOne &&
        <React.Fragment>
            <div className={`${styles.blankInner} ${info ? styles.hasInfo : ''}`}
                 onClick={() => props.onClick(newCardType.Blank)}>空白创建{product !== 0 &&
            <div className={styles.info}>{activeProduct.name}</div>}</div>
            {!info && <div className={`${styles.blankInner} ${info ? styles.hasInfo : ''}`}
                           onClick={() => props.onClick(newCardType.Subtitle)}>添加字幕
            </div>}
            {!info && <div className={styles.subtitleInner}
                           onClick={() => props.onClick(newCardType.flash)}>一键视频
                <div className={styles.newTips}>新</div>
            </div>}
        </React.Fragment>}
    </div>);
};

@connect(({ tags, user }) => ({
    tags,
    user,
}))
class scene extends React.Component {

    constructor(props) {
        super(props);
        this.body = React.createRef();
    }

    state = {
        list: [],
        product: null,
        pageSize: 11,
        count: 5,
        page: 1,
        loading: false,
        remainSaveCount: 0,
        maxSaveCount: 10,
        remainRenderCount: 0,
        maxRenderCount: 10,
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        const newState = { ...prevState };
        let { search } = nextProps.location;
        search = search.replace('?', '');
        const searchObj = qs.parse(search);
        if (searchObj.page !== prevState.page) {
            newState.page = searchObj.page;
        }
        newState.product = searchObj.product ? String(searchObj.product) : '0';
        return newState;
    }


    componentDidMount() {
        setTitle('我的作品');
        this.props.dispatch({
            type: 'tags/fetch',
        });
        this.loadLimit();
        this.loadLists();
        if (window.leftSider) {
            window.leftSider.setActiveTab('我的作品');
        }
        if (name === 'pro') {
            window._hmt && window._hmt.push([`_trackPageview`, `/video/scene`]);
        }
    }


    componentDidUpdate(prevProps) {
        if (this.props.location.search !== prevProps.location.search) {
            this.loadLists();
        }
        if (window.leftSider) {
            window.leftSider.setActiveTab('我的作品');
        }
    }

    componentWillUnmount() {
        this.clearIntervalTime();
    }

    /**
     * 重定向到商店
     * @param type
     */
    onGoShop = (type) => {
        const { props: { dispatch }, state: { product } } = this;
        const isHT = String(product) === String(EDITOR_PRODUCT.headTail);
        const activeProduct = tabs.find(v => v.product === product) || tabs[0];
        switch (type) {
            case newCardType.Blank:
                waitChooseVideoType()
                    .then((res) => {
                        const url = `${prev}/${isHT ? 'HTEditor' : 'editor'}/${res}`;
                        window.open(url);
                    });
                break;
            case newCardType.Subtitle:
                sendBDEvent({
                    position: '我的作品',
                    type: '新模板卡片-添加字幕',
                });
                dispatch(routerRedux.push({
                    pathname: `${prev}/index/2`,
                }));
                break;
            case newCardType.flash:
                sendBDEvent({
                    position: '我的作品',
                    type: '新模板卡片-一键视频',
                });
                dispatch(routerRedux.push({
                    pathname: `${prev}/index/1`,
                }));
                break;
            default:
                dispatch(routerRedux.push({
                    pathname: `${prev}/index/${activeProduct.index}`,
                }));
                break;
        }
    };
    /**
     * 改变页数
     * @param page
     */
    onGoToPage = (page) => {
        const { props: { location, dispatch } } = this;
        let { search } = location;
        search = search.replace('?', '');
        const searchObj = qs.parse(search);
        searchObj.page = page;
        dispatch(routerRedux.push({
            pathname: '',
            search: qs.stringify(searchObj),
        }));
    };
    clearIntervalTime = () => {
        clearInterval(window.__render_hd_query_timer);
        window.__render_hd_query_timer = null;
    };
    /**
     * 改变loading状态的通用函数
     * @param state
     */
    changeLoading = (state) => {
        this.setState({ loading: state });
    };
    /**
     * 读取列表
     * @param jumpTop 是否跳到top（在自动刷新时 不跳）
     */
    loadLists = (jumpTop = true, reloadLimit = false) => {
        const { loading } = this.state;
        if (loading) {
            return false;
        }
        let { search } = this.props.location;
        search = search.replace('?', '');
        const searchObj = qs.parse(search);
        const params = {
            pageNo: searchObj.page || 1,
            pageSize: getPageSize(pageSizeArray, true) - 1,
            orderBy: 'update_time desc',
            products: (searchObj.product && searchObj.product !== '0') ? [searchObj.product] : null,
        };
        if (reloadLimit) {
            this.loadLimit();
        }
        this.changeLoading(true);
        userVideoApi.getIndex(params)
            .then(res => {
                this.changeLoading(false);
                const { data } = res;
                if (data.success) {
                    data.list.forEach((item, index) => {
                        data.list[index].showDownLoad = false;
                    });
                    const newState = {
                        list: data.list,
                        page: Number(data.map.pageNo),
                        count: data.map.count,
                    };
                    let hasRender = 0;
                    data.list.forEach(item => {
                        if (~~item.status === 2 || ~~item.status === 1 || hasHdRendering(item)) {
                            hasRender += 1;
                        }
                    });
                    if (hasRender && !window.__render_hd_query_timer) {
                        // 自动刷新 4秒一次
                        window.__render_hd_query_timer = setInterval(() => this.loadLists(false),
                            2000);
                    } else if (!hasRender) {
                        this.clearIntervalTime();
                    }
                    this.setState({ ...newState });
                    if (jumpTop) {
                        document.querySelector('#video-container').scrollTop = 0;
                    }
                }
            })
            .catch(err => {
                this.changeLoading(false);
            });
    };

    loadLimit = () => {
        getLimt()
            .then(res => {
                if (res.data.success) {
                    const { remainSaveCount, maxSaveCount, ...obj } = res.data.obj;
                    this.setState({
                        ...obj,
                        maxSaveCount,
                        remainSaveCount,
                        totalCount: maxSaveCount - remainSaveCount,
                    });
                }
            });
    };

    render() {
        const { state: { product, ...state }, props: { user = {}, ...props } } = this;
        const activeTab = tabs.find(v => v.product === product) || tabs[0];
        let isShowNewCard = false;
        if (state.list.length === 0) {
            if (product === '0') {
                isShowNewCard = false;
            } else {
                isShowNewCard = true;
            }
        } else {
            isShowNewCard = true;
        }
        const isShowBlankCreate = !state.loading && state.list.length === 0 && product === '0'
        return (
            <div className={styles.body} ref={this.body}>
                <div className={styles.headerTips}>
                    <div className={styles.leftTips}>
                        {tabs.map(
                            v => <Link className={`${styles.tab}
                            ${activeTab.product === v.product
                              ? styles.active
                              : ''}`}
                                       key={v.name}
                                       to={`?product=${v.product || ''}`}>
                                {v.name}({state[v.stateCount]})
                            </Link>)}
                        {
                            user.type === USER_TYPE.SHOWER &&
                            <React.Fragment>
                                <Link className={styles.tab}
                                      to={`${prev}/templateShow?tabIndex=1`}
                                >
                                    我的模板
                                </Link>
                                <Tooltip overlayClassName={styles.showTemplate}
                                         title={<div className={styles.showTemplateInfo}>
                                             <p>关于我的模板</p>
                                             <p style={{ fontSize: 12 }}>
                                                 1.已发布的作品支持“转换为模板”，支持多次转换；<br/>
                                                 2.“转换为模板”后会生成一个新的模板在“我的模板”中，<br/>
                                                 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;模板与作品无任何关联； <br/>
                                                 3.点击“我的模板”，跳转到模板申请页面
                                             </p>
                                         </div>} placement={'right'}>
                                    <Icon type='eqf-why-l'/>
                                </Tooltip>
                            </React.Fragment>
                        }
                    </div>
                    <div className={styles.rightTips}>
                    <span className={styles.remainRender}>今日剩余生成作品次数：
                    <span>{~~state.remainRenderCount}</span>
                    </span>
                    </div>
                </div>
                <TransitionGroup key={!state.list.length} className={styles.cardBox}>
                    <React.Fragment>
                        {isShowNewCard &&  <NewCard onClick={this.onGoShop} product={product}/>}
                        {state.list.map((item, index) =>
                            <CSSTransition key={`${item.id}-${[3, 0].includes(item.status)}`}
                                           timeout={300}
                                           classNames='scale'>
                                <Card {...item} key={`${item.id}-${item.status}`}
                                      refresh={this.loadLists}
                                      location={props.location}/>
                            </CSSTransition>,
                        )}
                    </React.Fragment>
                </TransitionGroup>
                {isShowBlankCreate && <BlankCreate product={product} />}
                {state.count >= state.pageSize &&
                <Pagination total={state.count}
                            pageSize={(getPageSize(pageSizeArray, true) - 1)}
                            showQuickJumper={true}
                            onChange={this.onGoToPage} current={Number(state.page || 1)}/>}
            </div>
        );
    }
}

export default scene;
