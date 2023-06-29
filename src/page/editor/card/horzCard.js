import React from 'react';
import styles from './horzCard.less';
import CCard from './common';


function Card(props) {
  return <CCard {...props} styles={styles} type='hoz'/>;
}

export default Card;
