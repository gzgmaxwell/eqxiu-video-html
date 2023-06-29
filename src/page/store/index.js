import React from "react";
import styles from "./store.less";
import { connect } from "dva";
import HorzCard from "../index/card/horzCard";
import VertCard from "../index/card/vertCard";
import qs from "qs";
import { setTitle } from "Util/doc";
import template from "Api/template";
import Empty from "../components/empty";
import Classify from "./class";
import Infinite from "react-infinite-scroller";
import Footer from "../layout/footer";
import env from "Config/env";
import { name, prev, storePrev } from "../../config/env";
import Icon from "Components/Icon";
import HorzCardStyles from "../index/card/horzCard.less";
import VertCardStyles from "../index/card/vertCard.less";
import Autoresponsive from "autoresponsive-react";
import ChooseVideoType from "../editor/chooseVideoType";
import storeLogo from "../static/image/storeLogorenli.png";

const getPagrSize = isHorz => {
    return !isHorz || isHorz === "hoz" ? 12 : 15;
};

@connect(({ tags, user }) => ({
    tags,
    user
}))
class index extends React.PureComponent {
    constructor(props) {
        super(props);
        window.location.href = "https://store.eqxiu.com/video/";
        return;
        this.body = React.createRef();
        this.loading = false;
        this.state = {
            list: [],
            isHorz: "",
            pageSize: 12,
            count: 25,
            page: 1,
            loading: false,
            openModal: false,
            detailId: null,
            endPage: false
        };
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        const newState = { ...prevState };
        let { search } = nextProps.location;
        search = search.replace("?", "");
        const searchObj = qs.parse(search);
        // 更新横纵
        if ((searchObj.hoz || "") !== prevState.isHorz) {
            newState.isHorz = !searchObj.hoz ? "" : searchObj.hoz || "hoz";
            newState.pageSize = getPagrSize(newState.isHorz);
            newState.list = [];
            newState.page = 1;
            newState.loading = true;
            newState.endPage = false;
        }
        return newState;
    }

    componentDidMount() {
        this.props.dispatch({
            type: "tags/fetch"
        });
        this.loadLists();
        // 视频首页流量统计
        if (name === "pro") {
            window._hmt && window._hmt.push([`_trackPageview`, `/store/video/`]);
        }
    }

    componentDidUpdate(prevProps) {
        if (this.props.location.search !== prevProps.location.search) {
            this.loadLists();
        }
    }

    openDetail = (id, title) => {
        window.open(
            `${window.__storePrev ? storePrev : `${prev}/store`}/video/detail/${id}?${qs.stringify({
                title
            })}`
        );
    };
    loadMore = () => {
        if (!this.loading) {
            this.loading = true;
            this.loadLists(this.state.page + 1);
        }
    };
    /**
     * 读取列表
     */
    loadLists = page => {
        let { search } = this.props.location;
        const { pageSize, isHorz, list } = this.state;
        this.setState({ loading: true });
        search = search.replace("?", "");
        const searchObj = qs.parse(search);
        const params = {
            pageNo: Math.max(page || searchObj.page || 1, 1),
            pageSize,
            orderBy: "weight_score desc,create_time desc",
            labelIds: [...(searchObj.tag || []), 1135],
            transverse: !isHorz ? null : isHorz === "hoz",
            videoDuration: searchObj.timelong,
            key: searchObj.key || null,
            showPv: true
        };
        template
            .getIndex(params)
            .then(res => {
                const { data } = res;
                if (data.success) {
                    this.loading = false;
                    const resList = data.list;
                    if (resList && resList.length > 0) {
                        const newState = {
                            list: page > 1 ? list.concat(resList) : resList,
                            page: params.pageNo,
                            count: data.map.count,
                            endPage: data.map.end,
                            redirect: ""
                        };
                        this.setState({
                            ...newState,
                            loading: false
                        });
                    } else {
                        this.setState({
                            list: page > 1 ? list : [],
                            loading: false,
                            endPage: true
                        });
                    }
                }
            })
            .catch();
    };
    showChooseVideoType = () => {
        this.setState({
            showChooseVideoType: true
        });
    };

