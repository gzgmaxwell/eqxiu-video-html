import React from 'react';
import styles from './horzCard.less';
import { prev } from 'Config/env';
import CCard from './common';


function Card (props){
  return <CCard {...props} styles={styles} type='hoz'  />
}


export default Card;
