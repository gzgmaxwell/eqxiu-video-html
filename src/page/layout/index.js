import React from 'react';
import { Route, Switch } from 'dva/router';
import Styles from './index.less';
import Header from './header/index';
import Container from './container';
import { connect } from 'dva';
import Upload from 'Page/upload';
import TempEditor from 'Page/tempEditor';
import Shop from 'Page/index';
import UserCentre from 'Page/userCentre/index';
import VideoDetail from 'Page/detail';
import { Helper } from '../components/helperFixed';
import { prev } from 'Config/env';
import dynamic from 'dva/dynamic';
import noPage from '../components/404';
import LeftSider from './leftSIder';
import MainNav from './mainNav';


@connect(({ backgruondColor }) => ({ backgruondColor }))
class Layout extends React.PureComponent {
    state = {
        isTemp: false,
        showGoTop: false,
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        const newState = { ...prevState };
        if (nextProps.location.pathname.indexOf(`${prev}/templateShow`) === 0 &&
            !prevState.isTemp) {
            newState.isTemp = true;
        }
        if (nextProps.location.pathname.indexOf(`${prev}/templateShow`) !== 0 && prevState.isTemp) {
            newState.isTemp = false;
        }
        return newState;
    }

    componentDidMount() {
        const node = document.getElementById('video-container');
        if (node) {
            node.addEventListener('scroll', this.onScroll);
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const node = document.getElementById('video-container');
        if (node) {
            node.addEventListener('scroll', this.onScroll);
        }
    }

    componentWillUnmount() {
        const node = document.getElementById('video-container');
        if (node) {
            document.getElementById('video-container')
                .removeEventListener('scroll', this.onScroll);
        }
    }

    onScroll = (e) => {
        const offsetTop = e.target.scrollTop;
        if (offsetTop > 1000) {
            this.setState({ showGoTop: true });
        } else {
            this.setState({ showGoTop: false });
        }
    };

    // 回到顶部
    goTop = () => {
        document.getElementById('video-container').scrollTop = 0;
        this.setState({ showGoTop: false });
    };

    render() {
        const { props, state: { isTemp, showGoTop } } = this;
        const { backgruondColor: { backgroundWhite } } = props;
        if (isTemp) {
            return (
                <div>
                    <Header location={props.location}/>
                    <div style={{
                        paddingTop: 60,
                        width: 1160,
                        margin: 'auto',
                    }}>
                        <Switch>
                            <Route exact path={`${prev}/templateShow`}
                                   component={dynamic({
                                       app: window._dva_app,
                                       component: () => TempEditor,
                                       models: () => [
                                           import('../../models/templateShow'),
                                           import('../../models/tempEditor')],
                                   })}/>
                            <Route path={`${prev}/templateShow/editor/:id/:readOnly?`}
                                   component={dynamic({
                                       app: window._dva_app,
                                       component: () => TempEditor,
                                       models: () => [
                                           import('../../models/templateShow'),
                                           import('../../models/tempEditor')],
                                   })}/>
                            <Route exact path={`${prev}/templateShow/:success`} component={Upload}/>
                            <Route component={noPage}/>
                        </Switch>
                    </div>
                </div>
            );
        }
        return (
            <div className={`${Styles.container} ${backgroundWhite ? Styles.containerOther : ''}`}>
                <Header location={props.location}/>
                <Helper goTop={showGoTop ? this.goTop : null}/>
                <LeftSider location={props.location}/>
                <MainNav location={props.location}/>
                <Container>
                    <div className={Styles.content}>
                        <Switch>
                            <Route exact path={`${prev}/index/:tab?`} component={Shop}/>
                            <Route exact path={`${prev}/scene`} component={UserCentre}/>
                            <Route exact path={`${prev}/detail/:id`} component={VideoDetail}/>
                            <Route component={noPage}/>
                        </Switch>
                    </div>
                </Container>
            </div>
        );
    }
}

export default Layout;
