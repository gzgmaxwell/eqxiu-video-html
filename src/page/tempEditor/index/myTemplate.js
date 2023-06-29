import React, { Component } from 'react';
import { connect } from 'dva';
import { Popover, message } from 'antd';
import styles from './myTemplate.less';
import { compatibleVideo, genVideoUrl } from '../../../util/file';
import { genUrl } from '../../../util/image';
import Pagination from 'Components/pagination';
import Modal from 'Components/modal';
import Icon from 'Components/Icon';
import Select from 'Components/input/select';
import { SEGMENT_NAME, SEGMENT_TYPE, TEMPLATE_STATUS } from '../../../config/staticParams';
import { getInfo, deleteTemplate } from '../../../api/templateShow';
import DeleteModal from '../../components/delete';
import { routerRedux } from 'dva/router';
import { prev, host } from '../../../config/env';
import Editor from '../editor';
import { certainFunction } from '../../../util/object';
import { getOrginId } from '../../../api/userVideo';

@connect(({ tempEditor }) => ({ tempEditor }))
export default class MyTemplate extends Component {
    state = {
        url: null,
        title: null,
    };
    searchParams = {
        pageNo: 1,
        pageSize: 20,
        status: null,
        templateType: null,
        orderBy: 'update_time desc',
    };

    componentDidMount() {
        this.getData();
    }

    componentWillUnmount() {
        this.props.dispatch({
            type: 'tempEditor/reset',
            payload: {
                list: [],
                total: 0,
            },
        });
    }

    /**
     * 获取数据
     * */
    getData = () => {
        this.setState({
            loading: true,
        });
        this.props.dispatch({
            type: 'tempEditor/getData',
            payload: {
                ...this.searchParams,
            },
        })
            .then(() => {
                this.setState({
                    loading: false,
                });
            });
    };

    /**
     * 关闭和打开图片和视频预览的页面
     * */
    setVisible(url, title) {
        this.setState({
            url,
            title,
        });
    };

