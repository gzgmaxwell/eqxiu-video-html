import React from 'react';
import styles from './dynamicGif.less';
import { prev } from 'Config/env';
import RecommendGoogle from '../../recommendGoogle/index';
import { isChrome } from '../../../../util/util';
import { genUrl } from '../../../../util/image';
import { compatibleVideo } from '../../../../util/file';
import { CANVAS_TYPE, SEGMENT_TYPE } from '../../../../config/staticParams';
import { getIndex } from '../../../../api/template';
import Infinite from 'react-infinite-scroller';
import { connect } from 'dva';
import Empty from '../../../components/empty';
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

    /*tabs = [
        {
            title: '覆层',
            type: SEGMENT_TYPE.SEGMENT_COATING,
        },
        {
            title: '元素',
            type: SEGMENT_TYPE.SEGMENT_ORNAMENT,
        },
    ];*/

    state = {
        playing: false, // 正在播放
        hoverObj: {}, // 预览对象
        showPreivew: false, // 预览
        list: [],
        page: 1,
        endPage: false,
        pageSize: 30,
        activeIndex: 1,
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
        const { pageSize, list, activeIndex, orderBy } = this.state;
        // const tab = this.tabs[activeIndex] || {};
        const params = {
            pageNo: page,
            pageSize,
            orderBy,
            templateTypes: SEGMENT_TYPE.SEGMENT_ORNAMENT, // 动态元素
        };
        // 如果是覆层则加上横竖条件
        // (tab.title === '覆层') params.transverse = this.props.transverse;
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
                lock: this.state.activeIndex === 0,
                type: this.state.activeIndex === 0 ? CANVAS_TYPE.clad : CANVAS_TYPE.ornament,
            },
        });
    };

    /*tabClick = (e, activeIndex) => {
        if (this.state.activeIndex === activeIndex) return;
        this.setState({
            activeIndex,
            page: 1,
            endPage: false,
            list: [],
        }, () => this.loadLists(1));
    };
*/
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
        const { props: { dataList, scrolling }, state: { list, endPage, hoverObj, showPreivew, activeIndex, ...state } } = this;
        const templateIds = {};
        const data = dataList.filter(i => {
            if (i.type === CANVAS_TYPE.clad && activeIndex === 0) {
                templateIds[i.templateId] = {
                    uuid: i.uuid,
                    title: i.title || list &&
                        (list.find(v => v.id === i.templateId) || { title: '覆层' }).title,
                };
            }
            return i.type === CANVAS_TYPE.clad;
        });
        const textTile = this.state.isLoading ? '正在加载' : '未找到装饰图';
        return (
            <ScrollContainer>
                <React.Fragment>
                    {!isChrome && <div><RecommendGoogle/></div>}
                    <div className={styles.decorate}>
                        <div className={`${styles.labelsWrap} ${scrolling ? 'scrollShadow' : ''}`}>
                            <OrderBy changeOrderBy={this.changeOrderBy}/>
                        </div>
                        <div className={`${styles.listContent} scrollDiv`}
                             id='dynamicGif_container'>
                            <Infinite
                                pageStart={0}
                                loadMore={this.loadMore}
                                hasMore={!endPage}
                                initialLoad={false}
                                threshold={400}
                                useWindow={false}
                                getScrollParent={() => document.getElementById(
                                    'dynamicGif_container')}>
                                {(list.length !== 0 && !this.loading && activeIndex === 0) &&
                                <div className={styles.coating}>
                                    <div className={styles.coating__top}>
                                        {data.map(item => {
                                            return <div className={styles.item} key={item.uuid}>
                                                <Icon type="eqf-minus-f" className={styles.icon}
                                                      onClick={() => this.clearClad(item.uuid)}/>
                                                {item.title || templateIds[item.templateId].title}
                                            </div>;
                                        })}
                                    </div>
                                    <div className={styles.coating__bottom}
                                         onClick={() => this.clearClad()}>清除所有覆层
                                    </div>
                                </div>}
                                {list && list.map(v =>
                                    <div key={v.id} className={[
                                        styles.singleBox,
                                        templateIds[v.id] ? styles.selectedBox : ''].join(' ')}>
                                        <div className={styles.videoOuter}
                                             onMouseEnter={(e) => this.handleMouseEnter(e, v)}
                                             onMouseLeave={this.handleMouseLeave}
                                             style={{
                                                 backgroundImage: `url(${genUrl(v.coverImg,
                                                     '125:125')})`,
                                                 backgroundColor: '#000',
                                             }}
                                             onClick={(e) => templateIds[v.id] ? this.clearClad(
                                                 templateIds[v.id].uuid) : this.handleClick(e, v)}>
                                            {templateIds[v.id] && <div className={styles.selected}>
                                                <Icon type="eqf-yes" className={styles.icon}/>
                                            </div>}
                                        </div>
                                        <div className={styles.title}>{v.title}</div>
                                    </div>,
                                )}
                                {(list.length === 0 || this.loading) &&
                                <Empty text={textTile} style={{ marginTop: '30px' }}/>}
                            </Infinite>
                        </div>
                    </div>
                    <div className={styles.preivewOut} onMouseEnter={this.hoverPreivew}
                         onMouseLeave={this.handleMouseLeave}
                         style={{ pointerEvents: showPreivew ? 'auto' : 'none' }}>
                        <CSSTransition in={showPreivew} timeout={300} classNames='rotate-y-left'>
                            <div className={styles.preivew}>
                                <div className={styles.content}>
                                    <video
                                        autoPlay={true}
                                        crossOrigin='Anonymous'
                                        muted={true}
                                        src={compatibleVideo(hoverObj, true)}
                                        style={{ backgroundColor: hoverObj.bgColor || '#000' }}
                                        loop='loop'/>
                                </div>
                            </div>
                        </CSSTransition>
                    </div>
                </React.Fragment>
            </ScrollContainer>
        );
    }
}

export default Decorate;
