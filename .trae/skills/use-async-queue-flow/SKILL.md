---
name: "use-async-queue-flow"
description: "用 VueUse useAsyncQueue 统一管理复杂页面初始化和异步依赖流程。Invoke when restructuring load order, removing polling/listeners, or refactoring complex startup flow."
---

# UseAsyncQueue 流程管理指南

## 用途

用于把项目中复杂、分散、容易混乱的异步流程，统一收敛为一条清晰的任务队列。

典型场景：

- 在线设计页初始化
- 产品数据、店铺配置、印刷方式、多视图画布的串行加载
- 购物车编辑回显前的前置依赖等待
- 原本依赖 `setTimeout`、自定义事件、重复监听的启动逻辑重构

## 何时调用

以下情况应优先考虑使用本 Skill：

- 需要梳理“页面加载流程”或“初始化顺序”时
- 发现代码里有很多 `DOMContentLoaded`、`setTimeout`、轮询探测、once 事件拼接时
- 某个模块必须“等上一步完成后”才能继续时
- 想把首屏关键链路和后台补充链路拆清楚时
- 需要统一错误拦截、日志记录、任务耗时分析时

## 核心目标

- 所有初始化步骤都显式写成 `tasks`
- 依赖顺序一眼可见，不靠“猜什么时候 ready”
- 不再散落多个自定义监听互相触发
- 不再依赖“等几百毫秒再试一次”的不稳定方式
- 错误和完成态统一在队列层处理

## 设计原则

### 1. 先拆任务，再写代码

先把流程拆成一组明确任务，再实现每个任务函数。例如：

1. 等待 Store 就绪
2. 拉取产品数据
3. 拉取当前视图印刷方式
4. 初始化多视图画布
5. 绑定 UI 同步
6. 初始化状态集成
7. 回显编辑态数据

### 2. 一个任务只做一件事

每个 task 保持职责单一：

- `waitForCanvasStore`
- `fetchProductData`
- `initializeMultiViewCanvases`
- `restoreCartEditCanvasState`

不要把多个阶段塞进一个“大一统初始化函数”。

### 3. 首屏关键链路与非关键链路分层

建议分为两层：

- 首屏关键链路：用户进入页面后必须完成，页面才能进入可操作状态
- 补充链路：不阻塞首屏，但依赖首屏结果，例如状态回显、增强能力、日志同步

如果补充链路同样强依赖顺序，也可以继续使用第二组 `useAsyncQueue`。

### 4. 用“等待条件”替代“等待时间”

推荐：

```js
await waitFor(() => window.useCanvasStore?.(), { timeoutMs: 10000, intervalMs: 50 });
```

不推荐：

```js
setTimeout(() => {
  initSomething();
}, 500);
```

原因：

- 时间不是依赖
- 500ms、1000ms 都只是猜测
- 真正应该等待的是“某个条件成立”

### 5. 队列层统一处理错误

不要在多个初始化入口各自处理“失败了怎么办”。

推荐在 `useAsyncQueue` 的 `onError`、`onFinished` 统一记录：

- 哪一步失败
- 当前激活索引
- 错误对象
- 全部任务是否结束

## 标准骨架

推荐直接使用下面的结构：

```js
const tasks = [
  task1,
  task2,
  task3,
];

const { activeIndex, result } = useAsyncQueue(tasks, {
  interrupt: true,
  onError: () => {
    const err = result[activeIndex.value];
    console.error('队列中断原因:', err);
  },
  onFinished: () => {
    console.log('所有任务结束');
  },
});
```

### 推荐配置

- `interrupt: true`
  - 初始化链路通常有强依赖
  - 某一步失败后继续往下跑，容易造成状态污染和 UI 混乱

- `onError`
  - 统一打印错误
  - 统一记录失败任务索引
  - 必要时给用户友好提示

- `onFinished`
  - 统一记录流程完成
  - 写入全局上下文或调试对象

## 项目内推荐模式

以 `front_canvas` 为例，推荐使用“上下文 + 任务工厂”模式。

### 上下文对象

```js
const createAsyncContext = () => ({
  settings: getSettings(),
  startedAt: Date.now(),
  store: null,
  productData: null,
  integration: null,
  externalCanvasState: null,
  errors: [],
  tasks: [],
  queueResults: [],
});
```

作用：

