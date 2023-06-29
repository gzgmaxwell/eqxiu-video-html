import React from 'react';
import { prev, host } from 'Config/env';
import styles from './index.less';
import Card from './card/index';
import MineCard from './mineCard/index';
import Pagination from 'Components/pagination';
import Icon from '../../components/Icon';
import Empty from '../../components/empty';
import { Popover } from 'antd'
import Upload from './upload'
import imageUtil from 'Util/image';
import MineVideo from './mineVideo'

import { getInfo } from '../../../api/user';
import { getIndex, getTagsTree, userTemplateFind,userTemplateGetPhoneParam } from '../../../api/template';

const tagLen = 5;

const LiArray = [
    {
        name: '我的视频',
    },
    {
        name: '正版片段',
    }
]
class VideoStore extends React.PureComponent {
    constructor(props) {
        super(props);
        this.video = React.createRef();
        this.listDiv = React.createRef();
        this.qrcode = React.createRef();
    }

    state = {
        userId: '',
        Index:0,
        list: [],
        phoneToken: '', // 手机上传验证
        phoneP: '', // 手机上传内容
        mineVideoList: [], // 我的视频
        direction: 'hoz',
        pageSize: 12,
        count: 25,
        page: 1,
        loading: true,
        videoFragment: [],// 片段类型渲染
        videoClassify: [],// 分类渲染
        videoStyle: [],// 风格渲染
        videoTheme: [],// 色系渲染
        fragment: '',
        classify: '',
        style: '',
        theme: '',
        themeColor: '',// 色系值具体颜色值
        hoverMore: 'eqf-menu-down',
        hoverColor: 'eqf-menu-down',
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        const state = {};
        if (nextProps.isHorz && nextProps.isHorz !== prevState.direction) {
            state.direction = nextProps.isHorz;
        }
        return state;
    }

    componentDidMount() {
        this.getUser();
        this.getPhone();
    }

    componentDidUpdate(prevProps, prevState) {
        const { fragment, classify, style, theme } = this.state;
        if (prevState.loading) {
            // this.setState({ loading: false });
        }
        if(this.state.page !== prevState.page || this.state.Index !==prevState.Index && this.state.Index ===0) {
            this.getUser();
        }
        if (fragment !== prevState.fragment || classify !== prevState.classify
            || style !== prevState.style || theme !== prevState.theme || this.state.page !==
            prevState.page || this.state.Index !==prevState.Index && this.state.Index ===1) {
            this.loadList();
            this.loadTags();
        }
    }

