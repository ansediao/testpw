/**
 * 批量销售数量控制测试
 * 用于验证 sell_in_batch 和 batch_quantity 的处理逻辑
 */

// 模拟测试数据
const testCases = [
    {
        name: "不按批次销售",
        data: {
            sell_in_batch: false,
            sell_in_batch_info: {
                batch_quantity: 50,
                moq_quantity: 1
            }
        },
        expected: {
            stepQuantity: 1,
            minQuantity: 1
        }
    },
    {
        name: "按批次销售 - 批次50",
        data: {
            sell_in_batch: true,
            sell_in_batch_info: {
                batch_quantity: 50,
                moq_quantity: 1
            }
        },
        expected: {
            stepQuantity: 50,
            minQuantity: 1
        }
    },
    {
        name: "按批次销售 - 批次25，最小数量10",
        data: {
            sell_in_batch: true,
            sell_in_batch_info: {
                batch_quantity: 25,
                moq_quantity: 10
            }
        },
        expected: {
            stepQuantity: 25,
            minQuantity: 10
        }
    }
];

// 测试数量修正逻辑
function testQuantityCorrection(sellInBatch, batchQuantity, minQuantity, inputQuantity) {
    // 模拟 correctedQuantity 逻辑
    if (inputQuantity < minQuantity) {
        return minQuantity;
    }

    if (sellInBatch === true && batchQuantity > 1) {
        const excessQuantity = inputQuantity - minQuantity;
        const remainder = excessQuantity % batchQuantity;
        
        if (remainder !== 0) {
            return inputQuantity - remainder + batchQuantity;
        }
    }

    return inputQuantity;
}

// 运行测试
function runTests() {
    console.log('=== 批量销售数量控制测试 ===');
    
    testCases.forEach((testCase, index) => {
        console.log(`\n测试 ${index + 1}: ${testCase.name}`);
        console.log('输入数据:', testCase.data);
        
        const { sell_in_batch, sell_in_batch_info } = testCase.data;
        const stepQuantity = sell_in_batch === true ? sell_in_batch_info.batch_quantity : 1;
        const minQuantity = sell_in_batch_info.moq_quantity;
        
        console.log(`预期步进值: ${testCase.expected.stepQuantity}, 实际: ${stepQuantity}`);
        console.log(`预期最小值: ${testCase.expected.minQuantity}, 实际: ${minQuantity}`);
        
        // 测试数量修正
        const testQuantities = [1, 15, 25, 30, 50, 75, 100];
        console.log('数量修正测试:');
        
        testQuantities.forEach(qty => {
            const corrected = testQuantityCorrection(
                sell_in_batch, 
                sell_in_batch_info.batch_quantity, 
                minQuantity, 
                qty
            );
            const needsCorrection = corrected !== qty;
            console.log(`  输入: ${qty} -> 修正: ${corrected} ${needsCorrection ? '(需要修正)' : '(无需修正)'}`);
        });
    });
    
    console.log('\n=== 新的输入行为测试 ===');
    console.log('现在用户可以在输入框中输入任意数量，只有点击+/-按钮时才会自动修正');
    console.log('例如：用户输入75，显示建议数量101，点击+按钮后自动调整到101');
}

// 如果在浏览器环境中，自动运行测试
if (typeof window !== 'undefined') {
    window.testBatchQuantity = runTests;
    console.log('批量销售测试已加载，运行 testBatchQuantity() 开始测试');
    console.log('另外可以运行 runNavigationTests() 测试增减按钮行为');
}

// 如果在 Node.js 环境中，直接运行测试
if (typeof module !== 'undefined' && module.exports) {
    runTests();
}