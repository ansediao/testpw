# PW Canvas 技术栈

## 后端技术
- **PHP**: 5.6+ 兼容，遵循 WordPress 插件开发标准
- **WordPress**: 插件架构，使用 WordPress Hook 系统
- **WooCommerce**: 电商功能集成
- **MySQL**: 数据存储（通过 WordPress）

## 前端技术
- **Vue 3**: 主要前端框架，使用 Composition API
- **Pinia**: 状态管理库
- **Fabric.js**: 2D 画布编辑和图形处理
- **Three.js**: 3D 模型渲染和交互
- **Axios**: HTTP 客户端
- **jsPDF**: PDF 导出功能

## 外部依赖
- **CDN 资源**: Vue 3, Pinia, Fabric.js, Three.js 等通过 CDN 加载
- **阿里云字体图标**: 图标资源
- **Promowares API**: 外部数据服务

## 开发工具
- **Git**: 版本控制
- **WordPress 开发环境**: 本地开发需要 WordPress 环境

## 架构特点
- **模块化设计**: 前端组件化，后端类文件分离
- **Hook 驱动**: 使用 WordPress Hook 系统进行功能扩展
- **REST API**: 前后端通过 REST API 通信
- **响应式设计**: 支持多设备访问