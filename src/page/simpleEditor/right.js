import React from 'react';
import { connect } from 'dva';
import lodash from 'lodash';
import styles from './right.less';
import TextSet from '../editor/right/text';
import ImageSet from '../editor/right/image';
import CustomVideoSet from '../editor/right/video/custom';
import LegalCopyVideoSet from '../editor/right/video/legalCopy.js';
import SpecialEffectSet from '../editor/right/video/specialEffectSet.js';
import ArtFontSet from '../editor/right/artFont';
import TimeSet from '../editor/right/timeSet';
import { CANVAS_TYPE, CANVAS_TYPE_NAME, TimeSetVideoType } from '../../config/staticParams';
import MateriaList from '../editor/right/materiaList';
import GifSet from '../editor/right/image/gifSet';
import Empty from '../components/empty';
import LeftParty from './RightParty';
import eventEmitter from '../../services/EventListener';
import { contrast, limitInsert } from '../../util/data';
import AnimateFontSet from '../editor/right/animateFont';
import AnimateImgSet from '../editor/right/animateImg';
import UserMarkRight from '../editor/right/userMaket';

const titps = <div className={styles.noOption}>暂不支持编辑，敬请期待</div>;
const noOption = { marginTop: 40 };

const tabList = [
    {
        [CANVAS_TYPE.text]: {
            label: '文本',
            component: AnimateFontSet,
        },
        [CANVAS_TYPE.img]: {
            label: '图片',
            component: AnimateImgSet,
        },
        [CANVAS_TYPE.animateImg]: {
            label: '动画图',
            component: AnimateImgSet,
        },
        [CANVAS_TYPE.templateVideo]: {
            label: '素材编辑',
            component: LegalCopyVideoSet,
        },
        [CANVAS_TYPE.userVideo]: {
            label: '上传视频',
            component: CustomVideoSet,
        },
        [CANVAS_TYPE.userVideoNew]: {
            label: '上传视频',
            component: CustomVideoSet,
        },
        [CANVAS_TYPE.specialText]: {
            label: '特效字',
            component: SpecialEffectSet,
        },
        [CANVAS_TYPE.spacialImg]: {
            label: '特效图',
            component: SpecialEffectSet,
        },
        [CANVAS_TYPE.artFont]: {
            label: '艺术字',
            component: ArtFontSet,
        },
        [CANVAS_TYPE.animateFont]: {
            label: '动画字',
            component: AnimateFontSet,
        },
        [CANVAS_TYPE.ornament]: {
            label: '装饰',
            component: () => <Empty text={titps} style={noOption}/>,
        },
        [CANVAS_TYPE.clad]: {
            label: '覆层',
            component: () => <Empty text={titps} style={noOption}/>,
        },
        [CANVAS_TYPE.dynamicBg]: {
            label: '背景',
            component: () => <Empty text={titps} style={noOption}/>,
        },
        [CANVAS_TYPE.realShoot]: {
            label: '视频素材',
            component: () => <Empty text={titps} style={noOption}/>,
        },
        [CANVAS_TYPE.gif]: {
            label: '动图',
            component: GifSet,
        },
        [CANVAS_TYPE.userMarket]: {
            label: CANVAS_TYPE_NAME[CANVAS_TYPE.userMarket],
            component: UserMarkRight,
        },
    },
    {
        label: '片段列表',
        component: LeftParty,
    },
];

/**
 * 编辑器右边的组件   改变图片的顺序为   before||on =>    open => message => cropper => after
 *                                  配置参数和index   打开模态框 监听       裁剪       保存
 */
@connect(({ editor, workspace }) => {
    return {
        eventSubscriptions: editor.eventSubscriptions,
        workspace,
    };
})
class RightSide extends React.Component {
    constructor(props) {
        super(props);
        // this.iframe = React.createRef();
        this.voice = React.createRef();
        this.bgm = React.createRef();
    }

    state = {
        activeTab: 2,
        activeType: null,
        activeSubTab: 1,
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        const newState = {};
        const { eventSubscriptions } = nextProps;
        if (eventSubscriptions === 'activeVideo') {
            newState.activeTab = 0;
            nextProps.dispatch({ type: 'editor/overEvent' });
        }
        return newState;
    }

    componentDidMount() {
        eventEmitter.on('activeType', this.changeTabByEvent);
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (!lodash.isEqual(this.state, nextState)) {
            return true;
        }

        if (contrast(this.props, nextProps, [
            'workspace.activeIndex',
        ])) {
            return true;
        }
        const { workspace: { dataList, activeIndex } } = this.props;
        const { workspace: { dataList: nextDataList, activeIndex: nextAtiveIndex } } = nextProps;
        if (!lodash.isEqual(dataList[activeIndex], nextDataList[nextAtiveIndex])) {
            return true;
        }
        return false;
    }

    componentWillUnmount() {
        eventEmitter.removeListener('activeType', this.changeTabByEvent);
    }

    changeTab = (index = 2) => {
        this.setState({ activeTab: index });
    };
    changeTabByEvent = (type) => {
        const activeSubTab = type === CANVAS_TYPE.templateVideo ? 0 : 1;
        this.setState({
            activeType: type,
            activeSubTab,
        });
        const { layerMgr } = this.state;
        if (type !== null) {
            this.changeTab(layerMgr ? 1 : 0);
        } else {
            this.changeTab(layerMgr ? 1 : 2);
        }
    };
    tabClick = (index) => {
        this.setState({ activeSubTab: index });
    };
    changeNow = (payload) => {
        return this.props.dispatch({
            type: 'workspace/changeNow',
            payload,
        });
    };
    limitInsert = (type) => {
        return limitInsert(this.props.workspace.dataList, type);
    };

    render() {
        const { props: { workspace: { dataList, activeIndex, myFonts }, ...props }, state: { activeType, ...state } } = this;
        const ActiveComponent = (state.activeTab === 0
                                 ? tabList[0][activeType]
                                 : tabList[state.activeTab]) || tabList[1];
        // console.log(ActiveComponent);
        const showSubTab = state.activeTab === 0 && TimeSetVideoType.includes(activeType);
        const oneData = lodash.cloneDeep(dataList[activeIndex] || {});
        const showTip = false;
        const height = `calc(100vh - 56px)`;
        return (
            <div className={styles.toolsBodyOut}>
                <div className={styles.toolsBody}>
                    {/*选中元素才有标题*/}
                    {state.activeTab === 0 && ActiveComponent.component &&
                    <div className={styles.titleBar}>{ActiveComponent.label}</div>}
                    {/*是否显示提示*/}
                    {showTip && <div className={styles.tip}>
                        <div className={styles.text}>
                            提示：正版视频、特效字、特效图生成视频后，内容才被替换。
                        </div>
                    </div>}
                    {(showSubTab && state.activeSubTab === 0) && <MateriaList/>}
                    {(showSubTab && state.activeSubTab === 1 || !showSubTab)
                    && <div className={styles.contentDiv} style={{ height }}>
                        <ActiveComponent.component key={activeIndex} event={props.event}
                                                   type={activeType}
                                                   data={oneData}
                                                   limitInsert={this.limitInsert}
                                                   myFonts={myFonts} changeNow={this.changeNow}/>
                    </div>}
                    {showSubTab && state.activeSubTab === 2 && <TimeSet/>}
                </div>
            </div>
        );
    }
}

export default RightSide;
