import React from 'react';
import styles from './modal.less';
import env from 'Config/env';
import { routerRedux } from 'dva/router';
import { formatEQXMessage } from 'Util/event.js';
import ReactDom from 'react-dom';
import { getScrollTop } from 'Util/doc';

const loginDivHeight = 300;

class MobileBind extends React.PureComponent {

    componentDidMount() {
        window.addEventListener('message', this.getMessage);
    }

    getMessage = (e) => {
        const data = e.data;
        console.log(data);
        if (data === false) {
            return;
        }
        if (data.closeBindBox) {
            this.onClose();
            // this.props.failCallback();
        }
        if (data.bindSuccess) {
            this.props.successCallback();
            this.onClose();
        }
    };

    componentWillUnmount(){
        window.removeEventListener('message', this.getMessage);
    }

    onClose = () => {
        this.props.onClose();
    };


    render() {
        const iframeStyle = {
            height: loginDivHeight,
            width: 600,
            display: 'block',
            lineHeight: 0,
            fontSize: 0,
        };
        const divHeight = 300;
        const bodyWidth = document.body.clientWidth;
        const bodyHeight = document.body.clientHeight;
        const divWidth = 600;
        const left = (bodyWidth - divWidth) / 2;
        const top = (bodyHeight - divHeight + getScrollTop()) / 2;
        return [
            <div key='shade' className={styles.shade}/>,
            <div key='layout' className={styles.layout} style={{ top, left }}>
                <div className={`${styles['layui-layer']} scale-enter-done`}>
                    <iframe
                        title={'login'}
                        className="eqc-auth"
                        style={iframeStyle}
                        src={`${env.host.auth}/mobile/bindphone.html?t=${new Date().getTime()}`}
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
    shade.className = styles.outer;
    shade.id = 'loginShade';
    body.appendChild(shade);
    // 自我删除的方法
    const close = () => {
        ReactDom.unmountComponentAtNode(shade);
        body.removeChild(shade);
        reject();
    };
    ReactDom.render(
        <MobileBind successCallback={resolve} onClose={close}/>,
        shade,
    );
}

export default modal;
