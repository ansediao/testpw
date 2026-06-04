// main.js
// 入口：管理工具按钮、动态 import 加载、模块缓存、调试输出
// =============================================================

// 按需加载不同的功能模块
const loadTextTool = () => import('./components/TextTool.js');
const loadWatermarkTool = () => import('./components/WatermarkTool.js');
const loadPrintAreaTool = () => import('./components/PrintAreaTool.js');

const loaders = {
  TextTool: loadTextTool,
  WatermarkTool: loadWatermarkTool,
  PrintAreaTool: loadPrintAreaTool,
};

const state = {
  /** @type {Map<string, Function>} name -> factory */
  loadedModules: new Map(),
  /** @type {Map<string, { count: number }>} name -> { count } */
  instances: new Map(),
};

const refs = {
  workspace: document.getElementById('workspace'),
  loadedCount: document.getElementById('loaded-count'),
  instanceCount: document.getElementById('instance-count'),
  lastLoad: document.getElementById('last-load'),
  toastStack: document.getElementById('toast-stack'),
  consoleBody: document.getElementById('console-body'),
  consoleDrawer: document.getElementById('console-drawer'),
  consoleToggle: document.getElementById('console-toggle'),
  clearBtn: document.getElementById('clear-btn'),
};

/* ---------- 日志与提示 ---------- */
const log = (...args) => {
  const stamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
  const line = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
  refs.consoleBody.textContent += `[${stamp}] ${line}\n`;
  refs.consoleBody.scrollTop = refs.consoleBody.scrollHeight;
  // eslint-disable-next-line no-console
  console.log('%c[microapp]', 'color:#7c5cff;font-weight:600', ...args);
};

const toast = (title, msg = '', type = '') => {
  const el = document.createElement('div');
  el.className = `toast ${type ? `toast--${type}` : ''}`;
  el.innerHTML = `<div class="toast-title">${title}</div>${msg ? `<div class="toast-msg">${msg}</div>` : ''}`;
  refs.toastStack.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(20px)';
  }, 2400);
  setTimeout(() => el.remove(), 2800);
};

/* ---------- 计数 / 状态 ---------- */
const updateCounters = () => {
  refs.loadedCount.textContent = String(state.loadedModules.size);
  const total = [...state.instances.values()].reduce((s, v) => s + v.count, 0);
  refs.instanceCount.textContent = String(total);
};

const setBtnStatus = (name, status) => {
  const btn = document.querySelector(`.tool-btn[data-tool="${name}"]`);
  if (!btn) return;
  btn.dataset.loaded = status === 'loaded' ? 'true' : '';
  btn.dataset.loading = status === 'loading' ? 'true' : '';
};

/* ---------- 实例挂载 ---------- */
const mountInstance = (name, factory) => {
  let record = state.instances.get(name);
  if (!record) {
    record = { count: 0 };
    state.instances.set(name, record);
  }
  record.count += 1;

  const id = `${name.toLowerCase()}-${record.count}`;
  const card = document.createElement('article');
  card.className = 'module-card';
  card.dataset.tool = name;
  card.innerHTML = `
    <header class="module-card-head">
      <div class="module-card-title">
        <span class="module-card-glyph">${name[0]}</span>
        <div>
          <div class="module-card-name">${name}</div>
          <div class="module-card-path">./components/${name}.js · instance #${record.count}</div>
        </div>
      </div>
      <button class="module-card-close" data-close="${id}" aria-label="移除实例">×</button>
    </header>
    <div class="module-card-body" data-mount="${id}"></div>
  `;
  refs.workspace.appendChild(card);
  refs.workspace.classList.add('has-tools');

  const mountNode = card.querySelector(`[data-mount="${id}"]`);
  factory(mountNode, { id, name });

  card.querySelector(`[data-close="${id}"]`).addEventListener('click', () => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(-8px)';
    card.style.transition = 'all 0.25s';
    setTimeout(() => {
      card.remove();
      if (!refs.workspace.querySelector('.module-card')) {
        refs.workspace.classList.remove('has-tools');
      }
      updateCounters();
    }, 250);
  });

  updateCounters();
};

