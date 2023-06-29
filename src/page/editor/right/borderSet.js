import React from 'react';
import styles from './borderSet.less';
import Select from 'Components/input/select';
import { ConfigProvider, Tooltip } from 'antd';
import { SingleColorPicker } from '../../components/colorPicker';
import ScrollInput from '../../components/input/scrollInput';
import { handleMaxOrMinNum } from '../../../util/data';
import Icon from '../../components/Icon';

export default class BorderSet extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            showBorderSet: !props.hidden || true,
        };
    }

    borderStyles = [
        {
            title: '无边框',
            value: 'unset',
        },
        {
            title: '直线',
            value: 'solid',
        },
    ];
    handlePropsChange = (name, value) => {
        if (name === 'borderStyle' && value === 'unset') {
            this.props.changeNow({
                borderStyle: 'unset',
                borderWidth: 0,
            });
            return;
        }
        if (name !== 'borderWidth' && name !== 'borderRadius') {
            this.props.changeNow({ [name]: value });
            return;
        }
        if (isNaN(value)) {
            return;
        }
        const { borderWidth = 0, width, height } = this.props.data;
        if (name === 'borderWidth') {
            this.props.changeNow({
                borderWidth: ~~value,
                width: width + (value - borderWidth) * 2,
                height: height + (value - borderWidth) * 2,
            });
            return;
        }
        this.props.changeNow({ [name]: ~~value });
    };
    handleActive = (key, value = true) => {
        let initData = {};
        if (value) {
            initData = {
                activeLine: false,
                activeRadius: false,
            };
        }
        this.setState({
            ...initData,
            [key]: value,
        });
    };

    render() {
        const { data } = this.props;
        const { showBorderSet, activeLine, activeRadius } = this.state;
        if (!data) {
            return null;
        }
        const { borderColor = '#fff', borderWidth = 0, borderRadius = 0, borderStyle, width, height } = data;
        const maxRadius = Math.min(width, height) / 2 || 0;
        const value = borderStyle === 'solid' ? 'solid' : 'unset';
        const addHeight = activeLine || activeRadius;
        return (
            <ConfigProvider getPopupContainer={(triggerNode) => triggerNode.parentElement}>
                <div className={styles.borderSetTitle}>
                    <span>边框</span>
                </div>
                {showBorderSet ? <div className={styles.right__border__set}>
                    {/*边框样式*/}
                    {/*<div className={styles.borderStyle}>*/}
                    {/*<div className={styles.left}>边框样式</div>*/}
                    {/*<Select className={styles.other} options={this.borderStyles} value={borderStyle || 'solid'}*/}
                    {/*onSelect={(value) => this.handlePropsChange('borderStyle', value)}*/}
                    {/*/>*/}
                    {/*</div>*/}

                    {/*边框颜色*/}
                    <div className={styles.borderColor}>
                        <Select className={styles.other} options={this.borderStyles} value={value}
                                onSelect={(value) => this.handlePropsChange('borderStyle', value)}
                        />
                    </div>
                    {/*边框尺寸*/}
                    {value !== 'unset' &&
                    <div className={styles.borderData}>
                        <div className={styles.left}>
                            <div onMouseOver={() => this.handleActive('activeLine')}
                                 onMouseOut={() => this.handleActive('activeLine', false)}>
                                <Tooltip title={'边框宽度'} placement={'top'}
                                         overlayStyle={{ whiteSpace: 'nowrap' }}>
                                    <Icon type="iconfont iconline_width"/>
                                </Tooltip>
                                <div className={[
                                    styles.hideNode,
                                    activeLine ? styles.active : ''].join(' ')}>
                                    <div>
                                        <div className={styles.title}>线宽</div>
                                        <ScrollInput
                                            disabled={value === 'unset'}
                                            style={{ width: 88 }}
                                            defaultValue={borderWidth}
                                            scale={0.1}
                                            max={10}
                                            onChange={(value) => this.handlePropsChange(
                                                'borderWidth', handleMaxOrMinNum(value, 10))}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div onMouseOver={() => this.handleActive('activeRadius')}
                                 onMouseOut={() => this.handleActive('activeRadius', false)}>
                                <Tooltip title={'边框弧度'} placement={'top'}
                                         overlayStyle={{ whiteSpace: 'nowrap' }}>
                                    <Icon type="iconfont iconradian"/>
                                </Tooltip>
                                <div className={[
                                    styles.hideNode,
                                    activeRadius ? styles.active : ''].join(' ')}
                                     style={{ left: -44 }}>
                                    <div>
                                        <div className={styles.title}>弧度</div>
                                        <ScrollInput
                                            max={maxRadius}
                                            style={{ width: 88 }}
                                            defaultValue={borderRadius}
                                            onChange={(value) => this.handlePropsChange(
                                                'borderRadius',
                                                handleMaxOrMinNum(value, maxRadius))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={styles.right}>
                            <SingleColorPicker
                                width={64} height={32} title={'边框颜色'}
                                currentColor={borderColor}
                                onChange={(borderColor) => this.handlePropsChange('borderColor',
                                    borderColor)}
                            />
                        </div>
                    </div>}
                    {addHeight && <div className={styles.addHeightDiv}/>}
                </div> : null}
            </ConfigProvider>
        );
    }
}
