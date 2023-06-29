import React from 'react';
import styles from './animateImg.less';
import { prev } from 'Config/env';
import { CSSTransition } from 'react-transition-group';
import ScrollContainer from '../../../components/scrollContainer';
import { animateImgs, ANIMATION_TYPES, animations } from '../../../../dataBase/animations';
import { addGlobalStyle } from '../../../../util/doc';
import { host } from 'Config/env';
import { CANVAS_TYPE } from '../../../../config/staticParams';
import { genUrl } from '../../../../util/image';

class AnimateImg extends React.Component {
    constructor(props) {
        super(props);
        this.video = React.createRef();
        this.isLoading = false;
        this.preivewCloseDely = null;
    }

    state = {
        playing: false, // 正在播放
        hoverObj: {}, // 预览对象
        showPreivew: false, // 预览
        page: 1,
        endPage: false,
        pageSize: 30,
        activeIndex: 1,
        isLoading: true,
    };

    componentDidMount() {
        animations.forEach((item) => {
            const { fontFamily } = item.css;
            const woffPath = `store/fonts/${fontFamily}.woff?text=${encodeURIComponent(item.text)}`;
            addGlobalStyle(fontFamily, woffPath);
        });
    }

    componentWillUnmount() {
        this.setState = () => null;
    }

    handleMouseLeave = (e) => {
        clearTimeout(this.preivewOpenDely);
        this.preivewCloseDely = setTimeout(() => this.setState({ showPreivew: false }), 300);
    };
    hoverPreivew = () => {
        clearTimeout(this.preivewCloseDely);
        this.preivewCloseDely = null;
    };
    handleMouseEnter = (e, hoverObj, i) => {
        if (this.preivewCloseDely) {
            this.hoverPreivew();
        }
        const picUrl = host.font2 + animateImgs[Math.min(i, animateImgs.length - 1)];
        this.preivewOpenDely = setTimeout(() => this.setState({
            showPreivew: true,
            hoverObj: {
                ...hoverObj,
                index: i,
                picUrl,
            },
        }), 300);
    };
    handleClick = (e, { name, duration, iteration, type }, picUrl) => {
        this.props.insertAnimateImg({
            type: CANVAS_TYPE.animateImg,
            picUrl,
            animate: {
                [type]: {
                    animationName: name,
                    animationDuration: duration,
                    animationIteration: iteration,
                    delay: 0,
                },
            },
        });
    };

    render() {
        const { hoverObj, showPreivew } = this.state;
        return (
            <ScrollContainer>
                <React.Fragment>
                    <div className={styles.decorate}>
                        <div className={`${styles.listContent} scrollDiv`}>
                            {animations.map((v, i) => {
                                const picUrl = host.font2 +
                                    animateImgs[Math.min(i, animateImgs.length - 1)];
                                return (<div key={v.name} className={styles.singleBox}>
                                    <div className={styles.videoOuter}
                                         onMouseEnter={(e) => this.handleMouseEnter(e, v, i)}
                                         onMouseLeave={this.handleMouseLeave}
                                         onClick={(e) => this.handleClick(e, v, picUrl)}>
                                        <div className={styles.title}>
                                            <img src={picUrl +
                                            '?imageMogr2/auto-orient/strip/thumbnail/124x70'}/>
                                        </div>
                                    </div>
                                </div>);
                            })}
                        </div>
                    </div>
                    <div className={styles.preivewOut} onMouseEnter={this.hoverPreivew}
                         onMouseLeave={this.handleMouseLeave}
                         style={{ pointerEvents: showPreivew ? 'auto' : 'none' }}>
                        <CSSTransition in={showPreivew} timeout={300} classNames='rotate-y-left'>
                            <div className={styles.preivew}>
                                <div className={styles.content}>
                                    <div className={styles.title}
                                         style={{ animation: `${hoverObj.name} ${hoverObj.duration}ms infinite` }}>
                                        <img src={hoverObj.picUrl +
                                        '?imageMogr2/auto-orient/strip/thumbnail/124x70'}/>
                                    </div>
                                </div>
                            </div>
                        </CSSTransition>
                    </div>
                </React.Fragment>
            </ScrollContainer>
        );
    }
}

export default AnimateImg;
