import React from 'react';
import styles from './operateSide.less';
import Icon from '../components/Icon';
import { Tooltip } from 'antd';
import { connect } from 'dva';
import { isMac } from '../../util/util';
import eventEmitter from '../../services/EventListener';


@connect(({ workspace, editor }) => ({
    workspace,
    editor,
}))
class OperateSide extends React.Component {
    constructor(props) {
        super(props);
        this.prevCanvas = React.createRef();
    }

    state = {
        layerMgr: false, // 图层显示
    };

    componentDidMount() {
        eventEmitter.on('activeLayerMgr', this.activeLayerMgr);
    }

    componentWillUnmount() {
        eventEmitter.removeListener('activeLayerMgr', this.activeLayerMgr);
    }

    activeLayerMgr = () => {
        this.setState({ layerMgr: !this.state.layerMgr });
    };

    handleBack = (back) => {
        this.props.dispatch({
            type: 'workspace/changeHistory',
            back,
        });
    };
    handleLayerMgr = () => {
        eventEmitter.emit('activeLayerMgr');
    };

    handleScale = (scale) => {
        this.props.dispatch({
            type: 'editor/changeScale',
            payload: { scale },
        });
    };
    /**
     * 点击预览
     * @constructor
     */
    preview = () => {
        this.setState({
            openPreviewModal: true,
        });
    };
    /**
     * 关闭预览
     * @constructor
     */
    onCloseModal = () => {
        this.setState({
            openPreviewModal: false,
        });
    };
    render() {
        const { state, props } = this;
        const { history } = props.workspace;
        const { positionScale = 1 } = props.editor;
        const { isFirstPos, isLastPos } = history || {};
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
                    <Tooltip placement="left" title={state.layerMgr ? '隐藏图层面板' : '显示图层面板'}
                             overlayClassName={styles.tooltip}>
                        <Icon onClick={this.handleLayerMgr}
                              type='eqf-layers-l'
                              className={[styles.layer__mgr, state.layerMgr && styles.onSelected]}/>
                    </Tooltip>
                    <Tooltip placement="left" title={`放大 ${isMac ? '⌘＋' : 'Ctrl ＋'}`}
                             overlayClassName={styles.tooltip}>
                        <Icon onClick={positionScale >= 3 ? null : () => this.handleScale(+0.05)}
                              type='eqf-plus'
                              className={[
                                  styles.layer__scale,
                                  state.layerMgr && styles.onSelected]}/>
                    </Tooltip>
                    <div className={styles.scaleValue}>{Math.round(positionScale * 100)}%</div>
                    <Tooltip placement="left" title={`缩小 ${isMac ? '⌘－' : 'Ctrl －'}`}
                             overlayClassName={styles.tooltip}>
                        <Icon onClick={positionScale <= 0.5 ? null : () => this.handleScale(-0.05)}
                              type='eqf-minus'
                              className={[
                                  styles.layer__scale,
                                  state.layerMgr && styles.onSelected]}/>
                    </Tooltip>
                </div>
            </div>
        );
    }
}

export default OperateSide;
