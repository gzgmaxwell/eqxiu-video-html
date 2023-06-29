import React from 'react';
import styles from './index.less';
import { connect } from 'dva';
import yiPng from '../static/noob/step5_yi.png';
import { CSSTransition } from 'react-transition-group';
import { prev } from '../../config/env';
import Button from '../components/Button';
import Icon from '../components/Icon';


const isScene = (pathname) => {
    return pathname === `${prev}/scene`;
};

@connect(({ noobGuide }) => ({
    noobGuide,
}))
class NoobStepFive extends React.PureComponent {

    constructor(props) {
        super(props);
        this.listDiv = React.createRef();
    }

    state = {
        yi: false,
    };


    componentDidMount() {
        const { noobGuide: { pathname } } = this.props;
        if (isScene(pathname)) {
            this.setState({ yi: true });
        }

    }


    onEnd = () => {
        const { onEnd = () => {} } = this.props;
        onEnd();
    };


    render() {
        const { state: { yi }, onEnd, props: { noobGuide: { pathname } } } = this;
        if (!isScene(pathname)) {
            return null;
        }
        return (
            <div className={styles.step_5}>
                <Icon type='eqf-yes-f' className={styles.icon}/>
                <span className={styles.title}>恭喜你，已经学会了视频的基础编辑功能！</span>
                <p className={styles.info}>更多功能，轻松编辑视频，期待您的体验。</p>
                <Button className={styles.next} onClick={onEnd}>朕知道了</Button>
                <CSSTransition in={yi} classNames='up' timeout={400}>
                    <img src={yiPng} className={styles.yi}/>
                </CSSTransition>
            </div>
        );
    }
}


export default NoobStepFive;
