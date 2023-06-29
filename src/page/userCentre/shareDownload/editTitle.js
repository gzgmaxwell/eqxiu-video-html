import React from 'react';
import qs from 'qs';
import styles from './editTitle.less';
import Icon from '../../components/Icon';
import img from '../../static/quanyioading.gif';
import Button from '../../components/Button';
import { POS_FROM } from '../../../config/staticParams/goodsParams';
import { waitChoseModel } from '../../components/delete';
import { EDITOR_PRODUCT, RENDER_STATUS, XIU_DIAN } from '../../../config/staticParams';
import { host, prev } from 'Config/env';
import {
    benefitSign,
    cancelRender,
    coverImgApi, updateCoverImage,
    updateTitleDescribe,
} from '../../../api/userVideo';
import { Message, Tooltip, message, Popover } from 'antd';
import { routerRedux } from 'dva/router';
import { connect } from 'dva';
import { genUrl } from '../../../util/image';
import { getURLObj } from '../../../util/util';
import { setUserSetting, getUserSetting } from '../../../util/storageLocal.js';
import Modal from '../../components/modal';
import Cover from '../../components/cover';
import eventEmitter from '../../../services/EventListener';
import { sendBDEvent } from '../../../services/bigDataService';


/**
 * 验证是否在渲染中的通用方法
 * @param type
 * @returns {boolean}
 */
const vaildIsRendering = (type) => {
    return type === 1 || type === 2;
};

@connect()
class EditTitle extends React.PureComponent {
    constructor(props) {
        super(props);
        this.inputTitle = React.createRef();
        this.textareaDesc = React.createRef();
        this.titleLength = 24; // 文本一航显示多少字
        this.descLength = 50; // 文本一航显示多少字
        this.state = {
            title: '',
            desc: '',
            titleActive: false, // 修改标题状态
            descActive: false, // 修改描述状态
            lockTitle: false,
            lockDesc: false,
            visible: false,
            visiblePop: false,
        };
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        const newState = {};
        if (!prevState.titleActive) {
            newState.title = nextProps.title;
        }
        if (!prevState.descActive) {
            newState.desc = nextProps.videoDescribe;
        }
        return newState;
    }

    componentDidMount() {
        const titleDom = this.inputTitle.current;
        const descDom = this.textareaDesc.current;
        if (titleDom) {
            titleDom.addEventListener('compositionstart',
                () => { this.setState({ lockTitle: true }); });
            titleDom.addEventListener('compositionend', (e) => {
                this.handleTitle();
                this.setState({ lockTitle: false });
            });
        }
        if (descDom) {
            descDom.addEventListener('compositionstart',
                () => { this.setState({ lockDesc: true }); });
            descDom.addEventListener('compositionend', (e) => {
                this.handleDesc();
                this.setState({ lockDesc: false });
            });
        }
        if (!getUserSetting('shareDownloadPop')) {
            setTimeout(() => {
                this.setState({
                    visiblePop: true
                }, () => {
                    setUserSetting('shareDownloadPop', true);
                });
            }, 300);
        }
        eventEmitter.on('changeCoverImg', this.changeCoverImg);
    }

    componentWillUnmount() {
        eventEmitter.removeListener('changeCoverImg', this.changeCoverImg);
    }

    handleTitle = () => {
        const newText = this.inputTitle.current.value;
        if (newText > this.titleLength) {
            this.setState({ title: newText.splice(0, this.titleLength) });
        }
    };
    handleDesc = () => {
        const newDesc = this.textareaDesc.current.value;
        if (newDesc > this.titleLength) {
            this.setState({ desc: newDesc.splice(0, this.descLength) });
        }
    };