    onGoToPage = (page, pageSize) => {
        this.setState({
            page,
        });
    };
    changDirection = (type) => {
        this.setState({
            direction: type,
            page: 1,
        }, this.loadList);
    };
    createEqcode = () => {
        if(this.state.phoneToken){
            const phoneUploadUrl = `${host.client.replace(prev,'')}/upload.html?token=${this.state.phoneToken}&p=${this.state.phoneP}`
            imageUtil.genQrCode(this.qrcode.current,phoneUploadUrl, {
                width: 150,
                height: 150,
            })
        }
    };
    getUser = () => {
        getInfo().then( res =>{
            const { data } = res;
            if (data.success) {
                this.setState({
                    userId: data.obj.id,
                });
                this.getMineVideo();
            }
        })
    };
    getPhone = () => {
        userTemplateGetPhoneParam().then( res =>{
            const { data } = res;
            if (data.success) {
                this.setState({
                    phoneToken: data.obj.token,
                    phoneP: data.obj.p,
                });
            }
            this.createEqcode()
        })
    };
    getMineVideo = () => {
        const params = {
            pageNo: this.state.page,
            pageSize: this.state.pageSize,
            userId: this.state.userId,
            orderBy: '',
            title: '',
        }
        userTemplateFind(params).then(res =>{
            let { data } = res
            if (data.success) {
                const newState = {
                    mineVideoList: data.list,
                    page: Number(data.map.pageNo || 1),
                    count: data.map.count,
                    redirect: '',
                };
                this.setState({
                    ...newState,
                    loading: false,
                }, () => this.listDiv.current.scrollTop = 0); // 滚动到顶部
            }
        })
    }
    loadList = () => {
        const direction = this.state.direction === 'hoz';
        this.setState({ loading: true });
        const params = {
            pageNo: this.state.page,
            pageSize: this.state.pageSize,
            orderBy: 'weight_score desc,create_time desc',
            labelIds: [
                this.state.classify,
                this.state.style,
                // this.state.theme].concat(this.state.fragment ? this.state.fragment:this.state.videoFragment.map(v=>v.id)),
                this.state.theme,
                this.state.fragment,
            ],
            transverse: direction,
            videoDuration: '',
            key: '',
            templateTypes: [2, 3],
        };
        getIndex(params)
            .then(res => {
                const { data } = res;
                if (data.success) {
                    const newState = {
                        list: data.list,
                        page: Number(data.map.pageNo || 1),
                        count: data.map.count,
                        redirect: '',
                    };
                    this.setState({
                        ...newState,
                        loading: false,
                    }, () => this.listDiv.current.scrollTop = 0); // 滚动到顶部
                }
            });
    };
    loadTags = () => {
        getTagsTree()
            .then(res => {
                const { data } = res;
                if (data.success) {
                    if (data.obj) {
                        data.obj.map((item, index) => {
                            const newState = {};
                            if (item.name === '片段类型') {
                                newState.videoFragment = item.children;
                            }
                            if (item.name === '用途') {
                                newState.videoClassify = item.children;
                            }
                            if (item.name === '风格') {
                                newState.videoStyle = item.children;
                            }
                            if (item.name === '色系') {
                                newState.videoTheme = item.children;
                            }
                            this.setState({
                                ...newState,
                                loading: false,
                            }, this.loadList);
                        });
                    }

                }
            });
    };
    onFragment = (value) => {
        this.setState({
            fragment: value.id,
            page: 1,
        });
    };
    onClassify = (value) => {
        this.setState({
            classify: value.id,
            page: 1,
        });
    };
    onStyle = (value) => {
        this.setState({
            style: value.id,
            page: 1,
        });
    };
    onTheme = (value) => {
        this.setState({
            theme: value.id,
            page: 1,
            themeColor: value.name,
        });
    };
    onFragmentClear = () => {
        this.setState({
            fragment: '',
            page: 1,
        });
    };
    onClassifyClear = () => {
        this.setState({
            classify: '',
            page: 1,
        });
    };
    onStyleClear = () => {
        this.setState({
            style: '',
            page: 1,
        });
    };
    myEnter = () => {
        this.setState({
            hoverMore: 'eqf-menu-down',
        });
    };
    myLeave = () => {
        this.setState({
            hoverMore: 'eqf-menu-up',
        });
    };
    myEnterColor = () => {
        this.setState({
            hoverColor: 'eqf-menu-down',
        });
    };
    myLeaveColor = () => {
        this.setState({
            hoverColor: 'eqf-menu-up',
        });
    };
    clearThemeColor = () => {
        this.setState({
            themeColor: '',
            theme: '',
        });
    };
    onClose = () => {
        if (typeof this.props.onClose === 'function') {
            return this.props.onClose();
        }
    };
    toggleNav = (index) => {
        this.setState({
            Index: index,
        })
    };
    render() {
        const { state } = this;
        const menuTitle = state.loading ? '正在加载菜单' : '没有找到相应的片段';
        const content = (
            <div>
                <span className={styles.accept}>使用视频即代表同意并接受 </span> <span className={styles.acceptEqx}>《易企秀图片版权许可与服务协议》</span>
            </div>
        )
        return (
            <div className={styles.videoBox}>
                <div className={styles.videoLeftBox}>
                    <div className={styles.videoLeftRowOne}>
                        <p className={styles.videoLeftRowOneTile}>片段库</p>
                        <Popover content={content} placement='right'>
                            <Icon type='eqf-info-f' className={styles.eqf_info_f}/>
                        </Popover>
                    </div>
                    {LiArray.map((item,index) =>{
                        return(
                            <div key={index} onClick={() => this.toggleNav(index)} className={`${styles.videoLeftRowTwo} ${index===state.Index ? styles.videoLeftRowTwoHover:''}`}>
                                <p className={styles.videoLeftRowTwoTile}>{item.name}</p>
                            </div>
                        )
                    })
                    }
                    <div className={styles.uploadBox}>
                        <div className={styles.phoneUploadBtnAll}>
                            <div className={styles.phoneUploadBtn}>
                                <Icon type='eqf-cloudupload-f' className={styles.eqf_cloudupload_i}/> <span className={styles.phoneWord}>手机上传</span>
                                <div className={styles.erqcodeBox}>
                                    <div className={styles.ercodeTriangle}></div>
                                    <p className={styles.weixin}>微信 "扫一扫" 上传手机视频</p>
                                    <div className={styles.erqcodeImg} ref={this.qrcode} />
                                </div>
                            </div>
                        </div>
                        <div className={styles.computerUploadBtn}>
                            <Upload/>
                            <Icon type='eqf-why-f' className={styles.eqf_why_f}/>
                            <div className={styles.localBoxAll}>
                                <div className={styles.localBox}>
                                    <div className={styles.localTriangle}></div>
                                    <div className={styles.contentWhy}>
                                        <p className={styles.contentWhyNotice}>上传须知</p>
                                        <p className={styles.contentWhyInfo}>易企秀为广大用户提供原创正版视频上传渠道、信息储存空间等网络技术服务，用户可在遵守 <a href=""> 易企秀视频版权许可与服务协议</a> 的前提下自行上传并对其上传作品承担全部责任，请谨慎使用上传功能。</p>
                                        <p className={styles.contentWhyInfo}>通过本地电脑上传图片，大小不超过50M，支持格式：avi、MP4、mov、flv、mkv、wmv,一次最少上传1个，最多上传20个。</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={styles.videoRightBox}>
                    <div className={styles.videoRightHeadBox}>
                        <ul className={styles.videoRightHead}>
                            {state.Index===0 && <li className={`${styles.videoRightHeadList} ${styles.active}`}>上传</li>}
                            {state.Index===1 && <li onClick={() => this.onFragmentClear()}
                                 className={`${styles.videoRightHeadList} ${!state.fragment
                                     ? styles.active
                                     : ''}`}>全部
                            </li>}
                            {state.videoFragment.length > 0 && state.Index===1 &&
                             state.videoFragment.map((item, index) =>
                                <li key={index} onClick={() => this.onFragment(item)}
                                    className={`${styles.videoRightHeadList} ${state.fragment ===
                                                                               item.id
                                                                               ? styles.active
                                                                               : ''}`}>{item.name}</li>)
                             }
                        </ul>
                        <div className={styles.close} onClick={this.onClose}>×</div>
                    </div>
                    {state.Index===1 &&<div className={styles.classify}>
                            <ul className={styles.tagList}>
                                <li className={styles.tagListBox}>
                                    <label className={styles.tagTitle}>分类:</label>
                                    <ul className={styles.tagDetail}>
                                        <li onClick={() => this.onClassifyClear()}
                                            className={`${styles.tagDetailList} ${!state.classify
                                                ? styles.activeElse
                                                : ''}`}>全部
                                        </li>
                                        {state.videoClassify.length > 0 &&
                                        state.videoClassify.map((item, index) =>
                                            <li key={index} onClick={() => this.onClassify(item)}
                                                className={`${styles.tagDetailList} ${state.classify ===
                                                item.id
                                                    ? styles.activeElse
                                                    : ''} ${index ===
                                                state.videoClassify.length -
                                                1
                                                    ? styles.noneBorderRight
                                                    : ''}`}>{item.name}</li>)
                                        }
                                    </ul>
                                </li>
                                <li className={styles.tagListBox}>
                                    <label className={styles.tagTitle}>风格:</label>
                                    <ul className={styles.tagDetail}>
                                        <li onClick={() => this.onStyleClear()}
                                            className={`${styles.tagDetailList} ${!state.style
                                                ? styles.activeElse
                                                : ''}`}>全部
                                        </li>
                                        {state.videoStyle.length > 0 &&
                                        state.videoStyle.map((item, index) =>
                                            <li key={index} onClick={() => this.onStyle(item)}
                                                className={`${styles.tagDetailList} ${ index > tagLen
                                                    ? styles.tagDetailListNone
                                                    : ''} ${state.style ===
                                                item.id
                                                    ? styles.activeElse
                                                    : ''}`}>{item.name}</li>)
                                        }
                                        <li className={`${styles['tagDetailList']} ${styles['noneBorderRight']}`}
                                            onMouseEnter={this.myEnter} onMouseLeave={this.myLeave}>
                                        <span className={`${state.videoStyle.map(
                                            (v, i) => i > tagLen && v.id)
                                            .includes(state.style)
                                            ? styles.activeElse
                                            : ''}`}>更多</span> <Icon
                                            type={state.hoverMore}
                                            className={styles.tagDetailListIcon}/>
                                            <div className={styles.popOver}>
                                                <div className={styles.popOverTranigle}></div>
                                                <div className={styles.popOverMain}>
                                                    {state.videoStyle.length > 0 &&
                                                    state.videoStyle.filter((v, i) => i > tagLen)
                                                        .map((item, index) =>
                                                            <span key={index}
                                                                  onClick={() => this.onStyle(item)}
                                                                  className={`${styles.popOverMainList} ${state.style ===
                                                                  item.id
                                                                      ? styles.activeElse
                                                                      : ''}`}>{item.name}</span>)
                                                    }
                                                </div>
                                            </div>
                                        </li>
                                    </ul>
                                    <label className={styles.tagTitle}>类型:</label>
                                    <ul className={styles.tagDetail}>
                                        <li className={`${styles.tagDetailList } ${state.direction==='hoz' ? styles.activeElse:''}`} onClick={()=>this.changDirection('hoz')} >横板</li>
                                        <li className={`${styles.tagDetailList } ${styles.noneBorderRight} ${state.direction==='ver' ? styles.activeElse:''}`} onClick={()=>this.changDirection('ver')}>纵板</li>
                                    </ul>
                                    <div className={styles.colorBox} onMouseEnter={this.myEnterColor}
                                         onMouseLeave={this.myLeaveColor}>
                                        <label className={styles.tagTitle}>色系:</label>
                                        <ul className={styles.tagDetail}>
                                            <li className={`${styles.colorList}`} style={{
                                                background: `${state.themeColor
                                                    ? state.themeColor
                                                    : ''}`,
                                            }}></li>
                                            <Icon type={state.hoverColor}
                                                  className={styles.tagDetailListIcon}/>
                                        </ul>
                                        <div className={styles.popOverColor}>
                                            <div className={styles.popOverMainColor}>
                                            <span className={`${styles.colorListElse} ${state.theme
                                                ? ''
                                                : styles.borderStyle}`}
                                                  onClick={() => this.clearThemeColor()}></span>
                                                {state.videoTheme.length > 0 &&
                                                state.videoTheme.map((item, index) =>
                                                    <span key={index} onClick={() => this.onTheme(item)}
                                                          className={`${styles.popOverMainListColor} ${state.theme ==
                                                          item.id
                                                              ? styles.borderStyle
                                                              : ''}`}
                                                          style={{ background: `${item.name}` }}></span>)
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>}
                    <div ref={this.listDiv} className={styles.main}>
                        {
                            state.Index===0 && <div className={styles.mineVideoBox}>
                                {!state.mineVideoList.length && <Empty text={menuTitle}/>}
                                {!state.mineVideoList.length &&<Empty/>}
                                {state.mineVideoList.length > 0 &&
                                state.mineVideoList.map((item, index) =>
                                    <MineCard {...item} key={index}
                                              onClose={this.onClose}
                                              onChange={this.props.onChange}/>)
                                }
                            </div>
                        }
                        {
                            state.Index===1 &&<div className={styles.cardBox}>
                                {!state.list.length && <Empty text={menuTitle}/>}
                                {!state.list.length &&<Empty/>}
                                {state.list.length > 0 &&
                                state.list.map((item, index) =>
                                    <Card {...item} direction={state.direction} key={index}
                                          onClose={this.onClose}
                                          onChange={this.props.onChange}/>)
                                }
                            </div>
                        }
                        <div className={styles.pation}>
                            {state.count >= state.pageSize &&
                            <Pagination total={state.count} pageSize={state.pageSize}
                                        showQuickJumper={true} onChange={this.onGoToPage}
                                        current={Number(state.page || 1)}/>
                            }
                        </div>
                    </div>

                </div>
            </div>
        );
    }
}

export default VideoStore;
