import { host } from 'Config/env';
import qs from 'qs';
import { apiCache } from 'Util/apiCache';
/* global axios */


const saveAndValid = (location, groupId = null, templateType = 1) => {
    const params = {
        templateUrl: `${location}`,
        groupId,
        templateType,
        fileHash: false,
    };
    const url = `${host.service}/video/template/mgr/saveAndValid?${qs.stringify(params)}`;
    return axios.post(url);
};

const getSegmentStatus = (id) => {
    const url = `${host.service}/video/template/mgr/segment/status?groupId=${id}`;
    return axios.get(url);
};

const getRenderStatus = (id) => {
    const url = `${host.service}/video/template/mgr/status?id=${id}`;
    return axios.get(url);
};

const getMaterial = (id, replaceable = '') => {
    const url = `${host.service}/video/template/material/getByTemplate?templateId=${id}&replaceable=${replaceable}`;
    return apiCache({
        url,
        method: 'GET',
    });
};

const showGetMateril = (id, replaceable = '') => {
    const url = `${host.service}/video/template/mgr/getByTemplate?templateId=${id}&replaceable=${replaceable}`;
    return axios.get(url);
};

const showGetDetial = (id) => {
    const url = `${host.service}/video/template/mgr/get?id=${id}`;
    return axios.get(url);
};

const getMyTemplates = (params) => {
    const url = `${host.service}/video/template/mgr/find?${qs.stringify(params)}`;
    return axios.get(url);
};

const statistics = (params) => {
    const url = `${host.service}/video/template/mgr/find?${qs.stringify(params)}`;
    return axios.get(url);
};

const getAllSegment = (templateId) => {
    const url = `${host.service}/video/template/getAllSegment?groupId=${templateId}`;
    return apiCache({
        url,
        method: 'GET',
    });
};

const getAllSegmentByShowker = (id) => {
    const url = `${host.service}/video/template/mgr/getAllSegment?groupId=${id}`;
    return axios.get(url);
};

const saveConfig = (params) => {
    const url = `${host.service}/video/template/mgr/saveConfig`;
    const headers = {};
    headers['Content-Type'] = 'application/json';
    return axios.post(url, params, {
        headers,
    });
};


const videoConcat = (param) => {
    const url = `${host.service}/video/template/mgr/videoConcat`;
    const headers = {};
    headers['Content-Type'] = 'application/json';
    return axios.post(url, param, {
        headers,
    });
};

const getInfo = (id) => {
    const url = `${host.service}/video/template/mgr/audit/info?templateId=${id}`;
    return axios.get(url);
};

const deleteTemplate = (templateIds) => {
    const url = `${host.service}/video/template/mgr/delete?templateIds=${templateIds}`;
    const headers = {};
    headers['Content-Type'] = 'application/json';
    return axios.post(url, { templateIds }, {
        headers,
    });
};

/**
 * 验证元素是否支持
 * @param params
 * @return {*}
 */
export const getElementVerfiy = (params) => {
    const headers = {};
    headers['Content-Type'] = 'application/json';
    const url = `${host.service2}/video/user/template/elementVerify`;
    return axios.post(url, params, { headers });
};

export const getNotSupportElements = () => {
    return apiCache(`${host.service2}/config/getNotSupportElements`);
};


export {
    getAllSegment,
    getSegmentStatus,
    saveAndValid,
    videoConcat,
    getRenderStatus,
    getMaterial,
    saveConfig,
    showGetMateril,
    showGetDetial,
    getAllSegmentByShowker,
    getMyTemplates,
    statistics,
    getInfo,
    deleteTemplate,
};

export default {
    getAllSegment,
    getSegmentStatus,
    saveAndValid,
    videoConcat,
    getRenderStatus,
    getMaterial,
    saveConfig,
    getAllSegmentByShowker,
    getMyTemplates,
    statistics,
    getInfo,
    deleteTemplate,
    getElementVerfiy,
};
