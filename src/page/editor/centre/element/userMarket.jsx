import React, { useEffect, useRef } from "react";
import { connect } from "dva";
import ResizeComponent from "../../../components/resizeComponent";
import styles from "./userMarket.less";
import { initElementProps } from "../workspace";
import { onInitAnimation } from "../../../../services/animation";
import Icon from "../../../components/Icon";
import { decimalToPercentage } from "../../../../util/data";

const otherStyle = { overflow: "hidden" };

function UserMarketElement(props) {
    const {
        coverImg,
        uuid,
        width,
        height,
        left,
        top,
        rotate,
        title,
        fontSize,
        background,
        backgroundColor,
        fontWidth,
        fontHeight,
        fontTop,
        fontLeft,
        color,
        opacity,
        animetionCurrent,
        resizeprops,
        limit,
        elementprops,
        animationName,
        animetionTimeLineParams,
        animationDuration,
        animationSpecialValue,
        animetionTotalDuation,
        animationIteration,
        animationState
    } = props;
    let animeJs = useRef(null);
    const elementRef = useRef(null);
    async function initAnimation() {
        if (animeJs.current) {
            animeJs.current.seek(0);
        }
        let duration = animetionTotalDuation;
        if (animetionTimeLineParams && animetionTimeLineParams[0]) {
            duration = animetionTimeLineParams[0].duration;
        }
        animeJs.current = await onInitAnimation(
            elementRef.current,
            duration,
            animetionTimeLineParams
        );
        if (animeJs.current) {
            // this.animeJs.seek();
            animeJs.current.seek(animetionCurrent * 1000);
            // this.animeJs.play();
        }
    }

    useEffect(() => {
        if (animeJs.current) {
            animeJs.current.seek(animetionCurrent * 1000);
        }
    }, [animetionCurrent]);

    useEffect(() => {
        initAnimation();
    }, [animationSpecialValue]);
    const paramsData = {
        width,
        height,
        left,
        top,
        rotate,
        zIndex: 2100
    };
    const childrenProps = {
        id: `element_${uuid}`,
        role: "presentation",
        className: `workspace__el ${styles.children} elements`,
        draggable: false,
        ...elementprops
    };
    const elementStyle = {
        fontSize,
        background: background ? `url(${background}) 0 0 / 100% 100% no-repeat` : "",
        backgroundColor,
        color,
        opacity: isNaN(opacity / 100) ? 1 : opacity / 100,
        lineHeight: `${height}px`,
        zIndex: 2000,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        backgroundSize: "100% 100%"
        // animation: animationName
        //     ? `${animationName} ${animationDuration}ms ${animationIteration}`
        //     : 'unset',
        // animationPlayState: animationState || 'running',
    };
    const fontBox = background
        ? {
              style: {
                  width: decimalToPercentage(fontWidth),
                  height: decimalToPercentage(fontHeight),
                  left: decimalToPercentage(fontLeft),
                  top: decimalToPercentage(fontTop)
              }
          }
        : {};
    const children = coverImg ? (
        <img
            {...childrenProps}
            style={{ opacity: opacity / 100, width, height }}
            src={coverImg}
            alt='图片'
        />
    ) : (
        <div {...childrenProps} style={elementStyle} className={styles.elements_one}>
            {/* {background && <img src={background} className={styles.backgroundImg} />} */}
            <div className={styles.elements_fontBox} {...fontBox}>
                {title}
            </div>
        </div>
    );
    return (
        <ResizeComponent
            {...resizeprops}
            fixedaspectratio={0}
            paramsData={paramsData}
            limit={limit}>
            <div ref={elementRef} style={{ width: "100%", height: "100%" }}>
                {children}
            </div>
            {/*<Icon type={'eqf-widgets-l'} className={styles.markIcon}/>*/}
        </ResizeComponent>
    );
}

export default connect(initElementProps)(UserMarketElement);
