import React from 'react';
import ReactDOM from 'react-dom';
import PropsTypes from 'prop-types';
import Modal from './modal';
import Button from './Button/index';
import styles from './delete.less';
import Icon from './Icon';

let viewHeight = document.body.clientHeight;

class DeleteModal extends React.PureComponent {


    render() {
        const { props: { returnDom = false, sureBtn = '确定', cancelBtnShow = true, cancelBtn = '取消', info = false, infoClass = '', ...props } } = this;
        const dom = (<div className={styles.deleteModal}>
            <div className={styles['content-box']} style={{ ...props.style }}>
                <div className={`${styles.content} clearfix`}>
                    <Icon type={props.type || 'eqf-info-f'}
                          className={`${styles.em} ${props.inconclass || 'warning'} `}/>
                    <div>{props.text || '是否删除此视频'}</div>
                    {info && <div className={`${styles.info} ${infoClass}`}>{info}</div>}
                </div>
            </div>
            <div className={styles.deleteModalFoot}>
                <Button onClick={props.onDelete}>{sureBtn}</Button>
                {cancelBtnShow && <Button onClick={props.onClose} className={styles.cancelBtn}>{cancelBtn}</Button>}
            </div>
        </div>);
        if (returnDom) {
            return dom;
        }
        return (
            <Modal
                visible={props.visible}
                onCancel={props.onClose}
                {...props}
            >
                {dom}
            </Modal>
        );
    }
}

DeleteModal.propTypes = {
    onDelete: PropsTypes.func,
    onClose: PropsTypes.func,
    text: PropsTypes.oneOfType([
        PropsTypes.string,
        PropsTypes.element,
    ]),
    type: PropsTypes.string,
    inconclass: PropsTypes.string,
};

export function waitChoseModel(props) {
    const promise = new Promise((resolve, reject) => {
        const dom = document.createElement('div');
        dom.id = 'choseModel';
        dom.className = styles.outer;
        document.body.append(dom);
        const onConfirm = (e) => {
            document.body.removeChild(dom);
            resolve(e);
        };
        const close = () => {
            document.body.removeChild(dom);
            reject();
        };
        const tProps = {
            ...props,
            returnDom: true,
            onDelete: onConfirm,
            onClose: close,
        };
        ReactDOM.render(<div style={{
            backgroundColor: '#fff',
            top: viewHeight / 2 - 100,
            position: 'absolute',
        }}><DeleteModal {...tProps} />
        </div>, dom);
    });
    return promise;
}



export default DeleteModal;

