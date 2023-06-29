import React from 'react';
import { connect } from 'dva';
import styles from './classTags.less';
import { Link } from 'dva/router';
import qs from 'qs';


/**
 * 每行
 */
class ClassRow extends React.PureComponent {


    render() {
        const { state, props } = this;
        let { search } = props.location;
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
        // 单个标签的创建器
        const oneTag = (item) => {
            //  如果 pename不等于ename并且条目不是默认,返回false;
            const active = String(pename) !== String(item.params) ? (!pename && item.default ===
                true) : true;
            newSearch[props.paramsname] = item.params;
            return <li key={`onLabel-${item.id || Math.random()}`}>
                <Link className={`${styles['tag-item']} ${active ? styles.active : ''}`}
                      to={{
                          pathname: item.path,
                          search: qs.stringify(newSearch),
                      }}
                >{item.name}</Link></li>;
        };
        // 删除当前行的属性，以便于全部按钮调用
        delete newSearch[props.paramsname];
        return (
            <li>

                <label>{props.name}</label>
                <div className={styles.classLiHeader}>
                    {!props.required &&
                    <Link to={{
                        pathname: this.props.path || '',
                        search: qs.stringify(newSearch),
                    }} className={pename === false ? styles.active : ''}>
                        全部
                    </Link>
                    }
                    {props.children &&
                    <ul className={styles['tag-detail-container']}>
                        {props.children.map(oneTag)}
                    </ul>}
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
            {},
            // {
            //   name: '时长',
            //   params: 'videoDuration',
            //   children: [
            //     {
            //       name: '0-20s',
            //       path: '',
            //       params: '0-21',
            //     },
            //     {
            //       name: '21-40s',
            //       path: '',
            //       params: '21-41',
            //     },
            //     {
            //       name: '41-60s',
            //       path: '',
            //       params: '41-61',
            //     },
            //     {
            //       name: '60s以上',
            //       path: '',
            //       params: '60-99999',
            //     },
            //   ],
            //   path: null,
            //   id: 'timelong',
            //   paramsname:'timelong',
            // },
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
        const { tags } = nextProps;
        if (tags.list.length >= 1 && JSON.stringify(tags.list[0]) !==
            JSON.stringify(prevState.list[0])) {
            newState.list.shift();
            newState.list.unshift(tags.list[0]);
        }
        return newState;
    }

    render() {
        const { state, props } = this;
        return (
            <div className={`${styles.classify} ${props.className || ''}`}>
                <ul className={styles['tag-list']}>
                    {state.list.map(item => <ClassRow
                        key={'classRow-' + (item.id || Math.random())}  {...item}
                        location={props.location}/>)}
                </ul>
            </div>
        );
    }
}

export default ClassMain;
