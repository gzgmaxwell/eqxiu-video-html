import React from 'react';
import styles from './index.less';
import Button from '../../components/Button'
import yuantu from '../../static/storeTop.png'

class Page extends React.PureComponent {
    constructor(props) {
        super(props);
    }
    state = {
        fitter:[{
            id:1,
            name:'无滤镜',
            img:yuantu,
            class:'wulvjing',
        },{
            id:2,
            name:'拍立得',
            img:yuantu,
            class:'pailide',
        },{
            id:3,
            name:'旺角',
            img:yuantu,
            class:'wangjiao',
        },{
            id:4,
            name:'黑白',
            img:yuantu,
            class:'heibai',
        },{
            id:5,
            name:'80年代',
            img:yuantu,
            class:'niandai',
        },{
            id:6,
            name:'假期',
            img:yuantu,
            class:'jiaqi',
        },{
            id:7,
            name:'自然',
            img:yuantu,
            class:'ziran',
        },{
            id:8,
            name:'樱花',
            img:yuantu,
            class:'yinghua',
        },{
            id:8,
            name:'阳光',
            img:yuantu,
            class:'yangguang',
        }],
    };
    render() {
        const { state,props } = this
        console.log(this);
        return (
            <div className={styles.body}>
                <div className={styles.left}>
                    <div className={styles.head}>图片裁剪</div>
                    <div className={styles.main}></div>
                </div>
                <div className={styles.right}>
                    <div className={styles.close} onClick={props.onClose}>×</div>
                    <div className={styles.filter}>滤镜</div>
                    <div className={styles.contain}>
                        {state.fitter &&
                            state.fitter.map((item,index) =>
                                <div key={index} className={styles.single}>
                                    <img src={item.img} className={`${styles.singlePic} ${item.class}`}/>
                                    <div className={styles.singleName}>{item.name}</div>
                                </div>
                            )
                        }
                    </div>
                    <div className={styles.btn}>
                        <Button onClick={this.reset} className={styles.reset}>重置</Button>
                        <Button className={styles.cancal}>取消</Button>
                    </div>
                </div>
            </div>);
    }
}

export default Page;
