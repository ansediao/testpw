---
name: "module-architecture"
description: "WordPress 插件模块化架构指南。Invoke when user needs to create a new module, understand module structure, or work with existing modules in a modular WordPress plugin."
---

# WordPress 插件模块化架构指南

## 架构概述

采用模块化架构的 WordPress 插件，所有功能模块位于 `modules/` 目录下，通过模块加载器自动扫描并加载各子目录中的 `index.php`。

## 模块目录结构

### 基础模块结构

```
modules/{module_name}/
├── index.php              # 模块入口，负责引导启动
├── includes/              # PHP 类文件
│   ├── class-{prefix}-{type}-{feature}.php      # 主模块类
│   ├── class-{prefix}-{type}-{feature}-context.php   # 上下文/数据类
│   ├── class-{prefix}-{type}-{feature}-assets.php    # 资源加载类
│   └── ...
├── assets/                # 前端资源
│   ├── js/               # JavaScript 文件
│   └── scss/             # SCSS 样式文件
└── views/                # PHP 视图模板
    └── *.php
```

### 复杂模块结构（支持内部子模块）

对于功能复杂的模块，可在内部使用 `feat_` 前缀文件夹进一步拆分功能子模块：

```
modules/{module_name}/
├── index.php              # 模块入口
├── includes/              # 核心类文件
│   ├── class-{prefix}-{type}-{feature}.php
│   ├── class-{prefix}-{type}-{feature}-context.php
│   └── class-{prefix}-{type}-{feature}-loader.php  # 子模块加载器
├── feat_{sub_feature}/    # 功能子模块（自动加载）
│   ├── index.php
│   └── includes/
├── feat_{another}/        # 另一个功能子模块
│   ├── index.php
│   └── includes/
├── assets/
└── views/
```

## 命名规范

### 前缀约定
- `admin_` - 后台管理模块
- `front_` - 前台模块
- `common_` - 公共模块
- `integration_` - 第三方集成模块

### 类名规范
- 格式: `{Prefix}_{Type}_{Feature}`
- 示例: `MyPlugin_Front_Product`, `MyPlugin_Admin_Dashboard`

### 文件命名
- 主类: `class-{prefix}-{type}-{feature}.php`
- 组件类: `class-{prefix}-{type}-{feature}-{component}.php`

## 模块加载器

```php
<?php
/**
 * 模块加载器
 * 负责扫描插件根目录下的 modules/ 目录，并依次 include 各子目录中的 index.php
 */
class Module_Loader {
    protected $modules_path;

    public function __construct( $modules_path ) {
        $this->modules_path = rtrim( $modules_path, DIRECTORY_SEPARATOR ) . DIRECTORY_SEPARATOR;
    }

    public function load() {
        if ( ! is_dir( $this->modules_path ) ) {
            return;
        }

        $dirs = glob( $this->modules_path . '*', GLOB_ONLYDIR );
        if ( ! is_array( $dirs ) || empty( $dirs ) ) {
            return;
        }

        foreach ( $dirs as $dir ) {
            $index = $dir . DIRECTORY_SEPARATOR . 'index.php';
            if ( file_exists( $index ) ) {
                include_once $index;
            }
        }
    }
}
```

## 模块创建步骤

### 1. 创建模块目录结构

```bash
mkdir -p modules/my_module/includes
mkdir -p modules/my_module/assets/js
mkdir -p modules/my_module/assets/scss
mkdir -p modules/my_module/views
```

### 2. 创建 index.php 入口文件

```php
<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

require_once __DIR__ . '/includes/class-{prefix}-{type}-{feature}.php';

{Prefix}_{Type}_{Feature}::bootstrap(
    __DIR__,
    plugin_dir_url( __FILE__ )
);
```

### 3. 创建主模块类

```php
<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

final class {Prefix}_{Type}_{Feature} {
    private $module_path;
    private $module_url;

    public static function bootstrap( $module_path, $module_url ) {
        $instance = new self();
        $instance->module_path = untrailingslashit( $module_path );
        $instance->module_url  = trailingslashit( $module_url );

        $instance->load_dependencies();
        $instance->register();
    }

    private function load_dependencies() {
        require_once $this->module_path . '/includes/class-{prefix}-{type}-{feature}-context.php';
        require_once $this->module_path . '/includes/class-{prefix}-{type}-{feature}-assets.php';
    }

    private function register() {
        $context = new {Prefix}_{Type}_{Feature}_Context();

        ( new {Prefix}_{Type}_{Feature}_Assets( $context, $this->module_path, $this->module_url ) )->register();
    }
}
```

