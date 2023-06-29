import React from 'react';
import { connect } from 'dva';
import { Checkbox, message as antMessage, Popover } from 'antd';
import styles from './index.less';
import { isEqual } from 'lodash';
import Icon from '../../components/Icon';
import Silder from '../../components/slider';
import Pie from '../../components/pie';
import { contrast, getVoiceFormEditor } from '../../../util/data';
import { decodeMusic, genMusicUrl } from '../../../util/file';
import CutMusic from './cutMusic';
import eventEmitter from '../../../services/EventListener';
import PlayButton from '../../components/Button/playButton';
import { getTemplateVideoDetail } from '../../../api/template';
import WordVoice from './wordMusic';
import { sendBDEvent } from '../../../services/bigDataService';
import { Tooltip } from 'antd'


function VolumeBar(props) {
    const { value = 50 } = props;
    return (<div className={styles.volumeBar}>
        <Icon type='eqf-volume-high' />
        <Silder tooltipVisible={false} {...props} />
        <div style={{ width: 10 }}>{value}</div>
    </div>);
}

class SoundBLock extends React.Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        const { props: { element } } = this;
        if (element) {
            element.addEventListener('timeupdate', this.timeUpdate);
        }
    }


    componentDidUpdate(preProp) {
        const { props: { element } } = this;
        const { element: preElement } = preProp;
        if (element && preElement !== element) {
            element.addEventListener('timeupdate', this.timeUpdate);
        }
    }

    typeEnum = {
        music: {
            icon: 'eqf-music-l',
            name: '背景音乐',
            sortName: '音乐',
            haveRest: true,
        },
        voice: {
            icon: 'eqf-mic-l',
            name: '旁白',
            sortName: '旁白',
            haveRest: false,
        },
    };

    timeUpdate = () => {
        this.forceUpdate();
    };

    playMusic = () => {
        const { props: { element } } = this;
        if (!element) return;
        element.play();
    };

    pauseMusic = () => {
        const { props: { element } } = this;
        if (!element || element.paused) return;
        element.pause();
        this.forceUpdate();
    };

    onDeleteMusic = () => {
        const { type, onChange } = this.props;
        onChange(type, {
            name: null,
            url: null,
            volume: 100,
        });
    };


    render() {
        const {
            props: {
                type = 'music', name: musicName, element, volume,
                onChangeVolume = null, onRestBgm = null, loop = true,
                onChangeLoop = null, onOpenCut = null, onAdd,
                isAll = true, onOpenF2A = null, oriBgmUrl, url,
            },
        } = this;
        const { icon, name, sortName } = this.typeEnum[type];
        let { haveRest } = this.typeEnum[type];
        if (!oriBgmUrl || url === oriBgmUrl) {
            haveRest = false;
        }
        let noAudio = true;
        if (element) {
            noAudio = false;
        }
        const { duration = 1, currentTime = 0, paused = true } = element || {};
        const progress = currentTime / duration * 100;
        let addBtn = <Icon type='eqf-plus' onClick={(e) => onAdd(type)} />;
        if (type === 'voice' && noAudio) {
            const ChoseAddVoice = <div className={styles.choseAddVoice}>
                <div className={styles.one} onClick={(e) => onAdd(type)}>添加已有旁白</div>
                <div className={styles.one} onClick={onOpenF2A}>字转成音添加旁白
                    <span className={styles.freeTips}>限时免费</span>
                </div>
            </div>;
            addBtn =
                <Popover placement='right' overlayClassName={styles.choiceOverlay} trigger='click'
                         content={ChoseAddVoice}
                         arrowPointAtCenter={true}>
                    <Icon type='eqf-plus' onClick={this.onAdd} />
                </Popover>;
        }


        return (<div className={styles.block}>

            {noAudio ?
             <div className={styles.noMusic}>
                 {addBtn}
                 <div>点击添加{name}</div>
             </div> :
             <React.Fragment>
                 <div className={styles.musicIcon}>
                     <Icon type={icon} />
                     <div>{name}</div>
                     <div className={`${styles.info} ${isAll ? '' : styles.infoParty}`}>
                         {isAll ? '（覆盖整个视频）' : '（覆盖当前片段）'}
                     </div>
                 </div>
                 <div className={styles.centre}>
                     <div className={styles.centre_title}>
                         <Pie className={styles.pie} progress={progress} />
                         <span className={styles.title}>{musicName}</span>
                     </div>
                     <div className={styles.time}>
                         {moment(~~currentTime, 'X')
                             .format('mm:ss')}/
                         {moment(~~duration, 'X')
                             .format('mm:ss')}
                     </div>
                     <div className={styles.soundBarBlock}>
                         <VolumeBar
                             value={volume}
                             onChange={(value) => onChangeVolume(type, value)}
                         />
                     </div>
                 </div>
                 < div className={styles.right}>
                     <div className={styles.buttonGroup}>
                         <div onClick={(e) => onAdd(type)}>
                             <Tooltip title="替换">
                                 <Icon type='eqf-refresh-ccw' />
                             </Tooltip>
                         </div>
                         <div onClick={(e) => onOpenCut(type)}>
                             <Tooltip title="裁剪">
                                 <Icon type='eqf-cut' />
                             </Tooltip>
                         </div>
                         <div onClick={paused ? this.playMusic : this.pauseMusic}>
                             {paused ?
                              <Tooltip title="试听">
                                  <Icon type='eqf-play' />
                              </Tooltip>
                             :
                              <Tooltip title="试听">
                                  <Icon type='eqf-pause' />
                              </Tooltip>
                             }
                         </div>
                         <div onClick={this.onDeleteMusic}>
                             <Tooltip title="删除">
                                 <Icon type='eqf-delete-l' />
                             </Tooltip>
                         </div>
                     </div>
                     <div className={styles.optionBottom}>
                         {haveRest ?
                          <a
                              className={styles.resetLink}
                              onClick={haveRest ? onRestBgm : null}
                          >{`恢复模板${sortName}`}
                          </a> : <span />}
                         <span>
                             <Checkbox
                                 checked={loop}
                                 onChange={(event) => onChangeLoop(type, event)}
                             />
                             循环
                         </span>
                     </div>
                 </div>
             </React.Fragment>
            }

        </div>);
    }
}


