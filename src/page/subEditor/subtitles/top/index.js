import React, { Component } from 'react';
import styles from './top.less';
import Button from 'Components/Button';
import { setTitle, getScrollTop } from 'Util/doc';
import DeleteModal from 'Components/delete';
import { prev } from 'Config/env';
import videoLogo from '../../../static/icon/videoLogo.svg';
import { getURLObj } from '../../../../util/util';

export default class Top extends Component {
    render() {
        const { props } = this;
        const {
            RedirectIndex, openOption, onSave, onGenerateVideo, onClickQuite,
            onCloseModal, onQuite, openCloseModal, saving, children, isLoading
        } = props;
        const openFrom = getURLObj(window.location.href).openFrom;
        return <div className={styles.header}>
            <div className={styles.logo} onClick={RedirectIndex}>
                <img src={videoLogo}/>
            </div>
            {children}
            <div className={styles.headerButtonGroup}>
                {!openFrom &&  <Button style={{
                    width: 65,
                }} className={saving ? styles.displayButton : ''}
                                      onClick={openOption}>视频设置</Button>}
                <Button style={{
                    width: 40,
                }} className={saving ? styles.displayButton : ''}
                        onClick={onSave}>{!openFrom ? '保存' : '预览'}</Button>
                <Button className={saving ? styles.displayButton : ''}
                        style={{
                            width: 84,
                        }}
                        onClick={onGenerateVideo}>{!openFrom ? '预览和生成' : '嵌入长页'}</Button>
                {!openFrom &&  <Button className={styles.quiteBtn}
                                      onClick={onClickQuite}>退出</Button>}
                <DeleteModal visible={openCloseModal}
                             text={<span>{isLoading || '确认退出么？'}</span>}
                             style={{ top: getScrollTop() }}
                             type={isLoading ? 'eqf-info-f' : 'eqf-why-f'}
                             inconclass={'warning'}
                             sureBtn={'确认'}
                             cancelBtn={'取消'}
                             onClose={onCloseModal} onDelete={onQuite}/>
            </div>
        </div>;
    }
}

