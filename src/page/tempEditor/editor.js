import React from 'react';
import { Checkbox, message } from 'antd';
import env from 'Config/env';
import Button from 'Components/Button/index';
import Input from 'Components/input/countInput';
import { InputNumber as AntdInput } from 'antd';
import Tag from 'Components/tags';
import styles from './editor.less';
import Icon from 'Components/Icon';
import { prev } from 'Config/env';
import {
    SortableContainer,
    SortableElement,
    SortableHandle,
    arrayMove,
} from 'react-sortable-hoc';
import { connect } from 'dva';
import { ColorLabelId, ColorArray, LABEL_ID_LIST } from '../../config/staticParams';
import { formatEQXMessage } from 'Util/event';
import imageUtil from 'Util/image';
import templateShowApi from 'Api/templateShow';
import lodash from 'lodash';
import { filter, resetFilter } from 'Util/data';
import { certainFunction } from 'Util/object';
import Modal from 'Components/modal';
import Cropper from 'Components/cropper';
import Labels from 'Components/Label';
import colorDiv from 'Components/colorDiv';
import { genTag } from '../../util/tag';
import { genVideoUrl } from '../../util/file';
import { SEGMENT_TYPE } from '../../config/staticParams';
import { SingleColorPicker } from '../components/colorPicker';
import Message from '../components/common/Message';


function fliterLabels(id, type) {
    if (!Array.isArray(LABEL_ID_LIST[type])) return false;
    return LABEL_ID_LIST[type].includes(id);
}


const Authoritys = [
    {
        label: '自己用',
        value: 1,
        disabled: true,
    },
    {
        label: '用户用',
        value: 2,
    },
    {
        label: '秀客用',
        value: 4,
    },
];

/**
 * 片头片尾内容片段
 * @type {number[]}
 */
const partiesTypeIds = [42, 43, 44];

/**
 * 标签 行
 * @param name
 * @param children
 * @returns {*}
 * @constructor
 */
const TagsRow = ({ name, children }) => {
    return (
        <div>
            <span className={styles.tagLabel}>{name}：&nbsp;</span>
            <ul className={styles.TagsUl}>
                {children}
            </ul>
        </div>
    );
};
const findFatherName = (tags, checkTags) => {
    if (!checkTags) return null;
    const res = checkTags.map(item => {
        if (item.parent) {
            return item;
        } else if (item.parentId) {
            for (let one of tags) {
                if (String(one.id) === String(item.parentId)) {
                    const ot = genTag(item, one.id);
                    ot.parent = one.name || '';
                    return ot;
                }
            }
        } else {
            for (let one of tags) {
                if (Array.isArray(one.children)) {
                    for (let i of one.children) {
                        if (String(i.params) === String(item.params)) {
                            const ot = genTag(item, one.id);
                            ot.parent = one.name || '';
                            return ot;
                        }
                    }
                }
            }
        }
        return item;
    });
    return res;
};
/**
 * 改变类型的规则  片头和片尾 与 片段 互斥
 * @param checkedValues [] 选中的数组
 * @param partiesType [] 可选类型数组
 * @returns {*}
 */
const changePatyTypeDisabled = (checkedValues, partiesType) => {
    if (!checkedValues || !partiesType) return null;
    if (checkedValues.indexOf(42) >= 0) {
        partiesType[1].disabled = true;
        partiesType[2].disabled = true;
    } else {
        partiesType[1].disabled = false;
        partiesType[2].disabled = false;
    }
    if (checkedValues.indexOf(43) >= 0 || checkedValues.indexOf(44) >= 0) {
        partiesType[0].disabled = true;
    } else {
        partiesType[0].disabled = false;
    }
    return partiesType;
};

const afterCheck = (editList) => {
    let checkLength = 0;
    if (!editList || editList.length <= 0) {
        return false;
    }
    editList.forEach(value => {
        if (value.replaceable) {
            checkLength += 1;
        }
    });
    // 全选状态
    const checkedAll = checkLength === 0 ? 0 : checkLength === editList.length ? 2 : 1;
    return checkedAll;
};

// 拖动手柄
const DragHandle = SortableHandle(() => <td className={styles.td_icon}><Icon
    type='eqf-align-justify'/></td>);