    editTitle = () => {
        this.setState({ titleActive: true });
    };
    titleBlur = async () => {
        const { props: { videoId }, state } = this;
        this.setState({ titleActive: false });
        const params = {
            videoId,
            title: state.title,
        };
        if (!params.title) {
            return;
        }
        const { data: { success, obj } } = await updateTitleDescribe(params);
        if (success) {
            Message.success('修改成功');
            this.props.onLoadDetail();
        } else {
            // Message.error(obj);
        }
        ;
    };
    // 改变描述
    onChangeTitle = (e) => {
        const val = e.target.value;
        /* const count = e.target.value.length || 0;
         const sub = 24;
         if (count >= sub) {
             val = val.substring(0, sub);
         }*/
        this.setState({
            title: val,
        });
    };
    editDesc = () => {
        this.setState({ descActive: true });
    };
    descBlur = async () => {
        const { props: { videoId }, state } = this;
        this.setState({ descActive: false });
        const params = {
            videoId,
            describe: state.desc,
        };
        if (!params.describe) {
            return;
        }
        const { data: { success, obj } } = await updateTitleDescribe(params);
        if (success) {
            Message.success('修改成功');
            this.props.onLoadDetail();
        } else {
            // Message.error(obj);
        }
    };
    // 改变描述
    onChangeDesc = (e) => {
        let val = e.target.value;
        /*const count = e.target.value.length || 0;
        const sub = 50;
        if (count >= sub) {
            val = val.substring(0, sub);
        }*/
        this.setState({
            desc: val,
        });
    };
    edit = (e) => {
        // positionFrom  WorkSpace:来自我的作品 ; editorSpace 编辑器
        const { props: { positionFrom = 'workSpace', product } } = this;
        // if (product === EDITOR_PRODUCT.selfieVideo) {
        //     message.error('APP模板实拍暂不支持编辑');
        //     return false;
        // }
        if (positionFrom === POS_FROM.workSpace) { // 在工作台
            const data = true;
            this.props.onClose(e, data);
            this.redirectEdit();
        } else if (positionFrom === POS_FROM.editorSpace) {
            this.props.onClose();
        }
    };
    /**
     * 重定向到编辑页
     * @returns {boolean}
     */
    redirectEdit = async () => {
        const { props: { product, videoId, templateId, platform } } = this;
        if (vaildIsRendering(this.state.hdstatus)) {
            Message.error('高清渲染中无法继续编辑...');
            return false;
        }
        const isPhone = ~~platform !== 1;
        if (isPhone) {
            const s = await waitChoseModel({
                text: `手机作品一旦编辑，就会转为电脑作品。\n
                    电脑作品暂不支持在手机端编辑，请谨慎操作。`,
                sureBtn: '继续',
            })
                .catch();
        }
        let url = `${prev}/editor/${templateId}/${videoId}`;
        switch (product) {
            case EDITOR_PRODUCT.subtitles:
                url = `${prev}/subEditor/subtitles/0/${videoId}`;
                break;
            case EDITOR_PRODUCT.headTail:
                url = `${prev}/HTEditor/${templateId}/${videoId}`;
                break;
            case EDITOR_PRODUCT.flash: {
                url = `${prev}/subEditor/flash/${templateId}/${videoId}`;
                break;
            }
            case EDITOR_PRODUCT.typeMonkey: {
                url = `${prev}/subEditor/typeMonkey/${templateId || 1}/${videoId}`;
                break;
            }
            default:
                break;
        }
        window.open(url);
    };
    myWork = () => {
        const { props: { positionFrom = 'workSpace' } } = this;
        if (positionFrom === POS_FROM.workSpace) { // 在工作台
            this.props.onClose();
        } else if (positionFrom === POS_FROM.editorSpace) {
            this.props.dispatch(routerRedux.push(`${prev}/scene`));
        }
    };
    openCoverImg = () => {
        const { isChangeCoverImg, coverImageUpdating, isRenderingSomeone, isShareTypeRenderFail } = this.props;
        if (coverImageUpdating) { // 封面正在渲染中禁止修改封面
            return;
        }
        if (isRenderingSomeone) { // 视频正在渲染中禁止修改封面
            return;
        }
        if (isShareTypeRenderFail) { // 默认中渲染失败禁止点击修改封面
            return;
        }
        if (isChangeCoverImg) {
            this.setState({ visible: true });
        }
        sendBDEvent({
            position: '视频预览-更换封面',
            type: '点击更换按钮',
        });
        eventEmitter.emit('showModal');
    };

    closeCoverImg = () => {
        this.setState({ visible: false });
    };
    changeCoverImg = async (url) => {
        const { props: { videoId } } = this;
        const { data: { success } } = await updateCoverImage(url, videoId);
        if (success) {
            this.props.onLoadDetail();
        }
    };

    hangeClosePop = () => {
        setUserSetting('shareDownloadPop', true);
        this.setState({
            visiblePop: false,
        });
    }