/* ---------- 触发器：动态 import 并实例化 ---------- */
const invokeTool = async (name) => {
  const loader = loaders[name];
  if (!loader) return;

  setBtnStatus(name, 'loading');
  log('→ import', `./components/${name}.js`);

  const started = performance.now();
  let factory = state.loadedModules.get(name);
  const fromCache = !!factory;

  if (!fromCache) {
    try {
      const mod = await loader();
      factory = mod.default;
      state.loadedModules.set(name, factory);
    } catch (err) {
      setBtnStatus(name, '');
      log('✗ failed', name, err.message);
      toast(`${name} 加载失败`, err.message, 'bad');
      return;
    }
  }

  setBtnStatus(name, 'loaded');
  mountInstance(name, factory);

  const cost = Math.round(performance.now() - started);
  refs.lastLoad.textContent = `${cost} ms`;

  if (fromCache) {
    toast(`${name} · 缓存命中`, `复用已加载模块 · ${cost} ms`, 'good');
    log('✓ cache hit', name, `${cost}ms`);
  } else {
    toast(`${name} · 首次加载`, `import() 解析完成 · ${cost} ms`, 'good');
    log('✓ loaded', name, `${cost}ms`);
  }
};

/* ---------- 暴露到 window 便于控制台调试 ---------- */
window.__pwca_demo = {
  state,
  load: invokeTool,
  clear: () => {
    refs.workspace.querySelectorAll('.module-card').forEach((el) => el.remove());
    refs.workspace.classList.remove('has-tools');
    state.instances.clear();
    updateCounters();
  },
  reset: () => {
    state.loadedModules.clear();
    state.instances.clear();
    refs.workspace.querySelectorAll('.module-card').forEach((el) => el.remove());
    refs.workspace.classList.remove('has-tools');
    document.querySelectorAll('.tool-btn').forEach((b) => {
      b.dataset.loaded = '';
      b.dataset.loading = '';
    });
    updateCounters();
  },
};

/* ---------- 绑定事件 ---------- */
// TextTool 按钮：保持你原示例的写法（动态 import 后取 default 渲染）
document.getElementById('text-tool-btn').addEventListener('click', async () => {
  const TextTool = (await loadTextTool()).default;
  // 渲染TextTool组件
  invokeTool('TextTool');
  // 显式调用一次以演示 await 行为（可与 invokeTool 共享缓存）
  // 注意：下面的调用会创建第二个 TextTool 实例
  // 如只想要一个，请注释掉下面这行
  // mountInstance('TextTool', TextTool);
});

document.getElementById('watermark-tool-btn').addEventListener('click', () => invokeTool('WatermarkTool'));
document.getElementById('print-area-tool-btn').addEventListener('click', () => invokeTool('PrintAreaTool'));

refs.clearBtn.addEventListener('click', () => {
  refs.workspace.querySelectorAll('.module-card').forEach((el) => el.remove());
  refs.workspace.classList.remove('has-tools');
  state.instances.clear();
  updateCounters();
  toast('工作区已清空', '模块缓存仍在内存中', 'warn');
  log('× workspace cleared (cache preserved)');
});

refs.consoleToggle.addEventListener('click', () => {
  refs.consoleDrawer.classList.toggle('is-collapsed');
  refs.consoleToggle.textContent = refs.consoleDrawer.classList.contains('is-collapsed') ? '展开' : '隐藏';
  document.body.classList.toggle('drawer-collapsed', refs.consoleDrawer.classList.contains('is-collapsed'));
});

/* ---------- 启动日志 ---------- */
log('main.js loaded · ready');
log('tools', Object.keys(loaders));
log('提示：在控制台执行 __pwca_demo.load("TextTool") 可手动触发加载');
