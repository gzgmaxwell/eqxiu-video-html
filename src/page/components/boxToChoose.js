import React, { PureComponent } from 'react';
import styles from './boxToChoose.less';

export default class BoxToChoose extends PureComponent {
    state = {
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        borderWidth: 0,
    };

    componentDidMount() {
        document.getElementById('previewBody')
            .addEventListener('mousedown', this.handleMousedown);
    }

    componentWillUnmount() {
        document.getElementById('previewBody')
            .removeEventListener('mousedown', this.handleMousedown);
    }

    // 鼠标按下时，确定框选框的坐标点
    handleMousedown = (e) => {
        // 阻止双击会选中其它元素，但这里不能加，否则自定义修改尺寸时，点击这里不能触发blur事件。现通过selectstart方式解决
        if (e.button === 2) {// 鼠标右键
            return;
        }
        if (e.target.className && (e.target.className.includes('workspace__el') ||
            e.target.className.includes('elements') ||
            e.target.className.includes('resizeComponent__'))) {
            return;
        }
        // 获取点击点的坐标
        const selectBoxPoint = {
            x0: e.pageX,
            y0: e.pageY,
        };
        // 获取编辑区的坐标
        const { left, top } = document.getElementById('workspace')
            .getBoundingClientRect();
        // 阻止mousemove默认会选中其它元素的情况
        const selectstart = e => e.preventDefault();
        const mousemove = e => {
            selectBoxPoint.x1 = e.pageX;
            selectBoxPoint.y1 = e.pageY;
            let selectBoxCss = this.getSelectBoxCss(selectBoxPoint, left, top);
            this.showSelectBox(selectBoxCss);
            // 设置选中的组件，可以返回当前框选的范围，父组件中判断选中的元素
            if (this.props.setBoxSize) {
                this.props.setBoxSize(selectBoxCss);
            }
        };
        const mouseup = () => {
            document.removeEventListener('selectstart', selectstart);
            document.removeEventListener('mousemove', mousemove);
            document.removeEventListener('mouseup', mouseup);
            this.setState({
                left: 0,
                top: 0,
                width: 0,
                height: 0,
                borderWidth: 0,
            });
        };
        document.addEventListener('selectstart', selectstart);
        document.addEventListener('mousemove', mousemove);
        document.addEventListener('mouseup', mouseup);
    };
    //获取多选框的位置
    getSelectBoxCss = (selectBoxPoint, workspaceLeft, workspaceTop) => {
        const positionScale = this.props.positionScale;
        let selectBoxCss = {
            left: (selectBoxPoint.x0 - workspaceLeft) / positionScale,
            top: (selectBoxPoint.y0 - workspaceTop) / positionScale,
        };
        selectBoxCss.width = (selectBoxPoint.x1 - selectBoxPoint.x0) / positionScale;
        selectBoxCss.height = (selectBoxPoint.y1 - selectBoxPoint.y0) / positionScale;
        if (selectBoxPoint.x1 < selectBoxPoint.x0) {
            selectBoxCss.left = (selectBoxPoint.x1 - workspaceLeft) / positionScale;
            selectBoxCss.width = -selectBoxCss.width;
        }
        if (selectBoxPoint.y1 < selectBoxPoint.y0) {
            selectBoxCss.top = (selectBoxPoint.y1 - workspaceTop) / positionScale;
            selectBoxCss.height = -selectBoxCss.height;
        }
        return selectBoxCss;
    };
    //显示多选框
    showSelectBox = (selectBoxCss) => {
        this.setState({
            left: selectBoxCss.left,
            top: selectBoxCss.top,
            width: selectBoxCss.width,
            height: selectBoxCss.height,
            borderWidth: 1,
        });
    };

    render() {
        const { left, top, width, height, borderWidth } = this.state;
        return <div className={styles.boxToChoose} style={{
            left,
            top,
            width,
            height,
            borderWidth,
        }}>

        </div>;
    }
}
