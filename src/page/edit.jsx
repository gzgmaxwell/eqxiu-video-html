import React from 'react';
import { Breadcrumb, Tag, Checkbox, Alert } from 'antd';
import Button from 'Components/Button/index';
import Input from 'Components/input/countInput';
import CheckTag from 'Components/tags';
import styles from './edit.less';
import Icon from './components/Icon';
import { prev } from 'Config/env';
import {
    SortableContainer,
    SortableElement,
    SortableHandle,
    arrayMove,
} from 'react-sortable-hoc';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { setTitle } from 'Util/doc';
import imageUtil from 'Util/image';
import templateShowApi from 'Api/templateShow';
import templateApi from 'Api/template';
import isEqual from 'lodash/isEqual';
import { filter } from 'Util/data';
import ToolUtil from 'Util/util';

//拖动手柄
const DragHandle = SortableHandle(() => <td className={styles.td_icon}><Icon
    type='eqf-align-justify'/></td>);
//  拖动条
const SortableItem = SortableElement(({ value, i, sortFunction }) => {
    let content = '这里是内容';
    let title = '标题';
    switch (value.type) {
        case 1:
            content = <span className={styles.text_span}>{value.content}</span>;
            title = '文本';
            break;
        case 2:
            content = <img src={imageUtil.genUrl(value.ossUrl)}/>;
            title = `图片`;
            break;
        default:
            return <tr/>;
    }
    return (
        <tr className={`${styles.table_row} ${i % 2 === 0 ? styles.odd : ''}`}>
            <td className={styles.td_check}><Checkbox checked={value.replaceable} onChange={e => {
                sortFunction.onCheck(i, e);
            }} className={styles.checkbox}/></td>
            <td className={styles.td_title} style={{ marginRight: 20 }}>{title}</td>
            <td className={styles.td_content}>{content}</td>
            <DragHandle/>
            <td className={styles.td_icon} onClick={e => {
                sortFunction.sortEnd({
                    oldIndex: i,
                    newIndex: i - 1,
                });
            }}><Icon type='eqf-arrow-up'/></td>
            <td className={styles.td_icon} onClick={e => {
                sortFunction.sortEnd({
                    oldIndex: i,
                    newIndex: i + 1,
                });
            }}><Icon type='eqf-arrow-down'/></td>
            <td className={styles.td_icon}/>
        </tr>
    );
});
//  拖动表格
const SortableList = SortableContainer(({ items, sortFunction }) => {
    return (
        <table className={styles.tableDiv}>
            <tbody>
            {items.map((value, index) => (
                <SortableItem key={`item-${index}`} index={index} sortFunction={sortFunction}
                              i={index}
                              value={value}/>
            ))}
            </tbody>
        </table>
    );
});


//  面包屑数据
const path = [
    {
        path: `${prev}/templateShow`,
        breadcrumbName: '上传视频模板',
    },
    {
        path: '#',
        breadcrumbName: '编辑视频模板',
    },
];
/**
 * 提交验证规则
 * @type {*[]}
 */
const dataFilterRules = [
    {
        attr: 'title',
        rules: [
            {
                name: 'required',
                msg: '必须填写标题',
            }, {
                name: 'max',
                value: 15,
                msg: '长度不可超过15',
            }],
    },
    {
        attr: 'templateDescribe',
        rules: [
            {
                name: 'required',
                msg: '必须有填写模板介绍',
            }, {
                name: 'max',
                value: 50,
                msg: '长度不可超过50',
            }],
    },
    {
        attr: 'tagIds',
        rules: [
            {
                name: 'required',
                msg: '必须选择标签',
            }],
    },

];

@connect(({ backgruondColor, tags }) => ({
    backgruondColor,
    tags,
}))
class EditPage extends React.Component {

    constructor(props) {
        super(props);
        this.content = React.createRef();
    }

    state = {
        title: '',
        titleError: '',
        templateDescribe: '',
        templateDescribeError: '',
        coverImg: '',
        previewUrl: '',
        tagIds: new Set([]),
        tags: [],
        tagsError: '',
        recommend_tags: [],
        editList: [
            {
                id: 2,
                type: 2,
                text: '',
                img: '',
                sort: 5,
                replaceable: true,
            },
        ],
        checkedAll: 0,
    };

