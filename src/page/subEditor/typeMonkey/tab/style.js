import React from 'react';
import styles from './style.less';
import env from 'Config/env';
import Icon from '../../../components/Icon';
import Select from 'Components/input/select';
import fonts from '../../../../dataBase/subtitles_fonts';
import Modal from '../../../components/modal';
import { formatEQXMessage } from '../../../../util/event';
import Cropper from '../../../components/cropper';
import animationType01 from '../../../static/icon/animateStyle01.png';
import animationType04 from '../../../static/icon/animateStyle04.png';
import { connect } from 'dva';
import { COLOR_STYLES } from '../../../../dataBase/typeMonkey';
import { genUrl } from '../../../../util/image';
import { addGlobalStyle } from '../../../../util/doc';

@connect(({ typeMonkey }) => ({ typeMonkey }))
export default class Style extends React.Component {
    constructor(props) {
        super(props);
        this.video = React.createRef();
        this.state = {
            playing: false, // 播放状态
            animationType: 0, // 动画风格
            themColor: 0, // 主题配色
            font: '',
            tab: 1, // 默认选中文本
            modalOpen: false,
            modalProps: {},
            modalContent: '',
            callbackFunction: (...reset) => console.log(reset),
            nowAspectRatio: 1.7777, // 现在操作的图片的原比列 0.5625
            hoz: 'ver',
            nowPicInfo: false,
            fontFamilies: [], // 字体列表
        };
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        const { typeMonkey } = nextProps;
        const newState = {};
        newState.animationType = Number(typeMonkey.animationType);
        newState.themColor = Number(typeMonkey.colorType);
        newState.font = typeMonkey.font;
        newState.hoz = typeMonkey.transverse ? 'hoz' : 'ver';
        return newState;
    }

    componentDidMount() {
    }

    play = () => {
        if (this.state.playing) {
            this.startPause();
        } else {
            this.startPlay();
        }
    };
    startPause = () => {
        this.video.current.pause();
        this.setState({ playing: false });
    };

    startPlay = () => {
        this.video.current.play();
        this.setState({ playing: true });
    };
    onPlay = () => {
        this.setState({ playing: true });
    };
    onPause = () => {
        this.setState({ playing: false });
    };
    choiceAnimationType = (e, data) => {
        this.props.dispatch({
            type: 'typeMonkey/save',
            payload: {
                animationType: data.value,
                animationStyle: null,
            },
        });
    };
    choiceThemColor = (e, data) => {
        this.props.dispatch({
            type: 'typeMonkey/save',
            payload: {
                colorType: data.value,
                animationStyle: null,
            },
        });
    };
    handleChange = (value) => {
        const { typeMonkey: { myFonts = [] }, dispatch } = this.props;
        const oneFont = myFonts.find((item) => item.fontFamily === value);
        if (oneFont) {
            const { fontFamily, woffPath, ttfPath } = oneFont;
            addGlobalStyle(fontFamily, woffPath || ttfPath, true);
        }
        dispatch({
            type: 'typeMonkey/save',
            payload: {
                font: value,
                animationStyle: null,
            },
        });
    };
    deleteImg = () => {
        this.props.dispatch({
            type: 'typeMonkey/save',
            payload: {
                bgImg: null,
                animationStyle: null,
            },
        });
    };
    beforeChangeMetaria = () => {
        this.setState({
            callbackFunction: this.afterChangeMetaria,
        });
        this.onOpen(this.getImgMessage, '/material/image');
    };
    /**
     * 最终改变图片地址
     * @param url
     * @param index
     */
    afterChangeMetaria = (url) => {
        this.props.dispatch({
            type: 'typeMonkey/save',
            payload: {
                bgImg: genUrl(url),
                animationStyle: null,
            },
        });
        this.onClose();
    };
    /**
     * 抓取图片选择的URL地址
     * @param message
     */
    getImgMessage = (message) => {
        const data = formatEQXMessage(message);
        if (data === false) {
            return;
        }
        if (data.type === 'close') {
            this.onClose(true);
        }
        if (data.type === 'success') {
            this.onClose();
            const picUrl = env.host.musicFile + data.data[0].path;
            this.onOpen(() => {
            }, false, <Cropper hoz={this.state.hoz}
                               image={picUrl}
                               limit={this.state.nowPicInfo}
                               onClose={this.onClose}
                               onChange={this.state.callbackFunction}/>);
        }
    };
    /**
     /**
     * 打开的通用方法
     * @param callBack 回调函数
     * @param isFrame 是否frame 是的话直接传入地址会自动拼接
     * @param children 不是frame 的话可以传入子组件
     */
    onOpen = (callBack, isFrame = false, children = '', modalProps = {}) => {
        const content = isFrame ? <iframe
            src={`${env.host.auth}${isFrame}?t=${new Date().getTime()}&source=music&notShowSys=true`}
            scrolling='no' frameBorder='0'
            style={{
                width: 960,
                height: 600,
                display: 'block',
                lineHeight: 0,
                fontSize: 0,
            }}
        /> : children;
        window.addEventListener('message', callBack);
        this.setState({
            modalOpen: true,
            modalProps,
            modalContent: content,
        });
    };
    /**
     * 关闭 modal框,取消监听事件
     */
    onClose = (clearSelect = false) => {
        window.removeEventListener('message', this.getImgMessage);
        this.setState({
            modalOpen: false,
            modalProps: {},
            modalContent: '',
        });
        if (clearSelect) {
            this.setState({
                callbackFunction: null,
                modalIndex: null,
            });
        }
    };

