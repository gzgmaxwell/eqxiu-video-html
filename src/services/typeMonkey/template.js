module.exports = {
    str: `
 <!---------- 基础模板 ---------->
<div
        id="#{id}"
        ctype="#{type}"
        class="speech-rcg"
>
    <!-- 控制组件尺寸影响 -->
    <div class="speech-size-control">
        <!-- 背景图片/视频插槽 -->
        <slot-bg>
            <!-- 预览/编辑模板插槽 -->
            <slot-mode>
    </div>
</div>

<hr>

<!-- 背景图片 -->
<div class="speech-bg-img"
     style="display: #{bgDisplay}; background-image: url(#{bgImgSrc}); opacity: #{bgImgOpacity};"
></div>

<hr>

<!-- 背景视频 -->
<div class="speech-bg-video">
    <video src="#{bgVideoSrc}"></video>
</div>

<hr>

<!---------- 预览模板 ---------->
<!-- 字幕动画 -->
<div class="speech-lrc-content">
    <!-- 字幕行基准容器 -->
    <div class="lrc-position-base #{lrcBaseClass}">
        <!-- 初始段容器 -->
        <div class="speech-lrc-p">
            <div class="speech-lrc-p-visual">
                <!-- 初始第一行 -->
                <div class="speech-lrc-line zoom-center">
                    <div class="speech-lrc-line-visual"></div>
                </div>
            </div>
        </div>
    </div>
</div>

<hr>

<!---------- 编辑模板 ---------->
<!-- 添加语音 -->
<div
        class="speech-add-view"
>
    <div class="speech-add-editor">
        <!-- 字幕为空时 -->
        <div class="speech-no-lrc" style="display: #{noLrc}">
            <div class="speech-add-icon">
                <span class="eqf-recognition"></span>
            </div>
            <div class="speech-add-desc">请添加音/视频</div>
        </div>
        <!-- 字幕不为空时 -->
        <div class="speech-line-text-set #{lrcBaseClass}"></div>
    </div>
</div>

 `,
};
