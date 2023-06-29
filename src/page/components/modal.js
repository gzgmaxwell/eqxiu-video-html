import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import styles from './modal.less';
import { getScrollTop } from 'Util/doc';
import { CSSTransition } from 'react-transition-group';
import Icon from './Icon';
import Button from './Button';
import eventEmitter, { EventKeys } from '../../services/EventListener';
import { getUserSetting, setUserSetting } from '../../util/storageLocal';

let viewHeight = document.body.clientHeight;
window.__lastmodal_zindex = 100;

class InfoModal extends React.PureComponent {
    constructor(props) {
        super(props);
        this.layout = React.createRef();
        this.historyCheckInput = React.createRef();
    }

    state = {
        show: false,
    };

    componentDidMount() {
        this.setState({ show: true });
    }

    onLoad = (e) => {
        this.layout.ref.classList.add('scale-enter-done');
    };

    onClick = (e, i) => {
        const { buttons = [], onCancel, onClose, } = this.props;
        let res = false;
        const historyChecked = this.historyCheckInput.current && this.historyCheckInput.current.checked;
        if (buttons[i] && typeof buttons[i].onClick === 'function') {
            res = buttons[i].onClick(e, onClose, { historyChecked });
        }
        if (!res) onCancel(e, historyChecked); // 如果返回值为false就关闭
    };

    render() {
        const {
            props: {
                title = '默认图片', icon = { type: 'eqf-info-f' }, info = '',
                style = {}, onCancel = null, buttons = [
                    {
                        children: '知道了',
                        onClick: onCancel,
                    }], className = '', saveHistory = false, ...props
            }, state: {
                show,
            },
        } = this;
        const top = (viewHeight - 200 + getScrollTop()) / 2;

        return (<div className={styles.layout} style={{ top }}>
            <CSSTransition in={show} classNames='scale' timeout={200}
                unmountOnExit
            >
                <div key='page'
                    ref={this.layout}
                    className={[styles['layui-layer'], className].join(' ')}
                    style={{ ...style }}>
                    <div className={styles.infoBody}>
                        <div className={styles.title}>
                            <Icon {...icon} />
                            {title}
                        </div>
                        <div className={styles.info}>{info}</div>
                        {saveHistory &&
                            <label className={styles.saveHistory}>
                                <input type={'checkBox'} defaultValue={false}
                                    ref={this.historyCheckInput} />
                                {saveHistory}
                            </label>
                        }
                        <div className={styles.buttonGroup}>
                            {buttons.map((v, i) => <Button key={v.children.toString()} {...v}
                                onClick={(e) => this.onClick(e, i)} />)}
                        </div>
                    </div>
                </div>
            </CSSTransition>
        </div>);
    }
}


class Modal extends React.PureComponent {


    constructor(props) {
        super(props);
        this.layout = React.createRef();
    }

    state = {
        layoutTop: 100,
        layoutLeft: 50,
        showLayout: false,
    };

    componentDidMount() {
        viewHeight = document.body.clientHeight;
        if (this.props.visible) {
            setTimeout(this.showLayout, 20);
        } else {

        }

    }

    componentWillUnmount() {
        document.body.classList.remove(styles.body);
        this.hiddenLayout();
        if (this.oriOverFlow) {
            document.body.style.overflow = this.oriOverFlow;
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.visible && !this.state.showLayout) {
            setTimeout(this.showLayout, 20);
        } else if (!this.props.visible && this.state.showLayout) {
            this.hiddenLayout();
        }
        if (this.state.showLayout) {
            this.onLoad();
        }
    }

    showLayout = () => {
        this.setState({ showLayout: true });
        eventEmitter.emit(EventKeys.showModal);
        window.addEventListener('resize', this.onResize);
    };

    hiddenLayout = () => {
        window.removeEventListener('resize', this.onResize);
        this.setState({ showLayout: false });
        eventEmitter.emit(EventKeys.hiddenModal);
    };

    onResize = () => {
        this.forceUpdate();
    };

    addBodyScroll = () => {
        document.body.classList.add(styles.body);
        this.oriOverFlow = document.body.style.overflow;
        document.body.style.overflow = 'auto';
    };

    onLoad = () => {
        if (this.layout.current) {
            const divHeight = this.layout.current.offsetHeight;
            const bodyWidth = document.body.clientWidth;
            const divWidth = this.layout.current.offsetWidth;
            const left = (bodyWidth - divWidth) / 2;
            const top = (viewHeight - divHeight + getScrollTop()) / 2;
            this.setState({
                layoutTop: top,
                layoutLeft: left,
            });
        }

    };

