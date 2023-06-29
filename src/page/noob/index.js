import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'dva';
import styles from './index.less';
import NoobStepOne from './step1';
import NoobStepTwo from './step2';
import NoobStepThree from './step3';
import NoobStepFour from './step4';
import NoobStepFive from './step5';
import { sendBDEvent } from '../../services/bigDataService';

const stepList = {
    1: { component: NoobStepOne },
    2: { component: NoobStepTwo },
    3: { component: NoobStepThree },
    4: { component: NoobStepFour },
    5: { component: NoobStepFive },
};

@connect(({ noobGuide, user }) => ({
    noobGuide,
    user,
}))
class NoobGuide extends React.PureComponent {


    state = {
        hide: true,
        step: 1,
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        const newState = { ...prevState };
        const { noobGuide: { isNoob = false } = {}, history: { action } = {} } = nextProps;
        if (isNoob) {
            newState.hide = false;
        } else {
            newState.hide = true;
        }
        return newState;
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.noobGuide.isNoob && this.props.history
            && this.props.history.action === 'POP' && this.state.step > 2) {
            if (this.state.step === 5) {
                this.onEnd();

            } else {
                this.props.dispatch({
                    type: 'noobGuide/close',
                });
            }
        }
    }

    prev = () => {
        const { step } = this.state;
        if (stepList[step - 1]) {
            this.setState({ step: step - 1 });
        }
    };

    next = () => {
        const { step } = this.state;
        if (stepList[step + 1]) {
            this.setState({ step: step + 1 });
        }
    };

    onEnd = () => {
        const { props: { dispatch } } = this;
        sendBDEvent({
            position: '新手引导',
            type: '通过',
        });
        dispatch({
            type: 'noobGuide/passed',
        });
    };

    close = () => {
        const { props: { dispatch } } = this;
        this.setState({ hide: true });
        sendBDEvent({
            position: '新手引导',
            type: '取消',
        });
        dispatch({
            type: 'noobGuide/cancel',
        });
    };

    render() {
        const { state: { step, hide }, next, close, prev, onEnd, props: { history: { location, ...history } = {} }, ...props } = this;
        if (hide) {
            return null;
        }
        const childProps = {
            next,
            close,
            onEnd,
            prev,
            location,
            ...props,
        };
        const Children = stepList[step] && stepList[step].component;
        if (!Children) return null;
        const dom = (<div className={styles.noobGuide}>
            <div className={styles.shade}/>
            <div className={styles.content}>
                <Children {...childProps}/>
            </div>
        </div>);
        return ReactDOM.createPortal(dom, document.body);
    }
}


export default NoobGuide;
