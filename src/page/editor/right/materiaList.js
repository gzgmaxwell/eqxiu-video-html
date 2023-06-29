import styles from '../../simpleEditor/right.less';
import logo_info_worry from '../../static/logo_info_worry.png';
import logo_info_right from '../../static/logo_info_right.png';
import React from 'react';
import { connect } from 'dva';
import { getMaterial } from '../../../api/templateShow';
import Modal from '../../components/modal';
import Button from '../../components/Button/index';
import Icon from '../../components/Icon';
import Cropper from '../../components/cropper';
import { genUrl } from '../../../util/image';
import env from '../../../config/env';
import { formatEQXMessage } from '../../../util/event';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import { message } from 'antd';
import { dbLength, dbSubString } from '../../../util/util';
import LegalCopyVideoSet from './video/legalCopy';
import Textarea from '../../components/input/textarea';

const lodash = {
    cloneDeep,
    isEqual,
};

const ShadeDiv = () => {
    return <div className={styles.shade}/>;
};

function LogoInfoDiv() {
    return (
        <div className={styles.logoInfoBody}>
            <div className={styles.info}>为保证logo图片替换后的视频质量，请使用背景透明的png图片进行替换。
            </div>
            <div>
                <div className={styles.logoInfoLeft}>
                    <img width={188} height={335} src={logo_info_worry}/>
                    <span><Icon type='eqf-no-f'
                                style={{ color: '#ff296a' }}/>&nbsp;错误展示效果</span>
                </div>
                <div className={styles.logoInfoRight}>
                    <img width={188} height={335} src={logo_info_right}/>
                    <span><Icon type='eqf-yes-f'
                                style={{ color: '#1BC7B1' }}/>&nbsp;正确展示效果</span>
                </div>
            </div>
        </div>
    );
};


/**
 * 单个素材渲染
 */
class MateriaDiv extends React.Component {
    constructor(props) {
        super(props);
        this.text = React.createRef();
        this.state = {
            replaceContent: props.replaceContent,
        };
    }

    componentDidMount() {

    }

    componentWillUnmount() {
    }


    onImgload = (e) => {
        const { index, onImgLoad } = this.props;
        const img = e.target;
        const aspectRatio = img.width / img.height;
        onImgLoad(aspectRatio, index);
    };

    onChange = (replaceContent) => {
        const { videoTemplateMaterialId, onChangeText, maxLength, uuid, materialType } = this.props;

        onChangeText(replaceContent, videoTemplateMaterialId, maxLength, uuid);

        // this.setState({ replaceContent });
    };

    handleBlur = (e) => {
        const { videoTemplateMaterialId, onChangeText, maxLength, uuid, materialType } = this.props;
        if (~~materialType !== 1) return;
        const { target: { value: replaceContent } } = e;
        let rContent = replaceContent;
        const length = dbLength(rContent);
        if (maxLength && length > (2 * maxLength)) {
            message.warning(`最多输入${maxLength}个字符，超出部分会自动截取`);
            rContent = dbSubString(rContent, 2 * maxLength);
        }

        onChangeText(rContent, videoTemplateMaterialId, maxLength, uuid);
        this.flag = false;
    };