//  拖动条
const SortableItem = SortableElement(({ value, i, sortFunction, readOnly }) => {
    let content = '这里是内容';
    let title = '标题';
    switch (value.type) {
        case 1:
            content = <span className={styles.text_span}>{value.content}</span>;
            title = '文本';
            break;
        case 2:
            content = <img src={imageUtil.genUrl(value.ossUrl, ':66')}/>;
            title = `图片`;
            break;
        default:
            return <tr/>;
    }
    return (
        <tr className={`${styles.table_row} ${i % 2 === 0 ? styles.odd : ''}`}>
            <td className={styles.td_check}><Checkbox checked={value.replaceable} onChange={e => {
                sortFunction.onCheck(i, e);
            }} className={styles.checkbox} disabled={readOnly}/></td>
            <td className={styles.td_title} style={{ marginRight: 20 }}>{title}</td>
            <td className={styles.td_content}>{content}</td>
            <td className={styles.td_limit}>{value.type === 1 &&
            <AntdInput value={value.maxLength || 15}
                       type={'number'}
                       min={1}
                       disabled={readOnly}
                       onChange={value => {
                           sortFunction.onChangeMaxLength(i, value);
                       }}/>}
            </td>
            {!readOnly && <React.Fragment>
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
            </React.Fragment>}
        </tr>
    );
});
//  拖动表格
const SortableList = SortableContainer(({ items, sortFunction, readOnly }) => {
    return (
        <table className={styles.tableDiv}>
            <tbody>
            {items.map(
                (value, index) => <SortableItem key={`item-${index}`} index={index}
                                                readOnly={readOnly}
                                                sortFunction={sortFunction}
                                                i={index}
                                                value={value}/>)}
            </tbody>
        </table>
    );
});


function getPlateformName(item) {
    return item.name.includes('APP') && 'APP' ||
        item.name.includes('小程序') && '小程序' ||
        item.name.includes('PC') && 'PC';
}

@connect(({ backgruondColor, tags, templateShow }) => ({
    backgruondColor,
    tags,
    templateShow,
}))
class EditPage extends React.Component {

    constructor(props) {
        super(props);
        this.content = React.createRef();
        this.materialDiv = React.createRef();
        this.video = React.createRef();
        const { checkTags } = props;
        this.plateform = null; // 已选平台
        // 检查平台
        if (checkTags) {
            checkTags.find((item) => {
                if (item.parentId === 9) {
                    this.plateform = getPlateformName(item);
                    return true;
                }
            });
        }
        this.state = {
            modalOpen: false,
            title: '',
            titleError: '',
            coverImg: '',
            previewUrl: '',
            bgColor: props.bgColor || '#fff',
            tagIds: new Set([]),
            checkTags: [],
            tagIdsError: '',
            recommend_tags: [],
            checkedPartiesType: [],
            checkedPartiesTypeError: '',
            templateDescribe: '',
            templateDescribeError: '',
            permission: 1,
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
            width: 807,
            fixedVideoDiv: false,
        };
    }


    componentDidMount() {
        //  初始化全选框//
        const { dispatch } = this.props;
        this.afterCheck();
        window.addEventListener('scroll', this.onScroll);
        dispatch({
            type: 'tags/fetch',
        });
    }


    componentWillUnmount() {
        window.removeEventListener('scroll', this.onScroll);
    }


    componentDidUpdate(prevProps, prevState) {
        if (!lodash.isEqualWith(prevState, this.state, (objValue, othValue, key) => {
            if (key === 'recommend_tags') {
                return true;
            }
        })) {
            // console.log(difference(prevState, this.state));
            const newState = certainFunction(this.state, [
                'id',
                'title',
                'tagIds',
                'checkTags',
                'transverse',
                'coverImg',
                'previewUrl',
                'videoDuration',
                'templateDescribe',
                'renderSetting',
                'permission',
                'bgColor',
            ]);
            if (this.state.page === 0) {
                newState.checkedPartiesType = this.state.checkedPartiesType;
                newState.editList = this.state.editList;
            } else {
                newState.templateDescribe = this.state.templateDescribe;
            }
            this.props.onChange(newState);
        } else if (!lodash.isEqual(prevState.checkedPartiesType, this.state.checkedPartiesType)) {
            this.onChangePartiType(this.state.checkedPartiesType);
        }

    }


