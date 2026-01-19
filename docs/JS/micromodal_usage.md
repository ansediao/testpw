# 弹窗（Modal）使用规范（MicroModal 已移除）

## 当前实现概览

项目中已完全移除第三方 MicroModal.js，统一采用以下方案：

- **结构**：继续使用统一的 HTML 结构和 BEM 类名（`modal` / `modal__overlay` / `modal__container` 等）
- **样式**：通过 `.modal`、`.micromodal-slide`、`.is-open` 等类控制显示和动画
- **行为**：
  - 前台 Canvas、前台产品页：主要由 Vue 组件管理弹窗显隐
  - 后台 Design Library：使用原生 JS 辅助函数控制弹窗

核心原则：**通过切换 `.is-open` 类和 `aria-hidden` 属性来控制弹窗开关**，不再依赖外部库。

---

## 统一 HTML 结构

所有弹窗应遵循以下结构，以便样式复用：

```html
<div class="modal micromodal-slide" id="modal-id" aria-hidden="true">
  <div class="modal__overlay" tabindex="-1" data-micromodal-close>
    <div
      class="modal__container"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <header class="modal__header">
        <h2 class="modal__title" id="modal-title">Modal Title</h2>
        <button
          class="modal__close"
          aria-label="Close modal"
          data-micromodal-close
        ></button>
      </header>
      <main class="modal__content">
        <!-- Modal content -->
      </main>
      <footer class="modal__footer">
        <!-- Footer buttons -->
      </footer>
    </div>
  </div>
</div>
```

说明：

- `data-micromodal-close` 仍然保留作为「可关闭触发器」的统一标记（方便 JS 事件委托）
- `.micromodal-slide` 仅作为历史命名保留，用于沿用现有 CSS 动画

---

## 行为约定：如何打开 / 关闭弹窗

### 1. Vue 组件内（推荐）

在 Vue 组件中通过响应式状态控制：

```js
const isModalOpen = Vue.ref(false);

const openModal = () => {
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
};
```

模板示例：

```html
<div
  id="example-modal"
  :class="['modal', 'micromodal-slide', { 'is-open': isModalOpen }]"
  :aria-hidden="!isModalOpen"
>
  <div
    class="modal__overlay"
    tabindex="-1"
    data-micromodal-close
    @click.self="closeModal"
  >
    <div class="modal__container" role="dialog" aria-modal="true">
      <header class="modal__header">
        <h2 class="modal__title">Title</h2>
        <button
          class="modal__close"
          aria-label="Close modal"
          data-micromodal-close
          @click="closeModal"
        ></button>
      </header>
      <main class="modal__content">
        <!-- ... -->
      </main>
    </div>
  </div>
</div>
```

要点：

- 根节点通过 `:class` 切换 `.is-open`
- `:aria-hidden` 随状态同步（`true` 表示隐藏）
- 遮罩层使用 `@click.self` 只在点击空白处时关闭
- 关闭按钮统一绑定 `@click="closeModal"` 并保留 `data-micromodal-close` 标记

---

### 2. 纯 JavaScript 环境（非 Vue）

例如后台 Design Library / Canvas 询价弹窗：

```js
const modal = document.getElementById('modal-id');

function openModal() {
  if (!modal) return;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}
```

使用事件委托统一处理关闭：

```js
document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-micromodal-close]');
  if (!trigger) return;
  const modal = trigger.closest('.modal');
  if (!modal || !modal.id) return;
  // 根据具体实现调用 closeModal(modal.id) 或对应关闭函数
});
```

并支持 ESC 关闭：

```js
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    // 根据当前打开的弹窗调用对应关闭函数
  }
});
```

---

## 样式约定（关键类）

- `.modal`：基础容器，默认 `display: none`
- `.modal.is-open`：显示弹窗
- `.modal__overlay`：全屏遮罩层
- `.modal__container`：内容容器，控制宽高、阴影、圆角等
- 后台 / 前台都有各自的细化样式文件，例如：
  - `modules/admin_design/assets/scss/pwca-admin-design-micromodal.scss`
  - `modules/front_canvas/assets/scss/pwca-inquiry-modal.scss`
  - `modules/front_canvas/assets/scss/pwca-print-method-modal.scss`
  - `modules/front_product/assets/scss/pw-gradient-modal.scss`

---

## 新开发弹窗的参考文件

- **后台 Design Library**
  - HTML：`modules/admin_design/views/design-library.php`
  - JS 行为：`modules/admin_design/assets/js/pwca-admin-design-modals.js`
  - 样式：`modules/admin_design/assets/scss/pwca-admin-design-micromodal.scss`

- **前台 Canvas**
  - 询价弹窗：`modules/front_canvas/views/partials/canvas-operation-panel-inquiry-modal.php`
  - 印刷方式弹窗（Vue）：  
    `modules/front_canvas/assets/js/design/components/layer-modals.js`  
    `modules/front_canvas/assets/js/design/components/layers.js`

- **前台产品页**
  - 渐变 / 自定义颜色弹窗（Vue）：  
    `modules/front_product/views/partials/pwca-gradient-modal.php`  
    `modules/front_product/assets/js/product/components/CustomColorsButton.js`

---

## 总结

- 不再使用 `MicroModal.init/show/close`，一律通过：
  - Vue 组件：`ref + :class="{ 'is-open': ... }"`
  - 原生 JS：`classList` + `aria-hidden` 控制
- 继续沿用统一的弹窗 HTML 结构和命名，以保证样式和行为一致
- 关闭触发器统一使用 `data-micromodal-close` 标记，便于事件委托和复用
