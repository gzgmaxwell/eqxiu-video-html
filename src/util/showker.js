import { CANVAS_TYPE_NAME, USER_TYPE } from '../config/staticParams';
import { getItem } from './storageLocal';

export function isNoSupportELemnt(type, noSupportElements) {
    const isShowker = getItem('VIDEO-USER-INFO').type === USER_TYPE.SHOWER;
    if (!isShowker) return null;
    if (!noSupportElements.app || !noSupportElements.applet) return null;
    const hasApp = noSupportElements.app.includes(type);
    const hasApplet = noSupportElements.applet.includes(type);
    const typeName = CANVAS_TYPE_NAME[type];
    if ((hasApp || hasApplet) && typeName) {
        const noList = [];
        if (hasApp) {
            noList.push('APP');
        }
        if (hasApplet) {
            noList.push('小程序');
        }
        return `${noList.join('、')}不支持${typeName}`;
    }
    return null;
}
