import React from 'react';
import { prev, host } from 'Config/env';
import styles from './mineVideo.less';
import MineCard from './mineCard/index';
import Pagination from 'Components/pagination';
import Empty from '../../components/empty';
import { getInfo } from '../../../api/user';
import { userTemplateFind } from '../../../api/template';

class MineVideo extends React.PureComponent {
    constructor(props) {
        super(props);
        this.video = React.createRef();
        this.listDiv = React.createRef();
        this.qrcode = React.createRef();
    }

    state = {
        userId: '',
        phoneToken: '', // 手机上传验证
        phoneP: '', // 手机上传内容
        list: [], // 我的视频
        pageSize: 12,
        count: 25,
        page: 1,
        loading: true,
        openModal: true,// 视频裁剪
    };

    componentWillMount() {
        window.clearInterval(window.__mineVideoSetInterval);
    }

    componentDidMount() {
        this.getUser();
        window.__mineVideoSetInterval = setInterval(() => {
            this.getMineVideo(false);
        }, 4000);
    }

    componentWillUnmount() {
        window.clearInterval(window.__mineVideoSetInterval);
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.loading) {
            // this.setState({ loading: false });
        }
        if (this.state.page !== prevState.page) {
            this.getMineVideo();
        }
    }

    onGoToPage = (page, pageSize) => {
        this.setState({
            page,
        });
    };
    getUser = () => {
        getInfo()
            .then(res => {
                const { data } = res;
                if (data.success) {
                    this.setState({
                        userId: data.obj.id,
                    });
                    this.getMineVideo();
                }
            });
    };
    getMineVideo = (jumpTop = true) => {
        const params = {
            pageNo: this.state.page,
            pageSize: this.state.pageSize,
            userId: this.state.userId,
            orderBy: 'create_time desc',
            title: '',
        };
        return userTemplateFind(params)
            .then(res => {
                let { data } = res;
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
                    }, () => {if (jumpTop) this.listDiv.current.scrollTop = 0;}); // 滚动到顶部
                }
            });
    };
    onClose = () => {
        if (typeof this.props.onClose === 'function') {
            window.clearInterval(window.__mineVideoSetInterval);
            return this.props.onClose();
        }
    };
    closeModel = () => {
        this.setState({
            openModal: false,
        });
    };

    render() {
        const { state } = this;
        const menuTitle = state.loading ? '正在加载' : '没有找到相应的视频';
        return (
            <div>
                <div className={styles.videoRightHeadBox}>
                    <ul className={styles.videoRightHead}>
                        <li className={`${styles.videoRightHeadList} ${styles.active}`}>上传</li>
                    </ul>
                    <div className={styles.close} onClick={this.onClose}>×</div>
                </div>
                <div ref={this.listDiv} className={styles.main}>
                    <div className={styles.mineVideoBox}>
                        {!state.list.length && <Empty text={menuTitle}/>}
                        {state.list.length > 0 &&
                        state.list.map((item, index) =>
                            <MineCard {...item} key={index}
                                      onClose={this.onClose}
                                      onGetMineVideo={this.getMineVideo}
                                      onRefer={(e) => this.getMineVideo(false)}
                                      onChange={this.props.onChange}/>)
                        }
                    </div>
                    <div className={styles.pation}>
                        {state.count >= state.pageSize &&
                        <Pagination total={state.count} pageSize={state.pageSize}
                                    showQuickJumper={true} onChange={this.onGoToPage}
                                    current={Number(state.page || 1)}/>
                        }
                    </div>
                </div>

            </div>
        );
    }
}

export default MineVideo;
