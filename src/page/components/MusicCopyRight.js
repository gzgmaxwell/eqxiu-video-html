import React from 'react';
import styles from './copyRight.less';

class VideoCopyright extends React.PureComponent {
    constructor(props) {
        super(props);
    }

    state = {};

    componentDidMount() {
    }

    render() {
        let { state } = this;
        return (
            <div className={styles.copyRight}>
                <h1 className={styles.copyRightHead}>易企秀音乐版权许可与服务协议</h1>
                <div className={styles.title}>第一条 音乐版权声明</div>
                <p className={styles.copyRightParam}>
                    易企秀平台音乐库中所有收费音乐素材均是经版权方合法授权的正版素材，其知识产权和所有权归版权方所有。用户须购买后方可享有有限使用权。
                </p>
                <div className={styles.title}>第二条 授权使用方式</div>
                <p className={styles.copyRightParam}>
                    易企秀提供的音乐授权方式是有限使用权。用户付费购买前，仅享有在线试听权，用户只有在付费购买后，才享有音乐使用授权；音乐的使用权是非排他性的、全球性的、单用户的使用权，不受使用次数的限制，使用权不可转让。
                </p>
                <p className={styles.copyRightParam}>
                    用户只有完成付款后，才能按照本协议的约定获得音乐的有限使用权，否则，音乐的使用授权不成立。
                </p>
                <div className={styles.title}>第三条 授权使用范围</div>
                <p className={styles.copyRightParam}>
                    易企秀平台提供的收费音乐仅供用户付费后在易企秀平台（编辑器）内使用并通过各种途径对在易企秀场景中所创作的设计作品进行传播。用户不得用于易企秀平台以外的其他范围或项目，不得将付费后的音乐用于任何违法场合、包括但不限于违法的宣传品。
                </p>

                <div className={styles.title}>第四条 授权使用期限</div>
                <p className={styles.copyRightParam}>
                    音乐的授权使用期限为1年。用户自完成付费之日起算1年内享受本协议第二条和第三条约定的使用权限；授权到期后，用户如需继续使用音乐版权，须重新付费购买。
                </p>

                <div className={styles.title}>第五条 权利与义务</div>
                <p className={styles.copyRightParam}>
                    用户有权利按照本协议的约定许可条件，合理的使用音乐素材版权，并遵守《中华人名共和国著作权法》等相关法律法规的规定，未经授权任何单位和个人不得非法复制、转载或以其他任何方式使用，否则产生的一切法律责任和后果均由侵权方承担。
                </p>

                <div className={styles.title}>第六条 法律风险声明</div>
                <p className={styles.copyRightParam}>
                    易企秀平台为用户提供自主上传音频素材的通道和入口，允许用户添加合法的音频外链，鼓励用户上传和使用原创优质音频素材，同时鼓励用户使用易企秀平台所提供的正版素材。如因用户的作品内容或使用的素材被他人投诉或第三方公司向易企秀公司提出异议，易企秀公司有权下架、删除有关作品信息和素材内容且不承担任何责任。
                </p>

                <p className={styles.copyRightParam}>
                    同时，用户对自主上传的音频素材和音频外链侵权风险承担全部责任，即用户因未经版权方授权进行上传和使用第三方平台或版权方的音频素材而引发的任何侵权纠纷事件，以及情节较为严重的经济索赔责任，均由用户全部承担，易企秀公司不承担任何责任。
                </p>

                <p className={`${styles.copyRightParam} ${styles.subTitle}`}>
                    故用户须谨慎上传和使用版权来源不明确的任何音频素材和外链。
                </p>

                <div className={styles.title}>第七条 协议生效及其他</div>
                <p className={styles.copyRightParam}>
                    本协议是用户与北京中网易企秀科技有限公司之间关于用户在易企秀平台上使用音乐授权等相关服务所签订的一份具有法律效力的协议。用户在购买音乐版权前，须充分阅读和理解、同意并遵守本协议有关条款的内容，否则用户无权购买和使用。
                </p>
                <p className={styles.copyRightParam}>
                    用户完成付费购买的行为视为已经充分理解和同意本协议。在此协议发布之前，已经完成音乐版权购买的用户，须在本协议约定的条件和范围内使用音乐版权等有关服务。
                </p>
                <div className={styles.footer}>易企秀公司</div>
            </div>
        );
    }
}

export default VideoCopyright;
