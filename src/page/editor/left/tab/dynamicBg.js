import React from 'react';
import styles from './dynamicBg.less';
import { prev } from 'Config/env';
import RecommendGoogle from '../../recommendGoogle/index';
import { isChrome } from '../../../../util/util';
import { genUrl } from '../../../../util/image';
import { compatibleVideo } from '../../../../util/file';
import { CANVAS_TYPE, LABEL_LIST, SEGMENT_TYPE } from '../../../../config/staticParams';
import { getIndex } from '../../../../api/template';
import Infinite from 'react-infinite-scroller';
import { connect } from 'dva';
import { CSSTransition } from 'react-transition-group';
import Icon from '../../../components/Icon';
import Labels from '../../../components/labels';
import ScrollContainer from '../../../components/scrollContainer';
import OrderBy from '../orderBy';

@connect(({ workspace, editor }) => {
    const { transverse } = editor;
    return {
        transverse,
        workspace,
    };
})
class DynamicBg extends React.Component {
    constructor(props) {
        super(props);
        this.video = React.createRef();
        this.isLoading = false;
        this.preivewCloseDely = null;
    }

    tabs = {
        title: '动态背景',
        labelId: 87,
    };
    state = {
        playing: false, // 正在播放
        hoverObj: {}, // 预览对象
        showPreivew: false, // 预览
        list: [],
        page: 1,
        endPage: false,
        pageSize: 30,
        activeIndex: 0,
        isLoading: true,
        orderBy: 'create_time desc',
    };

    componentDidMount() {
        this.loadLists();
    }

    componentWillUnmount() {
        this.setState = () => null;
    }

    handleMouseLeave = (e) => {
        clearTimeout(this.preivewOpenDely);
        this.preivewCloseDely = setTimeout(() => this.setState({ showPreivew: false }), 300);
    };
    hoverPreivew = () => {
        clearTimeout(this.preivewCloseDely);
        this.preivewCloseDely = null;
    };
    handleMouseEnter = (e, hoverObj) => {
        if (this.preivewCloseDely) {
            this.hoverPreivew();
        }
        this.preivewOpenDely = setTimeout(() => this.setState({
            showPreivew: true,
            hoverObj,
        }), 300);
    };
    loadLists = (page = 1) => {
        const { pageSize, list, activeIndex, activeLabelIds, orderBy } = this.state;
        const params = {
            pageNo: page,
            pageSize,
            orderBy,
            templateTypes: SEGMENT_TYPE.SEGMENT_BACKGROUND, // 装饰素材
            transverse: this.props.transverse,
            labelIds: activeLabelIds,
        };
        // 如果是覆层则加上横竖条件
        this.setState({ isLoading: true });
        getIndex(params, false)
            .then(({ data: { list: newList = [], map: { end: endPage = false } = {} } = {} }) => {
                if (newList.length > 0) {
                    const newState = {
                        list: page > 1 ? list.concat(newList) : newList,
                        page: params.pageNo,
                    };
                    this.setState({
                        ...newState,
                        endPage,
                        isLoading: false,
                    });
                } else {
                    this.setState({
                        list: page > 1 ? list : [],
                        endPage,
                        isLoading: false,
                    });
                }
            })
            .catch(r => this.setState({ isLoading: false }));
    };
    loadMore = () => {
        if (!this.state.isLoading) {
            this.loadLists(this.state.page + 1);
        }
    };
    handleClick = (e, { id }) => {
        const { dispatch, workspace: { activeIndex, dataList } } = this.props;
        const beforeHaveBg = dataList.some(v => v.type === CANVAS_TYPE.dynamicBg);
        this.props.dispatch({
            type: 'workspace/insertVideo',
            payload: {
                id,
                type: CANVAS_TYPE.dynamicBg,
                lock: true,
            },
        })
            .then(res => {
                // 如果有选中项并且之前没有背景 选中项减一
                if (activeIndex && !beforeHaveBg) {
                    dispatch({
                        type: 'workspace/changeActive',
                        payload: { index: activeIndex + 1 },
                    });
                }
            });
    };
    clearBackground = (e) => {
        const { dispatch, workspace: { activeIndex, dataList } } = this.props;
        let dynamicBgIndex = -1;
        dataList.map((item, index) => {
            if (item.type === CANVAS_TYPE.dynamicBg) {
                dynamicBgIndex = index;
            }
        });
        if (dynamicBgIndex > 0) {
            dispatch({
                type: 'workspace/deleteElement',
                payload: {
                    index: dynamicBgIndex,
                },
            })
                .then(res => {
                    // 如果有选中项 选中项减一
                    if (activeIndex) {
                        this.props.dispatch({
                            type: 'workspace/changeActive',
                            payload: { index: activeIndex - 1 },
                        });
                    }
                });
        }
    };
    tabClick = (e, activeIndex) => {
        if (this.state.activeIndex === activeIndex) return;
        this.setState({
            activeIndex,
            page: 1,
            endPage: false,
            list: [],
        }, () => this.loadLists(1));
    };
    refreshList = (data) => {
        this.setState({
            activeLabelIds: data,
            page: 0,
        }, this.loadLists);
    };

