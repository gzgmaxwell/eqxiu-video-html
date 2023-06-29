export default class MultipleVideo {
    constructor(props) {
        const videoList = props;
        let totalTime = this.state.duration;
        this.eventList = {}; // 事件绑定列表
        videoList.forEach((item, index) => {
            if (!item.obj) throw new Error('MultipleVideo required has video Obj');
            if (item.volume !== undefined && item.volume !== null) {
                item.obj.volume = item.volume;
            }
            if (item.time) return;
            if (item.main !== undefined) {
                if (item.main && item.main > 0) { // main为0表示根据最长元素的播放时间为准；非0 表示根据main 值时间为准
                    this.state.mainIndex = index;
                    this.state.duration = item.main; // 新增的预览主时间定义 :[注意：要求每个item 对象上必须具有item.main 对象的存在]
                } else {
                    this.state.duration = this.state.duration;
                }
            }
            if (item.loop) {
                item.obj.loop = 'true';
            }
            if (!this.state.mainIndex === null && item.obj.duration > totalTime) {
                totalTime = item.obj.duration;
                this.state.mainIndex = index;
            }
            item.obj.addEventListener('error', this.errorPause); // 当在音频/视频加载期间发生错误时
            item.obj.addEventListener('play', this.onPlay); // 当在音频/视频已经开始播放
            item.obj.addEventListener('ended', this.onEnded); // 当目前的播放列表已结束时
            item.obj.addEventListener('seeked', this.seekedOne);
            if (this.state.mainIndex === index) {
                item.obj.addEventListener('timeupdate', this.onTimeUpdate); // 当目前的播放列表已结束时
            }
            // item.obj.addEventListener('waiting', this.errorPause); // 当视频由于需要缓冲下一帧而停止
        });
        this.state.videoList = props;
    }

    state = {
        videoList: [], // 需要播放的视频对象集合
        volume: 1, // 声音大小
        progress: 0, // 播放进度
        mainIndex: null, // 视频播放事件最长的索引值
        currentTime: 0, // 目前的播放时间位置
        duration: 0, // 目前的播放的总时间
        playEnd: false, // 播放结束
        muted: false, // 过来的声音是否是静音 false代表非静音 true 影音状态
        playing: false, // 正在播放
        entrytTime: 0, // 片段的进入时间
        exitTime: 0, // 片段的退出时间
    };

    addEventListener = (type, callBack) => {
        if (typeof callBack !== 'function') return;
        const events = this.state[`on${type}`];
        if (!events) {
            this.state[`on${type}`] = new Set();
            this.state[`on${type}`].add(callBack);
        } else {
            events.add(callBack);
        }
    };


    removeEventListener = (type, callBack) => {
        const events = this.state[`on${type}`];
        if (!events) return;
        events.delete(callBack);
    };
    /**
     * 销毁对象
     */
    dispose = () => {
        try {
            this.state.playing = false;
            this.state.videoList.forEach((item, index) => {
                item.obj.pause();
                item.obj.removeEventListener('error', this.onErrorVideo); // 当在音频/视频加载期间发生错误时
                item.obj.removeEventListener('ended', this.onEnded); // 当目前的播放列表已结束时
                if (this.state.mainIndex === index) {
                    item.obj.removeEventListener('timeupdate', this.onTimeUpdate); // 当目前的播放列表已结束时
                }
                item.obj.removeEventListener('waiting', this.errorPause); // 当视频由于需要缓冲下一帧而停止
                Object.keys(this.eventList)
                    .forEach(value => {
                        item.obj[`on${value}`] = null;
                    });
                item.obj = null;
            });
        } catch (e) {
            console.error(e);
        }
    };


    play = () => {
        try {
            this.state.playing = true;
            if (this.state.playEnd) {
                this.state.currentTime = 0;
                this.state.progress = 0;
            }
            this.state.videoList.forEach((item, index) => {
                if (item.obj.ended && !this.state.playEnd) {
                    this.hanlderPause(item);
                } else {
                    const playTime = item.time && item.time[0]
                                     ? item.time[0] + this.state.currentTime
                                     : this.state.currentTime;
                    this.handlerVolume(item);
                    const playbackRate = item.playbackRate
                                         ? item.playbackRate
                                         : item.obj.defaultPlaybackRate;
                    // 片段进出时间设置 entrytTime and exitTime
                    const entrytTime = item.rangeTime && item.rangeTime[0] || 0;
                    const exitTime = item.rangeTime && item.rangeTime[1] || 9999;
                    // 开始播放的时间 playTimeSum
                    const playTimeSum = playTime + entrytTime;

                    item.obj.playbackRate = playbackRate;
                    item.obj.currentTime = Number(playTimeSum) || 0;
                    // 如果开始时间小于起始时间
                    if (item.rangeTime[0] <= this.state.currentTime && item.rangeTime[1] >=
                        this.state.currentTime) {
                        item.obj.style.visibility = 'visible';
                        if (!item.obj.playing) {
                            item.promise = item.obj.play()
                                .catch(e => {
                                    console.log(e.message);
                                    console.log(item);
                                });
                        }
                        return;
                    } else {
                        item.obj.style.visibility = 'hidden';
                        this.hanlderPause(item);
                    }
                }
            });
            if (this.state.playEnd) this.state.playEnd = false;
        } catch (e) {
            console.error(e);
        }
    };

    /**
     * 设置单个video音量
     * @param item
     */
    handlerVolume = (item) => {
        try {
            const volume = item.muted ? 0 : (item.volume !== undefined
                                             ? item.volume * this.state.volume
                                             : this.state.volume);
            item.obj.volume = volume;
        } catch (e) {
            console.error(e);
        }
    };

    hanlderPause = (item) => {
        try {
            if (item.promise) {
                item.promise.then(() => {
                    item.obj.pause();
                    item.promise = null;
                });
            } else {
                item.obj.pause();
            }
        } catch (e) {
            console.error(e);
        }
    };

    pause = () => {
        this.state.playing = false;
        this.state.videoList.forEach(this.hanlderPause);
    };

    errorPause = (e) => {
        this.pause();
        e.target.addEventListener('playing', this.errorPlay);
    };
    errorPlay = (e) => {
        this.play();
        e.target.removeEventListener('playing', this.errorPlay);
    };
    onErrorVideo = () => {
        this.pause();
    };
    onEnded = (e) => {
        try {
            const target = e.target;
            if (target === this.state.videoList[this.state.mainIndex || 0].obj) {
                this.play();
                return;
            }
            this.state.videoList.forEach((item, index) => {
                if (item.obj && item.obj.ended) {
                    if (item.visible) {
                        item.obj.style.visibility = 'visible';
                    } else {
                        item.obj.style.visibility = 'hidden';
                    }
                    // if (item.loop) { // loop：true 播放结束后继续重新播放
                    //     item.promise = item.obj.play()
                    //         .catch(e => {console.log(e);});
                    // }
                }
            });
        } catch (e) {
            console.error(e);
        }
    };
    onTimeUpdate = (e) => {
        if (!this.state.playing || this.state.playEnd) return;
        if (this.state.mainIndex === undefined || this.state.mainIndex === null ||
            !this.state.videoList[this.state.mainIndex].obj) {
            return;
        }
        const nowTime = e.target.currentTime;
        this.state.currentTime = Number(nowTime) || 0;
        this.state.progress = ~~(nowTime / this.state.duration * 100);
        // 如果超过main 则重放
        if (this.state.currentTime > this.state.videoList[this.state.mainIndex].main) {
            this.progress = 0;
            this.state.playEnd = true;
            this.play();
            return;
        }
        this.handlerTimeContrl();
        const events = this.state.ontimeupdate;
        if (events) {
            events.forEach(v => v(e));
        }
    };

    /**
     * 根据当前播放时间控制视频状态
     * @param playCtr 是否控制播放和暂停
     */
    handlerTimeContrl(playCtr = true) {
        try {
            this.state.videoList.forEach((item, index) => {
                // 不循环的还没到时间 就停在最后
                if ((item.rangeTime[1] > this.state.currentTime && item.rangeTime[0] <
                    this.state.currentTime) && item.obj.ended && !item.loop) {
                    playCtr && this.hanlderPause(item);
                    item.obj.style.visibility = 'visible';
                    return;
                }
                // 如果进入入场时间 则显示 并且播放
                if (item.rangeTime && this.state.currentTime >= item.rangeTime[0] &&
                    this.state.currentTime < item.rangeTime[1] &&
                    item.obj.paused) {
                    item.obj.style.visibility = 'visible';
                    playCtr && (item.promise = item.obj.play()
                        .catch(e => {
                            console.log(e.message);
                            console.log(item);
                        }));
                    return;
                }
                // 如果在播放区间之外，则隐藏并暂停
                if (item.rangeTime &&
                    (this.state.currentTime > item.rangeTime[1] || this.state.currentTime <
                        item.rangeTime[0])) {
                    playCtr && this.hanlderPause(item);
                    item.obj.currentTime = Number((item.time || [0])[0]) || 0;// 重置时间
                    item.obj.style.visibility = 'hidden';
                    return;
                }
            });
        } catch (e) {
            console.error(e);
        }
    }

    /**
     * seekedOne
     */
    seekedOne = (e) => {

    };


    // /**
    //  *
    //  */
    // addEventListener = (type, callback, options = {}) => {
    //     const pList = this.state.videoList.map(value => {
    //         return new Promise(resolve => {
    //             value.obj.addEventListener(type, (res) => {
    //                 resolve(res);
    //             }, options);
    //         });
    //     });
    //     const rcall = Promise.all(pList)
    //         .then((eList) => callback(eList[0]));
    //     if (this.eventList[type]) {
    //         this.eventList[type].add(rcall);
    //     } else {
    //         this.eventList[type] = new Set([rcall]);
    //     }
    // };

    /**
     * 执行回调
     * @param e
     * @param obj
     */
    doEvents = (type, e) => {
        const eventName = `on${type}`;
        if (this.state[eventName]) {
            const eve = e;
            eve.target = this;
            this.state[eventName].forEach(callbackfn => callbackfn(eve));
        }
    };

    /**
     * 获得当前时间
     */
    get currentTime() {
        return this.state.currentTime;
    }

    /**
     * 获得当前音量状态muted
     */
    get muted() {
        return this.state.muted;
    }

    /**
     * 获得当前播放状态
     */
    get playState() {
        return this.state.playing;
    }

    /**
     * 获得视频总时间
     */
    get duration() {
        return this.state.duration;
    }

    /**
     * 获得视频进度
     */
    get progress() {
        return this.state.progress;
    }

    /**
     *获得当前音量
     */
    get volume() {
        return this.state.volume * 100;
    }

    set currentTime(value) {
        const progress = value / this.state.duration * 100;
        this.progress = progress;
    }

    /**
     * 设置视频进度
     * @params {[type]} value [description]
     * @Andy
     */
    set progress(value) {
        try {
            const currentTime = value / 100 * this.state.duration;
            this.state.currentTime = currentTime;
            this.state.progress = value;
            this.handlerTimeContrl(false);
            this.state.videoList.forEach((item, index) => {
                const relCurrentTime = Math.max(
                    (currentTime + (item.time && item.time[0] || 0) - (item.rangeTime &&
                        item.rangeTime[0] || 0)), 0) || 0;
                item.obj.currentTime = Number(relCurrentTime) || 0;
            });
        } catch (e) {
            console.error(e);
        }
    }

    /**
     * 设置音量
     * @params {[type]} value [description]
     * @Andy
     */
    set volume(value) {
        this.state.volume = value;
        if (value === 0) {
            this.state.muted = true; // 表示是静音
        } else {
            this.state.muted = false; // 表示非静音
        }
        this.state.videoList.forEach(this.handlerVolume);
    }
}

