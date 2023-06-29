import React, { Component } from 'react';
import styles from './flash.less';
import { connect } from 'dva';
import { sendBDEvent, sendBDPage } from '../../services/bigDataService';
import { prev } from '../../config/env';
import { waitChooseVideoType } from '../editor/chooseVideoType';
import Icon from '../components/Icon';
import { genUrl } from '../../util/image';
import env from 'Config/env';

@connect()
export default class flash extends Component {
    state = {
        playingIndex: null,
    };

    componentDidMount() {
        // 字幕首页流量统计
        sendBDPage('/video/index/1');
    }

    openNewTab = () => {
        sendBDEvent({
            position: '创意模板-一键视频',
            type: '一键快闪',
        });
        waitChooseVideoType()
            .then((res) => {
                const url = `${prev}/subEditor/flash/${res}`;
                window.open(url);
            });
    };
    openNewTabTypeMonkey = () => {
        sendBDEvent({
            position: '创意模板-字说字画',
            type: '字说字画',
        });
        const url = `${prev}/subEditor/typeMonkey/1`;
        window.open(url);
    };
    tabs = [
        {
            index: 0,
            title: '一键快闪',
            subTitle: '千万别眨眼，操作简单，一键生成快闪大片',
            video: ['pre', 'pro'].includes(env.name)
                   ? genUrl('/tencent/a93620c2918a480ca20382fe7e0bb77c/YnxA5UobFLtsQplZRWE_mp4.mp4')
                   : genUrl(
                    '/tencent/9dc8a3b1a38f411cace1548624c9fd67/PWVH7J2kvPU0zFHURSr_mp4.mp4'),
            disabled: false,
            onClick: this.openNewTab,
        },
        {
            index: 1,
            title: '自说字画',
            subTitle: '自动识别文字生成酷炫文字视频',
            video: ['pre', 'pro'].includes(env.name)
                   ? genUrl('/tencent/1400b946d047491d9d00e825d9a23c5a/x8LGP61QYs9GmgR0Id3_mp4.mp4')
                   : genUrl(
                    '/tencent/9dc8a3b1a38f411cace1548624c9fd67/9HwdIgdFSe5uFPOXGkr_mp4.mp4'),
            disabled: false,
            onClick: this.openNewTabTypeMonkey,
        },
    ];
    play = (index) => {
        this.setState({ playingIndex: index });
        if (this.currentVideo) {
            this.currentVideo.pause();
        }
        this.currentVideo = document.getElementById(`flash_example_video${index}`);
        this.currentVideo.play();
    };
    pause = (index) => {
        this.setState({ playingIndex: null });
        document.getElementById(`flash_example_video${index}`)
            .pause();
    };

    render() {
        const { playingIndex } = this.state;
        return <div className={styles.tabs}>
            {this.tabs.map((item) => {
                return <div key={item.index} className={`${styles.tab}`}>
                    <div className={styles.title}>{item.title}</div>
                    <div className={styles.sub_title}>{item.subTitle}</div>

                    <div className={styles.video}
                         onClick={playingIndex !== item.index
                                  ? () => this.play(item.index)
                                  : () => this.pause(item.index)}>
                        <video
                            id={`flash_example_video${item.index}`}
                            crossOrigin='Anonymous'
                            src={item.video}
                            loop="loop"
                            autoPlay={playingIndex === item.index}
                        />
                        <div className={styles.desc}>示例</div>
                        {playingIndex !== item.index ? <div className={styles.play}>
                            <Icon type="eqf-play"/>
                        </div> : <div className={styles.pause}>
                             <Icon type="eqf-pause"/>
                         </div>}
                    </div>
                    {item.disabled
                     ? <div className={styles.disabled}>敬请期待</div>
                     : <div className={styles.btn} onClick={item.onClick}>立即制作</div>
                    }
                </div>;
            })}
        </div>;
    }
}