@connect(({ editor }) => ({ editor }))
class SoundManage extends React.Component {

    constructor(props) {
        super(props);
        const {
            music,
            bgmLoop,
        } = props.editor;
        this.oriBgm = {};
        const { isAll: isGlobalVoice, voice, voiceLoop } = getVoiceFormEditor(props.editor);
        this.music = null;
        this.voice = null;
        this.state = {
            showTimeLine: true,
            openPreviewModal: false,
            showCut: false,
            isGlobalVoice,
            music,
            voice,
            voiceLoop,
            bgmLoop,
            showF2A: false,
            oriBgmUrl: null,
        };
        // 必须在state初始化后执行
        this.initAudio({
            ...music,
            loop: bgmLoop,
        }, 'music');
        this.initAudio({
            ...voice,
            loop: voiceLoop,
        }, 'voice');
    }


    shouldComponentUpdate(nextProps, nextState) {
        if (isEqual(nextState, this.state)) {
            return true;
        }
        if (contrast(this.props, nextProps, [
            'editor.music.name',
            'editor.music.url',
            'editor.music.volume',
            'editor.voice.name',
            'editor.voice.url',
            'editor.voice.volume',
            'editor.voiceLoop',
            'editor.bgmLoop',
        ])) {
            return true;
        }
        const { editor: { parties, nowIndex } } = this.props;
        const { editor: { parties: nextParties } } = nextProps;
        const prev = parties[nowIndex];
        const next = nextParties[nowIndex];
        if (prev && (prev.renderSetting.bgmVolume !==
            next.renderSetting.bgmVolume)) {
            return true;
        }
        if (prev.voiceLoop !== nextProps.voiceLoop || isEqual(prev.voice, next.voice)) {
            return true;
        }
        return false;
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        const { editor: { music, bgmLoop } } = nextProps;
        const { voice, voiceLoop, isAll: isGlobalVoice } = getVoiceFormEditor(nextProps.editor);
        const newState = {
            ...prevState,
            music,
            voice,
            isGlobalVoice,
            voiceLoop,
            bgmLoop,
        };
        return newState;
    }

    componentDidMount() {
        const { editor: { templateId } } = this.props;
        getTemplateVideoDetail(templateId)
            .then((res) => {
                if (res.data.success) {
                    const bgm = decodeMusic(res.data.obj.bgm);
                    bgm.volume = 100;
                    this.oriBgm = bgm;
                    this.setState({
                        oriBgmUrl: bgm.url,
                    });
                }
            });
    }

    componentWillUnmount() {
        this.destroyAudio('music');
        this.destroyAudio('voice');
    }

