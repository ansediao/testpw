# MicroModal.js 使用规范

## 项目中的MicroModal引入
- 前台和后台都已引入 `https://unpkg.com/micromodal/dist/micromodal.min.js`
- 位置：`public/modules/class-pw-cdn-loader.php` 第62行

## 使用规范
- 所有弹窗逻辑都应使用MicroModal.js而不是自定义模态框
- MicroModal提供标准化的可访问性支持
- 遵循MicroModal的HTML结构和API规范

## 基本用法
```javascript
// 初始化
MicroModal.init();

// 显示模态框
MicroModal.show('modal-id');

// 关闭模态框
MicroModal.close('modal-id');
```

## HTML结构要求
```html
<div class="modal micromodal-slide" id="modal-id" aria-hidden="true">
  <div class="modal__overlay" tabindex="-1" data-micromodal-close>
    <div class="modal__container" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <header class="modal__header">
        <h2 class="modal__title" id="modal-title">Modal Title</h2>
        <button class="modal__close" aria-label="Close modal" data-micromodal-close></button>
      </header>
      <main class="modal__content">
        <!-- Modal content -->
      </main>
    </div>
  </div>
</div>
```