    /**
     * 翻页
     * */
    onPageChange = (pageNo) => {
        this.setSearchParams({ pageNo });
        this.getData();
    };
    /**
     * 搜索条件改变
     */
    handleChange = (name, value) => {
        this.setSearchParams({ [name]: value });
        this.search();
    };
    /**
     * 设置搜索的条件
     * */
    setSearchParams = (newParams = {}) => {
        this.searchParams = {
            ...this.searchParams,
            ...newParams,
        };
    };
    search = () => {
        this.setSearchParams({ pageNo: 1 });
        this.getData();
    };
    status = [
        {
            title: '申请上架状态',
            value: null,
        },
        {
            title: '渲染中',
            value: TEMPLATE_STATUS.rendering,
        },
        {
            title: '渲染失败',
            value: TEMPLATE_STATUS.render_failed,
        },
        {
            title: '未申请',
            value: TEMPLATE_STATUS.not_apply,
        },
        {
            title: '申请中',
            value: TEMPLATE_STATUS.applying,
        }, {
            title: '申请成功',
            value: TEMPLATE_STATUS.apply_successful,
        }, {
            title: '申请失败',
            value: TEMPLATE_STATUS.apply_failed,
        },
    ];
    handleTemplateStatus = (item) => {
        const { id, title, type, status, updateTime, info = '暂无信息', videoWorksId } = item;
        const { errorInfo = '加载中...' } = this.state;
        const isVideoGroupTem = type === SEGMENT_TYPE.VIDEO_GROUP_TEMPLATE;
        let statusEle = null;
        let showApply = false;  // 申请上架按钮
        let showEdit = false;   // 编辑按钮
        let showDelete = false; // 删除按钮
        let showStatistics = false; // 查看使用统计按钮
        let showInfo = false; // 查看申请信息按钮
        switch (status) {
            case TEMPLATE_STATUS.rendering:
                statusEle = <span style={{ color: '#F89300' }}>渲染中</span>;
                break;
            case TEMPLATE_STATUS.not_apply:
                statusEle = <span style={{ color: '#999999' }}>未申请</span>;
                showApply = true;
                showEdit = isVideoGroupTem;
                showDelete = true;
                break;
            case TEMPLATE_STATUS.applying:
                statusEle = <span style={{ color: '#F89300' }}>申请中</span>;
                showInfo = true;
                showDelete = true;
                break;
            case TEMPLATE_STATUS.apply_successful:
                statusEle = <span style={{ color: '#1BC7B1' }}>申请成功</span>;
                showStatistics = true;
                break;
            case TEMPLATE_STATUS.apply_failed:
                showEdit = isVideoGroupTem;
                showDelete = true;
                statusEle = <div className={styles.failed}>
                    <span style={{ color: '#FF296A' }}>申请失败</span>
                    <Popover placement="bottom" content={errorInfo}
                             onVisibleChange={(showError) => this.getErrorInfo(id, showError)}>
                        <Icon type="eqf-why-f" className={styles.reason} />
                    </Popover>
                </div>;
                break;
            case TEMPLATE_STATUS.render_failed:
                statusEle = <div className={styles.failed}>
                    <span style={{ color: '#FF296A' }}>渲染失败</span>
                </div>;
                showDelete = true;
                break;
            default:
                break;
        }
        let operationEle = <div className={styles.operation}>
            {showApply &&
            <span className={styles.apply}
                  onClick={() => this.applyTemplate(item)}>申请上架</span>}
            {showEdit && <span className={styles.edit}
                               onClick={() => this.editorWorks(id, videoWorksId)}>编辑</span>}
            {showDelete &&
            <span className={styles.delete} onClick={() => this.onOpen(id)}>删除</span>}
            {showStatistics &&
            <span className={styles.statistics}
                  onClick={() => this.showStatistics(title)}>查看使用统计</span>}
            {showInfo &&
            <div onClick={() => this.applyTemplate(item, true)}
                 className={styles.info}>查看申请信息
            </div>
            }
        </div>;
        return [
            <td key={`${id}-status`}>{statusEle}</td>,
            <td key={`${id}-updateTime`}>{updateTime}</td>,
            <td key={`${id}-operation`}>{operationEle}</td>,
        ];
    };

    loopGeting = async () => {

    };
    showStatistics = (searchKey) => {
        this.props.showStatistics({
            tabIndex: 2,
            searchKey,
        });
    };
    getErrorInfo = (id, showError) => {
        if (showError) {
            getInfo(id)
                .then(({ data }) => {
                    this.setState({ errorInfo: data.obj.auditOpinions || '暂无原因' });
                });
        } else {
            this.setState({ errorInfo: undefined });
        }
    };
    onClose = () => {
        this.setState({
            showDeleteModal: false,
            showApply: false,
        });
    };
    onOpen = (id) => {
        this.deleteId = id;
        this.setState({
            showDeleteModal: true,
        });
    };
    onDelete = () => {
        deleteTemplate([this.deleteId])
            .then(() => {
                this.deleteId = null;
                this.onClose();
                this.search();
            });
    };
    editorWorks = (id, videoWorksId) => {
        getOrginId(videoWorksId)
            .then(res => {
                const { data: { success = false, obj: { videoId, templateId }, message: resMsg = '无法获取Id' } = {} } = res;
                if (success) {
                    window.open(`${prev}/editor/${templateId}/${videoId}`);
                } else {
                    message.error(resMsg);
                    return false;
                }
            });
    };
    // 申请上架 id：模板ID  isVideoGroupTem：是否是作品模板
    applyTemplate = (item, readOnly = false) => {
        const { id } = item;
        // if (isVideoGroupTem) {
        //     this.props.didMount(item.id)
        //         .then(res => {
        //             this.setState({
        //                 showApply: true,
        //                 applyItem: item,
        //             });
        //         });
        // } else {
        let url = `${host.client}/templateShow/editor/${id}`;
        if (readOnly) {
            url += '/true';
        }
        window.open(url);
        // }
    };

