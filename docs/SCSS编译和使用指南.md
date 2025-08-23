# SCSS 编译和使用指南

## 文件结构

```
public/css/
├── _variables.scss     # 变量集中定义文件
├── _mixins.scss        # 混合器集中定义文件
├── layers-panel.scss   # 图层面板样式源文件
├── layers-panel.css    # 图层面板编译后的CSS文件
└── 其他样式文件...
```

## 开发流程

### 1. 变量管理
在定义新变量前，请按以下步骤操作：

1. **检查现有变量**：打开 `_variables.scss` 文件，搜索是否已有相同或类似的变量
2. **变量命名规范**：使用 `$canvas-` 前缀，采用语义化命名
3. **添加详细注释**：包含变量用途和使用位置说明
4. **按分类组织**：将变量放在对应的分类区域（颜色、尺寸、字体等）

### 2. SCSS 文件编写
每个SCSS文件必须遵循以下结构：

```scss
// 1. 导入变量文件
@import 'variables';

// 2. 导入混合器文件  
@import 'mixins';

// 3. 组件特有变量定义（如有需要）
// 变量名 - 用途说明
// 使用位置：具体说明在哪里使用
$component-specific-var: value;

// 4. 组件样式定义
.component-class {
  // 样式规则
}
```

### 3. CSS 编译

#### 使用 Sass 命令行工具
```bash
# 安装 Sass
npm install -g sass

# 编译单个文件
sass public/css/layers-panel.scss public/css/layers-panel.css

# 监听文件变化自动编译
sass --watch public/css/layers-panel.scss:public/css/layers-panel.css

# 编译所有 SCSS 文件
sass public/css/:public/css/ --no-source-map
```

#### 使用 VS Code 扩展
推荐安装 "Live Sass Compiler" 扩展：
1. 在 VS Code 中安装扩展
2. 在状态栏点击 "Watch Sass" 
3. 保存 SCSS 文件时自动编译为 CSS

### 4. 文件同步要求

根据项目规范，**必须同时维护 CSS 和 SCSS 文件**：

- **SCSS 文件**：用于开发和维护
- **CSS 文件**：用于生产环境加载
- **同步要求**：修改 SCSS 后必须编译更新对应的 CSS 文件

## 变量使用示例

### 正确的变量使用方式
```scss
// 导入变量文件
@import 'variables';

.my-component {
  // 使用统一变量
  color: $canvas-primary-color;
  padding: $canvas-spacing-md;
  border-radius: $canvas-border-radius;
  font-size: $canvas-font-size-base;
}
```

### 错误的做法
```scss
// ❌ 不要直接定义硬编码的值
.my-component {
  color: #3b82f6;        // 应该使用 $canvas-primary-color
  padding: 16px;         // 应该使用 $canvas-spacing-md
  border-radius: 4px;    // 应该使用 $canvas-border-radius
}
```

## 混合器使用示例

```scss
// 导入混合器文件
@import 'mixins';

.my-button {
  // 使用按钮基础样式混合器
  @include canvas-button-base;
  
  // 添加特有样式
  background-color: $canvas-primary-color;
}

.my-panel {
  // 使用面板基础样式混合器
  @include canvas-panel-base(md);
  
  // 添加特有样式
  width: 300px;
}
```

## 开发注意事项

### 1. 变量定义前的检查清单
- [ ] 检查 `_variables.scss` 中是否已有相同或相似变量
- [ ] 变量命名使用 `$canvas-` 前缀
- [ ] 添加了详细的使用说明注释
- [ ] 变量放在了正确的分类区域

### 2. 编译检查清单
- [ ] SCSS 文件保存后已编译为 CSS
- [ ] CSS 文件内容与 SCSS 源码一致
- [ ] 没有编译错误或警告
- [ ] 在浏览器中测试样式效果正常

### 3. 代码审查要点
- [ ] 没有使用内联样式或 `<style>` 标签
- [ ] SCSS 结构符合 DOM 层级结构
- [ ] 使用了统一的变量而不是硬编码值
- [ ] 混合器使用得当，避免代码重复

## 故障排除

### 常见问题
1. **编译错误**: 检查 `@import` 路径是否正确
2. **变量未定义**: 确保已导入 `_variables.scss`
3. **混合器不可用**: 确保已导入 `_mixins.scss`
4. **样式不生效**: 检查 CSS 文件是否已更新

### 调试技巧
- 使用浏览器开发者工具检查最终生成的 CSS
- 确保 SCSS 编译没有产生错误
- 检查变量和混合器的导入顺序