## Why

当前自定义结算页面的运输方式计算功能存在用户体验问题：
1. Calculate Shipping 按钮位置不够合理，位于不显眼的位置
2. 点击后只显示默认的第一个运输方式，没有给用户选择的机会
3. 缺少 API 通信结果的透明展示，用户无法了解运输选项的详细信息

需要优化结算页面的运输方式选择体验，提升用户在结算过程中的决策透明度和便利性。

## What Changes

- **界面布局调整**: 将 Calculate Shipping 按钮移动到 Order notes 字段下方，使其更加显眼和符合用户操作流程
- **运输方式展示优化**: 点击 Calculate Shipping 后，以表格形式展示所有可用的运输方式，而非仅显示默认选项
- **用户选择机制**: 默认选中第一个运输方式，但允许用户选择其他可用的运输选项
- **API 结果透明化**: 清晰展示 API 通信返回的所有运输方式信息，包括费用、时效等关键信息

## Impact

- **受影响的规格**: checkout 功能规格
- **受影响的代码**:
  - `public/css/pwca-custom-checkout.scss` - 调整按钮位置和表格样式
  - `public/partials/` - 结算页面模板文件
  - `public/js/` - 前端交互逻辑和 API 调用
  - `includes/class-pw-admin-promowares-api.php` - 运输方式 API 集成
- **破坏性变更**: 无，保持向后兼容
- **用户体验**: 提升结算页面的可用性和透明度