    render() {
        const { state, props, props: { platform, positionFrom, isRenderingSomeone, coverImageUpdating, isShareTypeRenderFail } } = this;
        const isPhone = ~~platform !== 1;
        const tip = '取消当前生成中的视频，并进入到编辑器';
        const resultTip = false ? '完成制作后，您可以点击该按钮进入我的作品页' : '生成中的视频将不会取消，直接进入我的作品页';
        let tip2 = null;
        if (positionFrom === 'editorSpace') {
            tip2 = resultTip;
        }
        const isShowMyWorkBtn = !getURLObj(window.location.href).openFrom;
        const isEditorSpace = positionFrom === POS_FROM.editorSpace;
        const popoverContent = (
            <div>
                <p>完成制作后，你可以点击该按钮<br />进入「我的作品」页</p>
                <div style={{ textAlign: 'right', marginTop: '22px' }}>
                    <Button onClick={this.hangeClosePop} className={styles.popBtn}>我知道了</Button>
                </div>
            </div>
        );
        return (
            <div className={styles.editor}>
                <div className={styles.coverImg}>
                    <div className={styles.wrap}>
                        <img className={styles.img}
                            src={genUrl(props.coverImg, '120:120')} />
                    </div>
                    {!coverImageUpdating && <Button className={`${(isRenderingSomeone || isShareTypeRenderFail) ? styles.btnDisabled : ''}`} onClick={this.openCoverImg} lite={1}>更换封面</Button>}
                    {coverImageUpdating && <Button className={styles.btnDisabled} lite={1}> 封面更新中 </Button>}
                </div>
                <div className={styles.right}>
                    <div className={styles.titleBox}>
                        {!state.titleActive && <React.Fragment>
                            <span className={styles.title}
                                onClick={this.editTitle}>{props.title}</span>
                            <Icon onClick={this.editTitle} type='eqf-pen-l'
                                className={styles.eqf_pen} />
                        </React.Fragment>
                        }
                        {state.titleActive && <React.Fragment>
                            <input onChange={this.onChangeTitle}
                                onBlur={this.titleBlur}
                                className={styles.titleInput}
                                placeholder={state.title}
                                maxLength={24}
                                value={state.title}
                                autoFocus={true}
                                ref={this.inputTitle}
                                type="text" />
                            <span className={styles.limitTitle}>{state.title.length || 0}/24</span>
                        </React.Fragment>
                        }
                    </div>
                    <div className={styles.DescBox}>
                        {!state.descActive && <React.Fragment>
                            <span className={styles.title}
                                onClick={this.editDesc}>{props.videoDescribe}</span>
                            <Icon onClick={this.editDesc} type='eqf-pen-l'
                                className={styles.eqf_pen} />
                        </React.Fragment>
                        }
                        {state.descActive && <React.Fragment>
                            <textarea onChange={this.onChangeDesc}
                                cols={2}
                                onBlur={this.descBlur}
                                className={styles.textareaInput}
                                placeholder={state.videoDescribe}
                                autoFocus={true}
                                ref={this.textareaDesc}
                                maxLength={50}
                                value={state.desc} />
                            <span className={styles.limitTitle}>{state.desc.length || 0}/50</span>
                        </React.Fragment>
                        }
                    </div>
                    <div className={styles.btnWrap}>
                        <Tooltip arrowPointAtCenter={true}
                            title={isPhone ? '手机作品' : tip}>
                            <Button onClick={this.edit}
                                lite={1}
                                className={`${styles.edit} ${styles.btnEdit}`}>继续编辑</Button>
                        </Tooltip>
                        {isShowMyWorkBtn &&
                            <Popover
                                content={popoverContent}
                                placement="right"
                                autoAdjustOverflow={false}
                                overlayClassName={styles.popContainer}
                                overlayStyle={{
                                    animationPlayState: state.visiblePop && props.navActive && isEditorSpace ? 'running' : 'paused',
                                    display: state.visiblePop && props.navActive && isEditorSpace ? 'block' : 'none'
                                }}
                                visible={true}
                            >
                                <Tooltip title={tip2}>
                                    {!isEditorSpace && <div className={styles.mineWork}
                                        onClick={this.myWork}>我的作品&gt;&gt;</div>}
                                    {
                                        isEditorSpace &&
                                        <Button
                                            onClick={this.myWork}
                                            style={{ marginLeft: '8px' }}
                                            lite={1} className={styles.edit}
                                        >完成制作</Button>
                                    }
                                </Tooltip>
                            </Popover>
                        }

                    </div>
                </div>
                <Modal visible={state.visible}>
                    <Cover url={props.url}
                        img={props.coverImg}
                        transverse={props.transverse}
                        videoId={props.videoId}
                        onClose={this.closeCoverImg} />
                </Modal>
            </div>
        );
    }
}


export default EditTitle;
