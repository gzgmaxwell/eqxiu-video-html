import React, { Component, useState, useEffect, useRef } from 'react';
import { connect } from 'dva';
import { Message, Switch, Tooltip } from 'antd';
import Modal from '../../../components/modal';
import Button from '../../../components/Button';
import Empty from '../../../components/empty';
import styles from './video.less';
import VideoStore from '../../videoStore/index';
import { host } from '../../../../config/env';
import { CANVAS_TYPE } from '../../../../config/staticParams';
import BorderSet from '../borderSet';
import CutVideo from '../../videoStore/cutVideo';
import { getCutSource } from '../../../../api/videoStore';
import { CSSTransition } from 'react-transition-group';
import VideoOption from '../../videoOption';


function Custom({ data, partyUUID, cutVideoUUID, dispatch, haveSound = true, canChange = true }) {
    const [modalContent, setModalContent] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const cutProps = useRef({});
    if (!data) return <Empty text={'无效的素材'} />;
    const { muted } = data;

    /**
     * 改变声音
     * @param checked
     */
    function handleVideoVoice(checked) {
        dispatch({
            type: 'workspace/changeNow',
            payload: { muted: !checked },
        });
    }

    /**
     * 关闭弹窗
     */
    function closeCropper() {
        cutProps.current = {};
        setOpenModal(false);
        setModalContent(null);
    }

    /**
     * 取消裁剪
     */
    function cancelCut() {
        dispatch({
            type: 'looper/cancelCut',
        });
        Message.success('已取消视频裁剪');
    }

    /**
     * 裁剪请求后的方法
     * @param end
     * @param start
     * @param payload
     */
    const onChange = ({ endTime: end, startTime: start, ...payload }) => {
        closeCropper();
        const duration = Math.max(end - start, 1);
        const { renderSetting = {}, uuid } = data || {};
        const { startTime = 0 } = renderSetting;
        const timeObj = {
            start: startTime,
            end: startTime + duration,
        };
        dispatch({
            type: 'looper/cutVideo',
            payload: {
                ...payload,
                uuid,
                partyUUID,
                timeObj,
            },
        });
        cutProps.current = {};
        closeCropper();
    };
    /**
     * 打开裁剪框
     * @returns {Promise<void>}
     */
    const cutVideo = async () => {
        const obj = data;
        cutProps.current = {
            title: obj.title,
            url: obj.videoMp4Url || obj.oriPreviewUrl || obj.previewUrl,
            coverImg: obj.coverImg,
            id: obj.templateId,
            isSave: 0, // 保存
            type: obj.type,
            onChange,
            onCancel: closeCropper,
        };
        if (obj.cutId) {
            const { data: { obj: { originVideoUrl } } } = await getCutSource(obj.cutId);
            cutProps.current.url = originVideoUrl;
            cutProps.current.coverImg = null;
        }
        setOpenModal(true);
    };

    /**
     * 公共打开模态框方法
     * @param callBack
     * @param isFrame
     * @param children
     * @param modalProps
     */
    const onOpen = (callBack, isFrame = false, children = '', modalProps = {}) => {
        const content = isFrame ? <iframe
            onLoad={this.onLoadIframe}
            src={`${host.auth}${isFrame}?t=${new Date().getTime()}&source=music`}
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
        setOpenModal(true);
        setModalContent(content);
    };

    /**
     * 改变视频
     * @param id
     * @param type
     * @returns {boolean}
     */
    function changeNewVideo(id, type) {
        const { uuid } = data;
        if (cutVideoUUID === uuid) {
            cancelCut();
        }
        dispatch({
            type: 'workspace/changeVideo',
            payload: {
                id,
                type,
                uuid,
            },
        });
        return false;
    }

    /**
     * 触发选择视频的模态框
     * */
    const handleReplace = () => {
        dispatch({
            type: 'editor/saveCommon',
            payload: { beforeInsertHook: changeNewVideo },
        });
        setOpenModal(true);
        onOpen(() => {}, false, <VideoStore onClose={closeCropper} />);
    };


    let cutButton = (
        <Button
            onClick={cutVideo} icon="eqf-cut"
            className={styles.replaceButton}>视频裁剪
        </Button>);
    if (cutVideoUUID) {
        if (cutVideoUUID === data.uuid) {
            cutButton = (
                <Button
                    onClick={cancelCut}
                    className={styles.replaceButton}>取消裁剪
                </Button>);
        } else {
            cutButton = (
                <Tooltip title="有视频正在裁剪中">
                    <Button
                        disabled
                        icon="eqf-cut"
                        className={`${styles.replaceButton} ${styles.disalbed}`}>视频裁剪
                    </Button>
                </Tooltip>);
        }
    }

    return (
        <div className={styles.right__video__set}>
            {data.type !== CANVAS_TYPE.ornament &&
            <React.Fragment>
                {canChange &&
                <div className={styles.top_button}>
                    <Button
                        onClick={handleReplace} icon={'eqf-refresh-ccw'}
                        className={styles.replaceButton}>更换视频
                    </Button>
                </div>}
                <div className={styles.top_button}>
                    {cutButton}
                </div>
                {haveSound &&
                <div className={styles.videoVoice}>
                    <div>视频声音</div>
                    <div>
                        <Switch checked={!muted} onChange={handleVideoVoice} />
                    </div>
                </div>}
            </React.Fragment>}
            <BorderSet />
            <Modal visible={openModal} onCancel={closeCropper}>
                {modalContent || <CutVideo cutId={data.cutId} onCancel={closeCropper} {...cutProps.current} />}
            </Modal>
           {/* {openModal && <CSSTransition
                in={openModal}
                timeout={500}
                classNames='slider'
                unmountOnExit>
                {modalContent || <CutVideo visible={openModal} cutId={data.cutId} onCancel={closeCropper} {...cutProps.current} />}
            </CSSTransition>}*/}
        </div>
    );
}


