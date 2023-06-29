// @ts-check
import { message } from 'antd';
import { getAsrStatus, requestAsr } from '../api/userVideo';
import { delay } from '../util/delayLoad';

/**
 * 用于轮询自动识别是否生成
 */
export default class LongforAsrDataProvider {
  constructor({ videoId, intervalTime = 200 }) {
    this.videoId = videoId; // video Id
    this.intervalTime = intervalTime;
    this.status = 0; // 状态
    this.error = '';
    this.isCancel = false;
  }

  /**
   * 生成自动识别的方法
   * @returns {Promise<*>}
   */
  genAsr = async () => {
    const requestResult = await requestAsr(this.videoId);
    // 请求自动识别
    if (!requestResult.data && !requestResult.data.success) {
      this.error = requestResult.msg || '提交请求错误';
      return false;
    }
    let times = 0;
    // 轮询的方法
    const loop = async () => {
      await delay(this.intervalTime);
      times += 1;
      if (times >= 30) {
        message.warning('识别过久，可能需要排队，您可以尝试过段时间再次识别。');
        times = 0;
      }
      if (this.isCancel) {
        this.error = '自动识别已取消。';
        return false;
      }
      const loopResult = await getAsrStatus(this.videoId);
      if (!loopResult || !loopResult.data) {
        this.error = '网络错误，轮询失败';
        return false;
      }
      const { success = false, obj = {}, msg = '识别失败' } = loopResult.data;
      if (!success) {
        this.error = msg;
        return false;
      }
      if (~~obj.status === 3) {
        this.error = '识别失败';
        return false;
      } else if (~~obj.status === 4) {
        return obj;
      }
      const res = await loop();
      return res;
    };
    const reuslt = await loop();
    return reuslt;
  };
}
