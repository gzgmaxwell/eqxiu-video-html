import React from 'react';
import { connect } from 'dva';
import styles from './index.less';
import Modal from '../../components/modal';
import PreviewVideo from '../../editor/right/previewVideo';
import { contrast } from '../../../util/data';
import lodash from 'lodash';
import PlayButton from '../../components/Button/playButton';


@connect(({ editor, timeLine }) => ({
    editor,
    timeLine,
}))
class EditorBottom extends React.Component {
    state = {
        openPreviewModal: false,
    };

    shouldComponentUpdate(nextProps, nextState) {
        if (!lodash.isEqual(nextState, this.state)) {
            return true;
        }
        if (contrast(this.props, nextProps, [
            'editor.currentTime',
            'editor.nowIndex',
        ])) {
            return true;
        }
        const {
            editor: { parties, nowIndex },
            timeLine: { currentTimes: prevCurrentTimes },
        } = this.props;
        const {
            editor: { parties: nextParties },
            timeLine: { currentTimes: nextCurrentTimes },
        } = nextProps;
        const prev = parties[nowIndex];
        const next = nextParties[nowIndex];
        const { uuid } = next || {};
        if (prev && next && (prev.renderSetting.segmentPartyDuration !==
            next.renderSetting.segmentPartyDuration)) {
            return true;
        }
        if (prevCurrentTimes && (prevCurrentTimes[uuid] !== nextCurrentTimes[uuid])) {
            return true;
        }
        return false;
    }

    componentDidMount() {
    }


    componentWillUnmount() {
    }


    onOpenPreview = () => {
        this.setState({ openPreviewModal: true });
    };
    onClosePreview = () => {
        this.setState({ openPreviewModal: false });
    };

    render() {
        const {
            state: { openPreviewModal },
            props: {
                editor: { parties, nowIndex, transverse },
                timeLine: { currentTimes },
                showTime,
            },
        } = this;
        const party = parties[nowIndex] || {};
        const {
            renderSetting: { segmentPartyDuration = 4 } = {},
        } = party || {};
        const durationStr = moment(segmentPartyDuration, 'X')
            .format('mm:ss');
        const currentTimeStr = moment((currentTimes[party.uuid] || 0) / 1000, 'X')
            .format('mm:ss');
        return (
            <div className={styles.bottom} style={{ top: transverse ? '20px' : '-64px' }}>
                <div className={styles.top}>
                    <div></div>
                    <div className={styles.centre}>
                        <PlayButton
                            onClick={this.onOpenPreview}
                            className={styles.playBtn}
                        />
                        {!showTime && <span>
                            {currentTimeStr}
                        </span>}
                    </div>
                </div>
                <Modal visible={openPreviewModal} onCancel={this.onClosePreview}>
                    <PreviewVideo simpleScale={true}  tipsHide={true} visible={openPreviewModal}/>
                </Modal>
            </div>
        );
    }
}


export default EditorBottom;
