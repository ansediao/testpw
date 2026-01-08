<?php

// 检查 WooCommerce 是否已激活
function pw_check_woocommerce_active() {
	return in_array(
		'woocommerce/woocommerce.php',
		apply_filters( 'active_plugins', get_option( 'active_plugins' ) )
	);
}

// 添加自定义菜单
function pw_add_custom_menu() {
	// 检查 WooCommerce 是否激活
	if ( ! pw_check_woocommerce_active() ) {
		return;
	}

	// 顶级菜单
	add_menu_page(
		'Promoware',
		'Promoware',
		'read',
		'pw-dashboard',
		'pw_main_menu_page',
		'dashicons-admin-generic',
		55
	);

	// Dashboard / Settings 等标签页所在页面
	add_submenu_page(
		'pw-dashboard',
		'Dashboard',
		'Dashboard',
		'read',
		'pw-dashboard-settings',
		'pw_submenu_page_callback'
	);

	// --- 集成 PW Design 相关菜单 ---
	$pw_design_post_type_obj   = get_post_type_object( 'pw_design' );
	$pw_design_capability_edit = $pw_design_post_type_obj ? $pw_design_post_type_obj->cap->edit_posts : 'edit_posts';

	add_submenu_page(
		'pw-dashboard',
		'Design Library',
		'Design Library',
		$pw_design_capability_edit,
		'pw-design-library',
		'pw_manage_designs_page'
	);	

	// Tags 子菜单
	add_submenu_page(
		'pw-dashboard',
		'Tags',
		'Tags',
		$pw_design_capability_edit,
		'edit-tags.php?taxonomy=pw_design_tag'
	);	

	
}
add_action( 'admin_menu', 'pw_add_custom_menu' );

// 隐藏主菜单自动生成的二级菜单（使用CSS而不是移除）
add_action(
	'admin_head',
	function () {
		echo '<style>
        #adminmenu .wp-submenu a[href="admin.php?page=pw-dashboard"] {
            display: none !important;
        }
    </style>';
	}
);

/**
 * 顶级菜单页面：包含 Token 设置、产品导入、缓存管理
 */
