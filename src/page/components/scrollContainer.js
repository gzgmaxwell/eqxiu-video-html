import React, { Component } from 'react';
import styles from './scrollContainer.less';
import eventEmitter from '../../services/EventListener';

export default class scrollContainer extends Component {
    constructor(props) {
        super(props);
        this.container = React.createRef();
    }

    componentDidMount() {
        this.container.current.querySelector('.scrollDiv')
            .addEventListener('scroll', this.handleScroll);
    }

    componentDidUpdate() {
    }

    componentWillUnmount() {
        this.container.current.querySelector('.scrollDiv')
            .removeEventListener('scroll', this.handleScroll);
    }

    handleScroll = () => {
        eventEmitter.emit('scrolling');
    };

    render() {
        const { style = {} } = this.props;
        return <div ref={this.container} className={styles.container} style={style}>
            {this.props.children}
        </div>;
    }
}
