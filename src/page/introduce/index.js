import React from 'react';
import { routerRedux } from 'dva/router';
import delayLoad from '../../util/delayLoad.js';
import template from 'Api/template';
import chunk from '../../util/chunk';
import env from 'Config/env';
import Icon from '../components/Icon';
import styles from './index.less';
import pcImg from '../static/image/pc.png';
import stepGroup1 from '../static/image/Group@2x.png';
import stepGroup2 from '../static/image/Group2@2x.png';
import stepGroup3 from '../static/image/Group3.png';
import stepGroup4 from '../static/image/Group4.png';
import icon1 from '../static/image/icon@2x.png';
import icon2 from '../static/image/icon2.png';
import icon3 from '../static/image/Group4@2x.png';
import banner1 from '../static/image/banner1.png';
import banner2 from '../static/image/banner2.png';
import banner3 from '../static/image/banner3.png';
import { genVideoUrl } from '../../util/file';
import { genUrl } from '../../util/image';
import Video from '../components/video/card';
import VideoPlayButton from '../components/Button/VideoPlayButton';
import Header from '../layout/header';
import Footer from '../layout/footer';
import { prev, name } from '../../config/env';
import Button from '../components/Button';

class Card extends React.PureComponent {
    constructor(props) {
        super(props);
        this.video = React.createRef();
    }

    state = {
        noPlayed: true,
        playing: false,
        hoverBtn: false,
    };
    play = () => {
        if (this.state.playing) {
            this.onPause();
        } else {
            this.onPlay();
        }
    };
    onPlay = () => {
        this.video.current.play();
        this.setState({
            noPlayed: false,
            playing: true,
        });
    };
    onPause = () => {
        this.video.current.pause();
        this.setState({ playing: false });
    };
    myHover = () => {
        this.setState({
            hoverBtn: true,
        });
    };
    myNohover = () => {
        this.setState({
            hoverBtn: false,
        });
    };

    render() {
        const { state, props: { item, index } } = this;
        return (<div className={`${styles.singleBox} index-Card`} onMouseEnter={this.myHover}
                     onMouseLeave={this.myNohover}>
            <div className={styles.topBox} onClick={this.play}>
                <img className={styles.videoBackGround}
                     src={genUrl(item.coverImg, '','/gravity/Center/crop/224x246/format/jpg')}/>
                <Video
                    onClick={this.play}
                    preload='none'
                    ref={this.video}
                    controls={false}
                    className={styles.topImg}
                    onPlay={this.onPlay}
                    onPause={this.onPause}
                    poster={genUrl(item.coverImg, '224:246:jpg:0')}
                    src={genVideoUrl(item.previewUrl)}/>
                <div className={!state.playing ? styles.mark : styles.markNone} onClick={this.play}>
                    <VideoPlayButton className={styles.playBtn}/></div>
            </div>
            <div className={styles.bottomBox}>
                <div className={`${styles.noHover} ${state.hoverBtn ? styles.allHide : ''}`}>
                    <div className={styles.noHoverMain}>
                        <p className={styles.title}>{item.title}</p>
                        <p className={styles.info}><Icon type="eqf-eye-f"
                                                         className={styles.eyeIcon}/><span>{item.pv}</span>
                        </p>
                    </div>
                    <div className={styles.free}>免费</div>
                </div>
                <div className={`${styles.HoverBox} ${state.hoverBtn ? styles.allShow : ''}`}>
                    <p className={styles.title}>{item.title}</p>
                    <p className={styles.btnBox}><Button className={styles.btn}
                                                         onClick={this.props.onJump}>立即使用</Button>
                    </p>
                </div>
            </div>
        </div>);
    }
}

// let Swiper = window.Swiper
class Introduce extends React.PureComponent {
    constructor(props) {
        super(props);
        this.lun = React.createRef();
        this.video = React.createRef();
    }

    state = {
        swiper: '',
        list: [],
        noPlayed: true,// 播放状态
        playing: false,// 正在播放
        bannerHover: false,// banner 激活
    };

    componentDidMount() {
        this.loadLists();
        if (name === 'pro') {
            window._hmt && window._hmt.push([`_trackPageview`, `/video/introduce`]);
        }
    }

    myEnter = () => {
        this.setState({
            bannerHover: true,
        });
    };
    myLeave = () => {
        this.setState({
            bannerHover: false,
        });
    };
    loadCropper = () => {
        delayLoad.delayLoadCSS(env.css.swiper);
        delayLoad.delayLoadJS(env.plugin.swiper)
            .then((res) => {
                this.swiper = new Swiper(this.lun.current, {
                    width: 1204,
                    loop: true,
                    pagination: '.swiper-pagination',
                    paginationClickable: true,
                });
            });
    };
    loadLists = () => {
        const params = {
            pageNo: 1,
            pageSize: 20,
            orderBy: 'weight_score desc,create_time desc',
            transverse: true,
            key: '',
        };

        template.getIndex(params)
            .then(res => {
                const { data } = res;
                if (data.success) {
                    let myData = chunk(data.list, 5);
                    const newState = {
                        list: myData,
                    };
                    this.setState({
                        ...newState,
                        loading: false,
                    }, this.loadCropper);
                }
            })
            .catch();
    };

