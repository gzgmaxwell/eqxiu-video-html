import React from "react";
import { connect } from "dva";
import { Tooltip } from "antd";
import styles from "./index.less";
import Icon from "../../components/Icon";
import Modal from "../../components/modal";
import PreviewVideo from "../right/previewVideo";
import TimeLine from "./timeLine/timeLine";
import { contrast, getVoiceFormEditor, isOpenPreviewModal } from "../../../util/data";
import SoundManage from "../soundManage";
import eventEmitter from "../../../services/EventListener";
import PlayButton from "../../components/Button/playButton";
import { prev } from "../../../config/env";
import LikeVideo from "../../../services/likeVideo";
import { genMusicUrl } from "../../../util/file";
import { sendBDEvent } from "../../../services/bigDataService";

@connect(
    ({
        editor,
        editor: { parties, nowIndex, music, bgmLoop },
        timeLine: { playing, currentTimes, onWait },
        workspace: { uuid }
    }) => {
        const { voice, voiceLoop, isAll } = getVoiceFormEditor(editor);
        const { renderSetting: { bgmVolume = 100 } = {} } = parties[nowIndex] || {};
        const voiceBeginTime = parties.reduce((prev, cur, index) => {
            if (index < nowIndex && cur.renderSetting) {
                const {
                    segmentPartyDuration,
                    concatSet: { concatType = "none", duration = 800 } = {}
                } = cur.renderSetting;
                const concatTime = concatType === "none" ? 0 : duration / 1000;
                const oneDuration = segmentPartyDuration - concatTime;
                return prev + oneDuration;
            }
            return prev;
        }, 0);
        return {
            uuid,
            playing,
            haveLoading: onWait.length > 0,
            currentTime: currentTimes[uuid],
            duration:
                (parties[nowIndex] &&
                    parties[nowIndex].renderSetting &&
                    parties[nowIndex].renderSetting.segmentPartyDuration) ||
                4,
            partyVolume: bgmVolume / 100,
            music: {
                ...music,
                loop: bgmLoop
            },
            voice: {
                ...voice,
                loop: voiceLoop,
                isAll
            },
            voiceBeginTime
        };
    }
)
class EditorBottom extends React.PureComponent {
    state = {
        showTimeLine: true,
        openSoundManage: false,
        topDis: 40,
        leftDis: 100
    };

    componentDidMount() {
        if (!isOpenPreviewModal()) {
            eventEmitter.addListener("showModal", this.eventShowModal);
            this.initVideo();
            eventEmitter.on("resetPlayer", this.onReset);
        }
        eventEmitter.on("openSoundManage", this.openSoundManage);
        document.addEventListener("keydown", this.keydown);
        this.getPreviewPos();
        document.getElementById("previewBody").addEventListener("scroll", this.getPreviewPos);
        window.addEventListener("resize", this.getPreviewPos);
    }

    _BeforePlaying = false;

    componentDidUpdate(prevProps) {
        const {
            props: { haveLoading, playing, music = {}, voice = {}, currentTime }
        } = this;
        const {
            haveLoading: prvHaveLoading,
            music: pMusic = {},
            pPlaying,
            voice: pVoice = {},
            currentTime: preCurrentTime
        } = prevProps;
        if (!isOpenPreviewModal()) {
            const soundArray = ["url", "volume", "loop"];
            if (contrast(music, pMusic, soundArray)) {
                this.initAudio(music, "music");
            }
            if (contrast(voice, pVoice, soundArray)) {
                this.initAudio(voice, "voice");
            }
            if (currentTime !== preCurrentTime) {
                this._initiativePause = false;
            }

            if (haveLoading !== prvHaveLoading && (playing || this._BeforePlaying)) {
                if (haveLoading) {
                    this.onPause();
                    this._BeforePlaying = playing;
                } else if (!haveLoading) {
                    if (this._BeforePlaying) {
                        this.onPlay(false);
                    }
                }
            }
        }
    }

    componentWillUnmount() {
        eventEmitter.removeListener("openSoundManage", this.openSoundManage);
        eventEmitter.removeListener("resetPlayer", this.onReset);
        document.removeEventListener("keydown", this.keydown);
        if (document.getElementById("previewBody")) {
            document
                .getElementById("previewBody")
                .removeEventListener("scroll", this.getPreviewPos);
        }
        window.removeEventListener("resize", this.getPreviewPos);
        if (!isOpenPreviewModal()) {
            this.onReset();
        }
        if (this._likeVideo) {
            this._likeVideo.destroy();
        }
    }

    getPreviewPos = () => {
        const { left, top, width, height } = document
            .getElementById("workspace")
            .getBoundingClientRect();
        this.setState({
            topDis: top + height / 2 - 20,
            leftDis: left + width / 2 - 20
        });
    };
    initVideo = () => {
        const {
            props: { music, voice }
        } = this;
        this.initAudio(music, "music");
        this.initAudio(voice, "voice");
    };

