import React, { Component } from 'react';

class LoadingComponent extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {};
  }

  render() {
    if(this.props.error){
        return<div>{this.props.error}</div>
    }else{
        return (
            <div>Loading......</div>
        );
    }
  }
}

export default LoadingComponent;
