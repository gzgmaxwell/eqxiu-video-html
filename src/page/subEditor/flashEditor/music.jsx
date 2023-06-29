import React, { Component, Fragment } from 'react'
import { connect } from 'dva';
import { Button, Progress, message, Tooltip, Divider } from 'antd';
import { CANVAS_TYPE, FILE_TYPE } from 'Config/staticParams';
import ScrollContainer from 'Components/scrollContainer';
import Infinite from 'react-infinite-scroller';
import Empty from 'Components/empty';
import { host } from 'Config/env';
import { getFlashVideoMusic } from 'Api/userVideo';
import styles from './music.less';

@connect(({ flash }) => ({ bgm: flash.bgm }))
class Music extends Component {
    constructor(props) {
        super(props);
        this.audio = React.createRef();
        this.state = { 
            loading: true,
            endPage: false,
            page: 1,
            pageSize: 100,
            lists: [],
            progress: 0,
            openModal: false,
            playing: { 
                src: null, 
                oldSrc: null,
                title: '无'
            },
            bottonPlay: false
         }
    }
    componentDidMount() {
        //加载第一页
        this.loadLists();
        const flashAudio = document.getElementById('flashAudio');
        flashAudio.addEventListener('ended', () => {
            const { lists } = this.state;
            let arr = Object.assign(lists);
            arr.map(m => m.playing = false)
            this.setState({
                lists: arr,
                bottonPlay: false
            })
            console.log('播放结束', flashAudio.ended)
        });
    }
    /**
     * 加载音乐数据
     */
    loadLists = (page = 1) => {
        const { pageSize, lists } = this.state;
        const params = {
            fileType: 1,
            pageNo: page,
            pageSize,
        };
        this.setState({ loading: true });
        getFlashVideoMusic(params, page === 1)
            .then(res => {
                const { data } = res;
                if (data.success) {
                    this.loading = false;
                    let resList = [];
                    if (data.obj && data.obj.length > 0) {
                        data.obj.map(m => {
                            const arr = m.split('://');
                            resList.push({
                                title: arr[0],
                                src: `//${arr[1]}`,
                                playing: false,
                                isAdd: false
                            })
                        });
                        const newState = {
                            lists: page > 1 ? lists.concat(resList) : resList,
                            page: params.pageNo
                        };
                        const { bgm, dispatch } = this.props;
                        let initPlaying = {};
                        if(bgm) {
                            //编辑 已存在
                            const _bgm = bgm.split('://');
                            initPlaying = {
                                src: `//${_bgm[1]}`,
                                oldSrc: `//${_bgm[1]}`,
                                title: _bgm[0]
                            }
                            newState.lists.map(ml => {
                                if(ml.title == initPlaying.title) {
                                    ml.isAdd = true;
                                }
                            })
                        }else {
                            const random = Math.floor(Math.random() * resList.length);
                            const src = newState.lists[random].src;
                            const title = newState.lists[random].title;
                            newState.lists[random].isAdd = true;
                            initPlaying = {
                                src,
                                oldSrc: src,
                                title
                            }
                        }
                        console.log('initPlaying', initPlaying)
                        this.setState({
                            ...newState,
                            loading: false,
                            playing: initPlaying
                        });
                        // 默认随机添加一首音乐
                        dispatch({
                            type: 'flash/bgm',
                            payload: {
                                bgm: `${initPlaying.title}:${initPlaying.src}`
                            }
                        });
                    } else {
                        this.setState({
                            lists: page > 1 ? lists : [],
                            loading: false
                        });
                    }
                }
            })
            .catch(r => this.setState({ loading: false }));
    };

