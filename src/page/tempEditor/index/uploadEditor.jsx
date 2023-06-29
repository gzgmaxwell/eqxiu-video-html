import React, { useState, useRef } from 'react';
import { Breadcrumb } from 'antd';
import styles from './uploadEditor.less';
import Buttom from '../../components/Button/index';


function TemplateUploadEditor(props) {
    const { uploadType, readOnly, templateId } = props;

    const [page, setPage] = useState(0);
    const [active, setActive] = useState(0);
    const [openList, setOpenList] = useState(false);
    const [parties, setParties] = useState([]);
    const editorHeaderRef = useRef();

    // 开关列表
    function toggleList() {
        setOpenList(open => !open);
    }


    function onBack() {
        setPage(0);
    }

    const path = [
        [
            {
                path: '#',
                breadcrumbName: '片段上传与编辑',
            }],
        [
            {
                path: onBack,
                breadcrumbName: '片段上传与编辑',
            },
            {
                path: '#',
                breadcrumbName: '设置片段转场',
            },
        ],
        [
            {
                path: onBack,
                breadcrumbName: '片段上传与编辑',
            },
            {
                path: '#',
                breadcrumbName: '编辑视频模板',
            },
        ],
    ];


    return (
        <React.Fragment>
            {uploadType === 1 && !readOnly &&
            <Breadcrumb separator='>'>
                {path[page].map(item =>
                    (<Breadcrumb.Item
                        key={item.breadcrumbName}>{item.path === '#'
                        ? item.breadcrumbName
                        :
                        <a onClick={onBack}>{item.breadcrumbName}</a>}</Breadcrumb.Item>),
                )}
            </Breadcrumb>}
            {page === 0 && !readOnly &&
            <Uploader {...props} templateId={templateId}
                      onViladSuccess={this.onViladSuccess} />}
            {parties.length > 0 && page !== 1 &&
            <div className={styles.parties} ref={editorHeaderRef}>
                {page === 0 && <div className={styles.tabBar}>
                    <ul className={styles.titleUl}>
                        {parties.map((item, index) => (
                            <li
                                key={item.id}
                                onClick={() => this.onChangeParty(index,
                                    item.id)}
                                className={parties[active].id ===
                                item.id ? styles.active : ''}>
                                片段{index + 1}</li>
                        ))}
                    </ul>
                    {!readOnly && <Button
                        className={styles.partesButton}
                        onClick={toggleList}><Icon
                        type='eqf-setting-f' />&nbsp;&nbsp;片段管理</Button>}
                    <div>
                        {state.openList && <div className={styles.sortList}>
                            <PartySort {...PartySortProps} />
                        </div>}
                    </div>
                </div>}
                <div style={{ padding: '0 40px' }}>
                    <Editor  {...editProps} />
                </div>
            </div>}
            {state.parties.length > 0 && state.page === 1 &&
            <ConcatSet {...concatSetProps} />
            }
        </React.Fragment>
    );
}
