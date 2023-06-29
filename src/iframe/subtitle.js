import React from 'react';
import ReactDom from 'react-dom';
import '../config/http';
// import { host } from '../config/env';
import Subtitles from '../page/templates/subtitles';
import styled from 'styled-components'
import { prev } from '../config/env';


const Header = styled.div`
        width: 100%;
        height: 60px;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        padding: 0 19px;
       
        margin-bottom: -30px;
`;

const Title = styled.h1`
    color: rgba(51,51,51,1);
    line-height: 60px;
    font-size:18px;
`;

const CloseBtn = styled.i`
        font-size: 28px;
        line-height:60px;
        cursor: pointer;
        color: #666;
        font-weight: 600;
        &:hover{
            color: #333
        }
`
const { parent } = window;
const oriUrl = '*';

function SubtitlesContainer(props) {
    const sendMsg = (postData) => {
        if (parent) {
            parent.postMessage(JSON.stringify(postData), oriUrl);
        }
    };
    /**
     * 选择视频后的跳转
     * @param {string} url 跳转的地址 
     */
    function onChose(url) {
        // const { } = host;
        const data = {
            type: 'redirect',
            url,
        }
        sendMsg(data);
    }
    /**
     * 通知关闭
     */
    function onClose() {
        const data = {
            type: 'close',
        }
        sendMsg(data);
    }

    function redirectEditor() {
        const data = {
            type: 'redirect',
            url: `${prev}/subEditor/subtitles/0`,
        }
        sendMsg(data);
    }

    return <div>
        <Header>
            <Title>选择视频</Title>
            <CloseBtn onClick={onClose}>×</CloseBtn>
        </Header>
        <Subtitles onChose={onChose} isIframe={true} openVideoStroe={redirectEditor} />
    </div>
}



ReactDom.render(<SubtitlesContainer />, document.getElementById('root'));