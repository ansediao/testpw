---
name: "checkerboard-background"
description: "纯 CSS 棋盘格/格子背景。当用户需要给某个元素添加棋盘格、格子、checkerboard 背景时调用。"
---

# 棋盘格背景

给任意元素添加纯 CSS 实现的 20×20px 灰色棋盘格背景。

## 使用方式

在目标元素的 SCSS 中应用以下样式：

```scss
background-color: #f7f7f7;
background-image:
    linear-gradient(45deg, #ececec 25%, transparent 25%),
    linear-gradient(-45deg, #ececec 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ececec 75%),
    linear-gradient(-45deg, transparent 75%, #ececec 75%);
background-size: 20px 20px;
background-position: 0 0, 0 10px, 10px -10px, -10px 0;
```

## 自定义

| 变量 | 默认值 | 说明 |
|------|--------|------|
| 底色 | `#f7f7f7` | 格子空隙的背景色 |
| 格子色 | `#ececec` | 格子的颜色 |
| 格子大小 | `20px` | 单个格子的边长 |

修改 `background-size` 可改变格子大小，`background-position` 的第二/三/四个值需相应调整为 `background-size` 的一半。

## 适用场景

- Fabric.js 画布外围区域，区分"舞台"和"页面"
- 图片编辑器、设计工具的背景区
- 需要透视/透明感的容器背景
