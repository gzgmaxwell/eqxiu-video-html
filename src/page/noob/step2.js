import React from 'react';
import styles from './index.less';
import { routerRedux } from 'dva/router';
import { connect } from 'dva';
import yiPng from '../static/noob/step2_yi.png';
import { CSSTransition } from 'react-transition-group';
import Card from '../index/card/horzCard';
import { prev } from '../../config/env';
import { NOOD_GUIDE_TEMPLATE_ID } from '../../config/staticParams';
import Fade from '../components/transition/fade';
import { getElementTop } from '../../util/doc';


@connect(({ noobGuide }) => ({ noobGuide }))
class NoobStepTwo extends React.PureComponent {

    state = {
        yi: false,
    };

    componentDidMount() {
        this.setState({ yi: true });
        document.getElementById('video-container').scrollTop = 200;
    }


    onChose = () => {
        const { props: { next, dispatch } } = this;
        next();
        dispatch(routerRedux.push(`${prev}/editor/${NOOD_GUIDE_TEMPLATE_ID}`));
    };

    render() {
        const { props: { noobGuide, next, close, ...props }, state: { yi }, onChose } = this;
        const CardProps = {
            ...noobGuide,
            onChose,
        };
        let top = 374;
        const emptyDiv = document.querySelector('#empty_create');
        if (emptyDiv) {
            top = getElementTop(emptyDiv) - 200;
        }
        return (
            <div className={styles.step_2} style={{ top }}>
                <div className={styles.outer}>
                    <CSSTransition in={yi} classNames='step2-up' timeout={200}>
                        <img src={yiPng} className={styles.yi}/>
                    </CSSTransition>
                    <Fade in={yi} dur={300}>
                        <div className={`${styles.bubble} ${styles.middle}`}/>
                    </Fade>
                    <Fade in={yi} dur={600}>
                        <div className={`${styles.bubble} ${styles.big}`}>
                            <p>第一步：鼠标滑过模板，点击立即使用</p>
                        </div>
                    </Fade>
                </div>
                <div className={styles.inner}>
                    <Card {...CardProps}/>
                </div>
            </div>
        );
    }
}


export default NoobStepTwo;