export default connect(({ editor, workspace, looper }) => {
    const { transverse } = editor;
    const { dataList = [], activeIndex = 0, uuid } = workspace;
    const data = dataList[activeIndex] && dataList[activeIndex];
    return {
        activeIndex,
        transverse,
        data,
        partyUUID: uuid,
        cutVideoUUID: looper.cutVideoUUID,
    };
})(Custom);

//
// @connect(({ editor, workspace, looper }) => {
//     const { transverse } = editor;
//     const { dataList = [], activeIndex = 0, uuid } = workspace;
//     const data = dataList[activeIndex] && dataList[activeIndex];
//     return {
//         activeIndex,
//         transverse,
//         data,
//         partyUUID: uuid,
//         cutVideoUUID: looper.cutVideoUUID,
//     };
// })
// export default class Custom extends Component {
//     state = {
//         openModal: false,
//     };
//
//     componentWillUnmount() {
//         this.onClose();
//     }
//
//     /**
//      * 触发选择视频的模态框
//      * */
//     handleReplace = () => {
//         this.props.dispatch({
//             type: 'editor/saveCommon',
//             payload: { beforeInsertHook: this.newVideo },
//         });
//         this.setState({
//             modalOpen: true,
//         });
//         this.onOpen(() => {}, false, <VideoStore onClose={this.onClose}/>);
//     };
//     onChange = ({ endTime: end, startTime: start, ...payload }) => {
//         this.closeCropper();
//         const duration = Math.max(end - start, 1);
//         const { props: { data, dispatch, partyUUID } } = this;
//         const { renderSetting = {}, uuid } = data || {};
//         const { startTime = 0 } = renderSetting;
//         const timeObj = {
//             start: startTime,
//             end: startTime + duration,
//         };
//         dispatch({
//             type: 'looper/cutVideo',
//             payload: {
//                 ...payload,
//                 uuid,
//                 partyUUID,
//                 timeObj,
//             },
//         });
//         this.cutProps = {};
//         this.closeCropper();
//     };
//     cutProps = {};
//     cutVideo = async () => {
//         const { state, closeCropper, props: { data: obj }, onChange } = this;
//         this.cutProps = {
//             title: obj.title,
//             url: obj.previewUrl,
//             coverImg: obj.coverImg,
//             id: obj.templateId,
//             isSave: 0, // 保存
//             type: obj.type,
//             onChange,
//             onCancel: closeCropper,
//         };
//         if (obj.cutId) {
//             const { data: { obj: { originVideoUrl } } } = await getCutSource(obj.cutId);
//             this.cutProps.url = originVideoUrl;
//             this.cutProps.coverImg = null;
//         }
//         this.setState({
//             openModal: true,
//         });
//     };
//     // 公用打开模态框方法
//     onOpen = (callBack, isFrame = false, children = '', modalProps = {}) => {
//         const content = isFrame ? <iframe
//             onLoad={this.onLoadIframe}
//             src={`${host.auth}${isFrame}?t=${new Date().getTime()}&source=music`}
//             scrolling="no" frameBorder="0"
//             style={{
//                 width: 960,
//                 height: 600,
//                 display: 'block',
//                 lineHeight: 0,
//                 fontSize: 0,
//             }}
//         /> : children;
//         window.addEventListener('message', callBack);
//         this.setState({
//             openModal: true,
//             modalProps,
//             modalContent: content,
//         });
//     };
//
//     // 新视频
//     newVideo = (id, type) => {
//         const { data: { uuid }, dispatch } = this.props;
//         dispatch({
//             type: 'workspace/changeVideo',
//             payload: {
//                 id,
//                 type,
//                 uuid,
//             },
//         });
//         return false;
//     };
//
//
//     /**
//      * 关闭 modal框
//      */
//     onClose = () => {
//         this.props.dispatch({
//             type: 'editor/saveCommon',
//             payload: { beforeInsertHook: null },
//         });
//         this.setState({
//             openModal: false,
//             modalContent: null,
//         });
//     };
//     closeCropper = () => {
//         this.setState({ openModal: false });
//     };
//     handleVideoVoice = (checked) => {
//         this.props.dispatch({
//             type: 'workspace/changeNow',
//             payload: { muted: !checked },
//         });
//     };
//
//     render() {
//         const { cutProps, onCancel } = this;
//         const { openModal, modalContent } = this.state;
//         const { data, cutVideoUUID } = this.props;
//         if (!data) return <Empty text={'无效的素材'}/>;
//         const { muted } = data;
//         const isCuting = !!cutVideoUUID;
//         const cutingMy = isCuting && cutVideoUUID === data.uuid;
//         return (
//             <div className={styles.right__video__set}>
//                 {data.type !== CANVAS_TYPE.ornament &&
//                 <React.Fragment>
//                     <div className={styles.top_button}>
//                         <Button
//                             onClick={this.handleReplace} icon={'eqf-refresh-ccw'}
//                             className={styles.replaceButton}>更换视频</Button>
//                     </div>
//                     <div className={styles.top_button}>
//                         <Button
//                             onClick={this.cutVideo} icon='eqf-cut'
//                             className={styles.replaceButton}>视频裁剪
//                         </Button>
//                     </div>
//                     <div className={styles.videoVoice}>
//                         <div>视频声音</div>
//                         <div><Switch checked={!muted} onChange={this.handleVideoVoice}/></div>
//                     </div>
//                 </React.Fragment>}
//                 <BorderSet/>
//                 <Modal visible={openModal} onCancel={onCancel}>
//                     {modalContent || <CutVideo onCancel={onCancel} {...cutProps} />}
//                 </Modal>
//             </div>
//         );
//     }
// }