    componentDidMount() {
        //  初始化全选框//
        this.afterCheck();
        dispatch({
            type: 'tags/fetch',
        });
    }


    componentWillUnmount() {
        this.props.dispatch({
            type: 'backgruondColor/removeWhite',
        });
    }


    static getDerivedStateFromProps(nextProps, prvState) {
        let newState = {};
        if (nextProps._spaceId !== prvState._spaceId) {
            newState = { ...nextProps };
        }
        const { tags } = nextProps;
        const newTags = tags.list[0].children;
        if (!isEqual(newTags, prvState.recommend_tags)) {
            newState.recommend_tags = newTags;
        }
        return newState;
    }

    /**
     * 重新排序
     * @param oldIndex 原索引
     * @param newIndex 新索引
     * @returns {boolean}
     */
    onSortEnd = ({ oldIndex, newIndex }) => {
        const { editList } = this.state;
        if (newIndex < 0 || newIndex > editList.length) {
            return false;
        }
        this.setState({
            editList: arrayMove(editList, oldIndex, newIndex),
        });
    };

    /**
     * 点击复选框
     * @param index
     * @param e
     */
    onCheck = (index, e) => {
        const { editList } = this.state;
        editList[index].replaceable = e.target.checked;
        //  全选数量
        this.afterCheck(editList);
        this.setState({ editList });
    };

    onTitle = (value) => {
        this.setState({ title: value });
    };

    onTemplateDescribe = (value) => {
        this.setState({ templateDescribe: value });
    };

    /**
     * 全选框处理
     * @param elist 如果传入新的elist 就用新的
     */
    afterCheck = (elist = false) => {
        const editList = elist || this.state.editList;
        let checkLength = 0;
        editList.forEach(value => {
            if (value.replaceable) {
                checkLength += 1;
            }
        });
        //全选状态
        const checkedAll = checkLength === 0 ? 0 : checkLength === editList.length ? 2 : 1;
        this.setState({ checkedAll });
    };

    /**
     * 点击全选事件
     * 如果是全选就改成全不选,否则全选
     */
    onCheckAll = () => {
        const { editList, checkedAll } = this.state;
        let newStatus = true;
        let newArray = [];
        if (checkedAll === 2) {
            //  本来全选 则全取消
            newStatus = false;
            newArray = editList.map(item => {
                item.replaceable = newStatus;
                return item;
            });
        } else {
            newArray = editList.map(item => {
                item.replaceable = newStatus;
                return item;
            });
        }
        this.setState({
            editList: newArray,
            checkedAll: newStatus ? 2 : 0,
        });
    };
    /**
     * 移除标签
     * @param index
     */
    removeTag = (index) => {
        const { tags, tagIds } = this.state;
        const removeTarget = tags.splice(index, 1);
        tagIds.delete(removeTarget[0].params);
        this.setState({
            tags,
            tagIds,
        });
    };
    /**
     * 添加标签
     * @param item
     * @param checked
     */
    addTag = (item, checked = true) => {
        const oldTags = this.state.tags;
        const { tagIds } = this.state;
        let tags = [];
        if (checked) {
            tags = [...oldTags, item];
            tagIds.add(item.params);
        } else {
            tags = oldTags.filter(value => item.params !== value.params);
            tagIds.delete(item.params);
        }
        this.setState({
            tags,
            tagIds,
        });
    };
    /**
     * 提交审核
     * @returns {boolean}
     */
    onSubmit = () => {
        const { state } = this;
        const { match: { params } } = this.props;
        this.setState({
            titleError: '',
            tagIdsError: '',
            templateDescribeError: '',
        });
        // 参数判断
        const error = filter(dataFilterRules, state);
        if (error !== true) {
            this.setState({ ...error });
            this.content.current.scrollIntoView({
                behavior: 'smooth',
                block: 'end',
            });
            return false;
        }
        const postParams = {
            id: params.id,
            labelIds: Array.from(state.tagIds),
            materials: this.state.editList.map(({ id, replaceable }, sort) => ({
                id,
                replaceable,
                sort: sort + 1,
            })),
            title: state.title,
            templateDescribe: state.templateDescribe,
        };
        templateShowApi.saveConfig(postParams)
            .then((res) => {
                if (res.data.success === true) {
                    this.props.dispatch(routerRedux.push(`${prev}/temp/success`));
                }
            });
    };


