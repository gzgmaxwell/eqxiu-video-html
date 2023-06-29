import React from 'react';
import qs from 'qs';
import { host } from 'Config/env';
import ReactDOM from 'react-dom';
import PropsTypes from 'prop-types';
import Modal from './modal';
import styles from './vip.less';
import { sendBDEvent } from '../../services/bigDataService';
import { statistics } from '../../api/user';
import { isChuangYiyunVip } from '../../models/User';
import { message } from 'antd';
import { getGoodsInfoByTemplateId } from '../../api/template';
import { name } from '../../config/env';
import { setUserSetting } from '../../util/storageLocal';
import { connect } from 'dva';
import { addMemberPurchaseRecord } from '../../api/userVideo';

const beneFitIds = ['pre', 'pro'].includes(name) ? {
    sd: 88,
    hd: 90,
} : {
    sd: 160,
    hd: 162,
};
export const getBuyKey = () => {
    const { id: userId } = window._dva_app._store.getState().user;
    return `buyChuangyiyun-${userId}`;
};

class Vip extends React.PureComponent {
    constructor(props) {
        super(props);
        this.iframe = React.createRef();

        this.params = {
            sourceFrom: 7, // 产品线标识
            benefitId: props.benefitId || beneFitIds[props.benefit],
        };
    }

    componentDidMount() {
        const { templateId } = this.props;
        this.handleBeVip();
        sendBDEvent({
            position: '购买创意云会员',
            type: '打开',
        });
        window.addEventListener('message', this.onMessage);
        if (templateId && ![1, 2].includes(templateId)) {
            getGoodsInfoByTemplateId(templateId)
                .then(
                    ({ data: { success, obj: { goodsId: sourceProductId, userId: sourceId } } }) => {
                        if (success) {
                            this.params = {
                                ...this.params,
                                sourceProductId,
                                sourceId,
                            };

                            this.forceUpdate();
                        }
                    });
        }
    }

    componentWillUnmount() {
        window.removeEventListener('message', this.onMessage);
    }

    onMessage = (e) => {
        if (typeof e.data !== 'string') {
            // message.warn('postMessage\'s e.data is not string of pay');
            return;
        }
        try {
            const data = JSON.parse(e.data);
            if (data.msgType === 'success') {
                const { props: { videoId = 0, source } } = this;
                const { data: { name, price: amount, orderId: outOrderId } } = data;
                const sendParams = {
                    videoId,
                    source,
                    goodsType: name,
                    amount,
                    type: 1,
                    outOrderId,
                };
                statistics(sendParams);
                sendBDEvent({
                    position: '购买创意云会员',
                    type: '成功',
                });
                setUserSetting(getBuyKey(), Date.now());
                this.props.onSuccess(data.msgType);
            } else if (data.msgType === 'close') {
                this.props.onClose();
            } else if (data.msgType === 'fail') {
                message.error('创意云会员开通失败');
            } else if (data.msgType === 'load') {
                this.height = data.data.height;
            }
        } catch (err) {
            console.log(err);
        }
    };

    handleBeVip = () => {
        const userObj = window._dva_app._store.getState().user;
        const json = {
            clickPosition: this.props.clickPosition,
            phone: userObj.phone,
            userName: userObj.name,
            videoId: this.props.videoId,
        };
        addMemberPurchaseRecord(json)
            .then((res) => {
                const { data: { success } } = res;
                if (success) {
                    console.log('会员位置记录成功');
                }
            });
    };


    render() {
        const { props: { returnDom = false, ...props } } = this;
        const src = `${host.malPayMember}?${qs.stringify(this.params)}`;
        const dom = (<iframe src={src} style={{
            width: '600px',
            height: '600px',
        }} ref={this.iframe}/>);
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

Vip.propTypes = {
    onSuccess: PropsTypes.func,
    onClose: PropsTypes.func,
    text: PropsTypes.oneOfType([
        PropsTypes.string,
        PropsTypes.element,
    ]),
    type: PropsTypes.string,
    inconclass: PropsTypes.string,
    benefitId: PropsTypes.oneOfType([PropsTypes.string, PropsTypes.number]),
};

export function ComVip(props) {
    const { isVip = false } = props;
    const promise = new Promise((resolve, reject) => {
        const dom = document.createElement('div');
        dom.id = 'choseModel';
        dom.className = styles.outer;
        document.body.append(dom);
        const onConfirm = (data) => {
            document.body.removeChild(dom);
            let msg = '创意云会员开通成功';
            if (isVip) {
                msg = '创意云会员续费成功';
                sendBDEvent({
                    position: '视频预览-会员续费',
                    type: '会员续费成功',
                });
            }
            message.success(msg);
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
        dom.onclick = close;
        ReactDOM.render(<div style={{
            backgroundColor: '#fff',
        }}><Vip {...tProps} />
        </div>, dom);
    });
    return promise;
}

export default Vip;

