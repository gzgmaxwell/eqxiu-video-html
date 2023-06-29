import env from 'Config/env';
import qs from 'qs';

const serverHost = env.host.service2 + '/video/share/';

/* global axios */
/**
 * 根据PlayerId 和PLayerCode查找视频信息
 * @param videoId
 * @param playCode
 * @returns {*}
 */
export function getPlayerUrl(videoId, playCode) {
    const url = `${serverHost}play?videoId=${videoId}&playCode=${playCode}`;
    return axios.get(url);
}
