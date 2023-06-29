import React, { Component } from 'react';
import topEditor from 'Static/timeGuide/top_editor.png';
import topHelp1 from 'Static/timeGuide/time_help1.png';
import styles from './timeGuide.less';

class TimeHelp extends Component {
    constructor(props) {
        super(props);
        const yqCloud = 'http://video-1251586368.file.myqcloud.com/tencent/f1ccdd80c6e7403c9d54d951327a2381';
        this.state = { 
            videos: [
                '',
                '',
                `${yqCloud}/cljAvnWGokYB5mWdQiC_mp4.mp4`,
                `${yqCloud}/1jVc4JV4u1nyok3B9C3_mp4.mp4`,
                `${yqCloud}/fwLJkvGW2BUuUzJaHaq_mp4.mp4`,
            ]
         }
    }
    render() { 
        const { videos } = this.state;
        return ( 
            <React.Fragment>
                <div className={styles.top__container}>
                    <div className={styles.top__content}>
                        <div>
                            <h1>时间轴使用教程</h1>
                            <p>轻轻拖动，调整元素显示时间</p>
                            <p>使视频编辑更灵活</p>
                            {/* <a href="" target="_blank">立即使用</a> */}
                        </div>
                        <img src={topEditor} />
                    </div>
                </div>
                <div className={styles.body__container}>
                    <div className={styles.left__bg}></div>
                    <div className={styles.right__bg}></div>
                    <div className={styles.item}>
                        <h1>1.新增时间轴缩放功能</h1>
                        <p>时间轴刻度缩放：在右下角点击加号，即可放大时间精度，点击减号即可减小时间精度。</p>
                        <p>时间轴滚动条：当元素在当前页面展示不完时，出现左右滑动的滚动条。</p>
                        <img src={topHelp1} />
                    </div>
                    <div className={styles.item}>
                        <h1>2.如何查看不同时间进场的元素</h1>
                        <p>当滑动指针时，你可以在画面上看到不同时间点进场的元素。</p>
                        <div className={styles.video}>
                            <video height="562px" width="100%" autoPlay loop muted src={videos[2]}>您的浏览器不支持 video 标签。</video>
                        </div>
                    </div>
                    <div className={styles.item}>
                        <h1>3.如何设置元素的进出场时间，如何调整片段的时长</h1>
                        <p>进出场时间设置：选中一个元素（画布区点击元素或时间轴上点击元素都能进行元素的选中）后，在时间轴上拖动元素左右两边的两条竖线即可调整进出场时间，左侧为元素进场时间，右侧为元素出场时间。<br />
                            进场时间：到达该时间后，元素出现在视频中。<br />
                            出场时间：到达该时间后，元素在视频中消失。<br />
                            片段时长设置：选中出场时间最晚的元素，再向右拖动它的出场时间即可增加片段时长，反之减少片段时长。
                        </p>
                        <div className={styles.video}>
                            <video width="100%" autoPlay loop muted src={videos[3]}>您的浏览器不支持 video 标签。</video>
                        </div>
                    </div>
                    <div className={styles.item}>
                        <h1>4.如何设置元素同时进场/出场</h1>
                        <p>同时出现：对多个元素设置相同的进场时间<br />同时消失：对多个元素设置相同的出场时间</p>
                        <div className={styles.video}>
                            <video width="100%" autoPlay loop muted src={videos[4]}>您的浏览器不支持 video 标签。</video>
                        </div>
                    </div>
                    <a className={styles.feedback} href="https://h5.ebdan.net/ls/n7yP3VWz" target="_blank">我要吐槽</a>
                </div>
            </React.Fragment>
        );
    }
}
 
export default TimeHelp;