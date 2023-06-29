import React from 'react';
import ReactDOM from 'react-dom';
import styles from './ghostAfterImage.less';
import { delay } from '../../../util/delayLoad';


class GhostAfterImage extends React.Component {


    state = {
        ghostList: [],
    };

    componentDidMount() {
        this.initLength();
    }

    componentDidUpdate(prevProps) {
        const { state: { ghostList }, props: { count } } = this;
        if (ghostList.length !== count) {
            this.initLength();
        }
    }

    initLength = () => {
        const { props: { count, children } } = this;
        const ghostList = [];
        for (let i = 0; i < count; i += 1) {
            ghostList.push(<div
                key={Math.random()}
                className={styles.base}
                style={{ animationDelay: `${i + 1}s` }}
            >
                {children}
            </div>);
        }
        this.setState({ ghostList });
    };

    render() {
        const { props: { children }, state: { ghostList } } = this;

        return ReactDOM.createPortal(document.body, (
            <React.Fragment>
                {ghostList.length &&
                <div className={styles.body}>
                    {ghostList}
                </div>}
            </React.Fragment>
        ));
    }
}


export async function showGhost(start, Children, count = 3) {
    const { body } = document;
    const shade = document.createElement('div');
    // 设置基本属性
    shade.id = 'ghostAfterImage';
    shade.className = styles.body;
    body.appendChild(shade);
    // 自我删除的方法
    const close = () => {
        body.removeChild(shade);
    };
    const ghostList = [];
    for (let i = 0; i < count; i += 1) {
        ghostList.push(<Children
                key={Math.random()}
                className={styles.base}
                webkitAnimationIteration={(i + 1) === count ? close : null}
                style={{
                    animationDelay: `${i}s`,
                    opacity: 0,
                    transform: `translate3d(${start.x}px, ${start.y}px, 0)`,
                }}
            />,
        );
    }
    ReactDOM.render(
        ghostList,
        shade,
    );
    setTimeout(close, count * 1000);
    return { close };
}

export default GhostAfterImage;
