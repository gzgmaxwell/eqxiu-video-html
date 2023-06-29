import React from 'react';
import { Pagination } from 'antd';
import styles from './pagination.less';
import Button from './Button/index';

class Page extends React.PureComponent {

    constructor(props) {
        super(props);
        this.jumpInput = React.createRef();
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeyDown);
    }

    onQuickJump = () => {
        const { props } = this;
        let page = this.jumpInput.current.value || 1;
        if (page < 1) {
            page = 1;
        } else if (props.total && props.pageSize && (page > props.total / props.pageSize)) {
            page = Math.ceil(props.total / props.pageSize);
        }
        this.props.onChange(page, this.props.pageSize);
    };

    handleFocus = () => {
        document.addEventListener('keydown', this.handleKeyDown); // 键盘监听
    };

    handleBlur = () => {
        document.removeEventListener('keydown', this.handleKeyDown);
    };

    handleKeyDown = (e) => {
        e.stopPropagation();
        if (e.keyCode === 13) { // enter
            this.onQuickJump();
        }
    };

    render() {
        const { state, props } = this;
        return (
            <div className={styles.body}>
                <Pagination {...props} showQuickJumper={false}/>
                <div className={styles.showQuickJumper}>
                    <input ref={this.jumpInput} onFocus={this.handleFocus} onBlur={this.handleBlur}/>
                    <Button onClick={this.onQuickJump}>跳转</Button>
                </div>
            </div>);
    }
}

export default Page;
