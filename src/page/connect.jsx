import React from 'react';
import { connect as dvaConnect } from 'dva';


class HocConnect extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const { props: { children: Children, ...props } } = this;
        return <Children {...props}/>;
    }
}

function myConnect(mapStateToProps, mapDispatchToProps = null, mergeProps = null, options = {}) {
    return function (children) {
        // 元素
        const ele = function (props) {
            return <HocConnect {...props} >{children}</HocConnect>;
        };
        /**
         * 重新封装mapStateToProps
         * @param models
         * @returns {*}
         */
        const newMapStateToProps = (models) => {
            const result = typeof mapStateToProps === 'function' ? mapStateToProps(models) : {};
            // 在有workspace的情况下 没有editor的情况下 挂载  editor
            if ((result.canvas || result.workspace) && !result.editor) {
                result.editor = models.editor;
            }
            return result;
        };
        return dvaConnect(newMapStateToProps, mapDispatchToProps, mergeProps, options)(ele);
    };
}


export {
    myConnect as connect,
};
export default myConnect;
