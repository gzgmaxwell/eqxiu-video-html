import React, { Component } from 'react';
import { ConfigProvider } from 'antd';
import ImageSet from '../image';
import 'react-virtualized/styles.css';
import AnimateImg from './animateImg';
import styles from '../animateFont/animateFonts.less';
import { CANVAS_TYPE, SUBTITLES_FONTS } from '../../../../config/staticParams';
import Icon from 'Components/Icon';

export default class AnimateFont extends Component {
    state = {
        activeTab: 1,
    };
    tabs = [
        {
            index: 1,
            title: '素材',
        },
        {
            index: 2,
            title: '动画',
        },
    ];
    changeActive = (index) => {
        this.setState({ activeTab: index });
    };

    render() {
        const { data } = this.props;
        const { activeTab } = this.state;
        if (!data) {
            return null;
        }
        return (
            <ConfigProvider getPopupContainer={(triggerNode) => triggerNode.parentElement}>
                <div className={styles.tabs}>
                    {this.tabs.map(tab => {
                        const active = activeTab === tab.index ? styles.active : '';
                        return <div key={tab.index}
                                    className={`${styles.tab} ${active}`}
                                    onClick={() => this.changeActive(tab.index)}
                        ><div>{tab.title}</div></div>;
                    })}
                </div>
                {activeTab === 1 && <React.Fragment>
                    {/*<div className={styles.animateOptions}>*/}
                        {/*<div className={styles.left}>动画</div>*/}
                        {/*<div className={styles.right} onClick={()=>this.changeActive(2)}>*/}
                            {/*<span>{data.animate ? '去修改' : '去设置'}</span>*/}
                            {/*<Icon type="eqf-right"/>*/}
                        {/*</div>*/}
                    {/*</div>*/}
                    <ImageSet {...this.props} />
                </React.Fragment>}
                {activeTab === 2 && <AnimateImg {...this.props} />}
            </ConfigProvider>
        );
    }
}
