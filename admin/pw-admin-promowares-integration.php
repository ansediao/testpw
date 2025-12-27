<?php

// 获取API数据 - 使用新的API类
function get_products_from_api() {
	$api = new Pw_Admin_Promowares_Api();
	return $api->get_products_from_api();
}

// 获取组合产品API数据
function get_composite_products_from_api() {
	$api = new Pw_Admin_Promowares_Api();
	return $api->get_composite_products_from_api();
}

// 获取容器信息
function get_container_info( $container_id ) {
	$api = new Pw_Admin_Promowares_Api();
	return $api->get_container_info( $container_id );
}

// 调度产品导入任务
function schedule_product_import() {
	// 导入单个产品
	$products = get_products_from_api();
	if ( ! empty( $products ) ) {
		foreach ( $products as $product ) {
			// 为每个产品添加一个任务到 Action Scheduler
			as_schedule_single_action( time(), 'import_single_product', array( $product ) );
		}
	}

	// 导入组合产品
	$composite_products = get_composite_products_from_api();
	if ( ! empty( $composite_products ) ) {
		foreach ( $composite_products as $composite_group ) {
			// 为每个组合产品组添加一个任务到 Action Scheduler
			as_schedule_single_action( time(), 'import_composite_product_group', array( $composite_group ) );
		}
	}
}

// 处理单个产品导入
function import_single_product( $product ) {
	// 创建 WooCommerce 产品
	$post_id = wp_insert_post(
		array(
			'post_title'   => $product['name'],
			'post_content' => $product['description'],
			'post_excerpt' => $product['short_description'],
			'post_status'  => 'publish',
			'post_type'    => 'product',
		)
	);

	if ( ! $post_id ) {
		return;
	}

	// 设置产品元数据
	update_post_meta( $post_id, 'pw_id', $product['id'] );
	update_post_meta( $post_id, 'pw_blank_item', $product['blank_item'] );
	update_post_meta( $post_id, 'pw_inquiry_button', $product['inquiry_button'] );
	update_post_meta( $post_id, '_price', $product['price'] );
	update_post_meta( $post_id, '_regular_price', $product['anchor_price'] );
	update_post_meta( $post_id, '_sku', $product['sku'] );
	update_post_meta( $post_id, 'pw_isSyncProduct', true );

	// 获取并保存产品视图数据
	$api   = new Pw_Admin_Promowares_Api();
	$token = get_option( 'pw_api_token', '' );

	if ( ! empty( $product['id'] ) ) {
		$templates_response = $api->get_product_templates( $product['id'], $token );

		if (
			! is_wp_error( $templates_response )
			&& isset( $templates_response['data']['custom_view']['main_custom_view']['layer_config'] )
		) {
			$pw_main_custom_view = $templates_response['data']['custom_view']['main_custom_view'];
			update_post_meta( $post_id, 'pw_main_custom_view', $pw_main_custom_view );

			$pw_sub_custom_view = $templates_response['data']['custom_view']['sub_custom_view'];
			update_post_meta( $post_id, 'pw_sub_custom_view', $pw_sub_custom_view );

			// 记录成功日志
			error_log( 'Layer config saved for product ID: ' . $product['id'] . ', WooCommerce ID: ' . $post_id );
		} else {
			// 记录错误日志
			if ( is_wp_error( $templates_response ) ) {
				error_log(
					'Failed to fetch layer config for product ID: ' . $product['id'] .
					', Error: ' . $templates_response->get_error_message()
				);
			} else {
				error_log( 'Layer config not found in API response for product ID: ' . $product['id'] );
			}
		}
	}

	// 设置封面图片
	if ( ! empty( $product['product_image'] ) ) {
		pw_set_product_featured_image( $post_id, $product['product_image'] );
	}
}

