import React, { useState, useRef, useEffect } from "react";
import styles from "./coverUpload.less";
import Upload from "../../editor/videoStore/upload";
import { FILE_TYPE } from "../../../config/staticParams";
import { ComCropper } from "./cuts";
import { host } from "env";

export default function CoverUpload(props) {
    const [btnTitle, setBtnTitle] = useState("上传本地图片");

    /**
     * @param data 上传的进度值
     */
    function getProgress(data) {
        if (data) {
            setBtnTitle("上传中...");
        } else {
            setBtnTitle("上传本地图片");
        }
    }

    function handleURL(curl) {
        if (curl) {
            if (typeof props.handleURL === "function") {
                props.handleURL(curl);
            }
        }
    }

    /**
     * @param index
     * @param id
     * @param url 上传成功文件的地址
     */
    function onSuccessUpload(index, id, url) {
        const newUrl = `${host.musicFile}${url}`;
        const json = {
            hoz: props.hoz
        };
        const params = {
            image: newUrl,
            cutParams: null,
            onChange: handleURL,
            backgroundColor: "#fff",
            ...json
        };
        ComCropper({ ...params })
            .then(res => {})
            .catch(console.log);
    }

    return (
        <div className={styles.choice}>
            <p>{btnTitle}</p>
            <div className={styles.upload}>
                <Upload
                    type={FILE_TYPE.img}
                    hide={true}
                    multiple={1}
                    getProgress={getProgress}
                    onSuccessUpload={onSuccessUpload}
                    progressStyle={{
                        height: 2,
                        borderRadius: 2,
                        color: "#1392FE",
                        bottom: 0,
                        top: "unset",
                        background: "#CCD5DB"
                    }}
                />
            </div>
        </div>
    );
}
