import React from 'react';
import ReactDOM from 'react-dom';
import { message, Tooltip } from 'antd';
import Icon from '../Icon';
import styles from './colorSucker.less';
import { connect } from 'dva';
import { LAYER_TYPE } from '../../../config/staticParams';
import { genUrl } from '../../../util/image';
import Loading from '../loading';
import { isSetTimerEle } from '../../../util/data';

@connect(({ canvas, workspace, timeLine }) => ({
    canvas,
    uuid: workspace && workspace.uuid,
    dataList: workspace && workspace.dataList,
    currentTime: timeLine && timeLine.currentTimes[workspace.uuid] || 0,
}))
class ColorCanvas extends React.PureComponent {
    constructor(props) {
        super(props);
        this.canvas = React.createRef();
        const { element } = props;
        if (!element) {
            message.error('无法初始化吸管，可能当前页面不支持');
            return null;
        }
        const rect = element.getBoundingClientRect();
        // 取画布的缩放值
        this.scale = Number((/scale\((.*)\)/.exec(element.style.transform) || [])[1]) || 1;
        this.state = {
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left,
            showPreview: false,
            suckerPreviewStyle: {},
            hoverColor: [],
        };
    }

    componentDidMount() {
        this.init();
    }

    componentDidUpdate() {

    }

    componentWillUnmount() {
        this.cancelBind();
    }

    init = async () => {
        const { props: { uuid, dispatch, dataList, currentTime: msCurrentTime }, state: { width: outWidth, height: outHeight } } = this;
        const currentTime = msCurrentTime / 1000;
        await dispatch({
            type: 'workspace/drawNow',
        });
        await dispatch({
            type: 'canvas/waitLoading',
            payload: { uuid },
        });
        // 绘图完毕再取画布数据
        const { canvas: { canvasObj } } = this.props;
        this.currentData = canvasObj[uuid];
        // 如果没取到 则递归调用次
        if (!this.currentData) {
            return this.init();
        }
        const ctx = this.canvas.current.getContext('2d', { alpha: false });
        try {
            for (const item of this.currentData) {
                if (!item) {
                    return false;
                }
                const { type, canvas, uuid } = item;
                const values = dataList.find(v => v.uuid === uuid);
                if (!values) {
                    // 说明是有项目被删除了 却还画了 ，重新初始化
                    return this.init();
                }
                const { renderSetting: { startTime = 0, endTime } } = values;
                // 如果不是当前显示的元素
                if (isSetTimerEle(values) && (startTime > currentTime || endTime < currentTime)) {
                    continue;
                }
                if (type !== LAYER_TYPE.img && values.visibility !== 'hidden') { // 视频素材
                    if (canvas) {
                        ctx.drawImage(canvas, 0, 0, outWidth, outHeight);
                    }
                    const { width, height, top, left, rotate, borderWidth = 0, opacity = 1, coverImg } = values;
                    const rectCenterPointX = left + width / 2;
                    const rectCenterPointY = top + height / 2;
                    ctx.save();
                    ctx.translate(rectCenterPointX, rectCenterPointY);
                    ctx.rotate(rotate * Math.PI / 180);
                    ctx.translate(-rectCenterPointX, -rectCenterPointY);
                    ctx.globalAlpha = opacity;
                    const img = document.createElement('img');
                    img.crossOrigin = 'Anonymous';
                    img.src = genUrl(coverImg);
                    await new Promise((resolve) => {
                        img.onload = () => {
                            resolve();
                        };
                    });
                    ctx.drawImage(img, (left + borderWidth) * this.scale,
                        (top + borderWidth) * this.scale,
                        (width - 2 * borderWidth) * this.scale,
                        (height - 2 * borderWidth) * this.scale);
                    ctx.restore();
                    img.onload = null;
                }
                if (type === LAYER_TYPE.img && canvas) {
                    if (currentTime <= endTime && currentTime >= startTime) {
                        ctx.drawImage(canvas, 0, 0, outWidth, outHeight);
                    }
                }
            }
        } catch (e) {
            console.error(e);
            message.error('吸管初始化失败，请重试');
        }
        document.addEventListener('mousemove', this.handlerMouseMove);
        document.addEventListener('mouseup', this.handlerMouseClick);
        message.info('请在中间区域吸取颜色。在其他区域点击或按ESC即可取消');
        this.setState({ showPreview: true });
    };

