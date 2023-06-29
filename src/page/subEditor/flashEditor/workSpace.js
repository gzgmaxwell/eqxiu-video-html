import React, { Component } from 'react';
import styles from './workspace.less';
import { connect } from 'dva';
import Icon from '../../components/Icon';
import { CANVAS_TYPE } from '../../../config/staticParams';
import { genUrl } from '../../../util/image';
import Cropper from '../../components/cropper';
import { SortableContainer, SortableElement, arrayMove } from 'react-sortable-hoc';
import { message, Popover, Checkbox } from 'antd';
import { formatEQXMessage } from '../../../util/event';
import { localStorageKey as lsKey, getItem, setItem } from '../../../util/storageLocal';
import eventEmitter from '../../../services/EventListener';
import { host } from 'Config/env';
import env from '../../../config/env';
import Modal from '../../components/modal';
import DeleteModal from '../../components/delete';

//单个片段和整个容器拖入区分
let handleDragFlag = false;
let handleDragAddImgFlag = false;
let dragActiveFn = false;

/**
 * 删除/替换提示信息
 * @param {*} options
 */
const VideoDeleteModal = ({ opts }) => (
    <DeleteModal
        visible={opts.showDelete}
        onClose={opts.onCancelDelete}
        text={
            <React.Fragment>
                {
                    opts.isReplace ?
                        <div>
                            <div>新的图片内容将替换原有内容，确定替换吗？</div>
                            <Checkbox className={styles.flasCheckbox}
                                      onChange={opts.handleChange}>不再提醒</Checkbox>
                        </div>
                        : '删除片段后无法恢复，确定删除？'
                }
            </React.Fragment>
        }
        onDelete={opts.isReplace ? () => opts.replaceDidDelete(opts.uuid, opts.dragImgPathId) : opts.didDelete}
    />
);

