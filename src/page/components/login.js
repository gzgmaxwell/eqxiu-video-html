import React from 'react';
import styles from './modal.less';
import env from 'Config/env';
import { formatEQXMessage } from 'Util/event.js';
import ReactDom from 'react-dom';
import { getScrollTop } from 'Util/doc';
import { name } from '../../config/env';
import Button from '../components/Button';
import { login } from '../../api/user';

const loginDivHeight = 536;

class DevLogin extends React.PureComponent {

    constructor(props) {
        super(props);
        this.selfAccount = React.createRef();
        this.selfPassword = React.createRef();
        this.selfRemember = React.createRef();
    }

    selfLogin = () => {
        login(this.selfPassword.current.value, this.selfRemember.current.value,
            this.selfAccount.current.value)
            .then(res => {
                const { data: { success = false } = {} } = res;
                if (success) {
                    this.props.onClose();
                }
            });
    };

    render() {
        const divWidth = 600;
        const divHeight = 536;
        const bodyWidth = document.body.clientWidth;
        const bodyHeight = document.body.clientHeight;
        const left = (bodyWidth - divWidth) / 2;
        const top = (bodyHeight - divHeight + getScrollTop()) / 2;
        return ([
            <div key='shade' className={styles.shade}/>,
            <div key='layout' className={styles.layout} style={{
                top,
                left,
            }}>
                <div className={`${styles['layui-layer']} scale-enter-done`}>
                    <div className={styles.selfLogin}>
                        <p className={styles.selfTitle}>登 录</p>
                        <div className={styles.selfAbox}><span
                            className={styles.selfAccount}>账 号：</span> <input ref={this.selfAccount}
                                                                              className={styles.selfAinput}
                                                                              type="text"/></div>
                        <div className={styles.selfBbox}><span
                            className={styles.selfPassword}>密 码：</span> <input
                            ref={this.selfPassword} className={styles.selfAinput} type="password"/>
                        </div>
                        <div className={styles.selfBbox}><input ref={this.selfRemember}
                                                                type="checkbox" value="true"/> 记住密码
                        </div>
                        <Button onClick={this.selfLogin} className={styles.selfBtn}>登 录</Button>
                    </div>
                </div>
            </div>]);
    }
}


class LoginButton extends React.PureComponent {

    state = {
        showLogin: true,
    };

    componentDidMount() {
        window.addEventListener('message', this.getMessage);
    }

    componentWillUnmount() {
        window.removeEventListener('message', this.getMessage);
    }

    getMessage = (message) => {
        const { props: { onClose, loginSuccess, loginFail } } = this;
        const data = formatEQXMessage(message);
        if (data === false) {
            return;
        }
        if (data.type === 'close') {
            this.onClose();
            loginFail();
        }
        if (data.type === 'login') {
            window.removeEventListener('message', this.getMessage);
            window._eqx_dispatch({
                type: 'user/loginSuccess',
                payload: data.user,
            });
            loginSuccess();
            console.log(this.props);
            this.props.onClose();
        }
    };


    onClose = () => {
        window.removeEventListener('message', this.getMessage);
        this.props.onClose();
    };


    render() {
        const { props, state } = this;
        const iframeStyle = {
            height: loginDivHeight,
            width: 600,
            display: 'block',
            lineHeight: 0,
            fontSize: 0,
        };
        const divWidth = 600;
        const divHeight = 536;
        const bodyWidth = document.body.clientWidth;
        const bodyHeight = document.body.clientHeight;
        const left = (bodyWidth - divWidth) / 2;
        const top = (bodyHeight - divHeight + getScrollTop()) / 2;
        return [
            <div key='shade' className={styles.shade}/>,
            <div key='layout' className={styles.layout} style={{
                top,
                left,
            }}>
                <div className={`${styles['layui-layer']} scale-enter-done`}>
                    <iframe
                        title={'login'}
                        className="eqc-auth"
                        style={iframeStyle}
                        src={`${env.host.auth}/auth/login?t=${new Date().getTime()}`}
                        scrolling="no"
                        frameBorder="0"/>
                </div>
            </div>,
        ];
    }
}

// modal 弹出一个独立的框
function modal(resolve = () => null, reject = () => null) {
    // 避免重复生成
    if (document.getElementById('loginShade') !== null) {
        return false;
    }
    const body = document.body;
    const shade = document.createElement('div');
    // 设置基本属性
    shade.class = styles.shade;
    shade.className = styles.outer;
    shade.id = 'loginShade';
    body.appendChild(shade);
    const isLocal = ['dev', 'local'].includes(name) && false;
    // 自我删除的方法
    const close = () => {
        ReactDom.unmountComponentAtNode(shade);
        body.removeChild(shade);
    };
    const loginProps = {
        onClose: close,
        loginSuccess: resolve,
        loginFail: reject,
    };

    ReactDom.render(
        isLocal ? <DevLogin {...loginProps}/> : <LoginButton {...loginProps}/>,
        shade,
    );
}

export default modal;
