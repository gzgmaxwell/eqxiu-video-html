import React from 'react';
import styles from './previewModal.less';
import Icon from '../components/Icon';
import Button from '../components/Button';

class PreviewModal extends React.Component {

    constructor(props) {
        super(props);
        this.onChange = this.onChange.bind(this);
    }

    state = {
        lock: false,
    };
    onChange = (e) => {
        this.setState({ lock: e.target.checked });
    };
    onKnows = () => {
        this.props.onConfirm(this.state.lock);
    };

    render() {
        return (
            <div className={styles.previewBox}>
                <div className={styles.topBox}>
                    <Icon type='eqf-info-f' className={styles.eqf_info_f} />
                    <div className={styles.leftBox}>
                        <p className={styles.title}>生成后可查看完整内容</p>
                        <p className={styles.titleS}>不能预览正版视频的内容修改</p>
                    </div>
                </div>
                <div className={styles.bottomBox}>
                    <div className={styles.bottomBoxLeft}>
                        <input onChange={this.onChange}
                            value={this.state.lock}
                            type="checkbox"
                            className={styles.checkbox} /><span
                                className={styles.tip}>不再提示</span></div>
                    <Button className={styles.knows} onClick={this.onKnows}>知道了</Button>
                </div>

            </div>
        );
    }
}

export default PreviewModal;
