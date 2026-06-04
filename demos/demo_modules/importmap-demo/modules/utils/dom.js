/**
 * DOM 工具模块
 * 被 import map 映射为 @utils/dom
 */

export function $(selector) {
  return document.querySelector(selector)
}

export function $$(selector) {
  return [...document.querySelectorAll(selector)]
}

export function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag)
  for (const [key, val] of Object.entries(attrs)) {
    el.setAttribute(key, val)
  }
  for (const child of children) {
    el.append(child)
  }
  return el
}