    initAudio = (data, type) => {
        if (!data) {
            this[type] = new Audio();
            return;
        }
        let music = null;
        const { url: src, loop = false, volume = 0 } = data;
        if (this[type] && typeof this[type].pause === "function") {
            music = this[type];
        } else {
            music = new Audio();
            music.addEventListener("waiting", this.onLoadVideo);
            music.addEventListener("seeking", this.onLoadVideo);
            music.addEventListener("canplay", this.onCanPlay);
            music.addEventListener("seeked", this.onCanPlay);
        }
        if (src) {
            const nextSrc = genMusicUrl(src);
            if (music.src.includes(nextSrc)) {
                music.load();
            } else {
                music.src = null;
                music.src = nextSrc;
            }
            this._audioPromise[type] = new Promise(resolve => resolve());
        } else {
            music.src = null;
            music.load();
            this._audioPromise[type] = new Promise(resolve => resolve());
        }
        music.loop = !!loop;
        music.volume = Number(volume) / 100;
        music.preload = "auto";
        this[type] = music;
    };

    onReset = () => {
        if (this._likeVideo) {
            this._likeVideo.destroy();
        }
        // this.onPause();
        this.initVideo();
        this._likeVideo = null;
        const {
            props: { dispatch }
        } = this;
        dispatch({
            type: "timeLine/clearWaiting"
        });
        this._BeforePlaying = false;
    };
    // likeVideo类
    _likeVideo = null;
    onPlay = async (reset = true) => {
        const {
            props: { dispatch, duration, uuid }
        } = this;
        let currentTime = this.props.currentTime || 0;
        if (currentTime >= duration * 1000) {
            currentTime = 0;
        }
        if (!this._likeVideo) {
            sendBDEvent({
                position: "预览播放",
                type: "从头播放"
            });
            await dispatch({
                type: "timeLine/changeCurrentTime",
                payload: {
                    uuid,
                    currentTime
                }
            });
            this._likeVideo = new LikeVideo({
                duration: duration * 1000,
                currentTime: 0,
                loop: false
            });
            // this.init()
        }
        this._likeVideo.state.currentTime = currentTime;
        this._likeVideo.state.duration = duration * 1000;
        this._likeVideo.addEventListener("timeupdate", this.updateTime);
        this._likeVideo.addEventListener("ended", this.onEnded);
        this._likeVideo.play();
        this.playAudio();
        dispatch({
            type: "timeLine/play"
        });
    };
    _audioPromise = {
        music: new Promise(resolve => resolve()),
        voice: new Promise(resolve => resolve())
    };
    playAudio = () => {
        const {
            voice: { isAll = true },
            voiceBeginTime,
            currentTime,
            partyVolume = 1
        } = this.props;
        let sCurrentTime = currentTime / 1000;
        const playOne = async type => {
            const { loop = false, volume = 0 } = this.props[type] || {};
            const player = this[type];
            if (player && typeof player.play === "function") {
                let { duration } = player;
                if (!duration) {
                    // 没有时长可能是没有加载完毕 需要等待
                    const promise = new Promise(resolve => {
                        const durationchange = ({ target }) => {
                            resolve(target.duration);
                        };
                        player.addEventListener("durationchange", durationchange, { once: true });
                    });
                    duration = await promise;
                    const { playing: innerPlaying, currentTime: newCurrent } = this.props;
                    // 依然没有拿到duration 或者 playing 已经停止
                    if (!duration || !innerPlaying) {
                        return;
                    }
                    // 更新时间
                    sCurrentTime = newCurrent / 1000;
                }
                if (type === "voice" && !isAll) {
                    // 如果是片段旁白
                    if (duration < sCurrentTime) {
                        if (loop) {
                            player.currentTime = sCurrentTime % duration;
                        } else {
                            player.currentTime = duration;
                            return;
                        }
                    } else {
                        player.currentTime = sCurrentTime;
                    }
                } else {
                    const totalCurrent = voiceBeginTime + sCurrentTime;
                    if (duration > totalCurrent) {
                        player.currentTime = totalCurrent;
                    } else if (loop) {
                        player.currentTime = (voiceBeginTime + sCurrentTime) % duration;
                    } else {
                        return;
                    }
                }
                player.loop = loop;
                player.volume = (volume / 100) * partyVolume;
                if (player.src) {
                    const promisePlayer = this._audioPromise[type];
                    const realPlay = () => {
                        this._audioPromise[type] = player.play().catch(console.error);
                    };
                    if (promisePlayer) {
                        promisePlayer.then(realPlay).catch(console.log);
                    } else {
                        realPlay();
                    }
                }
            }
        };
        playOne("music");
        playOne("voice");
    };

    pauseAudio = () => {
        const pauseOne = type => {
            const player = this[type];
            if (player && typeof player.pause === "function") {
                const promiseAction = this._audioPromise[type];
                const realPause = () => {
                    this._audioPromise[type] = player.pause();
                };
                if (promiseAction) {
                    promiseAction.then(realPause);
                } else {
                    realPause();
                }
            }
        };
        pauseOne("music");
        pauseOne("voice");
    };