    jumpIndex = () => {
        window._eqx_dispatch(routerRedux.push(`${prev}/index`));
    };

    render() {
        const { state } = this;
        return (
            <React.Fragment>
                <Header/>
                <div className={styles.allBox}>
                    <div className={styles.banner}>
                        <div className={styles.bjMark}></div>
                        <div className={styles.main}>
                            <div className={styles.leftBox}>
                                <p className={styles.title}>易企秀视频，简易的视频编辑工具</p>
                                <p className={styles.titleS}>低成本打造高端美观的视频</p>
                                <div className={`${styles.btn} `} onClick={this.jumpIndex}>免费制作
                                </div>
                            </div>
                            <div className={styles.rightBox} onMouseEnter={this.myEnter}
                                 onMouseLeave={this.myLeave}>
                                <img src={pcImg} className={styles.pcImg} alt=""/>
                                <div className={styles.moveBox}>
                                    <img src={banner1} className={`${styles.banner1}`} alt=""/>
                                    <img src={banner2} className={`${styles.banner2}`} alt=""/>
                                    <img src={banner3} className={`${styles.banner3}`} alt=""/>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={styles.stepBox}>
                        <div className={styles.contentBox}>
                            <p className={styles.title}>打造一个视频仅需四步</p>
                            <div className={styles.main}>
                                <div className={styles.stepOneBox}>
                                    <div className={styles.mainList}>
                                        <img src={stepGroup1} className={styles.stepGroup1} alt=""/>
                                        <div className={styles.title}>选择模板</div>
                                        <div className={styles.titleS}>海量模板，各大行业全覆盖</div>
                                    </div>
                                </div>
                                <div className={styles.stepOneBox}>
                                    <div className={styles.mainList}>
                                        <img src={stepGroup2} className={styles.stepGroup1} alt=""/>
                                        <div className={styles.title}>添加片段</div>
                                        <div className={styles.titleS}>片头内容片尾灵活搭配</div>
                                    </div>
                                </div>
                                <div className={styles.stepOneBox}>
                                    <div className={styles.mainList}>
                                        <img src={stepGroup3} className={styles.stepGroup1} alt=""/>
                                        <div className={styles.title}>替换图文</div>
                                        <div className={styles.titleS}>自定义视频片段素材</div>
                                    </div>
                                </div>
                                <div className={styles.stepOneBox}>
                                    <div className={styles.mainList}>
                                        <img src={stepGroup4} className={styles.stepGroup1} alt=""/>
                                        <div className={styles.title}>快速渲染</div>
                                        <div className={styles.titleS}>高性能后台选渲染</div>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.btn} onClick={this.jumpIndex}>立即体验</div>
                        </div>
                    </div>
                    <div className={styles.templateBox}>
                        <div className={styles.contentBox}>
                            <div className={styles.titleBox}>
                                <p className={styles.title}>满足企业营销和个人宣传的海量模板</p>
                                <p className={styles.titleS}>· 企业宣传 · 邀请函 · 活动促销</p>
                            </div>
                            <div className="swiper-container" ref={this.lun}>
                                <div className="swiper-wrapper">
                                    {state.list.length > 0 &&
                                    state.list.map((item, index) =>
                                        <div className="swiper-slide" key={index}>
                                            <div className={styles.main}>
                                                {item.map((item, index) =>
                                                    <Card key={index} mystate={state} item={item}
                                                          onJump={this.jumpIndex}
                                                          index={index}/>,
                                                )
                                                }
                                            </div>
                                        </div>,
                                    )
                                    }
                                </div>
                                <div className="swiper-pagination"
                                     style={{ width: '1200px' }}></div>
                            </div>
                        </div>
                    </div>
                    <div className={styles.spreadBox}>
                        <div className={styles.contentBox}>
                            <p className={styles.title}>良好的视频播放体验有助于快速推广</p>
                            <div className={styles.main}>
                                <div className={styles.listBox}>
                                    <div className={styles.mainList}>
                                        <img src={icon1} className={styles.stepGroup1} alt=""/>
                                        <div className={styles.title}>多平台同步播放</div>
                                    </div>
                                </div>
                                <div className={styles.listBox}>
                                    <div className={styles.mainList}>
                                        <img src={icon2} className={styles.stepGroup1} alt=""/>
                                        <div className={styles.title}>多变播放速度</div>
                                    </div>
                                </div>
                                <div className={styles.listBox}>
                                    <div className={styles.mainList}>
                                        <img src={icon3} className={styles.stepGroup1} alt=""/>
                                        <div className={styles.title}>本地超清分享</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer/>
            </React.Fragment>
        );
    }
}

export default Introduce;
