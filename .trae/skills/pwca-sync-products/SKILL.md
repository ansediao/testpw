---
name: "pwca-sync-products"
description: "AJAX-based product sync for PWCA Admin Dashboard. Invoke when implementing or modifying the sync products feature in the admin dashboard."
---

# PWCA Sync Products

Admin Dashboard 产品同步功能实现指南。

## 功能概述

在 WordPress 后台 Dashboard 页面，点击"Sync Products"按钮后：
1. 按钮显示"同步中，请稍等"文字
2. 按钮禁用防止重复点击
3. 通过 AJAX 异步提交，不刷新页面
4. 完成后显示成功/失败提示

## 核心文件

### 视图层 (HTML)
**文件**: `modules/admin_dashboard/features/feat_dashboard/views/main-page.php`

```php
// 未连接店铺时按钮禁用
<button type="submit" name="pwca_sync_products" id="pwca-sync-products" class="button button-primary" <?php echo ! $has_connected_token ? 'disabled' : ''; ?>>
    Sync Products
</button>
<span id="pwca-sync-status" class="pwca-admin-dashboard__sync-status" hidden>同步中，请稍等</span>
```

### 样式层 (SCSS)
**文件**: `modules/admin_dashboard/features/feat_dashboard/assets/scss/_dashboard.scss`

```scss
&__sync-status {
    margin-left: 12px;
    color: #666;
}
```

### JavaScript 层
**文件**: `modules/admin_dashboard/assets/js/pwca-admin-dashboard.js`

关键函数 `initSyncStatus()`:
```javascript
const initSyncStatus = () => {
    const form = document.querySelector('form[action=""]')
    const syncButton = document.getElementById('pwca-sync-products')
    const syncStatus = document.getElementById('pwca-sync-status')

    if (!form || !syncButton || !syncStatus) return

    form.addEventListener('submit', async (event) => {
        event.preventDefault()
        syncButton.disabled = true
        syncStatus.hidden = false

        try {
            const formData = new FormData(form)
            formData.append('action', 'pwca_sync_products')
            const response = await postFormData(formData)
            if (response?.success) {
                setNotice(syncStatus.parentElement, 'success', String(response.data || '同步完成'))
            } else {
                setNotice(syncStatus.parentElement, 'error', String(response?.data || '同步失败'))
            }
        } catch (error) {
            setNotice(syncStatus.parentElement, 'error', `同步失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
        } finally {
            syncStatus.hidden = true
            syncButton.disabled = false
        }
    })
}
```

### PHP 后端
**文件**: `modules/admin_dashboard/features/feat_dashboard/includes/class-pwca-admin-dashboard-dashboard.php`

注册 AJAX 钩子:
```php
add_action( 'wp_ajax_pwca_sync_products', array( $this, 'handle_sync_request_ajax' ) );
```

AJAX Handler:
```php
public function handle_sync_request_ajax() {
    check_ajax_referer( 'pwca_sync_products', 'pwca_sync_products_nonce' );

    if ( ! current_user_can( 'manage_options' ) ) {
        wp_send_json_error( '权限不足' );
        return;
    }

    if ( ! class_exists( 'Pwca_Integration_Promowares' ) ) {
        wp_send_json_error( 'Promowares sync module unavailable' );
        return;
    }

    if ( ! method_exists( 'Pwca_Integration_Promowares', 'schedule_product_import' ) ) {
        wp_send_json_error( 'Product import feature unavailable' );
        return;
    }

    $messages = Pwca_Integration_Promowares::schedule_product_import();
    set_transient( 'pwca_dashboard_messages', $messages, 30 );

    if ( ! empty( $messages ) && 'error' === $messages[0]['type'] ) {
        wp_send_json_error( $messages[0]['text'] );
    } else {
        wp_send_json_success( $messages[0]['text'] );
    }
}
```

## 实现要点

1. **AJAX 提交**: 使用 `postFormData` 函数通过 `admin-ajax.php` 提交
2. **Nonce 验证**: 表单使用 `wp_nonce_field('pwca_sync_products', 'pwca_sync_products_nonce')`
3. **权限检查**: 必须验证 `manage_options` 能力
4. **错误处理**: 成功/失败都通过 `setNotice` 显示提示
5. **状态管理**: 使用 `finally` 确保按钮状态正确恢复

## 移除进度条

如果需要移除之前的进度条功能，删除以下内容：

**HTML** (main-page.php):
- `#pwca-import-progress` 容器
- `#pwca-progress-bar`
- `#pwca-progress-text`

**SCSS** (_dashboard.scss):
- `__progress` 样式块
- `__progress-bar` 样式块
- `__progress-text` 样式块

**JavaScript** (pwca-admin-dashboard.js):
- `initImportProgress()` 函数及调用
