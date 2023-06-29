import React from 'react';
import styles from './cropper.less';
import Icon from './Icon';
import Button from './Button/index';
import delayLoad from 'Util/delayLoad.js';
import env from 'Config/env';
import yuantu from '../static/storeTop.png';
import { message, Radio } from 'antd';
import imageUtil from 'Util/image';
import { getQiniuToken, uploadQiniuByBase64 } from '../../api/upload';
import ProgressBtn from './Button/progress';
import { toCanvas } from '../../services/dom2img';
import FILTERS from '../../dataBase/filters';
import { genUrl, picUrltoBase64 } from '../../util/image';

const img_url = 'http://test.res.eqh5.com/o_1crovbfa91fh45aa1pic1ujl1o6p9.jpg';


class Page extends React.Component {
    constructor(props) {
        super(props);
        this.image = React.createRef();
        this.cropper = null;
        this.tokenPromise = getQiniuToken();
        this.cropperLoader = Promise.all([
            delayLoad.delayLoadCSS(env.css.cropper),
            delayLoad.delayLoadJS(env.plugin.cropper),
        ]);
        this.state = {
            Index: 1, // 序列号
            classFilter: 'wulvjing',
            image: null,
            aspectRatio: null,
            blob: null,
            uploading: false,
            progress: 0,
            viewMode: 1, // 1在图片范围内部
            cropBoxMovable: true, // cropBoxMovable—是否通过拖拽来移动剪裁框。
            cropBoxResizable: true, // cropBoxResizable—是否通过拖动来调整剪裁框的大小。
            movable: false, // 是否允许可以移动后面的图片 false:不可以移动
            background: false, // background–显示容器的网格背景。（就是后面的马赛克）
            scaleX: 1, // x翻转
            scaleY: 1, // y翻转
            imageBase64: null,
            cutRange: false, // false:图片范围内裁剪; true:不限范围裁剪
            autoCropArea: 0.8, // 0-1之间的数值，定义自动剪裁区域的大小。
            zoomable: false, // false:不允许放大
            strict: false, // 在strict模式中，canvas不能小于容器，剪裁容器不能再canvas之外
            cutPosition: props.cutPosition || {}, // 裁剪位置信息
        };
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        const newState = { ...prevState };
        newState.autoCropArea = 1; // 0-1之间的数值，定义自动剪裁区域的大小。
        if (nextProps.hoz === 'hoz') {
            newState.aspectRatio = 1.77777777778;
        } else if (!nextProps.hoz) { // 自由裁剪
            newState.aspectRatio = null;
        } else {
            newState.aspectRatio = 0.5625;
        }
        if (nextProps.aspectRatio) {
            newState.aspectRatio = nextProps.aspectRatio;
        }
        if (newState.aspectRatio) { // 固定裁剪
            newState.cropBoxMovable = true;
            newState.cropBoxResizable = true;
            newState.movable = false;
            newState.background = true;
        }
        if (nextProps.image && prevState.image !== img_url) {
            newState.image = nextProps.image;
        }
        return newState;
    }


    componentDidMount() {
        // 加载后获取base64图片。避免走插件的重新下载跨域。
        picUrltoBase64(this.props.image)
            .then(imageBase64 => {
                this.setState({ imageBase64 });
            });
    }

