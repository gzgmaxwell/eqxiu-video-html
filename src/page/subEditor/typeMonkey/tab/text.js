import React from 'react';
import styles from './text.less';
import { connect } from 'dva';
import { message } from 'antd';
import { filterPunctuation } from '../../../../util/doc';


@connect(({ typeMonkey }) => ({ typeMonkey }))
export default class Text extends React.Component {
    constructor(props) {
        super(props);
        this.strLength = 10; // 文本一航显示多少字
        this.textarea = React.createRef();
        this.state = {
            text: [],
            inputPy: false,
        };
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        const { typeMonkey } = nextProps;
        const newState = {};
        if (!prevState.inputPy) {
            newState.text = typeMonkey.text;
        }
        return newState;
    }

    componentDidMount() {
        const dom = this.textarea.current;
        if (dom) {
            dom.addEventListener('compositionstart', () => {this.setState({ inputPy: true });});
            dom.addEventListener('compositionend',
                (e) => {
                    this.handlerSplitValue();
                    this.setState({ inputPy: false });
                });
        }

    }

    onChange = (e) => {
        const val = e.target.value;
        if (!this.state.inputPy) {
            this.handlerSplitValue();
        } else {
            this.setState({ text: val });
        }
    };

    /**
     * 分割数组
     */
    handlerSplitValue() {
        const newContent = [];
        const content = filterPunctuation(this.textarea.current.value)
            .split(/\n/g);
        content.forEach((v) => {
            if (v.length > this.strLength) {
                const len = v.length / this.strLength;
                for (let i = 0; i < len; i++) {
                    const item = v.slice(i * 10, this.strLength * (i + 1));
                    newContent.push(item);
                }
            } else {
                newContent.push(v);
            }
        });
        let text = newContent.map(v => v.trim());
        if (text.length > 30) {
            message.error('最多不能超过30行');
            text = text.slice(0, 30);
        }
        this.props.dispatch({
            type: 'typeMonkey/save',
            payload: {
                text,
                time: [],
                videoDuration: 0,
                voiceover: null,
                animationStyle: null,
            },
        });
    }

    handlerBlur = (e) => {
        const { typeMonkey: { text }, dispatch } = this.props;
        const newText = text.map(v => filterPunctuation(v.trim()))
            .filter(v => v);
        if (newText.length < text.length) {
            message.info('为了显示效果,已经删除所有空行');
            dispatch({
                type: 'typeMonkey/save',
                payload: {
                    text: newText,
                    time: [],
                    videoDuration: 0,
                    voiceover: null,
                    animationStyle: null,
                },
            });
        }
    };

    handlerPaste = (e) => {
        setTimeout(() => {this.handlerSplitValue();}, 300);
    };

    render() {
        const { state: { text } } = this;
        let content = text;
        if (Array.isArray(text)) {
            content = text.join('\n');
        }
        return (
            <div className={styles.wrap}>
                <p className={styles.rhythm}>文本编辑</p>
                <p className={styles.info}>字数越少字号会越大，每行最多10个字，请通过回车键换行调整显示样式</p>
                <div className={styles.wrap}>
                    <textarea className={styles.box}
                              id='text'
                              placeholder={'在此输入您的文本'}
                              ref={this.textarea}
                              cols="143"
                              rows="10"
                              wrap="hard"
                              value={content}
                              onBlur={this.handlerBlur}
                              onPaste={this.handlerPaste}
                              onChange={this.onChange}>
                    </textarea>
                </div>
            </div>
        );
    }
}
