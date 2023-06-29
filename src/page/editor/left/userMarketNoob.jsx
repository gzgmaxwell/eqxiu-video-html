import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import styles from "./userMarket.less";
import { Free, Info, Shade, Title, Ul, NoobVideoBlock } from "./userMarketStyle";
import { List as markList } from "./userMarket";
import Button from "../../components/Button";
import Icon from "../../components/Icon";
import { getUserSetting, setUserSetting } from "../../../util/storageLocal";
import { genVideoUrl } from "../../../util/file";
import { name } from "../../../config/env";

const VIDEO_LIST = ["pre", "pro"].includes(name)
    ? [
          "/tencent/1400b946d047491d9d00e825d9a23c5a/1577425494382-l2tf2r15zg.mp4",
          "/tencent/1400b946d047491d9d00e825d9a23c5a/1577425531237-w2rw05s8wxh.mp4",
          "/tencent/1400b946d047491d9d00e825d9a23c5a/1577425401729-i4wkvfcbagq.mp4"
      ]
    : [
          "/tencent/b630517599fc42d5af7c382d24427769/1577425861737-0zkmq83xxiwf.mp4",
          "/tencent/b630517599fc42d5af7c382d24427769/1577425863540-y4u171976t.mp4",
          "/tencent/b630517599fc42d5af7c382d24427769/1577425860225-razo7d5watf.mp4"
      ];

function Noob({ onClose }) {
    const [step, setStep] = useState(0);
    const videoRef = useRef(null);
    const item = markList[step];
    const id = `userMark-${item.title}`;
    const dom = document.getElementById(id);

    function next() {
        if (step < 2) {
            setStep(step + 1);
        } else {
            onClose(true);
        }
    }

    if (dom) {
        const { width, height, left, top } = dom.getBoundingClientRect();
        return (
            <div>
                <Ul>
                    {step < 2 ? (
                        <li
                            style={{
                                position: "absolute",
                                left,
                                top,
                                width,
                                height
                            }}>
                            {item.icon}
                            <div className={styles.rightBLock}>
                                <Title>
                                    {item.title}
                                    {false && <Free>限时免费</Free>}
                                </Title>
                                <Info>{item.info}</Info>
                            </div>
                        </li>
                    ) : (
                        markList.map((cItem, index) => {
                            if (index < 2) return null;
                            const cDom = document.getElementById(`userMark-${cItem.title}`);
                            return (
                                <li
                                    key={cItem.title}
                                    style={{
                                        position: "absolute",
                                        left,
                                        top: top + height * (index - 2),
                                        width,
                                        height
                                    }}>
                                    {cItem.icon}
                                    <div className={styles.rightBLock}>
                                        <Title>
                                            {cItem.title}
                                            {false && <Free>限时免费</Free>}
                                        </Title>
                                        <Info>{cItem.info}</Info>
                                    </div>
                                </li>
                            );
                        })
                    )}
                </Ul>
                <NoobVideoBlock>
                    <video
                        width={230}
                        height={410}
                        src={genVideoUrl(VIDEO_LIST[step])}
                        autoPlay
                        muted
                        loop
                        controls={false}
                        ref={videoRef}
                    />
                    <Button
                        value={step === 2 ? "了解啦" : "查看下一组件"}
                        onClick={next}
                        style={{ width: 116 }}
                    />
                </NoobVideoBlock>
            </div>
        );
    } else {
        onClose();
        return null;
    }
}

function UserMarketNoob() {
    const key = "showedUserMarketNoob";
    const isShowed = getUserSetting(key);
    if (isShowed) return;
    const dom = document.createElement("div");
    document.body.append(dom);
    dom.className = styles.fullScreen;

    function onClose(save = false) {
        document.body.removeChild(dom);
    }

    setUserSetting(key, true);

    ReactDOM.render(
        <React.Fragment>
            <Shade />
            <div className={styles.closeIcon}>
                <Icon type={"eqf-no-f"} onClick={onClose} />
            </div>
            <Noob onClose={onClose} />
        </React.Fragment>,
        dom
    );
    return { onClose };
}

export default UserMarketNoob;
