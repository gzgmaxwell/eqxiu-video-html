import EventEmitter from 'events';


class LikeVideo {
    constructor(props) {
        this.state = {
            duration: 4000,
            currentTime: 0,
            playing: false,
            ...props,
        };
        this.eventer = new EventEmitter();
    }

    _requestCall = null;
    _prvFrameTime = 0;
    play = () => {
        this.state.playing = true;
        this._prvFrameTime = performance.now();
        const updateTime = () => {
            const distenceTime = performance.now() - this._prvFrameTime;
            this._prvFrameTime = performance.now();
            this.state.currentTime += distenceTime;
            if (this.state.currentTime > this.state.duration) {
                if (this.callEnd()) return;
            }
            if (this.state.playing && this._requestCall) {
                this._requestCall = requestAnimationFrame(updateTime);
            } else {
                this._requestCall = null;
            }
            this.trackEvent('timeupdate');
        };
        if (!this._requestCall) {
            console.log('启动');
            this._requestCall = requestAnimationFrame(updateTime);
        }
    };

    pause = () => {
        requestAnimationFrame(() => {
            this.state.playing = false;
            cancelAnimationFrame(this._requestCall);
            this._requestCall = null;
        });
    };

    callEnd() {
        if (this.state.loop) {
            this.state.currentTime = 0;
            return false;
        } else {
            this.state.playing = false;
            this._requestCall = null;
            this.trackEvent('ended');
            return true;
        }
    }

    on = (type, callBack) => {
        this.eventer.on(type, callBack);
    };

    addEventListener = (...args) => {
        return this.on(...args);
    };

    removeEventListener = (...args) => {
        return this.eventer.removeListener(...args);
    };

    destroy = () => {
        this.state.playing = false;
        this.eventer.removeAllListeners();
        cancelAnimationFrame(this._requestCall);
        this._requestCall = null;
    };

    trackEvent = (type, data = {}) => {
        const eventData = {
            target: this,
            type, ...data
        };
        this.eventer.emit(type, eventData);
    };
}


export default LikeVideo;
