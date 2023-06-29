import React from 'react';
import { connect } from 'dva';
import lodash from 'lodash';
import { SingleColorPicker } from 'Components/colorPicker';
import styles from './text.less';
import EIcon from 'Components/Icon';
import { ConfigProvider, Icon, Tooltip } from 'antd';
import BorderSet from '../borderSet';
import ScrollInput from 'Components/input/scrollInput';
import Modal from 'Components/modal';
import { getMyFont } from 'Api/user';
import { host } from 'Config/env';
import { addGlobalStyle } from '../../../../util/doc';
import { contrast, handleMaxOrMinNum, limitNumber } from '../../../../util/data';
import PropTypes from 'prop-types';
import { needProperty as textNeed } from '../../centre/element/text';
import { needProperty as ResizeTextNeed } from '../../../components/resizeComponent';
import FontSelect from './fontSelect';
import FontSizeSelect from './fontSize';


const movePorpty = ['letterSpacing', 'lineHeight', 'borderWidth', 'borderRadius', 'content'];


function createColorEle(type = 'color') {
    const ColorEle = connect(({ workspace }) => ({
        currentColor: (workspace.dataList[workspace.activeIndex] || {})[type],
    }))(SingleColorPicker);
    return ColorEle;
}

const FontColor = createColorEle('color');
const BlackgroundColor = createColorEle('backgroundColor');


