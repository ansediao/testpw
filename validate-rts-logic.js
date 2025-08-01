// 验证 RTS Date 计算逻辑
function calculateEstimatedShipDate(rts_date_starts_from, rts_for_bulk_order, rts_for_sample_order, buySampleChecked) {
    const currentDate = new Date();
    let totalDays = rts_date_starts_from;
    
    if (buySampleChecked) {
        totalDays += rts_for_sample_order;
    } else {
        totalDays += rts_for_bulk_order;
    }
    
    const shipDate = new Date(currentDate);
    shipDate.setDate(currentDate.getDate() + totalDays);
    
    const month = String(shipDate.getMonth() + 1).padStart(2, '0');
    const day = String(shipDate.getDate()).padStart(2, '0');
    const year = shipDate.getFullYear();
    
    return `${month}/${day}/${year}`;
}

// 测试用例
console.log('=== RTS Date 计算逻辑验证 ===');
console.log('当前日期:', new Date().toLocaleDateString());
console.log('');

// 测试用例 1: 批量订单
const bulkOrderDate = calculateEstimatedShipDate(3, 2, 1, false);
console.log('批量订单 (3 + 2 天):', bulkOrderDate);

// 测试用例 2: 样品订单
const sampleOrderDate = calculateEstimatedShipDate(3, 2, 1, true);
console.log('样品订单 (3 + 1 天):', sampleOrderDate);

// 测试用例 3: 自定义参数
const customDate1 = calculateEstimatedShipDate(5, 3, 2, false);
console.log('自定义批量订单 (5 + 3 天):', customDate1);

const customDate2 = calculateEstimatedShipDate(5, 3, 2, true);
console.log('自定义样品订单 (5 + 2 天):', customDate2);

console.log('');
console.log('=== 验证完成 ===');