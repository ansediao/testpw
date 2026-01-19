# PW Canvas 技术栈

## 后端技术

- **PHP**: 5.6+ 兼容，遵循 WordPress 插件开发标准
- **WordPress**: 使用 WordPress Hook 系统的插件架构
- **WooCommerce**: 电商功能集成
- **MySQL**: 通过 WordPress 数据库层进行数据存储

## 前端技术

- **Vue 3**: 主要前端框架，使用 Composition API
- **Pinia**: 状态管理库
- **Fabric.js**: 2D 画布编辑和图形处理
- **Axios**: API 通信的 HTTP 客户端
- **jsPDF**: PDF 导出功能

## 外部依赖

- **CDN 资源**: Vue 3、Pinia、Fabric.js、Three.js 通过 CDN 加载
- **阿里巴巴图标字体**: 图标资源
- **Promowares API**: 外部数据服务集成

## 构建系统

- **无构建工具**: 项目使用直接文件加载，不使用打包工具
- **SCSS 编译**: 使用 Sass CLI 或 VS Code 扩展手动编译 SCSS 到 CSS
- **CDN 加载**: 外部库通过 CDN 加载以简化部署

## 常用命令

### SCSS 编译
```bash
# 全局安装 Sass
npm install -g sass

# 编译单个文件
sass public/css/layers-panel.scss public/css/layers-panel.css

# 监听文件变化
sass --watch public/css/layers-panel.scss:public/css/layers-panel.css

# 编译所有 SCSS 文件
sass public/css/:public/css/ --no-source-map
```

### 开发环境设置
```bash
# 无需构建过程 - 直接编辑文件
# 确保 WordPress 环境安装了必需插件：
# - WooCommerce
# - Flamingo

# 对于 SCSS 开发，使用 VS Code 扩展：
# "Live Sass Compiler" 用于自动编译
```

## 架构模式

- **模块化设计**: 前端组件和后端类分离
- **Hook 驱动**: WordPress Hook 系统用于扩展性
- **REST API**: 前后端通过 WordPress REST API 通信
- **响应式设计**: 多设备支持
- **组件化**: 前端使用 Vue.js 组件架构