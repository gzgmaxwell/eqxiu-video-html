import { message } from "antd";
import COS from "cos-js-sdk-v5";
import * as qiniu from "qiniu-js";
import env from "../config/env";
import { triggerEvent } from "../util/event";
import { getInfo } from "../api/user";
import { templateUpload, phoneUpload } from "../api/videoStore";
import { FILE_TYPE, UPLOAD_LIMIT } from "../config/staticParams";
import {
    getBenefitUploadPhone,
    getMaterialToken,
    getPhoneToken,
    getUserBenefitUploadPc
} from "../api/upload";
import ImageCompressor from "image-compressor.js";
import { accptType } from "../page/editor/videoStore/upload";

const uploadConfig = env.upload;

export default class Upload {
    constructor(props) {
        const { token, time } = props.params || {};
        const { type = 3 } = props;
        this.getUser();
        const urlObjs = {
            defualt: {
                tc: () => axios.get(`${env.host.service2}${uploadConfig.tokenUrl}`),
                qiniu: getMaterialToken,
                success: templateUpload
            },
            phone: {
                tc: () =>
                    axios.get(`${env.host.service2}/open/eqxiuToken/qcloud?eqxiuToken=${token}`),
                qiniu: type => getPhoneToken(type, token),
                success: (key, filename, type) => phoneUpload(key, filename, token, time, type)
            }
        };
        this.tokenUrls = props.params ? urlObjs.phone : urlObjs.defualt;
        if (props.params) {
            this.isPhone = true;
            this.eqxiuToken = token;
        } else {
            this.isPhone = false;
        }
        this.state.props = props || [];
        this.totalSize = 0; // 总大小
        this.overSize = 0; // 已完成的文件大小
        if (props.params) {
            message.info("初始化上传中.");
        }
        try {
            if (!type || type === FILE_TYPE.video) {
                this.instanceCOS();
            } else {
                this.qiniu = this.initQiniu(props.type);
            }
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    state = {
        userId: "",
        cos: null,
        progress: 0, // 进度条
        status: 0, // 0 可以上传 1：禁止上传
        subscribers: [], // 存放订阅者信息
        props: [],
        member: null // true:可以升级成为会员信息
    };
    /**
     *获取用户ID
     * @returns userId
     */
    getUser = () => {
        getInfo().then(res => {
            const { data } = res;
            if (data.success) {
                this.state.userId = data.obj.id;
            }
        });
    };
    /**
     *实例化云服务对象
     * @callBack
     * @returns cos
     */
    instanceCOS = (callBack = () => {}) => {
        this.cosToken = this.tokenUrls
            .tc()
            .then(res => {
                if (res.data && res.data.success) {
                    const data = res.data.obj;
                    if (data.userId) {
                        this.state.userId = data.userId;
                    }
                } else {
                    message.error(res.data.msg);
                    const {
                        state: {
                            props: { onError }
                        }
                    } = this;
                    if (typeof onError === "function") {
                        onError(res.data);
                    }
                }
                return res;
            })
            .catch(e => {
                console.log(e);
                throw new Error(e.message);
            });

        const cos = new COS({
            // 必选参数
            getAuthorization: (options, callback) => {
                this.cosToken.then(
                    res => {
                        if (res.data && res.data.success) {
                            const data = res.data.obj;
                            if (data.userId) {
                                this.state.userId = data.userId;
                            }
                            callback({
                                TmpSecretId: data.tmpSecretId,
                                TmpSecretKey: data.tmpSecretKey,
                                XCosSecurityToken: data.sessionToken,
                                ExpiredTime: data.expiredTime
                            });
                        }
                    },
                    error => {
                        console.log("获取Token错误");
                        console.log(error);
                    }
                );
            },
            FileParallelLimit: 20, // 控制文件上传并发数
            ChunkParallelLimit: 9, // 控制单个文件下分片上传并发数
            ProgressInterval: 100 // 控制上传的 onProgress 回调的间隔
        });
        this.state.cos = cos;
        callBack();
    };
    initQiniu = async type => {
        this.cosToken = this.tokenUrls.qiniu(type);
        const {
            data: { obj, success = false, msg = "" }
        } = await this.cosToken;
        if (!success) {
            if (this.state.props.params) {
                message.error(`获取密钥失败 ${msg}`);
            }
            throw new Error(`获取token失败- ${msg}`);
        }
        this.token = obj;
        return true;
    };
    /**
     *选择文件后上传
     * @param e
     * @param fz
     * @param uploadInput 上传的input 文件对象
     * @returns {boolean}
     */
    upload = async (input, fz = null) => {
        const uploadInput = input;
        const {
            state: {
                props: { type = 3 }
            }
        } = this;
        const isCos = type === FILE_TYPE.video;
        if (isCos && !this.state.cos) {
            this.instanceCOS(() => this.upload(e, fz));
        }
        const { files } = uploadInput;
        if (!files) return false;
        this.totalSize = Array.from(files).reduce((previousValue, currentValue) => {
            return previousValue + currentValue.size;
        }, 0);
        let index = 0;
        let result = true;
        for await (const oneFile of files) {
            const res = await this.uploadOneFile(oneFile, index, isCos);
            if (!res) result = false;
            this.overSize += oneFile.size;
            index += 1;
        }
        this.resetStatus();
        this.resetFileInput(input);
        this.deliver(); // 发布消息
        return result;
    };
    /**
     * pc会员判断
     * @param
     * @param
     * @returns limitData 限制条件
     * @returns {member}
     */
    getUserUploadLimitPc = async () => {
        const {
            data: {
                success,
                obj: { imgCurrent, imgMax, videoCurrent, videoMax }
            }
        } = await getUserBenefitUploadPc();
        if (success) {
            console.log("获取用户pc上传权益成功");
        } else {
            message.error("获取用户上传权益失败");
            return;
        }
        const mb = 1024 * 1024;
        return {
            imgMin: imgCurrent * mb,
            imgMax: imgMax * mb,
            videoMin: videoCurrent * mb,
            videoMax: videoMax * mb
        };
    };
    /**
     * phone会员判断
     * @param
     * @param
     * @returns limitData 限制条件
     * @returns {member}
     */
    getUserUploadLimitPhone = async () => {
        const {
            data: {
                success,
                obj: { imgCurrent, imgMax, videoCurrent, videoMax }
            }
        } = await getBenefitUploadPhone(this.eqxiuToken);
        if (success) {
            // console.log('获取用户手机上传权益成功');
        } else {
            // message.error('获取用户上手机传权益失败');
            return;
        }
        const mb = 1024 * 1024;
        return {
            imgMin: imgCurrent * mb,
            imgMax: imgMax * mb,
            videoMin: videoCurrent * mb,
            videoMax: videoMax * mb
        };
    };

    /**
     * 上传提示
     * @param
     * @param
     */
    uploadTip = () => {
        message.error("文件大小超过最大限制，请压缩或裁剪后再上传");
    };
    /**
     * 图片压缩处理
     * @param
     * @param
     */

    uploadOneFile = async (file, index, isCos) => {
        try {
            this.state.member = false;
            const limitData = this.isPhone
                ? await this.getUserUploadLimitPhone()
                : await this.getUserUploadLimitPc();
            const isImgOrVideo =
                this.state.props.type === FILE_TYPE.img ||
                this.state.props.type === FILE_TYPE.video;
            const fileSize = file.size;
            // if (!accptType[this.state.props.type].includes(file.type)) {
            //     // console.log(accptType[this.state.props.type], file.type);
            //     throw new Error("错误的文件类型");
            // }
            if (isImgOrVideo) {
                // 是图片和视频处理
                const min =
                    this.state.props.type === FILE_TYPE.img ? limitData.imgMin : limitData.videoMin;
                const max =
                    this.state.props.type === FILE_TYPE.img ? limitData.imgMax : limitData.videoMax;
                const type = this.state.props.type === FILE_TYPE.img ? "img" : "video";
                if (this.isPhone) {
                    // 为手机上传
                    if (min === max) {
                        if (fileSize > max) {
                            this.uploadTip();
                            this.resetFileInput(file);
                            return false;
                            // throw new Error("文件大小超过最大限制，请压缩或裁剪后再上传");
                        }
                    } else if (fileSize > min) {
                        this.uploadTip();
                        this.resetFileInput(file);
                        return false;
                        throw new Error("文件大小超过最大限制，请压缩或裁剪后再上传");
                    }
                } else if (!this.isPhone) {
                    // 为pc上传
                    if (min < fileSize && fileSize < max) {
                        const json = {
                            status: true,
                            type,
                            min,
                            max
                        };
                        this.state.member = json;
                        return;
                    } else if (fileSize > max) {
                        this.uploadTip();
                        this.resetFileInput(file);
                        // return;
                        throw new Error();
                    }
                }
            } else if (fileSize > UPLOAD_LIMIT * 1024 * 1024) {
                // 音频处理
                message.error("文件大小过大");
                this.resetFileInput(file);
                throw new Error();
            }
            let compressFile = null;
            if (this.state.props.type === FILE_TYPE.img && file.type !== "image/gif") {
                const imageCompressor = new ImageCompressor();
                const options = {
                    quality: 1,
                    maxHeight: 5000,
                    maxWidth: 5000,
                    convertSize: Infinity
                };
                const result = await imageCompressor.compress(file, options).catch(err => {
                    console.log(err);
                });
                compressFile = result;
            } else {
                compressFile = file;
            }
            const { upload } = env;
            const fileName = file.name.replace("+", "");
            if (isCos) {
                await this.cosToken;
                const key = `/tencent/${this.state.userId}/${new Date().getTime()}-${Math.random()
                    .toString(36)
                    .substr(2)}${fileName.substr(fileName.lastIndexOf("."))}`;

                return new Promise((resolve, reject) => {
                    this.state.cos.putObject(
                        {
                            Bucket: `${upload.bucket}-${upload.appid}`,
                            Region: upload.region,
                            Key: key,
                            Body: compressFile,
                            onProgress: progressData => {
                                const { loaded } = progressData;
                                const newState = {
                                    ...progressData,
                                    progress: ((loaded + this.overSize) / this.totalSize) * 100,
                                    status: 1
                                };
                                this.state.progress = newState.progress;
                                this.state.status = newState.status;
                                this.deliver();
                            }
                        },
                        async (err, data) => {
                            if (err) {
                                if (err.code === 401) {
                                    // 重新上传
                                    await this.tokenUrls.tc(this.state.props.type).then(res => {
                                        resolve(this.uploadOneFile(file, index, isCos));
                                    });
                                } else {
                                    this.resetStatus();
                                    this.deliver(); // 发布消息
                                    console.log(err);
                                    message.error("文件上传失败，请重试。");
                                    reject(err);
                                    return;
                                }
                            }
                            if (data) {
                                this.tokenUrls
                                    .success(key, fileName, this.state.props.type || 3)
                                    .then(res => {
                                        const { data: videoData } = res;
                                        if (videoData.success) {
                                            this.successLocalUpload(index, videoData.obj, key);
                                            this.deliver(); // 发布消息
                                            resolve(res);
                                        } else {
                                            this.resetStatus();
                                            this.deliver(); // 发布消息
                                        }
                                    });
                                return false;
                            }
                        }
                    );
                });
            } else {
                return new Promise((resolve, reject) => {
                    const observer = {
                        next: params => {
                            const { total: progressData } = params;
                            const { loaded } = progressData;
                            const newState = {
                                ...progressData,
                                progress: ((loaded + this.overSize) / this.totalSize) * 100,
                                status: 1
                            };
                            this.state.progress = newState.progress;
                            this.state.status = newState.status;
                            this.deliver();
                        },
                        error: async err => {
                            if (err && err.code === 401) {
                                // 重新上传
                                await this.initQiniu(this.state.props.type).then(res => {
                                    resolve(this.uploadOneFile(file, index, isCos));
                                });
                            } else {
                                console.log(err);
                                this.resetStatus();
                                this.deliver(); // 发布消息
                                message.error("文件上传失败，请重试。");
                                reject();
                                return;
                            }
                        },
                        complete: ({ h, key, name, size, w }) => {
                            this.tokenUrls
                                .success(key, fileName, this.state.props.type)
                                .then(res => {
                                    const { data: videoData } = res;
                                    if (videoData.success) {
                                        this.successLocalUpload(index, videoData.obj, key);
                                        this.deliver(); // 发布消息
                                        resolve(res);
                                        return true;
                                    } else {
                                        this.resetStatus();
                                        this.deliver(); // 发布消息
                                    }
                                });
                            return false;
                        }
                    };
                    this.qiniu.then(res => {
                        const { token = null } = this.token;
                        const observable = qiniu.upload(compressFile, null, token || this.token);
                        const subscription = observable.subscribe(observer); // 开始上传
                        return false;
                    });
                });
            }
        } catch (e) {
            message.error(e.message);
            this.resetFileInput(file);
        }
    };
    clickUpload = input => {
        if (this.state.status === 0) {
            triggerEvent(input);
        }
    };
    // 上传成功通知
    successLocalUpload = (Index = 0, id, url) => {
        if (typeof this.state.props.onSuccessUpload === "function") {
            return this.state.props.onSuccessUpload(Index, id, url);
        }
        return false;
    };
    // 上传进度和上传状态值为初始状态
    resetStatus = () => {
        this.state.progress = 0;
        this.state.status = 0;
        this.totalSize = 0;
    };

    // 清空Input上传对象
    resetFileInput = file => {
        file.value = "";
        return false;
    };
    // 添加订阅者
    addSubscriber = subscriber => {
        // 订阅消息添加到缓存列表
        this.state.subscribers.push(subscriber);
        this.state.subscribers = [...new Set(this.state.subscribers)];
    };
    // 发布消息
    deliver = (...args) => {
        // trigger
        this.state.subscribers.forEach(fn => fn(args));
    };

    // 返回上传进度
    get progress() {
        return this.state.progress;
    }

    // 返回上传状态
    get getStatus() {
        return this.state.status;
    }

    // 是否显示购买成为会员弹窗
    get getBeMember() {
        return this.state.member;
    }
}
