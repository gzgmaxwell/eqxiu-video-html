import React from 'react';
import styles from './oneLabel.less';
import { connect } from 'dva';

@connect(({ tags }) => ({
    tags,
}))
class LabelsOne extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            activeLabelId: null, // 激活标签的id
            hover: false, // 标签名激活状态
        };
    }

    componentDidMount() {
        const { props: { tags, typeData } } = this;
        let labels = [];
        if (tags.list && tags.list.length > 1) {
            const all = {
                name: '全部',
                id: null,
            };
            typeData.forEach((id) => {
                const styleList = tags.list.find(v => v.id === id);
                if (!styleList) return;
                labels.push(all, ...styleList.children);
            });
        }
        this.setState({
            tags: labels,
        });
    }

    choice = (item) => {
        const { props: { refreshList } } = this;
        this.setState({
            activeLabelId: item.id,
            hover: false,
        }, () => refreshList(this.state.activeLabelId));
    };

    render() {
        const { state: { ...state }, props: { width } } = this;
        return (
            <ul className={styles.tagNameBox}>
                {state.tags && state.tags.map((item, index) =>
                    <li onClick={(e) => this.choice(item)} key={index}
                        className={`${styles.tagName} ${state.activeLabelId === item.id
                                                        ? styles.hover
                                                        : ''}`}>
                        <span>{item.name}</span>
                    </li>,
                )}
            </ul>
        );
    }
}

export default LabelsOne;
