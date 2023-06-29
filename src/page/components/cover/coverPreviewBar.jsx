import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { getImageInfoByTag } from '../../../api/videoStore';
import { genUrl } from '../../../util/image';

const Box = styled.div`
        background-repeat: no-repeat;
        width: 100%;
        height: 100%;
        background-size: contain;
        background-color: #D4D6E6;
`;

function CoverPreviewBar({
    pic //= 'https://video-test-1251586368.cos.ap-shanghai.myqcloud.com/tencent/0/25560.jpg'
    , transverse
    , defaultSrc = 'http://video-test-1251586368.image.myqcloud.com/tencent/a15069e48182488689315e38fd7961b7/template/0f57dd7e5d533b999a919c588b6b164f/e9a2310bcbdd497d895ff806dec7352f.jpg'
    , duration, scale: inputScale
}) {
    const boxRef = useRef(null);
    const [barStyles, setBarStyles] = useState({});
    let timer = null;
    useEffect(() => {
        const { parentElement } = boxRef.current || {};
        let cancel = false;
        async function resetCoverStyle() {
            const { width: outWidth, height: outHeight } = parentElement.getBoundingClientRect();
            let picWidth;
            // 是否是默认封面
            let isDefault = false;
            try {
                if (pic) {
                    ({ width: picWidth, } = await getImageInfoByTag(genUrl(pic)));
                } else {
                    throw new Error('no pic');
                }
            } catch (e) {
                console.log(e);
                isDefault = true;
                ({ width: picWidth, } = await getImageInfoByTag(genUrl(defaultSrc, transverse ? '128:72' : '75:133')));
            }
            if (!picWidth || !outWidth) return null;
            const height = picWidth > 100 ? 72 : 133;
            const scale = 64 / height;
            const oneSecondWidth = outWidth / Math.ceil(duration);
            const count = Math.ceil(outWidth / (~~picWidth * scale));
            const backgroundImageArray = [];
            const backgroundPositionArray = [];
            const buff = Math.ceil(duration / 480);
            // 循环设置背景
            for (let i = 0; i <= count; i += 1) {
                let nowSecond = Math.min(Math.round(i / count * outWidth / (oneSecondWidth)), Math.round(duration));
                nowSecond = Math.round(nowSecond / buff) + 1;
                if (!isDefault) {
                    backgroundImageArray.push(`url(${genUrl(pic)})`);
                    backgroundPositionArray.push(`${picWidth * i * scale}px -${height * scale * nowSecond}px`);
                } else {
                    backgroundImageArray.push(`url(${genUrl(defaultSrc)})`);
                    backgroundPositionArray.push(`${picWidth * i * scale}px 0px`);
                }
            }
            if (cancel) return;
            setBarStyles({
                backgroundImage: backgroundImageArray.join(', '),
                backgroundPosition: backgroundPositionArray.join(', '),
                backgroundSize: picWidth * scale,
            });

        }

        if ((pic || defaultSrc) && duration && parentElement) {
            clearTimeout(timer);
            // 延迟以等待modal动画结束。
            timer = setTimeout(resetCoverStyle, 200);
        }
        return () => {
            clearTimeout(timer);
            cancel = true;
        }
    }, [pic, duration, boxRef, inputScale, defaultSrc, transverse]);

    return (
        <Box ref={boxRef} style={barStyles}>
        </Box>
    );
}


export default CoverPreviewBar;
