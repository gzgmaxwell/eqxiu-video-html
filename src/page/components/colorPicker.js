import React, { PureComponent, Component } from 'react';
import ReactDOM from 'react-dom';
import { CustomPicker } from 'react-color';
import styles from './colorPicker.less';
import PropTypes from 'prop-types';
import { Tooltip } from 'antd';
import Icon from './Icon';
import ColorSucker from './input/colorSucker';

const { Saturation, Hue, Alpha } = require('react-color/lib/components/common');

const colorList = [
    '#eef1f6',
    '#ffcbd0',
    '#bde6ff',
    '#97ecb9',
    '#ffc36d',
    '#95f4e2',
    '#ccd0ff',
    '#eccaf1',
    '#ffbed0',
    '#ffffff',
    '#a8b8d0',
    '#e87474',
    '#59c7f9',
    '#56b786',
    '#ea9924',
    '#2ecbbe',
    '#8d91ff',
    '#c277d0',
    '#ff79a2',
    '#000000',
    '#7a90b2',
    '#c4433c',
    '#2196ed',
    '#48916c',
    '#d67b03',
    '#23a193',
    '#696cb4',
    '#a158b3',
    '#bf4c76'];

let historyColor = [];
const insertHistory = (color) => {
    historyColor.unshift(color);
    const set = new Set(historyColor);
    historyColor = [...Array.from(set)].slice(0, 5);
};
/**
 * @param currentColor: PropTypes.string,
 * @param defaultColors: PropTypes.array,
 * @param disableAlpha: PropTypes.bool,
 * @param onChange: PropTypes.func.isRequired,
 * */
export default class ColorPicker extends PureComponent {
    state = {
        displayColorPicker: false,
    };
    handleClick = () => {
        this.setState({ displayColorPicker: !this.state.displayColorPicker });
    };
    handleClose = () => {
        this.setState({ displayColorPicker: false });
    };
    handleChange = (color) => {
        const { r, g, b, a } = color.rgb;
        this.props.onChange(`rgba(${r},${g},${b},${a})`);
    };

    handlerChangeByHistory = (color) => {
        insertHistory(color);
        this.props.onChange(color);
    };

    handleColor = (e, color) => {
        e.stopPropagation();
        e.preventDefault();
        this.handlerChangeByHistory(color);
    };

    handleTypeText = (e) => {
        const { value } = e.target;
        this.props.onChange(value);
    };

    handleFocus = (e) => {
        const { target: { value } } = e;
        insertHistory(value);
    };

    render() {
        const {
            currentColor = 'rgba(255,255,255,1)', onChange, style, id, disableAlpha = false,
            disableSucker = false,
        } = this.props;
        const prevColor = historyColor[0];
        return ReactDOM.createPortal(
            <div className={styles.colorPicker} style={style} id={id}>
                <div className={styles.content}>
                    <div className={styles.compact}>
                        <ul className={styles.historyUl}>
                            {!disableAlpha && <li className={styles.clear}
                                                  onClick={() => onChange('rgba(0,0,0,0)')} />}
                            {colorList.map(item => <li
                                style={{ backgroundColor: item }}
                                onClick={() => this.handlerChangeByHistory(item)}
                                key={item}
                            />)}
                        </ul>
                    </div>
                    <div className={styles.history}>
                        <ColorSucker className={`${styles.colorSucker}`}
                                     disabled={disableSucker}
                                     onChange={this.handleColor} />
                        <span className={styles.recentUse}>最近使用</span>
                        <ul className={styles.fr}>
                            {historyColor
                                .map(item => <li
                                    style={{ backgroundColor: item }}
                                    onClick={() => onChange(item)}
                                    key={item}
                                />)}
                        </ul>
                    </div>
                    <CustomColorPicker color={currentColor} onChange={this.handleChange}
                                       disableAlpha={disableAlpha} />
                    <div className={styles['sub-history']}>
                        <ul className={styles.historyUl}>
                            <li style={{ backgroundColor: currentColor }} />
                            <li style={{ backgroundColor: prevColor }}
                                onClick={() => this.handlerChangeByHistory(prevColor)} />
                        </ul>
                        <input className={styles['colorpicker-element']}
                            // defaultValue={currentColor}
                               value={currentColor}
                            // onFocus={this.handleFocus}
                               onKeyDown={(e) => {if (e.keyCode === 13) this.handleFocus(e); }}
                               onBlur={this.handleFocus}
                               onChange={this.handleTypeText} />
                    </div>
                </div>
            </div>
            , document.body);
    }
}

