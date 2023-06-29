import React, { useEffect, useState } from "react";
import { connect } from "dva";
import { Radio } from "antd";
import Styled from "styled-components";
import styles from "./index.less";
import Icon from "../../../components/Icon";
import {
    MARKET_TYPE,
    USER_MARKET_NAME,
    USER_MARKET_STYLE_LIST
} from "../../../../config/staticParams/userMarket";
import Textarea from "../../../components/input/textarea";
import { SpaceLine } from "../StyleComponent";
import FontSizeSelect from "../text/fontSize";
import { SingleColorPicker } from "../../../components/colorPicker";
import ScrollInput from "../../../components/input/scrollInput";
import OpacityInput from "../../../components/input/opacityInput";
import ImageButton from "../../../components/Button/imageButton";
import { limitNumber, userMarketContentVerify, getUserMarketStyle } from "../../../../util/data";
import { prev } from "Config/env";
import { dbLength } from "../../../../util/util";
import StyleSelectInput from "../../../components/input/styleSelect";

const Body = Styled.div`
  padding: 19px 20px;
`;

const Label = Styled.div`
font-size:12px;
font-family:PingFangSC-Regular,PingFang SC;
font-weight:400;
color:rgba(153,153,153,1);
line-height:32px;
`;

const ColorBlock = Styled.div`
    margin: 12px 0;
    display: flex;
    >div:first-child{
        flex: 3;
    }
    >div:last-child{
    flex: 2;
    }
`;

