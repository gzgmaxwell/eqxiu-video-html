import { name, host } from 'Config/env';

/**
 * 公用设置头部的方法
 * @param str
 */
function setTitle(str) {
    const title = `${name === 'pre' ? '预发布-' : ''}${str} - 易企秀`;
    document.title = title;
}

export function getElementLeft(ele) {
    let left = ele.offsetLeft;
    let parent = ele.offsetParent;
    while (parent !== null) {
        left += parent.offsetLeft;
        parent = parent.offsetParent;
    }
    // console.log('left',left);
    return left;
}

export function getElementTop(ele) {
    let top = ele.offsetTop;
    let parent = ele.offsetParent;
    while (parent !== null) {
        top += parent.offsetTop;
        parent = parent.offsetParent;
    }
    // console.log('left',left);
    return top;
}

/**
 * 获取页面当前的滚动高度
 * @returns {number}
 */
function getScrollTop() {
    if (document.compatMode === 'BackCompat') {
        return document.body.scrollTop;
    } else {
        return document.documentElement.scrollTop === 0
               ? document.body.scrollTop
               : document.documentElement.scrollTop;
    }
}

/**
 * 根据规则获得页面的数量
 * @param rules
 * @param hoz
 * @returns {number}
 */
function getPageSize(rules, hoz = true) {
    const windowWith = window.innerWidth;
    const arry = rules[hoz ? 'hoz' : 'ver'];
    let pageSize = 0;
    Object.keys(arry)
        .forEach((value, i) => {
            // 如果小于最小，大于最大则直接返回
            if (i === 0 && value > windowWith || (i === arry.length - 1 && value < windowWith)) {
                pageSize = arry[value];
                return pageSize;
            } else if (value <= windowWith) {
                pageSize = Math.max(arry[value], pageSize);
            }
        });
    return pageSize;
}

/**
 * 动态添加style标签
 * @param cssText {String}
 */
// 去重
const fontFamilies = [];

function addGlobalStyle(fontFamily, woffPath, all = false) {
    if (fontFamilies.includes(woffPath)) {
        return;
    }
    const fontHost = all ? host.font2 : host.font;
    const cssText = `@font-face{
                        font-family:'${fontFamily}';
                        src: url('${fontHost}${woffPath}') format('woff'),  
                        url('${fontHost}${woffPath}') format('truetype');}`;

    fontFamilies.push(woffPath);
    let style = all ? null : document.getElementsByTagName('style')[0]; // 如果是全地址就单独创建
    if (!style) {
        style = document.createElement('style'); // 创建一个style元素
        const head = document.head || document.getElementsByTagName('head')[0]; //获取head元素
        style.type = 'text/css'; // 这里必须显示设置style元素的type属性为text/css，否则在ie中不起作用
        style.setAttribute('data-html2canvas-ignore', fontFamily);
        head.appendChild(style);
    }
    const txt = document.createTextNode(cssText);
    style.appendChild(txt);
}

function filterPunctuation(str) {
    const chinese = /[\u3002|\uff1f|\uff01|\uff0c|\u3001|\uff1b|\uff1a|\u201c|\u201d|\u2018|\u2019|\uff08|\uff09|\u300a|\u300b|\u3008|\u3009|\u3010|\u3011|\u300e|\u300f|\u300c|\u300d|\ufe43|\ufe44|\u3014|\u3015|\u2026|\u2014|\uff5e|\ufe4f|\uffe5]/g;
    const eng = /[\~|`|\!|\@|\#|\$|\%|\^|\&|\*|\(|\)|\-|\_|\+|\=|\||\\|\[|\]|\{|\}|\;|\:|\"|\'|\,|\<|\.|\>|\/|\?]/g;
    return str.replace(chinese, '')
        .replace(eng, '');
}


export {
    setTitle,
    getScrollTop,
    getPageSize,
    addGlobalStyle,
    filterPunctuation,
};
