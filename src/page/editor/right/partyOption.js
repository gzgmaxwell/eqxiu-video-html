import React from 'react';
import { connect } from 'dva';
import styles from './partyOption.less';
import Slider from '../../components/slider';
import BackgroundSet from './backgroundSet';
import Icon from '../../components/Icon';
import Modal from '../../components/modal';
import VideoFilter from '../videoFilter';
import NumberInput from '../../components/input/numberInput';
import {
    CANVAS_TYPE,
    MIN_CONCAT_TIME,
    MIN_NO_CONCAT_TIME, TimeSetLayerType,
    WorkspaceVideoType,
} from '../../../config/staticParams';
import { createEleRenderSetting, handleMaxOrMinNum, isSetTimerEle } from '../../../util/data';
import { Tooltip } from 'antd';

const marks = {
    0.6: '0.6',
    0.8: '0.8',
    1: '原速',
    1.2: '1.2',
    1.4: '1.4',
    1.6: '1.6',
    1.8: '1.8',
    2.0: '2.0',
};
// 时间常数
const minNoConcatTime = MIN_NO_CONCAT_TIME / 1000;
const minConcatTime = MIN_CONCAT_TIME / 1000;

@connect(({ editor, workspace }) => ({
    editor,
    workspace,
}))
class PartyOption extends React.Component {
    constructor(props) {
        super(props);
    }

    state = {
        openModal: false,
    };
    /**
     * 时长改变
     */
    changeDuration = (value) => {
        const { props: { dispatch, editor: { parties, nowIndex } } } = this;
        const { renderSetting, uuid, elementList } = parties[nowIndex] || {};
        dispatch({
            type: 'editor/changePartyByUuid',
            payload: {
                uuid,
                segmentPartyDuration: value,
                renderSetting: {
                    ...renderSetting,
                    segmentPartyDuration: value,
                },
                elementList: elementList.map(item => {
                    item.renderSetting = createEleRenderSetting({ segmentPartyDuration: value });
                    return item;
                }),
                refresh: false,
            },
        });
    };
    /**
     * 速度改变
     * @param value
     */
    speedChange = (value) => {
        this.props.dispatch({
            type: 'editor/changeNowParty',
            payload: { playSpeed: value },
        });
    };
    /**
     * 声音改变
     * @param value
     */
    speedVolume = (value) => {
        const { props: { editor: { parties, nowIndex } } } = this;
        const { renderSetting = {} } = parties[nowIndex] || {};
        this.props.dispatch({
            type: 'editor/changeNowParty',
            payload: {
                renderSetting: {
                    ...renderSetting,
                    bgmVolume: value,
                },
            },
        });
    };
    /**
     * 设置滤镜
     * */
    setFilter = () => {
        this.setState({ openModal: true });
    };
    onCloseModal = () => {
        this.setState({
            openModal: false,
        });
    };

    render() {
        const { state, props: { editor: { playSpeed, parties, nowIndex }, workspace: { dataList } }, changeDuration } = this;

        // 是否有可以设置时间点的东西
        const haveVideo = dataList.some(v => isSetTimerEle(v));
        // 根据是否有转场
        const { renderSetting: { concatSet: { concatType: nowConcatType = 'none' } = {}, bgmVolume = 50, segmentPartyDuration = 4 } = {} } = parties[nowIndex] ||
        {};
        const { renderSetting: { concatSet: { concatType: nextConcatType = 'none' } = {} } = {} } = parties[nowIndex +
        1] || {};
        // 控制片段长度至少是2秒
        const trueMarks = {};
        let max = 0;

        for (const key of Object.keys(marks)) {
            if (segmentPartyDuration / key >= 4) {
                max = Math.max(max, key);
                trueMarks[key] = marks[key];
            }
        }
        const minPartyDuration = nowConcatType !== 'none' || nextConcatType !== 'none'
                                 ? minConcatTime
                                 : minNoConcatTime;
        return (
            <React.Fragment>
                {false && <div className={styles.body}>
                    <div className={style.filtter}>
                        <div className={style.filtterTitle}>滤镜设置</div>
                        <div className={style.filtterBtn} onClick={this.setFilter}><Icon
                            type='eqf-plus'/></div>
                    </div>
                    <div className={style.label}>播放速度设置</div>
                    <div className={style.slider}>
                        <Slider marks={tureMarks} step={null} max={Math.min(2, max)} min={0.6}
                                tooltipVisible={false}
                                included={false} value={playSpeed}
                                onChange={this.speedChange}/>
                    </div>
                    <div className={style.info}><span className={style.infoKey}>当前速度：</span><span
                        className={style.infoValue}>{playSpeed}倍</span></div>
                    <div className={style.info}><span className={style.infoKey}>当前时长：</span><span
                        className={style.infoValue}>{afterTime}s</span><span
                        className={style.infoTips}>（原时长：{beforeTime}s）</span></div>
                </div>}
                <div className={styles.body}>
                    <div className={styles.groupTitle} style={{ marginBottom: 15 }}>
                        <div className={styles.text}>{haveVideo ? '片段时长' : '时长设置'}</div>
                        <div className={styles.line}/>
                    </div>
                    <div className={styles.rightRow}>
                        {haveVideo ? <Tooltip placement="top"
                                              title='当前片段含有可设置时间点元素，片段时长以最大动态元素时长为准。'>
                                       <NumberInput
                                           min={minPartyDuration} max={999} step={.1}
                                           value={Number(segmentPartyDuration.toFixed(2))}
                                           disabled={haveVideo}
                                       />
                                   </Tooltip>
                                   : <NumberInput min={minPartyDuration} max={999} step={.1}
                                                  value={Number(segmentPartyDuration.toFixed(2))}
                                                  onChange={(value) => changeDuration(
                                                      handleMaxOrMinNum(value, 999,
                                                          minPartyDuration))}/>}
                        <div className={styles.left} style={{
                            width: 70,
                            paddingLeft: 6,
                        }}>秒
                        </div>
                    </div>
                    <div className={styles.groupTitle} style={{ marginBottom: 15 }}>
                        <div className={styles.text}>声音设置</div>
                        <div className={styles.line}/>
                    </div>
                    <div className={styles.voiceSet}>
                        <div className={styles.left}>
                            <span>背景音&nbsp;</span>
                            <Tooltip title={'背景音：“视频设置”背景音乐+旁白'} placement="top">
                                <Icon type='eqf-why-f' className={styles.tips}/>
                            </Tooltip>
                        </div>
                        <Slider
                            className={['slider', styles.slider].join(' ')}
                            min={0}
                            max={100}
                            step={1}
                            onChange={this.speedVolume}
                            value={~~bgmVolume}
                        />
                    </div>
                    <div className={styles.groupTitle} style={{ marginBottom: 15 }}>
                        <div className={styles.text}>背景设置</div>
                        <div className={styles.line}/>
                    </div>
                    <BackgroundSet/>
                    <Modal visible={state.openModal} onClose={this.onCloseModal}>
                        <VideoFilter onClose={this.onCloseModal}/>
                    </Modal>
                </div>
            </React.Fragment>
        );
    };
}

export default PartyOption;
