import React from 'react';
import styles from './modal.less';
import { formatEQXMessage } from 'Util/event.js';
import ReactDom from 'react-dom';
import { getScrollTop } from 'Util/doc';
import Button from './Button';
import { setInvitationCode } from 'Api/user';

const loginDivHeight = 200;

class InvitationCode extends React.PureComponent {

    constructor(props) {
        super(props);
        this.input = React.createRef();
    }

    state = {
        showLogin: true,
    };

    componentDidMount() {
    }


    onClose = () => {
        this.props.onFail();
        this.props.onClose();
    };
    confirm = () => {
        // 发送请求，
        setInvitationCode(this.input.current.value)
            .then(res => {
                if (res.data.success) {
                    this.props.onSuccess();
                    this.props.onClose();
                }
            });
    };

    render() {
        const { props, state } = this;
        const top = Math.max((document.body.clientHeight - loginDivHeight) / 2 + getScrollTop(), 0);
        const { header, content, footer, closeable } = props;

        return [
            <div key='shade' className={styles.shade}/>,
            <div key='layout' className={styles.layout} style={{ top }}>
                <div className={styles['layui-layer']}>
                    <div style={{ width: 260 }}>
                        {header && <div className={styles.header}>
                            {header}
                            <span className={styles.closeable} onClick={this.onClose}>X</span>
                        </div>}
                        <div style={{ padding: '0 28px' }}>
                            <span>目前采用邀请码绑定机制，请先获取邀请码。</span>
                            <input placeholder={'请填写邀请码'} style={{
                                border: '1px #cccccc solid',
                                width: 200,
                                padding: 12,
                                marginTop: 10,
                            }} ref={this.input}/>
                        </div>
                        <div className={styles.foot}>
                            <Button className={styles.confirm} onClick={this.confirm}>确认</Button>
                            <Button className={styles.cancel} onClick={this.onClose}>取消</Button>
                        </div>
                    </div>
                </div>
            </div>,
        ];
    }
}

// modal 弹出一个独立的框
function modal(resolve = () => null, reject = () => null) {
    // 避免重复生成
    if (document.getElementById('invitationCode') !== null) {
        return false;
    }
    const body = document.body;
    const shade = document.createElement('div');
    // 设置基本属性
    shade.className = styles.outer;
    shade.id = 'invitationCode';
    body.appendChild(shade);
    // 自我删除的方法
    const close = () => {
        ReactDom.unmountComponentAtNode(shade);
        body.removeChild(shade);
    };

    ReactDom.render(
        <InvitationCode header={'邀请码填写'} style={{ width: 500 }} onClose={close} onSuccess={resolve}
                        onFail={reject}
        />,
        shade,
    );
}

export default modal;
