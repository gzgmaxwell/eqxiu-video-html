import React from 'react';
import ReactDom from 'react-dom';
import lodash from 'lodash';
import styles from './timeLine.less';
import { contrast, limitNumber } from '../../../../util/data';


function MultiCard({ list = [], onActive = null, postion = {} }) {

    const dom = (
        <div
            className={styles.multiCard}
            style={{
                top: postion.top,
                left: postion.left,
            }}
        >
            <div className={styles.content}>
                {list.map(ele => {
                    return <div
                        key={ele.uuid}
                        className={styles.oneCard}
                        onClick={() => onActive(ele.uuid)}>
                        {ele.children}
                    </div>;
                })}
            </div>
            <div className={styles.triange}/>
        </div>);
    return ReactDom.createPortal(dom, document.body);
}


class SingleTimeBlock extends React.Component {

    constructor(props) {
        super(props);
        this.body = React.createRef();
        this.timeLineRect = null;
        this.mouseDown = null;
        this.type = 'range';
        this.mouseLeaveTimer = null;
        this.bodyBound = {};
        this.state = {
            isHover: false,
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (!lodash.isEqual(this.state, nextState)) {
            return true;
        }
        if (contrast(this.props, nextProps,
            ['duration', 'start', 'list.length', 'active', 'isGroup', 'end'])) {
            return true;
        }
        return false;
    }


    componentDidMount() {
        this.bodyBound = this.body.current.getBoundingClientRect();
    }

    componentDidUpdate() {
        this.bodyBound = this.body.current.getBoundingClientRect();
    }

    beginMove = (e, type) => {
        if (!this.props.active) return;
        this.setState({ isHover: false });
        this.timeLineRect = this.body.current.parentNode.getBoundingClientRect();
        this.mouseDown = {
            pageX: e.pageX,
            pageY: e.pageY,
        };
        this.type = type;
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.endMove);
    };

    onMouseMove = (e) => {
        const { pageX } = e;
        if (!this.timeLineRect) {
            return this.endCurrentMove(e);
        }
        const { x, width } = this.timeLineRect;
        const { pageX: prevPageX } = this.mouseDown;
        const {
            props: { onChange, list, duration, start, end },
        } = this;
        let distanceTime = (pageX - prevPageX) / width * duration;
        if (!distanceTime) return;
        const newState = {
            start,
            end,
        };
        // 在拖动到start < 0 时 ,置0
        if (this.type !== 'end' && (start + distanceTime) < 0) {
            distanceTime = 0 - start;
        }
        if (this.type === 'range') {
            newState.start = start + distanceTime;
            newState.end = end + distanceTime;
        } else {
            newState[this.type] += distanceTime;
        }
        this.mouseDown = {
            pageX: e.pageX,
            pageY: e.pageY,
        };
        if ((newState.end - newState.start < 0.2)) {
            return false;
        }
        if ((newState.end > 999)) {
            return false;
        }
        onChange(list.map(v => v.uuid), newState);
    };


    endMove = (e) => {
        this.timeLineRect = null;
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.endMove);
        const {
            props: { onChange, list, start, end },
        } = this;
        onChange(list.map(v => v.uuid), {
            start,
            end,
        }, true);
    };


    onHover = (e) => {
        this.setState({ isHover: true });
    };

    onMouseLeave = () => {
        clearTimeout(this.mouseLeaveTimer);
        this.mouseLeaveTimer = setTimeout(
            () => this.setState({ isHover: false }), 3000,
        );
    };

    render() {
        const {
            state: {
                isHover,
            },
            props: {
                active,
                isGroup,
                list,
                content = null,
                onClick,
                duration = 10,
                start = 0,
                end = 1,
                onActive = null,
            },
        } = this;
        const left = `${start / duration * 100}%`;
        const width = `calc(${(end - start) / duration * 100}% + 2px)`;
        return (
            <div className={styles.singleTimeRange}
                 ref={this.body}
                 style={{
                     left,
                     width,
                     zIndex: ~~(start * 10 + (active ? 1000 : 0)),
                 }}
                 onMouseOut={this.onMouseLeave}
                 onMouseEnter={() => clearTimeout(this.mouseLeaveTimer)}
            >
                {
                    (isHover && isGroup) &&
                    <MultiCard postion={this.bodyBound} list={list} onActive={onActive}/>
                }
                {active && <React.Fragment>
                    <div
                        className={`${styles.bar}`}
                        onMouseDown={event => this.beginMove(event, 'start')}
                    >
                        <span className={styles.slide_rect}></span>
                    </div>
                    < div
                        className={styles.singleRange}
                        onMouseDown={event => this.beginMove(event, 'range')}
                    ></div>
                    <div
                        className={`${styles.bar}`}
                        onMouseDown={event => this.beginMove(event, 'end')}
                    >
                        <span className={styles.slide_rect}></span>
                    </div>
                </React.Fragment>}
                <div
                    className={`${styles.tipIcon}
                    ${isGroup ? styles.groupIcon : ''} ${active ? styles.active : ''}`}
                    onClick={(e) => onClick(list.map(v => v._index), e)}
                    onMouseEnter={this.onHover}
                    onMouseDown={event => this.beginMove(event, 'start')}
                >
                    {isGroup ? list.length : content}
                </div>
            </div>
        );
    }
}

export default SingleTimeBlock;
