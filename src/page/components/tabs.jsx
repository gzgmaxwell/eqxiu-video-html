import React from 'react';
import styled from 'styled-components';

const TabBody = styled.div`
        color: #666666;
        width: 100%;
        height: 36px;
        display: flex;
        justify-content: space-between;
        border-bottom: 1px solid #f2f5f7;
`;

const OneTab = styled.div`
            flex: 1;
            text-align: center;
            line-height: 36px;
            font-size: 14px;
            font-weight: 400;
            cursor: pointer;
            display: flex;
            justify-content: center;
            color: ${({ isActive }) => !isActive ? '#666666' : '#1593FF'};
            &:hover{
                color: #1593ff;
            }
            ${({ isActive }) => isActive ? `div {
                border-bottom: 2px solid #1593ff;
            }` : ''}
`;


function RightTabs({ tabList, activeTab, onChange }) {

    return (
        <TabBody>
            {tabList.map((tab, index) => {
                const active = activeTab === index;
                return <OneTab
                    key={tab.title}
                    isActive={active}
                    onClick={() => onChange(index)}
                >
                    <div>{tab.title}</div>
                </OneTab>;
            })}
        </TabBody>
    );
}


export default RightTabs;
