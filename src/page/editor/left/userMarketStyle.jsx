import React from "react";
import Styled from "styled-components";
import BaseIcon from "../../components/Icon";

export const UserMarketIndexBody = Styled.div`
    width: 100%;
    
`;

export const Tips = Styled.div`
    width: 100%;
    height: 34px;
    background: #FFF8ED;
    text-align: center;
    line-height: 34px;
    font-size: 12px;
    color: #666666;
`;

export const Ul = Styled.ul`
    width: 100%;
    height: calc(100vh - 100px);
    overflow: auto;
   >li{
    width: 100%;
    height: 92px;
    display: flex;
    padding: 16px 18px 16px 10px;
    cursor: pointer;
    background-color: #fff;
    transition: top .3s ease-in;
    &:hover{
      background-color: #F7F8F9;
    }
   }
`;
export const Icon = Styled(BaseIcon)`
    width:60px;
    height:60px;
    display: block;
    border-radius: 50%;
    font-size: 26px;
    text-align: center;
    color: #fff;
    line-height: 60px;
    background-color: ${props => props.backgroundColor};
`;

export const Title = Styled.div`
    height:20px;
    font-size:14px;
    font-family:PingFangSC-Medium,PingFang SC;
    font-weight:bold;
    color:#333;
    line-height:20px;
    display: flex;
    align-items: center;
`;

export const Free = Styled.div`
    width:56px;
    height:16px;
    background:rgba(255,255,255,1);
    border-radius:3px 0px 3px 0px;
    border:1px solid rgba(255,41,106,1);
    font-size:12px;
    font-family:PingFangSC-Regular,PingFang SC;
    font-weight:400;
    color:rgba(255,41,106,1);
    margin-left: 10px;
    line-height:14px;
    text-align: center;
`;

export const Info = Styled.div`
    font-size:12px;
    font-family:PingFangSC-Regular,PingFang SC;
    font-weight:400;
    color:#777777;
    line-height:17px;
`;

export const HowUseA = Styled.a`
width: 120px;
height: 20px;
font-size: 14px;
font-family: PingFangSC-Regular,PingFang SC;
font-weight: 400;
color: rgba(21,147,255,1);
line-height: 20px;
display: block;
margin: 30px auto;
border-bottom: 1px #1593ff solid;
`;

export const FullscreenBlock = Styled.div`
    width: 100%;
    height: 100%;
    position: relative;
`;

export const Shade = Styled.div`
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: #00000099;
`;

export const NoobVideoBlock = Styled.div`
    position: absolute;
    left: 360px;
    top: 90px;
    width:262px;
    height:494px;
    background:rgba(255,255,255,1);
    border-radius:0px 3px 3px 0px;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    align-items: center;
    >video{
      transition: all .3s ease-in;
      opacity: 1;
      &.out{
        transform: translateY(-900px);
        opacity: 0;
      }
    }
`;