@CustomPicker
class CustomColorPicker extends PureComponent {


    render() {
        const { props: { disableAlpha = false, ...props } } = this;
        const pointer = ({ style }) => {
            return <div className={styles.pointer} style={style} />;
        };

        return (
            <div className={styles.more}>
                <div className={styles.saturation}>
                    <Saturation {...props}
                                pointer={pointer}
                    />
                </div>
                <div className={styles.hue}>
                    <Hue {...props}
                         width={20} height={150} direction={'vertical'}
                         pointer={() => <i />} />
                </div>
                <div className={styles.alpha}>
                    {!disableAlpha && <Alpha {...props}
                                             width={20} height={150} direction={'vertical'}
                                             pointer={() => <i />} />}
                </div>
            </div>);
    }
}

/**
 * @param currentColor: PropTypes.string,
 * @param disableAlpha: PropTypes.bool,
 * @param onChange: PropTypes.func.isRequired,
 * */
export class SingleColorPicker extends PureComponent {
    constructor(props) {
        super(props);
        this.currentId = `colorPicker-${Math.random() * 5}`;
    }

    state = {
        displayColorPicker: false,
    };

    componentDidUpdate() {
        const { displayColorPicker } = this.state;
        if (displayColorPicker) {
            document.addEventListener('mousedown', this.handleClose);
        } else if (!displayColorPicker) {
            document.removeEventListener('mousedown', this.handleClose);
        }
    }

    componentWillUnmount() {
        document.removeEventListener('mousedown', this.handleClose);
    }


    handleClick = (e) => {
        const { props: { disabled = false } } = this;
        if (disabled) return;
        this.setState({ displayColorPicker: !this.state.displayColorPicker });
    };

    handleClose = (e) => {
        // 说明吸管打开状态
        if (document.getElementById('suckering')) {
            return false;
        }
        e.stopPropagation();
        if (e.path && !Array.from(e.path)
                .includes(document.getElementById(this.currentId))) {
            insertHistory(this.props.currentColor);
            this.setState({ displayColorPicker: false });
        }
    };
    handleChange = (color) => {
        const { r, g, b, a } = color.rgb;
        this.props.onChange(`rgba(${r},${g},${b},${a})`);
    };
    handleChangeRGBA = (color) => {
        this.props.onChange(color);
    };

    render() {
        const { disabled } = this.props;
        const { displayColorPicker } = this.state;
        const {
            currentColor = 'rgba(255,255,255,1)', disableAlpha = false, width, height, title,
            placement = 'left', disableSucker = false,
        } = this.props;
        const style = {};
        if (placement === 'right') {
            style.left = 360;
            style.top = 57;
        } else {
            style.right = 200;
            style.top = 100;
        }
        return (
            <div className={styles.body}>
                {title ?
                    <Tooltip title={title} placement={'top'} autoAdjustOverflow={false} arrowPointAtCenter={true}
                             overlayStyle={{ whiteSpace: 'nowrap' }}>
                        <div className={styles.singleColorPicker} onClick={this.handleClick}
                             style={{
                                 cursor: disabled ? 'not-allowed' : 'pointer',
                                 background: currentColor,
                                 width: width || 68,
                                 height: height || 36,
                             }} />
                    </Tooltip>
                    : <div className={styles.singleColorPicker} onClick={this.handleClick}
                           style={{
                               cursor: disabled ? 'not-allowed' : 'pointer',
                               background: currentColor,
                               width: width || 68,
                               height: height || 36,
                           }} />}
                {displayColorPicker &&
                <ColorPicker currentColor={currentColor}
                             onChange={this.handleChangeRGBA}
                             style={style} id={this.currentId}
                             disableSucker={disableSucker}
                             disableAlpha={disableAlpha} />}
            </div>
        );
    }
}


ColorPicker.propTypes = {
    currentColor: PropTypes.string,
    defaultColors: PropTypes.array,
    disableAlpha: PropTypes.bool,
    disableSucker: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
};
