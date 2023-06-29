import { ART_TEXT_TYPE } from '../../../../config/staticParams';

export const fonts = [
    {
        title: '常规',
        value: ART_TEXT_TYPE.normal,

    },
    {
        title: '阴影文字',
        value: ART_TEXT_TYPE.shadow,
        property: {
            type: ART_TEXT_TYPE.shadow,
            shadow: {
                color: '#000000',
                h: 5,
                v: 5,
                blur: 1,
            },
        },
        css: {
            // fontSize: 24,
            // color: '#ffffff',
            // fontFamily: DEFAULT_FONT_FAMLIY
        },
    },
    {
        title: '描边文字',
        value: ART_TEXT_TYPE.scribble,
        property: {
            type: ART_TEXT_TYPE.scribble,
            angle: 45,
            shadow: {
                color: '#000000',
                h: 0,
                v: 0,
                blur: 0,
            },
            stroke: {
                size: 1,
                color: '#000000',
            },
        },
        css: {
            // fontSize: 24,
            // color: '#ffffff',
            // fontFamily: DEFAULT_FONT_FAMLIY
        },
    },
    // {
    //     title: '立体文字',
    //     value: ART_TEXT_TYPE.cube,
    // },
    // {
    //     title: '颤抖文字',
    //     value: ART_TEXT_TYPE.shake,
    // },
];
