# 雨夜书房 · 交互增强版

在此目录运行 `npm install`、`npm run dev -- --host 127.0.0.1`，打开终端给出的本地地址。生产构建：`npm run build`。项目运行不需要 API key。

三本有标题的书可点击取阅，也可从右侧进入。每本三章，插图由 Codex Image 生成，章节选择会保留。关闭后书归位。

点击桌面纸张、钢笔或“拿起纸笔”，使用鼠标、触摸或支持 Pointer Events 压感的笔手绘。支持颜色、粗细、撤销、重做、保存及 PNG 导出。保存使用当前浏览器的 localStorage，关闭纸面时也会保存；清除站点数据会删除笔迹。手机可通过“展开工具”进入。

雨声默认关闭，点击“开启窗外雨声”播放，支持音量调节。声音是 Web Audio 分层合成；玻璃是实时着色器近似，包括细小水珠、滑落水滴、拖尾与背景扰动，不是完整流体或声学模拟。

## 实现归属

初版场景来自 Atria API 实测及后续修补，原始记录保留在上一版图文和证据包。这一轮新增交互、章节内容、天气优化和布局由 Codex 编写，三幅插图使用 Codex 内置 Image 生成。V2 不能作为 Atria 独立生成这些新增能力的证据。

新增文件：src/immersive.js、src/immersive.css、src/weather.js、src/chapters.js、public/art/。主场景 src/main.js 接入增强模块，并调整书架尺寸与初始视角。
