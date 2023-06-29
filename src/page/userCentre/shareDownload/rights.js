import React from 'react';
import { host } from 'Config/env';
import { message } from 'antd';
import { XIU_DIAN } from '../../../config/staticParams';
import { RENDER_VIDEO_GOODS_ID } from '../../../config/staticParams/goodsParams';
import { sendBDEvent } from '../../../services/bigDataService';
import { statistics } from '../../../api/user';

class Rights extends React.PureComponent {
    constructor(props) {
        super(props);
        this.iframe = React.createRef();
        this.state = {
            iframeHeight: 360,
            iframeWidth: 600,
        };
    }

    componentDidMount() {
        sendBDEvent({
            position: '单次购买权益',
            type: '打开',
        });
        window.addEventListener('message', this.onMessage);
    }

    componentWillUnmount() {
        window.removeEventListener('message', this.onMessage);
    }


    onMessage = (e) => {

        try {
            const data = e.data;
            if (data.msgType === 'done') {
            } else if (data.msgType === 'resize') {
                this.setState({ ...data.msgType.data });
            } else if (data.msgType === 'close') {
                this.props.onClose();
            } else if (data.msgType === 'success') {
                sendBDEvent({
                    position: '单次购买权益',
                    type: '购买成功',
                });
                const { props: { videoId, source, type, params: { orderAmount } = {} } } = this;
                const { data: { obj: { merchantOrderNo: outOrderId = null } = {} } = {} } = data;
                const sendParams = {
                    videoId,
                    source,
                    goodsType: type,
                    amount: orderAmount * 100,
                    type: 2,
                    outOrderId,
                };
                statistics(sendParams);
                this.props.onClose();
                this.props.onDownLoadHd();
            } else if (data.msgType === 'error') {
                message.error(data.data.msg || '支付失败');
            }
        } catch (err) {
            console.error(err);
        }
    };


    onSendParam = () => {
        const { props } = this;
        const { params: outParams } = props;
        const item = props.goods.find(v => v.id === outParams.orderProductId);
        const params = {
            goods: [
                {
                    id: item.id, // 商品ID；
                    type: item.type, //  可选，商品类型，消耗优惠券
                    name: outParams.productName, // 商品名称；
                    price: outParams.orderAmount, // 商品价格；
                    count: outParams.count || 1,
                },
            ],
            params: { // 发送给接口的数据，可从各业务线签名接口中的数据找对应关系
                sign: props.sign,
                orderAppId: XIU_DIAN.orderAppId,
                productCode: XIU_DIAN.productCode,
                returnUrl: outParams.returnUrl, 
                notifyUrl: outParams.notifyUrl,
                orderTradeId: outParams.orderTradeId,
            },
        };
        this.iframe.current.contentWindow.postMessage(params, '*');
    };

    render() {
        const { state: { iframeHeight, iframeWidth }, props } = this;
        const style = {
            width: iframeWidth,
            height: iframeHeight,
        };
        return (
            <iframe src={`${host.xdCost}`} {...style} ref={this.iframe}
                    onLoad={this.onSendParam}
            />
        );
    }
}


export default Rights;
