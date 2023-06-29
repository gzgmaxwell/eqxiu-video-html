import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Popover } from 'antd';
import styles from './timeLineNoob.less';
import gif1 from '../../../static/noob/time-scale.gif';
import gif2 from '../../../static/noob/time-change.gif';
import gif3 from '../../../static/noob/time-changeItem.gif';
import png1 from '../../../static/noob/time-scale.png';
import png2 from '../../../static/noob/time-change.png';
import png3 from '../../../static/noob/time-changeItem.png';
import Button from '../../../components/Button';
import storeLocal, { getItem, localStorageKey } from '../../../../util/storageLocal';
import { genStoreData } from '../../../../util/util';
import { byReason } from '../../../../config/staticParams';
import { isNoobGuideIng } from '../../../../util/data';


const stepList = [
    {
        gif: gif1,
        img: png1,
        text: '滑动调节时间轴精度',
        element: 'time-scale-bar',
        gifHeight: 128,
        gifWidth: 228,
    },
    {
        gif: gif2,
        img: png2,
        text: '调整元素显示时间',
        element: 'time-content',
        gifHeight: 128,
        gifWidth: 228,
    },
    {
        gif: gif3,
        img: png3,
        text: '移动指针，查看不同时间点的元素',
        element: 'time-content',
        gifHeight: 276,
        gifWidth: 228,
    },
];

function TimeLineNoob({ onSuccess = () => null, onClose = () => null, boxEelement = null }) {
    const [step, setStep] = useState(0);
    const [showPopover, setShowPopover] = useState(false);
    const element = useRef();
    const bodyRef = useRef();
    const [activeItem, setActiveItem] = useState(stepList[step]);
    const timer = useRef();
    // const [gif, setGif] = useState(null);
    // const [pic, setPic] = useState(null);
    const clearPop = () => {
        cancelAnimationFrame(timer.current);
        setShowPopover(false);
    };

    function reShowPopover() {
        // setTimeout(() => {
        setShowPopover(false);
        timer.current = requestAnimationFrame(() => {
            setShowPopover(true);
        });
        // }, 0);
        return clearPop;
    }


    useEffect(reShowPopover, [step]);

    useEffect(() => {
        return clearPop;
    }, []);


    function nextStep() {
        if (step < 2) {
            const newStep = step + 1;
            setStep(newStep);
            setShowPopover(false);
            setActiveItem(stepList[newStep]);
        } else {
            clearPop();
            onClose();
        }
    }

    if (!activeItem) return null;
    element.current = document.getElementById(activeItem.element);
    const rect = element.current.getBoundingClientRect();
    let style = {};
    switch (step) {
        case 1:
            style = {
                left: rect.left + 140,
                top: rect.top,
                width: 286,
            };
            break;
        case 2:
            style = {
                left: rect.left + 140,
                top: rect.top - 26,
                width: 286,
            };
            break;
        default:
            style = {
                left: rect.left,
                top: Math.min(rect.top - 6, document.body.offsetHeight - 40),
                width: rect.width,
                minHeight: 40,
            };
    }


    const content = (<div className={styles.content}>
        <img
            width={activeItem.gifWidth} height={activeItem.gifHeight}
            src={activeItem.gif} className={styles.gif} />
        <p>{activeItem.text}</p>
        <Button
            onClick={nextStep}
            className={styles.next}
            lite={1}
        >
            {step === 2 ? '关闭' : '下一步'}
        </Button>
    </div>);
    return (
        <div className={styles.body} ref={bodyRef}>
            <div className={styles.shade} />
            <Popover
                content={content} visible={showPopover} placement={'top'}
                getPopupContainer={() => bodyRef.current}>
                <img
                    src={activeItem.img} className={styles.showImg}
                    // onLoad={reShowPopover}
                    style={style} />
            </Popover>
        </div>
    );
}

export async function showTimeLineNoob(props = {}) {
    const key = storeLocal.key.timeLineNoob;
    if (storeLocal.getItem(key) || isNoobGuideIng()) {
        return;
    }
    storeLocal.setItem(key, genStoreData(byReason.passed));
    const dom = document.createElement('div');
    dom.id = 'timeLineNoodModal';
    dom.className = styles.body;
    document.body.append(dom);
    const close = () => {
        document.body.removeChild(dom);
    };
    const tProps = {
        ...props,
        returnDom: true,
        onClose: close,
    };
    ReactDOM.render(<TimeLineNoob {...tProps} />, dom);
}


export default TimeLineNoob;
