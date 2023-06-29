import React from 'react';
import styles from './index.less';

class CoumlunClass extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            type: props.direction || 'hoz', // 默认选中第一个
        };
    }


    videoDirectionActive = (type) => {
        const { props: { videoDirection } } = this;
        this.setState({ type });
        videoDirection(type);
    };

    render() {
        const { state, props: { classTitle } } = this;
        return (
            <div className={styles.verHorBox}>
                <span className={`${state.type === 'hoz' ? styles.verHorBoxActive : ''}`}
                      onClick={() => this.videoDirectionActive('hoz')}>横板</span> |
                <span style={{ marginLeft: '5px' }}
                      className={`${state.type === 'ver' ? styles.verHorBoxActive : ''}`}
                      onClick={() => this.videoDirectionActive('ver')}>竖板</span>
            </div>
        );
    }
}

export default CoumlunClass;