- 在多个任务之间共享状态
- 避免依赖过多全局变量
- 方便最终输出完整初始化报告

### 任务包装器

```js
const createStartupTask = (context, taskName, runner) => (
  async (previousContext) => {
    const currentContext = previousContext || context;
    await runner(currentContext);
    return currentContext;
  }
);
```

作用：

- 保持 `useAsyncQueue` 的任务签名统一
- 每一步都返回同一个 `context`
- 方便插入日志、耗时、异常记录

### 推荐任务构建方式

```js
const buildStartupTasks = (context) => [
  createStartupTask(context, 'waitForCanvasStore', startupTaskWaitForCanvasStore),
  createStartupTask(context, 'fetchProductData', startupTaskFetchProductData),
  createStartupTask(context, 'ensureActiveViewPrintMethodsLoaded', startupTaskEnsureActiveViewPrintMethodsLoaded),
  createStartupTask(context, 'initializeMultiViewCanvases', startupTaskInitializeMultiViewCanvases),
  createStartupTask(context, 'syncUiState', startupTaskSyncUiState),
];
```

这样做的好处：

- 流程顺序非常直观
- 增删任务成本低
- 更适合后续维护和排查

## 如何使用

### 用法 1：页面初始化主链路

适用于进入页面时必须完成的一整套流程。

步骤：

1. 定义 `context`
2. 定义任务函数
3. 构建 `tasks`
4. 交给 `useAsyncQueue`
5. 在 `onFinished` 中收口

### 用法 2：重构旧代码

如果现有代码有这些问题：

- 多处 `DOMContentLoaded`
- 多个自定义事件互相触发
- `setTimeout(..., 150)`、`setTimeout(..., 500)` 探测 ready
- 同一个模块被重复初始化

重构顺序建议：

1. 找出真正的依赖关系
2. 把依赖关系改写成任务顺序
3. 把时间等待改成条件等待
4. 把 scattered listener 改成单一启动入口
5. 把错误处理上收至队列层

### 用法 3：拆分首屏与后台任务

如果某些任务不阻塞首屏，可拆成两段：

```js
await runStartupQueue(primaryTasks, context);
await runStartupQueue(backgroundTasks, context);
```

适合：

- 首屏先可编辑
- 后续再回填购物车状态
- 后续再初始化非核心集成

## 项目内实施建议

### 推荐落点

- 页面级引导：`modules/front_canvas/assets/js/canvas/page-bootstrap.js`
- UI 状态同步：`modules/front_canvas/assets/js/main/core-init.js`
- 多视图初始化：`modules/front_canvas/assets/js/canvas/multi-view-init.js`
- Store 相关依赖：`modules/front_canvas/assets/js/design/stores/`

### 推荐做法

- 由一个页面入口统一启动队列
- 其他模块只暴露“可调用的方法”，不要自行偷偷启动
- 所有“等某对象 ready”的逻辑统一走 `waitFor`
- 所有自定义事件都先判断是否还能被 task 依赖替代

### 不推荐做法

- 在多个文件各自 `DOMContentLoaded`
- 用 `setTimeout` 猜初始化时机
- 某个模块内部自动重试并且外层不知道
- 一个任务失败后仍强行继续后续强依赖步骤

## 调试建议

建议统一输出这几类日志：

- 当前执行任务名
- 执行开始时间
- 执行耗时
- 失败任务索引
- 队列最终结果

可在全局挂一个调试对象：

```js
window.pwcaCanvasAsyncContext = finalContext;
```

这样浏览器控制台可直接检查：

```js
window.pwcaCanvasAsyncContext
```

## 常见错误

- 把 `useAsyncQueue` 当成“异步并发工具”而不是“顺序流程工具”
- task 不返回上下文，导致后续步骤拿不到前一步结果
- 继续保留旧的 `setTimeout` 探测逻辑，导致队列外还有第二套启动链路
- `onError` 只打印错误，不中断关键链路
- 首屏任务和后台任务混在一起，导致加载链路臃肿

## 验收清单

- [ ] 初始化流程已经明确拆成 `tasks`
- [ ] 页面只有一个主启动入口
- [ ] 不再依赖“等待多少毫秒后再初始化”
- [ ] 关键依赖通过条件等待而不是时间等待
- [ ] 错误处理统一放在队列层
- [ ] 首屏关键链路和补充链路边界清楚
- [ ] 调试时能看到每一步任务状态
