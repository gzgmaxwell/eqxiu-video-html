import React from 'react';
import { message } from 'antd';
import styles from './index.less';
import Icon from '../../../components/Icon';
import NumberInput from '../../../components/input/numberInput';
import Slider from '../../../components/slider';
import Button from '../../../components/Button/index';
import img from '../../../static/playButton.png';
import { textToVoice } from '../../../../api/music';
import {
    getMaterialToken,
    getVoiceoverVoiceNames,
    uploadQiniuByBase64,
} from '../../../../api/upload';
import { FILE_TYPE, VOICE_JSON } from '../../../../config/staticParams';
import { templateUpload } from '../../../../api/videoStore';
import t2vloading from '../../../static/t2vloading.gif';
import t2vlogo from '../../../static/logo.gif';
import eventEmitter from '../../../../services/EventListener';
import { sendBDEvent } from '../../../../services/bigDataService';

const voiceRate = 50;

class WordVoice extends React.Component {
    constructor(props) {
        super(props);
        this.audio = React.createRef();
        this.state = {
            active: false, // 高级设置
            playing: false,
            loading: false,
            transforming: false, // 转换状态
            currentTime: 0,
            duration: 0,
            progress: 0,
            musicTitle: '', // 语音标题
            voice: '', // 语音内容
            voiceIndex: 0,
            voiceSpeed: 0, // 50正常速度
            voiceVolume: 0, // 50正常速度
            voiceHigh: 0, // 50正常速度
            voiceName: 'xiaoyan',
            base64: '',
            key: '',
            voiceNameType: 2, // 1：讯飞      2：百度
        };
    }

    componentDidMount() {
        this.getVoice();
    }

    getVoice = async () => {
        const { data } = await getVoiceoverVoiceNames();
        if (data.success) {
            this.setState({
                list: data.obj,
                voiceSpeed: data.obj[0].voiceSpeed,
                voiceVolume: data.obj[0].voiceVolume,
                voiceHigh: data.obj[0].voiceHigh,
                voiceName: data.obj[0].voiceName,
                voiceNameType: data.obj[0].voiceNameType,
            });
        } else {
            message.error('获取音库失败');
        }
    };
    superSet = () => {
        const { state: { active } } = this;
        if (active) {
            this.setState({ active: false });
        } else {
            this.setState({ active: true });
        }
    };

