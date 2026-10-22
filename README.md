# 纸间 · 折纸实验室

一个无需构建的 HTML / CSS / JavaScript 折纸网页。五种作品：千纸鹤、小船、纸飞机、蝴蝶、小青蛙。

## 本地运行

```sh
npm run dev
```

打开 http://localhost:5186 。使用任意静态 HTTP 服务托管 `dist/` 也可以；ES modules 和模型 JSON 通过 HTTP 加载，不支持直接双击 `file://`。

## 功能

- 完整纸面到成品的逐步 3D 折叠，播放 / 暂停、上一步 / 下一步、从头开始。
- 可拖动进度，0.5 / 1 / 1.5 / 2 倍速。
- 鼠标拖动或单指滑动旋转；滚轮或双指捏合缩放；自动旋转、重置、全屏。
- 六种纸色、双色纸、折痕开关、完整展开折痕图。
- 导出当前三维视角或折痕图为 PNG。
- 桌面与移动端响应布局，原生按钮、键盘控制和焦点样式。
- 空格播放 / 暂停，左右方向键切换步骤；操作表单控件时保留浏览器原生键盘行为。

## 结构

- `dist/index.html`、`dist/style.css`：中文工作台与响应式布局。
- `dist/app.js`：Three.js 场景、输入、播放、设置、PNG 导出。
- `dist/fold.js`：按面片推导刚性变换，绕折线轴旋转插值。没有通过线性缩放顶点制造折叠。
- `dist/models/*.json`：预计算纸面坐标、面片连接和每道折叠的起止坐标。
- `scripts/java/`、`scripts/models/`：可复现模型数据的 Java 导出器、几何源文件与 `.ori` 原始模型；浏览器运行不需要 Java。
- `scripts/check-models.mjs`：验证模型面积、有限坐标和刚性插值。

## 验证

```sh
npm run check
```

检查五种模型的每个步骤：展开纸面的面积误差小于 `1e-5`，旋转插值中的边长数值误差小于 `1e-7`。原始模型使用有限精度的折叠平面，在步骤端点有小幅坐标误差；按纸宽 150 mm 计算，目前最大约 0.583 mm。这不是工业精度的物理求解器。

每个面片先采用刚性旋转，复杂开合步骤再对共享顶点施加边长及面对角线约束，避免面片分离。抽样测试中，共享网格的最大长度偏差约 0.377 mm（纸宽 150 mm）。未实现纸张厚度、完整自碰撞与纸面接触求解；复杂收拢步骤可能出现相交，不能声称整个过程绝对不穿模。渲染使用极小的法线偏移区分共面纸层，不改变原始模型数据。

五个模型的可视化步骤标题用于导航，不替代经过专业校对的手工折纸教程。

## 重新生成模型

需要 JDK 17 或更新版本。从项目根目录执行：

```sh
mkdir -p /tmp/paper-in-motion-classes
javac -d /tmp/paper-in-motion-classes scripts/java/ExportModels.java scripts/java/origamieditor3d/origami/*.java scripts/java/origamieditor3d/io/*.java
java -cp /tmp/paper-in-motion-classes ExportModels
npm run check
```

## 来源与许可

折纸几何引擎、传统折纸示例来自 [Origami Editor 3D](https://github.com/bagyoni/origamieditor3d)，作者 Attila Bágyoni，GNU GPL v3。保留上游 Java 源码、原始模型和许可证。上游版本：`13b0a8cefe37b467ca2ada1e6dd83ab17cce8688`。

本站的工作台、刚性动画播放器、Three.js 渲染和导出适配器为 2026-10-22 新建，采用 GPL-3.0-only。没有复制小红书页面的品牌、视频或源码；参考链接用于理解“一张纸逐步折叠”的交互目标，原视频未能完整读取。

Three.js r170 采用 MIT 许可，随附 `dist/vendor/three/LICENSE`。全部浏览器运行依赖已在项目中，不需要 CDN；可选的 Google Fonts 字体请求失败时使用系统中文字体。
