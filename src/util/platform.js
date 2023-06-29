
import { getURLObj } from './util';
import { sendBDEvent } from '../services/bigDataService';

export function sendPlatformPage(action, playload, editorType = 'video') {
    if (window.parent) {
        const { tabId } = getURLObj(window.location.search);
        let jsonData = {
            eventType: action,
            editorType,
            tabId,
            ...playload,
        };
        if (action === platformActions.messageReady) {
            sendBDEvent({
                position: '长页视频-二次编辑',
                type: '进入二次编辑',
            });
        }
        if (action === platformActions.publishPage) {
            sendBDEvent({
                position: '长页视频-二次编辑',
                type: '确认嵌入',
            });
        }
        window.parent.postMessage(jsonData, '*');
    }
}

export const platformActions = {
    publishPage: 'publishPage',
    quite: 'exitPage',
    messageReady: 'messageReady',
    // 自动保存视频A，保存成功后。关闭编辑器视频A的编辑器，打开编辑视频B的编辑器
    saveAndOpenNew: 'saveAndOpenNew',
};
