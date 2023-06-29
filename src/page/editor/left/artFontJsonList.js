/**
 * 艺术字类型
 */
import { ART_TEXT_TYPE } from '../../../config/staticParams';
import { host } from 'Config/env';

const mall = {
    gilding: `${host.font2}store/886913e52e0f14bea8c1f9a21024a25e.jpg`,
    gold: `${host.font2}store/19f44d8105ca97ac7a455454a10ef7d5.jpg`,
    fire: `${host.font2}store/3bc0a3689aa85cea5a5d2471eafacc2f.jpg`,
    rain: `${host.font2}store/4a740193402748329ae49100d9ae4056.jpg`,
    star: `${host.font2}store/e4ce96c875611971a5890b6437dcc7e8.jpg`,
    sky: `${host.font2}store/9a8a7db7b80ff0a37b3fcea2241bb84d.jpg`,
    ice: `${host.font2}store/5bc1f1e4f9ccd0bf4cbf32b4594cfee3.jpg`,
    flower: `${host.font2}store/4b0c5e82177620bfb52953c75a22b57b.jpg`,
    grass: `${host.font2}store/a7f895700811406461182d5c97f11871.jpg`,
    water: `${host.font2}store/378046595359e15e2e73e4e760d179eb.jpg`,
    chartlet: `${host.font2}store/8c0ec83aed3d182f8608e08f4aaf2a26.jpg`,
};
const chartletList = [
    {
        text: '贴图',
        css: {
            fontFamily: 'Pangmenzhengdaobiaotiti',
            fontSize: 24,
            color: 'transparent'
        },
        property: {
            backgroundImage: mall.chartlet
        }
    },
    {
        text: '鎏金',
        css: {
            fontFamily: 'Yangrendongzhushiticu',
            fontSize: 24,
            color: 'transparent'
        },
        property: {
            backgroundImage: mall.gilding
        }
    }, {
        text: '金属',
        css: {
            fontFamily: 'Zhankukuhei',
            fontSize: 24,
            color: 'transparent'
        },
        property: {
            backgroundImage: mall.gold
        }
    }, {
        text: '火焰',
        css: {
            fontFamily: 'Pangmenzhengdaobiaotiti',
            fontSize: 24,
            color: 'transparent'
        },
        property: {
            backgroundImage: mall.fire
        }
    }, {
        text: '雨滴',
        css: {
            fontFamily: 'Zhankuwenyiti',
            fontSize: 24,
            color: 'transparent'
        },
        property: {
            backgroundImage: mall.rain
        }
    }, {
        text: '星空',
        css: {
            fontFamily: 'Zhengqingkehuangyouti',
            fontSize: 24,
            color: 'transparent'
        },
        property: {
            backgroundImage: mall.star
        }
    }, {
        text: '天空',
        css: {
            fontFamily: 'Zhankukuaileti',
            fontSize: 24,
            color: 'transparent'
        },
        property: {
            backgroundImage: mall.sky
        }
    }, {
        text: '冰霜',
        css: {
            fontFamily: 'ZhankuxiaoweiLOGOti',
            fontSize: 24,
            color: 'transparent'
        },
        property: {
            backgroundImage: mall.ice
        }
    }, {
        text: '花瓣',
        css: {
            fontFamily: 'Zhankugaoduanhei',
            fontSize: 24,
            color: 'transparent'
        },
        property: {
            backgroundImage: mall.flower
        }
    }, {
        text: '草地',
        css: {
            fontFamily: 'Zhankuwenyiti',
            fontSize: 24,
            color: 'transparent'
        },
        property: {
            backgroundImage: mall.grass
        }
    }, {
        text: '清水',
        css: {
            fontFamily: 'Zhengqingkehuangyouti',
            fontSize: 24,
            color: 'transparent'
        },
        property: {
            backgroundImage: mall.water
        }
    }
];
for (let i = 0; i < chartletList.length; i++) {
    chartletList[i].name = '贴图文字';
    chartletList[i].property.type = ART_TEXT_TYPE.chartlet;
}
const otherList = [
    {
        name: '阴影文字',
        text: '阴影',
        property: {
            type: ART_TEXT_TYPE.shadow,
            shadow: {
                color: '#000000',
                h: 0,
                v: 0,
                blur: 24
            }
        },
        css: {
            fontSize: 24,
            color: '#ffffff',
            fontFamily: 'fangzheng_ssjt'
        }
    },
    {
        name: '渐变文字',
        text: '渐变',
        property: {
            type: ART_TEXT_TYPE.gradient,
            gradient: {
                angle: 90,
                colors: { 0: '#5D61FF', 1: '#FF15F5' }
            }
        },
        css: {
            fontSize: 24,
            fontFamily: 'Yangrendongzhushiti',
            color: 'transparent'
        }
    },
    {
        name: '立体文字',
        text: '立体',
        property: {
            type: ART_TEXT_TYPE.cube,
            angle: 45,
            shadow: {
                color: '#000000',
                h: 0,
                v: 0,
                blur: 20
            },
            cube: [{ size: 10, color: '#CCD5DB' }]
        },
        css: {
            fontSize: 24,
            color: '#ffffff',
            fontFamily: 'Pangmenzhengdaobiaotiti'
        }
    }, {
        name: '描边立体文字',
        text: '描边',
        property: {
            type: ART_TEXT_TYPE.stroke,
            angle: 45,
            shadow: {
                color: '#000000',
                h: 0,
                v: 0,
                blur: 20
            },
            cube: [{ size: 10, color: '#FF2A6A' }],
            stroke: {
                size: 2,
                color: '#5D61FF'
            }
        },
        css: {
            fontSize: 24,
            color: '#ffffff',
            fontFamily: 'Zhengqingkehuangyouti'
        }
    }, {
        name: '颤抖文字',
        text: '颤抖',
        property: {
            type: ART_TEXT_TYPE.shake,
            angle: 0,
            shake: {
                size: 3,
                colors: { 0: 'rgba(255, 42, 106, 1)', 1: 'rgba(83, 235, 239, 1)' }
            },
            shadow: {
                color: '#000000',
                h: 0,
                v: 0,
                blur: 0
            }
        },
        css: {
            fontSize: 24,
            color: '#212121',
            fontFamily: 'Zhankukuaileti'
        }
    }
];
export const defaultGradientColors = [
    {
        angle: 0,
        colors: { 0: '#8F91FF', 1: '#FAC1FF' }
    },
    {
        angle: 0,
        colors: { 0: '#626262', 1: '#000000' }
    },
    {
        angle: 0,
        colors: { 0: '#FFF424', 1: '#FFA548' }
    },
    {
        angle: 0,
        colors: { 0: '#FFFFFF', 1: '#D9D9D9' }
    },
    {
        angle: 0,
        colors: { 0: '#980A02', 1: '#FD1919' }
    },
    {
        angle: 0,
        colors: { 0: '#F47264', 1: '#FF3B19' }
    },
    {
        angle: 0,
        colors: { 0: '#FFB143', 1: '#FF7433' }
    },
    {
        angle: 0,
        colors: { 0: '#62E791', 1: '#D6FC09' }
    },
    {
        angle: 0,
        colors: { 0: '#04B746', 1: '#70FCAE' }
    },
    {
        angle: 0,
        colors: { 0: '#449522', 1: '#AEE74E' }
    },
    {
        angle: 0,
        colors: { 0: '#1595FF', 1: '#02E1FF' }
    },
    {
        angle: 0,
        colors: { 0: '#5A63FF', 1: '#1892FF' }
    },
    {
        angle: 0,
        colors: { 0: '#1D23A7', 1: '#2062DE' }
    },
    {
        angle: 0,
        colors: { 0: '#75A0E5', 1: '#A8AAF2' }
    },
    {
        angle: 0,
        colors: { 0: '#4B4FFF', 1: '#7662FF' }
    },
    {
        angle: 0,
        colors: { 0: '#BE3DCE', 1: '#FE8BE3' }
    },
    {
        angle: 0,
        colors: { 0: '#FC3BAC', 1: '#FF1D50' }
    },
    {
        angle: 0,
        colors: { 0: '#9A5555', 1: '#C47B7B' }
    },
];
export default otherList.concat(chartletList);
