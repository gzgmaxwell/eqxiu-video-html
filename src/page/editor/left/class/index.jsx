import React from 'react';
import styles from './index.less';

class CoumlunClass extends React.Component {

    constructor(props) {
        super(props);
    }

    state = {
        index: 1, // 默认选中第一个
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        const state = {};
        if (nextProps.index && nextProps.index !== prevState.index) {
            state.index = nextProps.index;
        }
        return state;
    }

    active = (index) => {
        const { props: { activeMenu } } = this;
        this.setState({ index });
        activeMenu(index);
    };

    render() {
        const { state, props: { classTitle, className = '' } } = this;
        return (
            <div className={`${styles.menus} ${className}`}>
                {classTitle &&
                classTitle.map((item, index) =>
                    <div key={index} className={item.index === state.index ? styles.activeMenu : ''}
                         onClick={() => this.active(item.index)}>
                        <div>{item.name}</div>
                        {item.isNew && <span className={styles.newTag}>new</span>}
                        <div/>
                    </div>,
                )}
            </div>
        );
    }
}

export default CoumlunClass;
