import React, { Component } from 'react';
import { connect } from 'dva';
import { Message, Switch } from 'antd';
import Modal from '../../../components/modal';
import Button from '../../../components/Button/index';
import styles from './video.less';
import VideoStore from '../../videoStore/index';
import { host } from '../../../../config/env';
import { haveSound } from '../../../../util/data';

@connect(({ editor, workspace }) => {
    const { transverse } = editor;
    const { dataList = [], activeIndex = 0 } = workspace || {};
    const data = dataList[activeIndex] && dataList[activeIndex] || {};
    return {
        transverse,
        data,
    };
})
export default class LegalCopy extends Component {
    state = {
        modalOpen: false,
        checkedFirst: true,
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        const newState = { ...prevState };
        const { data: { materialList } = {} } = nextProps;
        if (materialList && materialList.length < 1) {
            newState.checkedFirst = false;
        }
        return newState;
    }

    componentWillUnmount() {
        this.onClose();
    }

    /**
     * 触发选择视频的模态框
     * */
    handleReplace = () => {
        this.props.dispatch({
            type: 'editor/saveCommon',
            payload: { beforeInsertHook: this.newVideo },
        });
        this.setState({
            modalOpen: true,
        });
        this.onOpen(() => {}, false, <VideoStore onClose={this.onClose}/>);
    };

    // 公用打开模态框方法
    onOpen = (callBack, isFrame = false, children = '', modalProps = {}) => {
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
        this.setState({
            modalOpen: true,
            modalProps,
            modalContent: content,
        });
    };

    // 新视频
    newVideo = (id, type) => {
        const { data: { uuid }, dispatch } = this.props;
        dispatch({
            type: 'workspace/changeVideo',
            payload: {
                id,
                type,
                uuid,
            },
        });
        return false;
    };

    /**
     * 关闭 modal框
     */
    onClose = () => {
        this.setState({
            modalOpen: false,
        });
        this.props.dispatch({
            type: 'editor/saveCommon',
            payload: { beforeInsertHook: null },
        });
    };

    handleVideoVoice = (checked) => {
        this.changeNow({ muted: !checked });
    };

    // 保存数据
    changeNow = (payload) => {
        this.props.dispatch({
            type: 'workspace/changeNow',
            payload,
        });
    };

    render() {
        const { modalOpen, modalContent } = this.state;
        const { data } = this.props;
        const { muted, type, templateType } = data;
        return (
            <div className={styles.right__video__set}>
                <div>
                    <div className={styles.top_button}>
                        <Button onClick={this.handleReplace} icon={'eqf-refresh-ccw'}
                                className={styles.replaceButton}>更换视频</Button>
                    </div>
                    {haveSound(type, templateType) && <div className={styles.videoVoice}>
                        <div>视频声音</div>
                        <div><Switch checked={!muted} onChange={this.handleVideoVoice}/></div>
                    </div>}
                    <Modal visible={modalOpen} onCancel={this.onClose}>
                        {modalContent}
                    </Modal>
                </div>
            </div>
        );
    }
}
