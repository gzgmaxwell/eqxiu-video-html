import { useEffect, useState } from 'react';

export default {};

/**
 * 规整 传输数据,获取loading状态和错误以及结果.
 * @param apiFunction
 * @param params
 * @returns {{loading, error, data}}
 */
export function useFatch(apiFunction, params) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState({});
    useEffect(async () => {
        const { data: { success, obj, msg } } = await apiFunction(params);
        setLoading(false);
        if (success) {
            setData(obj);
        } else {
            setError(msg);
        }
    }, []);
    return {
        loading,
        error,
        data,
    };
}
