import React from 'react';
import ReactDOM from 'react-dom';
import PropsTypes from 'prop-types';
import Modal from '../modal';
import styles from '../vip.less';
import { message } from 'antd';
import Cropper from '../cropper';

class Cut extends React.PureComponent {
    constructor(props) {
        super(props);
    }

    render() {
        const { props: { returnDom = false, ...props } } = this;
        const dom = (<div style={{
            width: '960px',
            height: '600px',
        }}>
           <Cropper {...this.props} />
        </div>);
        if (returnDom) {
            return dom;
        }
        return (
            <Modal
                visible={props.visible}
                onCancel={props.onClose}
                {...props}>
                {dom}
            </Modal>
        );
    }
}

export function ComCropper(props) {
    const promise = new Promise((resolve, reject) => {
        const dom = document.createElement('div');
        dom.id = 'choseModel';
        dom.className = styles.outer;
        document.body.append(dom);
        const onConfirm = (data) => {
            document.body.removeChild(dom);
            message.success('裁剪成功');
            resolve(data);
        };
        const close = () => {
            document.body.removeChild(dom);
            reject();
        };
        const tProps = {
            ...props,
            returnDom: true,
            onSuccess: onConfirm,
            onClose: close,
        };
        // dom.onclick = close;
        ReactDOM.render(<div style={{
            backgroundColor: '#fff',
        }}><Cut {...tProps} />
        </div>, dom);
    });
    return promise;
}

