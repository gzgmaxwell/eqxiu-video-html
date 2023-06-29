import React from 'react';
import { host } from 'Config/env';
import Icon from 'Components/Icon';
import Styles from './userInfo.less';
import { connect } from 'dva';
import { genAvatar } from '../../../util/image';


@connect(({ user }) => ({ user }))
class UserInfo extends React.PureComponent {

    logout = () => {
        this.props.dispatch({
            type: 'user/logout',
        });
    };

    render() {
        const { state, props } = this;
        const { user } = props;
        return (
            <div className="eqx-toolbar">
                <div className="eqx-msg-list">
                </div>
                <div className="eqx-user-avatar">
                    <div className="avatar-head">
                        <a href="//www.eqxiu.com/site/usercenter/account?fromeip">
                            {user.headImg ? <img src={genAvatar(user.headImg, '40:40')}/> :
                             <Icon className={Styles.noImgIcon} type='eqf-user-f'/>}
                        </a>
                    </div>
                    <ul>
                        <li className="user-type-tag">
                            <span
                                className="//www.eqxiu.com/site/usercenter/account?fromeip">个人账号</span>
                        </li>
                        <li className="">
                            <a href='/eip/userscene'>用户中心</a>
                        </li>
                        <li className="">
                            <a href={`${host.client}/scene`} data-name="我的作品">我的作品</a>
                        </li>
                        <li className="">
                            <a id="logout" onClick={this.logout}>退出登录</a>
                        </li>
                    </ul>
                </div>
            </div>
        );
    }
}

export default UserInfo;
