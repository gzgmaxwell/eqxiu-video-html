import React, { PureComponent } from 'react';
import { connect } from 'dva';
import ColorPicker from '../../components/colorPicker';
import BackgroundImage from './backgroundImage.js';
import styles from './backgroundSet.less';
import Modal from '../../components/modal';
import PreviewVideo from './previewVideo';
import { DEFAULT_BACKGROUND_COLOR } from '../../../config/staticParams';

@connect(({ workspace }) => ({ workspace }))
export default class BackgroundSet extends PureComponent {
    constructor(props) {
        super(props);
        this.body = React.createRef();
        this.video = React.createRef();
    }

    state = {
        modalOpen: false,
    };
    /**
     * 关闭 modal框
     */
    onClose = () => {
        this.setState({
            modalOpen: false,
        });
    };
    onOpen = () => {
        this.setState({
            modalOpen: true,
        });
    };

    handleColorChange = (color) => {
        this.props.dispatch({
            type: 'workspace/changeBackground',
            payload: { backgroundColor: color },
        });
    };


    render() {
        const { modalOpen } = this.state;
        const { dataList = [] } = this.props.workspace;
        const { backgroundColor = DEFAULT_BACKGROUND_COLOR } = dataList[0] || {};
        return (
            <div className={styles.right__video__set}>
                <div className={styles.backgroundColor}>
                    <div className={styles.left}>纯色背景</div>
                    <ColorPicker currentColor={backgroundColor} disableAlpha={false}
                                 onChange={this.handleColorChange}/>
                </div>
                <BackgroundImage/>
                {/*/!*预览视频*!/*/}
                {/*<Modal visible={modalOpen} onCancel={this.onClose} footer={null} width={748}*/}
                       {/*bodyStyle={{*/}
                           {/*height: 421,*/}
                           {/*padding: 0,*/}
                       {/*}}>*/}
                    {/*<PreviewVideo/>*/}
                {/*</Modal>*/}
            </div>
        );
    }
}
