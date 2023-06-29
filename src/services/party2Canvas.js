import {
    CANVAS_TYPE,
    DEFAULT_ELE_BACKGROUND_COLOR, HASH_TYPE,
    HD_RESOLUTION, LAYER_TYPE,
    WORKSPACE_SIZE,
    WorkspaceVideoType,
} from '../config/staticParams';
import { findKey } from '../util/object';
import element2Canvas from './htmlToCanvas';
import { cloneDeep } from 'lodash';
import { delay } from '../util/delayLoad';

const initData = {
    top: 0,
    left: 0,
    rotate: 0,
};
export default class Party2Canvas {
    constructor(dataList, uuid, transverse) {
        //是否被销毁，销毁后退出绘图
        this.destroyed = false;
        // 单个元素绘图的promise；
        this.promiseList = [];
        // 存放图层到layerCanvas；
        this.layerCanvas = [];
        // 当前片段的uuid
        this.uuid = uuid;
        // 片段数据
        this.dataList = cloneDeep(dataList) || [];
        //存放元素的canvas
        this.canvasObj = {};

        this.width = transverse ? WORKSPACE_SIZE.l : WORKSPACE_SIZE.s;
        this.height = transverse ? WORKSPACE_SIZE.s : WORKSPACE_SIZE.l;
        this.scale = transverse ? HD_RESOLUTION.hoz.x / WORKSPACE_SIZE.l : HD_RESOLUTION.ver.y /
            WORKSPACE_SIZE.l;
    }

    async drawOne(element, isDelay = false) {
        // 如果没有数据
        if (!element || this.destroyed) {
            console.log('没有找到片段对应的数据，或者绘图已结束');
            return Promise.resolve(null);
        }
        if (isDelay) {
            await delay(10000);
            if (this.destroyed) {
                return Promise.resolve(null);
            }
        }
        const { scale } = this;
        // 是否有边框或者背景颜色
        const haveBorder = element.borderWidth > 0 ||
            ![DEFAULT_ELE_BACKGROUND_COLOR, undefined].includes(element.backgroundColor);
        const data = {
            ...element,
            type: element.type || CANVAS_TYPE.background,
        };
        if ([CANVAS_TYPE.img, CANVAS_TYPE.text, CANVAS_TYPE.artFont, CANVAS_TYPE.animateFont, CANVAS_TYPE.animateImg].includes(data.type) ||
            !data.type) {
            console.log('开始画图', element.uuid);
            // 优先从元素本身获取宽高
            const supplyData = {};
            if ((!data.height || !data.width) && data.type) {
                const dom = document.querySelector(`#element_${data.uuid}`);
                if ((!dom || !dom.offsetHeight || !dom.offsetWidth) &&
                    (!data.height || !data.width)) {
                    console.error('元素数据没有宽高而且。找不到对应的元素');
                    return Promise.resolve({
                        uuid: element.uuid,
                        type: LAYER_TYPE.img,
                        values: data,
                        canvas: null,
                    });
                }
                supplyData.height = dom ? dom.offsetHeight : data.height;
                supplyData.width = dom ? dom.offsetWidth : data.width;
            }
            console.log('画图：', element.uuid);
            return element2Canvas({ ...data, ...initData, ...supplyData }, scale)
                .then((resCanvas) => {
                    console.log('画图完毕：', element.uuid);
                    if (this.destroyed) {
                        return Promise.resolve(null);
                    } else {
                        return Promise.resolve({
                            uuid: element.uuid,
                            canvas: resCanvas,
                            type: LAYER_TYPE.img,
                            values: data,
                        });
                    }
                })
                .catch(console.log);
        } else {
            const resData = {
                uuid: element.uuid,
                values: data,
                videoIndex: data.uuid,
                type: ~~findKey(HASH_TYPE, data.type),
            };
            if (haveBorder) {
                return element2Canvas({ ...data, ...initData }, scale)
                    .then((resCanvas) => {
                        if (this.destroyed) {
                            return Promise.resolve(null);
                        } else if (resCanvas) {
                            const canvas = this.drawCanvas(resCanvas, data);
                            return Promise.resolve({
                                ...resData,
                                canvas,
                            });
                        } else {
                            return Promise.resolve(null);
                        }
                    });
            } else {
                return Promise.resolve({
                    ...resData,
                    canvas: null,
                });
            }
        }
    }

