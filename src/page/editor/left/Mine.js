import React from 'react';
import styles from './mine.less';
import { prev } from 'Config/env';
import ColumnClass from './class/index.jsx';
import Image from './tab/mine/Image';
import Video from './tab/mine/Video';
import Music from './tab/mine/Music';
import UploadContainer from './tab/mine/UploadContainer';
import eventEmitter from '../../../services/EventListener';

const data = [
    {
        name: '图片',
        index: 1,
    },
    {
        name: '视频',
        index: 2,
    },
    {
        name: '音乐',
        index: 3,
    },
];

class MineContainer extends React.Component {
    constructor(props) {
        super(props);
        this.threeActive = null;
    }

    state = {
        activeMenu: 1, // tab 选项是否激活
        progress: 0,
    };

    componentDidMount() {
        eventEmitter.on(`toggleSecondTabOf${this.props.index}`, this.activeMenu);
    }

    componentDidUpdate() {
        if (this.threeActive) {
            eventEmitter.emit('toggleThreeTab', this.threeActive);
            this.threeActive = null;
        }
    }

    componentWillUnmount() {
        this.setState = () => null;
    }

    activeMenu = (params = 1) => {
        let index = params;
        if (Array.isArray(params)) {
            index = params[0];
            this.threeActive = params[1];
        }
        this.setState({ activeMenu: index });
    };
    setProgress = (progress) => {
        this.setState({ progress });
    };

    render() {
        const { activeMenu } = this.state;
        const { scrolling } = this.props;
        return (
            <React.Fragment>
                <UploadContainer/>
                <ColumnClass index={activeMenu} classTitle={data} activeMenu={this.activeMenu}/>
                {activeMenu === 1 && <Image scrolling={scrolling}/>}
                {activeMenu === 2 && <Video scrolling={scrolling}/>}
                {activeMenu === 3 && <Music scrolling={scrolling}/>}
            </React.Fragment>
        );
    }
}

export default MineContainer;
