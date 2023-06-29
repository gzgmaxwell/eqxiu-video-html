import React from 'react';
import { TRANSITIONS, TRANSITIONS_DURATION } from '../../../dataBase/transitions';
import {
    CANVAS_TYPE,
    LEFT_PARTY_SIZE, MIN_CONCAT_TIME,
    WORKSPACE_SIZE,
    WORKSPACE_Z_INDEX, WorkspaceVideoType,
} from '../../../config/staticParams';
import styles from '../LeftParty.less';
import { genUrl } from '../../../util/image';
import { Popover, Tooltip, message as antdMessage } from 'antd';
import { connect } from 'dva';
import qs from 'qs';
import Button from '../../components/Button';
import transitionImg from '../../static/icon/haveTransition.svg';
import noTransitionImg from '../../static/icon/noTransition.svg';
import Modal from '../../components/modal';
import TransitionPreview from '../left/transtitionPreview';
import EIcon from '../../components/Icon';
import ResizeText from '../centre/element/text';
import ResizeImg from '../centre/element/img';
import ResizeVideo from '../centre/element/video';
import eventEmitter from '../../../services/EventListener';
import { waitChoseModel } from '../../components/delete';
import noAllowTransition from '../../static/icon/noAllowTransition.svg';
import { createElement } from '../centre/workspace';


const clearDefault = { // 清除默认事件
    draggable: false,
};
const types = ['head', 'tail'];
const typeNames = {
    head: '片头',
    tail: '片尾',
};


@connect(({ headAndTail }) => ({ headAndTail }))
export default class HeadOrTail extends React.Component {

    constructor(props) {
        super(props);
        const { type } = props;
        if (!types.includes(type)) {
            throw new Error('无效的类型');
        }
        this.state = {
            type,
            data: {},
            transitionPreview: false,
        };
    }


    static getDerivedStateFromProps(nextProps, prevState) {
        const newState = { ...prevState };
        const data = nextProps.headAndTail[nextProps.type];
        newState.data = data;
        return newState;
    }

    componentDidCatch(e, s) {
        console.log(e);
        console.log(s);
    }

    onClick = (e) => {
    };
    handleChangeConcat = (key, value) => {
        const { dispatch } = this.props;
        const concatSet = { [key]: value };
        if (key === 'concatType' && value !== 'none') {
            concatSet.duration = (TRANSITIONS[value] || {}).defaultDuration || 800;
        }
        dispatch({
            type: 'headAndTail/changeConcatSet',
            payload: concatSet,
        });
    };
    drawPreview = (callback) => {
        const { props: { preParty = {} }, state: { data } } = this;
        const { uuid: preUUID, elementList: preElementList } = preParty;
        const { uuid, elementList } = data;
        this.props.dispatch({
            type: 'canvas/drawParties',
            payload: {
                dataList: preElementList,
                uuid: preUUID,
            },
        })
            .then(() => {
                this.props.dispatch({
                    type: 'canvas/drawParties',
                    payload: {
                        dataList: elementList,
                        uuid,
                    },
                })
                    .then(callback);
            });
    };
    openTransitions = (e) => {
        this.setState({ transitionPreviewModal: true });
        setTimeout(() => {
            this.drawPreview(() => this.setState({ transitionPreviewGL: true }));
        }, 100);
    };
    closeTransitions = (e) => {
        this.setState({
            transitionPreviewModal: false,
            transitionPreviewGL: false,
        });
    };
    concatTypes = [
        ...Object.values(TRANSITIONS)
            .map((v) => ({
                title: v.cname,
                value: v.value,
            })),
    ];
    onDelete = (e) => {
        const { dispatch, type } = this.props;
        dispatch({
            type: 'headAndTail/delete',
            payload: { type },
        });
    };

    onChange = (e) => {
        eventEmitter.emit('toggleActiveTab', [7, 2, 2]);
        antdMessage.info(`请在左侧面板选择您需要的${typeNames[this.props.type]}`);
    };
    apllyAllconcat = () => {
        const { props: { dispatch }, state: { data: { renderSetting = {} } } } = this;
        waitChoseModel({
            text: '确定将该转场设置应用于所有的转场吗？',
            type: 'eqf-why-f',
        })
            .then(() => {
                dispatch({
                    type: 'editor/onChangeAllConcatSet',
                    payload: { concatSet: renderSetting.concatSet },
                });
            });
    };

