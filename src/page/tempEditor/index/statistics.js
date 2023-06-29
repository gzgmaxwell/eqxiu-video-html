import React, { Component } from 'react';
import { connect } from 'dva';
import styles from './statistics.less';
import { genUrl } from '../../../util/image';
import Pagination from 'Components/pagination';
import Modal from 'Components/modal';
import SearchInput from 'Components/input/searchInput';
import Select from 'Components/input/select';
import { SEGMENT_TYPE } from '../../../config/staticParams';

@connect(({ tempEditor }) => ({ tempEditor }))
export default class Statistics extends Component {
    state = {
        url: null,
        title: null,
    };
    searchParams = {
        pageNo: 1,
        pageSize: 20,
        orderBy: 'update_time desc',
        key: this.props.searchKey || null,
        templateType: null,
        status: 7,
    };

    componentDidMount() {
        this.getData();
    }

    componentWillUnmount() {
        this.props.dispatch({
            type: 'tempEditor/reset',
            payload: {
                statisticsList: [],
                statisticsTotal: 0,
            }
        });
    }

    /**
     * 获取数据
     * */
    getData = () => {
        this.setState({
            loading: true,
        });
        this.props.dispatch({
            type: 'tempEditor/statistics',
            payload: {
                ...this.searchParams,
            },
        }).then(() => {
            this.setState({
                loading: false,
            });
        });
    };

    /**
     * 关闭和打开图片和视频预览的页面
     * */
    setVisible(url, title) {
        this.setState({ url, title });
    };

    /**
     * 翻页
     * */
    onPageChange = (pageNo) => {
        this.setSearchParams({ pageNo });
        this.getData();
    };
    /**
     * 搜索条件改变
     */
    handleChange = (name, value) => {
        this.setSearchParams({ [name]: value });
        this.search();
    };
    /**
     * 设置搜索的条件
     * */
    setSearchParams = (newParams = {}) => {
        this.searchParams = {
            ...this.searchParams,
            ...newParams,
        };
    };
    search = () => {
        this.setSearchParams({ pageNo: 1 });
        this.getData();
    };
    templateTypes = [{
        title: '上架模板总数',
        value: null,
    }, {
        title: 'AE模板',
        value: 1,
    }, {
        title: '作品模板',
        value: 4,
    }];

    render() {
        const { statisticsList: list, statisticsTotal: total } = this.props.tempEditor;
        const { url, title, loading } = this.state;
        const { pageNo, pageSize } = this.searchParams;
        return (<div className={styles.container}>
                <div>
                    <SearchInput placeholder="请输入模板名称" onSearch={(value) => this.handleChange('key', value || null)}
                                 className={styles.search}/>
                    <Select defaultValue={null} options={this.templateTypes} placeholder={'模板类型'} allowClear={true} className={styles.types}
                            onSelect={(value) => this.handleChange('templateType', value)}/>
                </div>

                <table className={styles.table}>
                    <thead className={styles.thead}>
                    <tr>
                        <th className={styles.id}>ID</th>
                        <th className={styles.video}>模板标题</th>
                        <th className={styles.type}>模板类型</th>
                        <th className={styles.update__time}>模板上架时间</th>
                        <th className={styles.num}>浏览量</th>
                        <th className={styles.num}>使用量</th>
                    </tr>
                    </thead>
                    <tbody className={styles.tbody}>
                    {list.length > 0 ? list.map((item) => {
                        const { id, coverImg, title, type, previewUrl, auditTime, pv, useQuantity } = item;
                        return (<tr key={id}>
                            <td>{id}</td>
                            <td className={styles.video}>
                                <div>
                                    <img src={genUrl(coverImg, '48:48')}
                                         onClick={() => this.setVisible(previewUrl, title)}/>
                                </div>
                                {title}</td>
                            <td>{type === SEGMENT_TYPE.VIDEO_GROUP_TEMPLATE ? '作品模板' : <div
                                className={styles.type}>模板</div>}</td>
                            <td>{auditTime || '暂未审核'}</td>
                            <td>{pv}</td>
                            <td>{useQuantity}</td>
                        </tr>);
                    }) : <tr>
                        <td colSpan={6} className={styles.noData}>{loading ? '加载中...' : '暂无数据'}</td>
                    </tr>}
                    </tbody>
                </table>
                {total >= pageSize &&
                <div className={styles.pagination}>
                    <Pagination total={total} pageSize={pageSize}
                                showQuickJumper={true}
                                onChange={this.onPageChange}
                                current={parseInt(pageNo || 0)}/>
                </div>}
                <Modal
                    visible={!!url}
                    header={<div className={styles.modal__header}>{`${title}${this.state.videoLoaded ? '' : '-loading'}`}</div>}
                    onCancel={() => this.setVisible()}
                >
                    <video autoPlay onCanPlay={() => this.setState({ videoLoaded: true })} controls src={genUrl(url)}
                           crossOrigin='Anonymous'
                           style={{ maxHeight: 500, maxWidth: 800, display: 'block' }}/>
                </Modal>
            </div>
        );
    }
}
