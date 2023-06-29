import React from 'react';
import PropTypes from 'prop-types';
import styles from './index.less';
import welfareImg from '../../static/welfare.png';
import { showKefu } from '../../../util/kefu';
import { genStoreData } from '../../../util/util';
import Feedback from '../feedback';
import Welfare from '../welfare';
import { sendBDEvent } from '../../../services/bigDataService';
import Modal from '../../components/modal';
import Icon from '../Icon';
import env, { eqxAdID, version } from 'Config/env';
import delayLoad from 'Util/delayLoad.js';
import { getItem, localStorageKey, setItem } from '../../../util/storageLocal';
import { isPastDue } from '../../../util/timestamp';
import { AD_TIME, byReason, TYPE_EDITOR } from '../../../config/staticParams';
import RenderInBody from '../../editor/videoStore/cutVideo/RenderInBody';
import Shortcuts from './shortcuts';
import { TYPE_RENDER_IN_BODY } from '../../../config/staticParams/goodsParams';
import RenderInBodyShortcuts from './RenderInBodyShortcuts';

/* global eqxAdSDK */


const newFunctionKey = `${localStorageKey.newFunction}-${version}`;

class Advert extends React.PureComponent {
    constructor(props) {
        super(props);
        this.eqxAdSDK = null;
        this.adBox = React.createRef();
        this.banner = '';
        delayLoad.delayLoadCSS(env.plugin.eqxAdSDK);
        this.jsLoader = delayLoad.delayLoadJS(env.plugin.eqxAdSDK);
        this.state = {
            visible: false,
            adContent: false,
            shortcut: false,
        };
    }


    componentDidMount() {
        this.loadBanner();
        this.handleEqxAdSDK();
    }

    loadBanner = () => {
        try {
            this.jsLoader.then(() => {
                eqxAdSDK.banner({
                    mediaId: eqxAdID.advert,
                })
                    .then((res) => {
                        this.banner = res && res.htmlStr && res.htmlStr[0] || null;
                        this.setState({ adContent: this.banner });
                        return res;
                    });
            });
        } catch (e) {
            console.error(e);
        }
    };

    handleEqxAdSDK = (needShowAd = false) => {
        // 判断是否要显示新功能
        const { props: { autoShow = true, showNewFunc = true, edtiorType = 'editor' } } = this;
        if (!autoShow) return false;
        const newFunTip = getItem(newFunctionKey);
        const isFunc = !needShowAd && showNewFunc &&
            (!newFunTip || (newFunTip && !newFunTip.reason));
        let mediaId = eqxAdID.advert;
        const storeKey = isFunc ? newFunctionKey : localStorageKey.eqxAdSDKTip;
        if (isFunc) {
            mediaId = eqxAdID.newFun;
        } else {
            // 是否需要显示公告
            const showAD = isPastDue(AD_TIME.oneDay, localStorageKey.eqxAdSDKTip);
            if (!showAD) {
                return false;
            }
        }
        try {
            this.jsLoader.then(() => {
                this.eqxAdSDK = eqxAdSDK.banner({
                    mediaId,
                })
                    .then((res) => {
                        // htmlStr是个数组
                        const content = res.htmlStr[0];
                        if (content) {
                            this.setState({
                                adContent: content,
                                visible: true,
                            });
                            setItem(storeKey, genStoreData(byReason.passed));
                            const { position } = TYPE_EDITOR[edtiorType] ||
                            { position: '未知编辑器' };
                            const type = isFunc ? '新功能公告' : '公告';
                            sendBDEvent({
                                position,
                                type,
                            });
                        } else if (isFunc) {
                            return this.handleEqxAdSDK(true);
                        }
                        return res;
                    });
            });
        } catch (e) {
            console.log(e);
        }
    };
    active = (value) => {
        const { editorType = 'editor' } = this.props;
        const { position } = TYPE_EDITOR[editorType] || {
            position: '未知编辑器',
            type: '左侧边栏-福利',
        };
        if (value === 3) {
            sendBDEvent({
                position,
                type: '左侧边栏-福利',
            });
        }
        if (value === 5 && this.banner) {
            this.setState({
                visible: true,
                adContent: this.banner,
            });
        }
        if (value === 6) {
            this.handleShortcut();
        }
    };
    lesson = () => {
        const { editorType = 'editor' } = this.props;
        if (editorType === TYPE_EDITOR.editor.editor) {
            window.open(
                'https://bbs.eqxiu.com/forum.php?mod=viewthread&tid=108462&extra=',
                '_blank',
            );
        } else if (editorType === TYPE_EDITOR.flashEditor.editor) {
            window.open('https://bbs.eqxiu.com/forum.php?mod=viewthread&tid=108481&extra=');
        } else {
            window.open(
                'https://bbs.eqxiu.com/forum.php?mod=viewthread&tid=108462&extra=',
                '_blank',
            );
        }
    };
    onClose = () => {
        this.setState({ visible: false });
    };
    onCloseShortcut = () => {
        this.setState({ shortcut: false });
    };
    handleShortcut = () => {
        this.setState({ shortcut: true });
    };

    render() {
        const { state } = this;
        const height = this.props.editorType === TYPE_EDITOR.editor.editor ? 122 : 94;  // '120px'
        return (
            <div className={styles.bottomButton} style={{height: height}}>
                {/* <div className={`${styles.comButton} ${styles.welfareBtn}`} style={{ marginTop: 8 }}>
                    福利
                </div>
                <div className={`${styles.comButton} ${this.banner ? '' : styles.noneAd}`}>
                    <div onClick={() => this.active(5)}>公告</div>
                </div>*/}
                <Icon type='eqf-why-l' className={styles.eqfWhy}
                      style={{ display: state.shortcut ? 'none' : '' }}/>
                <div className={styles.container}
                     style={{
                         display: state.shortcut ? 'block' : '',
                     }}>
                    {this.props.editorType === TYPE_EDITOR.editor.editor &&
                    <div id='keyBord'
                         className={`${styles.comButton} ${state.shortcut ? styles.active : ''}`}>
                        <div onClick={() => this.active(6)}>快捷键</div>
                    </div>
                    }
                    <div onClick={this.lesson} className={`${styles.comButton}`}>
                        <div onClick={() => this.active(4)}>教程</div>
                    </div>
                    <div
                        onClick={() => this.active(1)}
                        className={`${styles.comButton} ${styles.feedbackBtn}`}>反馈
                    </div>
                    <div className={`${styles.comButton} `} onClick={showKefu}>
                        <div onClick={() => this.active(2)}>客服</div>
                    </div>
                    <div className={styles.feedback}>
                        <Feedback/>
                    </div>
                    <div className={styles.welfare}>
                        <Welfare/>
                    </div>
                </div>
                {state.adContent && <Modal visible={state.visible} onCancel={this.onClose}>
                    <div className={styles.wrap}>
                        <div className={styles.closeWrap}><Icon
                            onClick={this.onClose}
                            className={styles.close}
                            type="eqf-no"
                        />
                        </div>
                        <div
                            className={styles.adBox}
                            ref={this.adBox}
                            dangerouslySetInnerHTML={{ __html: state.adContent }}
                        />

                    </div>
                </Modal>}
                {state.shortcut && <RenderInBodyShortcuts>
                    <Shortcuts onClose={this.onCloseShortcut}/>
                </RenderInBodyShortcuts>
                }
            </div>
        );
    }
}

Advert.propTypes = {
    editorType: PropTypes.string,
    autoShow: PropTypes.any,
    showNewFunc: PropTypes.bool,
};

export default Advert;
