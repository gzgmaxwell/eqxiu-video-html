import animationTypes from "../dataBase/animeJsType";

export function parseEffect({ keyframes }, duration = 1000) {
    let params = {};
    //Convert CSS style keyframe object into array to be flattened
    if (Array.isArray(keyframes) === false) {
        var keys = Object.keys(keyframes);
        function _toConsumableArray(arr) {
            if (Array.isArray(arr)) {
                for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
                    arr2[i] = arr[i];
                }
                return arr2;
            } else {
                return Array.from(arr);
            }
        }
        if (keys.length > 0) {
            var splitKeysMap = keys.reduce(function(accumulator, key, i, array) {
                key.split(",").forEach(function(k, i) {
                    let mk = parseFloat(k) / 100.0;
                    accumulator.has(mk)
                        ? Object.assign(accumulator.get(mk), keyframes[key])
                        : accumulator.set(mk, keyframes[key]);
                });
                return accumulator;
            }, new Map());

            var splitKeys = [].concat(_toConsumableArray(splitKeysMap.keys())).sort();

            keyframes = splitKeys.map(function(value, i) {
                var d = duration * value;
                if (i > 0) {
                    d -= duration * splitKeys[i - 1];
                }
                // if (d === duration) {
                //     d += 1000;
                // }
                return Object.assign({}, { duration: d || 1 }, splitKeysMap.get(value));
            });
            params.keyframes = keyframes;
        }
    }
    return params;
}

/**
 *
 * @param {*} targets
 * @param {*} duration
 * @param {*} timeLineParams
 */
export async function onInitAnimation(targets, duration, timeLineParams = []) {
    if (!targets || !duration || !timeLineParams.length) return null;
    const anime = (await import("animejs")).default;
    const options = {
        targets,
        autoplay: false,
        duration,
        easing: 'easeInOutSine',
    };
    const aniObject = anime.timeline(options);
    timeLineParams.forEach(({ offset = undefined,duration, ...item }) => aniObject.add(item, offset));
    return aniObject;
}

export async function reSetAnimation(
    animeJs,
    { animationName, animationDuration, animationIteration }
) {}

class AnimesList {
    constructor(props) {}
    list = {};

    onInit({ uuid, animate }) {}
}
