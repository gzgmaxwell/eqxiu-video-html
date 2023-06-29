import React, { Component } from 'react';
import ReactDom from 'react-dom';
import { TYPE_RENDER_IN_BODY } from '../../../../config/staticParams/goodsParams';

export default class RenderInBody extends Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() { // 新建一个div标签并塞进body
        const { props: { type = TYPE_RENDER_IN_BODY.videoCuts } } = this;
        this.popup = document.createElement('div');
        const dom = this.popup;
        dom.id = 'cutBox';
        if (type === TYPE_RENDER_IN_BODY.videoCuts) {
            this.popup.style.position = 'fixed';
            this.popup.style.width = '100vw';
            this.popup.style.height = '100vh';
            this.popup.style.overflow = 'hidden';
            this.popup.style.zIndex = '999';
            this.popup.style.top = '-100%';
            this.popup.style.left = '0';
            this.popup.style.transition = 'all linear 0.2s';
            this.popup.style.background = 'rgba(255,255,255,1)';
        } else if (type === TYPE_RENDER_IN_BODY.shortcuts) {
            this.popup.style.position = 'fixed';
            this.popup.style.overflow = 'hidden';
            this.popup.style.width = '260px';
            this.popup.style.height = '634px';
            this.popup.style.zIndex = '999';
            this.popup.style.left = '68px';
            this.popup.style.bottom = '12px';
        }
        document.body.appendChild(this.popup);
        this._renderLayer();
    }

    componentDidUpdate() {
        this._renderLayer();
    }

    componentWillUnmount() { // 在组件卸载的时候，保证弹层也被卸载掉
        const { props: { type = TYPE_RENDER_IN_BODY.videoCuts } } = this;
        ReactDom.unmountComponentAtNode(this.popup);
        if (type === TYPE_RENDER_IN_BODY.videoCuts) {
            const newDom = document.getElementById('cutBox');
            newDom.style.transition = 'all linear 0.2s';
            newDom.style.top = '-100%';
            setTimeout(() => {
                document.body.removeChild(this.popup);
            }, 180);
        } else {
            document.body.removeChild(this.popup);
        }

    }

    _renderLayer() { // 将弹层渲染到body下的div标签
        const { props: { type = TYPE_RENDER_IN_BODY.videoCuts } } = this;
        ReactDom.render(this.props.children, this.popup);
        if (type === TYPE_RENDER_IN_BODY.videoCuts) {
            setTimeout(() => {
                const newDom = document.getElementById('cutBox');
                newDom.style.transition = 'all linear 0.2s';
                newDom.style.top = '0';
            }, 5);
        }
    }

    render() {
        return null;
    }
}
