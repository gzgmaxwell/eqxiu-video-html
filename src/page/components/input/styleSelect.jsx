import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import styles from "./textarea.less";
import Icon from "../Icon";
import { genUrl } from "../../../util/image";

const StyleSelectBox = styled.div`
    position: fixed;
    bottom: 67px;
    right: 265px;
    width: 264px;
    height: 363px;
    background: rgba(255, 255, 255, 1);
    box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.08);
    border-radius: 6px 6px 0px 0px;
`;

const Title = styled.div`
    width: 264px;
    height: 40px;
    background: rgba(240, 241, 248, 1);
    border-radius: 6px 6px 0px 0px;
    font-size: 14px;
    font-family: PingFangSC-Semibold, PingFang SC;
    font-weight: 600;
    color: rgba(51, 51, 51, 1);
    line-height: 40px;
    padding: 0 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    > i {
        font-size: 18px;
        font-weight: 600;
        cursor: pointer;
    }
`;

const ListContent = styled.div`
    padding: 8px 9px 20px 20px;
    height: 323px;
    overflow: auto;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
`;

const SelectCard = styled.div`
    width: 112px;
    height: 112px;
    margin: 0 0 8px 0;
    background-color: #f0f1f8;
    background-image: url('${({ img }) =>
        true ? img : genUrl(img, "112:112:png")}');
    box-shadow: 0px 1px 4px 0px rgba(0, 0, 0, 0.08);
    border-radius: 3px;
    cursor: pointer;
    background-repeat: no-repeat;
    background-position: center;
    background-size: 100%;
    &:hover {
        box-shadow: 0px 0px 12px 0px rgba(0, 0, 0, 0.16);
        background-image: url('${({ img }) =>
            true ? img : genUrl(img, "112:112")}');
    }
`;

function StyleSelectInput(props) {
    const {
        labelName = "按钮样式",
        list = [
            { img: "//res.eqh5.com/FjzfqicZ-qMDzrtbGIe8JzMy-Jx8" },
            { img: "" },
            { img: "" },
            { img: "" },
            { img: "" },
            { img: "" },
            { img: "" },
            { img: "" },
            { img: "" },
            { img: "" }
        ],
        onChange,
        chose
    } = props;
    const [showBox, setShowBox] = useState(null);
    const selectBoxRef = useRef(null);
    const choseImg = (list.find(v => v.key === chose) || {}).img || undefined;
    function showSelectBox() {
        setShowBox(true);
    }

    function closeSelectBox() {
        setShowBox(false);
    }

    useEffect(() => {
        function clickOther(event) {
            const ele = selectBoxRef.current;
            if (!(event.path && event.path.includes(ele))) {
                setShowBox(false);
            }
        }
        if (showBox) {
            document.addEventListener("mouseup", clickOther);
        }
        return () => document.removeEventListener("mouseup", clickOther);
    }, [showBox]);

    const boxClass = styles[showBox ? "boxShow" : showBox === null ? "boxNull" : "boxHidden"];
    return (
        <React.Fragment>
            <div
                className={`${styles.outer} ${styles.styleSelect}`}
                onClick={showBox ? null : showSelectBox}>
                <div className={`${styles.labelName}`}>{labelName}</div>
                <img className={styles.styleImg} src={choseImg} />
                <Icon type='eqf-menu-right' className={styles.styleSelectIcon} />
            </div>
            <StyleSelectBox className={boxClass} ref={selectBoxRef}>
                <Title>
                    {labelName}
                    <Icon type='eqf-no' onClick={closeSelectBox} />
                </Title>
                <ListContent>
                    {list.map(v => (
                        <SelectCard key={Math.random()} {...v} onClick={() => onChange(v)} />
                    ))}
                </ListContent>
            </StyleSelectBox>
        </React.Fragment>
    );
}

export default StyleSelectInput;
