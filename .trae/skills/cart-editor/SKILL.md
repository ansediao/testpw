# Cart Editor Skill

通用的购物车编辑功能 Skill，支持保存和恢复编辑器状态。

## 功能特性

- 多层数据存储（LocalStorage + IndexedDB）
- 完整的购物车项编辑流程
- URL 参数管理
- 独立于特定框架的抽象设计

## 安装

```bash
# 直接复制到你的项目中使用
```

## 快速开始

```javascript
import { CartEditor, DataManager } from './index.js';

// 初始化
const dataManager = new DataManager({
  appName: 'my-app'
});

const cartEditor = new CartEditor({
  dataManager,
  onLoadProduct: (productData) => {
    // 实现你的产品加载逻辑
    console.log('加载产品:', productData);
  }
});

// 检查是否需要编辑购物车项
cartEditor.checkUrlAndEdit();
```

## API 文档

### DataManager

数据管理器，负责 LocalStorage 和 IndexedDB 的存储操作。

#### 构造函数

```javascript
new DataManager(options)
```

**选项：**
- `appName` (string, 必需): 应用名称，用于存储键前缀
- `storageKey` (string, 可选): LocalStorage 键名，默认 `${appName}-cart-data`
- `dbName` (string, 可选): IndexedDB 数据库名，默认 `${appName}-cart`

#### 方法

**`saveCartItem(item)`**
保存购物车项

**`getCartItem(id)`**
获取指定 ID 的购物车项

**`getAllCartItems()`**
获取所有购物车项

**`deleteCartItem(id)`**
删除指定购物车项

**`saveDesignData(id, data)`**
保存完整设计数据到 IndexedDB

**`getDesignData(id)`**
从 IndexedDB 获取设计数据

### CartEditor

购物车编辑器，负责编辑流程管理。

#### 构造函数

```javascript
new CartEditor(options)
```

**选项：**
- `dataManager` (DataManager, 必需): 数据管理器实例
- `onLoadProduct` (function, 必需): 加载产品的回调函数
- `onEditStart` (function, 可选): 开始编辑时的回调
- `onEditCancel` (function, 可选): 取消编辑时的回调
- `urlParamCart` (string, 可选): URL 参数名，默认 'cart'

#### 方法

**`checkUrlAndEdit()`**
检查 URL 参数并自动编辑

**`editItem(cartId)`**
编辑指定的购物车项

**`cancelEdit()`**
取消编辑

**`isEditing()`**
检查是否正在编辑

### UrlParams

URL 参数管理工具。

#### 静态方法

**`UrlParams.get(name, defaultValue)`**
获取 URL 参数

**`UrlParams.set(name, value)`**
设置 URL 参数

**`UrlParams.remove(name)`**
移除 URL 参数

## 数据结构

### 购物车项 (CartItem)

```javascript
{
  id: 'unique-cart-id',           // 唯一标识符
  productId: 'product-123',       // 产品 ID
  productName: '产品名称',         // 产品名称
  options: {},                    // 用户选择的选项
  designData: {},                 // 设计数据（可选，完整数据存 IndexedDB）
  createdAt: 1234567890,         // 创建时间戳
  updatedAt: 1234567890          // 更新时间戳
}
```

### 设计数据 (DesignData)

```javascript
{
  stages: {                       // 设计阶段数据
    stage1: { /* ... */ },
    stage2: { /* ... */ }
  },
  objects: [],                    // 画布对象
  settings: {}                    // 其他设置
}
```

## 完整示例

查看 `examples/` 目录获取完整使用示例。

## License

MIT