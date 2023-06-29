import React from 'react';
import styles from './effectsPicture.less';
import { prev } from 'Config/env';
import { genUrl } from '../../../../util/image';
import { compatibleVideo, genVideoUrl } from '../../../../util/file';
import { CANVAS_TYPE, LABEL_LIST, SEGMENT_TYPE } from '../../../../config/staticParams';
import { getIndex } from '../../../../api/template';
import Infinite from 'react-infinite-scroller';
import { connect } from 'dva';
import Empty from '../../../components/empty';
import Labels from '../../../components/labels';
import { CSSTransition } from 'react-transition-group';
import ScrollContainer from '../../../components/scrollContainer';
import OrderBy from '../orderBy';

@connect()
class EffectsPicture extends React.Component {
    constructor(props) {
        super(props);
        this.preivewCloseDely = null;
        this.state = {
            playing: false, // 正在播放
            list: [],
            page: 1,
            endPage: false,
            pageSize: 30,
            showPreivew: false, // 预览
            hoverObj: {}, // 预览对象
            orderBy: 'create_time desc',
        };
    }

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
        const { pageSize, list, activeLabelIds, orderBy } = this.state;
        const params = {
            pageNo: page,
            pageSize,
            orderBy,
            templateTypes: SEGMENT_TYPE.SEGMENT_IMAGE,
            labelIds: activeLabelIds,
        };
        getIndex(params, false)
            .then(({ data: { list: newList = [], map: { end: endPage = true } = {} } = {} }) => {
                this.loading = false;
                if (newList.length > 0) {
                    const newState = {
                        list: page > 1 ? list.concat(newList) : newList,
                        page: params.pageNo,
                    };
                    this.setState({
                        ...newState,
                        endPage,
                    });
                } else {
                    this.setState({
                        list: page > 1 ? list : [],
                        endPage,
                    });
                }
            })
            .catch(r => this.loading = false);
    };
    loadMore = () => {
        if (!this.loading) {
            this.loading = true;
            this.loadLists(this.state.page + 1);
        }
    };
    /**
     * 点击事件
     * @param e
     * @param id
     */
    handleClick = (e, { id }) => {
        this.props.dispatch({
            type: 'workspace/insertVideo',
            payload: {
                id,
                type: CANVAS_TYPE.spacialImg,
            },
        });
    };
    refreshList = (data) => {
        this.setState({
            activeLabelIds: [...data],
            page: 0,
        }, this.loadLists);
    };
    onUserTemplate = () => {
        this.props.dispatch({
            type: 'workspace/insertVideo',
            payload: {
                id: this.state.hoverObj.id,
                type: 1,
            },
        });
    };

    changeOrderBy = (value) => {
        this.setState({
            orderBy: value,
        }, this.loadLists);
    };

    render() {
        const { state: { list, endPage }, state } = this;
        const { scrolling } = this.props;
        const textTile = this.state.isLoading ? '正在加载' : '未找到特效图';
        return (
            <ScrollContainer>
                <React.Fragment>
                    <div className={styles.body}>
                        <div className={`${styles.labelsWrap} ${scrolling ? 'scrollShadow' : ''}`}>
                            <Labels width={80} typeData={[LABEL_LIST.特效图用途]}
                                    refreshList={this.refreshList}/>
                            <OrderBy changeOrderBy={this.changeOrderBy}/>
                        </div>
                        <div className={`${styles.effectsPicture} scrollDiv`}
                             id='specialEffectPic__container'>
                            <Infinite
                                pageStart={0}
                                loadMore={this.loadMore}
                                hasMore={!endPage}
                                initialLoad={false}
                                threshold={500}
                                useWindow={false}
                                getScrollParent={() => document.getElementById(
                                    'specialEffectPic__container')}>
                                {!list && <Empty text={textTile} style={{ marginTop: '30px' }}/>}
                                {list && list.map(v =>
                                    <div key={v.id}
                                         className={styles.singleBox}
                                         onMouseEnter={(e) => this.handleMouseEnter(e, v)}
                                         onMouseLeave={this.handleMouseLeave}
                                         onClick={(e) => this.handleClick(e, v)}>
                                        <div className={styles.mark}></div>
                                        <div className={styles.videoOuter}>
                                            <img
                                                className={styles.img}
                                                src={genUrl(v.coverImg, '124:70')}/>
                                        </div>
                                    </div>,
                                )}
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
                                     style={{backgroundColor: state.hoverObj.bgColor||'#000'}}
                                     className={styles.content}>
                                    <video
                                        className={styles.video}
                                        autoPlay={true}
                                        loop={true}
                                        crossOrigin='Anonymous'
                                        poster={genUrl(state.hoverObj.coverImg, '300:170')}
                                        loop='loop'
                                        src={compatibleVideo(state.hoverObj, true)}
                                    />
                                </div>
                            </div>
                        </CSSTransition>
                    </div>
                </React.Fragment>
            </ScrollContainer>
        );
    }
}

export default EffectsPicture;
