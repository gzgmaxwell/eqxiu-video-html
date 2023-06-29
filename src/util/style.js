import { ART_TEXT_TYPE } from '../config/staticParams';
import { host } from 'Config/env';

/**
 * 插入艺术字时，根据艺术字获取样式数据
 * @param item
 * @returns {object}
 */
export const getArtFontCss = (property) => {
    switch (property.type) {
        // 阴影文字
        case ART_TEXT_TYPE.shadow:
            return shadow(property);
        // 渐变文字
        case ART_TEXT_TYPE.gradient:
            return gradient(property);
        // 立体文字
        case ART_TEXT_TYPE.cube:
            return cube(property);
        // 描边立体文字
        case ART_TEXT_TYPE.stroke:
            return stroke(property);
        // 描边文字
        case ART_TEXT_TYPE.scribble:
            return stroke(property);
        // 描边文字
        case ART_TEXT_TYPE.scribble:
            return scribble(property);
        // 颤抖文字
        case ART_TEXT_TYPE.shake:
            return shake(property);
        // 贴图文字
        case ART_TEXT_TYPE.chartlet:
            return chartlet(property);
        default:
            return {};
    }
};

export const shadow = (property) => {
    const resCss = {};
    const { shadow = {} } = property;
    resCss.textShadow = `${shadow.color} ${shadow.h}px ${shadow.v}px ${shadow.blur}px`;
    return resCss;
};
export const gradient = (property) => {
    const resCss = {};
    const { gradient = {} } = property;
    resCss.backgroundImage = `linear-gradient(${gradient.angle}deg, ${gradient.colors[0]} 0%, ${gradient.colors[1]} 100%)`;
    resCss.backgroundClip = 'text';
    resCss.WebkitBackgroundClip = 'text';
    // if(property.shadow) {
    //     resCss.textShadow = shadow(property).textShadow;
    // }
    // if(property.stroke) {
    //     resCss.WebkitTextStroke = `${property.stroke.color} ${property.stroke.size}px`;
    // }
    return resCss;
};
export const cube = (property) => {
    const resCss = {};
    const { cube = [{}], angle = 0 } = property;
    const A = angle * Math.PI / 180;
    const color = cube[0].color;
    const size = cube[0].size;
    let textShadow = [];
    for (let i = 0; i < size; i++) {
        textShadow.push(`${color} ${i * Math.cos(A)}px ${i * Math.sin(A)}px 0`);
    }
    if(property.shadow) {
        textShadow.push(shadow(property).textShadow );
    }
    resCss.textShadow = textShadow.join(',');
    return resCss;
};
export const stroke = (property) => {
    const resCss = {};
    const { stroke = {} } = property;
    const color = stroke.color;
    const size = stroke.size;
    let textStroke = [];
    for (let k = size; k > 0; k -= 1) {
        for (let j = 1; j <= 4; j++) {
            for (let i = 1; i <= k; i++) {
                switch (j) {
                    case 1:
                        textStroke.push(`${color} ${i}px ${k * -1}px 0`);
                        break;
                    case 2:
                        textStroke.push(`${color} ${k}px ${i}px 0`);
                        break;
                    case 3:
                        textStroke.push(`${color} ${i}px ${k}px 0`);
                        break;
                    case 4:
                        textStroke.push(`${color} ${k * -1}px ${i}px 0`);
                        break;
                }
            }
        }
    }
    if(property.cube) {
        textStroke.push(cube(property).textShadow);
    }
    if(property.shadow) {
        textStroke.push(shadow(property).textShadow);
    }
    // textStroke.push(shadow(property).textShadow);
    resCss.textShadow = textStroke.join();
    return resCss;
};

export const scribble = (property) => {
    const resCss = {};
    const { stroke = {} } = property;
    const color = stroke.color;
    const size = stroke.size;
    let textStroke = [];
    for (let k = size; k > 0; k -= 1) {
        for (let j = 1; j <= 4; j++) {
            for (let i = 1; i <= k; i++) {
                switch (j) {
                    case 1:
                        textStroke.push(`${color} ${i}px ${k * -1}px 0,`);
                        break;
                    case 2:
                        textStroke.push(`${color} ${k}px ${i}px 0,`);
                        break;
                    case 3:
                        textStroke.push(`${color} ${i}px ${k}px 0,`);
                        break;
                    case 4:
                        textStroke.push(`${color} ${k * -1}px ${i}px 0,`);
                        break;
                }
            }
        }
    }
    if(property.shadow) {
        textStroke.push(shadow(property).textShadow);
    }
    resCss.textShadow = textStroke.join();
    return resCss;
};
export const shake = (property) => {
    const resCss = {};
    const { shake = {}, angle = 0 } = property;
    const A = angle * Math.PI / 180;
    const color1 = shake.colors[0];
    const color2 = shake.colors[1];
    const size = shake.size;
    let textShadow = [];
    for (let n = 1; n <= 2; n++) {
        for (let i = 1; i <= size; i++) {
            if (n === 1) {
                textShadow.push(`${color1} ${-i * Math.cos(A)}px ${-i * Math.sin(A)}px 0`);
            } else {
                textShadow.push(`${color2} ${i * Math.cos(A)}px ${i * Math.sin(A)}px 0`);
            }
        }
    }
    if(property.shadow) {
        textShadow.push(shadow(property).textShadow);
    }
    resCss.textShadow = textShadow.join();
    return resCss;
};
export const chartlet = (property) => {
    const resCss = {};
    const { backgroundImage } = property;
    if (backgroundImage) {
        // resCss.backgroundImage = `url(${host.file + property.backgroundImage})`;
        resCss.backgroundImage = `url(${property.backgroundImage})`;
        resCss.backgroundPosition = 'center center';
        resCss.backgroundSize = 'cover';
        resCss.WebkitBackgroundClip = 'text';
    }
    if(property.stroke) {
        resCss.WebkitTextStroke = `${property.stroke.color} ${property.stroke.size}px`;
    }
    return resCss;
};