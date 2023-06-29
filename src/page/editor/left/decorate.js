import React from 'react';
import styles from './decorate.less';
import { prev } from 'Config/env';
import RecommendGoogle from '../recommendGoogle/index';
import { isChrome } from '../../../util/util';
import DecorateTab from './tab/decorate';
import PasterTab from './tab/paster';

class Decorate extends React.Component {

    constructor(props) {
        super(props);
    }

    state = {
        tabActive: true, //tab 选项是否激活
    };

    componentDidMount() {
    }

    componentWillUnmount() {
        this.setState = () => null;
    }

    tabClick = (value) => {
        if (value === 'decorate') {
            this.setState({ tabActive: true });
        } else {
            this.setState({ tabActive: false });
        }
    };

    render() {
        const { state } = this;
        return (
            <React.Fragment>
                {!isChrome && <div><RecommendGoogle /></div>}
                <div className={styles.decorate}>
                    <div onClick={() => this.tabClick('decorate')}
                        className={`${styles.tab} ${state.tabActive ? styles.tabActive : ''}`}>特效装饰
                    </div>
                    <div onClick={() => this.tabClick('paster')}
                        className={`${styles.tab} ${!state.tabActive ? styles.tabActive : ''}`}>贴纸
                    </div>
                </div>
                {state.tabActive && <DecorateTab />}
                {!state.tabActive && <PasterTab />}
            </React.Fragment>
        );
    }
}

export default Decorate;
