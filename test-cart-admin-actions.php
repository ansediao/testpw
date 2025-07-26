<?php
/**
 * 测试购物车管理员操作功能
 * 
 * 这个文件用于测试购物车中的复制和编辑按钮功能
 * 使用方法：将此文件放在WordPress根目录，然后访问 yoursite.com/test-cart-admin-actions.php
 */

// 加载WordPress环境
require_once('wp-config.php');
require_once('wp-load.php');

// 确保用户已登录且是管理员
if (!is_user_logged_in() || !current_user_can('manage_options')) {
    wp_die('请以管理员身份登录后访问此页面');
}

// 检查WooCommerce是否激活
if (!class_exists('WooCommerce')) {
    wp_die('WooCommerce插件未激活');
}

// 检查PW Admin插件是否激活
if (!class_exists('Pw_Cart_Admin_Actions')) {
    wp_die('PW Admin插件未正确加载');
}

?>
<!DOCTYPE html>
<html>
<head>
    <title>购物车管理员操作测试</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
        .success { color: green; }
        .error { color: red; }
        .info { color: blue; }
    </style>
</head>
<body>
    <h1>购物车管理员操作功能测试</h1>
    
    <div class="test-section">
        <h2>系统检查</h2>
        <?php
        echo '<p class="success">✓ WordPress已加载</p>';
        echo '<p class="success">✓ 用户已登录为管理员</p>';
        echo '<p class="success">✓ WooCommerce已激活</p>';
        
        // 检查购物车是否有商品
        $cart = WC()->cart;
        $cart_count = $cart->get_cart_contents_count();
        
        if ($cart_count > 0) {
            echo '<p class="success">✓ 购物车中有 ' . $cart_count . ' 个商品</p>';
        } else {
            echo '<p class="info">ℹ 购物车为空，请先添加一些商品进行测试</p>';
        }
        ?>
    </div>
    
    <div class="test-section">
        <h2>模块状态</h2>
        <?php
        if (class_exists('Pw_Cart_Admin_Actions')) {
            echo '<p class="success">✓ Pw_Cart_Admin_Actions 类已加载</p>';
            
            // 检查钩子是否已注册
            global $wp_filter;
            
            if (isset($wp_filter['woocommerce_cart_item_name'])) {
                echo '<p class="success">✓ woocommerce_cart_item_name 钩子已注册</p>';
            } else {
                echo '<p class="error">✗ woocommerce_cart_item_name 钩子未注册</p>';
            }
            
            if (isset($wp_filter['wp_ajax_pw_duplicate_cart_item'])) {
                echo '<p class="success">✓ AJAX 复制处理程序已注册</p>';
            } else {
                echo '<p class="error">✗ AJAX 复制处理程序未注册</p>';
            }
            
            // 编辑功能现在是直接链接，不需要AJAX处理程序
            echo '<p class="success">✓ 编辑功能使用直接链接（无需AJAX）</p>';
        } else {
            echo '<p class="error">✗ Pw_Cart_Admin_Actions 类未加载</p>';
        }
        ?>
    </div>
    
    <div class="test-section">
        <h2>购物车内容预览</h2>
        <?php
        if ($cart_count > 0) {
            echo '<p>以下是购物车中的商品，在实际购物车页面中，每个商品名称后面应该显示复制和编辑按钮：</p>';
            echo '<ul>';
            
            foreach ($cart->get_cart() as $cart_item_key => $cart_item) {
                $product = $cart_item['data'];
                $product_name = $product->get_name();
                $quantity = $cart_item['quantity'];
                
                echo '<li>';
                echo '<strong>' . esc_html($product_name) . '</strong> (数量: ' . $quantity . ')';
                echo '<br><small>购物车键: ' . esc_html($cart_item_key) . '</small>';
                echo '</li>';
            }
            
            echo '</ul>';
            
            echo '<p><a href="' . wc_get_cart_url() . '" target="_blank">查看购物车页面</a></p>';
        } else {
            echo '<p>购物车为空</p>';
        }
        ?>
    </div>
    
    <div class="test-section">
        <h2>测试说明</h2>
        <ol>
            <li>确保购物车中有商品</li>
            <li>访问购物车页面 (<a href="<?php echo wc_get_cart_url(); ?>" target="_blank"><?php echo wc_get_cart_url(); ?></a>)</li>
            <li>在每个商品名称下方应该看到"复制"和"编辑"按钮</li>
            <li>点击"复制"按钮应该创建一个新的同名产品并在新窗口中打开后台编辑页面</li>
            <li>点击"编辑"按钮应该在新窗口中直接打开原产品的后台编辑页面</li>
        </ol>
        
        <h3>故障排除</h3>
        <ul>
            <li>如果按钮不显示，检查是否以管理员身份登录</li>
            <li>如果AJAX请求失败，检查浏览器控制台的错误信息</li>
            <li>确保WordPress和WooCommerce版本兼容</li>
        </ul>
    </div>
    
    <div class="test-section">
        <h2>快速操作</h2>
        <p>
            <a href="<?php echo admin_url('edit.php?post_type=product'); ?>">管理产品</a> |
            <a href="<?php echo wc_get_cart_url(); ?>">查看购物车</a> |
            <a href="<?php echo admin_url('admin.php?page=wc-settings'); ?>">WooCommerce设置</a>
        </p>
    </div>
</body>
</html>