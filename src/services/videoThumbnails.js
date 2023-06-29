/**
 * 用于获取置顶videoSrc 的预览视图
 */
export default class VideoThumbnails {
    constructor({ src, width = null, height = null, defaultImg = null }) {
        const video = document.createElement('video');
        this.cover = defaultImg ? document.createElement('img') : null;
        if (this.cover) {
            this.cover.src = defaultImg;
        }
        video.src = src;
        this.video = video;
        this.width = width;
        this.height = height;
        this.canvasArray = [];
        this.disposed = false; // 是否已经被销毁
        this.waitReplace = null;
        this.interval = null;
    }

    /**
     * 销毁
     */
    dispose = () => {
        this.disposed = true;
        this.video = null;
        clearInterval(this.interval);
    };
    /**
     * 替换视频的方法
     * @param src
     */
    replaceVideo = ({ src }) => {
        const video = document.createElement('video');
        video.src = src;
        const canplay = new Promise(resolve => video.oncanplay = r => {
            video.oncanplay = null;
            resolve();
        });
        Promise.all([canplay, new Promise(resolve => {this.waitReplace = resolve;})])
            .then(res => {
                this.waitReplace = null;
                video.currentTime = this.video.currentTime;
                this.video = video;
            });
    };
    /**
     * 公共等待方法
     * @param type
     * @returns {Function}
     */
    defaultWait = async (type) => {
        const result = await new Promise((resolve) => {
            const callBack = (res) => {
                this.width = this.width || this.video.videoWidth;
                this.height = this.height || this.video.videoHeight;
                this.video.removeEventListener(type, callBack);
                resolve(res);
            };
            this.video.addEventListener(type, callBack);
        });
        return result;
    };

    /**
     * 获取视图
     * @param begin 开始时间 不传则从0
     * @param end 结束时间 不传则全部
     * @param interval 间隔时间
     * @returns {Promise<Array>} promise 返回canvas 数组
     */
    createThumbanails = async ({ begin = null, end = null, interval, callBack = null }) => {
        const canvasArray = [];
        const start = begin || 0;
        const final = end || this.video.duration;
        const total = Math.ceil((final - start) / interval);
        if (this.cover) {
            for (let i = 0; i < total; i += 1) {
                const proCanvas = document.createElement('canvas');
                proCanvas.width = this.width;
                proCanvas.height = this.height;
                const ctx = proCanvas.getContext('2d');
                ctx.drawImage(this.cover, 0, 0, this.width, this.height);
                this.canvasArray.push(proCanvas);
            }
        }
        if (typeof this.waitReplace === 'function') {
            this.waitReplace();
        }
        await this.defaultWait('canplay');
        let i = 0;
        for (let v of Array(total)) {
            if (this.disposed) return canvasArray;
            if (typeof this.waitReplace === 'function') {
                this.waitReplace();
            }
            const currentTime = i * interval + begin;
            this.video.currentTime = currentTime;
            await this.defaultWait('seeked');
            const proCanvas = document.createElement('canvas');
            proCanvas.width = this.width;
            proCanvas.height = this.height;
            const ctx = proCanvas.getContext('2d');
            ctx.drawImage(this.video, 0, 0, this.width, this.height);
            canvasArray.push(proCanvas);
            this.canvasArray[i] = proCanvas;
            if (typeof callBack === 'function') {
                callBack(this);
            }
            i += 1;
        }
        return canvasArray;
    };
}