// 处理组合产品组导入
function import_composite_product_group( $composite_group ) {
	if ( empty( $composite_group['main_product_id'] ) || empty( $composite_group['products'] ) ) {
		return;
	}

	$main_product_id     = $composite_group['main_product_id'];
	$products            = $composite_group['products'];
	$created_product_ids = array();
	$main_post_id        = null;
	$group_post_id       = null; // 独立的分组产品（Grouped Product）

	// 导入组合产品组中的所有产品
	foreach ( $products as $product ) {
		$post_id = wp_insert_post(
			array(
				'post_title'   => $product['name'],
				'post_content' => $product['description'],
				'post_excerpt' => $product['short_description'],
				'post_status'  => 'publish',
				'post_type'    => 'product',
			)
		);

		if ( ! $post_id ) {
			continue;
		}

		// 设置产品元数据
		update_post_meta( $post_id, 'pw_id', $product['id'] );
		update_post_meta( $post_id, 'pw_blank_item', $product['blank_item'] );
		update_post_meta( $post_id, 'pw_inquiry_button', $product['inquiry_button'] );
		update_post_meta( $post_id, '_price', $product['price'] );
		update_post_meta( $post_id, '_regular_price', $product['anchor_price'] );
		update_post_meta( $post_id, '_sku', $product['sku'] );
		update_post_meta( $post_id, 'pw_isSyncProduct', true );
		update_post_meta( $post_id, 'pw_product_type', $product['product_type'] );

		// 设置封面图片
		if ( ! empty( $product['product_image'] ) ) {
			pw_set_product_featured_image( $post_id, $product['product_image'] );
		}

		// 记录创建的产品ID
		$created_product_ids[ $product['id'] ] = $post_id;

		// 如果是主产品，记录其WordPress ID
		if ( $product['id'] == $main_product_id ) {
			$main_post_id = $post_id;
			// 标记为组合产品主产品
			update_post_meta( $post_id, 'pw_is_composite_main', true );
			update_post_meta( $post_id, 'pw_composite_main_id', $main_product_id );
		}
	}

	// 创建独立的分组产品并建立关联关系
	if ( $main_post_id && ! empty( $created_product_ids ) ) {
		$related_product_ids = array();

		foreach ( $created_product_ids as $pw_id => $wp_post_id ) {
			// 将主产品与所有子产品都作为 Linked Products
			$related_product_ids[] = $wp_post_id;
			// 为每个产品设置主产品关联信息（便于前端与展示）
			update_post_meta( $wp_post_id, 'pw_composite_main_id', $main_product_id );
			update_post_meta( $wp_post_id, 'pw_composite_main_post_id', $main_post_id );
		}

		$related_product_ids = array_values( array_diff( $related_product_ids, array( $main_post_id ) ) );

		// 为主产品设置关联产品列表
		update_post_meta( $main_post_id, 'pw_composite_related_products', $related_product_ids );
		update_post_meta( $main_post_id, 'pw_composite_all_product_ids', array_values( $created_product_ids ) );

		// 创建一个独立的分组产品（Grouped Product）
		$group_title   = get_the_title( $main_post_id ) . ' - Group';
		$group_post_id = wp_insert_post(
			array(
				'post_title'   => $group_title,
				'post_status'  => 'publish',
				'post_type'    => 'product',
				'post_content' => '',
			)
		);

		if ( $group_post_id ) {
			// 设置为 Grouped Product 类型
			wp_set_object_terms( $group_post_id, 'grouped', 'product_type' );

			// 标记这是一个系统创建的分组产品，供后台隐藏
			update_post_meta( $group_post_id, 'pw_is_composite_group', true );
			update_post_meta( $group_post_id, 'pw_composite_main_id', $main_product_id );
			update_post_meta( $group_post_id, 'pw_composite_main_post_id', $main_post_id );

			// 将主产品和子产品都作为 Linked Products
			update_post_meta( $group_post_id, '_children', $related_product_ids );

			$related_product_ids[] = $group_post_id;
			update_post_meta( $main_post_id, 'pw_composite_related_products', $related_product_ids );
		}

		// 获取主产品的 container_id 并处理容器规则
		$main_product_data = null;
		foreach ( $products as $product ) {
			if ( $product['id'] == $main_product_id ) {
				$main_product_data = $product;
				break;
			}
		}

		if ( $main_product_data && ! empty( $main_product_data['container_id'] ) ) {
			// 为容器规则处理添加一个任务到 Action Scheduler
			error_log( 'Scheduling container rules processing for container_id: ' . $main_product_data['container_id'] );

			$args_json = wp_json_encode(
				array(
					'container_id'        => $main_product_data['container_id'],
					'composite_group'     => $composite_group,
					'created_product_ids' => $created_product_ids,
				)
			);

			$scheduled = as_schedule_single_action( time() + 5, 'process_container_rules', array( $args_json ) );

			if ( $scheduled ) {
				error_log( 'Container rules task scheduled successfully with ID: ' . $scheduled );
			} else {
				error_log( 'Failed to schedule container rules task' );
			}
		} else {
			$container_id_log = isset( $main_product_data['container_id'] ) ? $main_product_data['container_id'] : 'not set';
			error_log( 'Container rules processing not scheduled. Main product container_id: ' . $container_id_log );
		}
	}
}

