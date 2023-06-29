import React from 'react';
import { connect } from 'dva';
import styles from './artFont.less';
import artFontJsonList from '../artFontJsonList';
import { limitInsert } from '../../../../util/data';
import { getArtFontCss } from '../../../../util/style';
import { addGlobalStyle } from '../../../../util/doc';
import { getMyFont, getH5ComponentStyles } from '../../../../api/user';
import cloneDeep from 'lodash/cloneDeep';
import { ART_TEXT_TYPE, CANVAS_TYPE } from 'Config/staticParams';
import { host } from 'Config/env';

@connect(({ workspace }) => {
    return { dataList: workspace.dataList };
})
export default class ArtFont extends React.PureComponent {
    state = {
        fonts: []
    }
    componentDidMount() {
        // artFontJsonList.forEach((item) => {
        //     const { fontFamily } = item.css;
        //     const woffPath = `store/fonts/${fontFamily}.woff?text=${encodeURIComponent(item.text)}`;
        //     addGlobalStyle(fontFamily, woffPath);
        // });
        this.getFontList();
    }

    getFontList = () => {
        getH5ComponentStyles().then( font => {
            const { rows = []} = font.data.map;
            if(font.data.success) {
                this.setState({
                    fonts: rows
                });
                rows.map( item => {
                    const { fontinfo = {} } = item.property;
                    const { font_family, woff_path } = fontinfo;
                    font_family && addGlobalStyle(font_family, woff_path, true);
                })

            }
        });
    }
    // 插入文字
    insertText = (font) => {
        const { property, property:{ fontColor, fontinfo: { font_family } } } = font;
        let artJson = {};
        let css = {
            fontFamily: font_family,
            fontSize:  24,
            color: fontColor,
            height: 36
        };
        if (limitInsert(this.props.dataList, CANVAS_TYPE.artFont) === false) return;
        getMyFont()
            .then(({ data: { list = [] } }) => {
                const { font_family, woff_path, authedttf_path } =
                list.find(f => f.font_family === css.fontFamily) || {};
                if (font_family) {
                    addGlobalStyle(font_family, woff_path || authedttf_path, true);
                }

                let tempProperty = cloneDeep(property);
                //贴图文字
                if(tempProperty.hasOwnProperty('chartlet')) {
                    css.color = '#00000000';
                    artJson.type = ART_TEXT_TYPE.chartlet;
                    artJson.backgroundImage = host.font2 + property.chartlet.cover;
                }
                //阴影
                if(tempProperty.hasOwnProperty('dropshow')) {
                    const { color, x, y, transparency, blur } = tempProperty.dropshow;
                    artJson.shadow = {
                        h: Number(x),
                        v: Number(y),
                        color: this.hexToRgba(color, Number(transparency)),
                        blur: Number(blur)
                    };
                }
                //渐变
                if(tempProperty.hasOwnProperty('gradient')) {
                    const { angle, colors: { left, right } } = tempProperty.gradient
                    css.color = '#00000000';
                    artJson.gradient = {
                        angle: Number(angle),
                        colors: {
                            0: left,
                            1: right
                        }
                    };
                }
                //立体文字
                if(tempProperty.hasOwnProperty('cube')) {
                    const { size, color, angle } = tempProperty.cube;
                    artJson.angle = Number(angle);
                    artJson.cube = [{
                        size: Number(size),
                        color
                    }];
                }
                //描边立体文字
                if(tempProperty.hasOwnProperty('stroke')) {
                    const { color, size, distance } = tempProperty.stroke;
                    // artJson.angle = 45;
                    artJson.stroke = {
                        color,
                        distance,
                        size: Number(size)
                    };
                }
                //颤抖文字
                if(tempProperty.hasOwnProperty('shake')) {
                    const { size, angle, colors: { left, right } } = tempProperty.shake
                    artJson.angle = Number(angle);
                    artJson.shake = {
                        size: Number(size),
                        colors: {
                            0: left,
                            1: right
                        }
                    };
                }
                

                if('gradient' in tempProperty) {
                    artJson.type = ART_TEXT_TYPE.gradient;
                }
                else if('dropshow' in tempProperty && 'stroke' in tempProperty) {
                    artJson.type = ART_TEXT_TYPE.stroke;
                }
                else if('chartlet' in tempProperty || ('stroke' in tempProperty && 'chartlet' in tempProperty)) {
                    artJson.type = ART_TEXT_TYPE.chartlet;
                }
                else if(('dropshow' in tempProperty || 'stroke' in tempProperty) && 'cube' in tempProperty) {
                    artJson.type = ART_TEXT_TYPE.cube;
                }
                else if('dropshow' in tempProperty && 'cube' in tempProperty && 'stroke' in tempProperty) {
                    artJson.type = ART_TEXT_TYPE.stroke;
                }
                else if('shake' in tempProperty) {
                    artJson.type = ART_TEXT_TYPE.shake;
                }
                else if('cube' in tempProperty) {
                    artJson.type = ART_TEXT_TYPE.cube;
                }
                else if('stroke' in tempProperty) {
                    artJson.type = ART_TEXT_TYPE.stroke;
                }else {
                    artJson.type = ART_TEXT_TYPE.shadow;
                }


                console.log('艺术字对象', artJson)
                this.props.dispatch({
                    type: 'workspace/insertText',
                    payload: {
                        type: CANVAS_TYPE.artFont,
                        artJson,
                        ...css
                    },
                });
            });
    };
    /**
    * hex转rgba
    * @param hex 例如:"#23ff45"
    * @param opacity 透明度
    * @returns {string}
    */
    hexToRgba = (hex, opacity) => {
        return "rgba(" + parseInt("0x" + hex.slice(1, 3)) + "," + parseInt("0x" + hex.slice(3, 5)) + "," + parseInt("0x" + hex.slice(5, 7)) + "," + ( opacity > 0 ? opacity / 100 : 1 ) + ")";
    };

    render() {
        const { fonts } = this.state;
        return (
            <div className={`${styles.art__font} scrollDiv`}>
                {
                    fonts.map((font, index) => {
                        if(font.property.fontinfo) {
                            return <div 
                                className={styles.art__font__item}
                                key={index}
                                style={{backgroundImage: `url("${host.font2}${font.styleCover}?imageMogr2/auto-orient/thumbnail/248x112")`}}
                                onClick={() => this.insertText(font)}
                            />
                        }
                    })
                }
            </div>
        );
    }
}
