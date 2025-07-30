/**
 * 批量销售数量导航测试
 * 专门测试增减按钮的正确行为
 */

// 测试用例
const navigationTestCases = [
    {
        name: "起订量100，步进50 - 输入120的情况",
        settings: {
            sell_in_batch: true,
            batch_quantity: 50,
            moq_quantity: 100
        },
        tests: [
            {
                input: 120,
                expectedNext: 150,
                expectedPrevious: 100,
                description: "输入120，+应该到150，-应该到100"
            },
            {
                input: 100,
                expectedNext: 150,
                expectedPrevious: 100,
                description: "输入100（有效批次），+应该到150，-应该保持100"
            },
            {
                input: 150,
                expectedNext: 200,
                expectedPrevious: 100,
                description: "输入150（有效批次），+应该到200，-应该到100"
            },
            {
                input: 175,
                expectedNext: 200,
                expectedPrevious: 150,
                description: "输入175，+应该到200，-应该到150"
            }
        ]
    },
    {
        name: "起订量10，步进25的情况",
        settings: {
            sell_in_batch: true,
            batch_quantity: 25,
            moq_quantity: 10
        },
        tests: [
            {
                input: 20,
                expectedNext: 35,
                expectedPrevious: 10,
                description: "输入20，+应该到35，-应该到10"
            },
            {
                input: 35,
                expectedNext: 60,
                expectedPrevious: 10,
                description: "输入35（有效批次），+应该到60，-应该到10"
            },
            {
                input: 45,
                expectedNext: 60,
                expectedPrevious: 35,
                description: "输入45，+应该到60，-应该到35"
            }
        ]
    },
    {
        name: "不按批次销售的情况",
        settings: {
            sell_in_batch: false,
            batch_quantity: 50,
            moq_quantity: 1
        },
        tests: [
            {
                input: 5,
                expectedNext: 6,
                expectedPrevious: 4,
                description: "不按批次销售，+1，-1"
            },
            {
                input: 1,
                expectedNext: 2,
                expectedPrevious: 1,
                description: "最小值1，+应该到2，-应该保持1"
            }
        ]
    }
];

