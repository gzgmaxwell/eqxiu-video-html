export {
    certainFunction,
    difference,
};

/**
 * 从对象中取出指定的自有属性赋给新对象
 * @param obj
 * @param keys
 */
function certainFunction(obj, keys) {
    if (!obj instanceof Object) return {};
    return keys.reduce((result, key) => {
        if (obj.hasOwnProperty(key)) {
            result[key] = obj[key];
        }
        return result;
    }, {});
}

export function findKey(obj, value, compare = (a, b) => a === b) {
    return Object.keys(obj)
        .find(k => compare(obj[k], value));
}

/**
 * Deep diff between two object, using lodash
 * @param  {Object} object Object compared
 * @param  {Object} base   Object to compare with
 * @return {Object}        Return a new object who represent the diff
 */
function difference(object, base) {
    function changes(object, base) {
        return _.transform(object, function (result, value, key) {
            if (!_.isEqual(value, base[key])) {
                result[key] = (_.isObject(value) && _.isObject(base[key]))
                              ? changes(value, base[key])
                              : value;
            }
        });
    }

    return changes(object, base);
}

export const isEqualBy = (source, target, params = []) => {
    let flag = true;
    params.forEach(param => {
        if (source[param] !== target[param]) {
            flag = false;
            return flag;
        }
    });
    return flag;
};

/**
 * 删除指定项
 * @param {Object} obj
 * @param {String[]} keys
 */
export function deleteObjectKeys(obj, keys) {
    const newObj = { ...obj };
    for (const key of Object.keys(newObj)) {
        if (keys.includes(key)) {
            delete newObj[key];
        }
    }
    return newObj;
}
