import React from 'react';
import { prev } from 'Config/env';
import styles from './videoSegment.less';
import Card from './card/index';
import Pagination from 'Components/pagination';
import Icon from '../../components/Icon';
import Empty from '../../components/empty';
import { getIndex, getTagsTree } from '../../../api/template';
import Infinite from 'react-infinite-scroller';

const tagLen = 5;

class VideoSegment extends React.PureComponent {
    constructor(props) {
        super(props);
        this.video = React.createRef();
        this.listDiv = React.createRef();
        this.page = 1;
        this.loading = false;
    }

    state = {
        list: [],
        direction: 'hoz',
        pageSize: 10,
        count: 25,
        page: 1,
        loading: true,
        videoFragment: [],// 片段类型渲染
        videoClassify: [],// 分类渲染
        videoStyle: [],// 风格渲染
        videoTheme: [],// 色系渲染
        fragment: '',
        classify: '',
        style: '',
        theme: '',
        themeColor: '',// 色系值具体颜色值
        hoverMore: 'eqf-menu-down',
        hoverColor: 'eqf-menu-down',
        endPage: false,
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        const state = {};
        // if (nextProps.isHorz && nextProps.isHorz !== prevState.direction) {
        //     state.direction = nextProps.isHorz;
        // }
        return state;
    }

    componentDidMount() {
        this.loadTags();
    }

    componentDidUpdate(prevProps, prevState) {
        const { fragment, classify, style, theme } = this.state;
        if (prevState.loading) {
            // this.setState({ loading: false });
        }
        if (fragment !== prevState.fragment || classify !== prevState.classify
            || style !== prevState.style || theme !== prevState.theme) {
            this.page = 1;
            this.listDiv.current.scrollTop = 0;
            this.loadList();
        }
    }

    loadMore = () => {
        if (!this.loading) {
            this.page = this.page + 1;
            this.loading = true;
            this.loadList(this.page);
        }
    };

