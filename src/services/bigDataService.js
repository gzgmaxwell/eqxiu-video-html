/* eslint-disable camelcase,no-unused-expressions,prefer-destructuring */
import { name } from "../config/env";
import qs from "qs";

/**
 *发送大数据事件
 * @param {String} type
 * @param {String} position
 */
export function sendBDEvent({ type, position }) {
    if (["pro", "pre"].includes(name)) {
        window._hmt && window._hmt.push(["_trackEvent", "video", position, type]);
    }
}

export function sendBDPage(path = "", force = false) {
    if (["pro", "pre"].includes(name)) {
        const url = (force && path) || window.location.pathname;
        window._hmt && window._hmt.push(["_trackPageview", url]);
    }
}

/**
 *
 * @param {String|Number} id 作品id
 * @param {('sd'|'hd')}resolution 清晰度
 * @param {String} userId 用户id
 * @param {String} type 下载/分享
 * @param {('pc'|'mobile')} formPlatform 来源场景
 * @param {('local')} act 场景
 * @param {Boolean} isWatermark 是否有水印
 * @param {Number} dur 时长(秒)
 * @param {('0'|'1')} [point_need='1'] 是否需要增长积分
 */
export function sendBDDownload({
    id,
    resolution = "sd",
    userId,
    type = "download",
    formPlatform: f_p = "pc",
    act = "local",
    isWatermark: is_watermark = true,
    duration: dur,
    point_need = "1"
}) {
    const edParams = {
        file_type: "video",
        extension: "MP4",
        is_watermark: is_watermark ? "1" : "0",
        resolution
    };
    const bigDataParams = {
        act,
        point_need,
        e_t: type === "download" ? "element_click" : String(type),
        product: "video",
        b_t: String(type),
        cat: String(type),
        u_i: userId || null,
        scene_id: String(id),
        loc: "scene",
        f_p: String(f_p).toUpperCase(),
        e_d: qs.stringify(edParams),
        dur: String(dur * 1000)
    };
    if (point_need !== "1") {
        delete bigDataParams.point_need;
    }
    if (window._tracker_api_ && typeof window._tracker_api_.report === "function") {
        window._tracker_api_.report(bigDataParams);
    }
}

/**
 *
 * @param {String|Number} id
 * @param {}
 */
export function sendBDShare({
    id,
    resolution = "sd",
    userId,
    type = "share",
    act = "copyLink",
    formPlatform,
    isWatermark,
    duration
}) {
    return sendBDDownload({
        id,
        resolution,
        userId,
        type,
        act,
        formPlatform,
        isWatermark,
        duration,
        point_need: "0"
    });
}
