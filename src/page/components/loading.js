import React from 'react';
import styles from './loading.less';

class Loading extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            delay: this.props.delay || 0,
        }
    }
    static getDerivedStateFromProps(nextProps, prevState) {
        if(!nextProps.loading && nextProps.delay !== prevState.delay) {
            return { delay: nextProps.delay };
        }
        return null;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(prevState.delay > 0) {
            if(this.timeout) {
                clearTimeout(this.timeout);
            }
            this.timeout = setTimeout(() => {
                this.setState({ delay: 0 });
            }, prevState.delay);
        }
    }

    componentWillUnmount() {
        if(this.timeout) {
            clearTimeout(this.timeout);
        }
    }

    render() {
        const { props: { title, isAbsolute = false, loading = true, delay: time, ...props }, state: { delay = 0, } } = this;
        let hide = true;
        if(loading) { // 是否是加载状态，如果是去判断延迟显示时间
            hide = delay > 0;
        }
        return hide ? null : <React.Fragment>
                <div key='shade' className={styles.shade}
                     style={{ position: isAbsolute ? 'absolute' : '' }}/>
                <div key='body' className={styles.body} {...props}>
                    <div className={styles.content}>{title}</div>
                </div>
        </React.Fragment>;
    }

}


export default Loading;