    render() {
        const { state, props: { typeMonkey: { bgImg } } } = this;
        const animateStyle = [
            {
                name: '翻转文字',
                type: 'slow',
                value: 0,
                url: animationType01,
            }, {
                name: '地鼠文字',
                type: 'normal',
                value: 1,
                url: animationType04,
            }];
        const videoColorObject = COLOR_STYLES;
        const newFontsKey = Object.keys(fonts);
        const newFonts = Object.values(fonts);
        const fontFamilies = newFonts.map((item, i) => {
            return {
                title: item.name,
                value: newFontsKey[i],
                style: { fontFamily: newFontsKey[i] },
            };
        });
        const fontFamily = state.font || newFontsKey[1];

        return (
            <div className={styles.wrap}>
                <p className={styles.title}>动画风格</p>
                <div className={styles.animateWrap}>
                    {animateStyle && animateStyle.map((v, i) =>
                        <div className={styles.singleBox} key={i}>
                            <div className={styles.list}
                                 onClick={(e) => this.choiceAnimationType(e, v)}>
                                {state.animationType === i && <div className={styles.yesBox}>
                                    <Icon type='eqf-yes' className={styles.eqfYes}/>
                                </div>}
                                <img src={v.url} width='100' className={styles.img} alt="主题配色"/>
                            </div>
                            <span className={`${state.animationType === i
                                                ? styles.activeAnimate
                                                : ``}`}>{v.name}</span>
                        </div>,
                    )}
                </div>
                <p className={styles.addColor}>主题配色</p>
                <div className={styles.colorWrap}>
                    {videoColorObject && videoColorObject.map((v, i) =>
                        <div key={i}
                             className={styles.list}
                             onClick={(e) => this.choiceThemColor(e, v)}>
                            {state.themColor === i && <div className={styles.yesBox}>
                                <Icon type='eqf-yes' className={styles.eqfYes}/>
                            </div>}
                            <img src={v.url} width='104' className={styles.img} alt="主题配色"/>
                        </div>,
                    )}
                </div>
                <div className={styles.bgWrap}>
                    <span className={styles.bgTitle}>背景图</span>
                    <span onClick={this.beforeChangeMetaria} className={styles.upload}>
                        {bgImg
                         ? '更换图片'
                         : '选择图片'}
                         </span>
                    {bgImg &&
                    <span onClick={this.deleteImg} className={styles.deleteImg}>删除图片</span>}
                </div>
                <div className={styles.fontWrap}>
                    <span className={styles.fontTitle}>字体</span>
                    <div className={styles.font}>
                        <Select placeholder={'请选择字体'}
                                style={{ fontFamily }}
                                options={fontFamilies}
                                value={fontFamily}
                                onChange={this.handleChange}
                                dropdownClassName='selectDropdownClassName'/>
                    </div>
                </div>
                <Modal {...state.modalProps} onCancel={this.onClose}
                       visible={state.modalOpen}>{state.modalContent}</Modal>
            </div>
        );
    }
}
