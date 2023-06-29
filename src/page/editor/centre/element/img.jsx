// @ts-nocheck

import React from "react";
import ResizeComponent, {
    needProperty as resizeNeedProperty
} from "../../../components/resizeComponent";
import { genUrl, getImgAspectRatioByUrl } from "../../../../util/image";
import { makeCancelable } from "../../../../util/request";
import { connect } from "dva";
import { initElementProps } from "../workspace";
import { onInitAnimation } from "../../../../services/animation";

export const needProperty = {
    ...resizeNeedProperty,
    url: "",
    opacity: 1,
    animate: null,
    animationState: "unset"
};

// @ts-ignore
@connect(initElementProps)
class ResizeImg extends React.PureComponent {
    constructor(props) {
        super(props);
        this.img = React.createRef();
        this.orginzIndex = 0;
        this.state = {
            aspectRatio: props.width / props.height
        };
    }

    static getDerivedStateFromProps() {
        const newState = {};
        return newState;
    }

    componentDidMount() {
        this.onSaveElement();
        this.getImgAR = makeCancelable(getImgAspectRatioByUrl(this.props.url));
        this.initAnimation();

        this.getImgAR.promise
            .then(aspectRatio => {
                this.setState({ aspectRatio });
            })
            .catch(() => {});
    }

    componentDidUpdate(prevProps) {
        this.onSaveElement();
        const {
            props: { animationSpecialValue, animetionCurrent }
        } = this;
        // 重新初始话动画
        if (prevProps.animationSpecialValue !== animationSpecialValue) {
            this.initAnimation();
        }
        if (this.animeJs && prevProps.animetionCurrent !== animetionCurrent) {
            this.animeJs.seek(animetionCurrent * 1000);
        }
        if (prevProps.url !== this.props.url) {
            getImgAspectRatioByUrl(this.props.url).then(aspectRatio => {
                this.setState({ aspectRatio });
            });
        }
    }

    componentWillUnmount() {
        this.getImgAR.cancel();
    }

    animeJs = null;
    /**
     * 初始化动画
     */
    initAnimation = async () => {
        const {
            props: { animetionTimeLineParams, animetionCurrent, animetionTotalDuation },
            img
        } = this;
        if (this.animeJs) {
            this.animeJs.seek(0);
        }
        this.animeJs = await onInitAnimation(
            img.current,
            animetionTotalDuation,
            animetionTimeLineParams
        );
        if (this.animeJs) {
            // this.animeJs.seek();
            this.animeJs.seek(animetionCurrent * 1000);
            // this.animeJs.play();
        }
    };

    onSaveElement = () => {
        if (this.img.current && typeof this.props.onSaveELements === "function") {
            this.props.onSaveELements(this.img.current.parentNode);
        }
    };

    onChange = state => {
        const {
            props: { resizeprops: { onChange = () => null } = {} }
        } = this;
        onChange({
            ...state,
            aspectRatio: this.state.aspectRatio
        });
    };

    render() {
        const {
            props: {
                resizeprops: { paramsData, limit, onChange, ...resizeprops },
                url,
                elementprops,
                animationName,
                animationDuration,
                animationIteration,
                animationState,
                ...props
            }
        } = this;
        if (!url) return null;
        const otherStyles = {
            ...props,
            wordBreak: "break-word"
            // overflow: 'hidden',
        };
        const style = {
            width: "100%",
            height: "100%"
            // animation: animationName
            //     ? `${animationName} ${animationDuration}ms ${animationIteration}`
            //     : 'unset',
            // animationPlayState: animationState || 'running',
        };
        let src = url.includes("svg")
            ? genUrl(url)
            : genUrl(url, `${otherStyles.width * 2}:${otherStyles.height * 2}`) || "";
        if (!url.includes("svg") && src.indexOf("thumbnail/") === -1) {
            src += `?imageMogr2/auto-orient/strip/thumbnail/${otherStyles.width *
                2}x${otherStyles.height * 2}`;
        }
        return (
            <ResizeComponent
                {...resizeprops}
                fixedaspectratio={0}
                paramsData={paramsData}
                limit={limit}
                onChange={this.onChange}
                otherStyle={otherStyles}>
                <img
                    id={`element_${props.uuid}`}
                    {...elementprops}
                    role='presentation'
                    // onMouseDown={resizeprops.onMouseDown}
                    crossOrigin='anonymous'
                    className='workspace__el'
                    src={src}
                    style={style}
                    draggable={false}
                    ref={this.img}
                    alt='图片'
                />
            </ResizeComponent>
        );
    }
}

export default ResizeImg;
