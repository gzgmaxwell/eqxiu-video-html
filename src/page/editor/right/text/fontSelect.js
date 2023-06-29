import React from 'react';
import { connect } from 'dva';
import { getMyFont } from 'Api/user';
import { host } from 'Config/env';
import { SingleColorPicker } from 'Components/colorPicker';
import Select from 'Components/input/select';
import { Icon } from 'antd';
import PropTypes from 'prop-types';
import { SUBTITLES_FONTS } from '../../../../config/staticParams';


@connect(({ loading, workspace }) => {
    const { myFonts } = workspace;
    const data = (workspace.dataList[workspace.activeIndex] || {});
    const fonts = data.animate ? myFonts.filter((item) => {
        return SUBTITLES_FONTS[item.fontFamily];
    }) : myFonts;
    return {
        loading,
        fontFamily: data.fontFamily,
        myFonts: fonts,
    };
})
class FontSelect extends React.Component {

    shouldComponentUpdate(nextProps) {
        const { stateName, loading: { effects }, fontFamily, myFonts } = this.props;
        const effectsName = `${stateName}/downloadFont`;
        if (nextProps.loading.effects[effectsName] !== effects[effectsName]) {
            return true;
        }
        if (nextProps.fontFamily !== fontFamily) {
            return true;
        }
        if (nextProps.myFonts.length !== myFonts.length) {
            return true;
        }
        return false;
    }

    render() {
        const { loading: { effects }, fontFamily, myFonts, onChange, stateName } = this.props;
        const fontFamilies = myFonts.map((item) => {
            const { fontFamily: value, name } = item;
            return {
                title: name,
                value,
                data: item,
                style: { fontFamily: value },
            };
        });
        return (
            <Select
                options={fontFamilies}
                placeholder={'请选择字体'}
                suffixIcon={effects[`${stateName}/downloadFont`] ? <Icon
                    type="loading"/> : <Icon type="caret-down"/>}
                dropdownClassName='selectDropdownClassName'
                optionFilterProp="children"
                value={fontFamily}
                style={{ fontFamily }}
                notFoundContent={'暂无匹配数据'}
                onSelect={(value, options) => onChange(options.props.data)}/>
        );
    }
}

/**
 * @param data: 字体样式数据
 * @param myFonts: 字体文件
 * @param stateName: models的命名空间
 * @param showBorderSet: 是否显示边框设置
 * */
FontSelect.propTypes = {
    loading: PropTypes.object,
    myFonts: PropTypes.array,
    fontFamily: PropTypes.string,
    stateName: PropTypes.string,
    onChange: PropTypes.func.isRequired,
};
FontSelect.defaultProps = {
    myFonts: [],
    stateName: 'workspace',
};

export default FontSelect;