    render() {
        const {
            replaceable, materialType, id, index, openLogoInfo, spec = null, content,
            beforeChangeMetaria, fileName, replaceIndex, maxLength: dbMaxLength, replaceContent: pReplaceContent, ossUrl,
        } = this.props;
        const { replaceContent } = this.state;
        const maxLength = dbMaxLength;
        if (replaceable === false) {
            return false;
        }
        const isSame = materialType === 1 ? pReplaceContent === content : pReplaceContent === ossUrl;
        let typeName = '';
        let child = '';
        switch (materialType) {
            case 1:
                typeName = '文本';
                child = <Textarea value={pReplaceContent}
                                  onChange={this.onChange}
                                  onBlur={this.handleBlur}
                                  maxLength={maxLength}/>;
                break;
            case 2:
                if (/LOGO\.png/i.test(fileName)) {
                    typeName = <React.Fragment>LOGO&nbsp;
                        <Icon type='eqf-why-f' style={{ cursor: 'pointer' }}
                              onClick={openLogoInfo}/>
                    </React.Fragment>;
                } else {
                    typeName = '图片';
                }
                const imgSize = spec ? spec.split('x') : null;
                const suggestSize = imgSize ? `建议：${imgSize[0]}*${imgSize[1]}` : null;
                child = <React.Fragment>
                    <span className={`${styles.typeSpan}`}>{typeName}</span>
                    {
                        suggestSize && <span className={styles.info}>
                         {suggestSize}
                         </span>
                    }
                    <div className={styles.mtldiv}>
                        <div className={styles.imgDiv}
                             onClick={() => beforeChangeMetaria(index)}
                        >
                            {replaceIndex === index && <ShadeDiv/>}
                            <img
                                src={genUrl(pReplaceContent, '227::png')}
                                onLoad={this.onImgload}
                            />
                            <div className={styles.insteadPic}>更换图片</div>
                        </div>
                    </div>
                </React.Fragment>;
                break;
            default:
                return null;
        }

        return <div className={styles.materialDiv}>
            {child}
            {!isSame && <span className={styles.imgTipInfo}>预览整个视频时生效</span>}
        </div>;
    }
}

/**
 * 编辑器右边的组件   改变图片的顺序为   before||on =>    open => message => cropper => after
 *                                  配置参数和index   打开模态框 监听       裁剪       保存
 */
@connect(({ workspace, editor }) => ({
    workspace,
    editor,
}))
class MateriaList extends React.Component {
    constructor(props) {
        super(props);
        // this.iframe = React.createRef();
        this.voice = React.createRef();
        this.bgm = React.createRef();
        if (props.onRef) {
            props.onRef(this);
        }
    }

    state = {
        templateId: null,
        hoz: 'hoz',
        materialList: [],
        oriMaterialList: [],
        modalOpen: false,
        modalProps: {},
        modalContent: '',
        modalIndex: null,
        nowAspectRatio: 1.7777,// 现在操作的图片的原比列
        nowPicInfo: false,
        aspectRatioList: [],
        callbackFunction: (...reset) => console.log(reset),
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        const newState = {};
        const { workspace: { dataList = [], activeIndex } = {}, editor } = nextProps;
        const modelData = dataList[activeIndex];
        if (!modelData) return newState;
        const { materialList, templateId } = modelData;
        newState.hoz = editor.transverse ? 'hoz' : 'vet';
        newState.materialList = lodash.cloneDeep(materialList) || [];
        newState.templateId = templateId;
        newState.saving = false;
        return newState;
    }

    componentDidMount() {
        this.getOriValue();
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (!lodash.isEqual(this.state, nextState)) {
            return true;
        }
        if (!this.props.workspace) return false;
        if (this.props.workspace.activeIndex !== nextProps.workspace.activeIndex) {
            return true;
        }
        const { workspace: { dataList, activeIndex } } = this.props;
        const { workspace: { dataList: nextDataList } } = nextProps;
        const prev = dataList[activeIndex];
        const next = nextDataList[activeIndex] || {};
        const materialList = next.materialList || [];
        if (prev && prev.materialList && (prev.materialList.length !== materialList.length)) {
            return true;
        }
        return false;
    }

    componentDidUpdate(prevProps, prevState) {
        const { templateId, oriMaterialList } = this.state;
        if (oriMaterialList.length < 1 && templateId) {
            this.getOriValue();
        }

    }


    componentWillUnmount() {
        // this.props.event.removeListener('saveError', this.changeTab);
    }

