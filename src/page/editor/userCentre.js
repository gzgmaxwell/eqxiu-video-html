import React from 'react';
import { connect } from 'dva';
import styles from './leftSide.less';
import Button from 'Components/Button';
import { Input } from 'antd';
import hozCard from './card/horzCard';
import verCard from './card/vertCard';
import template from 'Api/template';
import Empty from 'Components/empty';
import Infinite from 'react-infinite-scroller';

const Search = Input.Search;

@connect(({ tags }) => ({ tags }))
class UserCentre extends React.PureComponent {

    constructor(props) {
        super(props);
        this.fixedDiv = React.createRef();
    }

    state = {
        hoz: 'hoz',
        list: [],
        tag: null,
        searchKey: null,
        page: 1,
        pageSize: 20,
        count: 20,
        endPage: false,
        isLoading: false,
    };


    componentDidMount() {
        // this.loadLists();
        this.props.dispatch({
            type: 'tags/fetch',
        });
    }

    /**
     * 搜索
     * @param value
     */
    onSearch = (value) => {
        this.setState({
            searchKey: value,
            list: [],
            endPage: true,
        }, () => this.loadLists(1));
    };
    /**
     * 点击横纵事件
     * @param type
     */
    changeHoz = (type = 'hoz') => {
        this.setState({
            hoz: type,
            list: [],
            endPage: true,
        }, () => this.loadLists(1));
    };
    /**
     * 点击模板标签
     * @param id
     */
    changeTag = (id) => {
        this.setState({
            tag: id,
            list: [],
            endPage: true,
        }, () => this.loadLists(1));
    };


    /**
     * 读取模板中心列表公用函数
     * @param page
     */
    loadLists = (page = 1) => {
        this.setState({ isLoading: true });
        const { state } = this;
        const params = {
            pageNo: Math.max(page || state.page || 1, 1),
            pageSize: this.state.pageSize,
            orderBy: 'weight_score desc,create_time desc',
            labelId: state.tag,
            transverse: this.state.hoz === 'hoz',
            videoDuration: '',
            key: state.searchKey,
        };
        template.getIndex(params)
            .then((res) => {
                const { data } = res;
                if (data.success) {
                    const newState = {
                        list: this.state.list.concat(data.list),
                        page: Number(data.map.pageNo || 1),
                        count: data.map.count,
                        endPage: data.map.end,
                        isLoading: false,
                    };
                    this.setState({ ...newState });
                }
            })
            .catch();
    };

    render() {
        const { props, state } = this;
        const tagsArray = props.tags.list[0] && props.tags.list[0].children;
        const Card = state.hoz === 'hoz' ? hozCard : verCard;
        const tagLink = (item) => {
            const className = [styles.tag];
            if (item.params === state.tag) {
                className.push(styles.active);
            }
            return (<a
                key={item.name} className={className.join(' ')}
                onClick={() => this.changeTag(item.params)}
            >{item.name}
            </a>);
        };

        return (
            <div>
                <div className={styles.fixedDiv} ref={this.fixedDiv}>
                    <div className={styles.title}>
                        模板中心
                    </div>
                    <div className={styles.filterDiv}>
                        <div className={styles.buttonGroup}>
                            <Button
                                className={[
                                    state.hoz === 'hoz' ? styles.active : '',
                                    styles.button].join(' ')}
                                onClick={() => this.changeHoz('hoz')}
                            >横板
                            </Button>
                            <Button
                                className={[
                                    state.hoz === 'ver' ? styles.active : '',
                                    styles.button].join(' ')}
                                onClick={() => this.changeHoz('ver')}
                            >竖板
                            </Button>
                        </div>
                        <div className={styles.searchDiv}>
                            <Search
                                className={styles.searchInput}
                                placeholder="搜索模板"
                                defaultValue={state.searchKey}
                                onSearch={this.onSearch}
                            />
                        </div>
                        <div className={styles.tagsDiv}>
                            {tagLink({
                                name: '全部',
                                path: '',
                                params: null,
                            })}
                            {tagsArray && tagsArray.map(tagLink)}
                            <div className="clearfix"/>
                        </div>
                    </div>
                </div>
                <div style={{
                    width: '100%',
                    height: this.fixedDiv.current && this.fixedDiv.current.offsetHeight || 204,
                }}
                ></div>
                <div className={styles.tempListDiv} style={{
                    overflowY: 'auto',
                    maxHeight: '79vh',
                }}>
                    <Infinite
                        pageStart={0}
                        loadMore={this.loadLists}
                        hasMore={!state.endPage}
                    >
                        {state.list.length > 0
                         && !state.isLoading
                         ? state.list.map(item =>
                                <Card
                                    {...item}
                                    key={item.id}
                                />)
                         : <Empty text={state.isLoading && '读取中...'}/>}
                    </Infinite>
                    {state.endPage && <span>-------到底了-------</span>}
                </div>
            </div>
        );
    }
}

export default UserCentre;
