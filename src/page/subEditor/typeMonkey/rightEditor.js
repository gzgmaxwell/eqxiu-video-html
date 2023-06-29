import React from 'react';
import styles from './rightEditor.less';
import Text from "./tab/text";
import Style from "./tab/style";
import SoundSpeed from "./tab/soundSpeed";

class RightEditor extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tab: 1, // 默认选中文本
        };
    }
    choiceTab = (e, data) => {
        this.setState({ tab: data });
    }
    render() {
        const { state } = this;
        return (
            <div className={styles.body}>
                <div className={styles.nav}>
                    <div className={`${styles.navTitle} ${state.tab === 1 ? styles.activeNav : ''}`} onClick={(e) => this.choiceTab(e, 1)}>文本</div>
                    <div className={`${styles.navTitle} ${state.tab === 2 ? styles.activeNav : ''}`} onClick={(e) => this.choiceTab(e, 2)}>样式</div>
                    <div className={`${styles.navTitle} ${state.tab === 3 ? styles.activeNav : ''}`} onClick={(e) => this.choiceTab(e, 3)}>变声变速</div>
                </div>
                {state.tab === 1 && <Text/>}
                {state.tab === 2 && <Style/>}
                {state.tab === 3 && <SoundSpeed/>}
            </div>
        );
    }
}
export default RightEditor;
