import React from 'react';
import { connect } from 'dva';
import styles from './mouldMaterial.less';
import Infinite from 'react-infinite-scroller';
import { CANVAS_TYPE, LABEL_LIST, SEGMENT_TYPE } from '../../../../config/staticParams';
import { getIndex } from '../../../../api/template';
import { compatibleVideo, genVideoUrl } from '../../../../util/file';
import { genUrl } from '../../../../util/image';
import Empty from '../../../components/empty';
import Labels from '../../../components/labels/index';
import VideoVerHor from '../videoStyle/index';
import ColorTheme from '../colorTheme/index';
import Card from './videoCard/index';
import { CSSTransition } from 'react-transition-group';
import Video from '../../../components/video/card';
import Button from '../../../components/Button/index';
import ScrollContainer from '../../../components/scrollContainer';

/* global axios */
@connect(({ editor }) => ({
    transverse: editor.transverse,
}))
export default class MouldMaterial extends React.Component {
    constructor(props) {
        super(props);
        this.loading = false;
        this.listDiv = React.createRef();
        this.video = React.createRef();
        this.preivewCloseDely = null;
        this.page = 1;
        this.state = {
            activeMenu: 1,
            list: [],
            page: 1,
            pageSize: 18,
            loading: true,
            direction: props.transverse ? 'hoz' : 'ver', // 横竖视频
            fragment: '',
            classify: '',
            style: '',
            theme: '',
            endPage: false,
            showPreivew: false, // 预览
            hoverObj: {}, // 预览对象
            noPlayed: true,// 播放状态
            playing: false,// 正在播放
        };
    }

    componentDidMount() {
        this.loadList();
    }

    componentDidUpdate(prevProps, prevState) {
        const { fragment, classify, style, theme } = this.state;
        if (prevState.loading) {
            // this.setState({ loading: false });
        }
        if (!this.state.showPreivew && this.state.playing) {
            this.onPause();
        }
        if (fragment !== prevState.fragment || classify !== prevState.classify
            || style !== prevState.style || theme !== prevState.theme) {
            this.page = 1;
            this.listDiv.current.scrollTop = 0;
            this.loadList();
        }
    }

    componentWillUnmount() {
        this.setState = () => null;
    }

    activeMenu = (index = 1) => {
        this.setState({ activeMenu: index });
    };
    loadMore = () => {
        if (!this.loading) {
            this.page = this.page + 1;
            this.loading = true;
            this.loadList(this.page);
        }
    };
    /**
     * 读取列表
     */
    loadList = (page = 1) => {
        const direction = this.state.direction === 'hoz';
        const { list, classify, style, theme, fragment } = this.state;
        this.setState({ loading: true });
        const params = {
            pageNo: page || this.state.page,
            pageSize: direction ? 20 : 20,
            orderBy: 'weight_score desc,create_time desc',
            labelIds: [
                classify,
                style,
                // this.state.theme].concat(this.state.fragment ? this.state.fragment:this.state.videoFragment.map(v=>v.id)),
                theme,
                fragment,
            ].filter(v => v),
            transverse: direction,
            videoDuration: '',
            key: '',
            templateTypes: [2, 3],
        };
        getIndex(params)
            .then(res => {
                const { data } = res;
                if (data.success) {
                    this.loading = false;
                    let resList = data.list;
                    if (resList && resList.length > 0) {
                        const newState = {
                            list: page > 1 ? list.concat(resList) : resList,
                            page: Number(data.map.pageNo || 1),
                            count: data.map.count,
                            endPage: data.map.end,
                            redirect: '',
                        };
                        this.setState({
                            ...newState,
                            loading: false,
                        });
                    } else {
                        this.page = this.page - 1 || 1;
                        this.setState({
                            list: page > 1 ? list : [],
                            loading: false,
                            endPage: true,
                        });
                    }
                }
            });
    };
    onClassify = (value) => {
        this.setState({
            classify: value[0],
            style: value[1],
            page: 1,
        });
    };
    onTheme = (value) => {
        this.setState({
            theme: value,
            page: 1,
        });
    };
    changDirection = (type) => {
        this.page = 1;
        this.setState({
            direction: type,
            page: 1,
        }, () => this.loadList(1));
    };
    handleMouseLeave = (e) => {
        clearTimeout(this.preivewOpenDely);
        this.preivewCloseDely = setTimeout(() => this.setState({ showPreivew: false }), 300);
    };
    hoverPreivew = () => {
        clearTimeout(this.preivewCloseDely);
        this.preivewCloseDely = null;
    };
    handleMouseEnter = (hoverObj) => {
        if (this.preivewCloseDely) {
            this.hoverPreivew();
        }
        this.preivewOpenDely = setTimeout(() => this.setState({
            showPreivew: true,
            hoverObj,
        }), 300);
    };
    play = () => {
        if (this.state.playing) {
            this.onPause();
        } else {
            this.onPlay();
        }
    };
    onPlay = () => {
        this.video.current.play();
        this.setState({
            noPlayed: false,
            playing: true,
        });
    };
    onPause = () => {
        this.video.current.pause();
        this.setState({ playing: false });
    };
    onUserTemplate = () => {
        this.props.dispatch({
            type: 'workspace/insertVideo',
            payload: {
                id: this.state.hoverObj.id,
                type: CANVAS_TYPE.templateVideo,
            },
        });
    };

