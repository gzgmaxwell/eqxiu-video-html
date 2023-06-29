import React from 'react';
import styles from './index.less';
import { routerRedux } from 'dva/router';
import { connect } from 'dva';
import yiPng from '../static/noob/step3_yi.png';
import { CSSTransition } from 'react-transition-group';
import { prev } from '../../config/env';
import { NOOD_GUIDE_TEMPLATE_ID } from '../../config/staticParams';
import MateriaList from '../editor/right/materiaList';
import Button from '../components/Button';
import Fade from '../components/transition/fade';

const materialDivForNoob = document.getElementById('materialDivForNoob') &&
    document.getElementById('materialDivForNoob')
        .getBoundingClientRect() || { y: 240 };

@connect(({ noobGuide, workspace }) => ({
    noobGuide,
    workspace,
}))
class NoobStepThree extends React.Component {

    constructor(props) {
        super(props);
        this.changeActive = null;
        this.listDiv = React.createRef();
    }

    state = {
        yi: false,
    };

    componentDidMount() {
        this.setState({ yi: true });
    }

    componentDidUpdate() {
        const { workspace: { activeIndex = null, dataList = [] } = {}, dispatch } = this.props;
        if (activeIndex !== 1 && dataList.length > 1 ) {
            dispatch({
                type: 'workspace/changeActive',
                payload: { index: 1 },
            });
        }
    }

    onChose = () => {
        const { props: { next, dispatch } } = this;
        next();
        dispatch(routerRedux.push(`${prev}/editor/${NOOD_GUIDE_TEMPLATE_ID}`));
    };

    onNext = () => {
        this.props.next();
    };

    render() {
        const { props: { noobGuide, next, close, ...props }, state: { yi }, onChose, onNext } = this;
        const CardProps = {
            onChose,
        };
        let buttonTop = 364;
        if (this.listDiv.current) {
            buttonTop = Math.max(this.listDiv.current.offsetHeight + 20, buttonTop);
        }

        return (
            <div className={styles.step_3} style={{ top: 154 }}>
                <div className={styles.outer}>
                    <CSSTransition in={yi} classNames='up' timeout={200}>
                        <img src={yiPng} className={styles.yi} />
                    </CSSTransition>
                    <Fade in={yi} dur={300}>
                        <div className={`${styles.bubble} ${styles.middle}`} />
                        <Button className={styles.next} onClick={onNext}>下一步</Button>
                    </Fade>
                    <Fade in={yi} dur={600}>
                        <div className={`${styles.bubble} ${styles.big}`}>
                            <p>第二步：敲敲键盘，替换视频内图文</p>
                        </div>
                    </Fade>
                   
                </div>
                <div className={styles.inner} ref={this.listDiv}>
                    <MateriaList onlyList={true} />
                </div>
            </div>
        );
    }
}


export default NoobStepThree;