    getAutoResponsiveProps() {
        return {
            itemMargin: 20,
            itemClassName: "item",
            containerWidth: 1240,
            gridWidth: 5,
            transitionDuration: ".5"
        };
    }

    render() {
        const { state, props } = this;
        const { isHorz, list, loading, endPage } = state;
        const horzStyle = !isHorz || isHorz === "hoz";
        const className = horzStyle ? styles.HorzCard : styles.VertCard;
        const blankClassName = horzStyle ? HorzCardStyles.Card : VertCardStyles.Card;
        return (
            <div className={`${styles.store}`} id='store__container' ref={this.body}>
                <div className={styles.top__search}>
                    <div className={styles.search__container}>
                        <div className={styles.search__title}>
                            <a href={"http://special.eqxiu.com/rlxz.html"}>
                                <img src={`${storeLogo}`} />
                            </a>
                        </div>
                    </div>
                    <div className={styles.navigation}>
                        <a href={`${env.host.store}`} target='_blank'>
                            H5
                        </a>
                        <a href={`${env.host.store}/h2.html`} target='_blank'>
                            轻设计
                        </a>
                        <a href={`${env.host.store}/h5l/`} target='_blank'>
                            长页
                        </a>
                        <a href={`${env.host.store}/h5e/`} target='_blank'>
                            易表单
                        </a>
                        <a
                            href={`${env.host.eqxiuzhan}/33e5fddb74104380b6baf655eb46d470.html`}
                            target='_blank'>
                            正版字体
                        </a>
                        <a
                            href={`${env.host.eqxiuzhan}/690153e20b694e30986b91a4e4186040.html`}
                            target='_blank'>
                            正版动图
                        </a>
                        <a href={`${env.host.qingshejihelp}/EQXGR`} target='_blank'>
                            10月更新
                        </a>
                        <a
                            href={`${env.host.store}/h5/list/sc890966-st8-sbseven_refer_count2%7Cdesc-pn1.html`}
                            target='_blank'>
                            会员专区<em>hot</em>
                        </a>
                    </div>
                </div>
                <Infinite
                    pageStart={0}
                    loadMore={this.loadMore}
                    hasMore={!endPage}
                    initialLoad={false}
                    threshold={100}>
                    <div className={styles.store__container}>
                        <Classify location={props.location} />
                        <div className={`${styles.cardBox} ${className}`}>
                            <Autoresponsive {...this.getAutoResponsiveProps()}>
                                <div
                                    style={{
                                        width: 285,
                                        height: horzStyle ? 262 : 604
                                    }}>
                                    <div
                                        className={`${blankClassName} ${styles.blankCard} index-Card scale-enter-done`}
                                        onClick={this.showChooseVideoType}>
                                        <Icon type='eqf-plus' className={styles.newCardIcon} />
                                        <div>空白创建</div>
                                    </div>
                                </div>

                                {list.map(item => {
                                    const Card = item.transverse ? HorzCard : VertCard;
                                    return (
                                        <div
                                            key={item.id}
                                            style={{
                                                width: 285,
                                                height: item.transverse ? 262 : 604
                                            }}>
                                            <Card
                                                {...item}
                                                key={item.id}
                                                onChose={id => this.openDetail(id, item.title)}
                                            />
                                        </div>
                                    );
                                })}
                            </Autoresponsive>
                        </div>
                    </div>
                </Infinite>
                {(list.length === 0 || loading) && (
                    <Empty
                        style={{
                            width: 338,
                            height: 400,
                            margin: "auto"
                        }}
                        text={loading && "读取中..."}
                    />
                )}
                <Footer />
                <ChooseVideoType
                    show={state.showChooseVideoType}
                    closeModal={() => this.setState({ showChooseVideoType: false })}
                />
            </div>
        );
    }
}

export default index;
