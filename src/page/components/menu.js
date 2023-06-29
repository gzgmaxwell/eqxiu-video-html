import React from 'react';
import styles from './menu.less';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

class MenuComponent extends React.PureComponent {
    render() {
        const {
            props: {
                visible, menuY = 0, menuX = 0, close, dataList, style, className, ...props
            },
        } = this;

        if (!visible) {
            return null;
        }
        const meunComp = <div
            {...props}
            className={`${styles.menu} ${className}`}
            style={{ ...style }}
        >
            <ul>
                {dataList.map(
                    (value) => {
                        if (!value) return null;
                        const { title, isDelete = false, type = null, noHover = false, className = '', line = false, keyboard = null, ...item } = value;
                        if (line) {
                            return (<div key={Math.random()} className={styles.line} {...item}/>);
                        }
                        return (
                            <React.Fragment key={title}>
                                {
                                    type === 'zIndex' && <div className={styles.line} {...item}/>
                                }
                                <li
                                    {...item}
                                    className={`${className} ${isDelete ? styles.delete : ''} ${noHover ? styles.noHover : ''}`}
                                >{title}{
                                    keyboard && <span className={styles.keyboard}>{keyboard}</span>
                                }</li>
                                {
                                    type === 'group' && dataList.length > 2 && <div className={styles.line} {...item}/>
                                }
                            </React.Fragment>
                        );
                    })}
            </ul>
        </div>;
        if (!menuX && !menuY) {
            return meunComp;
        }

        return ReactDOM.createPortal(
            <div style={{
                top: menuY - 20,
                left: menuX - 20,
            }}
                 className={styles.outer}
                 onMouseLeave={close}>
                {meunComp}
            </div>, document.body);
    }
}

MenuComponent.propTypes = {
    menuY: PropTypes.number,
    menuX: PropTypes.number,
    visible: PropTypes.bool.isRequired,
    close: PropTypes.func.isRequired,
    dataList: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default MenuComponent;
