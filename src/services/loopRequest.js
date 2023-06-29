import { getCropResult } from '../api/music';
import { message as antMessage } from 'antd';
import { delay } from '../util/delayLoad';

class LoopRequest {
    constructor({ requestFunc, params, maxTimes = 30, intervalTime = 500 }) {
        this.time = 0;
        if (typeof requestFunc !== 'function') {
            throw new Error('requestFunc must Function');
        }
        this.props = {
            requestFunc,
            params,
            maxTimes,
            intervalTime,
        };
    }

    run = async () => {
        const { props: { requestFunc, params, intervalTime, maxTimes } } = this;
        const loop = async () => {
            const { data: { obj = {}, success = false } }
                = await requestFunc(...params);
            const { status } = obj;
            if (!success || status === 3) {
                this.error = obj;
                return false;
            }
            if (status === 4) {
                return obj;
            }
            if (this.time > maxTimes) {
                throw new Error('超时');
            }
            this.time += 1;
            await delay(intervalTime);
            const res = await loop();
            return res;
        };
        const result = await loop();
        return result;
    };
}

export default LoopRequest;
