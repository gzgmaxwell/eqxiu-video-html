import React from 'react';
import styles from './decorate.less';
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
import ScrollContainer from '../../../components/scrollContainer';
import OrderBy from '../orderBy';

@connect(({ workspace, editor }) => {
    const { dataList } = workspace;
    const { transverse } = editor;
    return {
        dataList,
        transverse,
    };
})
class Decorate extends React.Component {
    constructor(props) {
        super(props);
        this.video = React.createRef();
        this.isLoading = false;
        this.preivewCloseDely = null;
    }

    tab = {
        title: '覆层',
        type: SEGMENT_TYPE.SEGMENT_COATING,
    };
    state = {
        hoverObj: {}, // 预览对象
        showPreivew: false, // 预览
        list: [],
        page: 1,
        endPage: false,
        pageSize: 30,
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
        const { pageSize, list, orderBy } = this.state;
        const params = {
            pageNo: page,
            pageSize,
            orderBy,
            templateTypes: SEGMENT_TYPE.SEGMENT_COATING, // 覆层素材
            transverse: this.props.transverse,
        };
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
    handleClick = (e, { id, title }) => {
        this.props.dispatch({
            type: 'workspace/insertVideo',
            payload: {
                id,
                title,
                lock: true,
                type: CANVAS_TYPE.clad,
            },
        });
    };
    clearClad = (uuid) => {
        this.props.dispatch({
            type: 'workspace/clearClad',
            payload: uuid,
        });
    };

    changeOrderBy = (value) => {
        this.setState({
            orderBy: value,
        }, this.loadLists);
    };

    render() {
        const {
            state: { list, endPage, hoverObj, showPreivew, activeIndex, isLoading, ...state },
            props: { dataList, transverse, scrolling },
        } = this;
        const verDiv = transverse ? '' : styles.verDiv;
        const textTile = (() => {
            if (endPage) {
                return '到底了';
            } else {
                return isLoading
                    ? '正在加载'
                    : '未找到覆层';
            }
        })();
        const templateIds = {};
        const data = dataList.filter(i => {
            if (i.type === CANVAS_TYPE.clad) {
                templateIds[i.templateId] = {
                    uuid: i.uuid,
                    title: i.title || list &&
                        (list.find(v => v.id === i.templateId) || { title: '覆层' }).title,
                };
            }
            return i.type === CANVAS_TYPE.clad;
        }) || [];
        const width = 125;
        return (
            <ScrollContainer>
                <React.Fragment>
                    {!isChrome && <div><RecommendGoogle /></div>}
                    <div className={`${styles.labelsWrap} ${scrolling ? 'scrollShadow' : ''}`}>
                        <div style={{ height: '40px' }} />
                        <OrderBy changeOrderBy={this.changeOrderBy} />
                    </div>
                    <div className={`${styles.decorate} ${verDiv}`}>
                        <div className={`${styles.listContent} scrollDiv`}
                            id='decorate_container'
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
                                    'decorate_container')}>
                                {list && <div className={styles.singleBox}>
                                    <div className={styles.initVideoOuter}>
                                        {data.length > 0 ?
                                            <div className={styles.iconsContainer}>
                                                {data.map(item => {
                                                    return <div className={styles.item}
                                                        key={item.uuid}>
                                                        <Icon type="eqf-minus-l"
                                                            className={styles.icon}
                                                            onClick={() => this.clearClad(
                                                                item.uuid)} />
                                                        {item.title ||
                                                            templateIds[item.templateId].title}
                                                    </div>;
                                                })}
                                            </div>
                                            : <Icon type="eqf-slash-l"
                                                className={styles.clearIcon} />}
                                    </div>
                                    <div className={data.length > 0
                                        ? styles.coating__title
                                        : styles.title}
                                        onClick={() => this.clearClad()}
                                    >清除所有覆层
                                    </div>
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
                                            onClick={(e) => templateIds[v.id] ? this.clearClad(
                                                templateIds[v.id].uuid) : this.handleClick(e, v)}>
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
                                    <div className={styles.content}
                                        style={{ backgroundColor: hoverObj.bgColor || '#000' }}
                                    >
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

export default Decorate;