// 处理容器规则
function process_container_rules( $args_json ) {
	$args = json_decode( $args_json, true );

	if ( ! $args || ! is_array( $args ) ) {
		error_log( 'Failed to decode JSON arguments for process_container_rules: ' . var_export( $args_json, true ) );
		return;
	}

	if ( isset( $args['container_id'], $args['composite_group'], $args['created_product_ids'] ) ) {
		$container_id        = $args['container_id'];
		$composite_group     = $args['composite_group'];
		$created_product_ids = $args['created_product_ids'];
	} else {
		error_log( 'Missing required arguments in process_container_rules: ' . var_export( $args, true ) );
		return;
	}

	if ( ! $container_id || empty( $created_product_ids ) ) {
		error_log(
			'Container rules processing skipped: container_id=' . var_export( $container_id, true ) .
			', created_product_ids=' . var_export( $created_product_ids, true )
		);
		return;
	}

	if ( (int) $container_id === 0 ) {
		error_log( 'Container rules processing skipped: container_id is 0' );
		return;
	}

	// 获取容器信息
	error_log( 'Getting container info for container_id: ' . $container_id );
	$container_info = get_container_info( $container_id );

	if ( ! $container_info ) {
		error_log( 'Failed to get container info for container_id: ' . $container_id );
		return;
	}

	if ( empty( $container_info['label_values'] ) ) {
		error_log( 'No label_values found in container info: ' . wp_json_encode( $container_info ) );
		return;
	}

	error_log( 'Container info retrieved successfully: ' . wp_json_encode( $container_info ) );

	foreach ( $container_info['label_values'] as $label_value ) {
		$pw_product_id    = $label_value['product_id'];
		$label_value_text = $label_value['label_value'];
		$is_default       = $label_value['is_default'];

		if ( isset( $created_product_ids[ $pw_product_id ] ) ) {
			$wp_post_id = $created_product_ids[ $pw_product_id ];

			update_post_meta( $wp_post_id, 'pw_container_id', $container_id );
			update_post_meta( $wp_post_id, 'pw_container_value', $label_value_text );
			update_post_meta( $wp_post_id, 'pw_container_name', $container_info['container_name'] );
			update_post_meta( $wp_post_id, 'pw_container_label', $container_info['container_label'] );
			update_post_meta( $wp_post_id, 'pw_container_is_default', $is_default );

			error_log(
				"Container rule applied: Product ID {$pw_product_id} (WP ID: {$wp_post_id}) -> Container Value: {$label_value_text}"
			);
		}
	}
}

/**
 * Set product featured image from URL.
 *
 * @param int    $product_id WooCommerce product ID.
 * @param string $image_url  Image URL to set as featured image.
 * @return bool
 */
function pw_set_product_featured_image( $product_id, $image_url ) {
	if ( empty( $image_url ) || empty( $product_id ) ) {
		return false;
	}

	$image_data = wp_remote_get( $image_url );
	if ( is_wp_error( $image_data ) || 200 !== wp_remote_retrieve_response_code( $image_data ) ) {
		return false;
	}

	$image_body = wp_remote_retrieve_body( $image_data );
	if ( empty( $image_body ) ) {
		return false;
	}

	$file_info = pathinfo( $image_url );
	$filename  = sanitize_file_name( $file_info['basename'] );

	if ( empty( $file_info['extension'] ) ) {
		$content_type = wp_remote_retrieve_header( $image_data, 'content-type' );
		$extension    = '';

		switch ( $content_type ) {
			case 'image/jpeg':
				$extension = '.jpg';
				break;
			case 'image/png':
				$extension = '.png';
				break;
			case 'image/gif':
				$extension = '.gif';
				break;
			case 'image/webp':
				$extension = '.webp';
				break;
		}
		$filename .= $extension;
	}

	$upload = wp_upload_bits( $filename, null, $image_body );
	if ( ! empty( $upload['error'] ) ) {
		return false;
	}

	$filetype   = wp_check_filetype( $upload['file'] );
	$attachment = array(
		'post_mime_type' => $filetype['type'],
		'post_title'     => sanitize_text_field( $filename ),
		'post_content'   => '',
		'post_status'    => 'inherit',
	);

	$attachment_id = wp_insert_attachment( $attachment, $upload['file'] );
	if ( is_wp_error( $attachment_id ) ) {
		return false;
	}

	require_once ABSPATH . 'wp-admin/includes/image.php';
	$attachment_data = wp_generate_attachment_metadata( $attachment_id, $upload['file'] );
	wp_update_attachment_metadata( $attachment_id, $attachment_data );

	set_post_thumbnail( $product_id, $attachment_id );

	return true;
}

/**
 * Get attachment ID by URL.
 *
 * @param string $url Image URL.
 * @return int|false
 */
function pw_get_attachment_by_url( $url ) {
	global $wpdb;

	$attachment = $wpdb->get_col(
		$wpdb->prepare(
			"SELECT ID FROM {$wpdb->posts} WHERE guid=%s",
			$url
		)
	);

	if ( ! empty( $attachment ) ) {
		return (int) $attachment[0];
	}

	return false;
}