    initElementProps = (...params) => {
        const [{ headAndTail }, props] = params;
        const { type } = this.props;
        const { elementList: dataList } = headAndTail[type];
        const { uuid } = props;
        let index = null;
        const item = dataList.find((v, i) => {
            if (v.uuid === uuid) {
                index = i;
                return true;
            }
            return false;
        }) || {};
        const active = false;
        const paramsData = {
            width: item.width,
            height: item.height,
            rotate: item.rotate || 0,
            top: item.top || 0,
            left: item.left || 0,
            zIndex: WORKSPACE_Z_INDEX + index * 5, // 间隔5
        };
        const resizeprops = {
            ...props.resizeprops,
            paramsData,
            active,
            fixedaspectratio: item.resolutionW / item.resolutionH,
        };
        return {
            ...item,
            resizeprops,
        };
    };

    getPartyPre = () => {
        const { state: { data, type } } = this;
        const { transverse = true, uuid, active } = data;
        // 判断横竖版缩略图的宽高
        const width = transverse ? LEFT_PARTY_SIZE.l : LEFT_PARTY_SIZE.s;
        const height = transverse ? LEFT_PARTY_SIZE.s : LEFT_PARTY_SIZE.l;
        const activeWidth = transverse ? LEFT_PARTY_SIZE.activeL : LEFT_PARTY_SIZE.activeS;
        const activeHeight = transverse ? LEFT_PARTY_SIZE.activeS : LEFT_PARTY_SIZE.activeL;
        const proWidth = transverse ? WORKSPACE_SIZE.l : WORKSPACE_SIZE.s;
        const proHeight = transverse ? WORKSPACE_SIZE.s : WORKSPACE_SIZE.l;
        const scale = width / proWidth;
        const activeScale = activeWidth / proWidth;
        return (<div className={styles.partyPre}>
            <div className={styles.canvas}>
                <div key={uuid} style={{
                    width: active ? activeWidth : width,
                    height: active ? activeHeight : height,
                    transform: `scale(${active ? activeScale : scale})`,
                    transformOrigin: 'top left',
                }}>
                    <div style={{
                        width: proWidth,
                        height: proHeight,
                    }} className={styles.partyLi}>
                        {Array.isArray(data.elementList) &&
                        data.elementList.map((item, index) => {
                            if (item.type === undefined) {
                                const backgroundPicProps = { // 背景图的props
                                    src: genUrl(item.backgroundImg,
                                        `${proWidth}:${proHeight}:png:3`),
                                    style: { opacity: item.videoBackgroundPicOpacity },
                                };
                                return <div ref={this.background} key={'background'}
                                            style={{ backgroundColor: item.backgroundColor }}
                                            className={styles.background}>
                                    {item.backgroundImg ?
                                     <img {...clearDefault} {...backgroundPicProps}
                                          className={styles.videoBackgroundPic}
                                     /> : ''}
                                </div>;
                            }
                            const Element = createElement(item.type);
                            const resizeprops = { // 缩放组件的props
                                active: false,
                                paramsData: {
                                    width: item.width,
                                    height: item.height,
                                    rotate: item.rotate || 0,
                                    top: item.top || 0,
                                    left: item.left || 0,
                                    zIndex: WORKSPACE_Z_INDEX + index * 5, // 间隔5
                                },
                                limit: {
                                    width: [10],
                                    height: [10],
                                },
                                fixedaspectratio: item.resolutionW / item.resolutionH,
                            };
                            const itemProps = {
                                resizeprops,
                                elementprops: clearDefault,
                                ...item,
                                index,
                                initFunction: this.initElementProps,
                            };
                            return <Element key={`${item.uuid}-ele`} {...itemProps} />;
                        })}
                    </div>
                </div>
            </div>
            <div className={styles.name}>{typeNames[type]}</div>
            <div className={styles.mask}>
                <div className={styles.icons}>
                    <Tooltip placement="left" title='更换' overlayClassName={styles.tooltip}>
                        <div className={styles.iconContainer} onClick={this.onChange}>
                            <EIcon type="eqf-refresh-cw"/>
                        </div>
                    </Tooltip>
                    <Tooltip placement="left" title='删除' overlayClassName={styles.tooltip}>
                        <div className={styles.iconContainer} onClick={this.onDelete}>
                            <EIcon type="eqf-delete-l"/>
                        </div>
                    </Tooltip>
                </div>
            </div>
        </div>);
    };

