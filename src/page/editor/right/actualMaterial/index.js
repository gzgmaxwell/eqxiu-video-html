import React from 'react';
import styles from './index.less';
import Icon from '../../../components/Icon';
import { Switch } from 'antd';
import CutVideo from '../../videoStore/cutVideo/index';
import Modal from '../../../components/modal';
import { connect } from 'dva';
import { findKey } from '../../../../util/object';
import { HASH_TYPE } from '../../../../config/staticParams';
import { getCutSource } from '../../../../api/videoStore';
import Button from '../../../components/Button/index';

@connect(({ workspace }) => ({ workspace }))
export default class ActualMaterial extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            openModal: false,
        };
    }

    componentDidMount() {

    }

    onCancel = () => {
        this.setState({ openModal: false });
    };
    onChange = ({ url, endTime: end, startTime: start, ...payload }) => {
        const duration = Math.max(end - start, 1);
        const { props: { workspace: { activeIndex, dataList }, dispatch } } = this;
        const { renderSetting = {}, uuid } = dataList[activeIndex] || {};
        const { startTime = 0 } = renderSetting;
        const timeObj = {
            start: startTime,
            end: startTime + duration,
        };
        this.props.dispatch({
            type: 'workspace/changeNow',
            payload: {
                previewUrl: url,
                ...payload,
            },
        });
        dispatch({
            type: 'workspace/changeELementsTime',
            payload: {
                timeObj,
                uuidArr: [uuid],
            },
        });
        this.cutProps = {};
        this.closeCropper();
    };
    cutProps = {};
    cutVideo = async () => {
        const { state, closeCropper, props: { workspace: { activeIndex, dataList } }, onChange } = this;
        const obj = dataList[activeIndex] || {};
        this.cutProps = {
            title: obj.title,
            url: obj.previewUrl,
            id: obj.templateId,
            isSave: 0, // 保存
            type: obj.type,
            onChange,
            onCancel: closeCropper,
        };
        if (obj.cutId) {
            const { data: { obj: { originVideoUrl } } } = await getCutSource(obj.cutId);
            if (originVideoUrl) {
                this.cutProps.url = originVideoUrl;
                this.cutProps.coverImg = null;
            }
        }
        this.setState({
            openModal: true,
        });
    };
    closeCropper = () => {
        this.setState({ openModal: false });
    };

    render() {
        const { state, cutProps, closeCropper } = this;

        return (
            <div className={styles.box}>
                <div className={styles.wrap}>
                    <Button onClick={this.cutVideo} icon={'eqf-cut'}
                            className={styles.replaceButton}>视频裁剪</Button>
                </div>
                <Modal visible={state.openModal} onCancel={this.onClose}>
                    <CutVideo onCancel={closeCropper} {...cutProps} />
                </Modal>
            </div>
        );
    }
}

