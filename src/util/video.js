/**
 * 暂停播放所有视频
 */
export function pauseAllVideo() {
    const videoList = document.querySelectorAll('video');
    videoList.forEach((video, index) => {
        video.pause();
    });
}