// 复制核心逻辑函数
function correctQuantity(inputQuantity, sellInBatch, batchQuantity, minQuantity) {
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

function getNextValidQuantity(currentQty, settings) {
    const { sell_in_batch, batch_quantity, moq_quantity } = settings;
    
    if (sell_in_batch !== true || batch_quantity <= 1) {
        return currentQty + 1;
    }

    // 如果当前数量已经是有效批次，返回下一个批次
    const corrected = correctQuantity(currentQty, sell_in_batch, batch_quantity, moq_quantity);
    if (corrected === currentQty) {
        return currentQty + batch_quantity;
    }

    // 如果当前数量不是有效批次，返回修正后的数量
    return corrected;
}

function getPreviousValidQuantity(currentQty, settings) {
    const { sell_in_batch, batch_quantity, moq_quantity } = settings;
    
    if (sell_in_batch !== true || batch_quantity <= 1) {
        return Math.max(moq_quantity, currentQty - 1);
    }

    // 如果当前数量已经是有效批次
    const corrected = correctQuantity(currentQty, sell_in_batch, batch_quantity, moq_quantity);
    if (corrected === currentQty) {
        // 计算上一个批次
        const previousBatch = currentQty - batch_quantity;
        return Math.max(moq_quantity, previousBatch);
    }

    // 如果当前数量不是有效批次，找到当前数量之下最近的有效批次
    if (currentQty <= moq_quantity) {
        return moq_quantity;
    }

    // 计算当前数量对应的批次索引，然后减1
    const excessQuantity = currentQty - moq_quantity;
    const batchIndex = Math.floor(excessQuantity / batch_quantity);
    const previousBatchQuantity = moq_quantity + (batchIndex * batch_quantity);
    
    return Math.max(moq_quantity, previousBatchQuantity);
}

// 运行测试
function runNavigationTests() {
    console.log('=== 批量销售数量导航测试 ===\n');
    
    let totalTests = 0;
    let passedTests = 0;
    
    navigationTestCases.forEach((testCase, caseIndex) => {
        console.log(`测试组 ${caseIndex + 1}: ${testCase.name}`);
        console.log('设置:', testCase.settings);
        console.log('');
        
        testCase.tests.forEach((test, testIndex) => {
            totalTests += 2; // 每个测试包含+和-两个操作
            
            console.log(`  测试 ${testIndex + 1}: ${test.description}`);
            console.log(`  输入数量: ${test.input}`);
            
            // 测试增加操作
            const actualNext = getNextValidQuantity(test.input, testCase.settings);
            const nextPassed = actualNext === test.expectedNext;
            if (nextPassed) passedTests++;
            
            console.log(`  增加操作: 预期 ${test.expectedNext}, 实际 ${actualNext} ${nextPassed ? '✓' : '✗'}`);
            
            // 测试减少操作
            const actualPrevious = getPreviousValidQuantity(test.input, testCase.settings);
            const previousPassed = actualPrevious === test.expectedPrevious;
            if (previousPassed) passedTests++;
            
            console.log(`  减少操作: 预期 ${test.expectedPrevious}, 实际 ${actualPrevious} ${previousPassed ? '✓' : '✗'}`);
            
            if (!nextPassed || !previousPassed) {
                console.log(`  ❌ 测试失败！`);
            } else {
                console.log(`  ✅ 测试通过`);
            }
            console.log('');
        });
        
        console.log('---\n');
    });
    
    console.log(`测试总结: ${passedTests}/${totalTests} 通过 (${Math.round(passedTests/totalTests*100)}%)`);
    
    if (passedTests === totalTests) {
        console.log('🎉 所有测试通过！');
    } else {
        console.log('⚠️ 部分测试失败，需要修复');
    }
}

// 专门测试你提到的问题
function testSpecificIssue() {
    console.log('\n=== 专门测试：起订量100，步进50，输入120的问题 ===');
    
    const settings = {
        sell_in_batch: true,
        batch_quantity: 50,
        moq_quantity: 100
    };
    
    const input = 120;
    
    console.log(`设置: 起订量${settings.moq_quantity}, 步进${settings.batch_quantity}`);
    console.log(`输入数量: ${input}`);
    
    // 检查修正后的数量
    const corrected = correctQuantity(input, settings.sell_in_batch, settings.batch_quantity, settings.moq_quantity);
    console.log(`修正后数量: ${corrected}`);
    
    // 测试增加
    const nextQty = getNextValidQuantity(input, settings);
    console.log(`点击+按钮: ${input} -> ${nextQty} (预期: 150)`);
    
    // 测试减少
    const prevQty = getPreviousValidQuantity(input, settings);
    console.log(`点击-按钮: ${input} -> ${prevQty} (预期: 100)`);
    
    // 验证结果
    const increaseCorrect = nextQty === 150;
    const decreaseCorrect = prevQty === 100;
    
    console.log(`\n结果验证:`);
    console.log(`增加操作: ${increaseCorrect ? '✅ 正确' : '❌ 错误'}`);
    console.log(`减少操作: ${decreaseCorrect ? '✅ 正确' : '❌ 错误'}`);
    
    if (increaseCorrect && decreaseCorrect) {
        console.log('🎉 问题已修复！');
    } else {
        console.log('⚠️ 问题仍然存在');
    }
}

// 如果在浏览器环境中，自动运行测试
if (typeof window !== 'undefined') {
    window.runNavigationTests = runNavigationTests;
    window.testSpecificIssue = testSpecificIssue;
    console.log('批量销售导航测试已加载');
    console.log('运行 runNavigationTests() 进行完整测试');
    console.log('运行 testSpecificIssue() 测试具体问题');
}

// 如果在 Node.js 环境中，直接运行测试
if (typeof module !== 'undefined' && module.exports) {
    runNavigationTests();
    testSpecificIssue();
}