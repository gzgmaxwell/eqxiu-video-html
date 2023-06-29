import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Button from './index';
import { formatEQXMessage } from '../../../util/event';
import { host } from '../../../config/env';
import Modal from '../modal';

const ImgBtnElse = styled(Button)`
    cursor: pointer;
    font-size: 14px;
    height: 36px;
    width: 100%;
    border-radius: 3px;
    line-height: 36px;
    font-family: PingFangSC-Regular;
    font-weight: 400;
    color: #333;
    border: 1px solid #ccd5db;
    background: #fff;
    >i{
      font-size: 16px;
      vertical-align: sub;
    }
    &:hover{
        color: #1593ff;
        border: 1px solid #1593ff;
        background-color: transparent;
    }
`;


function ImageButton({ src = null, onChange, name = '图片', ImgBtn = false }) {
    const [showImg, setShowImg] = useState(false);

    function openImageModel() {
        setShowImg(true);
    }

    function closeImageModel() {
        setShowImg(false);
    }

    function handlerMessage(e) {
        const data = formatEQXMessage(e);
        if (data === false) {
            return;
        }
        if (data.type === 'close') {
            closeImageModel();
        }
        if (data.type === 'success') {
            const picUrl = host.musicFile + data.data[0].path;
            onChange(picUrl);
            closeImageModel();
        }
    }

    useEffect(() => {
        if (showImg) {
            window.addEventListener('message', handlerMessage);
        }
        return () => window.removeEventListener('message', handlerMessage);
    }, [showImg]);


    const isNew = !src;
    const btnProps = {
        value: `${isNew ? '添加' : '更换'}${name}`,
        onClick: openImageModel,
        icon: isNew ? 'eqf-plus' : 'eqf-refresh-ccw',
    };

    return (
        <React.Fragment>
            {ImgBtn ? <ImgBtn onClick={openImageModel} /> : <ImgBtnElse {...btnProps} />}
            <Modal onCancel={closeImageModel} visible={showImg}>
                <iframe
                    src={`${host.auth}/material/image?source=music&notShowSys=true`}
                    scrolling="no" frameBorder="0"
                    style={{
                        width: 960,
                        height: 600,
                        display: 'block',
                        lineHeight: 0,
                        fontSize: 0,
                    }}
                />
            </Modal>
        </React.Fragment>
    );
}


export default ImageButton;