    render() {
        const { props: { preParty: { renderSetting: preRenderSetting = {} } = {} }, state: { transitionPreviewModal, transitionPreviewGL, ...state } } = this;
        const { data, type } = state;
        const { transverse, id, active, renderSetting = {} } = data;
        const { concatSet } = renderSetting;
        const { duration = 400, concatType = 'none' } = concatSet || {};
        const minConcatTime = MIN_CONCAT_TIME / 1000;
        const haveConcat = type === 'tail'
            && renderSetting.segmentPartyDuration > minConcatTime
            && preRenderSetting.segmentPartyDuration > minConcatTime;
        // 片段的序号和转场图标
        const haveTransitions = concatType && concatType !== 'none'; // 是否有转场
        // 转场设置区域
        const disabledCss = haveTransitions ? '' : styles.disabled;
        const Concat = (<div className={styles.selectContainer}>
            <div className={styles.concatTitle}>转场动画</div>
            {haveConcat ? <div className={styles.typesContainer}>
                {this.concatTypes.map(item => {
                    const checked = concatType === item.value ? styles.checked : '';
                    return <div className={checked} key={item.value}
                                onClick={() => this.handleChangeConcat('concatType',
                                    item.value)}>{item.title}</div>;
                })}
            </div> : <Tooltip placement="top" title='前后片段时长均不能小于1秒'>
                 <div className={styles.typesContainer}>
                     {this.concatTypes.map(item => {
                         return <div className={styles.disabled}
                                     key={item.value}>{item.title}</div>;
                     })}
                 </div>
             </Tooltip>}
            <div className={styles.concatTitle}>转场速度</div>
            <div className={styles.time}>
                {TRANSITIONS_DURATION.map(item => {
                    const durationCss = duration === item.value ? styles.checked : '';
                    return <div className={[durationCss, disabledCss].join(' ')} key={item.value}
                                onClick={() => this.handleChangeConcat('duration', item.value)}>
                        {item.title}
                    </div>;
                })}
            </div>
            <div className={styles.applyAllDiv}>
                <a className={styles.applyAll} onClick={this.apllyAllconcat}>应用到全部片段</a>
            </div>
            <div className={[styles.play, disabledCss].join(' ')}
                 onClick={haveTransitions ? (e) => this.openTransitions(e) : null}>
                <EIcon type="eqf-play"/>
            </div>
        </div>);
        return (
            <li
                key={id} className={active ? styles.active : ''}
                onClick={this.onClick}
                onContextMenu={this.onRightClick}
            >
                <div
                    className={[styles.container, transverse ? '' : styles.verContainer].join(' ')}>
                    {type === 'tail' ? <div className={styles.concat}>
                        <Popover placement="left" title={null}
                                 content={Concat} trigger={haveConcat ? 'click' : ''}
                                 arrowPointAtCenter={true}
                                 overlayClassName={styles.concatPopover}>
                            <Tooltip placement="top" title={haveConcat ? '转场' : '低于1s的片段无法添加转场'}>
                                <img src={haveConcat ? (haveTransitions
                                                        ? transitionImg
                                                        : noTransitionImg)
                                                     : noAllowTransition}/>
                            </Tooltip>
                        </Popover>
                    </div> : null}
                    {/*缩略图区域组件*/}
                    {data.title ?
                     this.getPartyPre()
                                : <div className={styles.noData}>
                         <Button icon={'eqf-plus'} lite={1}
                                 onClick={this.onChange}>{typeNames[type]}</Button>
                     </div>}
                </div>
                <Modal visible={transitionPreviewModal} onCancel={this.closeTransitions}>
                    {transitionPreviewGL ?
                     <TransitionPreview partyIndex={'tail'} type={concatType} duration={duration}/>
                                         : <div className={styles.notice}>正在初始化转场预览...</div>
                    }
                </Modal>
            </li>
        );
    }

}
