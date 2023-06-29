import React from 'react';
import styles from './vertCard.less';
import { prev } from 'Config/env';
import CCard from './common';


function Card (props){
  return <CCard {...props} styles={styles} type='ver' />
}


export default Card;