    changDirection = (type) => {
        this.page = 1;
        this.setState({
            direction: type,
            page: 1,
        }, () => this.loadList(1));
    };
    loadList = (page = 1) => {
        const direction = this.state.direction === 'hoz';
        const { list, classify, style, theme, fragment } = this.state;
        this.setState({ loading: true });
        const params = {
            pageNo: page || this.state.page,
            pageSize: direction ? 9 : 10,
            orderBy: 'weight_score desc,create_time desc',
            labelIds: [
                classify,
                style,
                // this.state.theme].concat(this.state.fragment ? this.state.fragment:this.state.videoFragment.map(v=>v.id)),
                theme,
                fragment,
            ],
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
                    if(resList && resList.length > 0) {
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
    loadTags = () => {
        getTagsTree()
            .then(res => {
                const { data } = res;
                if (data.success) {
                    if (data.obj) {
                        data.obj.map((item, index) => {
                            const newState = {};
                            if (item.name === '片段类型') {
                                newState.videoFragment = item.children;
                            }
                            if (item.id === 5) { // '内容形式'
                                newState.videoClassify = item.children;
                            }
                            if (item.name === '风格') {
                                newState.videoStyle = item.children;
                            }
                            if (item.name === '色系') {
                                newState.videoTheme = item.children;
                                console.log(item.children);
                            }
                            this.setState({
                                ...newState,
                                loading: false,
                            }, this.loadList);
                        });
                    }

                }
            });
    };
    onFragment = (value) => {
        this.setState({
            fragment: value.id,
            page: 1,
        });
    };
    onClassify = (value) => {
        this.setState({
            classify: value.id,
            page: 1,
        });
    };
    onStyle = (value) => {
        this.setState({
            style: value.id,
            page: 1,
        });
    };
    onTheme = (value) => {
        this.setState({
            theme: value.id,
            page: 1,
            themeColor: value.name,
        });
    };
    onFragmentClear = () => {
        this.setState({
            fragment: '',
            page: 1,
        });
    };
    onClassifyClear = () => {
        this.setState({
            classify: '',
            page: 1,
        });
    };
    onStyleClear = () => {
        this.setState({
            style: '',
            page: 1,
        });
    };
    myEnter = () => {
        this.setState({
            hoverMore: 'eqf-menu-down',
        });
    };
    myLeave = () => {
        this.setState({
            hoverMore: 'eqf-menu-up',
        });
    };
    myEnterColor = () => {
        this.setState({
            hoverColor: 'eqf-menu-down',
        });
    };
    myLeaveColor = () => {
        this.setState({
            hoverColor: 'eqf-menu-up',
        });
    };
    clearThemeColor = () => {
        this.setState({
            themeColor: '',
            theme: '',
        });
    };
    onClose = () => {
        if (typeof this.props.onClose === 'function') {
            return this.props.onClose();
        }
    };

    render() {
        const { state } = this;
        const menuTitle = state.loading ? '正在加载' : '没有找到相应的片段';
        const cardBoxMarginLeft = state.direction === 'hoz' ? '-8px' : '-9px';
        return (
            <div className={styles.videoBox}>
                <div className={styles.videoRightBox}>
                    <div className={styles.videoRightHeadBox}>
                        <ul className={styles.videoRightHead}>
                            <li onClick={() => this.onFragmentClear()}
                                className={`${styles.videoRightHeadList} ${!state.fragment
                                                                           ? styles.active
                                                                           : ''}`}>全部
                            </li>
                            {state.videoFragment.length > 0 &&
                            state.videoFragment.map((item, index) =>
                                <li key={index} onClick={() => this.onFragment(item)}
                                    className={`${styles.videoRightHeadList} ${state.fragment ===
                                                                               item.id
                                                                               ? styles.active
                                                                               : ''}`}>{item.name}</li>)
                            }
                        </ul>
                        <div className={styles.close} onClick={this.onClose}>×</div>
                    </div>
                    <div className={styles.classify}>
                        <ul className={styles.tagList}>
                            <li className={styles.tagListBox}>
                                <label className={styles.tagTitle}>形式:</label>
                                <ul className={styles.tagDetail}>
                                    <li onClick={() => this.onClassifyClear()}
                                        className={`${styles.tagDetailList} ${!state.classify
                                                                              ? styles.activeElse
                                                                              : ''}`}>全部
                                    </li>
                                    {state.videoClassify.length > 0 &&
                                    state.videoClassify.map((item, index) =>
                                        <li key={index} onClick={() => this.onClassify(item)}
                                            className={`${styles.tagDetailList} ${state.classify ===
                                                                                  item.id
                                                                                  ? styles.activeElse
                                                                                  : ''} ${index ===
                                                                                          state.videoClassify.length -
                                                                                          1
                                                                                          ? styles.noneBorderRight
                                                                                          : ''}`}>{item.name}</li>)
                                    }
                                </ul>
                            </li>
                            <li className={styles.tagListBox}>
                                <label className={styles.tagTitle}>风格:</label>
                                <ul className={styles.tagDetail}>
                                    <li onClick={() => this.onStyleClear()}
                                        className={`${styles.tagDetailList} ${!state.style
                                                                              ? styles.activeElse
                                                                              : ''}`}>全部
                                    </li>
                                    {state.videoStyle.length > 0 &&
                                    state.videoStyle.map((item, index) =>
                                        <li key={index} onClick={() => this.onStyle(item)}
                                            className={`${styles.tagDetailList} ${ index > tagLen
                                                                                   ? styles.tagDetailListNone
                                                                                   : ''} ${state.style ===
                                                                                           item.id
                                                                                           ? styles.activeElse
                                                                                           : ''}`}>{item.name}</li>)
                                    }
                                    <li className={`${styles['tagDetailList']} ${styles['noneBorderRight']}`}
                                        onMouseEnter={this.myEnter} onMouseLeave={this.myLeave}>
                                        <span className={`${state.videoStyle.map(
                                            (v, i) => i > tagLen && ~~v.id)
                                                                .includes(state.style)
                                                            ? styles.activeElse
                                                            : ''}`}>更多</span> <Icon
                                        type={state.hoverMore}
                                        className={styles.tagDetailListIcon}/>
                                        <div className={styles.popOver}>
                                            <div className={styles.popOverTranigle}></div>
                                            <div className={styles.popOverMain}>
                                                {state.videoStyle.length > 0 &&
                                                state.videoStyle.filter((v, i) => i > tagLen)
                                                    .map((item, index) =>
                                                        <span key={index}
                                                              onClick={() => this.onStyle(item)}
                                                              className={`${styles.popOverMainList} ${state.style ===
                                                                                                      item.id
                                                                                                      ? styles.activeElse
                                                                                                      : ''}`}>{item.name}</span>)
                                                }
                                            </div>
                                        </div>
                                    </li>
                                </ul>
                                <label className={styles.tagTitle}>类型:</label>
                                <ul className={styles.tagDetail}>
                                    <li className={`${styles.tagDetailList } ${state.direction ===
                                                                               'hoz'
                                                                               ? styles.activeElse
                                                                               : ''}`}
                                        onClick={() => this.changDirection('hoz')}>横板
                                    </li>
                                    <li className={`${styles.tagDetailList } ${styles.noneBorderRight} ${state.direction ===
                                                                                                         'ver'
                                                                                                         ? styles.activeElse
                                                                                                         : ''}`}
                                        onClick={() => this.changDirection('ver')}>竖板
                                    </li>
                                </ul>
                                <div className={styles.colorBox} onMouseEnter={this.myEnterColor}
                                     onMouseLeave={this.myLeaveColor}>
                                    <label className={styles.tagTitle}>色系:</label>
                                    <ul className={styles.tagDetail}>
                                        <li className={`${styles.colorList}`} style={{
                                            background: `${state.themeColor
                                                           ? state.themeColor
                                                           : ''}`,
                                        }}/>
                                        <Icon type={state.hoverColor}
                                              className={styles.tagDetailListIcon}/>
                                    </ul>
                                    <div className={styles.popOverColor}>
                                        <div className={styles.popOverMainColor}>
                                            <span className={`${styles.colorListElse} ${state.theme
                                                                                        ? ''
                                                                                        : styles.borderStyle}`}
                                                  onClick={() => this.clearThemeColor()}/>
                                            {state.videoTheme.length > 0 &&
                                            state.videoTheme.map((item, index) =>
                                                <span key={index} onClick={() => this.onTheme(item)}
                                                      className={`${styles.popOverMainListColor} ${state.theme ==
                                                                                                   item.id
                                                                                                   ? styles.borderStyle
                                                                                                   : ''}`}
                                                      style={{ background: `${item.name}` }}/>)
                                            }
                                        </div>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div id={'listDiv'} ref={this.listDiv} className={`${styles.main}`}>
                        <Infinite
                            pageStart={0}
                            loadMore={this.loadMore}
                            hasMore={!state.endPage}
                            initialLoad={false}
                            threshold={100}
                            useWindow={false}
                            getScrollParent={() => document.getElementById('listDiv')}
                        >
                            <div className={styles.cardBox}
                                 style={{ marginLeft: cardBoxMarginLeft }}>

                                {!state.list.length && <Empty text={menuTitle}/>}
                                {state.list.length > 0 &&
                                state.list.map((item, index) =>
                                    <Card {...item} direction={state.direction} key={`${index}-${item.id}`}
                                          onClose={this.onClose}
                                          onChange={this.props.onChange}/>)
                                }
                            </div>
                        </Infinite>
                    </div>

                </div>
            </div>
        );
    }
}

export default VideoSegment;