const FontSizeLimit = [12, 200];
@connect()
export default class TextSet extends React.Component {
    constructor(props) {
        super(props);
        this.fontSizeInput = React.createRef();
        this.eleSetTimeout = null;
        this.state = {
            openFamily: false,
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (!lodash.isEqual(this.state, nextState)) {
            return true;
        }
        const singleKey = ['fontFamily', 'color'];
        const array = [
            ...Object.keys(textNeed)
                .filter(key => !Object.keys(ResizeTextNeed)
                    .includes(key) && !singleKey.includes(key),
                ) // 过滤移动 字体
                .map(key => `data.${key}`),
            'myFonts',
            'stateName',
            'data.borderStyle',
        ]
            .filter(v => !movePorpty.find(item => v === `data.${item}`));
        if (contrast(this.props, nextProps, array)) {
            return true;
        }
        return false;
    }


    handlePropsChange = (name, value) => {
        const { props: { changeNow, data: { uuid, borderWidth = 0 } } } = this;
        // 由于文本的改变可能重新改变文本的宽度和高度，所以需要重获取宽高
        const noChangeSizeArray = [
            'color',
            'backgroundColor',
            'fontWeight',
            'fontStyle',
            'textDecoration'];
        const callBack = !noChangeSizeArray.includes(name) ? (e) => {
            clearTimeout(this.eleSetTimeout);
            this.eleSetTimeout = setTimeout(() => {
                const dom = document.querySelector(`#workspace #element_${uuid}`);
                if (dom) {
                    changeNow({
                        height: dom.offsetHeight + 2 * borderWidth,
                        width: dom.offsetWidth + 2 * borderWidth,
                    });
                }
            }, 300);
        } : () => {
        };
        if (name === 'fontSize') {
            if (document.getElementById('fontSizeInput')) {
                document.getElementById('fontSizeInput').value = value;
            }
        }
        if (name === 'textAlign') {
            this.props.changeNow({
                textAlign: value,
                textAlignLast: value,
            });
            return;
        }
        if (name === 'fontFamily') {
            const { fontFamily, woffPath, ttfPath } = value;
            addGlobalStyle(fontFamily, woffPath || ttfPath, true);
            this.props.dispatch({
                type: `${this.props.stateName}/downloadFont`,
                payload: `${host.font2}${woffPath || ttfPath}`,
            });
            this.props.changeNow({
                fontFamily,
            });
            return;
        }
        changeNow({ [name]: value })
            .then(callBack);
    };
    getTextAlignIcon = (textAlign) => {
        const alignList = ['left', 'center', 'right', 'justify'];
        const titles = ['左对齐', '居中', '右对齐', '两端对齐'];
        const { hideElements } = this.props;
        let flag = false;
        if (hideElements.includes('textAlign')) {
            flag = true;
        }
        return alignList.map((align, i) => {
            let className = textAlign === align ? 'icon-checked' : '';
            className = flag ? styles.disabled : className;
            return <Tooltip key={align} title={titles[i]} placement={'bottom'} overlayStyle={{
                whiteSpace: 'nowrap',
                fontSize: 12,
            }}>
                <EIcon title={flag ? '暂未开放' : ''} className={className}
                       type={`iconfont iconalign_${align}`}
                       onClick={flag ? null : () => this.handlePropsChange('textAlign',
                           align)}/>
            </Tooltip>;
        });
    };
    getTextStylesIcon = (name, value, iconType, title) => {
        const currentValue = this.props.data[name];
        const className = currentValue === value ? 'icon-checked' : '';
        const nextValue = currentValue === value ? 'unset' : value;
        return <Tooltip title={title} placement={'top'} overlayStyle={{ whiteSpace: 'nowrap' }}
                        key={iconType}>
            <EIcon className={className} type={iconType}
                   onClick={() => this.handlePropsChange(name, nextValue)}/>
        </Tooltip>;
    };
    handleActive = (key, value = true) => {
        let initData = {};
        if (value) {
            initData = {
                textAlign: false,
                lineHeight: false,
                letterSpacing: false,
            };
        }
        this.setState({
            ...initData,
            [key]: value,
        });
    };

    onChangeFontSize = (value) => {
        return this.handlePropsChange('fontSize', value);
    };

    render() {
        const { state } = this;
        const { data, stateName, changeNow, hideElements } = this.props;
        if (!data) {
            return null;
        }
        const { fontSize, textAlign, lineHeight, letterSpacing } = data;
        const children = this.props.children;
        const hideTextColor = this.props.hideTextColor || false;
        const addHeight = state.textAlign || state.lineHeight || state.letterSpacing;

        return (
            <ConfigProvider getPopupContainer={(triggerNode) => triggerNode.parentElement}>
                <div className={styles.right__text__set}>
                    <div className={styles.textTitle}>文本</div>
                    {/*字体设置*/}
                    <div className={styles.fontFamily}>
                        <div className={styles.other}>
                            <FontSelect
                                stateName={stateName}
                                onChange={(value) => this.handlePropsChange('fontFamily', value)}
                            />
                        </div>
                    </div>
                    {/*字号设置*/}
                    <FontSizeSelect value={fontSize} onChange={this.onChangeFontSize}/>
                    {/*文字颜色*/}

                    <div className={styles.textColor}>
                        {!hideTextColor &&
                        <FontColor
                            width={88} height={32} title={'文字颜色'}
                            onChange={(color) => this.handlePropsChange('color', color)}
                        />}
                        {/*背景颜色*/}
                        {!hideElements.includes('background') &&
                        <BlackgroundColor
                            width={64} height={32} title={'背景颜色'}
                            onChange={(color) => this.handlePropsChange('backgroundColor', color)}
                        />}
                    </div>

                    {/*字体样式*/}
                    <div className={styles.textStyle}>
                        {this.getTextStylesIcon('fontWeight', 'bold', 'eqf-b', '加粗')}
                        {this.getTextStylesIcon('fontStyle', 'oblique', 'eqf-i', '斜体')}
                        {this.getTextStylesIcon('textDecoration', 'underline', 'eqf-u', '下划线')}
                        {this.getTextStylesIcon('textDecoration', 'line-through', 'eqf-s', '删除线')}
                    </div>

                    {/*对齐方式、行高、字距*/}
                    <div className={styles.fontData}>
                        <div className={styles.left}>
                            <div onMouseOver={() => this.handleActive('textAlign')}
                                 onMouseOut={() => this.handleActive('textAlign', false)}>
                                <Tooltip title={'对齐方式'} placement={'top'}
                                         overlayStyle={{ whiteSpace: 'nowrap' }}>
                                    <EIcon type="iconfont iconalign_center"/>
                                </Tooltip>
                                <div className={[
                                    styles.hideNode,
                                    state.textAlign ? styles.active : ''].join(' ')}>
                                    <div className={styles.textAlignStyle}>
                                        {this.getTextAlignIcon(textAlign)}
                                    </div>
                                </div>
                            </div>
                            <div className={styles.disabled}>
                                <Tooltip title={'文字方向'} placement={'top'}
                                         overlayStyle={{ whiteSpace: 'nowrap' }}>
                                    <EIcon type="iconfont icontext_direction"/>
                                </Tooltip>
                            </div>
                            {/*字距*/}
                            <div onMouseOver={() => this.handleActive('letterSpacing')}
                                 onMouseOut={() => this.handleActive('letterSpacing', false)}>
                                <Tooltip title={'字距'} placement={'top'}
                                         overlayStyle={{ whiteSpace: 'nowrap' }}>
                                    <EIcon type="iconfont icontext_gap"/>
                                </Tooltip>
                                <div className={[
                                    styles.hideNode,
                                    state.letterSpacing ? styles.active : ''].join(' ')}
                                     style={{
                                         left: -80,
                                         width: 160,
                                     }}>
                                    <div>
                                        <div className={styles.title}>字距</div>
                                        <ScrollInput
                                            style={{ width: 88 }}
                                            defaultValue={letterSpacing}
                                            onChange={(value) => this.handlePropsChange(
                                                'letterSpacing',
                                                handleMaxOrMinNum(value, 100))}
                                        />
                                    </div>
                                </div>
                            </div>
                            {/*行高*/}
                            {!hideElements.includes('lineHeight') &&
                            <div onMouseOver={() => this.handleActive('lineHeight')}
                                 onMouseOut={() => this.handleActive('lineHeight', false)}>
                                <Tooltip title={'行高'} placement={'top'}
                                         overlayStyle={{ whiteSpace: 'nowrap' }}>
                                    <EIcon type="iconfont iconline_height"/>
                                </Tooltip>
                                <div className={[
                                    styles.hideNode,
                                    state.lineHeight ? styles.active : ''].join(' ')}
                                     style={{ left: -120 }}>
                                    <div>
                                        <div className={styles.title}>行高</div>
                                        <ScrollInput
                                            min={1}
                                            max={3}
                                            step={0.1}
                                            scale={0.1}
                                            style={{ width: 88 }}
                                            defaultValue={lineHeight}
                                            onChange={(value) => this.handlePropsChange(
                                                'lineHeight',
                                                handleMaxOrMinNum(value, 3, 1))}
                                        />
                                    </div>
                                </div>
                            </div>}
                        </div>
                    </div>
                    {addHeight && <div className={styles.addHeightDiv}/>}
                    {/*插入其他设置*/}
                    {children}
                    {!hideElements.includes('border') && <React.Fragment>
                        <div className={styles.spaceLine}/>
                        <BorderSet hidden={!!children} data={data} changeNow={changeNow}/>
                    </React.Fragment>}
                </div>
                <Modal {...state.modalProps} onCancel={this.onClose}
                       visible={state.modalOpen}>{state.modalContent}</Modal>
            </ConfigProvider>
        );
    }
}
/**
 * @param data: 字体样式数据
 * @param myFonts: 字体文件
 * @param stateName: models的命名空间
 * @param showBorderSet: 是否显示边框设置
 * */
TextSet.propTypes = {
    data: PropTypes.object,
    stateName: PropTypes.string,
    hideElements: PropTypes.array,
};
TextSet.defaultProps = {
    data: null,
    stateName: 'workspace',
    hideElements: [],
};

