import React from 'react';
import styles from './right.less';
import OperateSide from './operateSide';
import { connect } from 'dva';
import { ConfigProvider, message, Icon } from 'antd';
import { SingleColorPicker } from 'Components/colorPicker';
import Select from 'Components/input/select';
import { getMyFont } from 'Api/user';
import { host } from 'Config/env';
import TextSet from './artFont';
import 'react-virtualized/styles.css';
import cloneDeep from 'lodash/cloneDeep';
import { fonts } from './fontsJson';
import { ART_TEXT_TYPE, CANVAS_TYPE } from '../../../../config/staticParams';
import { defaultSubTitleStyle } from '../../../../services/editorData';

/**
 * 编辑器右边的组件
 */
@connect(({ subtitles }) => ({ subtitles }))
class RightSide extends React.Component {
    constructor(props) {
        super(props);
    }

    changeNow = (payload) => {
        const { props: { uuid, dispatch } } = this;
        if (this.props.playing || !this.props.uuid) {
            message.info('请选中字幕再进行编辑');
            return;
        }
        if (payload.letterSpacing !== undefined || payload.fontSize !== undefined) {
            // 重设宽度
            setTimeout(() => {
                const textEle = document.getElementById(`element_${uuid}`);
                if (textEle) {
                    const width = textEle.offsetWidth;
                    const height = textEle.offsetHeight;
                    dispatch({
                        type: 'subtitles/changeNow',
                        payload: {
                            width,
                            uuid,
                            height,
                        },
                    });
                }
            }, 20);
        }
        return dispatch({
            type: 'subtitles/changeNow',
            payload: {
                ...payload,
                uuid,
            },
        });
    };
    handlePropsChange = ({ value, css = {}, property = {} }) => {
        this.changeNow({
            type: value === ART_TEXT_TYPE.normal ? CANVAS_TYPE.text : CANVAS_TYPE.artFont,
            artJson: cloneDeep(property),
            ...css,
        });
    };
    applyAll = () => {
        if (this.props.playing || !this.props.uuid) {
            message.info('请选中字幕再进行编辑');
            return;
        }
        this.props.dispatch({
            type: 'subtitles/applyAll',
            payload: {
                uuid: this.props.uuid,
            },
        });
    };

    render() {
        const { uuid, subtitles: { dataList, myFonts } } = this.props;
        let data = dataList[uuid];
        if (!data) {
            data = {
                type: CANVAS_TYPE.artFont,
                content: '',
                ...defaultSubTitleStyle,
            };
        }
        const defaultValue = (data.artJson && data.artJson.type !== undefined)
                             ? data.artJson.type
                             : ART_TEXT_TYPE.normal;
        return (
            <div className={styles.toolsBodyOut}>
                <OperateSide/>
                <div className={styles.toolsBody}>
                    <div className={styles.contentDiv}>
                        {/*字幕样式设置*/}
                        <ConfigProvider
                            getPopupContainer={(triggerNode) => triggerNode.parentElement}>
                            <div className={styles.title}>字幕样式</div>
                            <div className={styles.applyAll}>
                                <div className={styles.apply__title}>将此样式应用于全部字幕</div>
                                <div className={styles.apply__btn} onClick={this.applyAll}>应用</div>
                            </div>
                            <div className={styles.fonts}>
                                <div className={styles.left}>字形</div>
                                <div className={styles.other}>
                                    <Select options={fonts} placeholder={'请选择字形'}
                                            suffixIcon={<Icon type="caret-down" />}
                                            showSearch={true}
                                            dropdownClassName='selectDropdownClassName'
                                            optionFilterProp="children"
                                            value={defaultValue}
                                            notFoundContent={'暂无匹配数据'}
                                            onSelect={(value, options) => this.handlePropsChange(
                                                options.props)}/>
                                </div>
                            </div>
                            <TextSet data={data} myFonts={myFonts} stateName="subtitles"
                                     changeNow={this.changeNow}
                                     hideElements={[
                                         'border',
                                         'lineHeight',
                                         'background',
                                         'textAlign']}/>
                        </ConfigProvider>
                    </div>
                </div>
            </div>
        );
    }
}

export default RightSide;
