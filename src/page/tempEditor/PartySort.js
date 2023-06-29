import React from 'react';
import Popconfirm from 'Components/common/Popconfirm';
import styles from './PartySort.less';
import Icon from 'Components/Icon';
import { prev } from 'Config/env';
import imageUtil from 'Util/image';
import {
  SortableContainer,
  SortableElement,
} from 'react-sortable-hoc';
import Button from '../components/Button';


//  拖动条
const SortableItem = SortableElement(({ value, i, sortFunction }) => {
  const onDelete = (e) => {
    e.stopPropagation();
    sortFunction.delete(i);
  };
  const timeLong = moment(value.videoDuration, 'X')
    .format('mm:ss');
  return (
    <li className={`${styles.table_row} ${i % 2 === 0 ? styles.odd : ''}`}>
      <div className={styles.td_title} style={{ marginRight: 20 }}>片段{i + 1}</div>
      <div>
        <div className={styles.tdImg}><img onMouseDown={(e) => e.preventDefault()}
                                           src={imageUtil.genUrl(value.coverImg, '60:60')}/></div>
      </div>
      <div className={styles.td_content}>
        <div className={styles.tdTitle}>{value.title}</div>
        <div className={styles.tdInfo}>{timeLong}</div>
      </div>
      <div className={styles.td_icon}>
        <Popconfirm title="确定要删除这个视频吗？" onConfirm={onDelete}
                    okText="确定" placement='topRight'
                    cancelText="取消">
          <Icon type='eqf-delete-l'/>
        </Popconfirm>
      </div>
      <div className={styles.td_icon} onClick={e => {
        sortFunction.sortEnd({
          oldIndex: i,
          newIndex: i - 1
        });
      }}><Icon type='eqf-arrow-up'/></div>
      <div className={styles.td_icon} onClick={e => {
        sortFunction.sortEnd({
          oldIndex: i,
          newIndex: i + 1
        });
      }}><Icon type='eqf-arrow-down'/></div>
      <div className={styles.td_icon}/>
    </li>
  );
});


@SortableContainer
class PartySort extends React.PureComponent {

  state = {
    isOut: true,
  };

  componentDidMount() {
    document.body.addEventListener('click', this.clickDoc);
  }

  componentWillUnmount() {
    document.body.removeEventListener('click', this.clickDoc);
  }

  clickDoc = () => {
    if (this.state.isOut) {
      this.props.onClose();
    }
  };

  mouseIn = () => {
    this.setState({ isOut: false });
  };

  mouseOut = () => {
    this.setState({ isOut: true });
  };

  render() {
    const { items, sortFunction, onClose } = this.props;
    return (
      <div onMouseLeave={this.mouseOut} onMouseEnter={this.mouseIn}>
        <div className={styles.header}>
          片段排序
          <span className={styles.close} onClick={onClose}>X</span>
        </div>
        <ul className={styles.tableDiv}>
          {items.map((value, index) => (
            <SortableItem key={`item-${index}`} index={index} sortFunction={sortFunction} i={index}
                          value={value}/>
          ))}
        </ul>
        <div className={styles.footer}>
          <Button className={styles.done} onClick={onClose}>完成</Button>
        </div>
      </div>
    );
  }
}


export default PartySort;
