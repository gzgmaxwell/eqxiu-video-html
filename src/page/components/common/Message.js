import React from 'react';
import ReactDOM from 'react-dom';
import styles from './Message.less';
import Icon from '../Icon';


class Message extends React.PureComponent {


    typeArray = {
        info: {
            type: 'eqf-info-f',
            style: { color: '#1593FF' },
        },
    };

    render() {
        const { props: { children, type = 'info', outStyle = {}, bodyStyle = {}, onClose = null } } = this;
        const iconProps = this.typeArray[type] || this.typeArray.info;
        const dom = (
            <div className={styles.outer} style={outStyle}>
                <div className={styles.body} style={bodyStyle}>
                    <Icon  {...iconProps} className={styles.icon}/>
                    <div className={styles.content}>{children}</div>
                    <Icon type='eqf-no' className={styles.closeBtn} onClick={onClose}/>
                </div>
            </div>
        );

        return ReactDOM.createPortal(
            dom,
            document.body,
        );
    }
}


export default Message;
