## 核心架构
- **PHP**: WordPress插件后端，遵循WordPress标准插件结构
- **JavaScript**: 前端画布系统，模块化架构
- **Fabric.js**: 2D画布渲染和操作
- **Three.js**: 3D模型支持和纹理映射
- **Vue.js/Pinia/vueuse**: 前端状态管理（部分模块）

## 关键设计模式
- **CanvasManager**: 单例模式管理所有Fabric.js Canvas实例，避免Vue响应式系统干扰
- **模块化组件**: PHP和JS都采用模块化设计，便于维护和扩展
- **状态隔离**: Canvas实例存储在WeakMap中，与Vue响应式系统隔离
- **API代理**: 通过WordPress REST API代理Promowares API请求