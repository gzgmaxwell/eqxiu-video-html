import { createUUID } from '../../util/data';
import SvgElement from './svgElement';

console.log(SvgElement);
const classArray = {
    1001: { class: SvgElement },
};
export default class EqxElement {
    constructor(props) {
        const { type } = props;
        if (!classArray[type]) {
            throw new Error('Invalid type');
        }
        this.state = {
            type,
            top: 0,
            left: 0,
            width: 0,
            height: 0,
            rotate: 0,
            uuid: createUUID(),
            layerName: '元素1',
            lock: false,
            visibility: 'visible',
            ...props,
        };
    }

    init = () => {

    };

    static from({ type, ...props }) {
        if (type === undefined || !classArray[type]) {
            throw new Error('Invalid type');
        }
        const Classes = classArray[type].class;
        return new Classes(props);
    }

    exportJson = () => {
        return this.state;
    };
}
