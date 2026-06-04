// PrintAreaTool.js
// 印刷区工具微应用：可调整矩形的位置 / 尺寸 / 颜色 / 标签，模拟画布上的印刷区域
// =============================================================

export default function createPrintAreaTool(mount, ctx) {
  const state = {
    x: 80,
    y: 60,
    w: 280,
    h: 180,
    color: '#7c5cff',
    label: 'A1',
  };

  mount.innerHTML = `
    <div class="print-tool" data-instance="${ctx.id}">
      <div class="print-tool-grid">
        <label class="field">
          <span class="field-label">X <span class="field-value" data-display="x">${state.x}</span></span>
          <input class="field-range" type="range" min="0" max="640" data-bind="x" value="${state.x}">
        </label>
        <label class="field">
          <span class="field-label">Y <span class="field-value" data-display="y">${state.y}</span></span>
          <input class="field-range" type="range" min="0" max="400" data-bind="y" value="${state.y}">
        </label>
        <label class="field">
          <span class="field-label">W <span class="field-value" data-display="w">${state.w}</span></span>
          <input class="field-range" type="range" min="40" max="640" data-bind="w" value="${state.w}">
        </label>
        <label class="field">
          <span class="field-label">H <span class="field-value" data-display="h">${state.h}</span></span>
          <input class="field-range" type="range" min="40" max="400" data-bind="h" value="${state.h}">
        </label>
        <label class="field">
          <span class="field-label">颜色</span>
          <input class="field-color" type="color" data-bind="color" value="${state.color}">
        </label>
        <label class="field">
          <span class="field-label">标签</span>
          <input class="field-input" type="text" data-bind="label" value="${state.label}">
        </label>
      </div>
      <div class="print-tool-stage" data-stage>
        <div class="print-tool-zone" data-zone>
          <span class="print-tool-label" data-label>${state.label}</span>
          <span class="print-tool-handle print-tool-handle--tl"></span>
          <span class="print-tool-handle print-tool-handle--tr"></span>
          <span class="print-tool-handle print-tool-handle--bl"></span>
          <span class="print-tool-handle print-tool-handle--br"></span>
        </div>
        <div class="print-tool-info">
          <span>pos</span><strong data-info-pos>${state.x}, ${state.y}</strong>
          <span>size</span><strong data-info-size>${state.w} × ${state.h}</strong>
        </div>
      </div>
    </div>
  `;

  const root = mount.querySelector('.print-tool');
  const zone = root.querySelector('[data-zone]');
  const labelEl = root.querySelector('[data-label]');
  const display = (k) => root.querySelector(`[data-display="${k}"]`);

  root.addEventListener('input', (e) => {
    const t = e.target;
    const k = t.dataset.bind;
    if (!k) return;
    state[k] = t.type === 'range' ? Number(t.value) : t.value;
    if (k === 'x' || k === 'y' || k === 'w' || k === 'h') {
      display(k).textContent = String(state[k]);
    }
    render();
  });

  // 简易拖拽：拖动矩形改变 x/y
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startZoneX = 0;
  let startZoneY = 0;
  zone.addEventListener('pointerdown', (e) => {
    if (e.target.classList.contains('print-tool-handle')) return;
    dragging = true;
    zone.setPointerCapture(e.pointerId);
    startX = e.clientX;
    startY = e.clientY;
    startZoneX = state.x;
    startZoneY = state.y;
  });
  zone.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    state.x = clamp(startZoneX + dx, 0, 640 - state.w);
    state.y = clamp(startZoneY + dy, 0, 400 - state.h);
    display('x').textContent = String(state.x);
    display('y').textContent = String(state.y);
    render();
  });
  zone.addEventListener('pointerup', (e) => {
    dragging = false;
    try { zone.releasePointerCapture(e.pointerId); } catch (_) {}
  });

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  function render() {
    zone.style.left = `${state.x}px`;
    zone.style.top = `${state.y}px`;
    zone.style.width = `${state.w}px`;
    zone.style.height = `${state.h}px`;
    zone.style.borderColor = state.color;
    labelEl.textContent = state.label;
    labelEl.style.color = state.color;
    root.querySelector('[data-info-pos]').textContent = `${state.x}, ${state.y}`;
    root.querySelector('[data-info-size]').textContent = `${state.w} × ${state.h}`;
  }

  if (!document.getElementById('print-tool-style')) {
    const style = document.createElement('style');
    style.id = 'print-tool-style';
    style.textContent = `
      .print-tool-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
      .print-tool-stage {
        margin-top: 20px;
        border: 1px solid var(--line);
        border-radius: 10px;
        height: 400px;
        position: relative;
        background:
          radial-gradient(circle at 30% 30%, rgba(124,92,255,0.08), transparent 60%),
          repeating-linear-gradient(0deg, transparent 0, transparent 39px, rgba(255,255,255,0.03) 40px),
          repeating-linear-gradient(90deg, transparent 0, transparent 39px, rgba(255,255,255,0.03) 40px),
          var(--bg);
        overflow: hidden;
        user-select: none;
      }
      .print-tool-zone {
        position: absolute;
        border: 2px dashed var(--accent);
        background: rgba(124,92,255,0.06);
        border-radius: 4px;
        transition: border-color 0.2s;
        cursor: move;
      }
      .print-tool-label {
        position: absolute;
        top: -22px;
        left: 0;
        font-family: var(--font-mono);
        font-size: 11px;
        padding: 2px 6px;
        background: var(--bg-2);
        border: 1px solid var(--line);
        border-radius: 3px;
      }
      .print-tool-handle {
        position: absolute;
        width: 8px;
        height: 8px;
        background: var(--bg-2);
        border: 1px solid var(--accent);
        border-radius: 1px;
      }
      .print-tool-handle--tl { top: -4px; left: -4px; }
      .print-tool-handle--tr { top: -4px; right: -4px; }
      .print-tool-handle--bl { bottom: -4px; left: -4px; }
      .print-tool-handle--br { bottom: -4px; right: -4px; }
      .print-tool-info {
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
      .print-tool-info span { color: var(--text-soft); margin-right: 4px; }
      .print-tool-info strong { color: var(--accent); font-weight: 500; }
    `;
    document.head.appendChild(style);
  }

  render();
  // eslint-disable-next-line no-console
  console.log(`%c[PrintAreaTool]`, 'color:#7c5cff;font-weight:600', `instance ${ctx.id} mounted`);
}
