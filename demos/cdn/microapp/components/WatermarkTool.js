// WatermarkTool.js
// 水印工具微应用：可调整文本、颜色、不透明度、旋转角度，并支持平铺/单次两种模式
// =============================================================

export default function createWatermarkTool(mount, ctx) {
  const state = {
    text: 'CONFIDENTIAL',
    opacity: 0.45,
    rotation: -28,
    color: '#f5f7fa',
    repeat: true,
  };

  mount.innerHTML = `
    <div class="watermark-tool" data-instance="${ctx.id}">
      <div class="watermark-tool-grid">
        <label class="field">
          <span class="field-label">水印文本</span>
          <input class="field-input" type="text" data-bind="text" value="${state.text}">
        </label>
        <label class="field">
          <span class="field-label">颜色</span>
          <input class="field-color" type="color" data-bind="color" value="${state.color}">
        </label>
        <label class="field">
          <span class="field-label">不透明度 <span class="field-value" data-display="opacity">${state.opacity}</span></span>
          <input class="field-range" type="range" min="0.05" max="1" step="0.05" data-bind="opacity" value="${state.opacity}">
        </label>
        <label class="field">
          <span class="field-label">旋转 <span class="field-value" data-display="rotation">${state.rotation}°</span></span>
          <input class="field-range" type="range" min="-90" max="90" step="1" data-bind="rotation" value="${state.rotation}">
        </label>
        <label class="field field--inline">
          <input type="checkbox" data-bind="repeat" ${state.repeat ? 'checked' : ''}>
          <span>平铺重复</span>
        </label>
      </div>
      <div class="watermark-tool-stage" data-stage>
        <div class="watermark-tool-grid-overlay">
          <div class="wm-row" data-row></div>
          <div class="wm-row" data-row></div>
          <div class="wm-row" data-row></div>
          <div class="wm-row" data-row></div>
        </div>
        <div class="watermark-tool-meta">
          <span>color</span><strong data-meta-color>${state.color}</strong>
          <span>α</span><strong data-meta-opacity>${state.opacity}</strong>
          <span>θ</span><strong data-meta-rotation>${state.rotation}°</strong>
        </div>
      </div>
    </div>
  `;

  const root = mount.querySelector('.watermark-tool');
  const display = (k) => root.querySelector(`[data-display="${k}"]`);

  root.addEventListener('input', (e) => {
    const t = e.target;
    const k = t.dataset.bind;
    if (!k) return;
    if (k === 'opacity') {
      state.opacity = Number(t.value);
      display('opacity').textContent = String(state.opacity);
    } else if (k === 'rotation') {
      state.rotation = Number(t.value);
      display('rotation').textContent = `${state.rotation}°`;
    } else if (k === 'repeat') {
      state.repeat = t.checked;
    } else {
      state[k] = t.value;
    }
    render();
  });

  function render() {
    const rows = root.querySelectorAll('[data-row]');
    rows.forEach((row) => {
      row.style.color = state.color;
      row.style.opacity = state.opacity;
      row.style.transform = `rotate(${state.rotation}deg)`;
      row.style.fontFamily = 'var(--font-display)';
      row.style.fontWeight = '700';
      if (state.repeat) {
        row.style.fontSize = '20px';
        row.style.letterSpacing = '0.3em';
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.justifyContent = 'space-around';
        row.style.gap = '32px';
        const cells = [];
        for (let i = 0; i < 4; i++) cells.push(`<span>${escapeHtml(state.text)}</span>`);
        row.innerHTML = cells.join('');
      } else {
        row.style.fontSize = '40px';
        row.style.letterSpacing = '0.2em';
        row.style.display = 'grid';
        row.style.placeItems = 'center';
        row.innerHTML = `<span>${escapeHtml(state.text)}</span>`;
      }
    });
    root.querySelector('[data-meta-color]').textContent = state.color;
    root.querySelector('[data-meta-opacity]').textContent = String(state.opacity);
    root.querySelector('[data-meta-rotation]').textContent = `${state.rotation}°`;
  }

  if (!document.getElementById('watermark-tool-style')) {
    const style = document.createElement('style');
    style.id = 'watermark-tool-style';
    style.textContent = `
      .watermark-tool-grid { display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: end; }
      .watermark-tool-grid .field:nth-child(3),
      .watermark-tool-grid .field:nth-child(4) { grid-column: 1 / -1; }
      .watermark-tool-stage {
        margin-top: 20px;
        border: 1px solid var(--line);
        border-radius: 10px;
        overflow: hidden;
        position: relative;
        aspect-ratio: 16/9;
        background: linear-gradient(135deg, #1a1d24 0%, #0e0f13 100%);
      }
      .watermark-tool-grid-overlay {
        position: absolute;
        inset: 0;
        padding: 12px 0;
        display: grid;
        grid-template-rows: repeat(4, 1fr);
      }
      .wm-row { white-space: nowrap; }
      .watermark-tool-meta {
        position: absolute;
        bottom: 12px;
        right: 12px;
        display: flex;
        gap: 12px;
        font-family: var(--font-mono);
        font-size: 11px;
        padding: 6px 10px;
        background: rgba(0,0,0,0.55);
        border: 1px solid var(--line);
        border-radius: 6px;
        backdrop-filter: blur(6px);
      }
      .watermark-tool-meta span { color: var(--text-soft); margin-right: 4px; }
      .watermark-tool-meta strong { color: var(--accent); font-weight: 500; }
    `;
    document.head.appendChild(style);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  render();
  // eslint-disable-next-line no-console
  console.log(`%c[WatermarkTool]`, 'color:#7c5cff;font-weight:600', `instance ${ctx.id} mounted`);
}