    /**
     * 播放/添加音乐
     */
    play = (src, index, type) => {
        const { lists } = this.state;
        const audio = this.audio.current;
        let arr = Object.assign(lists);
        let title = '';
        let oldSrc = src;
        audio.src = src;
        if('add' === type) {
            arr.map((m, idx) => {
                m.playing = false;
                m.isAdd = false;
                if(idx === index) {
                    title = m.title;
                    m.isAdd = true;
                }
            });
            this.props.dispatch({
                type: 'flash/bgm',
                payload: {
                    bgm: `${title}:${oldSrc}`
                }
            })
        }else {
            arr.map((m, idx) => {
                if(idx === index) {
                    arr[index].playing = !arr[index].playing;
                }else {
                    m.playing = false;
                }
            });
            title = this.state.playing.title;
            oldSrc = this.state.playing.oldSrc
            audio.play();
        }
        this.setState({
            lists: arr,
            bottonPlay: false,
            playing: {
                src,
                oldSrc,
                title,
                type
            }
        });
        
    }
    /**
     * 暂停
     */
    pause = (src, idx) => {
        const { lists } = this.state;
        const audio = this.audio.current;
        let arr = Object.assign(lists);
        arr[idx].playing = false;
        audio.pause();
        this.setState({
            lists: arr,
        })
    }
    playBtn = () => {
        const audio = this.audio.current;
        const { bottonPlay, lists, playing } = this.state;
        let arr = Object.assign(lists);
        arr.map((m, idx) => {
            m.playing = false;
        });
        audio.src = playing.oldSrc;
        if(bottonPlay) {
            audio.pause();
        }else {
            audio.play();
        }
        this.setState({
            lists: arr,
            bottonPlay: !bottonPlay
        })

    }
    render() { 
        const { 
            state: { lists, loading, endPage, loadMore, playing, bottonPlay }
        } = this; 
        return (
            <div className={`${styles.musicContainer} scrollDiv`} id='musicContainer'>
                <div className={styles.container}>
                    <p className={styles.rhythm}>快闪音乐</p>
                    {
                        lists.length === 0 && <Empty text={loading ? '加载中...' : '未找到快闪音乐'} style={{ marginTop: '30px' }}/>
                    }
                    {
                        lists.map((m, idx) => (
                            <div className={`${styles.item} ${m.playing ? styles.active : ''}`} key={idx}>
                                <div className={styles.title}>{m.title}</div>
                                {
                                    m.playing ? <Tooltip title="暂停">
                                    <div className={styles.play} onClick={() => this.pause(m.src, idx)}>
                                        <i className="icon iconfont iconpause" style={{fontSize: '21px'}} type="iconfont iconpause"></i>
                                    </div>
                                    </Tooltip> : <Tooltip title="试听">
                                        <div className={styles.play} onClick={() => this.play(m.src, idx, 'play')}>
                                                <i className="icon iconfont iconplay-line" type="iconfont iconplay-line"></i>
                                        </div>
                                    </Tooltip>
                                }
                                {
                                    m.isAdd ? 
                                    <div className={styles.add}>
                                        <i className={`icon eqf-yes ${styles.add_success}`} type="eqf-yes"></i>
                                    </div> :
                                    <Tooltip title="使用" onClick={() => this.play(m.src, idx, 'add')}>
                                        <div className={styles.add}>
                                            <i className="icon eqf-plus" style={{fontSize: '18px'}} type="eqf-plus"></i>
                                        </div>
                                    </Tooltip>
                                }
                                <div className={styles.time}></div>
                            </div>
                        ))
                    }
                    {
                        lists.length != 0 ? <Divider className={styles.flashDivider}>到底啦～～</Divider> :  null
                    }
                    <div className={styles.bottom}>
                        {/* <div className={styles.progress} style={{width: 'calc(60% - 80px)'}}></div> */}
                        <div className={styles.left}>已选音乐</div>
                        <div className={styles.right}>
                            <div className={styles.playBtn} onClick={this.playBtn}>
                            {
                                !bottonPlay ? <i className="icon eqf-play-f" type="eqf-play-f"></i>
                                : <i className="icon eqf-pause-f" type="eqf-pause-f"></i>
                            }
                            </div>
                            <div className={styles.playing}>
                                <span className={styles.title}>{playing.title}</span>
                                {/* <span className={styles.time}>00:02/00:10</span> */}
                            </div>
                        </div>
                        <audio ref={this.audio} id="flashAudio" />
                    </div>
                </div>
            </div>
        );
    }
}


 
export default Music;