    handlerMouseMove = (e) => {
        const { pageX, pageY } = e;
        const { top: domTop, left: domLeft, width, height } = this.canvas.current.getBoundingClientRect();
        const x = e.pageX - domLeft;
        const y = e.pageY - domTop;
        const ctx = this.canvas.current.getContext('2d');
        const imgData = ctx.getImageData(x, y, 1, 1);
        let [r = 0, g = 0, b = 0, a = 0] = imgData.data;
        a = parseFloat((a / 255).toFixed(2));
        const newStyle = {
            left: pageX + 20,
            top: pageY - 36,
            background: `rgba(${[r, g, b, a].join(',')})`,
            visibility: a ? 'visible' : 'hidden',
        };
        this.setState({
            suckerPreviewStyle: newStyle,
            hoverColor: [r, g, b, a],
        });
    };

    handlerMouseClick = (e) => {
        const { state: { hoverColor }, props: { onChange, onClose } } = this;
        if (!hoverColor[3]) {
            e.stopPropagation();
            onClose();
            return;
        }
        onChange(e, `rgba(${hoverColor.join(',')})`);
    };

    cancelBind = () => {
        document.removeEventListener('mousemove', this.handlerMouseMove);
        document.removeEventListener('mouseup', this.handlerMouseClick);
    };

    render() {
        if (!this.state) {
            return null;
        }
        const { width, height, left, top, showPreview, suckerPreviewStyle } = this.state;
        const dom = (
            <div id='suckering' className={styles.body}>
                {!showPreview && <Loading title='吸管初始化中'/>}
                <div className={styles.mask} style={{
                    width,
                    height,
                    left,
                    top,
                }}/>
                <canvas ref={this.canvas} width={width} height={height} style={{
                    left,
                    top,
                }}></canvas>
                {showPreview && <div className={styles.suckerPreview} style={suckerPreviewStyle}/>}
            </div>
        );
        return ReactDOM.createPortal(dom, document.body);
    }
}


class ColorSucker extends React.PureComponent {

    state = {
        isActive: false,
    };

    componentWillUnmount() {
        document.removeEventListener('keydown', this.keydownHandler);
    }

    cpDomStyle = {
        left: 0,
        right: 0,
    };
    keydownHandler = (e) => {
        if (e.keyCode === 27) {
            this.handlerClick();
            document.removeEventListener('keydown', this.keydownHandler);
        }
    };
    handlerClick = (e) => {
        const { isActive } = this.state;
        const cpDom = document.querySelector('div[id^="colorPicker"]');
        // 获取选中框
        const activeDom = document.querySelectorAll('div[class*="elementCompBox-"]');
        const uploadIcon = document.querySelectorAll('.eqf-upload') || [];
        if (isActive) {
            this.setState({ isActive: false });
            if (activeDom) {
                // 显示选中框
                Array.from(activeDom)
                    .concat(Array.from(uploadIcon))
                    .forEach((a) => {
                        a.style.visibility = 'unset';
                    });
            }
            // if (cpDom) {
            //     cpDom.style.left = this.cpDomStyle.left;
            //     cpDom.style.right = this.cpDomStyle.right;
            //     this.cpDomStyle = {
            //         left: 0,
            //         right: 0,
            //     };
            // }
        } else {
            this.setState({ isActive: true });
            document.addEventListener('keydown', this.keydownHandler);
            if (activeDom) {
                // 隐藏选中框
                Array.from(activeDom)
                    .concat(Array.from(uploadIcon))
                    .forEach((a) => {
                        a.style.visibility = 'hidden';
                    });
            }
            // if (cpDom) {
            //     this.cpDomStyle = {
            //         left: cpDom.style.left,
            //         right: cpDom.style.right,
            //     };
            //     cpDom.style.left = '20px';
            //     cpDom.style.right = '';
            // }
        }
    };

    onChange = (...arg) => {
        const { onChange } = this.props;
        // this.handlerClick();
        onChange(...arg);
    };

    render() {
        const {
            state: { isActive }, props: {
                className, ele = document.getElementById('workspace'),
            },
            props: { disabled = false },
        } = this;
        return (
            <React.Fragment>
                <Tooltip title={disabled ? '当前页面不支持吸管' : '吸管'} arrowPointAtCenter={true}
                         getPopupContainer={() => document.body}
                >
                    <Icon type='eqf-colorpicker-f'
                          onClick={disabled ? null : this.handlerClick}
                          className={`
                      ${className} ${styles.pen}
                      ${disabled ? styles.disabled : ''}
                       ${isActive ? styles.active : ''}
                       `}
                    />
                </Tooltip>
                {isActive &&
                <ColorCanvas element={ele} onChange={this.onChange} onClose={this.handlerClick}/>}
            </React.Fragment>
        );
    }
}


export default ColorSucker;