@SortableElement
class SortableElements extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showDelete: false,
            dragActive: false,
            isReplace: false //是否替换原有片段数据
        };
    }

    handleDelete = () => {
        this.setState({ showDelete: true });
    };
    didDelete = () => {
        const { dispatch, uuid } = this.props;
        dispatch({
            type: 'flash/delete',
            payload: uuid,
        });
    };
    /**
     * 替换图片确定回调
     */
    replaceDidDelete = (uuid, pathId) => {
        // dispatch({
        //     type: 'flash/delete',
        //     payload: uuid,
        // });
        this.setState({
            showDelete: false,
            isReplace: false
        }, () => {
            //图片裁剪
            this.props.handleCut(`${host.musicFile}${pathId}`, uuid);
        });
    };
    onCancelDelete = () => {
        this.setState({
            showDelete: false,
            isReplace: false
        });
    };

    handleDragEnter = (e) => {
        e.preventDefault();
        // e.stopPropagation();
        const pathId = e.dataTransfer.getData('pathId');
        handleDragFlag = true;
        dragActiveFn = false;
        if (!dragActiveFn) {
            // dragActiveFn = true;
            this.setState({
                dragActive: true
            });
        }
    };
    handleDragLeave = (e) => {
        e.preventDefault();
        const pathId = e.dataTransfer.getData('pathId');
        handleDragFlag = false;
        dragActiveFn = true;
        this.setState({
            dragActive: false
        });
    };
    /**
     * 放置元素
     * @param uuid 被放置片段的uuid
     * @param container 当前片段容器
     */
    handleDrop = (e, uuid, container) => {
        e.preventDefault();
        //当前拖拽图片pathId
        const pathId = e.dataTransfer.getData('pathId');
        //替换提示信息
        const key = getItem(lsKey.flashReplaceCked) || false;
        let showDelete = false;
        this.setState({
            dragImgPathId: pathId || ''
        });
        //是否勾选不再提醒
        if (!key) {
            showDelete = true;
        } else {
            showDelete = false;
            //图片裁剪
            this.props.handleCut(`${host.musicFile}${pathId}`, uuid);
        }
        dragActiveFn = false;
        this.setState({
            dragActive: false,
            isReplace: showDelete,
            showDelete
        });


    };

    /**
     * 不再提示 复选框
     */
    handleChange = (e) => {
        const { checked } = e.target;
        setItem(lsKey.flashReplaceCked, checked);
    };

    /**
     * 片段激活事件
     */
    handleItemClick = (e) => {
        e.stopPropagation();
        const { dispatch, uuid } = this.props;
        dispatch({
            type: 'flash/activeStatus',
            payload: {
                uuid
            }
        });
    };

    hover = () => {
        this.setState({
            isHover: true
        });
    };
    out = () => {
        this.setState({
            isHover: false
        });
    };

    render() {
        const {
            flash_type, flash_content, flash_oriContent, uuid, activeStatus,
            openIndex, openInput, handleBlur, handleFocus, handleInput, handleReplace, handleCut, textareaFocus
        } = this.props;
        const { showDelete, isReplace, dragImgPathId, isHover = false, dragActive } = this.state;

        const videoModalOpts = {
            uuid,
            dragImgPathId,
            showDelete,
            isReplace,
            onCancelDelete: this.onCancelDelete,
            handleChange: this.handleChange,
            replaceDidDelete: this.replaceDidDelete,
            didDelete: this.didDelete
        };
        if (flash_type === CANVAS_TYPE.text) {
            const length = flash_content.length;
            return (
                <div
                    key={uuid}
                    className={`${styles.item} ${openIndex !== uuid && !dragActive ? '' : styles.activeItem} ${activeStatus ? styles.active : ''}`}
                    onDragEnter={this.handleDragEnter}
                    onDragLeave={this.handleDragLeave}
                    onDragOver={this.handleDragEnter}
                    onDrop={(e) => this.handleDrop(e, uuid, 'item')}
                    style={{
                        cursor: textareaFocus ? 'text' : 'move'
                    }}
                    onClick={this.handleItemClick}
                >
                    <div className={styles.text_top}>
                    <textarea
                        placeholder="请输入文字"
                        onChange={(e) => handleInput(e, uuid)} id={`flash_textarea${uuid}`}
                        onBlur={handleBlur}
                        onFocus={handleFocus}
                        value={flash_content} rows={4}/>
                        {openIndex !== uuid &&
                        <div className={styles.text_mask} onDoubleClick={() => openInput(uuid)}/>}
                    </div>
                    <div className={styles.text_bottom}>
                        <div className={styles.length}><span
                            className={length > 30 ? styles.error : ''}>{length}</span>/30
                        </div>
                        <div className={styles.deleteBtn} onClick={this.handleDelete}>删除</div>
                        <div className={styles.editorBtn} onClick={() => openInput(uuid)}>编辑</div>
                    </div>
                    <VideoDeleteModal opts={videoModalOpts}/>
                </div>);
        } else if (flash_type === CANVAS_TYPE.img) {
            return (
                <div
                    key={uuid}
                    className={`${styles.item} ${dragActive ? styles.activeItem : ''} ${activeStatus ? styles.active : ''}`}
                    onDragEnter={this.handleDragEnter}
                    onDragLeave={this.handleDragLeave}
                    onDragOver={this.handleDragEnter}
                    onDrop={(e) => this.handleDrop(e, uuid, 'item')}
                    onClick={this.handleItemClick}
                >
                    <div className={styles.img_top}>
                        <img style={{ opacity: dragActive ? '.5' : '1' }}
                             src={genUrl(flash_content, '139:149')}/>
                        <div
                            className={`${styles.text_mask} ${isHover ? styles.text_mask_active : ''}`}>{isHover ? '请从右侧选图替换' : ''}</div>
                    </div>
                    <div className={styles.img_bottom}>
                        <div className={styles.deleteBtn} onClick={this.handleDelete}>删除</div>
                        <div className={styles.cutBtn}
                             onClick={() => handleCut(flash_content, uuid)}>裁剪
                        </div>
                        <div
                            className={styles.replaceBtn}
                            onClick={() => handleReplace(uuid)}
                            onMouseMove={this.hover}
                            onMouseOut={this.out}
                        >换图
                        </div>
                    </div>
                    <VideoDeleteModal opts={videoModalOpts}/>
                </div>);
        }
        return '错误的素材';
    }
}

@SortableContainer
class SortableContainers extends React.Component {
    state = {};

