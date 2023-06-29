import "@eqxiu/eqx.kefu/dist/kefu/kefu.min.css";
import delayLoad from "./delayLoad";
import { plugin } from "../config/env";
import { message } from "antd";

/* global EqxKeFu */
/**
 * 显示客服
 * @param user {name, loginName, phone, id, type, memberType} 用户对象
 *
 */
function showKefu() {
    delayLoad
        .delayLoadJS(plugin.jquery)
        .then(res => require("@eqxiu/eqx.kefu/dist/kefu/kefu.min"))
        .then(res => {
            const user = window._dva_app._store.getState().user;
            const kefu = new EqxKeFu(user);
            kefu.show();
        });
}

function openFankui() {
    window.open("https://h5.eqxiu.com/s/qCxSNqqK");
}

export { showKefu, openFankui };
