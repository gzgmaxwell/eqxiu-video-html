import React from 'react';
import styles from './give.less';
import Icon from '../components/Icon';
import Button from '../components/Button';
import userVideoApi from 'Api/userVideo';
import { Message } from 'antd';


class Give extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            receiver: '',
        };
    }

    componentDidMount() {
    }

    give = () => {
        const { state: { receiver }, props: { videoId, onClose } } = this;
        userVideoApi.videoPresent(videoId, receiver)
            .then(res => {
                const { data } = res;
                if (data.success) {
                    onClose();
                    Message.success(data.msg);
                }
            })
            .catch(err => {

            });
    };
    onChange = (e) => {
        const receiver = e.target.value;
        this.setState({ receiver });
    };

    render() {
        const { state, props } = this;
        return (
            <div className={styles.box}>
                <Icon type='eqf-no' onClick={props.onClose} className={styles.eqf_no}/>
                <p className={styles.giveTitle}>作品转赠</p>
                <div className={styles.wrap}>
                    <div className={styles.main}>
                        <span>转赠账号</span> <input placeholder='填写受赠者的账号（用户中心可查看）或者手机号'
                                                 onChange={(e) => this.onChange(e)}/>
                    </div>
                    <div className={styles.bottom}>
                        <div className={styles.info}>*转赠后您仍拥有当前作品</div>
                        <div>
                            <Button lite={1} className={`${styles.button} cancelBtn`}
                                    onClick={props.onClose}>取消</Button>
                            <Button lite={0} className={styles.button}
                                    onClick={this.give}>确定</Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Give;
