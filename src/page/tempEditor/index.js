import React from 'react';
import { connect } from 'dva';
import { prev } from 'Config/env';
import { setTitle } from 'Util/doc';
import { filter } from 'Util/data';
import { certainFunction } from 'Util/object';
import Uploader from 'Page/upload';
import Editor from './editor';
import styles from './index.less';
import Button from '../components/Button';
import { numberToChinese } from 'Util/data';
import PartySort from './PartySort';
import { arrayMove } from 'react-sortable-hoc';
import templateShowApi from 'Api/templateShow';
import { Breadcrumb, message } from 'antd';
import Icon from '../components/Icon';
import { addFilePath } from 'Util/file';
import * as routerRedux from 'react-router-redux';
import {
    getAllSegmentByShowker,
    getElementVerfiy,
    showGetDetial,
    showGetMateril,
} from '../../api/templateShow';
import { SEGMENT_TYPE } from '../../config/staticParams';
import { compatibleVideo } from '../../util/file';
import MyTemplate from './index/myTemplate';
import Statistics from './index/statistics';
import qs from 'qs';
import ConcatSet from './concatSet';
import { waitChoseModel } from '../components/delete';

/**
 * 公共验证规则
 * @type {*[]}
 */
const commonFilterRules = [
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
        attr: 'tagIds',
        rules: [
            {
                name: 'required',
                msg: '必须选择标签',
            }],
    },
];
const partyFilterRules = [
    ...commonFilterRules,
    {
        attr: 'checkedPartiesType',
        rules: [
            {
                name: 'required',
                msg: '必须选择类型',
            }],
    },
];
const MainFilterRules = [
    ...commonFilterRules,
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
];
export const partiesType = [
    {
        label: '内容片段',
        value: 42,
        disabled: false,
    },
    {
        label: '片头',
        value: 43,
        disabled: false,
    },
    {
        label: '片尾',
        value: 44,
        disabled: false,
    },
];

@connect(({ templateShow }) => ({ templateShow }))
class Index extends React.Component {
    constructor(props) {
        super(props);
        this.editorHeader = React.createRef();
        const { search } = this.props.location;
        const { tabIndex } = qs.parse(search.replace('?', '')) || {};
        this.state = {
            path: [
                [
                    {
                        path: `#`,
                        breadcrumbName: '片段上传与编辑',
                    }],
                [
                    {
                        path: this.onBack,
                        breadcrumbName: '片段上传与编辑',
                    },
                    {
                        path: '#',
                        breadcrumbName: '设置片段转场',
                    },
                ],
                [
                    {
                        path: this.onBack,
                        breadcrumbName: '片段上传与编辑',
                    },
                    {
                        path: '#',
                        breadcrumbName: '编辑视频模板',
                    },
                ],
            ],
            id: null,
            ids: new Set([]), // 用来ID 去重，没有顺序
            page: 0,
            permission: 1,
            openList: false,
            parties: [],
            title: '',
            previewUrl: '',
            templateDescribe: '',
            videoDuration: '',
            bgColor: '#fff',
            coverImg: '',
            checkTags: [],
            tagIds: new Set([]),
            nowPartiesIndex: 0,
            nowPartiesSpaceId: 0,
            status: 1, // 状态 0 = 未做片段的数量和顺序修改， 1 做了片段和数量修改没有请求渲染 2 请求渲染中 4 渲染完毕，等待跳转
            tabIndex: ~~tabIndex || 0,
        };
    }

    static getDerivedStateFromProps(nextProps, prvState) {
        const newState = {};
        const { templateShow: { templateId, renderStatus, renderVideoUrl, uploadType }, match: { params: { id } = {} } = {} } = nextProps;
        // 如果渲染中并且 model 的渲染状态是3 或者4 就改变渲染状态
        if (prvState.status === 2 && renderStatus !== prvState.status &&
            ([3, 4].includes(renderStatus))) {
            newState.status = renderStatus;
            if (renderStatus === 4) {
                newState.previewUrl = renderVideoUrl;
            }
        }
        if (uploadType && uploadType !== SEGMENT_TYPE.SEGMENT_GROUP && templateId && id) {
            newState.page = 2;
        }
        if (templateId && templateId !== prvState.id) {
            newState.id = templateId;
        }
        return newState;
    };

