# 儿童立体绘本版

运行：npm install，然后 npm run dev -- --host 127.0.0.1。

打开 /?library=children 可直接进入绘本馆。房间里点击三本绘本的实体封面也可进入。选择绘本，拖动模型旋转，滚轮缩放，点击动物或按钮互动；音频播放器朗读当前章节，翻幕自动停止。问答答对记录、章节使用 localStorage 保留。

3 本新增绘本，每本 4 幕，总计 12 幕、12 段音频、12 个知识卡与提问。加上原来的 3 本书，共 6 本、21 章/幕。

实现：children-data.js（故事数据）、children.js（界面/存储/音频）、pop-up-world.js（模型与场景）、children.css（封面排版与布局）。

封面来自 Codex 内置 Image，原始提示词见 public/art/children-image-prompts.json。中文音频使用本机 Tingting 合成、FFmpeg 转成 MP3。新增代码、故事和模型由 Codex 完成，不能归为 Atria 的独立输出。

这是浏览器内 3D 立体绘本，未接入摄像头、WebXR 或现实空间定位。模型为风格化程序模型。验证环境为本机 Chrome 与窄屏模拟，未完成实机手机和跨浏览器验收。
