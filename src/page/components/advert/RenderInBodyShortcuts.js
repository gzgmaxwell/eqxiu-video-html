import React, { Component } from 'react';
import ReactDom from 'react-dom';

export default class RenderInBodyShortcuts extends Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() { // 新建一个div标签并塞进body
        this.popup = document.createElement('div');
        const dom = this.popup;
        dom.id = 'shortcuts';
        this.popup.style.position = 'fixed';
        this.popup.style.width = '260px';
        this.popup.style.height = '634px';
        this.popup.style.zIndex = '999';
        this.popup.style.left = '68px';
        this.popup.style.bottom = '12px';
        document.body.appendChild(this.popup);
        this._renderLayer();
    }

    componentDidUpdate() {
        this._renderLayer();
    }

    componentWillUnmount() { // 在组件卸载的时候，保证弹层也被卸载掉
        ReactDom.unmountComponentAtNode(this.popup);
        document.body.removeChild(this.popup);
    }

    _renderLayer() { // 将弹层渲染到body下的div标签
        ReactDom.render(this.props.children, this.popup);
       /* setTimeout(()=>{
            const dom = document.getElementById('shortcuts');
            if (this.props.shortcut) {
                dom.style.display = 'block';
            } else {
                dom.style.display = 'none';
            }
        },20);*/

    }

    render() {
        return null;
    }
}