function UserMarketBaseOption(props) {
    const {
        componentType,
        content,
        coverImg,
        fontSize,
        backgroundColor,
        activeIndex,
        opacity,
        title,
        timeType,
        onChange,
        color,
        uuid,
        styleType
    } = props;

    const [styleTab, setStyleTab] = useState(coverImg ? 2 : 1);
    const [componentStyleList, setComponentStyleList] = useState(undefined);
    /**
     * 异步整理列表
     */
    useEffect(() => {
        async function reloadList() {
            const list = USER_MARKET_STYLE_LIST[componentType];
            if (!list) return;
            let result = [];
            for (const { key, prevUrl, backgroundUrl } of list) {
                const img = (await prevUrl).default;
                const background = (await backgroundUrl).default;
                const obj = { key, img, background };
                result.push(obj);
            }
            setComponentStyleList(result);
        }
        reloadList();
    }, [componentType]);
    useEffect(() => {
        onBlurTitle();
        return () => {
            setTimeout(onBlurTitle(), 660);
        };
    }, []);

    function subscriptionTip() {
        const url = `${prev}/subscriptionGuide`;
        window.open(url);
    }

    let textTile = "链接";

    const verification = userMarketContentVerify(componentType);
    switch (componentType) {
        case MARKET_TYPE.wechat:
            textTile = (
                <span>
                    微信公众号关注链接&nbsp;
                    <Icon
                        onClick={subscriptionTip}
                        type={"eqf-why-f"}
                        style={{
                            color: "#666",
                            cursor: "pointer"
                        }}
                    />
                </span>
            );
            break;
        case MARKET_TYPE.phone:
            textTile = "手机/电话";
            break;
        default:
    }
    /**
     * 时间选择
     * @type {({label: string, value: number}|{label: string, value: number})[]}
     */
    const timeTypeList = [
        {
            label: "当前及之后所有片段",
            value: 2
        },
        {
            label: "当前片段",
            value: 1
        }
    ];

    /**
     * 按钮样式选择
     * @param value
     * @returns {*}
     */
    const styleList = [
        {
            label: " 默认 ",
            value: 1
        },
        {
            label: "自定义",
            value: 2
        }
    ];

    function onChangeContent(inValue) {
        let value = inValue;
        if (inValue.length >= 500) {
            value = String(value).slice(0, 499);
        }
        return onChange({ content: value });
    }

    function onChangeTimeType(e) {
        return onChange({ timeType: e.target.value });
    }

    function onChangeTab(e) {
        const {
            target: { value }
        } = e;
        if (value === 1 && coverImg) {
            onChange({ coverImg: "" });
        }
        return setStyleTab(value);
    }

    function onChangeTitle(inValue) {
        return onChange({ title: inValue });
    }

    function onBlurTitle() {
        if (!title) {
            return onChange({ title: "" });
        } else if (title.length > 12) {
            return onChange({ title: title.slice(0, 12), _index: activeIndex });
        }
    }

    function onChangeFontSize(inValue) {
        const value = limitNumber(inValue, [12, 250]);
        return onChange({ fontSize: value });
    }

    function onChangeFontColor(value) {
        return onChange({ color: value });
    }

    function onChangeBackgroundColor(value) {
        return onChange({ backgroundColor: value });
    }

    function onChangeOpacity(value) {
        return onChange({ opacity: ~~value });
    }

    function onChangeCover(value) {
        return onChange({ coverImg: value });
    }
    async function changeStyle({ key }) {
        const { fontStyle, background, styleType: s, defaultSize } = await getUserMarketStyle(
            componentType,
            key
        );
        return onChange({ styleType: s, background, ...fontStyle, ...defaultSize });
    }
    const contentTextProps = {
        key: uuid,
        labelName: textTile,
        placeholder: `请输入${componentType === MARKET_TYPE.wechat ? "链接" : textTile}`,
        onChange: onChangeContent,
        value: content,
        verification,
        outerStyle: { padding: "7px 0 2px" },
        autoSize: false,
        autoFocus: true
    };

    const titleProps = {
        key: uuid,
        labelName: "按钮名称",
        maxLength: 12,
        value: title,
        onChange: onChangeTitle,
        onBlur: onBlurTitle,
        onUnmount: onBlurTitle,
        unicode: false,
        outerStyle: { padding: "7px 0 21px" },
        autoSize: false
    };
    return (
        <Body>
            <Textarea {...contentTextProps} />
            <Label>展示时间</Label>
            <Radio.Group
                value={timeType}
                className={styles.timeTypeRadio}
                options={timeTypeList}
                onChange={onChangeTimeType}
            />
            <SpaceLine
                style={{
                    marginTop: 20,
                    marginBottom: 10
                }}
            />
            <Label>按钮</Label>
            <Radio.Group
                value={styleTab}
                buttonStyle='solid'
                onChange={onChangeTab}
                style={{ width: 160 }}>
                {styleList.map(item => (
                    <Radio.Button
                        key={item.value}
                        style={{
                            width: 80,
                            textAlign: "center"
                        }}
                        value={item.value}>
                        {item.label}
                    </Radio.Button>
                ))}
            </Radio.Group>
            {/*文本*/}
            {styleTab === 1 && (
                <React.Fragment>
                    <div className={styles.textRow}>
                        <StyleSelectInput
                            list={componentStyleList}
                            onChange={changeStyle}
                            chose={styleType}
                        />
                    </div>

                    <div className={styles.textRow}>
                        <Textarea {...titleProps} />
                    </div>

                    <FontSizeSelect value={fontSize} onChange={onChangeFontSize} />
                    <ColorBlock>
                        <SingleColorPicker
                            title={"文字颜色"}
                            width={160}
                            onChange={onChangeFontColor}
                            currentColor={color}
                        />
                        {/* <SingleColorPicker
                            width={64}
                            title={"背景颜色"}
                            onChange={onChangeBackgroundColor}
                            currentColor={backgroundColor}
                        /> */}
                    </ColorBlock>
                </React.Fragment>
            )}
            {/*图片*/}
            {styleTab === 2 && (
                <ColorBlock>
                    <ImageButton src={coverImg} onChange={onChangeCover} />
                </ColorBlock>
            )}
            <ColorBlock>
                <OpacityInput key={uuid} defaultValue={`${opacity}%`} onChange={onChangeOpacity} />
            </ColorBlock>
        </Body>
    );
}

function mapStateToProps({ workspace }) {
    const { dataList, activeIndex } = workspace;
    const {
        color,
        componentType,
        content,
        coverImg,
        fontSize,
        backgroundColor,
        opacity,
        title,
        timeType,
        uuid,
        styleType
    } = dataList[activeIndex] || {};
    return {
        componentType,
        content,
        coverImg,
        fontSize,
        backgroundColor,
        opacity,
        title,
        timeType,
        color,
        uuid,
        styleType,
        key: uuid,
        activeIndex
    };
}

function onChange(data) {
    return {
        type: "workspace/changeNow",
        payload: data
    };
}

export default connect(mapStateToProps, { onChange })(UserMarketBaseOption);
