import React from 'react';


class Icon extends React.PureComponent {

  render() {
    const { props } = this;
    return (
      <i {...props} className={['icon', props.type, props.className].join(' ')}></i>
    );
  }
}


export default Icon;

