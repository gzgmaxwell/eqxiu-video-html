require('./renderTypeMonkey.css');
const speechTpl = require('./template.js').str;

class RenderTypeMonkey {
    constructor(props) {
        this.props = props;
        this.canvas = null;
        this.lrcList = [];
        // 毫秒
        this.currentTime = 0;
        this.currentIndex = 0;
        // 毫秒
        this.durantion = 0;
        // 拿到画布
        this.canvas = document.getElementById('typeMonkeyCanvas');
        if (!this.canvas) {
            throw new Error('缺少画布组件');
        }
        // 拿到行数据
        const { audio: { lrc }, data: { styles: { height, width } = {} } = {} } = props;
        if (!Array.isArray(lrc)) {
            throw new Error('lrc必须是Array');
        }
        this.first = true;
        this.lrcList = [...lrc];
        this.fontSize = 16;
        this.posBaseWidth = 0 || 12 * this.fontSize + 2;
        this.transverse = width > height;
        // 按字数对应的缩放
        this.scaleList = [
            this.transverse ? 8 : 12, 6, 4, 3,
            2.4, 2, 1.71, 1.5,
            1.33, 1.2, 1.09, 1,
        ];
        // for (let i = 1; i <= 14; i += 1) {
        //     this.scaleList[i] = 12 / i;
        // }
        // console.log(this.scaleList);
        this.isView = true;
    }


    createContent() {
        const compJson = this.props;
        const { id, type, css: { fontFamily } = {} } = compJson;
        const { props } = this;
        const { bgImg: { img = {}, opacity } } = props;

        if (props.audio.lrcStyle === undefined) {
            props.audio.lrcStyle = 1;
        }

        // 背景图
        let bgImgSrc = null;
        let bgImgOpacity = 1;
        let bgDisplay = 'none';
        if (img.src) {
            bgImgSrc = img.src;
            bgDisplay = 'block';
        } else {
            bgImgSrc = '';
            bgDisplay = 'none';
        }
        bgImgOpacity = opacity;

        // 区分模板
        const [baseTpl, bgImgTpl, bgVideoTpl, viewTpl, editorTpl] = speechTpl.split('<hr>');
        const { isView } = this;
        let tpl;
        let noLrc = 'block';

        // 预览模式
        tpl = baseTpl.replace('<slot-mode>', viewTpl);

        // 背景模板
        let bgVideoSrc;
        tpl = tpl.replace('<slot-bg>', bgImgTpl);

        const lrcBaseClass = [
            'lrc-position-base-style1',
            // 'lrc-position-base-style2',
            // 'lrc-position-base-style3',
            'lrc-position-base-style4'][props.audio.lrcStyle - 1];
        const $context = this.parse(tpl,
            {
                id,
                type,
                playCover: '',
                bgImgOpacity,
                bgDisplay,
                bgImgSrc,
                noLrc,
                bgVideoSrc,
                fontFamily,
                lrcBaseClass,
            },
        );


        // this.speechAgent = new EqxSpeechAgent(this, this.eqxScene.soundManager);
        this.wordsShow = this[[
            'wordsShowStyle1',
            'wordsShowStyle2',
            'wordsShowStyle3',
            'wordsShowStyle4'][props.audio.lrcStyle - 1]];

        // 添加字体

        this.canvas.innerHTML = $context;
        // 绑定相关dom到作用域
        this.$animDom = this.canvas.querySelector('.speech-lrc-content');
        this.posBase = this.canvas.querySelectorAll('.lrc-position-base');
        // const posBaseStyle = `
        //     width: ${this.posBaseWidth}px;
        //     left: calc(50% - ${this.posBaseWidth / 2}px)`;
        // Array.from(this.posBase)
        //     .forEach((element) => {
        //         element.style.cssText += posBaseStyle;
        //     });
        this._currentP = this.posBase[0].querySelectorAll('.speech-lrc-p')[0];
        this.stageWrapperPre({
            posBase: this.posBase[0],
            entry: 'r',
            Lrotate: 'n',
        });
        this.renderOne();
        this.canvas.addEventListener('webkitAnimationEnd', this.anmationEnd);
        return $context;
    }

    anmationEnd(e) {
        e.target.classList.add(`${e.animationName}-end`);
        e.target.style.animation = 'none';
    }

