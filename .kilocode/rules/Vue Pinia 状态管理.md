# Vue Pinia 状态管理.md

指导Vue Pinia 状态管理

## 指导原则

1. 依赖于 Store 状态的计算逻辑，放在 getters 中
2. 依赖于 Store 状态的异步操作，放在 actions 中
