# JavaScript HTML 实体编码问题修复指南

## 问题描述

在 WordPress 插件开发中，当在 PHP 文件中嵌入 JavaScript 代码时，WordPress 可能会将 JavaScript 中的 `&&` 逻辑操作符转义为 HTML 实体 `&#038;&#038;`，导致 JavaScript 语法错误：

```
Uncaught SyntaxError: Invalid or unexpected token
```

## 问题原因

- WordPress 的输出过滤器会对某些字符进行 HTML 实体编码
- `&&` 操作符被转换为 `&#038;&#038;`
- 浏览器无法正确解析这些 HTML 实体作为 JavaScript 操作符
- 特别容易在使用 `wp_json_encode()` 或其他 WordPress 输出函数时发生

## 解决方案

### 方法1: 使用嵌套 if 语句（推荐）

将所有 `&&` 逻辑操作符替换为嵌套的 if 语句：

```javascript
// 问题代码
if (sellInBatch && batchQty > 0) {
    // 处理逻辑
}

// 修复后的代码
if (sellInBatch === true) {
    if (batchQty > 0) {
        // 处理逻辑
    }
}
```

### 方法2: 复杂条件的处理

对于多重条件判断：

```javascript
// 问题代码
if (discountText && discountText !== "0% OFF") {
    discountDisplayText.textContent = `Discount: ${discountText}`;
} else {
    discountDisplayText.textContent = '';
}

// 修复后的代码
if (discountText !== null) {
    if (discountText !== "0% OFF") {
        discountDisplayText.textContent = `Discount: ${discountText}`;
    } else {
        discountDisplayText.textContent = '';
    }
} else {
    discountDisplayText.textContent = '';
}
```

## 最佳实践

### 1. 避免在 PHP 嵌入的 JavaScript 中使用的操作符
- `&&` (逻辑与)
- `||` (逻辑或，可能也会被转义)
- `<` 和 `>` (在某些情况下)

### 2. 推荐的替代方案
- 使用嵌套 if 语句替代 `&&`
- 使用 if-else 结构替代 `||`
- 使用严格比较 `===` 而不是 `==`

### 3. 代码组织建议
```javascript
// 好的做法：清晰的嵌套结构
if (condition1 === true) {
    if (condition2 > 0) {
        if (condition3 !== null) {
            // 执行逻辑
        }
    }
}

// 避免：复杂的逻辑操作符链
if (condition1 && condition2 > 0 && condition3 !== null) {
    // 可能导致 HTML 实体编码问题
}
```

## 调试技巧

### 1. 检查浏览器控制台
查看是否有 "Invalid or unexpected token" 错误

### 2. 查看页面源代码
检查 JavaScript 代码中是否出现 `&#038;&#038;` 等 HTML 实体

### 3. 使用开发者工具
在 Network 面板中检查 HTML 响应，确认 JavaScript 代码的实际输出

## 预防措施

### 1. 代码审查清单
- [ ] 检查所有 PHP 文件中嵌入的 JavaScript 代码
- [ ] 确认没有使用 `&&` 或 `||` 操作符
- [ ] 验证所有逻辑条件使用嵌套 if 语句
- [ ] 测试在实际 WordPress 环境中的运行情况

### 2. 测试策略
```javascript
// 创建测试函数验证逻辑正确性
function testLogic() {
    try {
        // 测试各种条件组合
        const result1 = yourFunction(param1, param2, true, 5);
        const result2 = yourFunction(param1, param2, false, 0);
        console.log('Logic test passed:', result1, result2);
        return true;
    } catch (error) {
        console.error('Logic test failed:', error.message);
        return false;
    }
}
```

## 相关文件

本修复已应用于以下文件：
- `public/modules/class-pw-quantity-discount.php`

## 注意事项

1. **PHP 代码不受影响**: 只有嵌入在 PHP 文件中的 JavaScript 代码会受到影响
2. **外部 JS 文件安全**: 独立的 .js 文件不会有这个问题
3. **WordPress 版本差异**: 不同版本的 WordPress 可能有不同的过滤行为
4. **插件兼容性**: 某些插件可能会影响输出过滤

## 总结

通过将 `&&` 操作符替换为嵌套的 if 语句，可以完全避免 WordPress HTML 实体编码导致的 JavaScript 语法错误。这种方法不仅解决了技术问题，还提高了代码的可读性和维护性。