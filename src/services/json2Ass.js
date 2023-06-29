import { rgbToHex } from '../util/data';
import { isString, replaceAll } from '../util/util';
import { SUBTITLES_FONTS } from '../config/staticParams';

/* global moment */
/**
 * json数据转ass字幕文件
 * input:[
 *  {
 *      begin:0, // 开始时间 毫秒
 *      end:10, // 结束时间
 *      content: '字幕内容',
 *      top: 0, // 顶部距离
 *      left: 0, // 左边距
 *      width: 0, // 宽度
 *      rotate: 359, //角度
 *      fontFamily: 'xxx', //字体
 *      fontSize: 14, // 字体大小
 *      color: '#FFF' // 字体颜色
 *      backgroundColor: '#FFF', // 背景色
 *      fontWeight: 'bold', //字重
 *      fontStyle: 'oblique' // 字斜
 *      textDecoration: 'underline', // 下划线
 *      lineHeight: 1, //行高
 *      letterSpacing: 1, //字间距
 *      artJson:{ // 艺术字处理
 *          stroke:{
 *              size: 12, // 描边大小
 *              color: #ffffff // 颜色
 *          },
 *          shadow:{
 *
 *          }
 *      }
 *  }
 * ]
 */
class Json2Ass {
    constructor({ data, targetSize, oriSize }) {
        this.targetSize = targetSize || {
            x: 1280,
            y: 720,
        };
        this.oriSize = oriSize || {
            x: 1280,
            y: 720,
        };
        this.scale = this.targetSize.x / this.oriSize.x;
        this.data = data.map(this.formatOne);
        this.artList = []; // 额外属性list
        this.AttrList = [ // 属性列表，包含默认值和处理函数
            {
                key: 'Layer',
                default: 100,
            },
            {
                key: 'Start',
                format: this.formatTime,
                default: '0:00:00.00',
            }, {
                key: 'End',
                format: this.formatTime,
                default: '0:00:00.00',
            }, {
                key: 'Style',
                default: 'Default',
            }, {
                key: 'Name',
                default: '',
            }, {
                key: 'MarginL',
                default: 0,
            },
            {
                key: 'MarginR',
                default: 0,
            },
            {
                key: 'MarginV',
                default: 0,
            }, {
                key: 'Effect',
                default: '',
            }, {
                key: 'Text',
                format: this.formatContent,
                default: '',
            },
        ];
    }

    data = [];
    title = 'Default file'; // 字幕标题


    formatOne = (one) => {
        const { scale, oriSize: { x: oriX } } = this;
        const newOne = {
            ...one,
            width: Number(one.width) * scale,
            height: Number(one.height) * scale,
            Start: Number(one.begin) || 0,
            End: Number(one.end) || 0,
            MarginL: Number((Number(one.left) * scale).toFixed(2)) || 0,
            MarginR: Number((oriX - (Number(one.left) + one.width) * scale).toFixed(2)) || 0,
            MarginV: Number((Number(one.top) * scale + 6).toFixed(2)) || 0,
            Text: one.content || '',
            Fontname: (SUBTITLES_FONTS[one.fontFamily] || {}).ass || 'FZHei-B01S',
            Fontsize: Math.ceil(one.fontSize * scale) * 1.14 || 18,
            PrimaryColour: this.formatColor(one.color || '#000000'),
            Layer: Number(one.Layer) || 100,
        };

        return newOne;
    };
    /**
     * 格式化Color
     * @param str rgba() | rgb() | # 格式
     * @returns {string}
     */
    formatColor = (str) => {
        if (!isString(str) || str.startsWith('&H')) return str;
        let res = '&H';
        let color = str;
        if (str.startsWith('rgba') || str.startsWith('rgb')) {
            color = rgbToHex(str);
        }
        if (color.startsWith('#')) { // 说明是 16进制
            const colorArray = ['R', 'G', 'B'];
            const value = color.slice(1, 7);
            if (color.length === 9) { // 说明有透明值
                res += color.slice(-2);
            } else {
                // res += '00';
            }
            // 把rgb变成 bgr 后拼接成字符串
            res += colorArray
                .map((v, index) => value.slice(2 * index, (2 * index) + 2))
                .reverse()
                .join('');
        }

        return res;
    };
    /**
     * 格式化时间
     * @param ms 毫秒数
     * @returns {string} h:mm:ss.23
     */
    formatTime = (ms) => {
        const timeArr = moment.utc(ms)
            .format('h:mm:ss.SS')
            .split(':');
        timeArr[0] = ~~(ms / (3600 * 1000));
        return timeArr.join(':');
    };

    formatContent = (content) => {
        let newContent = replaceAll(content, '\n', '\\N');
        newContent = replaceAll(newContent, '<br>', '\\N');
        newContent = replaceAll(newContent, '&nbsp;', ' ');
        newContent = this.handlerStyle(newContent);
        return newContent;
    };

