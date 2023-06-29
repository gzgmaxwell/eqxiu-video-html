import React from 'react';
import styles from './move.less';
import { genUrl } from '../../../../util/image';
import { genVideoUrl } from '../../../../util/file';

export default class Move extends React.PureComponent {
    constructor(props) {
        super(props);
        this.scaleBox = React.createRef();
        this.video = React.createRef();
        this.move = React.createRef();
        this.origin = false; // false 视频未按照原始比例缩放
        this.width = props.width;
        this.height = props.height;
        this.state = {
            width: 0,
            height: 0,
            left: 0,
            top: 0,
            originRate: 0, // 视频原始比例缩放
            dx: 0,
            dy: 0,
            sx: 0,
            sy: 0,
        };
    }
    static getDerivedStateFromProps(nextProps,prevState) {
        const newState = {}
        newState.originRate = nextProps.width / nextProps.height;
        return newState;
    }

    componentDidMount() {
        const { state: {left, top, width, height}, props } = this
        this.scaleBoxPos = this.scaleBox.current.getBoundingClientRect();
        this.play();
        this.handleData();
        const position = {
            positionX: left,
            positionY: top,
            width: width,
            height: height,
        }
        props.refreshList(position);
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.videoScale !== this.origin) {
            this.origin = prevProps.videoScale;
        }
        if(prevProps.playing) {
            this.onPlay();
        } else {
            this.onPause();
        }
    }
    handleData= () =>{
        const { props: { width, height, videoScale } } = this;
        this.setState({ width, height });
        this.origin = videoScale;
    }
    startMove = (e, type) => {
        e.stopPropagation();
        e.preventDefault();
        if (type === 'TL') {
            this.commonBind(this.moveTL);
        } else if (type === 'T') {
            this.commonBind(this.moveT);
        } else if (type === 'TR') {
            this.commonBind(this.moveTR);
        } else if (type === 'R') {
            this.commonBind(this.moveR);
        } else if (type === 'BR') {
            this.commonBind(this.moveBR);
        } else if (type === 'B') {
            this.commonBind(this.moveB);
        } else if (type === 'BL') {
            this.commonBind(this.moveBL);
        } else if (type === 'L') {
            this.commonBind(this.moveL);
        } else if (type === 'DRAG') {
            let dx = e.clientX;
            let dy = e.clientY;
            let sx = this.move.current.offsetLeft;
            let sy = this.move.current.offsetTop;
            this.setState({
                dx,
                dy,
                sx,
                sy,
            });
            this.commonBind(this.drag);
        }
    }

    /**
     * video 播放事件
     * @param {function} func
     */
    play = () => {
       /* const { props: { playing } } = this
        if (playing) {
            this.video.current.pause();
        } else {
            this.video.current.play();
        }*/
    }
    onPlay = () => {
        this.video.current.play();
    }
    onPause = () => {
        this.video.current.pause();
    }

    /**
     *公共绑定事件
     * @param {function} func
     */
    commonBind = (func) => {
        this.upFunc = (event) => {
            this.cancelMove(event, func);
        };
        document.addEventListener('mousemove', func);
        document.addEventListener('mouseup', this.upFunc);

    };
    /**
     * 公共取消事件
     * @param e
     */
    cancelMove = (e, func) => {
        document.removeEventListener('mousemove', func);
        document.removeEventListener('mousemove', this.upFunc);
    };
    render() {
        const { state: { left, top, width, height }, props } = this
        const cutStyle = props.videoScale ? {display: 'block'} : {display: 'none'}
        const cutStyle2 = !props.videoScale ? {display: 'block'} : {display: 'none'}
        return (
            <div className={styles.scaleBox} id='scaleBox' ref={this.scaleBox}>
                <div className={styles.move}
                     onMouseDown={(e) => this.startMove(e, 'DRAG')}
                     style={{ width: width, height: height, left: left, top: top }}
                     ref={this.move}>
                    <div className={styles.draggable}>
                        <video
                            preload='auto'
                            crossOrigin='Anonymous'
                            ref={this.video}
                            controls={false}
                            style={{
                                left: -left,
                                top: -top,
                            }}
                            onPlay={this.onPlay}
                            onLoadedData={this.onLoadedData}
                            onPause={this.onPause}
                            onTimeUpdate={this.onTimeUpdate}
                            poster={genUrl(props.coverImg, '350')}
                            src={genVideoUrl(props.url)}/>
                    </div>
                    <span className={styles.resizable}>
                        <span style={cutStyle} className={styles.tl} onMouseDown={(e) => this.startMove(e, 'TL')} />
                        <span style={cutStyle2} className={styles.t} onMouseDown={(e) => this.startMove(e, 'T')} ><i/></span>
                        <span style={cutStyle} className={styles.tr} onMouseDown={(e) => this.startMove(e, 'TR')} />
                        <span style={cutStyle2} className={styles.r} onMouseDown={(e) => this.startMove(e, 'R')} > <i/></span>
                        <span style={cutStyle} className={styles.br} onMouseDown={(e) => this.startMove(e, 'BR')} />
                        <span style={cutStyle2} className={styles.b} onMouseDown={(e) => this.startMove(e, 'B')} ><i/></span>
                        <span style={cutStyle} className={styles.bl} onMouseDown={(e) => this.startMove(e, 'BL')} />
                        <span style={cutStyle2} className={styles.l} onMouseDown={(e) => this.startMove(e, 'L')} > <i/></span>
                     </span>
                </div>
            </div>
        );
    }
}
