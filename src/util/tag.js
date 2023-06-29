import { ColorLabelId, ColorArray } from '../config/staticParams';


export {
    genTag,
};

/**
 * 生成标签数据
 * @param item 标签基础数据
 * @param parentId 父Id
 * @returns {{id: *, name: *, params: *, path: *, parentId: *}}
 */
function genTag(item, parentId = null) {
    const res = {
        id: item.id,
        name: item.name,
        params: item.id,
        path: item.path,
        children: item.children,
        parentId,
    };
    if (parentId === ColorLabelId) {
        res.color = item.name;
    }
    return res;
};