    changeOrderBy = (value) => {
        this.setState({
            orderBy: value,
        }, this.loadLists);
    };

    render() {
        const { state: { list, endPage, hoverObj, showPreivew, activeIndex, isLoading, ...state }, props: { workspace, scrolling } } = this;
        const { dataList } = workspace;
        const { transverse } = this.props;
        const verDiv = transverse ? '' : styles.verDiv;
        const textTile = (() => {
            if (endPage) {
                return '到底了';
            } else {
                return isLoading
                    ? '正在加载'
                    : '未找到背景图';
            }
        })();
        const templateIds = {};
        const data = dataList.filter(i => {
            if (i.type === CANVAS_TYPE.dynamicBg && activeIndex === 0) {
                templateIds[i.templateId] = i.uuid;
            }
            return i.type === CANVAS_TYPE.dynamicBg;
        });
        const width = 125;
        return (
            <ScrollContainer>
                <React.Fragment>
                    {!isChrome && <div><RecommendGoogle /></div>}
                    <div className={`${styles.labelsWrap} ${scrolling ? 'scrollShadow' : ''}`}>
                        <Labels width={60} typeData={[LABEL_LIST.背景风格]}
                            refreshList={this.refreshList} />
                        <OrderBy changeOrderBy={this.changeOrderBy} />
                    </div>
                    <div className={`${styles.decorate} ${verDiv}`}>
                        <div className={`${styles.listContent} scrollDiv`}
                            id='dynamicBg_container'
                            style={{ paddingLeft: transverse ? '8px' : '13px' }}
                        >
                            <Infinite
                                pageStart={0}
                                loadMore={this.loadMore}
                                hasMore={!endPage}
                                initialLoad={false}
                                threshold={250}
                                useWindow={false}
                                getScrollParent={() => document.getElementById(
                                    'dynamicBg_container')}>
                                {list && <div className={styles.singleBox}>
                                    <div className={`${styles.videoOuter} ${styles.noHover}`}
                                        onClick={this.clearBackground}>
                                        <Icon type="eqf-slash-l" className={styles.clearIcon} />
                                    </div>
                                    <div className={styles.title}>清除动态背景</div>
                                </div>}
                                {list && list.map(v =>
                                    <div key={v.id} className={styles.singleBox}>
                                        <div className={styles.videoOuter}
                                            onMouseEnter={(e) => this.handleMouseEnter(e, v)}
                                            onMouseLeave={this.handleMouseLeave}
                                            style={{
                                                backgroundImage: `url(${genUrl(v.coverImg,
                                                    '125:125')})`,
                                            }}
                                            onClick={(e) => templateIds[v.id]
                                                ? this.clearBackground(e)
                                                : this.handleClick(e, v)}>
                                            {templateIds[v.id] && <div className={styles.selected}>
                                                <Icon type="eqf-yes" className={styles.icon} />
                                            </div>}
                                        </div>
                                        <div className={styles.title}>{v.title}</div>
                                    </div>,
                                )}
                                {(list.length === 0 || this.loading) &&
                                    <div className={styles.empty}>{`---${textTile}---`}</div>}
                            </Infinite>
                        </div>
                    </div>
                    <div className={verDiv}>
                        <div className={styles.preivewOut} onMouseEnter={this.hoverPreivew}
                            onMouseLeave={this.handleMouseLeave}
                            style={{ pointerEvents: showPreivew ? 'auto' : 'none' }}>
                            <CSSTransition in={showPreivew} timeout={300}
                                classNames='rotate-y-left'>
                                <div className={styles.preivew}>
                                    <div className={styles.content}>
                                        <video
                                            poster={genUrl(hoverObj.coverImg,
                                                `${width}:${width * hoverObj.resolutionH /
                                                hoverObj.resolutionW}`)}
                                            autoPlay={true}
                                            crossOrigin='Anonymous'
                                            muted={true}
                                            src={compatibleVideo(hoverObj, true)}
                                            loop='loop' />
                                    </div>
                                </div>
                            </CSSTransition>
                        </div>
                    </div>
                </React.Fragment>
            </ScrollContainer>
        );
    }
}

export default DynamicBg;
