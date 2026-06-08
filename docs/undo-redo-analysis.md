# 画布撤销/重做（Undo/Redo）功能问题分析与解决方案

> 项目：PW Canvas 在线设计页面  
> 目标页面：`/pwcanvas/?product_id=545`  
> 涉及文件：`header-controls.js`、`multi-view-init.js`、`page-bootstrap.js`  
> 日期：2026-06-04

---

## 一、问题描述

在线设计页面中的前进/后退（Undo/Redo）按钮存在两个核心问题：

1. **步骤不准确**：部分用户操作没有被记录到历史栈中
2. **起点不对**：API 加载的初始图层（图片、文字）会被撤销掉

用户期望：API 加载完所有图层后，以此状态作为"零点"，仅记录用户后续的交互操作。

---

## 二、当前实现分析

### 2.1 撤销/重做架构

当前实现在 `header-controls.js` 中，基于 VueUse 的 `useRefHistory`：

```
初始化流程：
DOMContentLoaded
  → initializePageBootstrap()
    → fetchProductData()              ← API 获取产品数据
    → initializeMultiViewCanvases()   ← 创建 Fabric.js 画布，渲染所有 API 图层
    → dispatch('multiViewInitComplete')
      → startHistory() (500ms 延迟)
        → initHistory(viewId)         ← 初始化历史记录
```

### 2.2 initHistory 核心逻辑

```javascript
const initHistory = (viewId) => {
    const canvas = pwcaGetCanvasByViewId(viewId);
    
    // 捕获初始状态
    const historyState = ref(canvas.toJSON());
    
    // 创建历史管理
    const { undo, redo, canUndo, canRedo, clear, pause, resume } = 
        useRefHistory(historyState, { capacity: 20 });
    
    // 标志位
    let isRestoring = false;
    let isSyncingFromCanvas = false;
    
    // 监听历史变化（执行 undo/redo 时）
    watch(historyState, (val) => {
        if (isSyncingFromCanvas) return;
        isRestoring = true;
        pause();
        canvas.loadFromJSON(jsonToLoad, () => {
            // ... 恢复图片 ...
            setTimeout(() => {
                isRestoring = false;  // ← 关键：100ms 后恢复标志
                resume();
            }, 100);
        });
    }, { flush: 'sync' });
    
    // 从画布事件更新历史
    const updateHistory = (e) => {
        if (isRestoring) return;
        isSyncingFromCanvas = true;
        historyState.value = canvas.toJSON();
        isSyncingFromCanvas = false;
    };
    
    // 100ms 防抖
    canvas.on('object:added', debouncedUpdateHistory);    // 100ms 延迟
    canvas.on('object:modified', debouncedUpdateHistory);
    canvas.on('object:removed', debouncedUpdateHistory);
    canvas.on('path:created', debouncedUpdateHistory);
};
```