    loadCropper = () => {
        const { cutParams = {} } = this.props;
        const { viewMode, aspectRatio, cropBoxMovable, cropBoxResizable, movable, background, autoCropArea, zoomable, strict } = this.state;
        const image = this.image.current;
        this.cropperLoader.then((res) => {
            this.cropper = new Cropper(image, {
                viewMode,
                data: cutParams,
                dragMode: 'move',
                cropBoxMovable,
                cropBoxResizable,
                aspectRatio,
                minContainerWidth: 1, // 设置成0会恢复成默认
                minContainerHeight: 1, // 设置成0会恢复成默认
                checkCrossOrigin: false,
                guides: false,
                center: false,
                background,
                movable,
                highlight: false, // 去掉裁剪框的高光
                zoomable, // 是否允许放大 true:允许放大
                rotatable: true, // 是否允许旋转图像
                toggleDragModeOnDblclick: false,
                zoom: true,
                autoCropArea,
                strict, //在strict模式中，canvas不能小于容器，剪裁容器不能再canvas之外
                crop: () => {
                    if (!this.state.cutRange) { // 图片范围内裁剪
                        this.handleLimit();
                    }
                },
            });
        });
    };
    handleLimit = () => {
        const canvasData = this.cropper.getCanvasData();
        const cropBoxData = this.cropper.getCropBoxData();
        const { rotate, scaleX, scaleY } = this.cropper.getData();
        const rate = canvasData.naturalHeight / canvasData.height;
        const cutPosition = {
            x: (cropBoxData.left - canvasData.left) * rate,
            y: (cropBoxData.top - canvasData.top) * rate,
            width: (cropBoxData.width) * rate,
            height: (cropBoxData.height) * rate,
            rotate,
            scaleY,
            scaleX,
        };
        this.setState({ cutPosition });
    };
    zoomPlus = () => {
        this.cropper.zoom(0.01);
    };
    zoomMinus = () => {
        this.cropper.zoom(-0.01);
    };
    rotateCcw = () => {
        this.cropper.rotate(-90);
    };
    rotateCw = () => {
        this.cropper.rotate(90);
    };
    flipchuizhi = () => {
        if (this.state.scaleX === 1) {
            this.cropper.scaleX(-1);
            this.setState({ scaleX: -1 });
        } else {
            this.cropper.scaleX(1);
            this.setState({ scaleX: 1 });
        }
    };
    flipshuiping = () => {
        if (this.state.scaleY === 1) {
            this.cropper.scaleY(-1);
            this.setState({ scaleY: -1 });
        } else {
            this.cropper.scaleY(1);
            this.setState({ scaleY: 1 });
        }
    };
    reset = () => {
        if (this.cropper) {
            this.cropper.reset();
        }
        this.setState({
            Index: 1,
            classFilter: 'wulvjing',
        });
    };
    handleImgInCut = () => {
        // genUrl(item.coverImg, '','/gravity/Center/crop/224x246/format/jpg')
        const { cutPosition: { x, y, width, height, rotate } } = this.state;
        const { limit,backgroundColor } = this.props;
        const url = String(this.props.image)
            .replace(/&(.*)ver=.+$/, '');
        let thumbnail = false;
        const handlerLimit = (num) => {
            const a = Math.max(0, num);
            if (limit && !thumbnail) {
                thumbnail = `/thumbnail/${limit.width || ''}x${limit.height || ''}>`;
            }
            return a;
        };
        const dot = url.includes('?') ? '|' : '?';
        const newUrl = `${url}${dot}imageMogr2/rotate/${rotate}/crop/!${handlerLimit(width)
            .toFixed(3)}x${handlerLimit(height)
                .toFixed(
                    3)}a${handlerLimit(x)
                        .toFixed(3)}a${handlerLimit(y)
                            .toFixed(3)}${thumbnail || ''}`;
        if (typeof (this.props.onChange) === 'function') {
            this.props.onChange(newUrl, this.state.cutPosition);
        }
        this.props.onClose();
    };
    onUpload = () => {
        const {
            state: { cutRange, uploading, classFilter, cutPosition: { scaleX, scaleY, width, height } },
            props: { limit = false, backgroundColor, },
        } = this;
        const image = this.image.current;
        if(!image){
            message.warning('图片还未加载完毕，请稍后');
            return false;
        }
        const imageType = new RegExp('data:image/(.+);').exec(image.src)[1] || 'png';
        const limitOverflow = limit &&
            (limit.width > 9999 || limit.height > 9999 || (limit.width * limit.height > 24999999));
        if (!cutRange&& !backgroundColor && (!classFilter || classFilter === FILTERS.wulvjing.class) && scaleX > 0 &&
            scaleY > 0 && !['gif'].includes(imageType) && !imageType.includes('svg') && width < 10000 &&
            height < 10000 && !limitOverflow) {
            console.log('快速裁剪');
            this.handleImgInCut();
            return;
        }
        if (this.cropper === null) {
            message.error('请等待图片加载完毕...');
            return;
        }
        if (uploading) return false;
        this.setState({ uploading: true });
        // 设置填充颜色
        const options = {
            fillColor: backgroundColor || (['png', 'gif', 'svg', 'svg+xml'].includes(imageType) ? 'transparent' : '#ffffff'),
        };
        let canvas = this.cropper.getCroppedCanvas(options);
        // 宽高限制
        if (limit && (limit.width < canvas.width || limit.height < canvas.height)) {
            console.log('图片过大需要缩放');
            const { width, height } = limit;
            const newCanvas = document.createElement('canvas');
            newCanvas.width = width;
            newCanvas.height = height;
            const ctx = newCanvas.getContext('2d');
            ctx.drawImage(canvas, 0, 0, width, height);
            canvas = newCanvas;
        }
        // 设置滤镜
        // canvas.style.filter = 'contrast(110%) brightness(110%) sepia(30%) grayscale(100%)';
        canvas.style.zIndex = 0;
        canvas.className = classFilter;
        document.body.append(canvas);
        toCanvas(canvas, {
            bgcolor: 'transparent',
            skipFonts: true,
        })
            .then((resCanvas) => {
                canvas.remove();
                return resCanvas.toDataURL(`image/${imageType}`, 1);
            })
            .then((base64) => {
                this.tokenPromise.then(res => {
                    const { data } = res;
                    if (data.success) {
                        const token = data.obj;
                        uploadQiniuByBase64(base64, token, this.onProgress)
                            .then(
                                res => {
                                    const { data } = res;
                                    if (data.key && typeof (this.props.onChange) === 'function') {
                                        this.props.onChange(data.key, this.state.cutPosition);
                                    }
                                    this.props.onClose();
                                },
                            );
                    }
                });
            });
    };
    onProgress = (p) => {
        const progress = (p.loaded / p.total * 100 | 0);
        this.setState({
            progress: progress,
        });
    };
    clickSingle = (e, v) => {
        this.setState({
            Index: v.id,
            classFilter: v.class,
        });
    };

