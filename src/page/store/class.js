import React from 'react';
import { connect } from 'dva';
import isEqual from 'lodash/isEqual';
import styles from './classTags.less';
import { Link } from 'dva/router';
import qs from 'qs';
import Icon from '../components/Icon';
import Divider from '../components/common/Divider';
import { LABEL_LIST } from '../../config/staticParams';
import Button from '../components/Button';
import { isObject } from '../../util/util';

class GroupButtons extends React.PureComponent {
    constructor(props) {
        super(props);
        let { search } = props.location;
        search = search.replace('?', '');
        const searchObj = qs.parse(search);
        let currentTagIndex = 0;
        if (props.children) {
            props.children.map((item, index) => {
                if (searchObj[props.paramsname] == item.id) {
                    currentTagIndex = index;
                }
                return null;
            });
        }
    }

    render() {
        const { props } = this;
        const { children } = props;
        let { location: { search } } = props;
        search = search.replace('?', '');
        const searchObj = qs.parse(search);
        let pename = false; // 用于存放现在此条的参数
        const newSearch = searchObj;
        if (props.paramsname) {
            if (searchObj[props.paramsname] !== undefined) {
                pename = searchObj[props.paramsname];
            }
        }
        newSearch.page = 1;
        const oneTag = (item) => {
            //  如果 pename不等于ename并且条目不是默认,返回false;
            const active = String(pename) !== String(item.params) ? (!pename && item.default ===
                true) : true;
            newSearch[props.paramsname] = item.params;
            return (
                <Link
                    key={`${props.id}-${item.params}`}
                    to={{
                        pathname: item.path,
                        search: qs.stringify(newSearch),
                    }}
                ><Button key={`onLabel-${item.id || Math.random()}`}
                         className={`${active ? styles.active : ''}`}>{item.name}</Button></Link>);
        };
        return (
            <div className={styles.sortBtnGroup}>
                {children &&
                children.map(oneTag)}
            </div>
        );
    }
}

/**
 * 每行
 */
class ClassRow extends React.PureComponent {
    constructor(props) {
        super(props);
        let { search } = props.location;
        search = search.replace('?', '');
        const searchObj = qs.parse(search);
        let currentTagIndex = 0;
        if (props.children) {
            props.children.map((item, index) => {
                if (searchObj[props.paramsname] == item.id) {
                    currentTagIndex = index;
                }
                return null;
            });
        }
        this.state = {
            showMore: currentTagIndex > 10,
        };
    }

    handleMore = () => {
        this.setState({
            showMore: !this.state.showMore,
        });
    };

    render() {
        const { state, props } = this;
        let { search } = props.location;
        const { index } = props;
        search = search.replace('?', '');
        const searchObj = qs.parse(search);
        let value = false; // 用于存放现在此条的参数
        const newSearch = searchObj;
        if (props.paramsname) {
            if (searchObj[props.paramsname] !== undefined) {
                value = searchObj[props.paramsname];
            }
        }
        // 前拷贝一次
        const oriValue = Array.isArray(value) ? [...value] : value;
        newSearch.page = 1;
        // 单个标签的创建器
        const oneTag = (item, i) => {
            newSearch[props.paramsname] = item.params;
            let inValue = value;
            if (item.paramsname === 'tag') {
                const valueArray = Array.isArray(oriValue) ? [...oriValue] : Array(index + 1)
                    .fill('');
                inValue = valueArray[index];
                valueArray[index] = item.params;
                newSearch[props.paramsname] = valueArray;
            }
            //  如果 pename不等于ename并且条目不是默认,返回false;
            const active = String(inValue) !== String(item.params) ? (!inValue && item.default ===
                true) : true;

            return <li key={`onLabel-${item.id || Math.random()}`}>
                <Link className={`${styles['tag-item']} ${active ? styles.active : ''}`}
                      to={{
                          pathname: item.path,
                          search: qs.stringify(newSearch),
                      }}
                >{item.name}</Link></li>;
        };
        // 删除当前行的属性，以便于全部按钮调用
        if (props.paramsname === 'tag') {
            const arr = newSearch[props.paramsname];
            if (arr) {
                if (!arr[index]) value = false;
                arr[index] = null;
            }
        } else {
            delete newSearch[props.paramsname];
        }
        const showMore = this.state.showMore;
        return (
            <li>
                <label>{props.name}：</label>
                <div className={styles.classLiHeader}>
                    {props.children &&
                    <ul style={{ height: showMore ? 'auto' : 33 }}
                        className={styles['tag-detail-container']}>
                        {!props.required && <li><Link
                            to={{
                                pathname: this.props.path || '',
                                search: qs.stringify(newSearch),
                            }} className={value === false ? styles.active : ''}
                        >
                            全部
                        </Link></li>}
                        {this.props.children.map(oneTag)}
                    </ul>}
                    {props.children && props.children.length > 11 &&
                    <span onClick={this.handleMore} className={styles.more}>
                    {showMore ? <span><em>收起</em><Icon type="eqf-up"/></span> :
                     <span><em>更多</em><Icon type="eqf-down"/></span>}
                </span>}
                </div>
            </li>
        );
    }
}

/**
 * 主筛选框
 */
@connect(({ tags }) => ({ tags }))
class ClassMain extends React.PureComponent {
    state = {
        list: [
            {
                name: '类型',
                children: [
                    {
                        name: '横板',
                        path: '',
                        params: 'hoz',
                        id: 23,
                    },
                    {
                        name: '竖板',
                        path: '',
                        params: 'ver',
                        id: 22,
                    },
                ],
                path: null,
                id: 21,
                required: false,
                params: '',
                paramsname: 'hoz',
            },
        ],
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        const newState = { ...prevState };
        const { tags, classList = [LABEL_LIST.节假, LABEL_LIST.行业, LABEL_LIST.用途] } = nextProps;
        if (prevState.list.length === 1) {
            classList.forEach((labelId) => {
                if (tags.list.length >= 1) {
                    const item = tags.list.find(v => v.id === labelId);
                    if (item) {
                        newState.list.unshift(item);
                    }
                }
            });
        }
        return newState;
    }

    render() {
        const { state: { list: stateList }, props: { sort = false, ...props } } = this;
        const list = [...stateList];
        let last = null;
        if (sort) {
            const hoz = list.pop();
            last = [
                ...sort,
                {
                    ...hoz,
                    children: [
                        {
                            name: '全部',
                            path: '',
                            params: '',
                            id: 23,
                            default: true,
                        },
                        ...hoz.children,
                    ],
                },
            ];
        }
        return (
            <div className={`${styles.classify} ${props.className || ''}`}>
                <ul className={styles['tag-list']}>
                    {list.length > 0 && list.map((item, index) => <React.Fragment
                            key={'classRow-' + (item.id || Math.random())}>
                            {index > 0 &&
                            <Divider className={styles.divider} dashed={true} type={'horizontal'}/>}
                            <ClassRow  {...item} index={index} location={props.location}/>
                        </React.Fragment>,
                    )}
                    {last && <React.Fragment>
                        {list.length > 0 &&
                        <Divider className={styles.divider} dashed={true} type={'horizontal'}/>}
                        <li className={styles.sortLi}>{last.map(v => {
                            return <GroupButtons key={v.name} {...v} location={props.location}/>;
                        })}</li>
                    </React.Fragment>}
                </ul>
            </div>
        );
    }
}

export default ClassMain;
