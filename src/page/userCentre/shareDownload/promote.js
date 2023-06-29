import React, { useState, useEffect, useRef } from 'react';
import PropsTypes from 'prop-types';
import { message, Tooltip } from 'antd';
import { TYPE_PAGE, POS_FROM } from 'Config/staticParams/goodsParams';
import { EDITOR_PRODUCT } from 'Config/staticParams';
import { waitChoseModel } from 'Components/delete';
import { host, prev } from 'Config/env';
import { formatEQXMessage } from 'Util/event';
import styles from './promote.less';
import { connect } from 'dva';

/**
 * 新媒体互动组件推广
 * @param {*} param0 
 */
function MediaPromote(props) {
  const tabs = [{
    title: '下载视频',
    type: TYPE_PAGE.download,
    show: true
  }, {
    title: '分享视频',
    type: TYPE_PAGE.share,
    show: true
  }, {
    title: `嵌入作品至${props.openFrom}`,
    type: TYPE_PAGE.implant,
    show: props.openFrom ? true : false
  }, {
    title: '推广',
    type: TYPE_PAGE.promote,
    show: true
  }];

  const { videoId, scale, positionFrom = 'workSpace', product, renderTip = false } = props;

  const messageType = ['edit', 'publish', 'login', 'onload'];
  const iframeUrl = `${host.mediaPromoteAd}/yqc/interactiveSet?worksId=${videoId}&scale=${scale}`;
  const iframeRef = useRef();
  const [modalTitle, setModalTitle] = useState('下载和分享');
  const [tip, setTip] = useState(false);
  useEffect(() => {
    if (renderTip) {
      setTip(true);
    }
  }, [renderTip]);
  const receiveMessage = (msgData) => {
    const data = formatEQXMessage(msgData);
    if (data === false) return;
    if (data.type === 'edit') {
      edit(msgData);
    }
    if (data.type === 'publish') {
      publish(msgData);
    }
    if (data.type === 'login') {
      props.onLogin();
    }
    if (data.type === 'onload') {
      onload();
    }
  };

  const edit = (ev) => {
    // positionFrom  WorkSpace:来自我的作品 ; editorSpace 编辑器
    // if (product === EDITOR_PRODUCT.selfieVideo) {
    //   message.error('APP模板实拍暂不支持编辑');
    //   return false;
    // }
    if (positionFrom === POS_FROM.workSpace) { // 在工作台
      redirectEdit();
      props.onClose(ev, true);
    } else if (positionFrom === POS_FROM.editorSpace) {
      props.onClose();
    }
  };

  const publish = (ev) => {
    props.onNavActive(ev, TYPE_PAGE.share);
    // message.success('发布成功，去分享视频');
  };

  const onload = () => {
    const { videoSrc, videoCoverImg } = props;
    const iframeDom = iframeRef.current;
    const msgData = {
      type: 'baseData',
      worksId: videoId,
      scale,
      renderProgress: '100',
      videoSrc,
      videoCoverImg,
      positionFrom
    };
    iframeDom && iframeDom.contentWindow.postMessage(JSON.stringify(msgData), '*');
  };

  /**
   * 重定向到编辑页
   * @returns {boolean}
   */
  const redirectEdit = async () => {
    const { templateId, platform } = props;
    // if (vaildIsRendering(this.state.hdstatus)) {
    //   Message.error('高清渲染中无法继续编辑...');
    //   return false;
    // }
    const isPhone = ~~platform !== 1;
    if (isPhone) {
      const s = await waitChoseModel({
        text: `手机作品一旦编辑，就会转为电脑作品。\n
                    电脑作品暂不支持在手机端编辑，请谨慎操作。`,
        sureBtn: '继续',
      })
        .catch();
    }
    let url = `${prev}/editor/${templateId}/${videoId}`;
    switch (product) {
      case EDITOR_PRODUCT.subtitles:
        url = `${prev}/subEditor/subtitles/0/${videoId}`;
        break;
      case EDITOR_PRODUCT.headTail:
        url = `${prev}/HTEditor/${templateId}/${videoId}`;
        break;
      case EDITOR_PRODUCT.flash: {
        url = `${prev}/subEditor/flash/${templateId}/${videoId}`;
        break;
      }
      case EDITOR_PRODUCT.typeMonkey: {
        url = `${prev}/subEditor/typeMonkey/${templateId || 1}/${videoId}`;
        break;
      }
      default:
        break;
    }
    window.open(url);
  };

  useEffect(() => {
    if (positionFrom === POS_FROM.workSpace) {
      setModalTitle('下载和分享');
    }
    if (positionFrom === POS_FROM.editorSpace) {
      setModalTitle('预览和生成');
    }
    window.addEventListener('message', receiveMessage, false);
    return () => {
      window.removeEventListener('message', receiveMessage, false);
    }
  }, []);

  useEffect(() => {
    const iframeDom = iframeRef.current;
    if (!props.visible && iframeDom) {
      // 消息通知新媒体->新媒体发送给视频播放 暂停视频播放
      const msgData = {
        type: 'pause',
        msg: '暂停视频播放'
      };
      iframeDom.contentWindow.postMessage(JSON.stringify(msgData), '*');
      console.log('消息发送成功', msgData)
    }
  }, [props.visible]);

  function hadleClose() {
    props.onClose();
  }

  function handActive(e, type) {
    props.onNavActive(e, type);
  }
  return (
    <div className={styles.modalPromote} style={{ display: props.visible ? 'block' : 'none' }}>
      <div className={styles.head}>
        <span className={styles.title}>{modalTitle}</span>
        <i className='icon eqf-no' type='eqf-no' onClick={hadleClose}></i>
        <div className={styles.tabs}>
          {
            tabs.map((tab, index) => {
              if (tab.show) {
                if (tab.type !== TYPE_PAGE.promote && !tip) {
                  return <Tooltip key={index} title={'视频生成成功后才能进行下载和分享'}>
                    <div
                      className={`${styles.tab} ${tab.type === TYPE_PAGE.promote ? styles.active : ''}`}
                      onClick={(e) => handActive(e, tab.type)}
                    >{tab.title}</div>
                  </Tooltip>
                }
                return <div
                  key={index}
                  className={`${styles.tab} ${tab.type === TYPE_PAGE.promote ? styles.active : ''}`}
                  onClick={(e) => handActive(e, tab.type)}
                >{tab.title}</div>
              }
            })
          }
        </div>
      </div>
      <iframe src={iframeUrl} ref={iframeRef} allow="fullScreen"></iframe>
    </div>
  )
}



MediaPromote.PropsTypes = {
  onNavActive: PropsTypes.func,
  onClose: PropsTypes.func,
  openFrom: PropsTypes.string,
  videoId: PropsTypes.string,
  scale: PropsTypes.number,
  videoSrc: PropsTypes.string,
  videoCoverImg: PropsTypes.string,
}

function commLogin(payload) {
  return {
    type: 'user/needLogin',
    payload,
  }
}
function mapStateToProps({ user }) {
  const { needLogin } = user;
  return {
    onLogin: () => needLogin()
  }
}
export default connect(mapStateToProps)(MediaPromote);