function pw_main_menu_page() {
	if ( isset( $_POST['sync_products'] ) ) {
		schedule_product_import();
		echo '<div class="updated"><p>产品导入已开始！</p></div>';
	}
	?>
	<div class="wrap">
		<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>

		<?php wp_nonce_field( 'pw_dashboard_settings', 'pw_dashboard_nonce' ); ?>

		<p>
			<input type="text"
				   name="pw_token"
				   id="pw_token"
				   class="regular-text"
				   placeholder="Enter API Token"
				   value="<?php echo esc_attr( get_option( 'pw_api_token', '' ) ); ?>">
			<input type="button" name="pw_check" id="pw_check" class="button" value="Connect">
		</p>
		<div id="pw_loading" style="display:none;"><span class="spinner is-active"></span> Verifying...</div>
		<div id="pw_result"></div>

		<p>
			<label for="pw_currency">Currency</label>
			<select name="pw_currency" id="pw_currency">
				<option value="USD">USD</option>
				<option value="EUR">EUR</option>
				<option value="GBP">GBP</option>
				<option value="CNY">CNY</option>
				<option value="JPY">JPY</option>
			</select>
		</p>

		<h1>Product Importer</h1>
		<form method="post" action="">
			<input type="submit" name="sync_products" id="sync_products" class="button button-primary" value="Sync Products">
		</form>
		<div id="progress-bar-container">
			<div id="progress-bar"></div>
			<div id="progress-text">0/0</div>
		</div>

		<hr style="margin: 30px 0;">
		<h1>产品数据缓存管理</h1>
		<div id="cache-management-section">
			<div id="cache-status" style="background: #f9f9f9; padding: 15px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 15px;">
				<h3>缓存状态</h3>
				<div id="cache-info">
					<p><strong>总缓存数量:</strong> <span id="total-cached">加载中...</span></p>
					<p><strong>过期缓存数量:</strong> <span id="expired-count">加载中...</span></p>
					<p><strong>最近更新时间:</strong> <span id="latest-cache-time">加载中...</span></p>
					<p><strong>缓存有效期:</strong> <span id="cache-expiry">30分钟</span></p>
				</div>
				<button type="button" id="refresh-cache-status" class="button">刷新状态</button>
			</div>

			<div style="margin-bottom: 15px;">
				<h3>缓存操作</h3>
				<p>
					<input type="number" id="specific-product-id" placeholder="输入产品ID (可选)" style="width: 200px;">
					<button type="button" id="clear-specific-cache" class="button">清除指定产品缓存</button>
				</p>
				<p>
					<button type="button" id="clear-all-cache" class="button button-secondary"
							onclick="return confirm('确定要清除所有产品缓存吗？')">清除所有缓存</button>
				</p>
				<p>
					<input type="number" id="test-product-id" placeholder="输入产品ID进行测试" style="width: 200px;">
					<button type="button" id="test-cache" class="button">测试缓存功能</button>
				</p>
			</div>

			<div id="cache-operation-result"></div>
		</div>
	</div>
	<style>
		#progress-bar-container {
			width: 100%;
			background-color: #f1f1f1;
			margin-top: 10px;
		}
		#progress-bar {
			width: 0;
			height: 30px;
			background-color: #4caf50;
			text-align: center;
			line-height: 30px;
			color: white;
		}
		#progress-text {
			text-align: center;
			margin-top: 5px;
		}
	</style>
	<script>
		jQuery(document).ready(function($) {
			function updateProgress() {
				$.post(ajaxurl, {
					action: 'check_import_progress'
				}, function(response) {
					var total = response.total;
					var completed = response.completed;
					var percentage = total > 0 ? (completed / total) * 100 : 0;

					$('#progress-bar').width(percentage + '%');
					$('#progress-text').text(completed + '/' + total);

					if (completed < total) {
						setTimeout(updateProgress, 1000);
					}
				});
			}

			$('#sync_products').on('click', function() {
				setTimeout(updateProgress, 1000);
			});

			// 缓存管理
			function loadCacheStatus() {
				$.post(ajaxurl, {
					action: 'pw_get_cache_status',
					nonce: '<?php echo wp_create_nonce( "pw_cache_status_nonce" ); ?>'
				}, function(response) {
					if (response.success) {
						$('#total-cached').text(response.data.total_cached);
						$('#expired-count').text(response.data.expired_count);
						$('#latest-cache-time').text(response.data.latest_cache_time);
						$('#cache-expiry').text(response.data.cache_expiry_minutes + '分钟');
					} else {
						$('#cache-info').html('<p style="color: red;">加载缓存状态失败: ' + (response.data || '未知错误') + '</p>');
					}
				}).fail(function() {
					$('#cache-info').html('<p style="color: red;">加载缓存状态失败: 网络错误</p>');
				});
			}

			loadCacheStatus();

			$('#refresh-cache-status').on('click', function() {
				loadCacheStatus();
			});

			$('#clear-specific-cache').on('click', function() {
				var productId = $('#specific-product-id').val().trim();
				if (!productId) {
					alert('请输入产品ID');
					return;
				}

				$.post(ajaxurl, {
					action: 'pw_clear_product_cache',
					product_id: productId,
					nonce: '<?php echo wp_create_nonce( "pw_clear_cache_nonce" ); ?>'
				}, function(response) {
					if (response.success) {
						$('#cache-operation-result').html('<div class="notice notice-success"><p>' + response.data.message + '</p></div>');
						loadCacheStatus();
						$('#specific-product-id').val('');
					} else {
						$('#cache-operation-result').html('<div class="notice notice-error"><p>操作失败: ' + (response.data || '未知错误') + '</p></div>');
					}
				}).fail(function() {
					$('#cache-operation-result').html('<div class="notice notice-error"><p>操作失败: 网络错误</p></div>');
				});
			});

			$('#clear-all-cache').on('click', function() {
				$.post(ajaxurl, {
					action: 'pw_clear_product_cache',
					nonce: '<?php echo wp_create_nonce( "pw_clear_cache_nonce" ); ?>'
				}, function(response) {
					if (response.success) {
						$('#cache-operation-result').html('<div class="notice notice-success"><p>' + response.data.message + '</p></div>');
						loadCacheStatus();
					} else {
						$('#cache-operation-result').html('<div class="notice notice-error"><p>操作失败: ' + (response.data || '未知错误') + '</p></div>');
					}
				}).fail(function() {
					$('#cache-operation-result').html('<div class="notice notice-error"><p>操作失败: 网络错误</p></div>');
				});
			});

			$('#test-cache').on('click', function() {
				var productId = $('#test-product-id').val().trim();
				if (!productId) {
					alert('请输入产品ID');
					return;
				}

				$('#cache-operation-result').html('<div class="notice notice-info"><p>正在测试缓存功能...</p></div>');

				var startTime1 = Date.now();
				$.get('/wp-json/pw/v1/product-data/' + productId)
					.done(function(data1) {
						var time1 = Date.now() - startTime1;

						var startTime2 = Date.now();
						$.get('/wp-json/pw/v1/product-data/' + productId)
							.done(function(data2) {
								var time2 = Date.now() - startTime2;

								var resultHtml = '<div class="notice notice-success">';
								resultHtml += '<h4>缓存测试结果:</h4>';
								resultHtml += '<p><strong>第一次调用 (API):</strong> ' + time1 + 'ms</p>';
								resultHtml += '<p><strong>第二次调用 (缓存):</strong> ' + time2 + 'ms</p>';
								var improvement = time1 > 0 ? ((time1 - time2) / time1 * 100).toFixed(1) : 0;
								resultHtml += '<p><strong>性能提升:</strong> ' + improvement + '%</p>';
								resultHtml += '<p><strong>数据一致性:</strong> ' +
									(JSON.stringify(data1) === JSON.stringify(data2) ? '✓ 通过' : '✗ 失败') +
									'</p>';
								resultHtml += '</div>';

								$('#cache-operation-result').html(resultHtml);
								loadCacheStatus();
							})
							.fail(function() {
								$('#cache-operation-result').html('<div class="notice notice-error"><p>第二次调用失败</p></div>');
							});
					})
					.fail(function(xhr) {
						var errorMsg = xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : '第一次调用失败';
						$('#cache-operation-result').html('<div class="notice notice-error"><p>' + errorMsg + '</p></div>');
					});
			});

			// Token 验证
			$('#pw_check').on('click', function() {
				var token = $('#pw_token').val().trim();
				if (!token) {
					alert('请输入Token');
					return;
				}

				$('#pw_loading').show();
				$('#pw_result').html('');

				$.ajax({
					url: ajaxurl,
					type: 'POST',
					data: {
						action: 'pw_proxy_api_request',
						endpoint: 'auth/user-info',
						token: token
					},
					success: function(response) {
						$('#pw_loading').hide();
						if (response.code === 200 && response.message === 'success' &&
							response.data && response.data.user_id === 1 && response.data.team === '1') {

							$.ajax({
								url: ajaxurl,
								type: 'POST',
								data: {
									action: 'pw_save_token',
									token: token,
									nonce: '<?php echo wp_create_nonce( "pw_save_token_nonce" ); ?>'
								},
								success: function(saveResponse) {
									if (saveResponse.success) {
										$('#pw_result').html('<div class="notice notice-success"><p>验证成功，Token已保存</p></div>');
									} else {
										$('#pw_result').html('<div class="notice notice-warning"><p>验证成功，但Token保存失败</p></div>');
									}
								},
								error: function() {
									$('#pw_result').html('<div class="notice notice-warning"><p>验证成功，但Token保存失败</p></div>');
								}
							});
						} else {
							$('#pw_result').html('<div class="notice notice-error"><p>验证失败: 无效的响应格式</p></div>');
						}
					},
					error: function(xhr) {
						$('#pw_loading').hide();
						var errorMsg = xhr.responseJSON ? JSON.stringify(xhr.responseJSON) : '验证失败';
						$('#pw_result').html('<div class="notice notice-error"><p>' + errorMsg + '</p></div>');
					}
				});
			});
		});
	</script>
	<?php
}

