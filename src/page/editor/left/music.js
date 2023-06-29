import React from 'react';
import { prev, params, name } from 'Config/env';
import ColumnClass from './class/index.jsx';
import Music from './tab/music';
import { getMusicTags } from '../../../api/music';
import SoundEffect from './tab/soundEffect';
import eventEmitter from '../../../services/EventListener';

const isPro = ['pre', 'pro'].includes(name);

// 价格
const priceTags = [{
    id: 2000,
    name: '音乐价格',
    params: 2000,
    children: [{
        id: 2001,
        name: '免费',
        params: 2001,
    }, {
        id: 2002,
        name: '会员免费',
        params: 2002,
    }]
}];
// 用途
const useTags = [{
    id: 890767,
    name: '音乐用途',
    params: 890767,
    children: [{
        'id': 890935,
        'name': '精选',
        'params': 890935
    }, {
        'id': 890772,
        'name': '圣诞节',
        'params': 890772
    }, {
        'id': 890773,
        'name': '元旦',
        'params': 890773
    }, {
        'id': 890774,
        'name': '春节',
        'params': 890774
    }, {
        'id': 891912,
        'name': '邀请函',
        'params': 891912
    }, {
        'id': 892165,
        'name': '招聘',
        'params': 892165
    }, {
        'id': 894162,
        'name': '企业宣传',
        'params': 894162
    }, {
        'id': 894663,
        'name': '开业庆典',
        'params': 894663
    }, {
        'id': 894153,
        'name': '电商促销',
        'params': 894153
    }, {
        'id': 894671,
        'name': '音乐相册',
        'params': 894671
    }, {
        'id': 894667,
        'name': '节日祝福',
        'params': 894667
    }, {
        'id': 892490,
        'name': '冬季',
        'params': 892490
    }, {
        'id': 895910,
        'name': '游戏配乐',
        'params': 895910
    }]
}];
const useParentId = isPro ? 890767 : 890524;
class MusicContainer extends React.Component {
    constructor(props) {
        super(props);
    }

    state = {
        activeMenu: 1, // tab 选项是否激活
        musicTags: [], // 音乐tags
    };

    componentDidMount() {
        eventEmitter.on(`toggleSecondTabOf${this.props.index}`, this.activeMenu);
        this.getTags();
    }

    componentWillUnmount() {
        this.setState = () => null;
    }
    // 获取分类数据
    getTags() {
        console.log('isPro', isPro)
        getMusicTags({ id: params.musicTagId }).then((res) => {
            const { list } = res.data;
            if (list && list.length > 0) {
                const newTags = list.map(item => {
                    if (item.parentId === useParentId) {
                        return {
                            id: item.id,
                            name: item.name,
                            params: item.id
                        }
                    }
                }).filter(v => v);
                const newMusicTags = [
                    ...priceTags,
                    {
                        id: useParentId,
                        name: '音乐用途',
                        params: useParentId,
                        children: newTags
                    }
                ];
                this.setState({
                    musicTags: newMusicTags
                }, () => this.forceUpdate());
            }
        });
    }
    activeMenu = (index = 1) => {
        this.setState({ activeMenu: index });
    };

    render() {
        const { activeMenu, musicTags } = this.state;
        const { scrolling } = this.props;
        const headTags = [
            {
                name: '音乐',
                index: 1,
            },
            {
                name: '音效',
                index: 2,
            },
        ];
        return (
            <React.Fragment>
                <ColumnClass classTitle={headTags} index={activeMenu} activeMenu={this.activeMenu} />
                {
                    activeMenu == 1 ?
                        <Music scrolling={scrolling} topTag={params.musicTagId} musicTags={musicTags} />
                        : <SoundEffect />
                }
            </React.Fragment>
        );
    }
}

export default MusicContainer;
