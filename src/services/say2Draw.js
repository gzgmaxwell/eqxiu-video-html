class Say2Draw {
    constructor({ styleType, audio, colors = ['#fff'], transverse = false }) {
        if (!audio || !Array.isArray(audio.lrc)) {
            throw new Error('audio must have lrc Array');
        }
        this.lines = audio.lrc;
        this.styleType = styleType;
        this.audio = audio;
        this.colors = colors;
        this.transverse = transverse;
    }

    /**
     * @desc 为字幕动画添加动画规则
     * @param {Array} lrc 字幕数据列表
     */
    setRules = () => {
        const { styleType: style, audio } = this;
        // 做区分1，2，设置对应的rules，2，3清空rules
        // 同风格不进行设置，保证进来的是不同风格
        // 现风格1，4切换到2, 3则清空rules
        this.clearRules();
        // 新风格1，4则生成对应rules
        if (style === 1) {
            this.generateRules1(this.lines);
        } else if (style === 2) {
            this.generateRules2(this.lines);
        }
        audio.lrcStyle = style;
        this.audio.lrc = this.lines;
    };
    /**
     * @desc 清除规则
     */
    clearRules = () => {
        this.lines = this.lines.map(({ animRule, ...line }) => ({ ...line }));
    };
    generateRules1 = (lrc) => {
        let _rotateJus = 'n';
        let currentPLen = 0;
        lrc.forEach((line, index) => {
            const anim = {};
            let Presize;
            // stageShow
            if (index) {
                anim.Protate = _rotateJus;
                if (_rotateJus === 'n') {
                    Presize = this.resize();
                } else {
                    Presize = 1;
                }
                anim.Presize = Presize;
            }

            // stageWrapperPre
            // 判定旋转，向右选择需要上一行行宽判断
            let rotate;
            if (currentPLen < 2) {
                // 低于两行不旋转
                rotate = 0;
            } else if (currentPLen > 5) {
                // 超过5行向左旋转
                rotate = 1;
            } else {
                // 2 - 5 行随机
                rotate = Math.random();
            }

            if (rotate > 0.85) {
                // 左旋转
                _rotateJus = 'l';
                currentPLen = 0;
            } else if (Presize === 0.5 && rotate < 0.6) {
                // 右旋转
                _rotateJus = 'r';
                currentPLen = 0;
            } else {
                // 不旋转
                _rotateJus = 'n';
                if (index) {
                    anim.entry = Math.random() < 0.5 ? 'l' : 'r';
                } else {
                    anim.entry = 'c';
                }
                currentPLen += 1;
            }
            line.color = this.colors[~~(Math.random() * this.colors.length)];
            anim.Lrotate = _rotateJus;
            line.animRule = anim;
        });
    };

    /**
     * 获取缩放
     * @param {number} min 随机范围最小值
     */
    resize = (function () {
        // 记录上次缩放的值避免两次一样
        let lastScale;
        return (min = 0) => {
            let scale;
            // 第一次都是undefined
            do {
                const random = Math.random() * (1 - min) + min;
                if (random > 0.75) {
                    scale = 2;
                } else if (random > 0.5) {
                    scale = 1.5;
                } else if (random > 0.25) {
                    scale = 0.75;
                } else {
                    scale = 0.5;
                }
            } while (lastScale === scale);
            lastScale = scale;
            return scale;
        };
    }());

    // rule2
    // ～ 位置信息
    generateRules2 = (lrc) => {
        lrc.forEach((line) => {
            line.color = this.colors[~~(Math.random() * this.colors.length)];
            line.animRule = {
                pos: this.rule2PosRandom(this.transverse),
            };
        });
    };

    // rule2, 按最大行随机，预览行数不定，结合奇偶行过滤相邻重复
    rule2PosRandom = (function () {
        let lastPos;
        return (transverse = false) => {
            const y = 6;
            const x = 3;
            const pos = {};
            // y 轴位置确定
            do {
                pos.y = Math.floor(Math.random() * y);
            } while (lastPos === pos.y);
            lastPos = pos.y;
            // x 轴位置确定
            pos.x = Math.floor(Math.random() * x);
            return pos;
        };
    }());
}


export default Say2Draw;
