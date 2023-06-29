import React from 'react';
import styles from './index.less';
import Icon from '../../components/Icon';
import empty from '../../static/simpleEditor/empty.png';
import modeImg from '../../static/icon/mode.png';
import clickImg from '../../static/icon/click.png';
import textImg from '../../static/icon/text.png';
import { waitChooseVideoType } from '../../editor/chooseVideoType';
import { prev } from 'Config/env';
import { EDITOR_PRODUCT } from '../../../config/staticParams';
import { routerRedux } from 'dva/router';
import {connect} from 'dva';

function BlankCreate(props) {
    const { product, dispatch } = props;
    const isHT = String(product) === String(EDITOR_PRODUCT.headTail);
    function handleClick(type) {
        if (type === 0) {
            waitChooseVideoType()
                .then((res) => {
                    const url = `${prev}/${isHT ? 'HTEditor' : 'editor'}/${res}`;
                    window.open(url);
                });
        } else if (type === 1) {
            dispatch(routerRedux.push({
                pathname: `${prev}/index/0`,
            }));
        } else if (type === 2) {
            dispatch(routerRedux.push({
                pathname: `${prev}/index/1`,
            }));
        } else if (type === 3) {
            dispatch(routerRedux.push({
                pathname: `${prev}/index/2`,
            }));
        }
    }

    const json = [
        {
            icon: 'eqf-plus',
            text: '空白创建',
        }, {
            icon: modeImg,
            text: '模板创建',
        }, {
            icon: clickImg,
            text: '一键视频',
        }, {
            icon: textImg,
            text: '添加字幕',
    }];
    return (
        <div className={styles.body}>
            <div className={styles.empty}>
                <img src={empty} width='160' alt="暂无作品"/>
                <p className={styles.tip}>暂无作品</p>
                <p className={styles.notice}>您可通过以下方式创建作品</p>
            </div>
            <div className={styles.box}>
                {json && json.map((item, i) =>
                    <div onClick={()=> handleClick(i)} key={i} className={styles.card}>
                        {i === 0 && <Icon type={item.icon} className={`${styles.Icon}`}/>}
                        {i !== 0 && <img src={item.icon} className={`${styles.img}`}/>}
                        <p className={`${styles.title} ${ i === 0 ? styles.active : ''}`}>{item.text}</p>
                    </div>,
                )}
            </div>
        </div>
    );
}
export default connect()(BlankCreate);