import React from 'react';
import styles from './index.less';
import Chrome from '../../static/Chrome.svg';
import Modal from '../../components/modal'
import { isChrome } from '../../../util/util';

class DownLoadGoogle extends React.PureComponent{
    constructor(props){
        super(props)
        this.state={
            downloadGoogle:!isChrome,
            laterTime:false,
        }
    }
    componentDidMount(){
        setTimeout(()=>{
            this.setState({laterTime:true})
        },100)
    }
    downloadGoogle = ()=>{
        this.setState({downloadGoogle:false})
    }
    render(){
        const { state } = this
        return (
            <Modal visible={state.downloadGoogle} onCancel={this.downloadGoogle}>
                {state.laterTime &&  <div className={styles.gooleWrap}>
                    <span onClick={this.downloadGoogle}>×</span>
                    <div><img src={Chrome} width="100" alt=""/></div>
                    <p>为了更好的体验</p>
                    <p>请您用Chrome谷歌浏览器</p>
                    <h1 className={styles.btn}><a target="_blank"
                                                  href="https://pc.qq.com/detail/1/detail_2661.html">下载安装</a>
                    </h1>
                </div>}
            </Modal>
        );
    }
}


export default DownLoadGoogle;