    addBgm = (type) => {
        if (type === 'music') {
            eventEmitter.emit('toggleActiveTab', [5, 1]);
        } else {
            eventEmitter.emit('toggleActiveTab', [7, 3]);
        }
        antMessage.info('请在左侧面板选择你需要的声音。');
        this.props.onClose();
    };

    initAudio = ({ name, url, volume, loop = true }, type) => {
        if (!url) {
            this[type] = null;
            return false;
        }
        const dom = document.createElement('audio');
        dom.src = genMusicUrl(url);
        dom.loop = loop;
        dom.ondurationchange = () => this.forceUpdate();
        this[type] = dom;
        this.reloadVolume(type);
    };
    onAllPlay = () => {
        if (!this.music || !this.voice) {
            return;
        }
        this.music.currentTime = 0;
        this.voice.currentTime = 0;
        Promise.all([this.music.play(), this.voice.play()])
            .then(res => this.forceUpdate());
    };
    onAllPause = () => {
        if (!this.music || !this.voice) {
            return;
        }
        this.music.currentTime = 0;
        this.voice.currentTime = 0;
        Promise.all([this.music.pause(), this.voice.pause()])
            .then(res => this.forceUpdate());
    };
    destroyAudio = (type) => {
        if (this[type]) {
            this[type].pause();
            this[type] = null;
        }
        return true;
    };
    onChangePartyVolume = (value) => {
        const { editor: { parties, nowIndex }, dispatch } = this.props;
        const { renderSetting = false, uuid } = parties[nowIndex] || {};
        if (!renderSetting) {
            return false;
        }
        dispatch({
            type: 'editor/changePartyByUuid',
            payload: {
                uuid,
                renderSetting: {
                    ...renderSetting,
                    bgmVolume: value,
                },
            },
        })
            .then(() => {
                this.reloadVolume('music');
                this.reloadVolume('voice');
            });
    };
    /**
     * 改变音量
     * @param type blockType
     * @param { Object } value
     */
    onChangeVolume = (type, value) => {
        let promis = new Promise(() => {});
        if (type === 'voice') {
            promis = this.updateVoice({ volume: value });
        } else {
            const ori = this.props.editor[type];
            promis = this.props.dispatch({
                type: 'editor/saveCommon',
                payload: {
                    [type]: {
                        ...ori,
                        volume: value,
                    },
                },
            });
        }
        promis.then(() => this.reloadVolume(type));
    };
    /**
     * 重新设置时长
     * @param type
     * @return boolean
     */
    reloadVolume = (type) => {
        if (!this[type]) {
            return false;
        }
        const { state: { [type]: stateObj }, props: { editor: { parties, nowIndex } } } = this;
        const { renderSetting: { bgmVolume = 100 } = {} } = parties[nowIndex] || {};
        const volume = stateObj.volume * bgmVolume / 10000;
        this[type].volume = volume;
    };
    /**
     * 改变Block
     * @param type blockType
     * @param { Object } value 值
     */
    onChangeBlock = (type, value) => {
        const ori = this.props.editor[type];
        if (this[type] && value.url === null) {
            this[type].pause();
            this[type] = null;
        }
        let oriVoice = this.props.editor[type];
        let isAll = true;
        if (type === 'voice') {
            ({
                isAll,
                voice: oriVoice,
            } = getVoiceFormEditor(this.props.editor));
        }
        if (value.url && value.url !== oriVoice.url) {
            const { loop = true } = this[type] || {};
            this.destroyAudio(type);
            this.initAudio({
                ...value,
                loop,
            }, type);
        }
        if (type === 'voice') {
            this.updateVoice(value);
        } else {
            this.props.dispatch({
                type: 'editor/saveCommon',
                payload: {
                    [type]: {
                        ...ori,
                        ...value,
                    },
                },
            });
        }
    };

    overCut = ({ path }) => {
        const { state: { showCut } } = this;
        this.onChangeBlock(showCut, { url: path });
        this.closeCut();
    };

    updateVoice = (voice, voiceLoop) => {
        const { dispatch, editor } = this.props;
        const { isAll, voice: oldVoice, voiceLoop: oldVoiceLoop } = getVoiceFormEditor(
            this.props.editor);
        const payload = {
            partyIndex: isAll ? false : editor.nowIndex,
            ...oldVoice,
            ...voice,
        };
        if (voiceLoop !== undefined) {
            payload.voiceLoop = voiceLoop;
        } else {
            payload.voiceLoop = oldVoiceLoop;
        }
        return dispatch({
            type: 'editor/setVoice',
            payload,
        });
    };

