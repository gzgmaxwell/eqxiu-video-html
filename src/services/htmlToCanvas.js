import { ART_TEXT_TYPE, CANVAS_TYPE, WorkspaceVideoType } from '../config/staticParams';
import { genUrl, getImgAspectRatioByUrl, picUrltoBase64 } from '../util/image';
import { getArtFontCss } from '../util/style';
import { cloneDeep } from 'lodash';

/**
 * 边框偏移量
 * @type {number}
 */
const borderShifting = 1;


let html2canvas = null;

/**
 * 把html元素转换成canvas
 * @param element html元素,width(元素的宽),height(元素的高),left(元素距离左边的距离),top(元素距离顶部的距离),rotate(元素的旋转角度)等属性
 * @param scale 画布缩放的倍数
 * */

async function element2Canvas(element, scale = 1) {
    ({ default: html2canvas } = await import('./html2canvs'));
    const containers = document.createElement('div');
    const id = `html2canvas${new Date().getTime()}`;
    containers.setAttribute('id', id);
    containers.style = 'z-index:-1;left:0;top:0;position:absolute;borderWidth:0;';
    const className = 'html2canvas';
    const container = document.createElement('div');
    container.setAttribute('class', className);
    container.style = `z-index:-1;left:0;top:0;position:relative;borderWidth:0;`;
    containers.append(container);
    document.querySelector('#draw_canvas_div')
        .append(containers);
    // 需要处理的style属性
    const pendingParams = [
        'width',
        'height',
        'left',
        'top',
        'fontSize',
        'padding',
        'letterSpacing',
        'borderWidth',
        'borderRadius'];
    const options = {
        backgroundColor: null,
        async: true,
        useCORS: true,
        logging: false,
        scale,
        fontFamily: element.fontFamily || 'eqxiu',
        ignoreElements: (node) => {
            return node.getAttribute('id') === 'container' || node.nodeName === 'SCRIPT' ||
                node.nodeName === 'LINK' || node.nodeName === 'META' || node.nodeName === 'TITLE';
        },
    };
    let parent = document.createElement('div');
    const { videoBackgroundPicOpacity, backgroundImg, rotate, type, content, url, artJson, aspectRatio, ...item } = element;
    const { width, height, borderWidth = 0 } = item;
    let borderRadius = Math.min(width / 2, height / 2, item.borderRadius);
    item.borderRadius = borderRadius;
    element.borderRadius = borderRadius;
    // 处理样式，部分属性加上px
    const style = ['position:absolute;', 'border-style:solid;'];
    for (let key in item) {
        let value = null;
        if (pendingParams.includes(key)) {
            value = `${item[key]}px`;
        } else if (key === 'lineHeight') {
            value = `${item[key] * item.fontSize}px`;
        } else {
            value = item[key];
        }
        style.push(`${[toLine(key)]}:${value};`);

    }
    parent.style = `${style.join(
        '')}transform: rotateZ(${rotate}deg);word-break: break-word;overflow:hidden;'}`;
    let children = null;
    if (type === CANVAS_TYPE.text || type === CANVAS_TYPE.animateFont) {
        parent.style.borderWidth = `${item.borderWidth || 0}px`;
        children = document.createElement('div');
        // children.className = 'globalFontFamily';
        children.style.fontFamily = item.fontFamily;
        children.style.lineHeight = 'inherit';
        children.style.fontSize = 'inherit';
        children.style.fontWeight = 'inherit';
        children.style.color = 'inherit';
        children.style.wordBreak = 'break-word';
        children.style.textDecoration = 'inherit';
        // 替换空格避免连续空格渲染失败的问题
        // 纯数字换行的问题
        children.innerHTML = content.replace(/\//g, '\/')
            .replace(/&nbsp;/g, '<span>&nbsp;</span>')
            .replace(/(\d)(\d)/g, '$1<span></span>$2<span></span>');
    } else if (type === CANVAS_TYPE.img && url || type === CANVAS_TYPE.animateImg) {
        children = new Image();
        children.crossOrigin = 'Anonymous';
        children.src = await picUrltoBase64(genUrl(url));
        children.style = 'width:100%;height:100%;';
        // if ((width / height) > aspectRatio) {
        //     children.style = 'width:100%';
        // } else {
        //     children.style = 'height:100%;';
        // }
    } else if (type === CANVAS_TYPE.background) {
        if (backgroundImg) {
            children = new Image();
            children.crossOrigin = 'Anonymous';
            children.src = genUrl(backgroundImg);
            children.style = `width:100%;height:100%;opacity:${videoBackgroundPicOpacity};position:absolute;left:0;top:0;`;
        }
    } else if (WorkspaceVideoType.includes(type)) {
        console.log('视频边框');
        parent.style.width = `${width - borderShifting}px`;
        parent.style.height = `${height - borderShifting}px`;
        parent.style.borderWidth = `${borderWidth ? borderWidth + borderShifting : 0}px`;
        parent.style.backgroundColor = item.backgroundColor || 'transparent';
        parent.style.opacity = item.opacity;
    } else if (type === CANVAS_TYPE.artFont) {
        const wordArt15 = [ART_TEXT_TYPE.gradient, ART_TEXT_TYPE.chartlet].includes(
            artJson.type);
        children = document.createElement('div');
        children.style = wordArt15
            ? `${style.join('')}word-break: break-word;position:unset`
            : '';
        children.className = wordArt15 ? 'wordArt15 globalFontFamily' : 'globalFontFamily';
        children.innerHTML = content;
        const artFontCss = getArtFontCss(artJson);
        children.style.backgroundClip = artFontCss.backgroundClip;
        children.style.WebkitBackgroundClip = artFontCss.WebkitBackgroundClip;
        children.style.textShadow = artFontCss.textShadow;
        children.style.backgroundImage = artFontCss.backgroundImage;
        // 增加图片字样式
        children.style.backgroundSize = 'cover';
        children.style.backgroundPosition = 'center center';
        children.style.WebkitTextFillColor = 'transparent';

        if (wordArt15) {
            children.top = 0;
            children.left = 0;
            children.style.borderWidth = '0px';
            children.style.borderStyle = 'unset';
            children.style.borderColor = 'transparent';
            children.style.borderRadius = '0px';
            children.style.height = `${parent.style.height}px`;
            children.style.width = `${parent.style.width}px`;
            container.append(children);
            children = await translateWordArtComp(children, options);
        }
    } else {
        return;
    }
    if (children) {
        children.style.borderWidth = '0px';
        parent.append(children);
    }
    if ((type === CANVAS_TYPE.img || type === CANVAS_TYPE.background) && children) {
        await new Promise(resolve => {
            children.onload = () => {
                resolve(11);
            };
            children.onerror = (e) => {
                console.error(e);
            };
        });
    }
    container.append(parent);

    console.log('开始画图');
    const resCanvas = await html2canvas(parent, options);
    container.append(resCanvas);
    containers.remove();
    return resCanvas;
}

// 驼峰转短横线
function toLine(name) {
    return name.replace(/([A-Z])/g, '-$1')
        .toLowerCase();
}

/**
 * 转换艺术字1、5类型为canvas
 * @param wordArtEl  根节点
 * @param options  需要转换的艺术字节点类数组
 */
function translateWordArtComp(wordArtEl, options) {
    return new Promise((resolve) => {
        const parentNode = wordArtEl.parentNode;
        // 绘制背景canvas
        html2canvas(wordArtEl, options)
            .then((canvasBG) => {
                const ctxBG = canvasBG.getContext('2d');
                const wordArtElClone = wordArtEl.cloneNode(true);
                wordArtElClone.style.color = '#EEE';
                wordArtElClone.style.background = '#FFF';
                parentNode.removeChild(wordArtEl);
                parentNode.append(wordArtElClone);
                // 绘制前景canvas

                const deep = cloneDeep(options);

                deep.ignoreElements = (node) => {
                    return node.getAttribute('id') === 'container' || node.nodeName === 'SCRIPT' ||
                        node.nodeName === 'META' || node.nodeName === 'TITLE';
                    ;
                };
                html2canvas(wordArtElClone, deep)
                    .then((canvasFG) => {
                        parentNode.removeChild(wordArtElClone);
                        parentNode.append(wordArtEl);
                        // 比对前景和背景canvas，合成到背景canvas
                        const ctxFG = canvasFG.getContext('2d');
                        const imgDataBG = ctxBG.getImageData(0, 0, canvasFG.width, canvasFG.height);
                        const imgDataFG = ctxFG.getImageData(0, 0, canvasFG.width, canvasFG.height);
                        const dataBG = imgDataBG.data;
                        const dataFG = imgDataFG.data;
                        const pixArr = [];
                        for (let i = 0, len = dataBG.length; i < len; i += 4) {
                            // checkout前景数据有效值
                            let validPix = false;
                            const dataFGPix = dataFG.slice(i, i + 3);
                            for (let j = 0; j < dataFGPix.length; j++) {
                                if (dataFGPix[j] !== 255) {
                                    validPix = true;
                                    break;
                                }
                            }
                            // 合成像素点
                            let renderPix;
                            if (validPix) {
                                renderPix = [...dataBG.slice(i, i + 3), dataFG[i + 3]];
                            } else {
                                renderPix = [0, 0, 0, 0];
                            }
                            pixArr.push(...renderPix);
                        }
                        const pixTypedArr = Uint8ClampedArray.from(pixArr);
                        const mixedImageData = new ImageData(pixTypedArr, canvasFG.width,
                            canvasFG.height);
                        const mixedCanvas = document.createElement('canvas');
                        mixedCanvas.setAttribute('width', canvasFG.width);
                        mixedCanvas.setAttribute('height', canvasFG.height);
                        mixedCanvas.getContext('2d')
                            .putImageData(mixedImageData, 0, 0, 0, 0, canvasFG.width,
                                canvasFG.height);
                        const image = new Image();
                        image.style = 'width:100%;';
                        image.crossOrigin = 'Anonymous';
                        image.src = mixedCanvas.toDataURL();
                        parentNode.removeChild(wordArtEl);
                        resolve(image);
                        // parentNode.append(image);
                        // resolve();
                    });
            });
    });
}

export default element2Canvas;
