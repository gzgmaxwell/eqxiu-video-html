import React from 'react';
import { connect } from 'dva';
import isEqual from 'lodash/isEqual';
import styles from './specialEffectText.less';
import Infinite from 'react-infinite-scroller';
import { LABEL_LIST, SEGMENT_TYPE, COMPONENT_TYPE } from '../../../../config/staticParams';
import { getIndex } from '../../../../api/template';
import { compatibleVideo } from '../../../../util/file';
import { genUrl } from '../../../../util/image';
import Empty from '../../../components/empty';
import Labels from '../../../components/labels/index';
import ScrollContainer from '../../../components/scrollContainer';
import OrderBy from '../orderBy';
import SupportTips from '../../../components/tips/supportTips';
import { CSSTransition } from 'react-transition-group';


/* global axios */
@connect(({ tags }) => ({
    tags,
}))
export default class SpecialEffectText extends React.Component {
    constructor(props) {
        super(props);
        this.loading = true;
        this.video = React.createRef();
        this.state = {
            activeMenu: 1,
            list: [],
            page: 1,
            pageSize: 12,
            loading: true,
            showPreivew: false, // 预览
            hoverObj: {},
            orderBy: 'create_time desc',
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (!isEqual(this.state, nextState)) {
            return true;
        }
        if (this.props.scrolling !== nextProps.scrolling) {
            return true;
        }
        return false;
    }

    componentDidMount() {
        this.loadLists(1);
    }

    componentWillUnmount() {
        this.setState = () => null;
    }

    activeMenu = (index = 1) => {
        this.setState({ activeMenu: index });
    };
    loadMore = () => {
        if (!this.loading) {
            this.loading = true;
            this.setState({ loading: true });
            this.loadLists(this.state.page + 1);
        }
    };
    /**
     * 读取列表
     */
    loadLists = (page = 1) => {
        const { pageSize, list, activeLabelIds, orderBy } = this.state;
        const params = {
            pageNo: page,
            pageSize,
            orderBy,
            transverse: true,
            templateTypes: SEGMENT_TYPE.SEGMENT_WORD,
            labelIds: activeLabelIds,
        };
        axios.all([
            getIndex(params, false),
            getIndex({
                ...params,
                labelIds: activeLabelIds,
                transverse: false,
            }, false)])
            .then(axios.spread((res1, res2) => {
                // 两个请求现在都执行完成
                const data = res1.data || {};
                const data2 = res2.data || {};
                const resList1 = data.list || [];
                const resList2 = data2.list || [];
                this.loading = false;
                if (resList1.length > 0 || resList2.length > 0) {
                    const newList = resList1.slice(0, 3)
                        .concat(resList2.slice(0, 3), resList1.slice(3, 6), resList2.slice(3, 6),
                            resList1.slice(6, 9), resList2.slice(6, 9), resList1.slice(9, 12),
                            resList2.slice(9, 12));
                    const newState = {
                        list: page > 1 ? list.concat(newList) : newList,
                        page: params.pageNo,
                    };
                    this.setState({
                        ...newState,
                        loading: false,
                        endPage: (data.map || {}).end && (data2.map || {}).end,
                    });
                } else {
                    this.setState({
                        list: page > 1 ? list : [],
                        endPage: true,
                        loading: false,
                    });
                }
            }))
            .catch();
    };
    handleClick = ({ id, type }) => {
        this.props.dispatch({
            type: 'workspace/insertVideo',
            payload: {
                id,
                type,
            },
        });
    };
    handleMouseEnter = (e, hoverObj) => {
        if (this.preivewCloseDely) {
            this.hoverPreivew();
        }
        this.preivewOpenDely = setTimeout(() => this.setState({
            showPreivew: true,
            hoverObj,
        }, () => {
            this.video.current.addEventListener('canplay', () => {
                if (this.video.current.paused) {
                    this.video.current.play()
                        .catch((err) => console.log(err));
                }
            }, { once: true })
        }), 300);
    };
    handleMouseLeave = (e) => {
        clearTimeout(this.preivewOpenDely);
        this.preivewCloseDely = setTimeout(() => {
            this.setState({
                showPreivew: false,
                hoverObj: {},
            });
        }, 300);
    };
    hoverPreivew = () => {
        clearTimeout(this.preivewCloseDely);
        this.preivewCloseDely = null;
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
        const { state: { activeLabelIds, ...state }, props: { scrolling } } = this;
        const textTile = this.state.loading ? '正在加载' : '未找到特效字';
        const { list, endPage, currentHover } = state;
        return (
            <ScrollContainer>
                <div className={styles.list}>
                    <div className={`${styles.labelWrap} ${scrolling ? 'scrollShadow' : ''}`}>
                        <Labels width={56} typeData={[LABEL_LIST.特效字风格, LABEL_LIST.特效字用途]}
                            refreshList={this.refreshList} />
                        <OrderBy changeOrderBy={this.changeOrderBy} />
                    </div>
                    <div className={`${styles.wrap} scrollDiv`} id="specialEffect__container">
                        <div className={`${styles.listMain}`}>
                            <Infinite
                                pageStart={0}
                                loadMore={this.loadMore}
                                hasMore={!endPage}
                                initialLoad={false}
                                threshold={200}
                                useWindow={false}
                                getScrollParent={() => document.getElementById(
                                    'specialEffect__container')}
                            >
                                {list && list.map((item, key) => {
                                    let style = item.transverse
                                        ? styles.horizontal
                                        : styles.vertical;
                                    const backgroundImage = currentHover === item.coverImg
                                        ? {}
                                        : {
                                            backgroundImage: `url("${genUrl(item.coverImg,
                                                '518:518')}")`,
                                        };

                                    return <div key={key}
                                        className={`${style} ${styles.backgroundImage}`}
                                        style={backgroundImage}
                                        onMouseEnter={(e) => this.handleMouseEnter(e, item)}
                                        onMouseLeave={this.handleMouseLeave}
                                        onClick={() => this.handleClick(item)}>
                                    </div>;
                                })}
                                {(!list.length || (this.state.loading && list.length)) &&
                                    <Empty text={textTile} />}
                            </Infinite>
                        </div>
                    </div>
                    <div className={styles.preivewOut}
                        onMouseLeave={this.handleMouseLeave}
                        onMouseEnter={this.hoverPreivew}
                        style={{ pointerEvents: state.showPreivew ? 'auto' : 'none' }}>
                        <CSSTransition in={state.showPreivew} timeout={300}
                            classNames='rotate-y-left'>
                            <div className={styles.preivew}>
                                <div onClick={this.onUserTemplate}
                                    className={`
                                     ${styles.content}
                                     ${state.hoverObj.transverse
                                            ? ''
                                            : styles.ver}
                                       `}>
                                    <video
                                        ref={this.video}
                                        className={styles.video}
                                        crossOrigin='Anonymous'
                                        autoPlay={true}
                                        loop='loop'
                                        muted={true}
                                        src={compatibleVideo(state.hoverObj, true)}
                                        style={{
                                            backgroundColor: state.hoverObj.bgColor || '#f0f1f8',
                                        }}
                                    />
                                </div>
                            </div>
                        </CSSTransition>
                    </div>
                </div>
            </ScrollContainer>
        );
    }
}
