/**
 * @param {Function} request 要发送的请求，返回promise对象
 * @param {Function} callback 回调方法，根据request请求返回的数据判断是否需要发起下一次请求，返回boolean值
 *
 * */
export const loopRequest = async (request, callback) => {
    // 发送请求
    const res = await request();
    // 请求成功
    if (res && res.data.success) {
        // 执行回调，判断是否发起下一次请求 true发送， false不发送返回数据
        if (callback(res.data)) {
            await loopRequest(request, callback);
        } else {
            return res.data;
        }
    } else { // 请求失败
        return false;
    }
};

/**
 * 创建一个可取消promise
 * @param promise
 * @return {{promise: Promise<any>, cancel(): void}}
 */
export const makeCancelable = (promise) => {
    let hasCanceled_ = false;

    const wrappedPromise = new Promise((resolve, reject) => {
        promise.then(
            val => hasCanceled_ ? reject({ isCanceled: true }) : resolve(val),
            error => hasCanceled_ ? reject({ isCanceled: true }) : reject(error),
        );
    });

    return {
        promise: wrappedPromise,
        cancel() {
            hasCanceled_ = true;
        },
    };
};
