import React from 'react';
import PropTypes from "prop-types";
import styles from "./fixed.less";


class FixedTip extends React.PureComponent {


    render () {

        return (
            <div className={styles.outline} {...this.props}>
                {this.props.children}
            </div>
        );
    }
}
FixedTip.propTypes = {
    children: PropTypes.oneOfType(
        [PropTypes.object, PropTypes.string, PropTypes.array]
    )
};


export default FixedTip;