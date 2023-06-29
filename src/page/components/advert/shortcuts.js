import React, { useState, useRef, useEffect } from 'react';
import styles from './shortcuts.less';
import Close from '../Button/close';
import { TYPE_SHORTCUTS } from '../../../config/staticParams/goodsParams';
import Icon from '../Icon';


export default function Shortcuts(props) {

    function onClose() {
        if (typeof props.onClose === 'function') {
            props.onClose();
        }
    }

    function onMouseDown(e) {
        const mouseDownX = e.clientX;
        const mouseDownY = e.clientY;
        const cutBox = document.getElementById('shortcuts');
        const { top, left, width, height } = cutBox.getBoundingClientRect();
        const changeX = mouseDownX - left;
        const changeY = mouseDownY - top;

        function moveMouse(e) {
            const moveCurrentX = e.clientX;
            const moveCurrentY = e.clientY;
            let newLeft = moveCurrentX - changeX;
            let newTop = moveCurrentY - changeY;
            if (newLeft < 0) {
                newLeft = 0;
            }
            if (newLeft + width > window.innerWidth) {
                newLeft = window.innerWidth - width;
            }
            if (newTop < 0) {
                newTop = 0;
            }
            if (newTop + height > window.innerHeight) {
                newTop = window.innerHeight - height;
            }
            const bottom = window.innerHeight - height - newTop;
            cutBox.style.left = `${newLeft}px`;
            cutBox.style.bottom = `${bottom}px`;
        }

        function upMouse() {
            window.removeEventListener('mousemove', moveMouse);
            window.removeEventListener('mouseup', upMouse);
        }

        window.addEventListener('mousemove', moveMouse);
        window.addEventListener('mouseup', upMouse);
    }
    function clickOther(e) {
        if (e.path.some(v => v.classList && Array.from(v.classList).includes('shortcutsWrap'))) return;
        onClose();
        document.removeEventListener('mouseup', clickOther);
    };
    useEffect(() => {
        document.addEventListener('mouseup', clickOther);
    })
    return (
        <div className={`${styles.shortcuts} shortcutsWrap`}>
            <div className={styles.top} onMouseDown={onMouseDown}>
                <span>快捷键</span>
                <Close style={{fontSize: '20px'}} type={'eqf-no'} onClose={onClose}/>
            </div>
            <div className={styles.keyboardBase}>
                {TYPE_SHORTCUTS.keyboardBase && TYPE_SHORTCUTS.keyboardBase.map((v, i) =>
                    <div key={i}>
                        <span>{v.name}</span> <span>{v.shortcuts}</span>
                    </div>,
                )}
            </div>
            <div className={styles.keyboardFn}>
                {TYPE_SHORTCUTS.keyboardFn && TYPE_SHORTCUTS.keyboardFn.map((v, i) =>
                    <div key={i}>
                        <span>{v.name}</span> <span>{v.shortcuts}</span>
                    </div>,
                )}
            </div>
            <div className={styles.keyboardFn}>
                {TYPE_SHORTCUTS.keyboardMove && TYPE_SHORTCUTS.keyboardMove.map((v, i) =>
                    <div key={i}>
                        <span>{v.name}</span> <Icon type={v.shortcuts} className={styles.Icon}/>
                    </div>,
                )}
            </div>
        </div>
    );
}
