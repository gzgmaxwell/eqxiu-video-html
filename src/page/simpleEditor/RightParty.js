import React from 'react';
import styles from './RightParty.less'
import empty from '../static/simpleEditor/empty.png'

class RightParty extends React.PureComponent{
    constructor(props){
        super(props)
        this.state = {
        }
    }
    render(){
        return (
            <div className={styles.wrap}>
                <img src={empty} width='120' alt="空"/>
                <span>请在画布中</span>
                <span>选择您要编辑的元素</span>
            </div>
        );
    }
}

export default RightParty;
