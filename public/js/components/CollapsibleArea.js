export default {
    data() {
      return {
        isExpanded: true,
        content: '可展开区域组件',
      };
    },
    template: `
          <div class="customization-area">
    <h3>图层面板</h3>
    <div class="layers-panel">
      <div class="layers-header">
        <span class="layer-column layer-visibility">显示</span>
        <span class="layer-column layer-lock">锁定</span>
        <span class="layer-column layer-name">名称</span>
      </div>
      <div id="layers-container" class="layers-container">
        <!-- 图层将在这里动态添加 -->
      </div>
    </div>
  </div>`,
  };
  