    handleState = async () => {
        if (!this.state.base64) {
            await this.getTextToVoice();
        } else {
            this.play();
        }
    };
    getTextToVoice = async (base64Switch = true) => {
        this.setState({ loading: true }); // 用于测试
        const { state: { voice, voiceHigh, voiceVolume, voiceSpeed, voiceName } } = this;
        const params = {
            pitch: voiceHigh,
            speed: voiceSpeed,
            text: voice,
            voiceName,
            volume: voiceVolume,
        };
        const { data } = await textToVoice(params);
        this.setState({ loading: false });
        if (data.success) {
            this.setState({
                base64: data.obj,
            });
            if (base64Switch) {
                this.audio.current.src = `data:audio/wav;base64,${data.obj}`;
                this.play();
            } else {
                await this.transformUoload();
            }
        }
    };
    transform = async () => {
        const { state: { base64, voice } } = this;
        if (!voice) {
            message.warning('请先输入要转为音频的内容');
            return false;
        }
        sendBDEvent({
            position: '编辑器-字转音',
            type: '字转音生成',
        });
        this.setState({ transforming: true });
        if (!base64) {
            await this.getTextToVoice(false);
        } else {
            await this.transformUoload();
        }
    };
    transformUoload = async () => {
        const { props: { onChange } } = this;
        const { state: { base64, musicTitle = '', voice } } = this;
        const { data } = await getMaterialToken(FILE_TYPE.audio);
        if (data.success) {
            const token = data.obj;
            const res = await uploadQiniuByBase64(base64, token,
                () => {},
                () => getMaterialToken(FILE_TYPE.audio));
            if (res.data.key) {
                this.setState({
                    transforming: false,
                    loading: false,
                    key: res.data.key,
                });
                if (typeof onChange === 'function') {
                    const name = musicTitle || voice.trim()
                        .slice(0, 20);
                    onChange({
                        url: res.data.key,
                        name,
                    });
                }
            }
        }
        await this.setTitle();
    };
    setTitle = async () => {
        const { state: { key, musicTitle = '', voice }, props: { onClose, onBack } } = this;
        const name = musicTitle || voice.trim()
            .slice(0, 20);
        const { data } = await templateUpload(key, name, FILE_TYPE.audio);
        if (data.success) {
            message.success('操作成功,您可在我的>音乐中查看到音频');
            eventEmitter.emit('loadMusicLists');
            if (typeof onBack === 'function') {
                onBack();
            } else if (typeof onClose === 'function') {
                eventEmitter.emit('toggleActiveTab', [7, 3]);
                onClose();
            }
        }
    };
    /**
     * 音乐播放
     */
    onLoadedData = () => {
        this.setState({ duration: this.audio.current.duration });
    };
    play = () => {
        if (this.state.playing) {
            this.startPause();
        } else {
            this.startPlay();
        }
    };
    startPlay = () => {
        this.audio.current.play()
            .catch((...e) => { console.log(e);});
        this.setState({ playing: true });
    };
    startPause = () => {
        this.audio.current.pause();
        this.setState({ playing: false });
    };
    onChangeProgress = (value) => {
        this.setState({
            progress: value,
        });
        this.audio.current.currentTime = value / 100 * this.audio.current.duration;
    };
    onTimeUpdate = () => {
        const totalTime = this.audio.current.duration;
        const nowTime = this.audio.current.currentTime;
        this.setState({
            progress: ~~(nowTime / totalTime * 100),
            currentTime: nowTime,
        });
    };
    onPause = () => {
        this.setState({
            playing: false,
            progress: 0,
        });
    };
    /**
     * 输入验证
     * @returns {boolean}
     */
        // 改变描述
    onChangeTitle = (e) => {
        let val = e.target.value;
        const count = e.target.value.length || 0;
        const sub = 20;
        if (count >= sub) {
            val = val.substring(0, sub);
        }
        this.setState({ musicTitle: val });
    };
    // 改变描述
    onChangeVoice = (e) => {
        let val = e.target.value;
        const count = e.target.value.length || 0;
        const sub = 200;
        if (count >= sub) {
            val = val.substring(0, sub);
        }
        this.setState({
            voice: val,
            base64: '',
            playing: false,
        });
    };
    choiceVoice = (e, value, index) => {
        this.startPause();
        this.setState({
            voiceIndex: index,
            voiceName: value.voiceName,
            base64: '',
            playing: false,
            voiceSpeed: value.voiceSpeed, // 50正常速度
            voiceVolume: value.voiceVolume, // 50正常速度
            voiceHigh: value.voiceHigh, // 50正常速度
            voiceNameType: value.voiceNameType, // 语音来源 1 ：讯飞 2：百度
        });
    };
    voiceSpeedChange = (value) => {
        this.setState({
            voiceSpeed: value,
            base64: '',
            playing: false,
        });
    };
    voiceVolumeChange = (value) => {
        this.setState({
            voiceVolume: value,
            base64: '',
            playing: false,
        });
    };
    voiceHighChange = (value) => {
        this.setState({
            voiceHigh: value,
            base64: '',
            playing: false,
        });
    };
    back = () => {
        const { props: { onBack, onClose } } = this;
        if (typeof onBack === 'function') {
            onBack();
        } else if (typeof onClose === 'function') {
            onClose();
        }
    };

