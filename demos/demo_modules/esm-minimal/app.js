/**
 * app.js — 入口模块
 * 通过 import map 使用裸标识符 "counter" 导入
 */

import { increment, reset, getCount } from 'counter';

// DOM 引用
const output = document.getElementById('output');
const btnInc = document.getElementById('btn-increment');
const btnReset = document.getElementById('btn-reset');
const checks = document.getElementById('checks');

// 渲染函数
function render() {
  output.textContent = `点击次数: ${getCount()}`;
}

// 事件绑定
btnInc.addEventListener('click', () => {
  increment();
  render();
});

btnReset.addEventListener('click', () => {
  reset();
  render();
});

// 初始渲染
render();

// === 全局变量泄漏检测 ===
function runGlobalChecks() {
  const tests = [
    { name: 'window._count',      value: window._count,      expect: 'undefined' },
    { name: 'window.increment',   value: window.increment,   expect: 'undefined' },
    { name: 'window.reset',       value: window.reset,       expect: 'undefined' },
    { name: 'window.getCount',    value: window.getCount,    expect: 'undefined' },
  ];

  checks.innerHTML = '';

  for (const t of tests) {
    const actual = typeof t.value;
    const pass = actual === t.expect;
    const li = document.createElement('li');
    li.className = pass ? 'pass' : 'fail';
    li.textContent = `${pass ? '✅' : '❌'} ${t.name} = ${actual}`;
    checks.appendChild(li);
  }

  // 额外说明
  const note = document.createElement('li');
  note.style.color = '#64748b';
  note.style.marginTop = '8px';
  note.style.fontFamily = 'system-ui, sans-serif';
  note.style.fontSize = '0.85rem';
  note.textContent = '模块内部变量全部隔离，零全局泄漏';
  checks.appendChild(note);
}

runGlobalChecks();

console.log('✅ ESM 模块加载成功');
console.log('   counter 模块内部 _count 不可通过 window._count 访问');
console.log('   所有业务逻辑封装在模块作用域内');
