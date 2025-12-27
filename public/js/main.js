/**
 * public/js/main.js
 *
 * 兼容入口（Legacy entry）。
 *
 * 实际业务逻辑已经按“高内聚、低耦合”拆分到：
 *
 *   public/js/main/core-init.js        - 全局状态、Tab 切换、画布初始化入口
 *   public/js/main/events.js           - Fabric 事件绑定
 *   public/js/main/layers-sync.js      - 图层面板与 Pinia 同步、mask 控制、clipPath
 *   public/js/main/preview.js          - 预览与弧形文字逻辑
 *   public/js/main/color-utils.js      - 颜色选择工具
 *   public/js/main/capture.js          - 多层 Canvas 截图与 PDF 支持
 *   public/js/main/image-analyze.js    - 位图分析（非透明区域高度、边距等）
 *   public/js/main/grid-preview.js     - 四视图/多视图预览图生成与窗口效果
 *   public/js/main/universal-preview.js- 多视图预览弹窗
 *
 * 当前官方模板（public/partials/template-canvas-display.php）
 * 已直接按模块方式加载上述脚本，本文件仅保留为兼容入口：
 *
 *   - 防止旧文档或外部模板中对 js/main.js 的引用返回 404
 *   - 不再包含任何业务逻辑，不会主动注入其它脚本
 *
 * 如需修改功能或排查问题，请直接查看对应模块文件。
 */

// 为可能的旧环境提供一个非常轻量的控制台提示，避免静默失败。
// 如果你不希望有任何输出，可以删除下面这一段。
(function () {
    if (typeof window !== 'undefined') {
        var loggedFlag = '__PW_MAIN_JS_LEGACY_ENTRY_LOGGED__';
        if (!window[loggedFlag]) {
            window[loggedFlag] = true;
            if (window.console && typeof window.console.info === 'function') {
                console.info('[pwcanvas] public/js/main.js 已迁移为兼容入口，实际逻辑位于 public/js/main/*.js。');
            }
        }
    }
})();