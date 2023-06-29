import React from 'react';
import styles from '../index.less';
import { Popover } from 'antd';
import Button from '../../../../components/Button/index';
import Icon from '../../../../components/Icon'


// 鼠标抬起事件
let upFunc = () => null
// 每个刻度的长度（px）
let oneWidth  = 222
// 每个刻度的时间(s)
let seconds  = 5
// 字幕编辑区总宽度
let sumWidth  = 904
// 左右间歇
let padingLeft = 6
// 底部拖动条的宽度
let scrollMoveWidth = 160
// 单个字幕持续时间
let subtitleTime = 2

class OperateButton extends React.Component {
    constructor(props){
        super(props)
        this.video = React.createRef()
        this.bar = React.createRef()
        this.moveScroll = React.createRef()
        this.barLeft = 0; // 拖动鼠标以this.bar.current.getBoundingClientRect().x 为准进行参看
    }

    state = {
        transverse:'hoz',
        posterVideo: 'http://video-test-1251586368.image.myqcloud.com/tencent/29bcb45ed60248c4bc8d5cdfc8f99976/screenshot/null_8e013d1c-91fd-4690-a7b6-5c0c74596b53_cover.png?imageMogr2/auto-orient/strip/thumbnail/166x200&ver=109.2-local',
        srcVideo: 'http://video-test-1251586368.file.myqcloud.com/tencent/29bcb45ed60248c4bc8d5cdfc8f99976/df2ed765eb80475e912cbf1a153da9f2.mp4?ver=109.2-local',
        distinguish:false, // 语音识别
        videoDuration:0, // 视频持续时间
        leftStart:6, // 开始位置
        leftEnd: 20,// 结束位置
        playProgress: 6,// 播放进度条初始位置
        currentTime:0, // 当前播放时间
        barRangeWidth:0, // 字幕编辑区域总长度
        barRangeLeft:0, // 字幕区域相对this.bar位置
        scrollLeft:6,// 滚动相对 this.bar 编辑位置
        playing: false, // 正在播放
        dx:0,
        sx:0,
        timeScale:[], // 时间刻度列表
        subtitles:[], // 字幕内容列表
        subtitlesStatus:true, // true 添加，false 编辑
        index:0,// 点击的id
        subtitlePosition:0, // 选中字幕文件的位置
        subtitleWidth:0, // 选中字幕的宽度

    };
    commonBind = (func) => {
        upFunc = (event) =>{
            this.cancelMove(event,func)
        }
        document.addEventListener('mousemove',func,{passive:true});
        document.addEventListener('mouseup',upFunc,{passive:true})
    }
    cancelMove = (e,func) => {
        document.removeEventListener('mousemove',func)
        document.removeEventListener('mouseup',upFunc)
    }
    /**
     * type 拖动类型 type=start|| center || end || scroll
     * @andy
     */;
    startMoveBar = (e,type) => {
        e.stopPropagation();
        e.preventDefault();
        this.videoDuration();
        if(type === 'start') {
            this.commonBind(this.moveBarStart)
        } else if (type === 'end') {
            this.commonBind(this.moveBarEnd)
        } else if (type === 'playProgress') {
            this.commonBind(this.moveBarCenter)
        } else if (type === 'scroll') {
            let dx = e.clientX;
            let sx = this.moveScroll.current.offsetLeft
            this.setState({
                dx,
                sx,
            })
            this.commonBind(this.moveBarScroll);
        }
    }
    moveBarCenter = (e) =>{
        const change = e.clientX - this.barLeft
        let playProgress = change
        if(change<padingLeft){
            playProgress = padingLeft
        }
        if(change>this.state.barRangeWidth){
            playProgress = this.state.barRangeWidth + padingLeft
        }
        this.setState({playProgress:playProgress - this.state.barRangeLeft},()=>{
            let currentTime = this.state.playProgress/this.state.barRangeWidth*this.video.current.duration
            this.video.current.currentTime = currentTime
            this.state.subtitles.forEach(item=>{
                if(item.begin<currentTime&& item.end>currentTime) {
                    this.activeSubtitles(item)
                } else {
                    this.setState({
                        subtitlesStatus:true,
                    })
                }
            })
        })

    }
    /**
     * 拖动滑动条移动字幕编辑区位置
     * @param {[type]} [description]
     * @AndyWay
     */
    moveBarScroll = (e) =>{
        let scrollLeft =  e.clientX-(this.state.dx - this.state.sx)
        if(scrollLeft<padingLeft){
            scrollLeft = padingLeft
        }
        if(scrollLeft>sumWidth-scrollMoveWidth-padingLeft){
            scrollLeft = sumWidth-scrollMoveWidth-padingLeft
        }

        // 滚动范围 = 滚动条最左位置-滚动条最右位置
        const scrollWidth = sumWidth-scrollMoveWidth-padingLeft*2

        // 字幕区域相对this.bar位置
        let barRangeLeft = -(this.state.barRangeWidth / scrollWidth * (scrollLeft - padingLeft))

        this.setState({
            scrollLeft,
            barRangeLeft,
        })

    }
    moveBarStart = (e) =>{
        const {state:{index,subtitles,subtitlePosition,subtitleWidth}} = this
        const change = e.clientX - this.barLeft - subtitlePosition
        subtitles.map((item)=>{
            if(item.index === index) {
                item.subtitlePosition = subtitlePosition + change
                item.subtitleWidth = subtitleWidth - change
            }
        })
        this.setState({subtitles})
    }
    moveBarEnd = (e) =>{
        const {state:{index,subtitles,subtitlePosition,subtitleWidth}} = this
        const change = e.clientX - this.barLeft - subtitlePosition - subtitleWidth
        subtitles.map((item)=>{
            if(item.index === index) {
                item.subtitleWidth = subtitleWidth + change
            }
        })
        this.setState({subtitles})
    }
    videoDuration = () =>{
        const time = this.video.current.duration;
        const barRangeWidth = time/seconds*oneWidth
        const scaleNum = Math.ceil(time / seconds) // 有多少时间刻度
        const timeScale = []
        for (let i= 0;i< scaleNum;i+=1){
            let time = i*seconds
            let left = i*oneWidth + padingLeft
            if(time ===0){
                time = 0
            } else {
                time = moment(time,'X').format('mm:ss')
            }
            timeScale.push({
                id:i,
                time:time,
                left:left,
            })
        }

        this.setState({
            barRangeWidth, // 字幕编辑区域总长度
            videoDuration:time,
            timeScale,
        })
    }
    onLoadedMetadata = () => {
        this.videoDuration()
    }
    /**
     * 切换显示块 如果是本身就关闭
     */;
    cancelBtn = () => {
        this.props.onClose()
    }
    /**
     * 添加字幕
     */
    addSubtitles = () =>{
        const {state:{currentTime,index}} = this
        let Index = index+1
        const subtitles = [
            ...this.state.subtitles,
            {
                begin:currentTime,
                end:currentTime + subtitleTime,
                content:'字幕添加',
                speaker:'Andy',
                active:false,// 激活状态
                index: Index,
                subtitlePosition:currentTime*oneWidth/seconds === 0 ? padingLeft : currentTime*oneWidth/seconds,
                subtitleWidth:subtitleTime*oneWidth/seconds,
            }
        ]
        this.setState({
            index:Index,
            subtitles:subtitles,
        },()=>{
        })
    }
    play =()=>{
        if(this.state.playing){
            this.onPause()
        } else {
            this.onPlay()
        }
    }
    onPlay = () =>{
        this.video.current.play();
        this.setState({playing:true})
    }
    onPause = () =>{
        this.video.current.pause()
        this.setState({playing:false})
    }
    onTimeUpdate =() =>{
        const currentTime= this.video.current.currentTime
        this.state.subtitles.forEach(item=>{
            if(item.begin<currentTime&& item.end>currentTime) {
                this.activeSubtitles(item)
            } else {
                this.setState({
                    subtitlesStatus:true,
                })
            }
        })
        this.setState({
            playProgress:currentTime*oneWidth/seconds,
            currentTime,
        })
    }
    activeSubtitles = (data)=>{
        const {state:{subtitles}} = this
        subtitles.forEach((item)=>{
            if(data.index ===item.index){
                item.active = true
            } else {
                item.active = false
            }
        })
        this.setState({
            subtitlesStatus:false,
            subtitles,
            subtitlePosition:data.subtitlePosition,
            subtitleWidth:data.subtitleWidth,
        })
    }
    render() {
        const { state } = this;
        const width = state.transverse === 'hoz' ? 549:231
        const height = state.transverse === 'hoz' ? 308:410
        const content = (
            <div className={styles.distinguish}>
                <span>自动识别视频中的声音为字幕</span> <span className={styles.closeDistinguish}>×</span>
            </div>
        );
        return (
            <div className={styles.operate}>
                <div className={styles.revoke}>
                    <Icon type='eqf-rotate-ccw' className={styles.eqf_rotate_ccw}/>
                    <span className={styles.revokeBtn}>更换视频</span>
                </div>
                <div className={styles.addSubtitles}>
                    {state.subtitlesStatus && <div className={styles.editSubtitles} onClick={this.addSubtitles}>
                        <Icon type='eqf-pen-l' /> <span className={styles.editSubtitlesBtn}>添加字幕</span>
                    </div>}
                    {!state.subtitlesStatus && <div className={styles.editSubtitles} onClick={this.editSubtitles}>
                        <Icon type='eqf-pen-l' /> <span className={styles.editSubtitlesBtn}>编辑字幕</span>
                    </div>}
                    <Icon type='eqf-delete-l' className={styles.eqf_delete_f}/>
                </div>
                {
                    state.distinguish &&
                    <Popover content={content} placement='top' overlayClassName='distinguish' trigger="click">
                        <div className={styles.distinguishBtn}><Icon type='eqf-mic-l' className={styles.eqf_mic_l}/> <span className={styles.eqf_mic_l_btn}>自动识别</span></div>
                    </Popover>
                }
                {
                    !state.distinguish &&
                    <div className={styles.distinguish_ing}><Icon type='eqf-refresh-cw' className={styles.eqf_mic_l}/> <span className={styles.eqf_mic_l_btn}>自动识别中...</span> <span className={styles.distinguishCancel}>取消</span></div>
                }
            </div>
        );
    }
}

export default OperateButton;
