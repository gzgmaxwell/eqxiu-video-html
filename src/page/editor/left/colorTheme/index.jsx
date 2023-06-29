import React from 'react';
import styles from './index.less';
import { connect } from 'dva';
import { LABEL_LIST } from '../../../../config/staticParams'


@connect(({ workspace, tags }) => ({
    workspace,
    tags,
}))
export default class ColorTheme extends React.Component {

    constructor(props) {
        super(props);
    }
    state = {
        index: 1, // 默认选中第一个
        colorTheme: null,
        active: '',
        color: '', // 激活的颜色
    };
    componentDidMount() {
        const { props: { tags } } = this;
        const colorTheme = tags.list.find(v => v.id === LABEL_LIST.色系)
        this.setState({ colorTheme:colorTheme.children})
    }
    active = (index)=> {
        const { props: { activeMenu } } = this
        this.setState({ index })
        activeMenu(index)
    }
    clearThemeColor = ()=>{
        const { props:{colorTheme} } = this
        this.setState({
            active: '',
            color: ''
        },()=>colorTheme(this.state.active))
    }
    onTheme = (v)=>{
        const { props:{ colorTheme } } = this
        const active = v.id
        const color = v.name
        this.setState({
            active,
            color,
        })
        colorTheme(active)
    }
    render(){
        const { state, props: { classTitle } } = this
        return (
            <div className={styles.bgBox}>
                <div className={`${styles.colorTitle}`} style={{background: state.color}} />
                <div className={styles.colorWrap}>
                    <span onClick={() => this.clearThemeColor()}
                        className={`${styles.colorListElse} ${ !state.active ? styles.borderStyle : ''}` } />
                    {state.colorTheme && state.colorTheme.map( (v,i) =>
                        <span key={i}
                              onClick={() => this.onTheme(v)}
                              style={{background: v.name, marginLeft: '8px'}}
                              className={`${styles.popOverMainListColor} ${state.active === v.id ? styles.borderStyle : ''}`} />
                    )}
                </div>
            </div>
        );
    }
}
