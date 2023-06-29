import React from 'react';
import { LinearCopy } from 'gl-react';
import { Surface } from 'gl-react-dom';
import GLTransition from 'react-gl-transition';
import GLTransitions from 'gl-transitions';
import TRANSITIONS from '../../../dataBase/transitions';
import { WORKSPACE_SIZE } from '../../../config/staticParams';

const time = 1;

// todo: LinearCopy 无法新建


class Transition extends React.Component {
    constructor(props) {
        super(props);
        this.toVideo = React.createRef();
        this.fromVideo = React.createRef();
    }


    state = {
        progress: 0,
        readyVideo: 0,
        status: 0,
    };

    componentDidMount() {

    }

    canPlay = (e) => {
        setTimeout(() => {
            this.fromVideo.current.play();
        }, 300);
        this.setState({
            readyVideo: this.state.readyVideo + 1,
        });
    };


    firstEnd = (e) => {
        if (!this.timer && this.fromVideo.current.duration) {
            const { currentTime, duration } = this.fromVideo.current;
            this.timer = setTimeout(() => {
                this.toVideo.current.play();
                this.timer = setInterval(
                    () => this.setState({ progress: this.state.progress + (time / 1000 * 10) }),
                    10);
            }, (duration - currentTime - time) * 1000);
        }
    };

    render() {
        const { state: {}, props: { from, to, duration, type, transverse, progress } } = this;
        const glProgress = Math.min(1, Math.max(0, progress)); // 用于预览
        if (!TRANSITIONS[type]) {
            throw new Error('无效的转场');
        }
        const bodyStyle = { // 外框的属性
            width: transverse ? WORKSPACE_SIZE.l : WORKSPACE_SIZE.s,
            height: transverse ? WORKSPACE_SIZE.s : WORKSPACE_SIZE.l,
        };
        const transition = GLTransitions[TRANSITIONS[type].glsIndex];
        return (
            <Surface width={bodyStyle.width} height={bodyStyle.height}>
                <GLTransition
                    from={from}
                    to={to}
                    progress={glProgress}
                    transition={transition}
                />
            </Surface>
        );
    }
}


export default Transition;
