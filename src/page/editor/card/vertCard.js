import React from 'react';
import styles from './vertCard.less';
import CCard from './common';


function Card(props) {
  return <CCard {...props} styles={styles} type='ver'/>;
}

export default Card;
