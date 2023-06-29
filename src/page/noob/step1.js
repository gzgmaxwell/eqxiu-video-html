import React from 'react';
import styles from './index.less';
import Button from '../components/Button';
import { connect } from 'dva';
import yiPng from '../static/noob/step1_yi.png';
import { CSSTransition } from 'react-transition-group';
import { genVideoUrl } from '../../util/file';
import { genUrl } from '../../util/image';
import Fade from '../components/transition/fade';


@connect(({ noobGuide }) => ({ noobGuide }))
class NoobStepOne extends React.PureComponent {

    state = {
        yi: false,
    };

    componentDidMount() {
        this.setState({ yi: true });
    }

    autoPlay = (e) => {
        e.target.play();
    };

    render() {
        const { props: { noobGuide: { previewUrl, coverImg }, next, close, ...props }, state: { yi } } = this;
        return (<div className={styles.step_1}>
            <div className={styles.outer}>
                <CSSTransition in={yi} classNames='step1-up' timeout={200}>
                    <img src={yiPng} className={styles.yi}/>
                </CSSTransition>
                <Fade in={yi} dur={300}>
                    <div className={`${styles.bubble} ${styles.small}`}/>
                </Fade>
                <Fade in={yi} dur={600}>
                    <div className={`${styles.bubble} ${styles.middle}`}/>
                </Fade>
                <Fade in={yi} dur={800}>
                    <div className={`${styles.bubble} ${styles.big}`}>
                        <p>小易教你一分钟做视频</p>
                        <p>轻松三步走，好视频到手</p>
                    </div>
                </Fade>
            </div>
            <div className={styles.inner}>
                <video height={309} width={552} style={{ background: '#000' }}
                       src={genVideoUrl(previewUrl)} onCanPlay={this.autoPlay}
                       muted
                       crossOrigin='Anonymous'
                       controls={true}
                       poster={genUrl(coverImg, '309:552')}/>
                <div className={styles.bottom}>
                    <Button onClick={next}>马上制作</Button>
                    <Button onClick={close}>残忍拒绝</Button>
                </div>
            </div>
        </div>);
    }
}


export default NoobStepOne;