    render() {
        const { tempEditor, templateOnChange, onSubmit, sendSave, MainFilterRules, editObj = {} } = this.props;
        const { list, total } = tempEditor;
        const { url, title, loading, showDeleteModal, showApply, applyItem = {} } = this.state;
        const { pageNo, pageSize } = this.searchParams;
        const currentEditObj = certainFunction(applyItem, [
            'id',
            'title',
            'previewUrl',
            'templateDescribe',
            'coverImg',
            'transverse',
        ]);
        // 编辑器的props
        const editProps = {
            ...editObj,
            ...currentEditObj,
            editList: [],
            width: 569,
            noVideo: true,
            noSave: true,
            transverse: currentEditObj.transverse,
            page: 1,
            partiesType: [],
            onChange: templateOnChange,
            onSubmit: onSubmit,
            onSave: () => sendSave(true),
            onBack: this.onBack,
            renderStatus: 4,
            rules: MainFilterRules,
        };
        return (<div className={styles.container}>
                <table className={styles.table}>
                    <thead className={styles.thead}>
                    <tr>
                        <th className={styles.id}>ID</th>
                        <th className={styles.video}>模板标题</th>
                        <th className={styles.type}>模板类型</th>
                        <th className={styles.status}>
                            <Select options={this.status} placeholder={'申请上架状态'} allowClear={true}
                                    onSelect={(value) => this.handleChange('status',
                                        value || null)} />
                        </th>
                        <th className={styles.update__time}>更新时间</th>
                        <th className={styles.operation}>操作</th>
                    </tr>
                    </thead>
                    <tbody className={styles.tbody}>
                    {list.length > 0 ? list.map((item, index) => {
                        const { id, coverImg, title, type, previewUrl } = item;
                        return (<tr key={id}>
                            <td>{id}</td>
                            <td className={styles.video}>
                                <div>
                                    <img src={genUrl(coverImg, '48:48')}
                                         onClick={() => this.setVisible(item.videoComposeUrl
                                             ? genVideoUrl(
                                                 item.videoComposeUrl)
                                             : compatibleVideo(item,
                                                 true),
                                             title)} />
                                </div>
                                {title}</td>
                            <td>{SEGMENT_NAME[type] ? SEGMENT_NAME[type].name : <div
                                className={styles.type}>模板</div>}</td>
                            {this.handleTemplateStatus(item)}
                        </tr>);
                    }) : <tr>
                        <td colSpan={6} className={styles.noData}>{loading
                            ? '加载中...'
                            : '暂无数据'}</td>
                    </tr>}
                    </tbody>
                </table>
                {total >= pageSize &&
                <div className={styles.pagination}>
                    <Pagination total={total} pageSize={pageSize}
                                showQuickJumper={true}
                                onChange={this.onPageChange}
                                current={parseInt(pageNo || 0)} />
                </div>}
                <Modal
                    visible={!!url}
                    header={<div
                        className={styles.modal__header}>{`${title}${this.state.videoLoaded
                        ? ''
                        : '-loading'}`}</div>}
                    onCancel={() => this.setVisible()}
                >
                    <video autoPlay onCanPlay={() => this.setState({ videoLoaded: true })} controls
                           src={url}
                           crossOrigin='Anonymous'
                           style={{
                               maxHeight: 500,
                               maxWidth: 800,
                               display: 'block',
                               backgroundColor: '#000',
                           }} />
                </Modal>
                <DeleteModal onClose={this.onClose} onDelete={this.onDelete}
                             className={'deleteModal'}
                             cancelText={'暂不'}
                             text={'是否删除此模板？'}
                             visible={showDeleteModal} />
            </div>
        );
    }
}
