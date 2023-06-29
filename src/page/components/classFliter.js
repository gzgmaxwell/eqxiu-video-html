import React from 'react';
import styles from '../editor/left/tab/paster.less';
import Icon from './Icon';

class ClassFilter extends React.PureComponent {


    render() {


        return (<React.Fragment>
            <div className={styles.navBox}>
                <div className={`${styles.navList} ${state.type === '893056'
                                                     ? styles.navListActive
                                                     : ''}`}
                     onClick={() => {this.tabClick('893056');}}>全部
                </div>
                <div className={`${styles.navList} ${state.type === '893064'
                                                     ? styles.navListActive
                                                     : ''}`}
                     onClick={() => {this.tabClick('893064');}}>推荐
                </div>
                <div onMouseEnter={this.mouseEnter} onMouseLeave={this.mouseLeave}
                     className={`${styles.navList}`}>更多<Icon
                    className={`${styles.eqf_down} ${state.slider ? styles.hover : ''}`}
                    type='eqf-down'/></div>
            </div>
            <div style={{ height: state.height }}
                 className={`${styles.moreBox} ${state.slider ? styles.moreBoxActive : ''}`}
                 ref={this.activeHeight} onMouseEnter={this.mouseEnter}
                 onMouseLeave={this.mouseLeave}>
                {state.labels && state.labels.map((item, index) =>
                    <div key={index} className={`${styles.moreList} ${item.id === state.type
                                                                      ? styles.moreListActive
                                                                      : ''}`}
                         onClick={() => {this.tabClick(item.id);}}>{item.name}</div>,
                )}
            </div>
        </React.Fragment>);
    }
}
