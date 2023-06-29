import React from 'react';
import { connect } from 'dva';

const regexp = (path) => {
    const regu = /^\/templateShow/;
    const re = new RegExp(regu);
    return re.test(path);
};

@connect(({ user }) => ({ user }))
class Footer extends React.PureComponent {


    componentDidMount() {
        this.showHeader();
    }


    showHeader() {
        if (window.footerComps) {
            window.footerComps.style.display = 'block';
        } else if (window.eqxLayout) {
            window.eqxLayout.render('footer', {
                showFriendLinks: true,  // 是否显示友情链接
                background: '#344159',
            });
            window.footerComps = document.getElementById('container')
                .getElementsByClassName('eqx-footer')[0];
        }
    }

    componentWillUnmount() {
        if (window.footerComps) {
            window.footerComps.style.display = 'none';
        }
    }

    componentDidUpdate() {
        this.showHeader();
    }


    render() {
        return null;
    }
}


@connect(({ user }) => ({ user }))
class FooterLite extends React.PureComponent {


    componentDidMount() {
        this.showHeader();
    }


    showHeader() {
        if (window.footerCompslite) {
            window.footerCompslite.style.display = 'block';
        } else if (window.eqxLayout) {
            window.eqxLayout.render('footer-lite');
            window.footerCompslite = document.getElementById('container')
                .getElementsByClassName('eqx-footer-lite')[0];
        }
    }

    componentWillUnmount() {
        if (window.footerCompslite) {
            window.footerCompslite.style.display = 'none';
        }
    }

    componentDidUpdate() {
        this.showHeader();
    }


    render() {
        return null;
    }
}

export default Footer;
export { FooterLite };
