import React from 'react';
import styles from './operateSide.less';
import Icon from 'Components/Icon';
import { Tooltip } from 'antd';
import { connect } from 'dva';
import { isMac } from '../../../../util/util';


@connect(({ subtitles }) => ({ subtitles }))
class OperateSide extends React.Component {
    constructor(props) {
        super(props);
    }

    state = {
    };

    handleBack = (back) => {
        this.props.dispatch({
            type: 'subtitles/changeHistory',
            back,
        });
    };

    render() {
        const { state, props } = this;
        const { isFirstPos, isLastPos } = props.subtitles.history || {};
        return (
            <div className={styles.operateBox}>
                <div className={styles.list}>
                    <Tooltip placement="left" title={`撤销 ${isMac ? '⌘Z' : 'Ctrl Z'}`}
                             overlayClassName={styles.tooltip}>
                        <Icon onClick={isFirstPos ? null : () => this.handleBack(true)}
                              type='eqf-back'
                              className={[styles.eqf_back, isFirstPos && styles.disabled]}/>
                    </Tooltip>
                    <Tooltip placement="left" title={`恢复 ${isMac ? '⌘Y' : 'Ctrl Y'}`}
                             overlayClassName={styles.tooltip}>
                        <Icon onClick={isLastPos ? null : () => this.handleBack(false)}
                              type='eqf-rework'
                              className={[styles.eqf_rework, isLastPos && styles.disabled]}/>
                    </Tooltip>
                    {/*<Tooltip placement="left" title='预览' overlayClassName={styles.tooltip}>*/}
                        {/*<Icon type='eqf-play'*/}
                              {/*className={styles.eqf_play}/>*/}
                    {/*</Tooltip>*/}
                </div>
            </div>
        );
    }
}

export default OperateSide;