    /**
     * 重置背景音乐
     */
    resetBgm = () => {
        const { editor: { templateId } } = this.props;
        getTemplateVideoDetail(templateId)
            .then(res => {
                if (res.data.success) {
                    const bgm = decodeMusic(res.data.obj.bgm);
                    bgm.volume = 100;
                    this.onChangeBlock('music', this.oriBgm);
                }
            });
    };

    onChangeLoop = (type, event) => {
        const hash = {
            music: 'bgm',
            voice: 'voice',
        };
        const loop = event.target.checked;
        if (this[type]) {
            this[type].loop = loop;
        }
        if (type === 'voice') {
            this.updateVoice({}, loop);
        } else {
            this.props.dispatch({
                type: 'editor/saveCommon',
                payload: {
                    [`${hash[type]}Loop`]: loop,
                },
            });
        }
    };

    openCut = (type) => {
        if (this[type]) {
            this.setState({ showCut: type });
        }
    };

    closeCut = () => {
        this.setState({ showCut: false });
    };

    openFont2audio = () => {
        sendBDEvent({
            position: '编辑器-声音管理',
            type: '插入字转音旁白',
        });
        this.setState({ showF2A: true });
    };

    closeFont2audio = () => {
        this.setState({ showF2A: false }, this.forceUpdate);
    };

    overFont2auido = ({ name, url }) => {
        this.updateVoice({
            name,
            url,
            volume: 100,
        }, true)
            .then(() => {
                this.initAudio({
                    name,
                    url,
                    volume: 100,
                    loop: true,
                }, 'voice');
            });
    };

    render() {
        const {
            state: { music, voice, isGlobalVoice, bgmLoop, voiceLoop, showCut, showF2A, oriBgmUrl },
            props: { editor: { parties, nowIndex }, onClose = null },
        } = this;
        const funcProps = {
            onAdd: this.addBgm,
            onChangeVolume: this.onChangeVolume,
            onChange: this.onChangeBlock,
            onRestBgm: this.resetBgm,
            onChangeLoop: this.onChangeLoop,
            onOpenCut: this.openCut,
            onOpenF2A: this.openFont2audio,
        };
        const f2aProps = {
            onClose,
            onChange: this.overFont2auido,
            onBack: this.closeFont2audio,
        };
        const noAudio = !this.music && !this.voice;
        const { renderSetting } = parties[nowIndex];
        let showChilren = null;
        if (showCut) {
            showChilren = <CutMusic
                audio={this[showCut]}
                title={this.state[showCut].name}
                onClose={onClose}
                onBack={this.closeCut}
                onChange={this.overCut}
            />;
        } else if (showF2A) {
            showChilren = <WordVoice
                {...f2aProps}
            />;
        }
        const AllPlayBtn = () => {
            if (!this.music || !this.voice) {
                return null;
            }
            if (this.music.paused && this.voice.paused) {
                return <React.Fragment>
                    <PlayButton
                        className={styles.playBtn}
                        onClick={this.onAllPlay}
                    />
                    <span>同时播放</span>
                </React.Fragment>;
            } else {
                return <Icon type='eqf-pause-f' onClick={this.onAllPause} />;
            }
        };
        return (
            <div className={styles.body}>
                <div className={styles.header}>
                    <span className={styles.title}>声音管理</span>
                    <Icon
                        className={styles.closeIcon} type='eqf-no'
                        onClick={onClose} />
                </div>
                {showChilren && showChilren ||
                (<div className={styles.content}>
                    <SoundBLock
                        type='music'
                        {...music}
                        {...funcProps}
                        loop={bgmLoop}
                        oriBgmUrl={oriBgmUrl}
                        element={this.music}
                    />
                    <div className={styles.splitters}></div>
                    <SoundBLock
                        type='voice'
                        {...voice}
                        {...funcProps}
                        isAll={isGlobalVoice}
                        loop={voiceLoop}
                        element={this.voice}
                    />
                    <div className={styles.partyVolumeBlock}>
                        当前片段的【背景音+旁白音】音量调节：
                        <div className={styles.partyVolumeBar} style={{ width: 154 }}>
                            <VolumeBar
                                disabled={noAudio}
                                value={renderSetting.bgmVolume}
                                onChange={this.onChangePartyVolume}
                            />
                        </div>
                    </div>
                </div>)}
                <div className={styles.bottom}>
                    <AllPlayBtn />
                </div>
            </div>
        );
    }
}


export default SoundManage;
