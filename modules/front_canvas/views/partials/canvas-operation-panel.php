<?php
// 保持与原文件一致的插件目录 URL 变量（供包含的内容文件使用）
$plugin_url = plugin_dir_url(__FILE__);

// 将原先的大型画布操作面板文件拆分为独立的内容文件，
// 当前文件只负责作为入口并组合面板结构。
include __DIR__ . '/canvas-operation-panel-content.php';