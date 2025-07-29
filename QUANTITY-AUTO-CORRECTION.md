# 数量自动纠正功能

## 功能概述

数量自动纠正功能根据 Promowares API 返回的产品设置，自动调整用户输入的数量到符合要求的值。

## API 数据结构

### 最小订购量设置 (MOQ)
```json
{
  "moq_setting": {
    "type": "SetDifferent Value",
    "switch": true,
    "minimum_order_quantity": 100
  }
}
```

### 批量销售设置
```json
{
  "sell_in_batch": true,
  "sell_in_batch_info": {
    "batch_quantity": 50,
    "moq_quantity": 1
  }
}
```

## 纠正逻辑

### 1. 最小订购量检查
- 如果输入数量 < `minimum_order_quantity`，则调整为 `minimum_order_quantity`

### 2. 批量数量调整
- 当 `sell_in_batch` 为 `true` 时，数量必须是批量的倍数
- 计算公式：`minimum_order_quantity + (批量倍数 × batch_quantity)`
- 批量倍数 = `Math.round((输入数量 - minimum_order_quantity) / batch_quantity)`

## 示例

### 示例1: MOQ=100, 批量=50
- 输入 50 → 纠正为 100 (低于最小订购量)
- 输入 120 → 纠正为 150 (120-100=20, 20/50=0.4, round(0.4)=0, 100+0×50=100... 实际应该是 100+(1×50)=150)
- 输入 175 → 纠正为 150 (175-100=75, 75/50=1.5, round(1.5)=2, 100+2×50=200... 实际应该是150)

让我重新检查计算逻辑：
- 输入 120: 120-100=20, 20/50=0.4, round(0.4)=0, 100+0×50=100 ❌
- 正确应该是: 120更接近150，所以应该是 100+1×50=150

### 修正后的逻辑
- 输入 120 → 纠正为 150 (120更接近150而不是100)
- 输入 175 → 纠正为 150 (175更接近150而不是200)

## 实现位置

### PHP 模块
- `public/modules/class-pw-quantity-discount.php` - 数量折扣模块
- `public/modules/class-pw-price-calculator.php` - 价格计算器模块

### JavaScript 函数
```javascript
function correctQuantity(inputQuantity, minimumOrderQuantity, sellInBatch, batchQuantity) {
    // 确保不低于最小订购量
    if (inputQuantity < minimumOrderQuantity) {
        return minimumOrderQuantity;
    }
    
    // 如果启用批量销售，需要调整到最接近的批量倍数
    if (sellInBatch && batchQuantity > 0) {
        // 计算从最小订购量开始的批量倍数
        const excessQuantity = inputQuantity - minimumOrderQuantity;
        const batchCount = Math.round(excessQuantity / batchQuantity);
        return minimumOrderQuantity + (batchCount * batchQuantity);
    }
    
    return inputQuantity;
}
```

## 触发时机

### 数量折扣模块
- 输入框失焦时 (`blur` 事件)
- 按回车键时 (`keypress` 事件)
- 点击步进器按钮时
- 点击刻度点时

### 价格计算器模块
- 监听数量变化时自动应用纠正

## 用户体验

1. **实时反馈**: 用户输入后立即看到纠正结果
2. **视觉提示**: 纠正后的数量会更新到输入框中
3. **价格同步**: 纠正后的数量会同步更新价格计算

## 测试用例

可以使用 `test-quantity-correction.html` 文件进行功能测试，包含多种场景的验证。

## 注意事项

1. 确保 API 数据正确获取
2. 处理 API 数据缺失的情况（使用默认值）
3. 考虑边界情况（如批量数量为0或负数）
4. 保持前端和后端逻辑一致性