    pause() {
        this.isPaused = true;
        const elementPaused = (element) => {
            element.style.animationPlayState = 'paused';
        };
        Array.from(this.canvas.querySelectorAll('div'))
            .forEach(elementPaused);
    }

    play() {
        this.isPaused = false;
        if (this.first) {
            this._currentP = this.posBase[0].querySelectorAll('.speech-lrc-p')[0];
            this._currentLine = this.posBase[0].querySelectorAll('.speech-lrc-line')[0];
        }
        const elementPlay = (element) => {
            element.style.animationPlayState = 'running';
        };
        Array.from(this.canvas.querySelectorAll('div'))
            .forEach(elementPlay);
    };

    onTimeUpdate(time) {
        this.currentTime = time;
        const newIndexs = this.lrcList.filter((item) => {
            const { time: linTime } = item;
            if (linTime <= time) {
                return true;
            } else {
                return false;
            }
        });
        const newIndex = newIndexs.length - 1;
        if (newIndex === -1) return;
        if (newIndex !== this.currentIndex) {
            this.currentIndex = newIndex;
            this.renderOne();
        }
    }

    renderOne() {
        const nowItem = this.lrcList[this.currentIndex];
        if (this.props.audio.lrcStyle === 2) {
            return this.wordsShowStyle4(nowItem);
        }
        const {
            text = '空白文本',
            color = '#FFFFFF',
            animRule: {
                entry,
                Presize,
                Protate,
                Lrotate,
            } = {},
        } = nowItem;
        const currentLine = this._currentLine;
        const currentP = this._currentP;
        const posBase = this.posBase[0];
        // 准备动画行字幕内容和颜色
        this.stageContentPre({
            currentLine,
            text,
            color,
        });
        // 执行字幕动画
        this.stageShow({
            currentLine,
            currentP,
            textLen: text.length,
            Protate,
            Presize,
        });
        // 准备下一个行字幕的节点和动画
        this.stageWrapperPre({
            posBase,
            Lrotate,
            entry,
        });
    }

    wordsShowStyle4(lrc) {
        const {
            text,
            color,
            animRule: {
                pos: { x, y },
            },
        } = lrc;
        const fontSize = text.length < 6 ? '26px' : '18px';
        const baseCom = this.posBase[0];
        const compHeight = this.transverse ? 203 : 631;
        const yScale = 6;
        const xScale = 3;
        const top = parseInt(compHeight * y / yScale) + 4;
        baseCom.innerText = text;
        baseCom.style.color = color;
        baseCom.style.top = `${top}px`;
        baseCom.style.fontSize = fontSize;
        // 组件宽度和文字宽度, 得出可偏移空间进行三段式偏移
        const compWidth = parseInt(360);
        const textWidth = parseInt(fontSize) * text.length;
        if (compWidth + 8 > textWidth) {
            const left = parseInt(((compWidth - textWidth) / xScale + 4) * x) + 4;
            baseCom.style.left = `${left}px`;
            baseCom.style.width = 'auto';
        }
    }

    /**
     * 准备动画行字幕内容和颜色
     * @param {Object} param0 展示行，内容，颜色
     */
    stageContentPre({ currentLine, text, color }) {
        currentLine.lastElementChild.innerText = text;
        currentLine.style.color = color;
    }