    onClose = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (typeof this.props.onCancel === 'function') {
            this.props.onCancel(true);
        }
    };

    render() {
        const { state, props } = this;
        const { header, content, footer, closeable = true, visible, returnDom = false } = props;
        const { showLayout } = state;
        if (!visible) {
            document.body.className = document.body.className.replace(styles.scrollBody, '');
            return null;
        }
        document.body.classList.add(`${styles.scrollBody}`);
        const children = visible ? (
            <React.Fragment>
                {header && <div className={styles.header}>
                    {header}
                    {closeable &&
                        <span className={styles.closeable} onClick={this.onClose}>×</span>}
                </div>}
                {props.children}
            </React.Fragment>
        ) : null;
        let top = this.state.layoutTop;
        top = Math.max(0, top);
        window.__lastmodal_zindex + 5;
        const dom = (<div className={styles.outer} style={{
            zIndex: visible ? window.__lastmodal_zindex : 0,
            display: visible ? 'flex' : 'none',
        }}>
            <div key='shade' className={styles.shade} onClick={this.onClose}
                onMouseEnter={(e) => {
                    e.stopPropagation();
                }}
                style={{
                    zIndex: (window.__lastmodal_zindex),
                }} />
            <div key='layout' className={styles.layout} style={{
                top,
                left: state.layoutLeft,
                zIndex: (window.__lastmodal_zindex + 5),
            }} ref={this.node}>
                <CSSTransition in={showLayout} classNames='scale' timeout={200}
                    unmountOnExit
                >
                    <div key='page'
                        className={[styles['layui-layer'], props.className].join(' ')}
                        onLoad={this.onLoad} ref={this.layout}
                        style={{ ...props.style }}>{children}</div>
                </CSSTransition>
            </div>
        </div>);
        if (returnDom) {
            return dom;
        }
        return ReactDOM.createPortal(
            dom,
            document.body,
        );
    }
}

const stringOrElement = PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.element,
]);
Modal.propTypes = {
    visible: PropTypes.bool,
    style: PropTypes.object,
    value: PropTypes.string,
    icon: PropTypes.string,
    onClick: PropTypes.func,
    onCancel: PropTypes.func,
    header: stringOrElement,
};

/**
 *
 * @param onCancel
 * @param props
 * @param title
 * @param icon {}
 * @param info
 * @param style
 * @param buttons []
 */
export function showModal({
    onCancel = () => {
    }, ...props
}) {
    const { body } = document;
    const shade = document.createElement('div');
    // 设置基本属性
    shade.className = styles.outer;
    body.appendChild(shade);
    // 自我删除的方法
    const close = (e) => {
        ReactDOM.unmountComponentAtNode(shade);
        body.removeChild(shade);
        onCancel(e);
    };
    const dom = (<React.Fragment>
        <div className={styles.shade} />
        <InfoModal {...props} onCancel={close} />
    </React.Fragment>);
    ReactDOM.render(
        dom,
        shade,
    );
}


export function waitModal(props) {
    const { body } = document;
    const shade = document.createElement('div');
    // 设置基本属性
    shade.className = styles.outer;
    body.appendChild(shade);
    // 自我删除的方法
    const close = (e) => {
        ReactDOM.unmountComponentAtNode(shade);
        body.removeChild(shade);
    };

    let onCancel = close;
    if (props.onCancel !== undefined) {
        onCancel = props.onCancel;
    }
    const dom = (<React.Fragment>
        <div className={styles.shade} />
        <InfoModal {...props} onCancel={onCancel} onClose={close} />
    </React.Fragment>);
    ReactDOM.render(
        dom,
        shade,
    );
}

/**
 * 带有不再显示的提示框
 * @param props
 */
export function canSaveWaiteModel(props) {
    const prefix = 'saveWaiteModel-';
    const promise = new Promise((resolve, reject) => {
        const { body } = document;
        const key = `${prefix}${props.title}`;
        // 有勾选过直接不显示
        const setting = getUserSetting(key);
        if (setting) {
            resolve(true);
            return;
        }
        const shade = document.createElement('div');
        // 设置基本属性
        shade.className = styles.outer;
        body.appendChild(shade);
        // 自我删除的方法
        const close = (e, hasCheck = false) => {
            ReactDOM.unmountComponentAtNode(shade);
            body.removeChild(shade);
            if (hasCheck) {
                setUserSetting(key, true);
            }
            resolve(true);
        };
        const saveHistory = props.saveHistory || '不再显示';
        let onCancel = close;
        if (props.onCancel !== undefined) {
            onCancel = props.onCancel;
        }
        const dom = (<React.Fragment>
            <div className={styles.shade} />
            <InfoModal {...props} onCancel={onCancel} onClose={close} saveHistory={saveHistory} />
        </React.Fragment>);
        ReactDOM.render(
            dom,
            shade,
        );
    });
    return promise;
}

export default Modal;
