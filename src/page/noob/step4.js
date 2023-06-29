import React from 'react';
import styles from './index.less';
import { routerRedux } from 'dva/router';
import { connect } from 'dva';
import yiPng from '../static/noob/step4_yi.png';
import { CSSTransition } from 'react-transition-group';
import { prev } from '../../config/env';
import { NOOD_GUIDE_TEMPLATE_ID } from '../../config/staticParams';
import Button from '../components/Button';


@connect(({ noobGuide }) => ({
    noobGuide,
}))
class NoobStepFour extends React.PureComponent {

    constructor(props) {
        super(props);
    }

    state = {
        yi: false,
    };

    componentDidMount() {
        this.setState({ yi: true });
    }

    componentDidUpdate() {

    }

    onChose = () => {
        const { props: { next, dispatch } } = this;
        next();
        dispatch(routerRedux.push(`${prev}/editor/${NOOD_GUIDE_TEMPLATE_ID}`));
    };

    onPrev = () => {
        this.props.prev();
    };

    onSubmit = () => {
        const { props: { dispatch, next, close } } = this;
        dispatch({
            type: 'editor/saveOrRender',
            payload: {
                onlySave: false,
                oriTemplateId: NOOD_GUIDE_TEMPLATE_ID,
            },
        })
            .then(res => {
                if (res) {
                    dispatch(routerRedux.push(`${prev}/scene`));
                    next();
                } else {
                    close();
                }
            });
    };

    render() {
        const { state: { yi }, onSubmit, onPrev } = this;
        return (
            <div className={styles.step_4}>
                <div className={styles.outer}>
                    <div className={styles.horn} />
                    <div className={`${styles.bubble} ${styles.big}`}>
                        <div className={styles.bigYi}>
                            <CSSTransition in={yi} classNames='up' timeout={200}>
                                <img src={yiPng} className={styles.yi} />
                            </CSSTransition>
                            <p>第三步：赶快点击生成吧</p>
                        </div>
                    </div>
                    {/*<Button className={styles.prev} onClick={onPrev}>上一步</Button>*/}
                </div>
                <div className={styles.inner}>
                    <Button onClick={onSubmit}>生成视频</Button>
                </div>
            </div>
        );
    }
}


export default NoobStepFour;
