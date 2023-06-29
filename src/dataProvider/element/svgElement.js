import ImgElement from './imageElement';

export default class SvgElement extends ImgElement {
    constructor(props) {
        super(props);
        const { svgCode } = props;
        this.handlerSvgFill(svgCode);
    }

    handlerSvgFill = (code) => {
        const reg = /style="fill:(.+);/ug;
        const matchArray = String(code)
            .match(reg) || [];
        const result = matchArray.map((value, i) => {
            const deteil = reg.exec(value);
            const item = {
                ori: value,
                index: i,
                color: deteil && deteil[1],
            };
            return item;
        })
            .filter(v => v.color);
        this.state.replaceableList = result;
        this.state.oriCode = String(code);
    };

}
