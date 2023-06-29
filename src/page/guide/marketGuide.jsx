import React, { Component } from "react";
import styles from "./marketGuide.less";
import marketPhone from "../static/marketGuide/phone.png";
import marketIcon from "../static/marketGuide/marketIcon.png";
import allPepole from "../static/marketGuide/allPepole.png";
import allPepoleIcon from "../static/marketGuide/allPepopeIcon.png";
import link from "../static/marketGuide/marketLink.png";
import linkIcon from "../static/marketGuide/linkIcon.png";
import wxImg from "../static/marketGuide/marketWx.png";
import env from "Config/env";
import { genUrl } from "../../util/image";
import Button from "../components/Button";
import Icon from "../components/Icon";

const videoSrc = ["pre", "pro"].includes(env.name);
class marketGuide extends Component {
    constructor(props) {
        super(props);
        const yqCloud = videoSrc
            ? genUrl(
                  "/tencent/cf2cefbed1254294893230aff00d522a/7ef4a5775a80431f93de6a3b30000327.mp4"
              )
            : genUrl(
                  "/tencent/29bcb45ed60248c4bc8d5cdfc8f99976/a6b1d04634484b04afcbd529bdf7c404.mp4"
              );
        const yqCloud1 = videoSrc
            ? genUrl(
                  "/tencent/cf2cefbed1254294893230aff00d522a/ed4f0a0f3ff54f7f92670965cc5d9731.mp4"
              )
            : genUrl(
                  "/tencent/29bcb45ed60248c4bc8d5cdfc8f99976/355e47eefbc746c0bec150128e707ae2.mp4"
              );
        const yqCloud2 = videoSrc
            ? genUrl(
                  "/tencent/cf2cefbed1254294893230aff00d522a/42c5135003f549de8e95de5bdee148f6.mp4"
              )
            : genUrl(
                  "/tencent/29bcb45ed60248c4bc8d5cdfc8f99976/b929f9a5a2a3462ca8770b2fd9c334ff.mp4"
              );
        const yqCloud3 = videoSrc
            ? genUrl(
                  "/tencent/cf2cefbed1254294893230aff00d522a/4d21685dc9974cff884754d01ab67f3a.mp4"
              )
            : genUrl(
                  "/tencent/29bcb45ed60248c4bc8d5cdfc8f99976/c21c45c766804977a146274d1c9b848d.mp4"
              );
        const tip = videoSrc
            ? "https://res.eqh5.com/Fu9uXfwT26yVTeg0D8Nv1NSqOOs7"
            : "http://test.res.eqh5.com/Fu9uXfwT26yVTeg0D8Nv1NSqOOs7";
        this.state = {
            videos: [yqCloud, yqCloud1, yqCloud2, yqCloud3, tip]
        };
    }
    render() {
        const { videos } = this.state;
        return (
            <React.Fragment>
                <div className={styles.top__container}>
                    <div className={styles.top__content}>
                        <div>
                            <h1>营销组件上新啦</h1>
                            <p>你与用户的距离 </p>
                            <p>只差一个营销组件</p>
                        </div>
                        <video autoPlay loop muted src={videos[0]}>
                            您的浏览器不支持 video 标签。
                        </video>
                    </div>
                </div>
                <div className={styles.body__container}>
                    <div className={styles.left__bg} />
                    <div className={styles.center__bg} />
                    <div className={styles.right__bg} />
                    <div className={`${styles.item} ${styles.flexPos}`}>
                        <video autoPlay loop muted src={videos[1]}>
                            您的浏览器不支持 video 标签。
                        </video>
                        <div>
                            <img src={marketPhone} width='579' alt='' />
                            <Button
                                value={"查看使用教程"}
                                className={styles.lite}
                                onClick={() =>
                                    window.open("http://a.veqxiu.com/video/player/0/VKsDcf11G")
                                }
                            />
                            <Button
                                value={"点我直接做视频"}
                                className={styles.goUse}
                                onClick={() =>
                                    window.open("http://store.eqxiu.com/video/detail/1207162")
                                }
                            />
                        </div>
                    </div>
                    <div className={`${styles.item} ${styles.flexPoslse}`}>
                        <div>
                            <img src={wxImg} width='579' alt='' />
                            <Icon type={"eqf-wechat"} style={{backgroundColor:'#50D5E2'}} />
                            <Button
                                value={"查看使用教程"}
                                className={styles.lite}
                                onClick={() =>
                                    window.open("http://a.veqxiu.com/video/player/0/IiswNHzEC")
                                }
                            />
                            <Button
                                value={"点我直接做视频"}
                                className={styles.goUse}
                                onClick={() =>
                                    window.open("http://store.eqxiu.com/video/detail/1207228")
                                }
                            />
                        </div>
                        <video autoPlay loop muted src={videos[2]}>
                            您的浏览器不支持 video 标签。
                        </video>
                    </div>
                    <div className={`${styles.item} ${styles.flexPos}`}>
                        <video autoPlay loop muted src={videos[3]}>
                            您的浏览器不支持 video 标签。
                        </video>
                        <div>
                            <img src={link} width='579' alt='' />
                            <Icon type={"eqf-link"}style={{backgroundColor:'#1BC7B1'}} />
                            <Button
                                value={"查看使用教程"}
                                className={styles.lite}
                                onClick={() =>
                                    window.open("http://a.veqxiu.com/video/player/0/2refMIfHE")
                                }
                            />
                            <Button
                                value={"点我直接做视频"}
                                className={styles.goUse}
                                onClick={() =>
                                    window.open("http://store.eqxiu.com/video/detail/1205823")
                                }
                            />
                        </div>
                    </div>
                    <div>
                        <Button
                            className={styles.suggest}
                            value={"在线提交你的意见&建议"}
                            onClick={() => {
                                window.open("https://h5.ebdan.net/ls/PIRHeCGV");
                            }}
                        />
                    </div>
                    <div className={`${styles.item}`}>
                        <p>营销组件使用流程</p>
                        <img className={styles.end} src={videos[4]} alt='' />
                    </div>
                </div>
            </React.Fragment>
        );
    }
}

export default marketGuide;
