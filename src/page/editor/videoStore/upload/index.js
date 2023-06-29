import React from "react";
import { message } from "antd";
import Icon from "../../../components/Icon";
import styles from "./index.less";
import { FILE_TYPE } from "../../../../config/staticParams";
import UploadVideo from "../../../../services/uploadVideo";
import { waitChoseModel } from "../../../components/delete";
import { ComVip } from "../../../components/vip";

export const accptType = {
    [FILE_TYPE.img]: ["image/jpg", "image/jpeg", "image/gif", "image/png"],
    [FILE_TYPE.audio]: ["audio/*", ".wma", ".ape"],
    [FILE_TYPE.video]: ["video/*", "flv-application/octet-stream", "video/x-flv", ".flv", ".f4v"]
};

class Upload extends React.PureComponent {
    constructor(props) {
        super(props);
        this.uploadInput = React.createRef();
        this.uploadCount = 0;
        this.uploadedArray = [];
        this.state = {
            progress: 0 // 进度条
        };
    }

    componentDidMount() {
        const { props } = this;
    }

    progress = () => {
        const progress = parseInt(this.UploadVideo.progress) || 0;
        if (typeof this.props.setProgress === "function") {
            this.props.setProgress(progress);
        }
        this.setState({ progress });
    };
    getMember = () => {
        const { status, type, min, max } = this.UploadVideo.getBeMember;
        const mb = 1024 * 1024;
        if (status) {
            // this.UploadVideo.getBeMember 返回true购买会员
            const typeTip = type === "img" ? "单图" : "单视频";
            const typeTip2 = type === "img" ? "图片" : "视频";
            const clickPosition = type === "img" ? "上传图片" : "上传视频";
            const sendParams = {
                source: `${typeTip}上传`,
                benefitId: type === "img" ? 177 : 179,
                clickPosition
            };
            waitChoseModel({
                text: `${typeTip2}大小超出限制`,
                info: `升级创意云会员后${typeTip}限制从${min / mb}MB提升到${max /
                    mb}MB，您的${typeTip2}即可成功上传`,
                sureBtn: "升级会员"
            })
                .then(() => {
                    ComVip({ ...sendParams })
                        .then(result => {
                            if (result === "success") {
                                // 开通创意云会员成功后开始下载
                                // this.UploadVideo.upload(this.uploadInput.current);
                            }
                        })
                        .catch(re => re);
                })
                .catch(re => re);
        }
    };
    clickUpload = () => {
        const { props, onSuccessUpload } = this;
        this.UploadVideo = new UploadVideo({
            ...props,
            onSuccessUpload
        });
        this.UploadVideo.addSubscriber(this.progress);
        this.UploadVideo.addSubscriber(this.getMember);
        if (this.UploadVideo.cosToken) {
            this.UploadVideo.cosToken.then(({ data: { success = false } = {} }) => {
                if (success) {
                    // 本身应该吧打开按钮放这里面的  但是 QQ浏览器不支持异步打开
                }
            });
            this.UploadVideo.clickUpload(this.uploadInput.current);
        }
    };
    upload = (e, fz = null) => {
        const {
            props: { multiple }
        } = this;
        if (typeof this.props.openModal === "function") {
            this.props.openModal();
        }
        this.uploadCount = this.uploadInput.current.files.length;
        if (multiple && this.uploadCount > ~~multiple) {
            message.error(`一次只能同时上传:${~~multiple}个文件`);
            this.reset();
        }
        this.UploadVideo.upload(this.uploadInput.current, fz);
    };

    onSuccessUpload = (index, obj, url) => {
        const {
            props: { onSuccessUpload }
        } = this;
        if (typeof onSuccessUpload !== "function") return;
        this.uploadedArray.push(obj);
        this.uploadCount -= 1;
        if (this.uploadCount === 0) {
            this.uploadedArray.forEach((v, i) => onSuccessUpload(i, v, url));
            this.reset();
        }
    };

    reset = () => {
        this.uploadCount = 0;
        this.uploadedArray = [];
        this.UploadVideo.resetFileInput(this.uploadInput.current);
    };
    getProgress = () => {
        const data = this.state.progress > 0;
        if (typeof this.props.getProgress === "function") {
            this.props.getProgress(data);
        }
        return data;
    };

    render() {
        const { state, props } = this;
        const { progressStyle = {}, hide = false, multiple = false, flashPicUpload } = props;
        return (
            <div
                className={`${styles.uploadBox} ${flashPicUpload ? styles.flashPicUploadBox : ""}`}>
                <div
                    className={styles.progressBox}
                    style={{
                        ...progressStyle,
                        display: this.getProgress() > 0 ? "block" : "none"
                    }}>
                    <div className={styles.progress} style={{ width: state.progress + "%" }}></div>
                </div>
                <div
                    ref={this.uploadBtn}
                    onClick={this.clickUpload}
                    className={styles.uploadBtnBox}>
                    {/*是否隐藏文字*/}
                    {!hide && (
                        <React.Fragment>
                            <Icon type='eqf-cloudupload-f' className={styles.eqf_cloudupload_i} />{" "}
                            <span className={styles.phoneWord}>本地上传</span>
                        </React.Fragment>
                    )}
                </div>
                <input
                    type='file'
                    className={styles.inputFile}
                    onChange={this.upload}
                    ref={this.uploadInput}
                    accept={(accptType[props.type] || []).join(",") || "*"}
                    multiple={!!multiple}
                />
            </div>
        );
    }
}

export default Upload;
