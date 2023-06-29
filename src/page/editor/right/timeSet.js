import React from 'react';
import { connect } from 'dva';
import { Checkbox } from 'antd';
import style from './timeSet.less';
import { message } from 'antd';
import NumberInput from 'Components/input/numberInput';
import { handleMaxOrMinNum, isSetTimerEle } from '../../../util/data';
import { CustomSetTimerType, TimeSetVideoType } from '../../../config/staticParams';

@connect(({ workspace, editor }) => ({
    workspace,
    editor,
}))
export default class TimeSet extends React.Component {
    constructor(props) {
        super(props);
        const { props: { workspace: { activeIndex, dataList } } } = this;
        const { renderSetting = {}, videoDuration = 0 } = dataList[activeIndex] || {};
        const { startTime = 0, endTime = videoDuration, customDuration = null } = renderSetting;
        this.haveConcatType = false;
        this.minDuration = 0.2;
        this.state = {
            custom: customDuration || false,
        };
    }

    componentDidMount() {
        this.initSetting();
    }

    componentDidUpdate() {
        this.initSetting();
    }

    /**
     * 修改时间
     * @param key
     * @param value
     */
    onTimeChange = (key, value) => {
        const { props: { workspace: { activeIndex, dataList, uuid }, dispatch } } = this;
        if (activeIndex !== null) {
            const { renderSetting = {}, videoDuration = 0 } = dataList[activeIndex] || {};
            if (this.state.custom && key === 'startTime') { // 结束时间至少比开始时间高0.2秒
                if (renderSetting.startTime === value) return;
                const miTime = videoDuration || 0.2;
                renderSetting.endTime = Math.max(value + miTime, renderSetting.endTime);
            }
            renderSetting[key] = value;
            dispatch({
                type: 'workspace/changeNow',
                payload: {
                    renderSetting,
                    refresh: false,
                },
            })
                .then(() => {
                    dispatch({
                        type: 'editor/reloadVideoDuration',
                        payload: { uuid },
                    });
                });
        }
    };
    /**
     * 改变自定义
     * @param e
     */
    onChange = (e) => {
        const { checked } = e.target;
        const { props: { workspace: { activeIndex, dataList, uuid: partyUuid }, editor: { parties, nowIndex }, dispatch } } = this;
        const { renderSetting: { segmentPartyDuration = 4 } = {} } = parties[nowIndex];
        const { videoDuration = 0, uuid, type } = dataList[activeIndex] || {};
        const isStatic = CustomSetTimerType.includes(type); // 静态元素
        // 如果有大于自己的才允许非自定义
        let hasGreaterDuration = videoDuration > this.minDuration; // 是否有大于时长的
        dataList.forEach((item) => {
            if (isSetTimerEle(item) && uuid !== item.uuid && item.endTime > 1) {
                hasGreaterDuration = true;
            }
        });
        if (!hasGreaterDuration && !checked && this.haveConcatType && !isStatic) {
            message.error('使用素材原时长会导致转场时间不足');
            return;
        }
        const { renderSetting = {} } = dataList[activeIndex] || {};
        const newRenderSetting = {
            ...renderSetting,
            startTime: isStatic && !checked ? 0 : renderSetting.startTime,
            endTime: isStatic
                     ? segmentPartyDuration
                     : renderSetting.endTime,
            customDuration: checked,
        };
        this.setState(() => ({ custom: checked }), () => {
            if (!checked && !CustomSetTimerType.includes(type)) { // 不是自定义
                this.onTimeChange('startTime', 0);
                this.onTimeChange('endTime', videoDuration);
            }
        });
        dispatch({
            type: 'workspace/changeNow',
            payload: {
                renderSetting: newRenderSetting,
                refresh: false,
            },
        })
            .then(() => {
                dispatch({
                    type: 'editor/reloadVideoDuration',
                    payload: { uuid: partyUuid },
                });
            });
    };
    /**
     * 初始化，看是否有转场和设置片段最小时长
     */
    initSetting = () => {
        const { props: { editor: { parties, nowIndex }, workspace: { activeIndex, dataList, uuid: partyUuid } } } = this;
        if (!parties[nowIndex]) return;
        const { uuid } = dataList[activeIndex] || {};
        const { renderSetting: { concatSet: { concatType = 'none' } = {} } = {} } = parties[nowIndex] ||
        {};
        const { renderSetting: { concatSet: { concatType: nextConcatType = 'none' } = {} } = {} } = parties[nowIndex +
        1] || {};
        // 是否有转场
        this.haveConcatType = concatType !== 'none' || nextConcatType !== 'none';
        if (this.haveConcatType) {
            this.minDuration = parties[nowIndex].elementList.some(
                v => isSetTimerEle(v) && v.uuid !== uuid && v.renderSetting &&
                    v.renderSetting.endTime > 1) ? 0.2 : 1;
        } else {
            this.minDuration = 0.2;
        }
        // 最小片段时长

    };

    render() {
        const { state, props: { workspace: { activeIndex, dataList }, editor: { parties, nowIndex } } } = this;
        const { videoDuration = 0, renderSetting, uuid, type } = dataList[activeIndex] || {};
        const { startTime = 0, endTime = videoDuration } = renderSetting || {};
        // 最小片段时长
        const startAt = Number(startTime);
        const endAt = Number(endTime);
        // 结束时间最小值为 最小可设定时间和开始时间+0.2秒
        const minEndAt = Math.max(startAt + 0.2, this.minDuration);

        let maxVideoDuration = 0;
        dataList.forEach(item => {
            // 检查是否有其他的视频时长
            if (item.renderSetting && item.renderSetting.endTime > maxVideoDuration && item.uuid !==
                uuid &&
                TimeSetVideoType.includes(item.type)) {
                maxVideoDuration = item.renderSetting.endTime;
            }
        });
        if (maxVideoDuration === 0) { // 只有他自己的时候
            maxVideoDuration = 10;
        }
        return (
            <div className={style.body}>
                <div className={style.title}>
                    <span>时间点设置</span>
                    <Checkbox checked={state.custom}
                              onChange={this.onChange}>自定义</Checkbox>
                </div>
                {!CustomSetTimerType.includes(type) && <div className={style.info}>
                    <div>素材时长：</div>
                    <div className={style.infoValue}>{videoDuration.toFixed(1)}s</div>
                </div>}
                <div className={style.info}>
                    <div>开始</div>
                    <div className={style.infoValue}>
                        <NumberInput
                            min={0}
                            max={maxVideoDuration}
                            step={0.1}
                            disabled={!state.custom}
                            value={Number(startAt.toFixed(1))}
                            onChange={(value) => this.onTimeChange('startTime',
                                handleMaxOrMinNum(value, maxVideoDuration))}
                        />
                    </div>
                </div>
                <div className={style.info}>
                    <div>结束</div>
                    <div className={style.infoValue}>
                        <NumberInput
                            min={Number(minEndAt.toFixed(1))}
                            max={999}
                            step={0.1}
                            value={Number(endAt.toFixed(1))}
                            disabled={!state.custom}
                            onChange={(value) => this.onTimeChange('endTime',
                                handleMaxOrMinNum(value, 999, Number(startAt.toFixed(1)) + 0.1))}
                        />
                    </div>
                </div>
            </div>
        );
    };
}
