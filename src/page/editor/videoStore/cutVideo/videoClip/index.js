import styles from './index.less';
import React, { useState, useEffect, useRef } from 'react';
import Slilder from 'Components/slider';
import ScrollInput from 'Components/input/scrollInput';
import Icon from '../../../../components/Icon';
import { time2fs } from '../../../../../util/util';
import { TYPE_SCROLL_INPUT } from '../../../../../config/staticParams/goodsParams';
import { message } from 'antd';

export function VideoClip(props) {
    const { duration, videoClip } = props;
    const minTime = 1;
    let timer = null;
    const step = 10 / duration
    function handleChangeStart(data, index) {
        if (typeof props.handleChangeStart === 'function') {
            props.handleChangeStart(data, index);
        }
    }
    function setTimeoutTip() {
        clearTimeout(timer);
        message.config({
            duration: 2,
            maxCount: 1,
        });
        message.warning('视频裁切短时间是1秒');
    };
    function handleMaxOrMinNum(oriValue, max = 10, min = 0){
        let value = oriValue;
        if (isNaN(value)) {
            value = parseInt(value, 10) || 0;
        }
        if (value > max) {
            console.log(value);
            setTimeoutTip();
            return max;
        }
        if (value < min) {
            setTimeoutTip();
            return min;
        }
        return Number(value);
    }
    function handleChangeEnd(data,index) {
        if (typeof props.handleChangeEnd === 'function') {
            props.handleChangeEnd(data, index);
        }
    }
    function addVideoClip() {
        if (typeof props.addVideoClip === 'function') {
            props.addVideoClip();
        }
    }
    function deleteVideoClip(index) {
        if (typeof props.deleteVideoClip === 'function') {
            props.deleteVideoClip(index);
        }
    }
    function handleOnChange(data, index) {
        if (typeof props.handleOnChange === 'function') {
            props.handleOnChange(data,index);
        }
    }
    function handleOnKeyDown(number, index, position) {
        if (position === 'start') {
            const data = handleMaxOrMinNum(number, videoClip[index].endTime - minTime,0)
            handleChangeStart(data, index);
        } else if (position === 'end') {
            const data = handleMaxOrMinNum(number, duration, videoClip[index].startTime + minTime);
            handleChangeEnd(data, index);
        }
    }
    useEffect(() =>{
        const videoClipInput = document.getElementById('videoClipInput');
        if (videoClipInput) {
            const inputDoms = videoClipInput.getElementsByTagName('input');
            for (let i = 0;i < inputDoms.length; i++) {
                inputDoms[i].setAttribute('readOnly', true);
            }
        }
    })
    return (
        <div className={styles.videoClip}>
            <p className={styles.title}>设置保留时间段</p>
            <div className={styles.clipListWrap}>
                {videoClip.map((item, index)=>
                    <div key={index} className={styles.clipList}>
                        <div className={styles.content}>
                            <Slilder onChange={(data)=> handleOnChange(data,index)}
                                     step={step}
                                     tipFormatter={null}
                                     value={[item.startTime / duration * 100, item.endTime / duration * 100]}
                                     defaultValue={[item.startTime / duration * 100, item.endTime / duration * 100]}
                                     range/>
                            <div className={styles.edit}>
                                <div id='videoClipInput'>
                                    <span className={styles.start}>开始</span>
                                    <ScrollInput
                                        index={index}
                                        position='start'
                                        handleOnKeyDown={handleOnKeyDown}
                                        min={0}
                                        max={duration}
                                        overlayStyle={160}
                                        step={0.1}
                                        scale={0.5}
                                        style={{ width: 56, height: 20, fontSize: '12px', padding: '6px 6px'}}
                                        title={'使用键盘⬅➡进行时间调节'}
                                        trigger={'click'}
                                        placement='bottom'
                                        type={TYPE_SCROLL_INPUT.mm_ss}
                                        time={item.startTime}
                                        defaultValue={time2fs(item.startTime)}
                                        value={time2fs(item.startTime)}
                                        onChange={(value) => handleChangeStart(handleMaxOrMinNum(value, item.endTime - minTime,0), index)} />
                                    <span className={styles.end}>结束</span>
                                    <ScrollInput
                                        index={index}
                                        position='end'
                                        handleOnKeyDown={handleOnKeyDown}
                                        min={0}
                                        max={duration}
                                        overlayStyle={160}
                                        step={0.1}
                                        scale={0.5}
                                        style={{ width: 56, height: 20, fontSize: '12px', padding: '6px 6px'}}
                                        title={'使用键盘⬅➡进行时间调节'}
                                        trigger={'click'}
                                        placement='bottom'
                                        time={item.endTime}
                                        type={TYPE_SCROLL_INPUT.mm_ss}
                                        defaultValue={time2fs(item.endTime)}
                                        value={time2fs(item.endTime)}
                                        onChange={(value) => handleChangeEnd(handleMaxOrMinNum(value, duration, item.startTime + minTime), index)} />
                                </div>
                                {index !== 0 && <p onClick={() => deleteVideoClip(index)}>删除该段</p>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className={styles.addVideoClip} onClick={addVideoClip}>
                <Icon className={styles.pluse} type='eqf-plus'/><span>添加保留时间段</span>
            </div>
        </div>
    );
}
