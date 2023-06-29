import React from 'react';
import styles from './index.less';

class VideoCopyright extends React.PureComponent {
    constructor(props) {
        super(props);
    }

    state = {
    };
    componentDidMount() {
    }
    render() {
        let { state } = this
        return (
            <div className={styles.copyRight}>
                <h1 className={styles.copyRightHead}>易企秀视频版权法律风险声明</h1>
                <p className={styles.copyRightParam}>易企秀平台为用户提供自主上传视频素材的通道和入口，鼓励用户上传和使用原创优质素材，鼓励用户使用易企秀平台所提供的正版素材。如因用户的作品内容或使用的素材被他人投诉或第三方公司向易企秀公司提出异议，易企秀公司有权下架、删除有关作品信息和素材内容且不承担任何责任。</p>
                <p className={styles.copyRightParam}>同时，用户对自主上传的视频素材侵权风险承担全部责任，即用户因未经版权方授权进行上传和使用第三方平台或版权方的视频素材而引发的任何侵权纠纷事件，以及情节较为严重的经济索赔责任，均由用户全部承担，易企秀公司不承担任何责任。</p>
                <p className={styles.copyRightParam}>故用户须谨慎上传和使用版权来源不明确的任何视频素材。</p>
            </div>
        );
    }
}

export default VideoCopyright;