// 检查导入进度
add_action( 'wp_ajax_check_import_progress', 'check_import_progress' );
function check_import_progress() {
	$pending_actions = as_get_scheduled_actions(
		array(
			'status'   => 'pending',
			'hook'     => 'import_single_product',
			'per_page' => -1,
		)
	);

	$completed_actions = as_get_scheduled_actions(
		array(
			'status'   => 'complete',
			'hook'     => 'import_single_product',
			'per_page' => -1,
		)
	);

	$total     = count( $pending_actions ) + count( $completed_actions );
	$completed = count( $completed_actions );

	wp_send_json(
		array(
			'total'     => $total,
			'completed' => $completed,
		)
	);
}

// AJAX handler moved to Pw_Admin_Promowares_Api class
add_action(
	'wp_ajax_pw_proxy_api_request',
	function () {
		$api = new Pw_Admin_Promowares_Api();
		$api->handle_proxy_api_request();
	}
);

// 保存 token
add_action( 'wp_ajax_pw_save_token', 'pw_save_token' );
function pw_save_token() {
	if ( ! isset( $_POST['nonce'] ) || ! wp_verify_nonce( $_POST['nonce'], 'pw_save_token_nonce' ) ) {
		wp_send_json_error( '安全验证失败' );
		return;
	}

	if ( ! current_user_can( 'manage_options' ) ) {
		wp_send_json_error( '权限不足' );
		return;
	}

	$token = isset( $_POST['token'] ) ? sanitize_text_field( wp_unslash( $_POST['token'] ) ) : '';
	if ( $token === '' ) {
		wp_send_json_error( 'Token不能为空' );
		return;
	}

	$result = update_option( 'pw_api_token', $token );

	if ( $result ) {
		wp_send_json_success( 'Token保存成功' );
	} else {
		wp_send_json_error( 'Token保存失败' );
	}
}

// 清除产品数据缓存
add_action( 'wp_ajax_pw_clear_product_cache', 'pw_clear_product_cache' );
function pw_clear_product_cache() {
	if ( ! isset( $_POST['nonce'] ) || ! wp_verify_nonce( $_POST['nonce'], 'pw_clear_cache_nonce' ) ) {
		wp_send_json_error( '安全验证失败' );
		return;
	}

	if ( ! current_user_can( 'manage_options' ) ) {
		wp_send_json_error( '权限不足' );
		return;
	}

	$api        = new Pw_Admin_Promowares_Api();
	$product_id = isset( $_POST['product_id'] ) ? (int) $_POST['product_id'] : 0;

	if ( $product_id > 0 ) {
		$result = $api->clear_cached_product_data( $product_id );
		if ( $result ) {
			wp_send_json_success(
				array(
					'message' => "产品 ID {$product_id} 的缓存已清除",
				)
			);
		} else {
			wp_send_json_error( "清除产品 ID {$product_id} 的缓存失败" );
		}
	} else {
		$cleared_count = $api->clear_all_cached_product_data();
		wp_send_json_success(
			array(
				'message' => "已清除 {$cleared_count} 个产品的缓存数据",
			)
		);
	}
}

// 获取缓存状态
add_action( 'wp_ajax_pw_get_cache_status', 'pw_get_cache_status' );
function pw_get_cache_status() {
	if ( ! isset( $_POST['nonce'] ) || ! wp_verify_nonce( $_POST['nonce'], 'pw_cache_status_nonce' ) ) {
		wp_send_json_error( '安全验证失败' );
		return;
	}

	if ( ! current_user_can( 'manage_options' ) ) {
		wp_send_json_error( '权限不足' );
		return;
	}

	global $wpdb;

	$cache_count = $wpdb->get_var(
		"SELECT COUNT(*) FROM {$wpdb->postmeta} WHERE meta_key = '_pw_aggregated_data_cache'"
	);

	$expired_count = $wpdb->get_var(
		$wpdb->prepare(
			"SELECT COUNT(*) FROM {$wpdb->postmeta} pm1
             INNER JOIN {$wpdb->postmeta} pm2 ON pm1.post_id = pm2.post_id
             WHERE pm1.meta_key = '_pw_aggregated_data_cache'
             AND pm2.meta_key = '_pw_aggregated_data_cache_time'
             AND pm2.meta_value < %d",
			time() - 30 * 60
		)
	);

	$latest_cache = $wpdb->get_var(
		"SELECT MAX(meta_value) FROM {$wpdb->postmeta} WHERE meta_key = '_pw_aggregated_data_cache_time'"
	);

	$latest_cache_time = $latest_cache ? date( 'Y-m-d H:i:s', (int) $latest_cache ) : '无';

	wp_send_json_success(
		array(
			'total_cached'        => (int) $cache_count,
			'expired_count'       => (int) $expired_count,
			'latest_cache_time'   => $latest_cache_time,
			'cache_expiry_minutes'=> 30,
		)
	);
}