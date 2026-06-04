// TextTool.js
// 文字工具微应用：导出工厂函数，由 main.js 在动态 import() 后挂载到指定节点
// =============================================================

export default function createTextTool(mount, ctx) {
  const state = {
    text: 'Hello Microapp',
    size: 40,
    color: '#7c5cff',
    weight: 600,
  };

  mount.innerHTML = `
    <div class="text-tool" data-instance="${ctx.id}">
      <div class="text-tool-grid">
        <label class="field">
          <span class="field-label">文本内容</span>
          <input class="field-input" type="text" data-bind="text" value="${state.text}">
        </label>
        <label class="field">
          <span class="field-label">颜色</span>
          <input class="field-color" type="color" data-bind="color" value="${state.color}">
        </label>
        <label class="field">
          <span class="field-label">字号 <span class="field-value" data-display="size">${state.size}px</span></span>
          <input class="field-range" type="range" min="12" max="96" step="1" data-bind="size" value="${state.size}">
        </label>
        <label class="field">
          <span class="field-label">字重 <span class="field-value" data-display="weight">${state.weight}</span></span>
          <input class="field-range" type="range" min="300" max="900" step="100" data-bind="weight" value="${state.weight}">
        </label>
      </div>
      <div class="text-tool-preview" data-preview>
        <span data-preview-text>${state.text}</span>
      </div>
    </div>
  `;

  const root = mount.querySelector('.text-tool');
  const previewText = root.querySelector('[data-preview-text]');
  const display = (k) => root.querySelector(`[data-display="${k}"]`);

  root.addEventListener('input', (e) => {
    const t = e.target;
    const k = t.dataset.bind;
    if (!k) return;
    if (k === 'size') {
      state.size = Number(t.value);
      display('size').textContent = `${state.size}px`;
    } else if (k === 'weight') {
      state.weight = Number(t.value);
      display('weight').textContent = String(state.weight);
    } else {
      state[k] = t.value;
    }
    render();
  });

  function render() {
    previewText.textContent = state.text;
    previewText.style.fontSize = `${state.size}px`;
    previewText.style.color = state.color;
    previewText.style.fontWeight = String(state.weight);
  }

  // 模块局部样式（仅注入一次）
  if (!document.getElementById('text-tool-style')) {
    const style = document.createElement('style');
    style.id = 'text-tool-style';
    style.textContent = `
      .text-tool-grid { display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: end; }
      .text-tool-grid .field:nth-child(3),
      .text-tool-grid .field:nth-child(4) { grid-column: 1 / -1; }
      .text-tool-preview {
        margin-top: 20px;
        padding: 36px;
        background: var(--bg);
        border: 1px solid var(--line);
        border-radius: 10px;
        min-height: 120px;
        display: grid;
        place-items: center;
        overflow: hidden;
      }
      .text-tool-preview span {
        font-family: var(--font-display);
        line-height: 1.1;
        letter-spacing: -0.01em;
        word-break: break-word;
        text-align: center;
      }
    `;
    document.head.appendChild(style);
  }

  render();
  // eslint-disable-next-line no-console
  console.log(`%c[TextTool]`, 'color:#7c5cff;font-weight:600', `instance ${ctx.id} mounted`);
}
