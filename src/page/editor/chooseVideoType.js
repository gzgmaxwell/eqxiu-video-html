import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Modal from '../components/modal';
import styles from './chooseVideoType.less';
import { prev } from '../../config/env';
import Icon from '../components/Icon';
import QrImg from '../static/shequnQrcode.png';


export default class ChooseVideoType extends Component {

    init = (oriTemplateId) => {
        const { props: { closeModal, retrunChoose } } = this;
        if (typeof retrunChoose === 'function') {
            return retrunChoose(oriTemplateId);
        }
        closeModal();
        window.open(`${prev}/editor/${oriTemplateId}`);
    };

    render() {
        const { props: { returnDom } } = this;
        return <Modal visible={this.props.show}
                      returnDom={returnDom}
                      header={<div className={styles.modal__header}>请先选择要创建的视频类型</div>}
                      className={styles.chooseBlank} onCancel={this.props.closeModal}>
            <div className={`${styles.initModal}`}>
                <div className={styles.content}>
                    <div className={styles.left} onClick={() => this.init(2)}>
                        <div className={`${styles.vertical}`}><Icon type="eqf-plus" /></div>
                        <p>9:16</p>
                    </div>
                    <div className={`${styles.right}`} onClick={() => this.init(1)}>
                        <div className={`${styles.horizontal}`}>
                            <Icon type="eqf-plus" />
                        </div>
                        <p>16:9</p>
                    </div>
                </div>
                <div className={styles.line}></div>
                <div className={styles.bottom}>
                    <img className={styles.qrcode} src={QrImg}/>
                    <div className={styles.desc}>
                        <p>扫码添加易企秀小助手</p>
                        <p>进群获取更多福利</p>
                    </div>
                </div>
            </div>
        </Modal>;
    }
}


export function waitChooseVideoType(props) {
    const viewHeight = document.body.clientHeight;
    return new Promise((resolve, reject) => {
        const dom = document.createElement('div');
        dom.id = 'choseModel';
        dom.className = styles.outer;
        document.body.append(dom);
        const onConfirm = (id) => {
            document.body.removeChild(dom);
            resolve(id);
        };
        const close = () => {
            document.body.removeChild(dom);
            reject();
        };
        const tProps = {
            ...props,
            show: true,
            returnDom: true,
            retrunChoose: onConfirm,
            closeModal: close,
        };
        ReactDOM.render(<div style={{
            backgroundColor: '#fff',
            top: viewHeight / 2 - 100,
            position: 'absolute',
        }}><ChooseVideoType {...tProps} />
        </div>, dom);
    });
}