    insert = (type, content) => {
        const { uuidSort, dispatch, elementProps } = this.props;
        if (uuidSort.length >= 30) {
            message.error('最多添加30个片段');
            return;
        }
        dispatch({
            type: 'flash/insert',
            payload: {
                type,
                content,
            },
        })
            .then(elementProps.openInput);
    };
    /**
     * 添加图片
     * */
    addImg = () => {
        this.currentUuid = null;
        message.info(`请从右侧“我的图片”中点击或拖拽图片添加`);
        // this.setState({
        //     addImgPopover: true
        // });
        // setTimeout(() => {
        //     this.setState({
        //         addImgPopover: false
        //     });
        // }, 3000);
        //激活我的图片tab
        eventEmitter.emit('addFlashImgTabActive');
        // this.onOpen(this.getImgMessage, '/material/image');
    };
    /**
     *替换图片
     * */
    handleReplace = (uuid) => {
        this.currentUuid = uuid;
        this.setState({
            addImgPopover: true
        });
        setTimeout(() => {
            this.setState({
                addImgPopover: false
            });
        }, 3000);
        //激活我的图片tab
        eventEmitter.emit('addFlashImgTabActive');
        // this.onOpen(this.getImgMessage, '/material/image');
    };
    /**
     * 关闭 modal框,取消监听事件
     */
    onClose = (clearSelect = false) => {
        window.removeEventListener('message', this.getImgMessage);
        this.setState({
            modalOpen: false,
            modalProps: {},
            modalContent: '',
        });
        if (clearSelect) {
            this.setState({
                callbackFunction: null,
            });
        }
    };
    /**
     * 打开的通用方法
     * @param callBack 回调函数
     * @param isFrame 是否frame 是的话直接传入地址会自动拼接
     * @param children 不是frame 的话可以传入子组件
     * @param modalProps
     */
    onOpen = (callBack, isFrame = false, children = '', modalProps = {}) => {
        const content = isFrame ? <iframe
            onLoad={this.onLoadIframe}
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
            modalProps,
            modalContent: content,
        });
    };
    onLoadIframe = (e) => {
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
            this.onClose(true);
        }
        if (data.type === 'success') {
            this.onClose();
            const url = env.host.musicFile + data.data[0].path;
            if (this.currentUuid) { // 替换图片
                this.handleCut(url, this.currentUuid);
            } else {
                this.handleCut(url); // 新增图片
            }
        }
    };
    /**
     * 裁剪图片
     * */
    handleCut = (oriUrl, uuid) => {
        const { transverse, changeNow } = this.props;
        this.onOpen(() => {
        }, false, <Cropper
            image={oriUrl.split('?')[0]}
            onClose={this.onClose}
            hoz={transverse ? 'hoz' : 'ver'}
            onChange={(url) => {
                if (uuid) {
                    changeNow({
                        uuid,
                        flash_type: CANVAS_TYPE.img,
                        flash_content: genUrl(url),
                    });
                } else {
                    this.insert(CANVAS_TYPE.img, genUrl(url));
                }
            }}
        />);
    };
    /**
     * 拖入添加图片div时 hover效果
     */
    handleDragEnterImgBox = (e) => {
        e.preventDefault();
        if (!handleDragFlag) {
            this.setState({
                handleDragAddImgFlag: true
            });
        }
    };
    handleDragLeaveImgBox = (e) => {
        e.preventDefault();
        this.setState({
            handleDragAddImgFlag: false
        });

    };
    handleDragEnterImg = (e) => {
        e.preventDefault();
        dragActiveFn = true;
        if (dragActiveFn) {
            // console.log('拖入整个工作区，拖入中。。。', this.state.dragActive)
        }
    };
    handleDragLeaveImg = (e) => {
        e.preventDefault();
        handleDragFlag = false;
        dragActiveFn = false;

    };
    /**
     * 拖入整个工作区 新增图片片段
     * @param container 容器范围
     */
    handleDropAddImg = (e, container) => {
        e.preventDefault();
        //当前拖拽图片pathId
        const pathId = e.dataTransfer.getData('pathId');
        if (!handleDragFlag) {
            //图片裁剪
            this.handleCut(`${host.musicFile}${pathId}`);
            this.setState({
                handleDragAddImgFlag: false
            });
        }
    };

    /**
     * 取消片段激活（新增片段）
     */
    handleRemoveActive = (e) => {
        e.preventDefault();
        this.props.dispatch({
            type: 'flash/removeActiveStatus'
        });
    };
    hover = () => {
        this.setState({
            isHover: true
        });
    };
    out = () => {
        this.setState({
            isHover: false
        });
    };

    render() {
        const { uuidSort, dataList, changeNow, dispatch, elementProps, getPopoverContent, step } = this.props;
        const { modalProps, modalContent, modalOpen, handleDragAddImgFlag = false, isHover = false } = this.state;
        const options = {
            changeNow,
            dispatch,
            handleReplace: this.handleReplace,
            handleCut: this.handleCut, ...elementProps,
        };
        return (
            <div
                id="flash_sortablecontainers"
                className={styles.workspace}
                onDragEnter={this.handleDragEnterImg}
                onDragLeave={this.handleDragLeaveImg}
                onDragOver={this.handleDragEnterImg}
                onDrop={(e) => this.handleDropAddImg(e, 'container')}
                onClick={this.handleRemoveActive}
            >
                <div>
                    {uuidSort.map((key, index) => {
                        return <SortableElements key={key} index={index}
                                                 uuid={key} {...dataList[key]} {...options}/>;
                    })}
                    <Popover
                        overlayClassName="guideCard"
                        placement="right" visible={step === 1} title={null}
                        content={getPopoverContent(1)}
                        trigger="click">
                        <div
                            className={`${styles.addItem} ${handleDragAddImgFlag ? styles.dragAddImg : ''}`}
                            onDragEnter={this.handleDragEnterImgBox}
                            onDragLeave={this.handleDragLeaveImgBox}
                            onDragOver={this.handleDragEnterImgBox}
                        >
                            <div
                                className={styles.addImg}
                                style={{
                                    fontSize: isHover ? '12px' : '14px'
                                }}
                                onClick={this.addImg}
                                onMouseMove={this.hover}
                                onMouseOut={this.out}
                            >
                                <Icon type="eqf-plus"/>
                                <div
                                    className={styles.addTitle}>{isHover ? '请从右侧选择图片' : '添加图片'}</div>
                            </div>
                            {
                                !handleDragAddImgFlag ?
                                    <div
                                        className={styles.addText}
                                        onClick={() => this.insert(CANVAS_TYPE.text, '')}>
                                        <Icon type="eqf-plus"/>
                                        <div className={styles.addTitle}>添加文字</div>
                                    </div> : null
                            }
                        </div>
                    </Popover>
                    <Modal {...modalProps} onCancel={this.onClose}
                           visible={modalOpen}>{modalContent}</Modal>
                </div>
            </div>);
    }
}