    render() {
        const { state, props } = this;
        const { voice } = state;
        const playPause = state.playing ? 'iconfont iconpause-f' : 'iconfont iconplay-f';
        const currentTime = moment(state.currentTime, 'X')
            .format('mm:ss');
        const duration = moment(state.duration, 'X')
            .format('mm:ss');
        const max = state.voiceNameType === 1 ? 100 : 9; // 1：讯飞      2：百度
        const maxVolume = state.voiceNameType === 1 ? 100 : 15;
        return (
            <div className={styles.box}>
                {state.transforming && <div className={styles.mark}>
                    <div>
                        <img src={t2vlogo} alt='' height='34' />
                        <p>音频转化中，请稍后</p>
                        <p>在我的>音乐中可查看到音频</p>
                    </div>
                </div>
                }

                <div className={styles.head}>
                    <div className={styles.headBox}>
                        <span className={styles.word}>字转成音</span>
                        <div className={styles.backWrap} onClick={this.back}>
                            <Icon type='eqf-left' className={styles.left} />
                            <span>返回</span>
                        </div>
                    </div>
                    <Icon onClick={props.onClose} type='eqf-no' className={styles.close} />
                </div>
                <div className={styles.center}>
                    <div className={styles.left}>
                        <textarea onChange={this.onChangeVoice}
                                  value={voice}
                                  placeholder=' 请输入要转为音频的内容'
                        />
                        <p>{voice.length}/200</p>
                    </div>
                    <div className={styles.right}>
                        <p>变声</p>
                        <div className={styles.wrap}>
                            {state.list && state.list.map((v, index) =>
                                <span key={index}
                                      className={state.voiceIndex === index
                                          ? styles.voiceActive
                                          : ''}
                                      onClick={(e) => this.choiceVoice(e, v,
                                          index)}>{v.name}</span>,
                            )}
                        </div>
                        <div className={styles.super}>
                            <div className={styles.name} onClick={this.superSet}>
                                <span className={state.active ? styles.active : ''}>高级设置</span>
                                <Icon className={`${styles.iconDown} ${state.active
                                    ? styles.hover
                                    : ''}`} type='eqf-down' />
                            </div>
                            {state.active && <div className={styles.substance}>
                                <div className={styles.list}>
                                    <div className={styles.title}>语速</div>
                                    <div className={styles.Slider}>
                                        <Slider min={0}
                                                max={max}
                                                step={1}
                                                value={state.voiceSpeed}
                                                tooltipVisible={false}
                                                onChange={this.voiceSpeedChange} />
                                    </div>
                                    <div className={styles.inputBox}>
                                        <NumberInput
                                            min={0}
                                            max={max}
                                            step={1}
                                            value={state.voiceSpeed}
                                            onChange={this.voiceSpeedChange}
                                        />
                                    </div>
                                </div>
                                <div className={styles.list}>
                                    <div className={styles.title}>音量</div>
                                    <div className={styles.Slider}>
                                        <Slider min={0}
                                                max={maxVolume}
                                                step={1}
                                                value={state.voiceVolume}
                                                tooltipVisible={false}
                                                onChange={this.voiceVolumeChange} />
                                    </div>
                                    <div className={styles.inputBox}>
                                        <NumberInput
                                            min={0}
                                            max={maxVolume}
                                            step={1}
                                            value={state.voiceVolume}
                                            onChange={this.voiceVolumeChange}
                                        />
                                    </div>
                                </div>
                                <div className={styles.list}>
                                    <div className={styles.title}>音高</div>
                                    <div className={styles.Slider}>
                                        <Slider min={0}
                                                max={max}
                                                step={1}
                                                value={state.voiceHigh}
                                                tooltipVisible={false}
                                                onChange={this.voiceHighChange} />
                                    </div>
                                    <div className={styles.inputBox}>
                                        <NumberInput
                                            min={0}
                                            max={max}
                                            step={1}
                                            value={state.voiceHigh}
                                            onChange={this.voiceHighChange}
                                        />
                                    </div>
                                </div>
                                <div className={styles.listLast}>
                                    <input type='text'
                                           onChange={this.onChangeTitle}
                                           value={state.musicTitle}
                                           placeholder=' 音乐标题' />
                                    <span>{state.musicTitle.length}/20</span>
                                </div>
                            </div>}
                        </div>
                    </div>
                </div>
                <div className={styles.bottom}>
                    <div className={styles.barBoxBg}>
                        {state.playing && <Slider value={state.progress}
                                                  tooltipVisible={false}
                                                  onChange={this.onChangeProgress}
                        />}
                    </div>
                    <audio ref={this.audio}
                           onPause={this.onPause}
                           onLoadedData={this.onLoadedData}
                           onTimeUpdate={this.onTimeUpdate} />
                    {!state.loading && <Icon onClick={this.handleState}
                                             className={`${styles.playPause} ${voice
                                                 ? ''
                                                 : styles.disabled}`}
                                             type={playPause} />}
                    {state.loading &&
                    <div className={styles.loadingDiv}>
                        <img src={t2vloading} width={22} />
                    </div>}
                    <div className={styles.time}>{currentTime}/{duration}</div>
                    <Button onClick={this.transform} className={styles.button}>转换</Button>
                </div>
            </div>
        );
    }
}

export default WordVoice;
