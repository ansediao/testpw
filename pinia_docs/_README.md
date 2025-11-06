# Pinia 文档 SOP（按页面分文件夹）

本目录用于系统化记录前端 Pinia 状态管理（Store）文档，结构与 `api_docs/` 保持一致但按“页面”维度分文件夹，便于 AI 与开发者快速定位与理解状态流转。

## 目录结构

```
pinia_docs/
├── _README.md                 # 总体SOP与命名规范
├── design/                    # 设计画布页面相关 stores
│   ├── _README.md
│   ├── 01_canvas_store.md     # useCanvasStore（canvas）
│   └── 02_print_method_store.md# usePrintMethodStore（printMethod）
├── product/                   # 产品详情/下单页面相关 stores
│   ├── _README.md
│   └── 01_product_store.md    # useProductStore（product）
└── utils/                     # 辅助工具（若需要）
    └── 01_pinia_sync.md       # syncPiniaToElement 工具
```

## 命名规范
- 文件命名：`序号_英文描述.md`，序号用于控制文档阅读顺序。
- 页面文件夹：与源码目录对应，如 `public/js/design` → `pinia_docs/design/`。
- Store 标识：使用 Pinia 定义的 `id`（如 `canvas`、`printMethod`、`product`）。

## 标准模板（Store 文档）

每个 Store 文档建议包含以下内容：

1. 概述
   - Store 名称与 ID（如：`useCanvasStore` / `canvas`）
   - 页面归属与模块路径（源码位置）
   - 全局暴露方式（如 `window.useCanvasStore()`）

2. 依赖与交互
   - 依赖其他 Store、工具或 API（如：调用 `usePrintMethodStore`、`/wp-json/pw/v1/...`）
   - 与 CanvasManager/Fabric.js 的交互约束（不在 Store 中直接持有 Canvas 实例）

3. State 列表
   - 列出关键状态字段与用途（简要，便于 AI 抓取意图）

4. Getters 列表
   - 列出依赖状态的计算逻辑（只放计算）

5. Actions 列表
   - 列出修改状态与异步操作（只放变更与异步）

6. 控制台测试示例
   - 提供可以在浏览器控制台直接执行的测试片段（遵循用户偏好，不创建测试文件、不启动服务）

7. 注意事项
   - Getter/Action 职责边界：依赖状态的计算放在 Getters，依赖状态的异步操作放在 Actions
   - 多视图兼容：切换视图需同步相关派生状态（如打印方式）
   - 与 Vue 响应式系统的隔离：不要在 Store 中存储 Fabric Canvas 实例（遵循 CanvasManager 规范）

## AI 使用指引
- 在 IDE 中可通过 `@pinia_docs` 进行引用，或直接复制本目录内容进行上下文强化。
- 若新增 Store 或页面，请遵循上述结构与模板，补充到对应文件夹。

## 控制台测试约定
- 统一从全局访问器获取 Store：`window.useCanvasStore()`、`window.usePrintMethodStore()`、`window.useProductStore()`。
- 不创建测试文件、不启动任何服务；仅在浏览器控制台输入示例指令进行校验。