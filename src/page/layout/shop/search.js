import React from 'react';
import styles from './search.less';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import bg from 'Page/static/bg.svg';
import Icon from 'Components/Icon';
import Button from 'Components/Button/index';
import qs from 'qs';

@connect()
class Search extends React.PureComponent {

    constructor(props) {
        super(props);
        this.searchIput = React.createRef();
    }

    /**
     * 回车的判断
     * @param e
     */
    onChange = (e) => {
        if (e.charCode === 13) {
            this.onSearch(this.searchIput.current.value);
        }
    };

    onClick = (e) => {
        this.onSearch(this.searchIput.current.value);
    };
    /**
     * 搜索的跳转
     * @param value
     */
    onSearch = (value) => {
        const { props } = this;
        let { search } = props.location;
        search = search.replace('?', '');
        const searchObj = qs.parse(search);
        const newSearch = searchObj;
        newSearch.page = 1; // 重置页数
        newSearch.key = value;
        this.props.dispatch(routerRedux.push({
            pathname: '',
            search: qs.stringify(newSearch),
        }));
    };

    render() {
        const { props } = this;
        return (
            <div style={{ backgroundColor: '#fff' }}>
                <div className={styles.search_body}>
                    <div className={styles.title}>视频商城</div>
                    <div className={styles.searchDiv}>
                        {/*<div className={styles.search}>*/}
                            {/*<input type="text" id="searchKeyword" placeholder="邀请函"*/}
                                   {/*onKeyPress={this.onChange}*/}
                                   {/*ref={this.searchIput}/>*/}
                            {/*<Icon type='eqf-search-l' className={styles.searchIcon}/>*/}
                            {/*<Button onClick={this.onClick}*/}
                                    {/*className={styles.searchButton}>搜&nbsp;&nbsp;&nbsp;索</Button>*/}
                        {/*</div>*/}
                    </div>
                    <div style={{
                        marginRight: 1,
                        marginTop: -27,
                        float: 'right',
                    }}>
                        <img src={bg}/>
                    </div>

                </div>
            </div>
        );
    }
}

export default Search;
