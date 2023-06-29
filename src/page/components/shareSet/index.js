import React, { useState, useEffect, useRef } from 'react';
import styles from './index.less';
import Close from '../Button/close';
import Select from 'Components/input/select';
import { Icon, message } from 'antd';
import { SHARE_OPTIONS } from '../../../config/staticParams';
import NewIcon from '../Icon';
import Button from '../Button';
import ImageButton from '../Button/imageButton';
import { ComCropper } from '../cover/cuts';
import { genUrl } from '../../../util/image';
import tipCover from '../../static/tipshare.png';
import { getWechatSetting, wechatSetting } from '../../../api/userVideo';

export default function ShareSet(props) {
    const [titleDisabled, setTitleDisabled] = useState(SHARE_OPTIONS.title[0].forbidden);
    const [descriptionDisabled, setDescriptionDisabled] = useState(
        SHARE_OPTIONS.title[0].forbidden);
    const [title, setTitle] = useState(props.title);
    const [titleValue, setTitleValue] = useState(SHARE_OPTIONS.title[0].value);
    const [description, setDescription] = useState(props.describe);
    const [descriptionValue, setDescriptionValue] = useState(SHARE_OPTIONS.description[0].value);
    const [coverImgValue, setCoverImgValue] = useState(SHARE_OPTIONS.coverImg[0].value);
    const [coverImgUrl, setCoverImgUrl] = useState('');
    const textLength = 24;
    const textLengthDesc = 50;
    const yourself = 2;// 自定义
    const titleRef = useRef(null);
    const descriptionRef = useRef(null);
    const [wechatSettingObj, setWechatSettingObj] = useState(null);

    function onClose() {
        if (typeof props.onClose === 'function') {
            props.onClose();
        }
    }

    function handleChangeTitle(value) {
        SHARE_OPTIONS.title.map((item) => {
            if (item.value === value) {
                setTitleDisabled(item.forbidden);
                setTitle(item.content);
                setTitleValue(item.value);
                if (value === SHARE_OPTIONS.title[0].value) {
                    setTitle(props.title);
                }
                if (wechatSettingObj) {
                    if (value === wechatSettingObj.titleType) {
                        setTitle(wechatSettingObj.titleContent);
                    }
                }
            }
        });
    }

    function handleChangeDescription(value) {
        SHARE_OPTIONS.description.map((item) => {
            if (item.value === value) {
                setDescriptionDisabled(item.forbidden);
                setDescription(item.content);
                setDescriptionValue(item.value);
                if (value === SHARE_OPTIONS.description[0].value) {
                    setDescription(props.describe);
                }
                if (wechatSettingObj) {
                    if (value === wechatSettingObj.descriptionType) {
                        setDescription(wechatSettingObj.descriptionContent);
                    }
                }
            }
        });
    }

    function handleChangeCoverImg(value) {
        setCoverImgValue(value);
        SHARE_OPTIONS.coverImg.map((item) => {
            if (item.value !== SHARE_OPTIONS.coverImg[1].value) { // 自定义封面
                setCoverImgUrl('');
            }
            if (value === SHARE_OPTIONS.coverImg[1].value){
                if (wechatSettingObj) {
                    if (value === wechatSettingObj.coverImgType) {
                        setCoverImgUrl(wechatSettingObj.coverImg);
                    }
                }
            }
        });
    }

    function onChangeTitle(e) {
        const val = e.target.value;
        setTitle(val);
    }

    function onChangeDescription(e) {
        const val = e.target.value;
        setDescription(val);
    }

    function handleURL(inputUrl) {
        const url = genUrl(inputUrl);
        setCoverImgUrl(url);
    }

    function handleOnChange(url) {
        const json = {
            aspectRatio: 1,
        };
        const params = {
            image: url,
            cutParams: null,
            onClose: onClose,
            onChange: handleURL,
            backgroundColor: '#fff',
            ...json,
        };
        ComCropper({ ...params })
            .then(res => {})
            .catch(re => re);
    }

    async function sureBtn() {
        if (props.videoId) {
            const json = {
                coverImg: coverImgUrl,
                coverImgType: coverImgValue,
                descriptionContent: description,
                descriptionType: descriptionValue,
                titleContent: title,
                titleType: titleValue,
                videoId: props.videoId,
            };
            const { data: { success } } = await wechatSetting(json);
            if (success) {
                message.success('设置成功');
                onClose();
            }
        } else {
            if (props.shareSetParamsToModal) {
                if (typeof props.shareSetParamsToModal === 'function') {
                    const params = {
                        coverImg: coverImgUrl,
                        coverImgType: coverImgValue,
                        descriptionContent: description,
                        descriptionType: descriptionValue,
                        titleContent: title,
                        titleType: titleValue,
                    };
                    props.shareSetParamsToModal(params);
                    onClose();
                }
            }
        }
    }


    useEffect(() => {
        if (!props.videoId) return;
        getWechatSetting(props.videoId)
            .then((res) => {
                const { data } = res;
                if (data.success && data.obj) {
                    const { titleType, titleContent, descriptionType, descriptionContent, coverImg, coverImgType } = data.obj;
                    setWechatSettingObj(data.obj);
                    if (titleType) {
                        setTitleValue(titleType);
                        setTitle(titleContent);
                        if (titleType !== SHARE_OPTIONS.title[0].value) {
                            setTitleDisabled(false);
                        }
                    }
                    if (descriptionType) {
                        setDescriptionValue(descriptionType);
                        setDescription(descriptionContent);
                        if (descriptionType !== SHARE_OPTIONS.description[0].value) {
                            setDescriptionDisabled(false);
                        }
                    }
                    if (coverImg) {
                        setCoverImgUrl(coverImg);
                    }
                    if (coverImgType) {
                        setCoverImgValue(coverImgType);
                    }
                }
            });
    },[props.videoId]);

    const button = bProps => !coverImgUrl ? <NewIcon {...bProps} className={styles.pluse}
                                                     type='eqf-plus'/> : <div
                                 className={styles.changeImg} {...bProps}>替换</div>;

    return (
        <div className={styles.body}>
            <div className={styles.close}><Close onClose={onClose}/></div>
            <p className={styles.title}>微信分享设置</p>
            <div className={styles.item}>
                <span className={styles.name}>标题设置</span>
                <div className={styles.wrap}>
                    <div className={styles.selectWrap}>
                        <Select
                            options={SHARE_OPTIONS.title}
                            onChange={handleChangeTitle}
                            value={titleValue}
                            dropdownMatchSelectWidth={false}
                            suffixIcon={<Icon type="caret-down"/>}
                            optionFilterProp="children"
                            notFoundContent={'暂无匹配数据'}/>
                    </div>
                    <div className={styles.inputWrap}>
                        <input className={titleDisabled ? styles.disabled : ''}
                               disabled={titleDisabled}
                               placeholder={title}
                               value={title}
                               onChange={onChangeTitle}
                               ref={titleRef}
                               maxLength={textLength}
                               type="text"/>
                        <span>{title.length}/{textLength}</span>
                    </div>
                </div>
            </div>
            <div className={styles.item}>
                <span className={styles.name}>描述设置</span>
                <div className={styles.wrap}>
                    <div className={styles.selectWrap}>
                        <Select
                            options={SHARE_OPTIONS.description}
                            onChange={handleChangeDescription}
                            value={descriptionValue}
                            dropdownMatchSelectWidth={false}
                            suffixIcon={<Icon type="caret-down"/>}
                            optionFilterProp="children"
                            notFoundContent={'暂无匹配数据'}/>
                    </div>
                    <div className={styles.inputWrap}>
                        <input className={descriptionDisabled ? styles.disabled : ''}
                               disabled={descriptionDisabled}
                               placeholder={description}
                               value={description}
                               onChange={onChangeDescription}
                               ref={descriptionRef}
                               maxLength={textLengthDesc}
                               type="text"/>
                        <span>{description.length}/{textLengthDesc}</span>
                    </div>
                </div>
            </div>
            <div className={styles.cover}>
                <span className={styles.name}>封面设置</span>
                <div className={styles.coverWrap}>
                    <div className={styles.coverImgWrap}>
                        <Select
                            options={SHARE_OPTIONS.coverImg}
                            onChange={handleChangeCoverImg}
                            value={coverImgValue}
                            suffixIcon={<Icon type="caret-down"/>}
                            optionFilterProp="children"
                            notFoundContent={'暂无匹配数据'}/>
                    </div>
                    {coverImgValue === yourself &&
                    <div className={styles.imgBox}>
                        {coverImgUrl && <img className={styles.bgImg} src={coverImgUrl} alt=""/>}
                        <div className={styles.bgBox}>
                            <ImageButton onChange={handleOnChange} ImgBtn={button}/>
                        </div>
                    </div>}
                </div>
            </div>
            <div className={styles.tipBox}>
                <span>#分享者#使用微信分享昵称</span>
                <div className={styles.why}>
                    <NewIcon className={styles.nike} type='eqf-why-f'/>
                    <img className={styles.tipCover} width='204' height='145' src={tipCover}
                         alt=""/>
                </div>

            </div>
            <div className={styles.buttonWrap}>
                <Button onClick={onClose} className={styles.cancel} lite={1}>取消</Button>
                <Button onClick={sureBtn} className={styles.sure} lite={0}>确认</Button>
            </div>
        </div>
    );
}