    /**
     * 执行字幕动画
     * @param {Object} param0 展示行字幕, 展示段字幕, 展示行字幕长度
     */
    stageShow({ currentLine, currentP, textLen, Protate, Presize }) {
        const lineSpacing = 4;
        let Lscale = this.scaleList[textLen - 1];
        if (this.first) {
            this.first = false;
            currentLine.className = 'speech-lrc-line';
            currentLine.style.height = this.fontSize * Lscale + lineSpacing + 'px';
            currentLine.lastElementChild.style.transform = `scale(${Lscale})`;
            return false;
        } else {
            if (Protate !== 'n') {
                const rotateP = this._rotateP;
                const that = this;
                rotateP.addEventListener('animationEnd', rotatePEnd);
                rotateP.addEventListener('webkitAnimationEnd', rotatePEnd);

                function rotatePEnd(e) {
                    rotateP.removeEventListener('animationEnd', rotatePEnd);
                    rotateP.removeEventListener('webkitAnimationEnd', rotatePEnd);
                    if (that._removeP) {
                        // that._removeP.parentElement.removeChild(that._removeP);
                    }
                    that._removeP = rotateP;
                }

                if (Protate === 'l') {
                    // 向左旋转
                    rotateP.classList.add('rotate-left2');
                    rotateP.style.marginLeft = '-2px';
                } else {
                    // 向右旋转
                    rotateP.classList.add('rotate-right2');
                    const visualLineML = (this.posBaseWidth - 16) / Lscale * (Lscale - 1);
                    // const visualLineML = 160 / Lscale * (Lscale - 1);
                    currentLine.lastElementChild.style.marginLeft = `${visualLineML}px`;
                }
            }
            currentP.firstElementChild.style.transform = `scale(${Presize})`;
            currentLine.classList.add('zoom-entry');

            // 抵消p缩放影响
            Lscale *= 1 / Presize;
            currentLine.style.height = this.fontSize * Lscale + lineSpacing + 'px';
            currentLine.lastElementChild.classList.add('zoom-entry');
            currentLine.lastElementChild.style.transform = `scale(${Lscale})`;
        }
    }

    /**
     * 准备下一行字幕的节点和动画
     * @param {Object} param0 位置节点，展示行是否为最大宽度
     */
    stageWrapperPre({ posBase, Lrotate, entry }) {
        const nextLine = document.createElement('div');
        let nextStyle = 'speech-lrc-line';
        const visual = document.createElement('div');
        let nextVisualStyle = 'speech-lrc-line-visual';
        nextLine.appendChild(visual);
        let setRP = false;
        // 1. 如果旋转
        if (Lrotate !== 'n') {
            // 1.1 如果包含this.*_rotateP, 设置为this.*_removeP
            // 1.2 设置this.*_currentP为this.*_rotateP，并设置与this.*_currrentP第一行同高动画
            this._rotateP = this._currentP;
            setRP = true;
            // 1.3 新建this.*_currentP, 并设置其进入动画
            const currentP = document.createElement('div');
            currentP.className = 'speech-lrc-p';
            const pvisual = document.createElement('div');
            pvisual.className = 'speech-lrc-p-visual';
            currentP.appendChild(pvisual);
            this._currentP = currentP;
            posBase.appendChild(currentP);
            // 1.4 设置旋转 nextStyle
            if (Lrotate === 'r') {
                nextVisualStyle += ' rotate-right';
            } else {
                nextVisualStyle += ' rotate-left';
            }
            // visual行设置旋转，本行也需要设置高度变化效果
            nextStyle += ' zoom-rotate';
        } else {
            // -1. 如果不旋转
            // -1.1 设置非旋转 nextStyle
            if (entry === 'l') {
                nextStyle += ' zoom-left';
            } else {
                nextStyle += ' zoom-right';
            }
        }
        nextLine.className = nextStyle;
        visual.className = nextVisualStyle;
        // 2. 将nextLine添加到 this.*_currentP
        this._currentP.firstElementChild.appendChild(nextLine);
        const currentLine = this._currentLine;
        this._currentLine = nextLine;
        const that = this;
        if (setRP && this._rotateP) {
            currentLine.addEventListener('animationEnd', currentLineEnd);
            currentLine.addEventListener('webkitAnimationEnd', currentLineEnd);
        }

        function currentLineEnd(e) {
            currentLine.removeEventListener('animationEnd', currentLineEnd);
            currentLine.removeEventListener('webkitAnimationEnd', currentLineEnd);
            nextLine.insertBefore(that._rotateP, visual);
        }
    }

    /**
     * 模板引擎
     * @param str {String}
     * @param scope {Object}
     * @param maxTry {Number}
     * @returns {String}
     */
    parse(str, scope, maxTryOut = 10) {
        let maxTry = maxTryOut;
        if (/\$\{([^}]*)}/.test(str)) {
            console.error('DO NOT USE ${}', str);
        }
        let temp = str;

        while (maxTry && /#\{([^}]*)}/.test(temp)) {
            temp = temp.replace(/#\{([^}]*)}/g, (match, $1) => {
                const value = scope[$1];
                if (value !== undefined) {
                    return value;
                }
                return match;
            });
            maxTry -= 1;
        }
        return temp;
    }

}


export default RenderTypeMonkey;
