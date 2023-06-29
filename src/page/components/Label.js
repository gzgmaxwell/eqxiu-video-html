import React from 'react';

// import PropTypes from 'prop-types';

class Labels extends React.Component {


    render() {
        const { props } = this;
        const data = props.data;
        const childrenName = props.childrenname || 'children';
        const Father = props.Fd;
        return (
            <React.Fragment>
                {data.map((item, index) => {
                        if (!props.noChildren &&
                            (!Array.isArray(item[childrenName]) || item[childrenName].length <= 0)) {
                            return null;
                        }
                        return (
                            <Father key={index} name={item.name} parent={props.parent} item={item}>
                                {item[childrenName] &&
                                <Labels data={item[childrenName]} parent={item}
                                        childrenname={childrenName} Fd={props.Cd}
                                        noChildren={true} />}
                            </Father>
                        );
                    },
                )}
            </React.Fragment>
        );
    }
}

// Labels.prototype = {
//   items: PropTypes.array,
//   childrenname: PropTypes.string,
//   Fd: PropTypes.element,
//   Cd: PropTypes.element,
//   noChildren: PropTypes.bool,
// };


export default Labels;