@connect(({ flash }) => ({ flash }))
export default class WorkSpace extends Component {
    state = {
        openIndex: null,
        textareaFocus: false,
    };
    changeNow = (payload) => {
        this.props.dispatch({
            type: 'flash/changeNow',
            payload,
        });
    };
    /**
     * 重新排序
     * @param oldIndex 原索引
     * @param newIndex 新索引
     * @returns {boolean}
     */
    onSortEnd = ({ oldIndex, newIndex }) => {
        const { uuidSort } = this.props.flash;
        if (newIndex < 0 || newIndex > uuidSort.length) {
            return false;
        }
        const arr = arrayMove(uuidSort, oldIndex, newIndex);
        this.props.dispatch({
            type: 'flash/save',
            payload: { uuidSort: arr },
        });
    };
    openInput = (uuid) => {
        this.setState({ openIndex: uuid });
        const element = document.getElementById(`flash_textarea${uuid}`);
        if (element) {
            element.focus();
        }
    };
    handleBlur = () => {
        const element = document.getElementById(`flash_textarea${this.state.openIndex}`);
        if (element && element.value.length > 30) {
            message.warning('单个文本最多支持30个字符，超过部分将会被自动删除');
            const value = element.value.substring(0, 30);
            element.value = value;
            this.changeNow({
                uuid: this.state.openIndex,
                flash_content: value,
                flash_oriContent: value,
            });
        }
        this.setState({
            openIndex: null,
            textareaFocus: false,
        });
    };
    handleFocus = () => {
        this.setState({
            textareaFocus: true,
        });
    };
    handleInput = (e, uuid) => {
        this.changeNow({
            uuid,
            flash_content: e.target.value,
            flash_oriContent: e.target.value,
        });
    };

    render() {
        const { dataList, uuidSort, transverse, updateUuid, updateStates } = this.props.flash;
        const { openIndex, textareaFocus } = this.state;
        const elementProps = {
            openIndex,
            textareaFocus,
            openInput: this.openInput,
            handleBlur: this.handleBlur,
            handleFocus: this.handleFocus,
            handleInput: this.handleInput,
        };
        const options = {
            updateUuid,
            updateStates,
            transverse,
            getPopoverContent: this.props.getPopoverContent,
            step: this.props.step,
            dispatch: this.props.dispatch,
            dataList,
            uuidSort,
            changeNow: this.changeNow,
            axis: 'xy',
            onSortEnd: this.onSortEnd,
            distance: 10,
            pressThreshold: 10,
            helperClass: styles.item,
            lockToContainerEdges: true,
            helperContainer: document.getElementById('flash_sortablecontainers') || document.body,
        };
        return <SortableContainers {...options} elementProps={elementProps}/>;
    }
}
