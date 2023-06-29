import React from "react";
import ReactDOM from "react-dom";
import { Progress, message } from "antd";
import qs from "qs";
import styles from "./uploadPage/index.less";
import AirPlanePic from "./uploadPage/static/ariplane.png";
import Icon from "./page/components/Icon";
import Upload from "./services/uploadVideo";
import { FILE_TYPE } from "./config/staticParams";
import env from "./config/env";

window.qs = qs;
const isiOS = !!navigator.userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
const source = qs.parse(window.location.search.slice(1)).source || null;
const sourceType = source === "flash_pictures" ? true : false;
export const triggerEvent = (el, event = "click", type = "MouseEvents") => {
    if (document.all) {
        const f = el.event;
        f();
    } else {
        const e = document.createEvent(type);
        e.initEvent(event, true, true);
        el.dispatchEvent(e);
    }
};

const staticList = {
    [FILE_TYPE.img]: {
        title: "上传图片",
        icon: "eqf-image-f",
        iconClassName: styles.blue,
        type: "image/*",
        limit: 20
    },
    [FILE_TYPE.video]: {
        title: "上传视频",
        icon: "eqf-live-f",
        iconClassName: styles.green,
        type: "video/*",
        limit: 9
    },
    [FILE_TYPE.audio]: {
        title: "上传音频",
        icon: "eqf-music-f",
        iconClassName: styles.yellow,
        type: "audio/*,.ape",
        limit: 9
    }
};

class Index extends React.Component {
    constructor(props) {
        super(props);
        this.pageParams = {
            ...qs.parse(window.location.search.slice(1)),
            time: new Date().getTime()
        };
        if (!this.pageParams.token) {
            alert("访问失效，请重新扫码");
        }
        this.type = null;
        this.UploadClass = null;
        this.state = {
            btnList: [...this.initBtnList]
        };
    }

    componentDidMount() {}

    componentDidCatch(err) {
        console.log(err);
    }

    initBtnList = [
        {
            key: FILE_TYPE.img,
            uploading: false,
            percent: 0
        },
        {
            key: FILE_TYPE.video,
            uploading: false,
            percent: 0,
            display: sourceType
        },
        {
            key: FILE_TYPE.audio,
            uploading: false,
            percent: 0,
            display: isiOS || sourceType
        }
    ];
    error = msg => {
        this.reset();
        console.log(msg);
    };
    choseFile = (e, type) => {
        e.stopPropagation();
        if (e.target.tagName === "INPUT") return;
        const input =
            e.target.getElementsByTagName("input")[0] ||
            e.target.parentNode.getElementsByTagName("input")[0];
        if (!input) return;
        triggerEvent(input);
        this.UploadClass = null;
        this.UploadClass = new Upload({
            type,
            params: this.pageParams,
            onError: this.reset
        });
        this.UploadClass.addSubscriber(this.listener);
        this.type = type;
    };

    listener = () => {
        const { progress } = this.UploadClass || {};
        if (!progress || !this.UploadClass) return;
        const { token, time } = this.pageParams;
        const percent = parseInt(progress);
        axios.get(
            `${env.host.service2}/video/phone/user/updateProgress?token=${token}&progress=${percent}&time=${time}`
        );
        const {
            state: { btnList }
        } = this;
        const newBtnList = [...btnList];
        const arrayIndex = newBtnList.findIndex(v => v.uploading);
        newBtnList[arrayIndex] = {
            ...newBtnList[arrayIndex],
            percent
        };
        this.setState({ btnList: newBtnList });
    };

    onUploadEnd = e => {
        e && message.success("上传成功");
        this.reset();
    };

    uploadFiles = (e, value) => {
        const input = e.target;
        if (!this.UploadClass || !input || !input.files) return;
        if (input.files.length > value.limit) {
            this.error(`最多同时上传${value.limit}个`);
            this.reset();
            return false;
        }
        const {
            state: { btnList }
        } = this;
        const newBtnList = [...btnList];
        const arrayIndex = newBtnList.findIndex(v => v.key === value.key);
        newBtnList[arrayIndex] = {
            ...value,
            uploading: true
        };
        this.setState({ btnList: newBtnList });
        this.UploadClass.upload(input)
            .then(this.onUploadEnd)
            .catch(e => {
                this.error(e);
            }); // 上传处理
    };

    reset = () => {
        for (const input of document.getElementById("root").getElementsByTagName("input")) {
            input.value = "";
        }
        this.UploadClass = null;
        this.setState({ btnList: this.initBtnList });
    };

    render() {
        const {
            state: { btnList }
        } = this;
        const haveUploading = btnList.some(v => v.uploading);
        return (
            <div className={styles.wrap}>
                <img className={styles.mainPic} src={AirPlanePic} />
                <div className={styles.middle}>
                    <div className={styles.ware} />
                    <div className={styles.buttonGroup}>
                        {btnList.map(v => {
                            const value = {
                                ...v,
                                ...staticList[v.key]
                            };
                            return (
                                <div
                                    key={value.title}
                                    className={`
                                         ${styles.oneButton}
                                         ${((value.display ||
                                             (haveUploading && !value.uploading)) &&
                                             styles.display) ||
                                             ""}
                                         `}
                                    onClick={e => this.choseFile(e, value.key)}>
                                    {!value.uploading ? (
                                        <React.Fragment>
                                            <Icon
                                                type={value.icon}
                                                className={value.iconClassName}
                                            />
                                            <span>{value.title}</span>
                                            <input
                                                type='file'
                                                multiple='true'
                                                accept={value.type}
                                                onChange={e => this.uploadFiles(e, value)}
                                            />
                                        </React.Fragment>
                                    ) : (
                                        <Progress
                                            type='circle'
                                            percent={value.percent}
                                            width={81}
                                            format={percent => percent}
                                            strokeWidth={3}
                                        />
                                    )}
                                </div>
                            );
                        })}
                        {isiOS && !sourceType && (
                            <span className={styles.noIos}>暂不支持ios系统扫码上传音乐</span>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

ReactDOM.render(<Index />, document.getElementById("root"));
