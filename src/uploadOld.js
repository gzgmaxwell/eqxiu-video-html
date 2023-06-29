import Upload from './services/uploadVideo';
import { FILE_TYPE } from './config/staticParams';
import env from 'Config/env';

window.onload = function () {
    let host = {
        p1: '<%= htmlWebpackPlugin.options.host.p1 %>',
    };
    let params = {
        ...getUrlParams(),
        time: new Date().getTime(),
    };
    let cosObj = null;
    let status = 0; // 上传状态 0:未上传；1：正在上传
    let tip = {
        ready: '选择文件',
        uploading: '上传中…',
    };

    let el = document.querySelector('#upload_btn');
    let el2 = document.querySelector('#upload');
    if (status) {
        setInputDisabled(true);
    } else {
        setInputDisabled(false);
        el.addEventListener('click', upload);
    }

    function upload(fz = null) {
        el2.addEventListener('change', (e) => {
            cosObj = null;
            const onError = () => {
                cosObj = null;
                el2.value = '';
            };
            const typeFiles = e.target.files[0].type.split('/')[0];
            if (typeFiles === 'video') {
                cosObj = new Upload({
                    type: FILE_TYPE.video,
                    params,
                    onError,
                });
                cosObj.addSubscriber(getProgressCss);
                cosObj.addSubscriber(getStatus);
            } else if (typeFiles === 'audio') {
                cosObj = new Upload({
                    type: FILE_TYPE.audio,
                    params,
                    onError,
                });
                cosObj.addSubscriber(getProgressCss);
                cosObj.addSubscriber(getStatus);
            } else if (typeFiles === 'image') {
                cosObj = new Upload({
                    type: FILE_TYPE.img,
                    params,
                    onError,
                });
                cosObj.addSubscriber(getProgressCss);
                cosObj.addSubscriber(getStatus);
            }
            cosObj.upload(el2, fz); // 上传处理
        }, { once: true });
    }

    /**
     * 获取进度条的样式
     */
    function getProgressCss() {
        const progress = cosObj.progress;
        document.querySelector('#progress').style.width = progress + '%';
        setProgress(progress);
    }

    /**
     * 按钮上传状态
     */
    function getStatus() {
        status = cosObj.getStatus;
        if (status) {
            setInputDisabled(true);
            setTipText(tip.uploading);
        } else {
            cosObj = null;
            setInputDisabled(false);
            setTipText(tip.ready);
        }
    }

    /**
     * 设置按钮的内容
     */
    function setTipText(tip) {
        document.querySelector('#tip').innerHTML = tip;
    }

    /**
     * 设置进度条的样式
     */
    function setProgress(progress) {
        if (!progress) return;
        let handleProgress = parseInt(progress);
        axios.get(
            `${env.host.service2}/video/phone/user/updateProgress?token=${params.token}&progress=${handleProgress}&time=${params.time}`);
    }


    /**
     * 将查询参数转换成对象
     */
    function getUrlParams() {
        var obj = {};
        var params = location.href.split('?')[1] || '';
        params.split('&')
            .forEach(function (item) {
                var val = item.split('=');
                obj[val[0]] = val[1];
            });
        return obj;
    }

    /**
     * 设置上传按钮的样式
     */
    function setInputDisabled(disabledStatus) {
        var input = document.querySelector('input');
        disabledStatus
        ? input.setAttribute('disabled', 'disabled')
        : input.removeAttribute('disabled');
    }
};