    // 合并图层
    mergeLayer(canvasObj, delay) {
        //循环绘制单个元素
        this.promiseList = this.dataList.map(item => {
            const uuid = item.uuid;
            // 判断canvas是否已经存在，已经存在的拷贝过来，用于后面合成图层使用，重绘后会更新
            // 没有的需要重新绘制
            if (canvasObj[uuid]) {
                this.canvasObj[uuid] = canvasObj[uuid];
            } else {
                return this.drawOne(item, delay);
            }
            return null;
        });
        //等待片段元素绘制完成
        return Promise.all(this.promiseList)
            .then(canvasList => {
                if (this.destroyed) {
                    return Promise.resolve({});
                }
                //转成对象，方便通过uuid取值
                canvasList.forEach(item => {
                    if (item) {
                        this.canvasObj[item.uuid] = item;
                    }
                });
                // 初始化画布
                for (const [i, value] of new Map(this.dataList.map((a, b) => [b, a]))) {
                    const { uuid, type, borderWidth, visibility, backgroundColor = DEFAULT_ELE_BACKGROUND_COLOR } = value;
                    // 是否有边框
                    const haveBorder = borderWidth > 0 ||
                        ![DEFAULT_ELE_BACKGROUND_COLOR, undefined].includes(backgroundColor);
                    const element = this.canvasObj[uuid];
                    // 如果是不是视频或者有边框则加入
                    if (!WorkspaceVideoType.includes(type)) {
                        if (element && element.canvas && visibility !== 'hidden') {
                            const canvas = this.drawCanvas(element.canvas, value);
                            // 保存视频数据
                            this.layerCanvas.push({
                                uuid,
                                values: value,
                                canvas,
                                type: LAYER_TYPE.img,
                            });
                        }
                    } else {
                        // 绘制视频的边框
                        if (haveBorder) {
                            if (element && element.canvas && visibility !== 'hidden') {
                                // const canvas = this.drawCanvas(element.canvas, value);
                                // 保存视频数据
                                this.layerCanvas.push({
                                    uuid,
                                    values: value,
                                    videoIndex: uuid,
                                    type: ~~findKey(HASH_TYPE, type),
                                    canvas: element.canvas,
                                });
                            }
                        } else {
                            this.layerCanvas.push({
                                uuid: uuid,
                                values: value,
                                videoIndex: uuid,
                                type: ~~findKey(HASH_TYPE, type),
                                canvas: null,
                            });
                        }
                    }
                }
                //判断是否被销毁，已经销毁则不返回数据
                if (this.destroyed) {
                    return Promise.resolve({});
                } else {
                    this.destroy();
                    return Promise.resolve({
                        [this.uuid]: this.layerCanvas,
                        ...this.canvasObj,
                    });
                }
            });
    }

    drawCanvas(inputCanvas, value) {
        const { top, left, rotate } = value;
        const { width, height, scale } = this;
        // 计算中心点，旋转的元素需要
        const rectCenterPointX = (left + value.width / 2) * scale;
        const rectCenterPointY = (top + value.height / 2) * scale;
        const { canvas, context } = getCanvas(width * scale, height * scale);
        context.save();
        context.translate(rectCenterPointX, rectCenterPointY);
        context.rotate(rotate * Math.PI / 180);
        context.translate(-rectCenterPointX, -rectCenterPointY);
        context.drawImage(inputCanvas, left * scale, top * scale);
        context.restore();
        return canvas;
    };

    destroy() {
        this.destroyed = true;
    }
}
const getCanvas = function (width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    return {
        canvas,
        context,
    };
};
