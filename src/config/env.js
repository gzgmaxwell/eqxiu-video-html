// @ts-check
/* eslint-disable import/no-unresolved */
// @ts-ignore
import env from 'env';

const {
    host, plugin, prev, version, storePrev = '', projectname, name, params, bigData,
    upload, eqxAdID,
} = env;
for (const h of Object.keys(host)) {
    if (h === 'client') host[h] = `//${window.location.host}/video`;
    if (host[h].indexOf('http') === 0) {
        host[h] = host[h];
    } else {
        // eslint-disable-next-line no-restricted-globals
        host[h] = location.protocol + host[h];
    }
}
export { host, prev, plugin, projectname, name, storePrev, version, params, bigData, upload, eqxAdID };

export default env;
