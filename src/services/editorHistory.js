export default class EditorHistory {
    constructor(data) {
        this.data = data;
        this.records = [JSON.stringify(this.data)]; // 记录
        this.currentPos = 1; // 指针
        this.isFirstPos = true; // 状态
        this.isLastPos = true; //
    }

    add() {
        const newRecord = JSON.stringify(this.data);
        const lastRecord = this.records[this.currentPos - 1];
        // 只添加不一样的记录
        if (newRecord !== lastRecord) {
            // 如果在记录中间有操作，则覆盖之后的记录
            if (this.currentPos < this.records.length) {
                this.records.length = this.currentPos;
            }
            this.records.push(newRecord);
            this.currentPos++;
            this.setFirstAndLastPos();
        }
    }

    back() {
        // 如果是最前一条记录，则不能后退了
        if (this.currentPos > 1) {
            this.currentPos--;
        }
        this.setFirstAndLastPos();
        try {
            return JSON.parse(this.records[this.currentPos - 1]);
        } catch (e) {
            console.log('撤销无效数据');
            console.error(e);
            return JSON.parse(this.records[this.currentPos]);
        }

    }

    forward() {
        // 如果是最后一条记录，则不能前进了
        if (this.currentPos < this.records.length) {
            this.currentPos++;
        }
        this.setFirstAndLastPos();
        try {
            return JSON.parse(this.records[this.currentPos - 1]);
        } catch (e) {
            console.log('撤销无效数据');
            console.error(e);
            return JSON.parse(this.records[this.currentPos]);
        }
    }

    /**
     * 设置前进、后退的状态
     */
    setFirstAndLastPos() {
        this.isFirstPos = this.currentPos === 1;
        this.isLastPos = this.currentPos === this.records.length;
    }
}
