import React from 'react';
import { host } from 'Config/env';
import { connect } from 'dva';
import { Message } from 'antd';
import styles from './rendering.less';
import loading from '../../static/quanyioading.gif';
import { waitChoseModel } from '../../components/delete';
import { VIDEO_RENDER_TYPE } from '../../../config/staticParams';
import { isChuangYiyunVip } from '../../../models/User';
import { POS_FROM } from '../../../config/staticParams/goodsParams';
import ShareDownload from './index';

class Rendering extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
        };
    }

    componentDidMount() {

    }

    cancelRendering = (e,index) => {
        const { props: { isVip } } = this;
        e.stopPropagation();
        waitChoseModel({
            text: '确定取消生成吗?',
            info: isVip ? '' : '取消生成，您所购买的下载权益将保存到您的账户',
        })
            .then(res => {
                this.props.onCancelRender(index);
            })
            .catch(re => re);
    };

    render() {
        const { props, props: { shareType, active, positionFrom = POS_FROM.workSpace, Index } } = this
        let isShowCancelRendering = true;
        if (positionFrom === POS_FROM.editorSpace) {
            if (active === shareType) {
                isShowCancelRendering = false;
            }
        }
        return (
            <div className={styles.Rendering}>
                {
                    isShowCancelRendering ?
                    <React.Fragment>
                        <img width='28' src={loading} alt='渲染中' />
                        <p className={styles.progress}>视频生成中({~~props.singleProgress}%)，请稍等…</p>
                        <div onClick={(e)=>this.cancelRendering(e, Index)} className={styles.cancelBtn}>取消</div>
                    </React.Fragment>
                    :<p className={styles.progress}>视频预览生成中…</p>
                }
                {/*<p className={styles.info}>生成后即可下载到本地或者设置分享</p>*/}
            </div>
        );
    }
}


export default Rendering;
