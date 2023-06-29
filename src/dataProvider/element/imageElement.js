import EqxElement from './element';
import { getImgAspectRatioByUrl } from '../../util/image';
import { DEFAULT_WORKSPACE_IMG_HEIGHT, WORKSPACE_SIZE } from '../../config/staticParams';

export default class ImgElement extends EqxElement {
    constructor(props) {
        super(props);
        this.initImg(props);
    }

    initImg = async ({ picUrl, transverse = true }) => {
        const aspectRatio = await getImgAspectRatioByUrl(picUrl);
        const height = DEFAULT_WORKSPACE_IMG_HEIGHT;
        const width = height * aspectRatio;
        const workSize = {
            x: transverse ? WORKSPACE_SIZE.l : WORKSPACE_SIZE.s,
            y: transverse ? WORKSPACE_SIZE.s : WORKSPACE_SIZE.l,
        };
        this.state.height = height;
        this.state.width = width;
        this.state.top = (workSize.y - height) / 2;
        this.state.left = (workSize.x - width) / 2;

    };

}