/**
 * 检查 SMTP 是否配置
 */
function pw_check_smtp_configured() {
	$phpmailer = new PHPMailer\PHPMailer\PHPMailer();

	do_action_ref_array( 'phpmailer_init', array( &$phpmailer ) );

	return $phpmailer->isSMTP() && ! empty( $phpmailer->Host );
}

/**
 * 二级菜单页面：Dashboard / Settings / Status / Product Requirement / Support
 */
function pw_submenu_page_callback() {
	$current_tab = isset( $_GET['tab'] ) ? sanitize_text_field( wp_unslash( $_GET['tab'] ) ) : 'dashboard';

	$tabs = array(
		'dashboard'       => 'Dashboard',
		'settings'        => 'Settings',
		'status'          => 'Status',
		'product_request' => 'Product Requirement',
		'support'         => 'Support',
	);
	?>
	<div class="wrap">
		<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>

		<nav class="nav-tab-wrapper wp-clearfix">
			<?php foreach ( $tabs as $tab => $name ) : ?>
				<?php
				$class = ( $tab === $current_tab ) ? 'nav-tab nav-tab-active' : 'nav-tab';
				?>
				<a href="<?php echo esc_url( add_query_arg( array( 'page' => 'pw-dashboard-settings', 'tab' => $tab ), admin_url( 'admin.php' ) ) ); ?>"
				   class="<?php echo esc_attr( $class ); ?>">
					<?php echo esc_html( $name ); ?>
				</a>
			<?php endforeach; ?>
		</nav>

		<div class="tab-content">
			<?php
			switch ( $current_tab ) {
				case 'dashboard':
					pw_render_dashboard_tab();
					break;
				case 'settings':
					pw_render_settings_tab();
					break;
				case 'status':
					pw_render_status_tab();
					break;
				case 'product_request':
					pw_render_product_request_tab();
					break;
				case 'support':
					pw_render_support_tab();
					break;
			}
			?>
		</div>
	</div>
	<?php
}

