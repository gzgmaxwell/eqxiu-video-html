import React from 'react';
import { prev } from 'Config/env';
import { filter } from 'Util/data';
import styles from './concatSet.less';
import Icon from '../components/Icon';
import { genUrl } from '../../util/image';
import Select from 'Components/input/select';
import FILTERS from '../../dataBase/filters';
import { TRANSITIONS, TRANSITIONS_DURATION } from '../../dataBase/transitions';
import Button from '../components/Button';
import Modal from '../components/modal';
import Transition from '../components/video/transition';
import { genVideoUrl } from '../../util/file';

const filterArr = Object.values(FILTERS)
    .map(item => {
        return {
            title: item.name,
            value: item.class,
        };
    });
const transitionArr = Object.values(TRANSITIONS)
    .map(item => {
        return {
            title: item.cname,
            value: item.value,
        };
    });

class PreviewConcat extends React.PureComponent {

    constructor(props) {
        super(props);
        const { data, previewIndex, duration } = props;
        let videoList = []; // 视频地址列表
        this.interval = null;
        this.beginTime = 0;
        this.preVideo = React.createRef();
        this.nextVideo = React.createRef();
        try {
            videoList = previewIndex === 'all' ? [] : [
                data[previewIndex - 1].previewUrl,
                [data[previewIndex].previewUrl]];
        } catch (e) {
            console.error(e);
        }
        this.state = {
            duration,
            data,
            previewIndex,
            videoList,
            progress: 0,
            preDuration: 0,
        };
    }

    componentWillUnmount() {
        clearInterval(this.interval);
        this.interval = null;
    }

    preVideoReady = ({ target }) => {
        const { duration } = target;
        this.setState({
            preDuration: duration,
            progress: 0 - (duration * 1000) + this.state.duration,
        });
        clearInterval(this.interval);
        const renderVideo = () => {
            const playTime = performance.now() - this.beginTime;
            this.setState({ progress: playTime });
            if (this.interval) {
                requestAnimationFrame(renderVideo);
            }
        };
        if (!this.interval) {
            this.interval = requestAnimationFrame(renderVideo);
            this.beginTime = performance.now();
        }

    };

    render() {
        const { state: { videoList, progress }, props: { transverse, type } } = this;
        if (videoList.length < 2) return null;
        const from = <video src={genVideoUrl(videoList[0])} muted autoPlay
                            onLoadedData={this.preVideoReady} crossOrigin='Anonymous'/>;
        const to = <video ref={this.nextVideo} preload src={genVideoUrl(videoList[1])}
                          crossOrigin='Anonymous' autoPlay
                          muted/>;
        return <div>
            <div>
                <Transition from={from} to={to} progress={progress / 1000} transverse={transverse}
                            type={type}/>
            </div>
        </div>;
    }
}


class Index extends React.Component {
    state = {
        openPreviewModal: false,
        prevIndex: null,
        prevItem: {},
    };
    // 设置转场
    handleConcatSetChange = (index, key, value) => {
        const { parties, setState } = this.props;
        if (!parties[index]) {
            return;
        }
        const renderSetting = JSON.parse(parties[index].renderSetting || '{}');
        const { concatSet = {} } = renderSetting;
        concatSet[key] = value;
        renderSetting.concatSet = concatSet;
        parties[index].renderSetting = JSON.stringify(renderSetting);
        setState({ parties });
    };
    // 设置滤镜
    handleFilterChange = (index, value) => {
        const { parties, setState } = this.props;
        if (!parties[index]) {
            return;
        }
        const renderSetting = JSON.parse(parties[index].renderSetting || '{}');
        renderSetting.filter = value;
        parties[index].renderSetting = JSON.stringify(renderSetting);
        setState({ parties });
    };

    openPreview = (prevIndex = 'all', prevItem) => {
        this.setState({
            openPreviewModal: true,
            prevIndex,
            prevItem,
        });
    };

    closePreview = () => {
        this.setState({
            openPreviewModal: false,
            prevIndex: null,
        });
    };

    render() {
        const { openPreviewModal, prevIndex, prevItem } = this.state;
        const { parties, readOnly, noSave, onSubmit, onBack, renderStatus, transverse } = this.props;
        const disabled = renderStatus === 2 ? styles.disabled : '';
        return (
            <div className={styles.container}>
                <div className={styles.concatSet}>
                    <div className={styles.partyContainer}>
                        {parties.map((item, index) => {
                            const { filter = 'wulvjing', concatSet } = JSON.parse(
                                item.renderSetting || '{}');
                            const { duration = 800, concatType = 'none' } = concatSet || {};
                            return (
                                <div className={styles.party} key={index}>
                                    {index > 0 && <div className={styles.set}>
                                        <div className={styles.title}>转场效果</div>
                                        <Select defaultValue={null} options={transitionArr}
                                                placeholder={'转场类型'}
                                                className={styles.types} value={concatType}
                                                onSelect={(value) => this.handleConcatSetChange(
                                                    index, 'concatType', value)}/>
                                        <div className={styles.title}>转场时间</div>
                                        <Select defaultValue={null} options={TRANSITIONS_DURATION}
                                                placeholder={'转场时间'}
                                                className={styles.time} value={duration}
                                                onSelect={(value) => this.handleConcatSetChange(
                                                    index, 'duration', value)}/>
                                        {/*<div className={styles.title}>滤镜</div>*/}
                                        {/*<Select defaultValue={null} options={filterArr}*/}
                                        {/*placeholder={'滤镜'}*/}
                                        {/*className={styles.filter} value={filter}*/}
                                        {/*onSelect={(value) => this.handleFilterChange(index,*/}
                                        {/*value)}/>*/}
                                        <div className={[styles.play].join(' ')}
                                             onClick={(concatType === 'none' || !concatType)
                                                      ? null
                                                      : () => this.openPreview(index, {
                                                     duration,
                                                     concatType,
                                                 })}>
                                            <Icon type="eqf-play"/>
                                        </div>
                                    </div>}
                                    <div className={styles.video}>
                                        <div className={styles.title}>{item.title ||
                                        `片段${index + 1}`}</div>
                                        <div className={styles.video__content}>
                                            <img src={genUrl(item.coverImg)}/>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className={styles.bottomBtnGroup}>
                    <Button className={styles.backButton}
                            onClick={onBack}>上一步</Button>
                    <Button className={[styles.submitButton, disabled].join(' ')}
                            onClick={onSubmit}>下一步</Button>
                </div>
                <Modal visible={openPreviewModal} onCancel={this.closePreview}>
                    <div>
                        <PreviewConcat data={parties} previewIndex={prevIndex}
                                       duration={prevItem.duration} transverse={transverse}
                                       type={prevItem.concatType}/>
                    </div>
                </Modal>
            </div>
        );
    }
};
export default Index;