    _initiativePause = false;
    onPause = e => {
        const {
            props: { dispatch }
        } = this;
        this._BeforePlaying = false;
        if (this._likeVideo) {
            this._likeVideo.removeEventListener("timeupdate", this.updateTime);
            this._likeVideo.removeEventListener("ended", this.onEnded);
            this._likeVideo.pause();
            this.pauseAudio();
        }
        if (e) {
            this._initiativePause = true;
            setTimeout(() => {
                this._initiativePause = true;
            }, 50);
        }
        return dispatch({ type: "timeLine/pause" });
    };

    onEnded = () => {
        const {
            props: { dispatch, uuid }
        } = this;
        this.onReset();
        dispatch({
            type: "timeLine/changeCurrentTime",
            payload: {
                uuid,
                currentTime: 0
            }
        });
    };

    updateTime = ({ target }) => {
        const {
            props: { dispatch, uuid }
        } = this;
        const {
            state: { currentTime }
        } = target;
        dispatch({
            type: "timeLine/changeCurrentTime",
            payload: {
                uuid,
                currentTime,
                keepPlaying: true
            }
        });
    };

    keydown = e => {
        if (document.activeElement !== document.body || !this._keydown) return false;
        const { keyCode } = e;
        const {
            props: { playing }
        } = this;
        if (keyCode === 32) {
            e.preventDefault();
            e.stopPropagation();
            if (playing) {
                this.onPause(e);
            } else {
                this.onClickPlay(e);
            }
        }
    };

    _keydown = true;
    eventShowModal = () => {
        this.onPause(new Event("MouseEvent"));
        this._keydown = false;
        const openKeyDown = () => {
            this._keydown = true;
            eventEmitter.removeListener("hiddenModal", openKeyDown);
        };
        eventEmitter.addListener("hiddenModal", openKeyDown);
    };
    /**
     * 编辑区元素hover虚线状态控制 true:禁用
     */
    eventEmitterELmHover = status => {
        eventEmitter.emit("elementCommHoverStatus", status);
    };
    setShowTimeLine = showTimeLine => {
        this.setState({ showTimeLine });
    };
    openSoundManage = () => {
        this.setState({ openSoundManage: true });
    };
    closeSoundManage = () => {
        this.setState({ openSoundManage: false });
    };
    onClickPlay = e => {
        if (isOpenPreviewModal()) {
            this.setState({ openPreviewModal: true });
            return;
        }
        return this.onPlay(e);
    };
    _waitLoading = null;
    onLoadVideo = e => {
        const {
            props: { dispatch }
        } = this;
        this.cancelLoad();
        const { src } = e.target || {};
        this._waitLoading = setTimeout(() => {
            this.cancelLoad();
            dispatch({
                type: "timeLine/addWait",
                payload: {
                    uuid: src
                }
            });
        }, 300);
    };

    cancelLoad = () => {
        if (this._waitLoading) {
            clearTimeout(this._waitLoading);
            this._waitLoading = null;
        }
    };

    onCanPlay = e => {
        if (this._waitLoading) {
            this.cancelLoad();
        }
        const {
            props: { dispatch }
        } = this;
        dispatch({
            type: "timeLine/removeWait",
            payload: {
                uuid: e.target.src
            }
        });
    };
    onClosePreview = () => {
        this.setState({ openPreviewModal: false });
    };
    openGuid = () => {
        window.open(`${prev}/timeGuide`);
    };

    render() {
        const {
            props: { playing },
            state: { openPreviewModal, showTimeLine, openSoundManage, leftDis, topDis }
        } = this;
        const isPlaying = playing || this._BeforePlaying;
        return (
            <div className={styles.bottom}>
                <div className={styles.top}>
                    <div className={styles.left}>
                        <Tooltip title='如何使用时间轴'>
                            <Icon
                                type='eqf-why-f'
                                className={styles.howUse}
                                onClick={this.openGuid}
                            />
                        </Tooltip>
                    </div>
                    <div className={styles.centre}>
                        <div className={styles.previewBox}>
                            {isPlaying ? (
                                <Icon
                                    type='eqf-pause-f'
                                    className={styles.playBtn}
                                    onClick={this.onPause}
                                    title={"暂停 [空格]"}
                                />
                            ) : (
                                <PlayButton onClick={this.onClickPlay} className={styles.playBtn} />
                            )}
                        </div>
                    </div>
                    <div></div>
                </div>
                <div className={styles.middle}>
                    <div className={styles.middleContent}>
                        <TimeLine />
                    </div>
                </div>
                <div />
                <Modal visible={openPreviewModal} onCancel={this.onClosePreview}>
                    <PreviewVideo visible={openPreviewModal} />
                </Modal>
                <Modal visible={openSoundManage} onCancel={this.closeSoundManage}>
                    <SoundManage onClose={this.closeSoundManage} />
                </Modal>
            </div>
        );
    }
}

export default EditorBottom;