/**
 * Dashboard 页签
 */
function pw_render_dashboard_tab() {
	echo '<div class="tab-pane active">';
	echo '<h2>Dashboard</h2>';

	echo '<div class="pw-stats-container">';

	// 今日订单
	$today_start = date( 'Y-m-d' ) . ' 00:00:00';
	$today_end   = date( 'Y-m-d' ) . ' 23:59:59';

	$all_statuses = array_keys( wc_get_order_statuses() );
	$todays_orders = wc_get_orders(
		array(
			'status'       => $all_statuses,
			'limit'        => -1,
			'date_created' => $today_start . '...' . $today_end,
		)
	);

	$todays_total   = 0;
	$todays_gross   = 0;
	if ( ! empty( $todays_orders ) ) {
		$todays_total = count( $todays_orders );
		foreach ( $todays_orders as $order ) {
			if ( $order instanceof WC_Order ) {
				$todays_gross += $order->get_total();
			}
		}
	}

	echo '<div class="pw-stat-card">';
	echo '<div class="pw-stat-value">' . wc_price( $todays_gross ) . '</div>';
	echo '<div class="pw-stat-label">' . $todays_total . ' ORDERS today</div>';
	echo '<div class="pw-stat-icon"><span class="dashicons dashicons-chart-bar"></span></div>';
	echo '</div>';

	// 最近7天订单
	$end_date   = date( 'Y-m-d' ) . ' 23:59:59';
	$start_date = date( 'Y-m-d', strtotime( '-6 days' ) ) . ' 00:00:00';

	$last7_orders = wc_get_orders(
		array(
			'status'       => $all_statuses,
			'limit'        => -1,
			'date_created' => $start_date . '...' . $end_date,
		)
	);

	$last7_total = 0;
	$last7_gross = 0;
	if ( ! empty( $last7_orders ) ) {
		$last7_total = count( $last7_orders );
		foreach ( $last7_orders as $order ) {
			if ( $order instanceof WC_Order ) {
				$last7_gross += $order->get_total();
			}
		}
	}

	echo '<div class="pw-stat-card">';
	echo '<div class="pw-stat-value">' . wc_price( $last7_gross ) . '</div>';
	echo '<div class="pw-stat-label">' . $last7_total . ' ORDERS last 7 days</div>';
	echo '<div class="pw-stat-icon"><span class="dashicons dashicons-calendar-alt"></span></div>';
	echo '</div>';

	// 全部订单
	$order_ids = wc_get_orders(
		array(
			'status' => $all_statuses,
			'limit'  => -1,
			'return' => 'ids',
		)
	);
	$total_orders_count = count( $order_ids );

	$all_orders = wc_get_orders(
		array(
			'status' => $all_statuses,
			'limit'  => -1,
		)
	);
	$gross_total_amount = 0;
	if ( ! empty( $all_orders ) ) {
		foreach ( $all_orders as $order ) {
			if ( $order instanceof WC_Order ) {
				$gross_total_amount += $order->get_total();
			}
		}
	}

	echo '<div class="pw-stat-card">';
	echo '<div class="pw-stat-value">' . wc_price( $gross_total_amount ) . '</div>';
	echo '<div class="pw-stat-label">' . $total_orders_count . ' ORDERS</div>';
	echo '<div class="pw-stat-icon"><span class="dashicons dashicons-chart-line"></span></div>';
	echo '</div>';

	echo '</div>'; // .pw-stats-container

	// 快捷导航
	echo '<div class="pw-quick-nav">';

	$nav_items = array(
		array( 'icon' => 'cart',      'label' => 'Orders' ),
		array( 'icon' => 'store',     'label' => 'Stores' ),
		array( 'icon' => 'products',  'label' => 'Products' ),
		array( 'icon' => 'money-alt', 'label' => 'Billing' ),
		array( 'icon' => 'art',       'label' => 'Designs' ),
	);

	foreach ( $nav_items as $item ) {
		echo '<div class="pw-nav-item">';
		echo '<a href="#">';
		echo '<div class="pw-nav-icon"><span class="dashicons dashicons-' . esc_attr( $item['icon'] ) . '"></span></div>';
		echo '<div class="pw-nav-label">' . esc_html( $item['label'] ) . '</div>';
		echo '</a>';
		echo '</div>';
	}

	echo '</div>'; // .pw-quick-nav

	echo '<style>
        .pw-stats-container {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }
        .pw-stat-card {
            background: #fff;
            border-radius: 8px;
            padding: 20px;
            width: 30%;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            position: relative;
            min-width: 200px;
            margin-bottom: 15px;
        }
        .pw-stat-value {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .pw-stat-label {
            color: #777;
            font-size: 14px;
        }
        .pw-stat-icon {
            position: absolute;
            right: 20px;
            top: 20px;
            background: #f5f5f5;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .pw-stat-icon .dashicons {
            font-size: 20px;
            width: 20px;
            height: 20px;
            color: #555;
        }
        .pw-quick-nav {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
            flex-wrap: wrap;
        }
        .pw-nav-item {
            background: #fff;
            border-radius: 8px;
            padding: 15px;
            width: 18%;
            min-width: 120px;
            text-align: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            cursor: pointer;
            transition: all 0.3s ease;
            margin-bottom: 15px;
        }
        .pw-nav-item:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .pw-nav-icon {
            margin-bottom: 10px;
        }
        .pw-nav-icon .dashicons {
            font-size: 30px;
            width: 30px;
            height: 30px;
            color: #555;
        }
        .pw-nav-label {
            font-weight: 500;
        }
        @media (max-width: 782px) {
            .pw-stat-card,
            .pw-nav-item {
                width: 100%;
            }
        }
    </style>';

	echo '</div>';
}

/**
 * Settings 页签
 */
function pw_render_settings_tab() {
	echo '<div class="tab-pane">';
	echo '<h2>Settings</h2>';

	if ( isset( $_POST['pw_save_settings'] ) && check_admin_referer( 'pw_settings_nonce', 'pw_settings_nonce_field' ) ) {
		$disable_ssl     = isset( $_POST['pw_disable_ssl'] ) ? 1 : 0;
		$api_key         = isset( $_POST['pw_api_key'] ) ? sanitize_text_field( wp_unslash( $_POST['pw_api_key'] ) ) : '';
		$api_secret      = isset( $_POST['pw_api_secret'] ) ? sanitize_text_field( wp_unslash( $_POST['pw_api_secret'] ) ) : '';
		$customize_text  = isset( $_POST['pw_customize_text'] ) ? sanitize_text_field( wp_unslash( $_POST['pw_customize_text'] ) ) : 'Customize';
		$customize_color = isset( $_POST['pw_customize_color'] ) ? sanitize_hex_color( wp_unslash( $_POST['pw_customize_color'] ) ) : '#000000';

		update_option( 'pw_disable_ssl', $disable_ssl );
		update_option( 'pw_api_key', $api_key );
		update_option( 'pw_api_secret', $api_secret );
		update_option( 'pw_customize_text', $customize_text );
		update_option( 'pw_customize_color', $customize_color );

		echo '<div class="notice notice-success is-dismissible"><p>设置已保存。</p></div>';
	}

	$disable_ssl     = get_option( 'pw_disable_ssl', 0 );
	$api_key         = get_option( 'pw_api_key', '' );
	$api_secret      = get_option( 'pw_api_secret', '' );
	$customize_text  = get_option( 'pw_customize_text', 'Customize' );
	$customize_color = get_option( 'pw_customize_color', '#000000' );
	?>
	<form method="post" action="">
		<?php wp_nonce_field( 'pw_settings_nonce', 'pw_settings_nonce_field' ); ?>

		<table class="form-table">
			<tr>
				<th scope="row">Reconnect your store</th>
				<td>
					<input type="button" class="button" value="Reconnect" id="pw-reconnect-button">
				</td>
			</tr>
			<tr>
				<th scope="row"><h3>Integration settings</h3></th>
				<td></td>
			</tr>
			<tr>
				<th scope="row">Disable SSL</th>
				<td>
					<label>
						<input type="checkbox" name="pw_disable_ssl" value="1" <?php checked( 1, $disable_ssl ); ?>>
						Use HTTP instead of HTTPS to connect to our API (may be required if the plugin does not work for some hosting configurations)
					</label>
				</td>
			</tr>
		</table>

		<table class="form-table">
			<tr>
				<th scope="row">Inquiry Form</th>
				<td>
					<input type="text" name="pw_api_key" value="<?php echo esc_attr( $api_key ); ?>" placeholder="API 集成信息" class="regular-text">
				</td>
			</tr>
			<tr>
				<th scope="row"></th>
				<td>
					<input type="text" name="pw_api_secret" value="<?php echo esc_attr( $api_secret ); ?>" placeholder="API 集成信息" class="regular-text">
				</td>
			</tr>
		</table>

		<h3>Product personalization settings</h3>
		<table class="form-table">
			<tr>
				<th scope="row">Customization button text</th>
				<td>
					<input type="text" name="pw_customize_text" value="<?php echo esc_attr( $customize_text ); ?>" class="regular-text">
				</td>
			</tr>
			<tr>
				<th scope="row">Customization button color</th>
				<td>
					<input type="color" name="pw_customize_color" value="<?php echo esc_attr( $customize_color ); ?>" class="pw-color-picker">
					<button type="button" class="button button-secondary wp-color-result" aria-expanded="false">
						<span class="wp-color-result-text">select color</span>
					</button>
				</td>
			</tr>
		</table>

		<h3>Promoware Shipping</h3>
		<table class="form-table">
			<tr>
				<td>
					<label>
						<input type="checkbox" name="pw_enable_tool_mode_shipping" value="1">
						Use Promoware Live Rate Shipping
					</label>
				</td>
			</tr>
			<tr>
				<td>
					<label>
						<input type="checkbox" name="pw_disable_standard_rates" value="1">
						Disable standard Woocommerce rates for products fulfilled by PromoWares
					</label>
				</td>
			</tr>
		</table>

		<p class="submit">
			<input type="submit" name="pw_save_settings" class="button button-primary" value="Save settings">
		</p>
	</form>

	<script>
		jQuery(document).ready(function($) {
			$('.pw-color-picker').wpColorPicker();

			$('#pw-reconnect-button').click(function() {
				alert('重新连接功能将在此处实现');
			});
		});
	</script>
	<?php
	echo '</div>';
}

/**
 * Status 页签
 */
function pw_render_status_tab() {
	echo '<div class="tab-pane">';
	echo '<h2>状态检查</h2>';

	echo '<table class="pw-status-table">';
	echo '<thead><tr><th>检查项</th><th>描述</th><th>状态</th></tr></thead>';
	echo '<tbody>';

	$woo_installed = pw_check_woocommerce_active();
	echo '<tr>';
	echo '<td>WooCommerce 安装</td>';
	echo '<td>检查 WooCommerce 是否已安装并激活</td>';
	echo '<td class="status-' . ( $woo_installed ? 'ok' : 'fail' ) . '">' . ( $woo_installed ? 'OK' : '未安装' ) . '</td>';
	echo '</tr>';

	if ( $woo_installed ) {
		$woo_version     = WC()->version;
		$woo_min_version = '7.0.0';
		$woo_version_ok  = version_compare( $woo_version, $woo_min_version, '>=' );

		echo '<tr>';
		echo '<td>WooCommerce 版本</td>';
		echo '<td>当前版本: ' . esc_html( $woo_version ) . ' (最低要求: ' . esc_html( $woo_min_version ) . ')</td>';
		echo '<td class="status-' . ( $woo_version_ok ? 'ok' : 'fail' ) . '">' . ( $woo_version_ok ? 'OK' : '需要更新' ) . '</td>';
		echo '</tr>';
	}

	global $wp_version;
	$wp_min_version = '6.0';
	$wp_version_ok  = version_compare( $wp_version, $wp_min_version, '>=' );

	echo '<tr>';
	echo '<td>WordPress 版本</td>';
	echo '<td>当前版本: ' . esc_html( $wp_version ) . ' (最低要求: ' . esc_html( $wp_min_version ) . ')</td>';
	echo '<td class="status-' . ( $wp_version_ok ? 'ok' : 'fail' ) . '">' . ( $wp_version_ok ? 'OK' : '需要更新' ) . '</td>';
	echo '</tr>';

	$php_version     = phpversion();
	$php_min_version = '7.4';
	$php_version_ok  = version_compare( $php_version, $php_min_version, '>=' );

	echo '<tr>';
	echo '<td>PHP 版本</td>';
	echo '<td>当前版本: ' . esc_html( $php_version ) . ' (最低要求: ' . esc_html( $php_min_version ) . ')</td>';
	echo '<td class="status-' . ( $php_version_ok ? 'ok' : 'fail' ) . '">' . ( $php_version_ok ? 'OK' : '需要更新' ) . '</td>';
	echo '</tr>';

	$smtp_configured = pw_check_smtp_configured();

	echo '<tr>';
	echo '<td>SMTP 配置</td>';
	echo '<td>检查是否已配置SMTP</td>';
	echo '<td class="status-' . ( $smtp_configured ? 'ok' : 'fail' ) . '">' . ( $smtp_configured ? 'OK' : '未配置' ) . '</td>';
	echo '</tr>';

	echo '</tbody>';
	echo '</table>';

	echo '<style>
        .pw-status-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        .pw-status-table th, .pw-status-table td {
            padding: 12px 15px;
            border: 1px solid #ddd;
        }
        .pw-status-table th {
            background-color: #f5f5f5;
            font-weight: bold;
            text-align: left;
        }
        .pw-status-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .status-ok {
            color: #2ecc71;
            font-weight: bold;
        }
        .status-fail {
            color: #e74c3c;
            font-weight: bold;
        }
        .status-warning {
            color: #f39c12;
            font-weight: bold;
        }
    </style>';

	echo '</div>';
}

/**
 * Product Requirement 页签
 */
function pw_render_product_request_tab() {
	echo '<div class="tab-pane">';
	echo '<h2>产品需求</h2>';

	echo '<div id="pw-form-messages" style="display: none;"></div>';

	echo '<div class="pw-product-request-form">';
	echo '<p class="pw-form-intro">我们对新产品充满热情，并珍视您提供的每一条建议。如果您发现了有趣的产品，请告诉我们！</p>';

	echo '<form method="post" action="" enctype="multipart/form-data" id="pw_product_request_form">';
	wp_nonce_field( 'pw_product_request', 'pw_product_request_nonce' );

	echo '<p class="pw-form-instruction">只需填写任意一个字段</p>';

	echo '<div class="pw-form-field">';
	echo '<label for="pw_product_description">描述</label>';
	echo '<textarea id="pw_product_description" name="pw_product_description" rows="4"></textarea>';
	echo '</div>';

	echo '<div class="pw-form-field">';
	echo '<label for="pw_product_link">产品链接</label>';
	echo '<input type="url" id="pw_product_link" name="pw_product_link">';
	echo '</div>';

	echo '<div class="pw-form-field">';
	echo '<label for="pw_product_image">图片</label>';
	echo '<div class="pw-image-upload-container">';
	echo '<input type="file" id="pw_product_image" name="pw_product_image" accept="image/*" style="display:none;">';
	echo '<div class="pw-image-upload-box" onclick="document.getElementById(\'pw_product_image\').click();">';
	echo '<span class="dashicons dashicons-plus"></span>';
	echo '</div>';
	echo '<div id="pw_image_preview" class="pw-image-preview"></div>';
	echo '</div>';
	echo '</div>';

	echo '<div class="pw-form-submit">';
	echo '<button type="submit" name="pw_submit_product_request" class="button pw-support-button">Submit</button>';
	echo '</div>';

	echo '</form>';
	echo '</div>';

	$nonce_js = wp_create_nonce( 'pw_product_request_nonce' );

	echo '<script>
        jQuery(document).ready(function($) {
            $("#pw_product_image").change(function() {
                var file = this.files[0];
                if (file) {
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        $("#pw_image_preview").html("<img src=\'" + e.target.result + "\' alt=\'预览图片\' />");
                    }
                    reader.readAsDataURL(file);
                }
            });

            $("#pw_product_request_form").on("submit", function(e) {
                e.preventDefault();

                var formData = new FormData(this);
                formData.append("action", "pw_submit_product_request");
                formData.append("nonce", "' . $nonce_js . '");

                $(".pw-support-button").prop("disabled", true).text("Submitting...");

                $.ajax({
                    url: ajaxurl,
                    type: "POST",
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function(response) {
                        if (response.success) {
                            $("#pw-form-messages").html(
                                "<div class=\"notice notice-success is-dismissible\"><p>" + response.data + "</p></div>"
                            ).show();
                            $("#pw_product_request_form")[0].reset();
                            $("#pw_image_preview").html("");
                        } else {
                            $("#pw-form-messages").html(
                                "<div class=\"notice notice-error is-dismissible\"><p>" + response.data + "</p></div>"
                            ).show();
                        }
                    },
                    error: function() {
                        $("#pw-form-messages").html(
                            "<div class=\"notice notice-error is-dismissible\"><p>An error occurred. Please try again.</p></div>"
                        ).show();
                    },
                    complete: function() {
                        $(".pw-support-button").prop("disabled", false).text("Submit");
                        $("html, body").animate({
                            scrollTop: $(\"#pw-form-messages\").offset().top - 100
                        }, 500);
                    }
                });
            });
        });
    </script>';

	echo '<style>
        .pw-product-request-form {
            max-width: 800px;
            margin: 20px auto;
            background: #fff;
            border-radius: 8px;
            padding: 25px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .pw-form-intro {
            text-align: center;
            margin-bottom: 30px;
            color: #666;
            font-size: 15px;
        }
        .pw-form-instruction {
            text-align: center;
            font-weight: bold;
            margin-bottom: 25px;
            color: #555;
        }
        .pw-form-field {
            margin-bottom: 20px;
            display: flex;
            align-items: flex-start;
        }
        .pw-form-field label {
            width: 120px;
            padding-top: 8px;
            font-weight: 500;
            color: #444;
        }
        .pw-form-field textarea,
        .pw-form-field input[type="url"] {
            flex: 1;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            width: 100%;
            background-color: #f9f9f9;
            transition: all 0.3s ease;
        }
        .pw-form-field textarea:focus,
        .pw-form-field input[type="url"]:focus {
            border-color: #aaa;
            background-color: #fff;
            box-shadow: 0 0 5px rgba(0,0,0,0.1);
            outline: none;
        }
        .pw-image-upload-container {
            flex: 1;
        }
        .pw-image-upload-box {
            border: 2px dashed #ddd;
            border-radius: 4px;
            width: 100%;
            height: 120px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            background-color: #f9f9f9;
            transition: all 0.3s ease;
        }
        .pw-image-upload-box:hover {
            border-color: #aaa;
            background-color: #f5f5f5;
        }
        .pw-image-upload-box .dashicons {
            font-size: 35px;
            color: #aaa;
            transition: all 0.3s ease;
        }
        .pw-image-upload-box:hover .dashicons {
            color: #777;
        }
        .pw-image-preview {
            margin-top: 15px;
            text-align: center;
        }
        .pw-image-preview img {
            max-width: 100%;
            max-height: 180px;
            border-radius: 4px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .pw-form-submit {
            text-align: center;
            margin-top: 30px;
        }
        @media (max-width: 782px) {
            .pw-form-field {
                flex-direction: column;
            }
            .pw-form-field label {
                width: 100%;
                margin-bottom: 8px;
            }
        }
    </style>';

	echo '</div>';
}

/**
 * Support 页签
 */
function pw_render_support_tab() {
	echo '<div class="tab-pane">';
	echo '<h2>Support</h2>';

	echo '<div class="pw-support-cards">';

	echo '<div class="pw-support-card">';
	echo '<h3>需要帮助？联系我们！</h3>';
	echo '<p>有任何问题或需要支持，请随时联系我们。我们的团队随时准备为您提供帮助。</p>';
	echo '<a href="#" class="button pw-support-button">联系支持</a>';
	echo '</div>';

	echo '<div class="pw-support-card">';
	echo '<h3>阅读我们的常见问题</h3>';
	echo '<p>查看我们的常见问题解答，了解关于产品、功能和使用方法的常见问题及解答。</p>';
	echo '<a href="#" class="button pw-support-button">查看常见问题</a>';
	echo '</div>';

	echo '<div class="pw-support-card">';
	echo '<h3>集成帮助</h3>';
	echo '<p>需要帮助集成我们的产品？查看我们的集成指南，或联系我们的技术支持团队获取帮助。</p>';
	echo '<a href="#" class="button pw-support-button">查看集成指南</a>';
	echo '</div>';

	echo '</div>';

	echo '<style>
        .pw-support-cards {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin-top: 20px;
        }
        .pw-support-card {
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 20px;
            width: calc(33.33% - 14px);
            box-sizing: border-box;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .pw-support-card h3 {
            margin-top: 0;
        }
        .pw-support-button {
            background-color: #f7a738;
            border-color: #f7a738;
            color: #fff;
            text-align: center;
            margin-top: 10px;
        }
        .pw-support-button:hover {
            background-color: #e59826;
            border-color: #e59826;
            color: #fff;
        }
        @media (max-width: 782px) {
            .pw-support-card {
                width: 100%;
            }
        }
    </style>';

	echo '</div>';
}

