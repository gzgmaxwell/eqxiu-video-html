import React from 'react';
import styles from './soundSpeed.less';
import Silder from '../../../components/slider';
import { VOICE_JSON } from '../../../../config/staticParams';
import { connect } from 'dva';

@connect(({ typeMonkey }) => ({ typeMonkey }))
export default class SoundSpeed extends React.Component {
    constructor(props) {
        super(props);
        const { typeMonkey } = props;
        this.state = {
            speedRatio: '',
            voiceName: '',
        };
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        const { typeMonkey } = nextProps;
        const newState = {};
        newState.speedRatio = typeMonkey.voiceSpeed;
        newState.voiceName = typeMonkey.voiceType;
        newState.typeMonkeyVoice = typeMonkey.typeMonkeyVoice;
        return newState;
    }

    componentDidMount() {
    }

    changeVoiceSpeed = (e, data) => {
        this.props.dispatch({
            type: 'typeMonkey/save',
            payload: {
                voiceSpeed: data.value,
                time: [],
                videoDuration: 0,
                voiceover: null,
                animationStyle: null,
            },
        });
    };
    choiceVoice = (e, data) => {
        this.props.dispatch({
            type: 'typeMonkey/save',
            payload: {
                voiceType: data.voiceName,
                time: [],
                videoDuration: 0,
                voiceover: null,
                animationStyle: null,
            },
        });
    };

    render() {
        const { state } = this;
        const marks = {
            0.75: 0.75,
            1: 1,
            1.25: 1.25,
            1.5: 1.5,
            1.75: 2,
        };
        return (
            <div className={styles.wrap}>
                <p className={styles.rhythm}>变速</p>
                <div className={styles.voiceSpeedWrap}>
                    <Silder marks={marks} value={state.speedRatio} step={null}
                            min={0.75} max={1.75} tooltipVisible={false}
                            included={false}
                            onChange={(value) => this.changeVoiceSpeed({},
                                { value: value === 1.75 ? 2 : value })}/>
                </div>
                <p className={styles.addColor}>变声</p>
                <div className={styles.voiceWrap}>
                    {state.typeMonkeyVoice && state.typeMonkeyVoice.map((v, i) =>
                        <div key={i}
                             onClick={(e) => this.choiceVoice(e, v)}
                             className={`${styles.voiceList}
                             ${state.voiceName === v.voiceName
                               ? styles.activeVoiceList
                               : ''}`}>{v.name}</div>,
                    )}

                </div>
            </div>
        );
    }
}
