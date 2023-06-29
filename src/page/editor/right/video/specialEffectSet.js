import React, { Component } from 'react';
import styles from './video.less';
import MateriaList from '../materiaList';
// import BorderSet from '../borderSet';
import { CANVAS_TYPE } from '../../../../config/staticParams';

export default class SpecialEffectSet extends Component {

    resetText = () => {
        this.materiaList.onRest(1);
    };

    resetImg = () => {
        this.materiaList.onRest(2);
    };

    render() {
        return (
            <div className={styles.right__video__set}>
                <MateriaList onRef={(ref) => this.materiaList = ref}/>
            </div>
        );
    }
}
