import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { SingleColorPicker } from 'Components/colorPicker';
import styles from './text.less';
import Select from 'Components/input/select';
import Slider from 'Components/slider';
import EIcon from 'Components/Icon';
import NumberInput from 'Components/input/numberInput';
import { ConfigProvider, Icon } from 'antd';
import Divider from 'Components/common/Divider';
import Modal from 'Components/modal';
import { getMyFont } from 'Api/user';
import { host } from 'Config/env';
import { addGlobalStyle } from '../../../../../util/doc';
import { DEFAULT_FONT_FAMLIY } from '../../../../../config/staticParams';
import { handleMaxOrMinNum, limitNumber } from '../../../../../util/data';
import PropTypes from 'prop-types';

const FontSizeLimit = [12, 200];
@connect(({ loading }) => ({ loading }))
export default class TextSet extends PureComponent {
    constructor(props) {
        super(props);
        this.fontSizeInput = React.createRef();
        this.eleSetTimeout = null;
        this.state = {
            openFamily: false,
        };
    }

    fontSizeList = [
        {
            value: 12,
            title: '12px',
        },
        {
            value: 13,
            title: '13px',
        },
        {
            value: 14,
            title: '14px',
        },
        {
            value: 16,
            title: '16px',
        },
        {
            value: 18,
            title: '18px',
        },
        {
            value: 20,
            title: '20px',
        },
        {
            value: 24,
            title: '24px',
        },
        {
            value: 32,
            title: '32px',
        },
        {
            value: 48,
            title: '48px',
        },
        {
            value: 64,
            title: '64px',
        },
        {
            value: 96,
            title: '96px',
        },
    ];
    defaultFont = {
        name: '默认字体',
        fontFamily: DEFAULT_FONT_FAMLIY,
    };
    handlePropsChange = (name, value) => {
        const { props: { changeNow, data: { uuid } } } = this;
        // 由于文本的改变可能重新改变文本的宽度和高度，所以需要重获取宽高
        const callBack = (e) => {
            clearTimeout(this.eleSetTimeout);
            this.eleSetTimeout = setTimeout(() => {
                const dom = document.querySelector(`#workspace #element_${uuid}`);
                if (dom) {
                    changeNow({
                        height: dom.offsetHeight,
                        width: dom.offsetWidth,
                    });
                }
            }, 300);
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
    clearStyle = () => {
        const align = this.props.stateName === 'workspace' ? 'center' : 'left';
        this.props.changeNow({
            textAlign: align,
            textAlignLast: align,
            fontStyle: 'unset',
            textDecoration: 'unset',
            fontWeight: 'unset',
        });
    };
    getTextAlignIcon = (textAlign) => {
        const alignList = ['left', 'center', 'right', 'justify'];
        const { hideElements } = this.props;
        let flag = false;
        if (hideElements.includes('textAlign')) {
            flag = true;
        }
        return alignList.map(align => {
            let className = textAlign === align ? 'icon-checked' : '';
            className = flag ? styles.disabled : className;
            return <EIcon title={flag ? '暂未开放' : ''} className={className}
                          type={`eqf-align-${align}`} key={align}
                          onClick={flag ? null : () => this.handlePropsChange('textAlign',
                              align)}/>;
        });
    };
    getTextStylesIcon = (name, value, iconType) => {
        const currentValue = this.props.data[name];
        const className = currentValue === value ? 'icon-checked' : '';
        const nextValue = currentValue === value ? 'unset' : value;
        return <EIcon className={className} type={iconType} key={iconType}
                      onClick={() => this.handlePropsChange(name, nextValue)}/>;
    };

    render() {
        const { state } = this;
        const { loading: { effects }, data, myFonts, stateName, changeNow, hideElements } = this.props;
        if (!data) {
            return null;
        }
        const { color, backgroundColor, fontFamily, fontSize, textAlign, lineHeight, letterSpacing } = data;
        const children = this.props.children;
        const hideTextColor = this.props.hideTextColor || false;
        const fontFamilies = myFonts.map(item => {
            const { fontFamily, name } = item;
            return {
                title: name,
                value: fontFamily,
                data: item,
                style: { fontFamily },
            };
        });
        return (
            <ConfigProvider getPopupContainer={(triggerNode) => triggerNode.parentElement}>
                <div className={styles.right__text__set}>
                    {/*字体设置*/}
                    <div className={styles.fontFamily}>
                        <div className={styles.left}>字体</div>
                        <div className={styles.other}>
                            <Select options={fontFamilies} placeholder={'请选择字体'}
                                    suffixIcon={effects[`${stateName}/downloadFont`] ? <Icon
                                        type="loading"/> : <Icon type="caret-down"/>}
                                    dropdownClassName='selectDropdownClassName'
                                    optionFilterProp="children"
                                    defaultValue={fontFamily}
                                    notFoundContent={'暂无匹配数据'}
                                    onSelect={(value, options) => this.handlePropsChange(
                                        'fontFamily', options.props.data)}/>
                        </div>
                    </div>
                    {/*字号设置*/}
                    <div className={styles.fontSize}>
                        <div className={styles.left}>字号</div>
                        <div className={styles.center}>
                            <Select options={this.fontSizeList} placeholder={'请选择字号'}
                                    suffixIcon={<Icon type="caret-down"/>}
                                    showSearch={true}
                                    dropdownClassName='selectDropdownClassName'
                                    optionFilterProp="children"
                                    defaultValue={fontSize}
                                    key={fontSize}
                                    notFoundContent={'暂无匹配数据'}
                                    onSelect={(value) => this.handlePropsChange('fontSize',
                                        handleMaxOrMinNum(value, 100, 12))}/>
                        </div>
                        <div className={styles.right}>
                            <div
                                onClick={(e) => this.handlePropsChange('fontSize',
                                    limitNumber(fontSize + 1, FontSizeLimit))}>A+
                            </div>
                            <div
                                onClick={(e) => this.handlePropsChange('fontSize',
                                    limitNumber(fontSize - 1, FontSizeLimit))}>A-
                            </div>
                        </div>
                    </div>
                    {/*文字颜色*/}
                    {!hideTextColor &&
                    <div className={styles.textColor}>
                        <div className={styles.left}>文字颜色</div>
                        <SingleColorPicker currentColor={color} disableAlpha={true}
                                           disableSucker={true}
                                           onChange={(color) => this.handlePropsChange('color',
                                               color)}/>
                    </div>
                    }
                    {/*背景颜色*/}
                    {!hideElements.includes('background') &&
                    <div className={styles.backgroundColor}>
                        <div className={styles.left}>背景颜色</div>
                        <SingleColorPicker currentColor={backgroundColor}
                                           disableAlpha={true}
                                           disableSucker={true}
                                           onChange={(color) => this.handlePropsChange(
                                               'backgroundColor',
                                               color)}/>
                    </div>}
                    {/*对齐方式*/}
                    <div className={styles.textStyle}>
                        {this.getTextAlignIcon(textAlign)}
                        <Divider type="vertical" className={styles.divider}/>
                        {this.getTextStylesIcon('fontWeight', 'bold', 'eqf-b')}
                        {this.getTextStylesIcon('fontStyle', 'oblique', 'eqf-i')}
                        {this.getTextStylesIcon('textDecoration', 'underline', 'eqf-u')}
                        <Divider type="vertical" className={styles.divider}/>
                        <EIcon type="eqf-eraser-f" onClick={this.clearStyle}/>
                    </div>
                    {/*行高*/}
                    {!hideElements.includes('lineHeight') && <div className={styles.lineHeight}>
                        <div className={styles.left}>行高</div>
                        <div className={styles.center}>
                            <Slider
                                className={'slider'}
                                tooltipVisible={false}
                                min={1}
                                max={3}
                                step={0.1}
                                onChange={(value) => this.handlePropsChange('lineHeight',
                                    handleMaxOrMinNum(value, 3))}
                                value={typeof lineHeight === 'number' ? lineHeight : 0}
                            />
                        </div>
                        <div className={styles.right}>
                            <NumberInput
                                min={1}
                                max={3}
                                step={0.1}
                                value={typeof lineHeight === 'number' ? lineHeight : 0}
                                onChange={(value) => this.handlePropsChange('lineHeight',
                                    handleMaxOrMinNum(value.toFixed(1), 3))}
                            />
                        </div>
                    </div>}
                    {/*字距*/}
                    <div className={styles.letterSpacing}>
                        <div className={styles.left}>字距</div>
                        <div className={styles.center}>
                            <Slider
                                className={'slider'}
                                tooltipVisible={false}
                                min={0}
                                max={100}
                                step={1}
                                onChange={(value) => this.handlePropsChange('letterSpacing',
                                    handleMaxOrMinNum(value, 100))}
                                value={typeof letterSpacing === 'number' ? letterSpacing : 0}
                            />
                        </div>
                        <div className={styles.right}>
                            <NumberInput
                                min={0}
                                max={100}
                                step={1}
                                value={typeof letterSpacing === 'number' ? letterSpacing : 0}
                                onChange={(value) => this.handlePropsChange('letterSpacing',
                                    handleMaxOrMinNum(value, 100))}
                            />
                        </div>
                    </div>
                    {/*插入其他设置*/}
                    {children}
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
    myFonts: PropTypes.array,
    stateName: PropTypes.string,
    hideElements: PropTypes.array,
};
TextSet.defaultProps = {
    data: null,
    myFonts: [],
    stateName: 'workspace',
    hideElements: [],
};