### 4. 创建组件类模板

**Context 类** - 数据和状态管理：
```php
<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class {Prefix}_{Type}_{Feature}_Context {
    // 数据获取方法
    // 状态管理方法
}
```

**Assets 类** - 资源加载：
```php
<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class {Prefix}_{Type}_{Feature}_Assets {
    private $context;
    private $module_path;
    private $module_url;

    public function __construct( $context, $module_path, $module_url ) {
        $this->context = $context;
        $this->module_path = $module_path;
        $this->module_url = $module_url;
    }

    public function register() {
        add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
        add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_styles' ) );
    }

    public function enqueue_scripts() {
        wp_enqueue_script(
            '{prefix}-{type}-{feature}',
            $this->module_url . 'assets/js/{prefix}-{type}-{feature}.js',
            array(),
            null,
            true
        );
    }

    public function enqueue_styles() {
        wp_enqueue_style(
            '{prefix}-{type}-{feature}',
            $this->module_url . 'assets/scss/{prefix}-{type}-{feature}.css',
            array(),
            null
        );
    }
}
```

## 复杂模块的子模块加载器

对于功能复杂的模块，使用子模块加载器自动加载 `feat_` 前缀的功能子模块：

```php
<?php
/**
 * 子模块加载器
 * 负责扫描模块目录下的 feat_* 子目录并加载
 */
class {Prefix}_{Type}_{Feature}_Loader {
    protected $module_path;
    protected $module_url;

    public function __construct( $module_path, $module_url ) {
        $this->module_path = rtrim( $module_path, DIRECTORY_SEPARATOR ) . DIRECTORY_SEPARATOR;
        $this->module_url  = trailingslashit( $module_url );
    }

    public function load() {
        $feat_dirs = glob( $this->module_path . 'feat_*', GLOB_ONLYDIR );
        if ( ! is_array( $feat_dirs ) || empty( $feat_dirs ) ) {
            return;
        }

        foreach ( $feat_dirs as $dir ) {
            $index = $dir . DIRECTORY_SEPARATOR . 'index.php';
            if ( file_exists( $index ) ) {
                include_once $index;
            }
        }
    }
}
```

### 子模块入口文件示例

```php
<?php
// modules/{module_name}/feat_{sub_feature}/index.php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

require_once __DIR__ . '/includes/class-{prefix}-{type}-{feature}-{sub-feature}.php';

{Prefix}_{Type}_{Feature}_{SubFeature}::bootstrap(
    __DIR__,
    plugin_dir_url( __FILE__ )
);
```

### 更新后的主模块类（支持子模块）

```php
<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

final class {Prefix}_{Type}_{Feature} {
    private $module_path;
    private $module_url;

    public static function bootstrap( $module_path, $module_url ) {
        $instance = new self();
        $instance->module_path = untrailingslashit( $module_path );
        $instance->module_url  = trailingslashit( $module_url );

        $instance->load_dependencies();
        $instance->load_submodules();  // 加载 feat_* 子模块
        $instance->register();
    }

    private function load_dependencies() {
        require_once $this->module_path . '/includes/class-{prefix}-{type}-{feature}-context.php';
        require_once $this->module_path . '/includes/class-{prefix}-{type}-{feature}-assets.php';
        require_once $this->module_path . '/includes/class-{prefix}-{type}-{feature}-loader.php';
    }

    private function load_submodules() {
        $loader = new {Prefix}_{Type}_{Feature}_Loader( $this->module_path, $this->module_url );
        $loader->load();
    }

    private function register() {
        $context = new {Prefix}_{Type}_{Feature}_Context();
        ( new {Prefix}_{Type}_{Feature}_Assets( $context, $this->module_path, $this->module_url ) )->register();
    }
}
```

## 最佳实践

1. **单一职责**: 每个模块只负责一个明确的功能领域
2. **依赖注入**: 通过构造函数注入依赖（如 Context）
3. **延迟加载**: 使用 `bootstrap` 模式，只在需要时初始化
4. **资源隔离**: 模块资源（JS/CSS）独立管理
5. **命名空间**: 使用类前缀避免命名冲突
6. **安全校验**: 所有文件开头添加 `if ( ! defined( 'ABSPATH' ) ) { exit; }`
7. **层级清晰**: 复杂模块使用 `feat_` 前缀拆分子功能，保持目录结构清晰
