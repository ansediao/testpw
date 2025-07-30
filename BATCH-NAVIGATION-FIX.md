# 批量销售数量导航修复

## 问题描述

用户报告了一个关于增减按钮行为的问题：

**场景**: 起订量100，步进50
- 用户输入120
- 点击+按钮，期望到150，实际到了200
- 点击-按钮，期望到100，实际数值没有变化

## 问题分析

原来的增减按钮逻辑有以下问题：

1. **简单加减步进值**: 只是简单地加减`stepQuantity`，没有考虑当前数量是否已经是有效批次
2. **不正确的减少逻辑**: 当数量已经是有效批次时，减少操作可能不会改变数量
3. **缺乏最近值查找**: 没有找到最近的有效批次值

## 解决方案

### 1. 新增智能导航方法

在`productStore.js`中添加了两个新方法：

#### `getNextValidQuantity(currentQty)`
```javascript
const getNextValidQuantity = (currentQty) => {
    const minQty = minQuantity.value;
    const batchQty = stepQuantity.value;
    const sellInBatch = moqSettings.value.sell_in_batch;

    if (sellInBatch !== true || batchQty <= 1) {
        return currentQty + 1;
    }

    // 如果当前数量已经是有效批次，返回下一个批次
    const corrected = correctedQuantity.value(currentQty);
    if (corrected === currentQty) {
        return currentQty + batchQty;
    }

    // 如果当前数量不是有效批次，返回修正后的数量
    return corrected;
};
```

#### `getPreviousValidQuantity(currentQty)`
```javascript
const getPreviousValidQuantity = (currentQty) => {
    const minQty = minQuantity.value;
    const batchQty = stepQuantity.value;
    const sellInBatch = moqSettings.value.sell_in_batch;

    if (sellInBatch !== true || batchQty <= 1) {
        return Math.max(minQty, currentQty - 1);
    }

    // 如果当前数量已经是有效批次
    const corrected = correctedQuantity.value(currentQty);
    if (corrected === currentQty) {
        // 计算上一个批次
        const previousBatch = currentQty - batchQty;
        return Math.max(minQty, previousBatch);
    }

    // 如果当前数量不是有效批次，找到当前数量之下最近的有效批次
    if (currentQty <= minQty) {
        return minQty;
    }

    // 计算当前数量对应的批次索引，然后减1
    const excessQuantity = currentQty - minQty;
    const batchIndex = Math.floor(excessQuantity / batchQty);
    const previousBatchQuantity = minQty + (batchIndex * batchQty);
    
    return Math.max(minQty, previousBatchQuantity);
};
```

### 2. 更新组件逻辑

在`ProductQuantity.js`中更新了增减按钮的逻辑：

```javascript
const increaseQuantity = () => {
    const nextQuantity = store.getNextValidQuantity(store.quantity);
    if (nextQuantity <= store.maxQuantity) {
        store.setQuantityDirect(nextQuantity);
    }
};

const decreaseQuantity = () => {
    const previousQuantity = store.getPreviousValidQuantity(store.quantity);
    if (previousQuantity >= store.minQuantity) {
        store.setQuantityDirect(previousQuantity);
    }
};
```

## 修复验证

### 测试场景：起订量100，步进50

| 输入数量 | 点击+ | 点击- | 说明 |
|---------|-------|-------|------|
| 120 | 150 | 100 | 120不是有效批次，+到下一个有效批次150，-到上一个有效批次100 |
| 100 | 150 | 100 | 100是有效批次，+到下一批次150，-保持在最小值100 |
| 150 | 200 | 100 | 150是有效批次，+到下一批次200，-到上一批次100 |
| 175 | 200 | 150 | 175不是有效批次，+到下一个有效批次200，-到上一个有效批次150 |

### 算法逻辑

#### 增加操作逻辑：
1. 如果当前数量已经是有效批次 → 返回 `当前数量 + 步进值`
2. 如果当前数量不是有效批次 → 返回修正后的数量（向上调整到下一个批次）

#### 减少操作逻辑：
1. 如果当前数量已经是有效批次 → 返回 `当前数量 - 步进值`（但不低于最小值）
2. 如果当前数量不是有效批次 → 计算当前数量之下最近的有效批次

## 测试工具

### 1. 专门的导航测试
创建了`test-batch-navigation.js`文件，包含：
- 多种场景的测试用例
- 专门针对报告问题的测试
- 自动化验证结果

### 2. 可视化演示
在`batch-quantity-demo.html`中添加了场景4：
- 起订量100，步进50
- 初始值设为120来演示问题
- 包含详细的测试说明

### 3. 使用方法
```javascript
// 在浏览器控制台中运行
runNavigationTests();        // 完整的导航测试
testSpecificIssue();         // 测试具体报告的问题
```

## 修复前后对比

### 修复前（问题行为）：
```
输入120 → 点击+ → 120 + 50 = 170 → 修正到200 ❌
输入120 → 点击- → 120 - 50 = 70 → 修正到100，但逻辑复杂 ❌
```

### 修复后（正确行为）：
```
输入120 → 点击+ → 找到下一个有效批次 = 150 ✅
输入120 → 点击- → 找到上一个有效批次 = 100 ✅
```

## 核心改进

1. **智能导航**: 不再简单加减步进值，而是智能找到最近的有效批次
2. **状态感知**: 区分当前数量是否已经是有效批次，采用不同策略
3. **精确计算**: 使用数学计算找到准确的上一个/下一个批次
4. **边界处理**: 正确处理最小值和最大值的边界情况

## 兼容性

- ✅ 保持与现有API的兼容性
- ✅ 不影响输入框的自由输入行为
- ✅ 保持与非批次销售产品的兼容性
- ✅ 向后兼容所有现有功能

## 总结

这个修复解决了用户报告的具体问题，让增减按钮能够智能地找到最近的有效批次值，而不是简单地加减步进值。现在的行为更加直观和用户友好：

- **输入120，点击+ → 150** ✅
- **输入120，点击- → 100** ✅

用户现在可以自由输入任何数量，然后通过+/-按钮快速调整到最近的有效批次，提供了最佳的用户体验。