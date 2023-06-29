import { bigData, plugin } from './config/env';

(function (config) {
    window.AnalysysAgent = window.AnalysysAgent || [];
    window.AnalysysAgent.methods = 'identify alias reset track profileSet profileSetOnce profileIncrement profileAppend profileUnset profileDelete registerSuperProperty registerSuperProperties unRegisterSuperProperty clearSuperProperties getSuperProperty getSuperProperties pageView debugMode auto appkey name uploadURL hash visitorConfigURL autoProfile autoWebstay encryptType pageProperty autoHeatmap freeApi'.split(
        ' ');

    function factory(b) {
        return function () {
            var a = Array.prototype.slice.call(arguments);
            a.unshift(b);
            window.AnalysysAgent.push(a);
            return window.AnalysysAgent;
        };
    };
    for (var i = 0; i < AnalysysAgent.methods.length; i++) {
        var key = window.AnalysysAgent.methods[i];
        AnalysysAgent[key] = factory(key);
    }
    for (var key in config) {
        if (typeof window.AnalysysAgent[key] === 'function') {
            window.AnalysysAgent[key](config[key]);
        }
    }
    var script = document.createElement('script');
    script.src = '//lib.eqh5.com/ygfz/4.3.1/AnalysysAgent_JS_SDK.min.js';
    document.body.appendChild(script);
    script.onload = () => {
        if (typeof window.AnalysysAgent.registerSuperProperty === 'function') {
            window.AnalysysAgent.registerSuperProperty('product', '视频编辑器');
        }
    };
})({
    ...bigData,
});
