import { localStorageKey, getItem, setItem } from '../util/storageLocal';
import { AD_TIME, byReason } from '../config/staticParams';

function genStoreData(reason) {
    const time = new Date().getTime();
    return {
        reason,
        time,
    };
}

// 通过原因
export function isPastDue(data = AD_TIME.sevenDay, keyTip = `${localStorageKey.simpleTip}`) {
    const time = data;
    const item = getItem(keyTip);
    if (item) {
        if (item.reason === byReason.refuse) {
            return true;
        }
        const oldTimestamp = item.time;// 以前存的时间戳
        const nowTimestamp = new Date().getTime(); // 当前时间戳
        // 如果当前时间戳> 前面存的时间戳+过期时间 表示已经过期
        const sumTimestamp = oldTimestamp + time;

        if (nowTimestamp > sumTimestamp) {
            if (String(item.reason) === '1') {
                setItem(keyTip, genStoreData(byReason.refuse));
            }
            return true;
        }
        return false;
    }
    return true;
}


export function toFixedTime(time) {
    return Math.round(time * 10) / 10;
}