    onChangeCutRange = (e) => {
        this.setState({
            cutRange: e.target.value,
            viewMode: e.target.value ? 0 : 1,
            zoomable: e.target.value, // 图片可缩放
        }, () => {
            if (this.state.cutRange) {
                this.reset();
                this.cropper.destroy();
                this.loadCropper();
            } else {
                this.reset();
                this.cropper.destroy();
                this.loadCropper();
            }
        });
    };

    render() {
        const { state: { imageBase64, ...state }, props } = this;
        return (
            <div className={styles.body} onClick={this.dontClose}>
                <div className={styles.left}>
                    <div className={styles.head}>图片裁剪</div>
                    <div className={`${styles.main} ${!state.cutRange ? 'cutRange' : ''}
                    ${state.classFilter} ${state.aspectRatio ? 'aspectRatio' : ''}`}>
                        {imageBase64 &&
                            <img id='cutImg' width={300} onLoad={this.loadCropper} src={imageBase64}
                                ref={this.image} />}
                    </div>
                    <div className={styles.foot}>
                        {state.cutRange && <React.Fragment>
                            <Icon onClick={this.zoomPlus} type='eqf-plus-l'
                                className={styles.eqf_icon} />
                            <Icon onClick={this.zoomMinus} type='eqf-minus-l'
                                className={styles.eqf_icon} />
                        </React.Fragment>}
                        <Icon onClick={this.rotateCcw} type='eqf-rotate-ccw'
                            className={styles.eqf_icon} />
                        <Icon onClick={this.rotateCw} type='eqf-rotate-cw'
                            className={styles.eqf_icon} />
                        <Icon onClick={this.flipshuiping} type='eqf-flipchuizhi'
                            className={styles.eqf_icon} />
                        <Icon onClick={this.flipchuizhi} type='eqf-flipshuiping'
                            className={styles.eqf_icon} />
                    </div>
                </div>
                <div className={styles.right}>
                    <div className={styles.close} onClick={props.onClose}>×</div>
                    {state.aspectRatio &&
                        <React.Fragment>
                            <p className={styles.cutTitle}>裁剪范围</p>
                            <div className={styles.cutRangeWrap}>
                                <Radio.Group onChange={this.onChangeCutRange}
                                    value={this.state.cutRange}>
                                    <div><Radio value={false}>图片范围内</Radio></div>
                                    <div><Radio value={true}>不限制范围</Radio></div>
                                </Radio.Group>
                            </div>
                        </React.Fragment>
                    }
                    <div className={styles.filter}>滤镜</div>
                    <div className={styles.contain}
                        style={{ height: state.aspectRatio ? '349px' : '441px' }}>
                        {
                            Object.values(FILTERS)
                                .map((item, index) =>
                                    <div key={index}
                                        className={`${styles.single} ${state.Index === item.id &&
                                            state.classFilter ===
                                            item.class
                                            ? styles.singleActive
                                            : ''}`}
                                        onClick={(e) => this.clickSingle(e, item)}>
                                        <div style={{
                                            backgroundImage: ` url(${imageUtil.genUrl(
                                                props.image)}`,
                                        }}
                                            className={`${styles.singlePic} ${item.class}`} />
                                        <div className={styles.singleName}>{item.name}</div>
                                    </div>,
                                )
                        }
                    </div>
                    <div className={styles.btn}>
                        <Button lite={1} onClick={this.reset} className={styles.reset}>重置</Button>
                        <Button lite={1} onClick={props.onClose}
                            className={styles.cancal}>取消</Button>
                        <div className={styles.sure}>
                            <ProgressBtn onClick={this.onUpload} progress={state.progress} style={{
                                cursor: state.uploading
                                    ? 'not-allowed'
                                    : 'pointer',
                            }}>{state.uploading ? '裁剪中' : '确定'}</ProgressBtn>
                        </div>
                    </div>
                </div>
            </div>);
    }
}

export default Page;