    render() {
        const { state: { direction, ...state }, props: { scrolling } } = this;
        const textTile = this.state.loading ? '正在加载' : '未找到模板素材';
        const withCard = state.hoverObj.direction === 'hoz' ? '300px' : '214px';
        const heightCard = state.hoverObj.direction === 'hoz' ? '170px' : '384px';
        const hozVer = state.hoverObj.direction === 'hoz' ? '300:170' : '214:384';
        const timeLong = moment(state.hoverObj.videoDuration, 'X')
            .format('mm:ss');
        return (
            <ScrollContainer>
                <React.Fragment>
                    <div className={styles.list}>
                        <div className={`${styles.videoMart} ${scrolling ? 'scrollShadow' : ''}`}>
                            <Labels width={80} typeData={[LABEL_LIST.风格, LABEL_LIST.片段分类]}
                                refreshList={this.onClassify} />
                            <div className={styles.videoTypeBox}>
                                <VideoVerHor direction={direction}
                                    videoDirection={this.changDirection} />
                                <ColorTheme colorTheme={this.onTheme} />
                            </div>
                        </div>
                        <div className={`${styles.listContent} scrollDiv`} id={'listDiv'}
                            ref={this.listDiv}>
                            <Infinite
                                pageStart={0}
                                loadMore={this.loadMore}
                                hasMore={!state.endPage}
                                initialLoad={false}
                                threshold={100}
                                useWindow={false}
                                getScrollParent={() => document.getElementById('listDiv')}
                            >
                                <div className={styles.wrap}>
                                    {!state.list.length && <Empty text={textTile} />}
                                    {state.list.length > 0 &&
                                        state.list.map((item, index) =>
                                            <Card {...item}
                                                direction={direction}
                                                key={`${index}-${item.id}`}
                                                handleMouseEnter={this.handleMouseEnter}
                                                handleMouseLeave={this.handleMouseLeave}
                                            />)
                                    }
                                </div>
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
                                <div onClick={this.onUserTemplate} className={styles.content}
                                    style={{ width: withCard }}>
                                    <h1>{state.hoverObj.title}</h1>
                                    <p><span>{state.hoverObj.price || '免费'}</span>
                                        <span>{timeLong}</span></p>
                                    <div className={styles.wrapPre} style={{
                                        width: withCard,
                                        height: heightCard,
                                    }}>
                                        <video
                                            // onClick={this.play}
                                            ref={this.video}
                                            autoPlay={true}
                                            loop={true}
                                            controls={false}
                                            onPlay={this.onPlay}
                                            onPause={this.onPause}
                                            // crossOrigin='Anonymous'
                                            style={{
                                                width: withCard,
                                                height: heightCard,
                                            }}
                                            poster={genUrl(state.hoverObj.coverImg, hozVer)}
                                            src={`${compatibleVideo(state.hoverObj,
                                                true)}`} />
                                    </div>
                                </div>
                            </div>
                        </CSSTransition>
                    </div>
                </React.Fragment>
            </ScrollContainer>
        );
    }
}
