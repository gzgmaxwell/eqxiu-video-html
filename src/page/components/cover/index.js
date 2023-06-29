import React, { useState, useRef, useEffect } from "react";
import styles from "./index.less";
import Back from "../Button/back";
import ScrollBarController from "../common/scrollBarController";
import ScaleController from "../../editor/bottom/timeLine/scaleController";
import Close from "../Button/close";
import CoverPreviewBar from "./coverPreviewBar";
import CoverUpload from "./coverUpload";
import Button from "../Button";
import ImageButton from "../Button/imageButton";
import { message } from "antd";
import { getQiniuToken, uploadQiniuByBase64 } from "../../../api/upload";
import Loading from "../loading";
import { genUrl } from "../../../util/image";
import { ComCropper } from "./cuts";
import { dontAny } from "../../../util/event";
import eventEmitter from "../../../services/EventListener";
import { host } from "Config/env";
import { getVideoThumbnail } from "../../../api/userVideo";
import { sendBDEvent } from "../../../services/bigDataService";

export default function Cover(props) {
    const { videoId, url, img, transverse } = props;
    const content = useRef();
    const video = useRef();
    const wrap = useRef();
    const [scale, setScale] = useState(1);
    const [width, setWidth] = useState(100);
    const [left, setLeft] = useState(0);
    const [coverImg, setCoverImg] = useState(img);
    const [duration, setDuration] = useState(0);
    const [loading, setLoading] = useState(false);
    const [thumbnail, setThumbnail] = useState(null);
    const isFirst = useRef(true);

    /**
     * 缩放比例变化时，避免left超出范围。
     */
    useEffect(() => {
        const { width } = wrap.current.getBoundingClientRect();
        if (left > width) {
            setLeft(width);
        }
    }, [scale]);

    /**
     * left变化更新currentTime
     */
    useEffect(() => {
        if (video.current) {
            const { width } = wrap.current.getBoundingClientRect();
            const { duration } = video.current;
            if (!duration) return;
            const currentTime = Math.min((left / width) * duration, video.current.duration);
            video.current.currentTime = currentTime;
        }
    }, [left, video.current, wrap.current]);

    // 异步请求videoId
    useEffect(() => {
        let isCancle = false;
        async function getThumbnail() {
            const {
                data: { obj }
            } = await getVideoThumbnail(videoId);
            if (obj && !isCancle) {
                setThumbnail(genUrl(obj));
            }
        }
        function cancel() {
            isCancle = true;
        }

        getThumbnail();
        return cancel;
    }, [videoId]);

    const isHoz = transverse ? "hoz" : "ver";

    function mouseDown() {
        const { left: wrapLeft, width: warpWidth } = wrap.current.getBoundingClientRect();

        function moveMouse(e) {
            isFirst.current = false;
            const change = e.clientX - wrapLeft;
            if (change <= 0) {
                // 最小限制
                setLeft(0);
                return;
            } else if (change >= warpWidth) {
                // 最大限制
                setLeft(warpWidth);
                return;
            }
            setLeft(change);
        }

        function upMouse() {
            window.removeEventListener("mousemove", moveMouse);
            window.removeEventListener("mouseup", upMouse);
        }

        window.addEventListener("mousemove", moveMouse);
        window.addEventListener("mouseup", upMouse);
    }

    function onChangeScale(data) {
        setScale(data);
    }

    const scaleControllerProps = {
        id: "time-scale-bar",
        value: scale,
        onChange: onChangeScale,
        min: 1,
        max: 4
    };

    function onLoadedData() {
        const num = video.current.duration;
        setDuration(num);
        if (num > 30 && scale === 1) {
            setScale(4);
        }
        setWidth(num * width);
        scaleControllerProps.max = video.current.duration / 2;
    }

    function onBack() {
        if (typeof props.onClose === "function") {
            props.onClose();
        }
    }

    async function onSave() {
        const videoElement = video.current;
        if (!videoElement) {
            message.error("视频尚未准备完毕");
            return false;
        }
        // 没有滑动过则不会修改
        if (!videoElement.currentTime && isFirst.current) {
            return onBack();
        }
        setLoading("生成图片中");
        try {
            const tokenPromise = getQiniuToken();
            const { videoHeight, videoWidth } = videoElement;
            const canvasElement = document.createElement("canvas");
            canvasElement.width = videoWidth;
            canvasElement.height = videoHeight;
            const ctx = canvasElement.getContext("2d", { alpha: false });
            ctx.drawImage(videoElement, 0, 0, videoWidth, videoHeight);
            const base64 = await canvasElement.toDataURL("image/jpg", 1);
            const { data: { success, obj: token } = {} } = await tokenPromise;
            if (!success || !token) {
                throw new Error("获取token失败");
            }
            const { data: { key } = {} } = await uploadQiniuByBase64(base64, token);
            if (!key) {
                throw new Error("上传失败");
            }
            //todo: 调用封面接口
            setLoading(false);
            eventEmitter.emit("changeCoverImg", genUrl(key));
            onBack();
            // 数据埋点
            sendDB();
        } catch (e) {
            message.error(e.message);
            console.error(e.message);
            setLoading(false);
        }
    }

    function onError() {
        const videoElement = video.current;
        if (!videoElement.src.includes("?v=cropper")) {
            video.current.src += "?v=cropper";
        } else {
            message.error("视频存在问题，无法使用，请检查网络");
        }
    }

    function onClose() {}
    function sendDB() {
        sendBDEvent({
            position: "视频预览-更换封面",
            type: "更换成功"
        });
    }
    function handleURL(inputUrl) {
        // const newUrl = `${host.musicFile}${url}`;
        const url = genUrl(inputUrl);
        setCoverImg(url);
        eventEmitter.emit("changeCoverImg", url);
        onBack();
        // 数据埋点
        sendDB();
    }

    function handleOnChange(url) {
        const json = {
            hoz: transverse ? "hoz" : "ver"
        };
        const params = {
            image: url,
            cutParams: null,
            onClose: onClose,
            onChange: handleURL,
            backgroundColor: "#fff",
            ...json
        };
        ComCropper({ ...params })
            .then(res => {})
            .catch(re => re);
    }

    function onClickJump(e) {
        const newLeft = e.clientX - e.target.getBoundingClientRect().left;
        isFirst.current = false;
        setLeft(newLeft);
    }
    // 在第一帧只显示封面
    const videoStyle =
        (video.current && isFirst.current && !video.current.currentTime && { display: "none" }) ||
        {};
    const button = bProps => <div {...bProps}>从图片库中选择</div>;
    return (
        <div className={styles.body}>
            <Loading loading={loading} title={loading} />
            <div className={styles.left}>
                <div className={styles.position}>
                    <Back onBack={onBack} />
                </div>
                <p>从视频帧中选择封面</p>
                <div className={styles.center}>
                    {(!video.current || video.current.currentTime === 0) && isFirst.current && (
                        <img src={genUrl(img)} className={transverse ? styles.hoz : styles.ver} />
                    )}
                    <video
                        ref={video}
                        src={url}
                        muted
                        crossOrigin='anonymous'
                        preload='auto'
                        controls={false}
                        onError={onError}
                        onLoadedData={onLoadedData}
                        onContextMenu={dontAny}
                        poster={genUrl(img)}
                        style={videoStyle}
                    />
                </div>
                <div className={styles.bottom}>
                    <div className={styles.content} ref={content}>
                        <div className={styles.box}>
                            <div
                                style={{ width: `${scale * 100}%` }}
                                ref={wrap}
                                onClick={onClickJump}
                                className={styles.wrap}>
                                {video.current && !!duration && (
                                    <CoverPreviewBar
                                        duration={duration}
                                        scale={scale}
                                        defaultSrc={coverImg}
                                        pic={thumbnail}
                                        transverse={
                                            video.current.videoWidth > video.current.videoHeight
                                        }
                                    />
                                )}
                            </div>
                            <div
                                style={{ left: `${left}px` }}
                                onMouseDown={mouseDown}
                                className={styles.progress}>
                                <p>选择封面</p>
                            </div>
                        </div>
                    </div>
                    <div className={styles.scroll}>
                        <div
                            className={`${styles.scrollBarBox}  ${
                                duration > 30 ? "" : styles.hide
                            }`}>
                            {content.current && (
                                <ScrollBarController
                                    id={"time-scrollbar"}
                                    hideNoSize={false}
                                    element={content.current}
                                    axis={"x"}
                                    isPadding={2}
                                    scale={scale}
                                />
                            )}
                        </div>
                        <div
                            className={`${styles.scaleControllerBox} ${
                                duration > 30 ? "" : styles.hide
                            }`}>
                            {content.current && <ScaleController {...scaleControllerProps} />}
                        </div>
                    </div>
                </div>
            </div>
            <div className={styles.right}>
                <div className={styles.close}>
                    <Close onClose={onBack} />
                </div>
                <h1>其他封面设置方式</h1>
                <div className={styles.choice}>
                    <ImageButton hoz={isHoz} onChange={handleOnChange} ImgBtn={button} />
                </div>
                <CoverUpload hoz={isHoz} handleURL={handleURL} />
                <p>上传后的图片会保存至图片库中</p>
                <div className={styles.btnWrap}>
                    <Button onClick={onBack} lite={1}>
                        取消
                    </Button>
                    <Button onClick={onSave} lite={0}>
                        保存
                    </Button>
                </div>
            </div>
        </div>
    );
}