    static getDerivedStateFromProps({ checkedPartiesType = [], ...nextProps }, prvState) {
        let newState = {};
        const { tags } = nextProps;
        const newTags = tags.list;
        // 错误验证
        const error = [
            'titleError',
            'coverImgError',
            'tagIdsError',
            'checkedPartiesTypeError',
            'templateDescribeError'];
        for (const e of error) {
            if (nextProps[e] !== undefined && nextProps[e] !== prvState[e]) {
                newState[e] = nextProps[e];
            }
        }
        if (nextProps.transverse !== prvState.transverse) {
            newState.transverse = nextProps.transverse;
        }
        // 如果 推荐标签为空 则 从modal 重新读取
        const { uploadType } = nextProps.templateShow;
        if (prvState.recommend_tags === undefined || prvState.recommend_tags.length === 0 ||
            nextProps.page !== prvState.page) {
            const type = (nextProps.page === 0 && uploadType === SEGMENT_TYPE.SEGMENT_GROUP)
                ? SEGMENT_TYPE.SEGMENT_PARTY
                : uploadType; // 如果是第一页，则取标签为单片段的标签
            newState.recommend_tags = newTags.filter(item => fliterLabels(item.id, type));
        }
        if (nextProps.id !== prvState.id) {
            newState = {
                ...newState,
                ...nextProps,
                checkedAll: afterCheck(nextProps.editList),
                checkTags: findFatherName(newTags,
                    nextProps.checkTags.filter(v => !partiesTypeIds.includes(v.id))),
                checkedPartiesType: nextProps.checkTags.filter(v => partiesTypeIds.includes(v.id))
                    .map(v => v.id),
            };
            if (nextProps.page === 0) {
                newState.partiesType = changePatyTypeDisabled(
                    checkedPartiesType.length > 0
                        ? checkedPartiesType
                        : newState.checkedPartiesType,
                    nextProps.partiesType);
                newState.checkedPartiesType = checkedPartiesType;
            }
        }
        newState.page = nextProps.page;
        return newState;
    }

    /**
     * 滚动事件，在滚动调超过 素材框时把video 设置成fixed
     * @param e
     */
    onScroll = (e) => {
        const offsetTop = this.materialDiv.current.getBoundingClientRect().top;
        if (offsetTop < 100) {
            this.setState({ fixedVideoDiv: true });
        } else {
            this.setState({ fixedVideoDiv: false });
        }
    };
    /**
     * 重新排序
     * @param oldIndex 原索引
     * @param newIndex 新索引
     * @returns {boolean}
     */
    onSortEnd = ({ oldIndex, newIndex }) => {
        const { state: { editList }, } = this;
        if (newIndex < 0 || newIndex > editList.length) {
            return false;
        }
        const newEditList = arrayMove(editList, oldIndex, newIndex)
            .map((v, i) => {
                return {
                    ...v,
                    sort: i,
                };
            });
        this.setState({ editList: newEditList });
    };

    /**
     * 打开的通用方法
     * @param callBack 回调函数
     * @param isFrame 是否frame 是的话直接传入地址会自动拼接
     * @param children 不是frame 的话可以传入子组件
     */
    onOpen = (callBack, isFrame = false, children = '') => {
        const content = isFrame ? <iframe
            src={`${env.host.auth}${isFrame}?t=${new Date().getTime()}&source=music&notShowSys=true`}
            scrolling="no" frameBorder="0"
            style={{
                width: 960,
                height: 600,
                display: 'block',
                lineHeight: 0,
                fontSize: 0,
            }}
        /> : children;
        window.addEventListener('message', callBack);
        this.setState({
            modalOpen: true,
            modalContent: content,
        });
    };
    /**
     * 关闭 modal框,取消监听事件
     */
    onClose = () => {
        window.removeEventListener('message', this.getImgMessage);
        this.setState({
            modalOpen: false,
            modalContent: '',
        });
    };
    // 触发改变封面事件
    onChangeCoverImg = () => {
        this.setState({
            nowAspectRatio: false,
            callbackFunction: this.afterChangeCoverImg,
        });
        this.onOpen(this.getImgMessage, '/material/image');
    };
    /**
     * 抓取图片选择的URL地址
     * @param message
     */
    getImgMessage = (message) => {
        const data = formatEQXMessage(message);
        if (data === false) {
            return;
        }
        if (data.type === 'close') {
            this.onClose();
        }
        if (data.type === 'success') {
            this.onClose();
            const picUrl = env.host.musicFile + data.data[0].path;
            const cropperProps = {};
            const { videoHeight, videoWidth } = this.video.current || {};
            if (videoHeight && videoWidth) {
                cropperProps.aspectRatio = videoWidth / videoHeight;
            } else {
                cropperProps.hoz = this.props.transverse ? 'hoz' : 'ver';
            }
            this.onOpen(() => {
            }, false, <Cropper {...cropperProps} image={picUrl}
                               onClose={this.onClose}
                               onChange={this.state.callbackFunction}/>);
        }
    };
    /**
     * 改变封面
     * @param url
     */
    afterChangeCoverImg = (url) => {
        this.setState({ coverImg: imageUtil.genUrl(url) });
        this.onClose();
    };
    onChangePartiType = (checkedValues) => {
        const partiesType = changePatyTypeDisabled(checkedValues, this.state.partiesType);
        this.setState({
            checkedPartiesType: checkedValues,
            partiesType,
        });
    };

