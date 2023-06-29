import React from 'react';
import Button from 'Components/Button/index';
import Modal from 'Components/modal';
import styles from './login.less';
import env from 'Config/env';
import { formatEQXMessage } from 'Util/event.js';
import { connect } from 'dva';


@connect(({ user }) => ({ user }))
class LoginButton extends React.PureComponent {

  state = {
    showLogin: false,
    showRegister: false
  };
  /**
   * 监听登录窗事件
   * @param message
   */
  getMessage = (message) => {
    const data = formatEQXMessage(message);
    if (data === false) {
      return;
    }
    if (data.type === 'close') {
      this.onClose();
    }
    if (data.type === 'login') {
      this.onClose();
      this.props.dispatch({
        type: 'user/loginSuccess',
        payload: data.user,
      });
    }
  };

  componentDidMount() {
    window._eqx_video_login = this;
  }

  componentWillUnmount(){
    window.removeEventListener('message', this.getMessage);
  }

  onClose = () => {
    window.removeEventListener('message', this.getMessage);
    this.setState({
      showLogin: false,
      showRegister: false
    });
  };

  onLoginOpen = () => {
    window.addEventListener('message', this.getMessage);
    this.setState({ showLogin: true });
  };

  onRegisterOpen = () => {
    window.addEventListener('message', this.getMessage);
    this.setState({ showRegister: true });
  };

  render() {
    const iframeStyle = {
      height: 536,
      width: 600,
      display: 'block',
      lineHeight: 0,
      fontSize: 0
    };
    return [
      <li key='login' className='header-nav-item'>
        <Button onClick={this.onLoginOpen} className={styles.loginButton}>登录</Button>
      </li>,
      <li key='register' className='header-nav-item'>
        <Button onClick={this.onRegisterOpen}
                className={styles.registerButton}>注册</Button></li>,
      <Modal
        key='login_modal'
        visible={this.state.showLogin}
        onCancel={this.onClose}
      >
        <iframe className="eqc-auth" style={iframeStyle}
                src={`${env.host.auth}/auth/login?t=${new Date().getTime()}`}
                scrolling="no" frameBorder="0"/>
      </Modal>,
      <Modal
        key='register_modal'
        visible={this.state.showRegister}
        onCancel={this.onClose}
      >
        <iframe className="eqc-auth" style={iframeStyle}
                src={`${env.host.auth}/auth/reg/wx?t=${new Date().getTime()}`}
                scrolling="no" frameBorder="0"/>
      </Modal>
    ];
  }
}

export default LoginButton;