    /**
     * 样式处理
     * @param content
     * @returns {string}
     */
    handlerStyle = (content) => {
        const newContent = content;
        const boolKey = (v, m) => v === m ? 1 : 0;
        const styleHash = {
            Fontname: { key: 'fn' },
            Fontsize: { key: 'fs' },
            PrimaryColour: { key: 'c' },
            fontWeight: {
                key: 'b',
                format: (v) => boolKey(v, 'bold'),
            },
            fontStyle: {
                key: 'i',
                format: (v) => boolKey(v, 'oblique'),
            },
            textDecoration: {
                key: 'u',
                format: (v) => boolKey(v, 'underline'),
            },
            letterSpacing: {
                key: 'fsp',
                format: (v) => v - 1,
            },
        };
        const style = ['\\q0'];
        style.push(this.formatRotate(this._nowData));
        Object.keys(this._nowData)
            .forEach((key) => {
                const oneHash = styleHash[key];
                if (oneHash) {
                    let val = this._nowData[key];
                    if (typeof oneHash.format === 'function') {
                        val = oneHash.format(val);
                    }
                    style.push(`\\${oneHash.key}${val}`);
                }
            });
        if (this._nowData.artJson) {
            style.push(this.handlerArtFont(this._nowData.artJson));
        }
        return `{${style.join('')}}${newContent}`;
    };
    /**
     * 艺术字处理
     * @param data
     * @returns {string}
     */
    handlerArtFont = (data) => {
        if (!data) return '';
        let str = '';
        const { scale } = this;
        const { stroke = null, shadow = null, realShadow } = data;
        // 处理描边
        if (stroke) {
            const { size = 0, color = '#FFFFFF' } = stroke;
            str += `\\bord${~~(size * scale * 1.2)}\\3c${this.formatColor(color)}`;
        }
        if (shadow) {
            const { blur = 0, color = '#FFFFFF', h = 0, v = 0 } = shadow;
            const newData = { ...this._nowData };
            newData.MarginL += h;
            newData.MarginR += h;
            newData.MarginV += v;
            newData.Layer -= 1;
            newData.artJson = {
                realShadow: {
                    blur,
                    color,
                },
            };
            this.artList.push(newData);
        }
        if (realShadow) {
            const { blur = 0, color = '#FFFFFF' } = realShadow;
            str += `\\1c${this.formatColor(color)}\\blur${blur}`;
        }
        return str;
    };
    /**
     * 处理旋转
     */
    formatRotate = (data) => {
        if (!data) return '';
        const { MarginL, MarginV, rotate, width, height } = data;
        let str = '';
        if (rotate) {
            str += `\\org(${Number(MarginL) + (Number(width) / 2)},${Number(MarginV) +
            (Number(height) / 2) })\\frz-${rotate}`;
        }
        return str;
    };
    /**
     * 处理单行数据
     * @param data
     * @returns {string}
     */
    _nowData = {}; // 保存当前处理的数据，便于其他format函数取值
    constRow = (data) => {
        this._nowData = data;
        const str = 'Dialogue: ';
        const dataArray = [];
        this.AttrList.forEach((one) => {
            let val = data[one.key] !== undefined ? data[one.key] : one.default;
            // 如果需要处理
            if (typeof one.format === 'function') {
                const func = one.format;
                val = func(val);
            }
            dataArray.push(val);
        });
        return `${str}${dataArray.join(',')}`;
    };

    /**
     * 导出字幕String
     * @returns {string}
     */
    exportString = () => {
        const defalutArray = {
            Name: { default: 'Default' },
            Fontname: { default: 'FZHei-B01S' },
            Fontsize: { default: '18' },
            PrimaryColour: { default: '' },
            SecondaryColour: { default: '' },
            TertiaryColour: { default: '&HFFFFffff' },
            BackColour: { default: '&HFFffffff' },
            Bold: { default: '0' },
            Italic: { default: '0' },
            Underline: { default: '0' },
            StrikeOut: { default: '0' },
            ScaleX: { default: '100' },
            ScaleY: { default: '100' },
            Spacing: { default: '0' },
            Angle: { default: '0' },
            BorderStyle: { default: '1' },
            Outline: { default: '0' },
            Shadow: { default: '5' },
            Alignment: { default: '7' },
            MarginL: { default: '20' },
            MarginR: { default: '20' },
            MarginV: { default: '20' },
            AlphaLevel: { default: '0' },
            Encoding: { default: '1' },
        };
        const str = `
[Script Info]
; Script generated by Eqxiu video
; http://www.eqxiu.com/
Title: ${this.title}
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709
PlayResX: ${this.targetSize.x}
PlayResY: ${this.targetSize.y}

[V4+ Styles]
Format:${Object.keys(defalutArray)
            .join(',')}
Style:${Object.values(defalutArray)
            .map(v => v.default)
            .join(',')}

[Events]
Format: ${this.AttrList.map(v => v.key)
            .join(',')}
${this.data.map(this.constRow)
            .join('\n')}
${this.artList.map(this.constRow)
            .join('\n')}

`;
        return str;
    };

    exportBlob = () => {
        return Array.prototype.map.call(this.exportString(),
            function (c) {
                return c.charCodeAt(0);
            });
    };
}

export default Json2Ass;