    componentDidMount() {
        const { props: { match: { params: { id = null } = {} } } } = this;
        // 如果 是编辑模板
        this.didMount(id);

        // this.onViladSuccess([
        //     {
        //         id: 1627,
        //         status: 4,
        //     },
        //     ]);
    }

    didMount = (id) => {
        if (id) {
            return getAllSegmentByShowker(id)
                .then((res) => {
                    const { data: { success = false, obj = {} } } = res;
                    if (success) {
                        this.props.dispatch({
                            type: 'templateShow/update',
                            payload: {
                                uploadType: obj.type,
                                templateId: id,
                                isLockTemplate: true,
                            },
                        });
                        obj.segments.forEach((item) => {
                            const materialRes = item.materials;
                            this.buildOneData(item, materialRes, item.id,
                                obj.type === SEGMENT_TYPE.SEGMENT_GROUP ? 0 : 2);
                            const { ids } = this.state;
                            ids.add(item.id);
                            this.setState({ ids });
                        });
                    }
                });
        }
    };

    reset = () => {
        this.props.dispatch({
            type: 'templateShow/reset',
        });
        this.setState({
            path: [
                [
                    {
                        path: `#`,
                        breadcrumbName: '片段上传与编辑',
                    }],
                [
                    {
                        path: this.onBack,
                        breadcrumbName: '片段上传与编辑',
                    },
                    {
                        path: '#',
                        breadcrumbName: '设置片段转场',
                    },
                ],
                [
                    {
                        path: this.onBack,
                        breadcrumbName: '片段上传与编辑',
                    },
                    {
                        path: '#',
                        breadcrumbName: '编辑视频模板',
                    },
                ],
            ],
            id: null,
            ids: new Set([]), // 用来ID 去重，没有顺序
            page: 0,
            openList: false,
            parties: [],
            title: '',
            previewUrl: '',
            templateDescribe: '',
            videoDuration: '',
            coverImg: '',
            checkTags: [],
            tagIds: new Set([]),
            nowPartiesIndex: 0,
            nowPartiesSpaceId: 0,
            status: 1, // 状态 0 = 未做片段的数量和顺序修改， 1 做了片段和数量修改没有请求渲染 2 请求渲染中 4 渲染完毕，等待跳转
        });
    };

    componentWillUnmount() {
        this.props.dispatch({
            type: 'templateShow/lock',
            payload: false,
        });
    }