    render() {
        const { state } = this;
        const sortFunction = {
            sortEnd: this.onSortEnd,
            onCheck: this.onCheck,
        };
        setTitle('模板详情编辑');
        return (
            <div>
                <Breadcrumb separator='>'>
                    {path.map(item =>
                        (<Breadcrumb.Item key={item.breadcrumbName}>{item.path === '#'
                                                                     ? item.breadcrumbName
                                                                     :
                                                                     <a href={item.path}>{item.breadcrumbName}</a>}</Breadcrumb.Item>),
                    )}
                </Breadcrumb>
                <div ref={this.content}/>
                <div className={styles.content}>
                   <span className={styles.img_video}>
                   <div className={styles.img_div}>
                       <div className={styles.sticky}>视频封面</div>
                       <img src={imageUtil.genUrl(state.coverImg)}/>
                   </div>
                   <div className={styles.video_div}>
                       <video width="239" height="252" poster={imageUtil.genUrl(state.coverImg)}
                              crossOrigin='Anonymous'
                              controls={true}
                              src={imageUtil.genUrl(state.previewUrl)}/>
                   </div>
                   </span>
                    <span className={styles.info_span}>
                       <div className={styles.one_info}>
                            <label>模板标题</label>
                            <span className={styles.errorSpan}>{state.titleError}</span>
                            <div className={styles.labelNextDiv} style={{ width: 310 }}>
                             <Input len={15} value={state.title} onChange={this.onTitle}/>
                             </div>
                       </div>
                       <div className={styles.one_info}>
                            <label>模板介绍</label>
                            <span className={styles.errorSpan}>{state.templateDescribeError}</span>
                            <div className={styles.labelNextDiv} style={{ width: 807 }}>
                             <Input len={50} value={state.templateDescribe}
                                    onChange={this.onTemplateDescribe}/>
                             </div>
                       </div>
                       <div className={styles.one_info}>
                            <label>模板用途标签<span
                                className={styles.errorSpan}>{state.tagIdsError}</span></label>
                            <div className={styles.labelNextDiv} style={{ width: 807 }}>
                                 <div className={styles.tags_checked_div}>
                                     {state.tags.map(
                                         (item, index) => {
                                             return <Tag key={item.params} closable onClose={() => {
                                                 this.removeTag(index);
                                             }}>{item.name}</Tag>;
                                         },
                                     )}
                                 </div>
                                 <div>
                                     <span style={{
                                         width: 70,
                                         marginRight: 19,
                                     }}>推荐标签:</span>
                                     <span style={{
                                         width: 676,
                                         display: 'inline-block',
                                     }}>
                                         {state.recommend_tags.map(
                                             (item, index) => {
                                                 return <CheckTag key={item.params}
                                                                  checked={state.tagIds.has(
                                                                      item.params)}
                                                                  onChange={checked => {
                                                                      this.addTag(item, checked);
                                                                  }}>{item.name}</CheckTag>;
                                             },
                                         )}
                                     </span>
                                 </div>
                             </div>
                       </div>
                       <div className={styles.one_info}>
                            <label>手动排序</label>
                            <div className={`${styles.labelNextDiv} ${styles.tableDiv}`}>
                                <div className={styles.table_row} style={{ height: 40 }}>
                                    <div className={styles.td_check} style={{ height: 40 }}>
                                        <Checkbox indeterminate={state.checkedAll === 1}
                                                  checked={state.checkedAll === 2}
                                                  onChange={this.onCheckAll}
                                                  className={styles.checkbox}/>
                                    </div>
                                    <div style={{
                                        display: 'table-cell',
                                        paddingLeft: 10,
                                    }}>全选为可替换</div>
                                </div>
                             </div>
                                <SortableList items={state.editList}
                                              onSortEnd={this.onSortEnd}
                                              sortFunction={sortFunction}
                                              useDragHandle={true}/>
                       </div>
                        <div style={{ float: 'right' }}>
                             <Button onClick={this.onSubmit}>提交审核</Button>
                        </div>
                        <div className='clearfix'></div>
                   </span>
                    <div className='clearfix'></div>
                </div>
            </div>
        );
    }
}


export default EditPage;
