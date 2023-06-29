import React from 'react';
import playButton from '../../static/playButton.png';

export default function VideoPlayButton(props) {
    return <img src={playButton} alt={'播放'} {...props} />
}