    /**
     * 验证成功调用
     * @param id
     */
    onViladSuccess = (id) => {
        this.props.dispatch({
            type: 'templateShow/lock',
            payload: true,
        });
        if (this.props.templateShow.uploadType > SEGMENT_TYPE.SEGMENT_GROUP) {
            const { templateId } = this.props.templateShow;
            Promise.all(
                [showGetMateril(templateId), showGetDetial(templateId)])
                .then((result) => {
                    const [materialRes, detailRes] = result;
                    if (materialRes.data.success && detailRes.data.success) {
                        const { obj } = detailRes.data;
                        // 单片段直接去第二页
                        this.buildOneData(obj, materialRes.data.list, id, 2);
                    }
                });
            return;
        }
        let queryId = new Set([]);
        const sortParty = {};
        if (Array.isArray(id)) {
            for (let item of id) {
                // id去重和 去除失败项
                if (!this.state.ids.has(item.id) && [4, 5, 7].includes(~~item.status)) {
                    queryId.add(item.id);
                }
                // 排序
                sortParty[item.id] = item.sort;
            }
            // 完成后排序片段
            const queryIdArray = Array.from(queryId);
            const promiseArray = queryIdArray.map(this.getDetailAndMaterial);
            Promise.all(promiseArray)
                .then(res => {
                    const { parties } = this.state;
                    parties.sort((a, b) => {
                        return sortParty[a.id] - sortParty[b.id];
                    });
                    this.setState({ parties });
                    this.onChangeParty(0, parties[0].id);
                });
        }
    };
    /**
     * 获取详情和素材
     * @param id
     * @returns {Promise<[any , any , any , any , any , any , any , any , any , any] | never>}
     */
    getDetailAndMaterial = (id) => {
        return Promise.all(
            [showGetMateril(id), showGetDetial(id)])
            .then(
                (result) => {
                    const [materialRes, detailRes] = result;
                    if (materialRes.data.success && detailRes.data.success) {
                        const { obj } = detailRes.data;
                        this.buildOneData(obj, materialRes.data.list, id);
                        // 新家IDS
                        const { ids } = this.state;
                        ids.add(id);
                        this.setState({ ids });
                    }
                },
            );
    };
    /**
     * 构建单个片段数据
     * @param obj
     * @param materialRes
     * @param id
     */
    buildOneData = (obj, editList, id, page = 0) => {
        const tags = [];
        const tagIds = new Set([]);
        if (Array.isArray(obj.videoLabels)) {
            obj.videoLabels.forEach((item) => {
                tags.push({
                    ...item,
                    params: Number(item.id),
                });
                tagIds.add(item.id);
            });
        }
        const info = {
            title: obj.title,
            previewUrl: obj.videoComposeUrl || compatibleVideo(obj),
            templateDescribe: obj.templateDescribe,
            coverImg: obj.coverImg,
            checkTags: tags,
            bgColor: obj.bgColor || '#fff',
            tagIds,
            editList,
            id,
            checkedPartiesType: [],
            permission: obj.permission || 7,
            transverse: obj.transverse,
            videoDuration: obj.videoDuration,
            renderSetting: obj.renderSetting,
        };
        this.onInsert(info);
        this.setState({
            ...info,
            page,
        });
    };
    /**
     * 片段修改
     * @param newState
     */
    patyOnChange = (newState) => {
        const { nowPartiesIndex, nowPartiesSpaceId, parties } = this.state;
        if (nowPartiesIndex === true || nowPartiesSpaceId !== newState.id) {
            return false;
        }
        const newParties = parties.map((item) => {
            if (item.id === newState.id) {
                return { ...item, ...newState };
            } else {
                return item;
            }
        });
        this.setState({
            parties: newParties,
            openList: false,
        });
    };
    templateOnChange = (newState) => {
        this.setState({ ...newState });
    };
    /**
     * 插入新片段 空片段时需要把spaceId 指向第一个片段
     * @param obj
     */
    onInsert = (obj) => {
        const { parties } = this.state;
        if (parties.length === 0) {
            this.setState({ nowPartiesSpaceId: obj.id });
        }
        parties.push(obj);
        this.cancelRender();
        this.setState({
            parties,
            status: 1,
        }, this.forceUpdate);
    };
    /**
     * 删除片段 如果删除当前片段 需要把spaceId 指向第一个或者false；
     * @param index
     */
    onDelete = (index) => {
        const { parties, nowPartiesIndex } = this.state;
        parties.splice(index, 1);
        if (index === nowPartiesIndex) {
            this.setState({
                nowPartiesIndex: 0,
                nowPartiesSpaceId: parties[0] && parties[0].id,
            });
        }
        this.cancelRender();
        this.setState({
            parties,
            status: 1,
        });
    };
    /**
     * 重新排序
     * @param oldIndex 原索引
     * @param newIndex 新索引
     * @returns {boolean}
     */
    onSortEnd = ({ oldIndex, newIndex }) => {
        const { ids, parties, nowPartiesSpaceId } = this.state;
        // 如果新的顺序小于0 或者大于整个数量，或者没变化 则退出
        if (newIndex < 0 || newIndex > parties.length || oldIndex ===
            newIndex) {
            return false;
        }
        const newParties = arrayMove(parties, oldIndex, newIndex);
        const newIds = new Set(arrayMove(Array.from(ids), oldIndex, newIndex));
        let nowPartiesIndex = 0;
        newParties.forEach((item, index) => {
            if (item.id === nowPartiesSpaceId) {
                nowPartiesIndex = index;
            }
        });
        this.cancelRender();
        this.setState({
            parties: newParties,
            ids: newIds,
            nowPartiesIndex,
            status: 1,
        });
    };
    /**
     * 开关片段管理
     */
    toggleList = () => {
        this.setState({ openList: !this.state.openList });
    };
    closeList = () => {
        this.setState({ openList: false });
    };
    /**
     * 点击切换片段事件
     * @param nowPartiesIndex
     * @param nowPartiesSpaceId
     */
    onChangeParty = (nowPartiesIndex, nowPartiesSpaceId) => {
        this.setState({
            nowPartiesIndex,
            nowPartiesSpaceId,
            openList: false,
        });
    };
    onVaildParies = () => {
        const { parties } = this.state;
        for (let index = 0; index < parties.length; index += 1) {
            const item = parties[index];
            const error = filter(partyFilterRules, item);
            if (error !== true) {
                this.editorHeader.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });
                parties[index] = { ...parties[index], ...error };
                this.setState({ parties });
                this.onChangeParty(index, item.id);
                return false;
            }
        }
        return true;
    };
    /**
     * 提交 如果在第一个页面则跳到模板编辑
     */
    onSubmit = (e) => {
        const { state, props: { match: { params: { id: urlTemplateId = null, readOnly = false } = {} }, ...props } } = this;
        // 如果渲染中则直接返回
        if (state.status === 2) {
            console.log('渲染中...');
            return false;
        }
        // 如果没有更改过则直接跳到第二个页面
        if (readOnly || state.tabIndex === 0 && state.page === 0) {
            const coverImg = state.coverImg || state.parties[0].coverImg;
            if (!readOnly && this.onVaildParies() === false) {
                message.error('项目填写有误哦');
                return false;
            }
            this.setState({
                page: 1,
                nowPartiesIndex: true,
                nowPartiesSpaceId: true,
                coverImg,
            });
        } else if (readOnly || state.tabIndex === 0 && state.page === 1 &&
            (state.status === 0 || state.status === 4)) {
            this.setState({ page: 2 });
        } else if (state.tabIndex === 0 && state.page === 1) {
            // 发送渲染请求
            const param = state.parties.map((item, index) => ({
                templateId: item.id,
                sort: index,
                renderSetting: item.renderSetting,
            }));
            props.dispatch({
                type: 'templateShow/videoConcat',
                payload: {
                    param,
                    id: state.id,
                },
            });
            this.setState({ status: 2 });
        } else {
            // 保存请求 验证main是否有错
            const error = filter(MainFilterRules, this.state);
            if (error !== true) {
                message.error('项目填写有误哦。');
                this.editorHeader.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });
                this.setState({ ...error });
                return false;
            }
            this.sendSave(e, true);
        }
    }
        ;
    saving = false;

    /**
     * 发送保存信息
     * @param auditSubmit
     */
    async sendSave(e, auditSubmit = false) {
        const {
            props, state,
        } = this;
        if (this.saving) {
            message.info('正在保存中...请稍后');
        }
        this.saving = true;
        // 是否单片段
        const alone = props.templateShow.uploadType !== 1;
        // 格式化material
        const materialFormat = (m, i) => ({
            id: m.id,
            replaceable: m.replaceable,
            maxLength: ~~m.maxLength || 15,
            sort: m.sort,
        });
        // 验证是否需要提示
        const verfiyParams = {
            templateId: state.id,
            labels: state.checkTags.map(item => item.name),
        };
        const verfiyRespnose = await templateShowApi.getElementVerfiy(verfiyParams);
        const { data: { success = false, obj: verfiyMsg = null } = {} } = verfiyRespnose;
        if (verfiyMsg) {
            await waitChoseModel({
                sureBtn: '前去编辑',
                text: '模板申请失败',
                info: verfiyMsg,
            })
                .then(() => {
                    this.props.dispatch(routerRedux.push(`${prev}/scene`));
                })
                .catch(() => Promise.resolve(false));
            return;
        }

        const param = {
            groupId: state.id,
            coverImg: addFilePath(state.coverImg, 2),
            title: state.title,
            bgColor: state.bgColor,
            templateDescribe: state.templateDescribe,
            labelIds: Array.from(state.tagIds),
            auditSubmit,
            permission: state.permission,
            segments: state.parties.map((item, index) => ({
                id: alone ? state.id : item.id,
                title: alone ? state.title : item.title,
                coverImg: addFilePath(alone ? state.coverImg : item.coverImg, 2),
                sort: index,
                templateDescribe: alone ? state.templateDescribe : item.templateDescribe,
                permission: item.permission || 7,
                labelIds: Array.from(new Set(Array.from([
                    ...item.tagIds,
                    ...item.checkedPartiesType,
                    ...(alone ? state.checkedPartiesType : [])]))), // 去重
                materials: alone ? state.editList.map(materialFormat)
                    : item.editList.map(materialFormat),
            })),
        };
        templateShowApi.saveConfig(param)
            .then((res) => {
                if (res.data.success === true) {
                    this.props.dispatch({
                        type: 'templateShow/lock',
                        payload: false,
                    });
                    if (auditSubmit) {
                        this.props.dispatch(routerRedux.push(`${prev}/templateShow/success`));
                    } else {
                        this.props.dispatch(routerRedux.push(`${prev}/templateShow?tabIndex=1`));
                    }
                }
            })
            .final((res) => this.saving = false);
    }

    // 取消合并渲染
    cancelRender = () => {
        const { state, props: { dispatch } } = this;
        if (state.status === 2) {
            dispatch({
                type: 'templateShow/cancelVaild',
            });
        }
    };
    onBack = () => {
        this.setState({
            page: 0,
            nowPartiesIndex: 0,
            nowPartiesSpaceId: this.state.parties[0].id,
        });
    };
    changeTab = (index) => {
        this.reset();
        this.setState({ tabIndex: index });
    };

    render() {
        const {
            state,
            props: {
                match: {
                    params: {
                        id: urlTemplateId = null, readOnly = false,
                    }
                    = {},
                }, ...
                props
            },
        } = this;
        // 如果不是二次编辑 第一页， 而且是模板组
        const noSave = (state.page === 0 && urlTemplateId === null &&
            props.templateShow.uploadType === SEGMENT_TYPE.SEGMENT_GROUP)
            || (props.templateShow.uploadType === SEGMENT_TYPE.VIDEO_GROUP_TEMPLATE);
        const editObj = state.page === 0
            ? state.parties[state.nowPartiesIndex]
            : (props.templateShow.uploadType !== SEGMENT_TYPE.SEGMENT_GROUP
                ? {
                    ...state.parties[0],
                    ...certainFunction(this.state, ['titleError', 'templateDescribeError', 'tagIdsError']),
                }
                :
                certainFunction(this.state, [
                    'id',
                    'title',
                    'previewUrl',
                    'templateDescribe',
                    'coverImg',
                    'checkTags',
                    'tagIds',
                    'titleError',
                    'editList',
                    'templateDescribeError',
                    'bgColor',
                    'coverImg',
                    'permission',
                    'transverse',
                    'renderSetting',
                    'tagIdsError'])
            );
        if (editObj) {
            editObj.uploadType = this.props.templateShow.uploadType;
        }
        // 片段管理的props
        const PartySortProps = {
            items: state.parties,
            lockAxis: 'y',
            axis: 'y',
            distance: 5,
            lockToContainerEdges: true,
            helperClass: styles.table_row_sorting,
            onSortEnd: this.onSortEnd,
            sortFunction: {
                sortEnd: this.onSortEnd,
                delete: this.onDelete,
            },
            onClose: this.closeList,
        };
        // 编辑器的props
        const editProps = {
            ...editObj,
            readOnly,
            noSave,
            transverse: state.page === 0
                ? editObj && editObj.transverse
                : state.parties[0] && state.parties[0].transverse || false,
            page: state.page,
            partiesType,
            onChange: state.page === 0
                ? this.patyOnChange
                : this.templateOnChange,
            onSubmit: this.onSubmit,
            onSave: () => this.sendSave(true),
            onBack: this.onBack,
            renderStatus: state.status,
            rules: state.page === 0 ? partyFilterRules : MainFilterRules,
        };
        const concatSetProps = {
            readOnly,
            noSave,
            onSubmit: this.onSubmit,
            onBack: this.onBack,
            setState: (data) => this.setState(data),
            transverse: editProps.transverse,
            parties: state.parties,
            renderStatus: state.status,
        };
        const tabs = ['上传模板', '我的模板', '使用统计'];
        return (
            <div>
                {!urlTemplateId && <div className={styles.tab}>
                    {tabs.map((item, index) => {
                        const className = index === state.tabIndex ? styles.active : '';
                        return <div key={index} className={className}
                            onClick={() => this.changeTab(index)}>{item}</div>;
                    })}
                </div>}
                {state.tabIndex === 0 && <React.Fragment>
                    {props.templateShow.uploadType === 1 && !readOnly &&
                        <Breadcrumb separator='>'>
                            {state.path[state.page].map(item =>
                                (<Breadcrumb.Item
                                    key={item.breadcrumbName}>{item.path === '#'
                                        ? item.breadcrumbName
                                        :
                                        <a onClick={this.onBack}>{item.breadcrumbName}</a>}</Breadcrumb.Item>),
                            )}
                        </Breadcrumb>}
                    {state.page === 0 && !readOnly &&
                        <Uploader {...props} templateId={state.id}
                            onViladSuccess={this.onViladSuccess} />}
                    {state.parties.length > 0 && state.page !== 1 &&
                        <div className={styles.parties} ref={this.editorHeader}>
                            {state.page === 0 && <div className={styles.tabBar}>
                                <ul className={styles.titleUl}>
                                    {state.parties.map((item, index) => (
                                        <li key={index}
                                            onClick={() => this.onChangeParty(index,
                                                item.id)}
                                            className={state.nowPartiesSpaceId ===
                                                item.id ? styles.active : ''}>
                                            片段{index + 1}</li>
                                    ))}
                                </ul>
                                {!readOnly && <Button className={styles.partesButton}
                                    onClick={this.toggleList}><Icon
                                        type='eqf-setting-f' />&nbsp;&nbsp;片段管理</Button>}
                                <div>
                                    {state.openList && <div className={styles.sortList}>
                                        <PartySort {...PartySortProps} />
                                    </div>}
                                </div>
                            </div>}
                            <div style={{ padding: '0 40px' }}>
                                <Editor  {...editProps} />
                            </div>
                        </div>}
                    {state.parties.length > 0 && state.page === 1 &&
                        <ConcatSet {...concatSetProps} />
                    }
                </React.Fragment>}
                {state.tabIndex === 1 &&
                    <MyTemplate showStatistics={(data) => this.setState(data)} />}
                {state.tabIndex === 2 && <Statistics searchKey={state.searchKey} />}
            </div>
        );
    }
};

export default Index;