    onChangePermission = (checkedValues) => {
        this.setState({ permission: checkedValues.reduce((t, a) => t + a) });
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
    onChangeMaxLength = (index, value) => {
        const { editList } = this.state;
        editList[index].maxLength = value;
        this.setState({ editList });
    };
    onChangeBgColor = (bgColor) => {
        this.setState({ bgColor });
    };
    /**
     * 标题修改
     * @param value
     */
    onTitle = (value) => {
        this.setState({ title: value });
    };
    /**
     * 简介修改
     * @param value
     */
    onTemplateDescribe = (value) => {
        this.setState({ templateDescribe: value });
    };

    /**
     * 全选框处理
     * @param elist 如果传入新的elist 就用新的
     */
    afterCheck = (elist = false) => {
        const editList = elist || this.state.editList;
        const checkedAll = afterCheck(editList);
        this.setState({ checkedAll });
    };

    /**
     * 点击全选事件
     * 如果是全选就改成全不选,否则全选
     */
    onCheckAll = () => {
        const { editList, checkedAll } = this.state;
        const newStatus = checkedAll !== 2;
        const newArray = editList.map((item) => {
            return {
                ...item,
                replaceable: newStatus,
            };
        });
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
        const { checkTags, tagIds } = this.state;
        const removeTarget = checkTags.splice(index, 1);
        tagIds.delete(removeTarget[0].params);
        if (!checkTags.some(v => v.parentId === 9)) {
            this.plateform = null;
        }
        this.setState({
            checkTags,
            tagIds,
        });
    };
    /**
     * 添加标签
     * @param item
     * @param checked
     * @param parent
     */
    addTag = (item, checked = true, parent = {}) => {
        const oldTags = this.state.checkTags;
        const { tagIds } = this.state;
        item.parent = parent.name;
        if (parent.id === 9) {
            if (!this.plateform) {
                this.plateform = getPlateformName(item);
            } else if (!item.name.includes(this.plateform)) {
                message.error('只能选一个平台');
                return false;
            }
        }
        let checkTags = [];
        if (checked) {
            checkTags = [...oldTags, item];
            tagIds.add(item.params);
        } else {
            checkTags = oldTags.filter(value => item.params !== value.params);
            tagIds.delete(item.params);
            if (!checkTags.some(v => v.parentId === 9)) {
                this.plateform = null;
            }
        }
        this.setState({
            checkTags,
            tagIds,
        });
    };
    /**
     * 提交审核
     * @returns {boolean}
     */
    onSubmit = () => {
        this.props.onSubmit();
    };
    onSave = (e) => {
        this.props.onSave(e);
    };

    empty = () => {

    };

    render() {
        const { state, props: { noVideo = false, readOnly = false, noSave = false, width = 807, uploadType, ...props } } = this;
        const { bgColor } = state;
        const sortFunction = {
            sortEnd: this.onSortEnd,
            onCheck: this.onCheck,
            onChangeMaxLength: this.onChangeMaxLength,
        };
        const hasBg = [
            SEGMENT_TYPE.SEGMENT_WORD,
            SEGMENT_TYPE.SEGMENT_IMAGE,
            SEGMENT_TYPE.SEGMENT_ORNAMENT,
            SEGMENT_TYPE.SEGMENT_COATING].includes(uploadType);
        const hasAuthority = [SEGMENT_TYPE.SEGMENT_WORD, SEGMENT_TYPE.SEGMENT_IMAGE].includes(uploadType);
        // 提交按钮形态更改
        let submitButton = '';
        if (readOnly && props.page === 2) {
            submitButton = '';
        } else if (readOnly) {
            submitButton = <Button className={styles.submitButton}
                                   onClick={this.onSubmit}>下一步</Button>;
        } else if (props.page === 2) {
            submitButton = <Button className={styles.submitButton}
                                   onClick={this.onSubmit}>提交审核</Button>;
        } else {
            switch (props.renderStatus) {
                case 0:
                    submitButton = <Button className={styles.submitButton}
                                           onClick={this.onSubmit}>下一步</Button>;
                    break;
                case 1:
                    submitButton = <Button className={styles.submitButton}
                                           onClick={this.onSubmit}>下一步</Button>;
                    break;
                case 2:
                    submitButton =
                        <Button className={[styles.submitButton, styles.disabled].join(' ')}
                                onClick={this.onSubmit}>下一步</Button>;
                    break;
                case 3:
                    submitButton = <Button className={styles.submitButton}
                                           onClick={this.onSubmit}>渲染失败</Button>;
                    break;
                case 4:
                    submitButton = <Button className={styles.submitButton}
                                           onClick={this.onSubmit}>下一步</Button>;
                    break;
            }

        }
        // 单个标签渲染
        const OneTag = ({ item, parent }) => {
            if (parent.id === ColorLabelId) {
                return (
                    <li><Checkbox key={item.params}
                                  checked={state.tagIds.has(item.params)}
                                  onChange={e => {
                                      this.addTag(item, e.target.checked, parent);
                                  }}>{colorDiv({
                        backgroundColor: item.color,
                        size: 20,
                    })}</Checkbox></li>
                );
            } else {
                if (parent.id === 9) {
                    // 平台作品
                    if (this.plateform && !item.name.includes(this.plateform)) {
                        return null;
                    }
                }
                return (
                    <li><Tag key={item.params}
                             checked={state.tagIds.has(item.params)}
                             onChange={readOnly ? this.empty : checked => {
                                 this.addTag(item, checked, parent);
                             }}>{item.name}</Tag></li>
                );
            }
        };
        return (
            <div className={styles.content}>
                <div>
                    <div className={styles.left}>
                        <div className={styles.img_div}
                             style={{ backgroundColor: bgColor }}
                             onClick={readOnly ? this.empty : this.onChangeCoverImg}>
                            <div className={styles.sticky}>视频封面</div>
                            {!readOnly && <span className={styles.changeCover}>更换封面</span>}
                            <img src={imageUtil.genUrl(state.coverImg, '239:247')}/>
                        </div>
                    </div>
                    <div className={styles.right}>
                        <div className={styles.one_info}>
                            <label>模板标题</label>
                            <span className={styles.errorSpan}>{state.titleError}</span>
                            <div
                                className={`${styles.labelNextDiv} ${state.titleError && styles.errorInput}`}
                                style={{ width: 310 }}>
                                <Input
                                    len={15} value={String(state.title)} disabled={readOnly}
                                    errorBorder={true}
                                    onChange={this.onTitle}/>
                            </div>
                        </div>
                        {props.page !== 0 && <div className={styles.one_info}>
                            <label>模板介绍</label>
                            <span className={styles.errorSpan}>{state.templateDescribeError}</span>
                            <div
                                className={`${styles.labelNextDiv} ${state.templateDescribeError && styles.errorInput}`}
                                style={{ width }}>
                                <Input
                                    len={50} value={state.templateDescribe} disabled={readOnly}
                                    errorBorder={true}
                                    onChange={this.onTemplateDescribe}/>
                            </div>
                        </div>}
                        {hasBg && <div className={styles.one_info}>
                            <label>封面背景色</label>
                            <div className={styles.labelNextDiv} style={{ width }}>
                                <SingleColorPicker
                                    placement="right"
                                    currentColor={bgColor}
                                    width={170} height={30}
                                    disabled={readOnly}
                                    onChange={this.onChangeBgColor}/>
                            </div>
                        </div>}
                        {hasAuthority && <div className={styles.one_info}>
                            <label>使用权限</label>
                            <div className={styles.labelNextDiv}>
                                <Checkbox.Group
                                    options={Authoritys}
                                    disabled={readOnly}
                                    value={Authoritys.map(i => state.permission & i.value)}
                                    onChange={this.onChangePermission}
                                />
                            </div>
                        </div>

                        }
                        <div className={styles.one_info}>
                            <label>设置片段标签</label>
                            {(props.page === 0
                                || [SEGMENT_TYPE.SEGMENT_PARTY].includes(
                                    props.templateShow.uploadType)) &&   // 如果不是第一页，或者是单片段
                            <React.Fragment>
                                <div className={styles.infoRow}>
                                    <div
                                        className={styles.errorSpan}>{state.checkedPartiesTypeError}</div>
                                    <span className={styles.rowTitle}>片段类型：&nbsp;</span>
                                    <Checkbox.Group options={state.partiesType}
                                                    value={state.checkedPartiesType}
                                                    disabled={readOnly}
                                                    onChange={this.onChangePartiType}/>
                                </div>
                            </React.Fragment>}
                            <div className={styles.labelNextDiv} style={{ width }}>
                                <div className={styles.errorSpan}>{state.tagIdsError}</div>
                                <div className={styles.tags_checked_div} style={{ width }}>
                                    <span className={styles.rowTitle}>已选择标签：</span>
                                    {state.checkTags && state.checkTags.map(
                                        (item, index) => {
                                            const tagProps = {
                                                closable: true,
                                                onClose: () => this.removeTag(index),
                                            };
                                            if (readOnly) {
                                                tagProps.closable = false;
                                                tagProps.onClose = null;
                                            }
                                            return <Tag key={item.params} {...tagProps}
                                                        style={{ backgroundColor: '#fff' }}>
                                                {item.color ?
                                                    <React.Fragment>{item.parent}: {
                                                        colorDiv(
                                                            { backgroundColor: item.color })}</React.Fragment>
                                                    : `${item.parent ||
                                                    '其他'}:${item.name}`}</Tag>;
                                        },
                                    )}
                                </div>
                                {!readOnly && <div className={styles.recommendTags}>
                                    <Labels data={state.recommend_tags} Fd={TagsRow} Cd={OneTag}
                                            noChildren={false}/>
                                </div>}
                            </div>
                        </div>
                    </div>
                    < div className='clearfix'/>
                </div>
                <div ref={this.materialDiv}>
                    {!noVideo && <div className={styles.left}>
                        <div className={[
                            styles.video_div,
                            state.fixedVideoDiv && styles.fixedVideoDiv].join(' ')}
                             style={{ backgroundColor: bgColor }}
                        >
                            <video width="239" height="252"
                                   crossOrigin='Anonymous'
                                   ref={this.video}
                                   poster={imageUtil.genUrl(state.coverImg, '239:252')}
                                   controls={true}
                                   src={genVideoUrl(state.previewUrl)}/>
                        </div>
                    </div>}
                    <div className={styles.right}>
                        <div style={{ minHeight: 200 }}>
                            {props.editList && props.editList.length > 0 &&
                            !(props.page === 2 && props.templateShow.uploadType ===
                                SEGMENT_TYPE.SEGMENT_GROUP) &&
                            <div className={styles.one_info}>
                                <label>{readOnly ? '替换素材' : '手动排序'}</label>
                                <div className={`${styles.labelNextDiv} ${styles.tableDiv}`}>
                                    <div className={styles.table_row} style={{ height: 40 }}>
                                        <div className={styles.td_check} style={{ height: 40 }}>
                                            <Checkbox indeterminate={state.checkedAll === 1}
                                                      checked={state.checkedAll === 2}
                                                      onChange={this.onCheckAll}
                                                      disabled={readOnly}
                                                      className={styles.checkbox}/>
                                        </div>
                                        <div style={{
                                            display: 'table-cell',
                                            paddingLeft: 10,
                                        }}>全选为可替换
                                        </div>
                                    </div>
                                </div>
                                <SortableList items={state.editList}
                                              readOnly={readOnly}
                                              onSortEnd={readOnly ? this.empty : this.onSortEnd}
                                              sortFunction={sortFunction}
                                              useDragHandle={true}/>
                            </div>}
                        </div>
                        <div className={styles.bottomBtnGroup}>
                            {!noSave && !readOnly && props.page === 2 &&
                            <Button onClick={this.onSave} className={styles.saveBtn}
                                    lite={1}>保存</Button>}
                            {props.templateShow.uploadType === 1 && props.page !== 0 &&
                            <Button className={styles.backButton}
                                    onClick={props.onBack}>上一步</Button>
                            }
                            {submitButton}
                        </div>
                    </div>
                    <div className='clearfix'/>
                </div>
                <Modal onCancel={this.onClose}
                       visible={state.modalOpen}>{state.modalContent}</Modal>
            </div>
        )
            ;
    }
}


export default EditPage;
