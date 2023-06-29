import React, { useState, useEffect, useRef } from 'react';
import wavesurfer from 'wavesurfer';
import styles from './wavesurfer.less';


export default function Wavesurfer(props) {
    let waveObject = null;
    const readyWave = useRef(null);
    // 设置缩放
    const setZoom = () => {
        if (readyWave.current) {
            const width = document.getElementById('waveform').getBoundingClientRect().width;
            readyWave.current.zoom(width / props.audioDuration || 10);
        }

    }
    function waveExample() {
        const waveform = document.getElementById('waveform');
        waveObject = wavesurfer.create({
            container: waveform,
            waveColor: 'rgba(54,76,240,0.4)',
            progressColor: 'rgba(54,76,240,0.4)',
            cursorColor: 'rgba(0,0,0,0)',
            barWidth: 0.5,
            barRadius: 0.5,
            cursorWidth: 0.5,
            height: 50,
            barGap: 0.5,
            splitChannels: false, // 如何启用分割通道
            responsive: true,
            scrollParent: true,
        });
        window.wave = waveObject;
        waveObject.load(props.audio.src);
        waveObject.on('ready', () => {
            readyWave.current = waveObject;
            setZoom();
            if (props.playing) {
                const starTime = Math.max(props.start, props.curPlayPos)
                waveObject.setMute(true); // 使当前声音静音。可以是布尔值，true以使声音静音或false取消
                waveObject.play(starTime * props.audioDuration, props.end * props.audioDuration);
            }

        });
        waveObject.on('pause', () => {
            if (!props.playing) {
                waveObject.pause(props.start);
            }
        });
        return waveObject;
    }

    useEffect(() => {
        waveExample();
        return () => {
            if (waveObject) {
                waveObject.destroy();
            }
        };
    }, []);

    useEffect(setZoom, [props.scale, props.audioDuration])

    return (
        <div id='waveform' className={styles.wavesurfer}></div>
    );
}