    /**
     * 图片加载完毕需要改变state的 比例用以调用裁剪
     * @param aspectRatio
     * @param index
     */
    onImgLoad = (aspectRatio, index) => {
        const { state: { aspectRatioList, modalIndex } } = this;
        aspectRatioList[index] = aspectRatio;
        if (modalIndex === index) {
            this.setState({ modalIndex: null });
        }
        this.setState({ aspectRatioList });
    };
    onChangeText = (replaceContent, videoTemplateMaterialId, maxLength, uuid) => {
        let _index = null;
        const { state: { materialList: oldMaterial }, props: { workspace: { dataList } } } = this;
        let materialList = oldMaterial;
        const data = dataList.find((v, i) => {
            if (v.uuid === uuid) {
                _index = i;
                return true;
            } else {
                return false;
            }
        });
        if (_index === null) return;
        if (_index !== undefined && data) {
            materialList = lodash.cloneDeep(data.materialList);
        }
        const rContent = String(replaceContent);
        const oneData = materialList.find(
            v => v.videoTemplateMaterialId === videoTemplateMaterialId);
        if (!oneData) return;
        materialList.find(
            v => v.videoTemplateMaterialId === videoTemplateMaterialId).replaceContent = rContent;
        this.props.dispatch({
            type: 'workspace/changeNow',
            payload: {
                materialList,
                refresh: false,
                _index,
            },
        });
    };
    /**
     * 最终改变图片地址
     * @param url
     * @param index
     */
    afterChangeMetaria = (url, index) => {
        const { materialList, modalIndex, aspectRatioList } = this.state;
        const fIndex = index || modalIndex || this.selectIndex;
        const oldUrl = materialList[fIndex].replaceContent;
        const newUrl = genUrl(url);
        if (oldUrl === newUrl) {
            this.onImgLoad(aspectRatioList[fIndex], fIndex);
            this.selectIndex = null;
            return;
        }
        materialList[fIndex].replaceContent = newUrl;
        this.props.dispatch({
            type: 'workspace/changeNow',
            payload: {
                materialList,
                refresh: false,
            },
        });
        this.selectIndex = null;
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
            }, false, <Cropper
                hoz={this.state.hoz}
                aspectRatio={this.state.nowAspectRatio}
                image={picUrl}
                limit={this.state.nowPicInfo}
                onClose={this.onClose}
                onChange={this.state.callbackFunction}/>);
        }
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
    /**
     * 打开的通用方法
     * @param callBack 回调函数
     * @param isFrame 是否frame 是的话直接传入地址会自动拼接
     * @param children 不是frame 的话可以传入子组件
     */
    onOpen = (callBack, isFrame = false, children = '', modalProps = {}) => {
        const content = isFrame ? <iframe
            src={`${env.host.auth}${isFrame}?t=${new Date().getTime()}&source=music&notShowSys=true`}
            scrolling="no" frameBorder="0"
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
     * 改变素材的图片
     * @param index
     */
    beforeChangeMetaria = (index) => {
        const { spec = false } = this.state.materialList[index];
        let aspectRatio = this.state.aspectRatioList[index]; // 这个是图片的比例
        let nowPicInfo = false;
        if (spec) { // 后端传给我的比例
            const spaceArray = spec.split('x');
            if (spaceArray[0] && spaceArray[1]) {
                nowPicInfo = {
                    width: spaceArray[0],
                    height: spaceArray[1],
                };
                aspectRatio = spaceArray[0] / spaceArray[1];
            }
        }
        this.setState({
            modalIndex: index,
            nowAspectRatio: aspectRatio,
            callbackFunction: (newUrl) => this.afterChangeMetaria(newUrl, index),
            nowPicInfo,
        });
        this.selectIndex = index;
        this.onOpen(this.getImgMessage, '/material/image');
    };
    getOriValue = () => {
        if (!this.state.templateId) return;
        getMaterial(this.state.templateId, true)
            .then(res => {
                if (res.data.success) {
                    const oriMaterialList = res.data.list.map((item, index) => ({
                        ...item,
                        id: this.state.materialList[index].id,
                        videoTemplateMaterialId: item.id,
                        materialType: item.type,
                        replaceContent: item.type === 1 ? item.content : item.ossUrl,
                    }));
                    this.setState({
                        oriMaterialList: oriMaterialList,
                    });
                }
            });
    };
    /**
     * 打开LOGO提示
     */
    openLogoInfo = () => {
        this.onOpen(() => {
        }, false, <LogoInfoDiv onClose={this.onClose}/>, { header: 'LOGO上传提示' });
    };
    /**
     * 重置
     * @param type
     */
    onRest = (type = 0) => {
        // 发送获取素材的请求
        getMaterial(this.state.templateId, true)
            .then(res => {
                if (res.data.success) {
                    const oriMaterialList = res.data.list.map((item, index) => ({
                        ...item,
                        id: this.state.materialList[index].id,
                        videoTemplateMaterialId: item.id,
                        materialType: item.type,
                        replaceContent: item.type === 1
                            ? item.content
                            : item.ossUrl,
                    }));
                    if (type === 0) {
                        this.props.dispatch({
                            type: 'workspace/changeNow',
                            payload: {
                                materialList: oriMaterialList,
                                refresh: false,
                            },
                        });
                        this.setState({
                            materialList: oriMaterialList,
                        });
                    } else {
                        const newArray = this.state.materialList.map(
                            (item, index) => {
                                if (item.materialType === type &&
                                    oriMaterialList[index]) {
                                    return oriMaterialList[index];
                                } else {
                                    return item;
                                }
                            });
                        this.props.dispatch({
                            type: 'workspace/changeNow',
                            payload: {
                                materialList: newArray,
                                refresh: false,
                            },
                        });
                    }
                }
            });
    };

    render() {
        const { props: { onlyList = false, workspace: { activeIndex = null, dataList = [] } = {} }, state } = this;
        const commondProps = {
            close: this.onClose,
            open: this.onOpen,
            setState: this.setState,
        };
        const model = dataList[activeIndex] || { uuid: null };
        let hasImg = false;
        let hasText = false;
        let textChanged = false;
        let imgChanged = false;
        const listComp = (state.materialList && state.materialList.length > 0
            ? <React.Fragment>
                {state.materialList
                    .sort((a, b) => {
                        if (a.sort !== undefined) {
                            return a.sort - b.sort;
                        } else {
                            return a.id - b.id;
                        }
                    })
                    .map(
                        (item, index) => {
                            const ori = state.oriMaterialList.find(
                                oriItem => oriItem.videoTemplateMaterialId ===
                                    item.videoTemplateMaterialId) || {};
                            if (ori.type === 1) {
                                textChanged = (ori.replaceContent !==
                                    item.replaceContent) || textChanged;
                            } else {
                                imgChanged = (ori.replaceContent !==
                                    item.replaceContent) || imgChanged;
                            }
                            hasText = item.type === 1 || hasText;
                            hasImg = item.type === 2 || hasImg;
                            return <MateriaDiv
                                {...item}
                                key={`${item.videoTemplateMaterialId}-${item.id}`}
                                uuid={model.uuid}
                                onChangeText={this.onChangeText}
                                activeIndex={activeIndex}
                                onImgLoad={this.onImgLoad}
                                openLogoInfo={this.openLogoInfo}
                                beforeChangeMetaria={this.beforeChangeMetaria}
                                replaceIndex={state.modalIndex}
                                index={index}/>;
                        })}
                <Modal {...state.modalProps} onCancel={this.onClose}
                       visible={state.modalOpen}>{state.modalContent}</Modal>
            </React.Fragment>
            :
            <LegalCopyVideoSet/>);
        if (onlyList) {
            return listComp;
        }
        return (
            <React.Fragment>
                <div className={styles.buttons}>
                    {hasText && hasImg &&
                    <Button className={textChanged || imgChanged ? '' : styles.disabled}
                            onClick={() => this.onRest()}>恢复全部</Button>}
                    {hasText && <Button className={textChanged ? '' : styles.disabled}
                                        onClick={() => this.onRest(1)}>恢复文字</Button>}
                    {hasImg && <Button className={imgChanged ? '' : styles.disabled}
                                       onClick={() => this.onRest(2)}>恢复图片</Button>}
                </div>
                {/* {state.materialList.length > 0 && <div style={{
                    width: 200,
                    height: 44,
                }}/>} */}
                <div style={{
                    height: '100vh',
                    overflowY: 'auto',
                }}>
                    <div style={{ paddingBottom: 300 }} id='materialDivForNoob'>
                        {listComp}
                    </div>
                </div>
            </React.Fragment>
        );
    }
}

export default MateriaList;
