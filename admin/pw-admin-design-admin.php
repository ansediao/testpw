<?php

/**
 * 渲染设计管理页面
 *
 * @since 1.0.0
 */
function pw_manage_designs_page() {
	// 权限检查
	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_die( __( 'You do not have sufficient permissions to access this page.' ) );
	}

	require_once plugin_dir_path( dirname( __FILE__ ) ) . 'admin/partials/pw-admin-design-management-display.php';
}

/**
 * 获取设计数据用于编辑
 */
function pw_get_design_data() {
	if ( ! isset( $_POST['nonce'] ) || ! wp_verify_nonce( $_POST['nonce'], 'pw_admin_nonce' ) ) {
		wp_send_json_error( 'Invalid nonce' );
		return;
	}

	$design_id = isset( $_POST['design_id'] ) ? (int) $_POST['design_id'] : 0;
	if ( ! $design_id ) {
		wp_send_json_error( 'Invalid design ID' );
		return;
	}

	$design = get_post( $design_id );
	if ( ! $design || $design->post_type !== 'pw_design' ) {
		wp_send_json_error( 'Design not found' );
		return;
	}

	// 分类
	$categories = get_terms(
		array(
			'taxonomy'   => 'pw_design_category',
			'hide_empty' => false,
		)
	);

	$categories_data = array();
	if ( ! empty( $categories ) && ! is_wp_error( $categories ) ) {
		foreach ( $categories as $category ) {
			$categories_data[] = array(
				'id'   => $category->term_id,
				'name' => $category->name,
			);
		}
	}

	$current_categories = wp_get_post_terms( $design_id, 'pw_design_category' );
	$current_category   = ! empty( $current_categories ) ? $current_categories[0]->term_id : '';

	// 标签
	$tags        = wp_get_post_terms(
		$design_id,
		'pw_design_tag',
		array(
			'fields' => 'names',
		)
	);
	$tags_string = ! empty( $tags ) && ! is_wp_error( $tags ) ? implode( ', ', $tags ) : '';

	// 基础 meta
	$enabled        = get_post_meta( $design_id, '_pw_design_enabled', true );
	$description    = get_post_meta( $design_id, '_pw_design_description', true );
	$priority       = get_post_meta( $design_id, '_pw_design_priority', true );
	$featured       = get_post_meta( $design_id, '_pw_design_featured', true );
	$visibility     = get_post_meta( $design_id, '_pw_design_visibility', true );
	$allow_download = get_post_meta( $design_id, '_pw_design_allow_download', true );

	// 高级设置字段
	$exclude_export       = get_post_meta( $design_id, '_design_exclude_export', true );
	$layer_depth          = get_post_meta( $design_id, '_design_layer_depth', true );
	$scale_mode           = get_post_meta( $design_id, '_design_scale_mode', true );
	$stay_on_top          = get_post_meta( $design_id, '_design_stay_on_top', true );
	$auto_select          = get_post_meta( $design_id, '_design_auto_select', true );
	$rotatable            = get_post_meta( $design_id, '_design_rotatable', true );
	$removable            = get_post_meta( $design_id, '_design_removable', true );
	$movable              = get_post_meta( $design_id, '_design_movable', true );
	$scalable             = get_post_meta( $design_id, '_design_scalable', true );
	$proportional_scaling = get_post_meta( $design_id, '_design_proportional_scaling', true );
	$scale_by             = get_post_meta( $design_id, '_design_scale_by', true );
	$min_scale_limit      = get_post_meta( $design_id, '_design_min_scale_limit', true );
	$price                = get_post_meta( $design_id, '_design_price', true );
	$sku                  = get_post_meta( $design_id, '_design_sku', true );

	$response_data = array(
		'id'               => $design_id,
		'name'             => $design->post_title,
		'description'      => $description,
		'categories'       => $categories_data,
		'current_category' => $current_category,
		'tags'             => $tags_string,
		'enabled'          => ! empty( $enabled ),
		'priority'         => ! empty( $priority ) ? (int) $priority : 0,
		'featured'         => ! empty( $featured ),
		'visibility'       => ! empty( $visibility ) ? $visibility : 'public',
		'allow_download'   => ! empty( $allow_download ),

		// 高级设置字段
		'exclude_export'       => ! empty( $exclude_export ),
		'layer_depth'          => ! empty( $layer_depth ) ? (int) $layer_depth : 1,
		'scale_mode'           => ! empty( $scale_mode ) ? $scale_mode : 'fit',
		'stay_on_top'          => ! empty( $stay_on_top ),
		'auto_select'          => ! empty( $auto_select ),
		'rotatable'            => ! empty( $rotatable ),
		'removable'            => ! empty( $removable ),
		'movable'              => ! empty( $movable ),
		'scalable'             => ! empty( $scalable ),
		'proportional_scaling' => ! empty( $proportional_scaling ),
		'scale_by'             => ! empty( $scale_by ) ? $scale_by : 'factor',
		'min_scale_limit'      => ! empty( $min_scale_limit ) ? (float) $min_scale_limit : 0.2,
		'price'                => ! empty( $price ) ? (float) $price : 0,
		'sku'                  => ! empty( $sku ) ? $sku : '',
	);

	wp_send_json_success( $response_data );
}
add_action( 'wp_ajax_pw_get_design_data', 'pw_get_design_data' );

/**
 * 更新设计 meta 信息
 */
function pw_update_design_meta() {
	if ( ! isset( $_POST['nonce'] ) || ! wp_verify_nonce( $_POST['nonce'], 'pw_admin_nonce' ) ) {
		wp_send_json_error( 'Invalid nonce' );
		return;
	}

	$design_id = isset( $_POST['design_id'] ) ? (int) $_POST['design_id'] : 0;
	if ( ! $design_id ) {
		wp_send_json_error( 'Invalid design ID' );
		return;
	}

	$design = get_post( $design_id );
	if ( ! $design || $design->post_type !== 'pw_design' ) {
		wp_send_json_error( 'Design not found' );
		return;
	}

	// 标题
	if ( ! empty( $_POST['design_name'] ) ) {
		wp_update_post(
			array(
				'ID'         => $design_id,
				'post_title' => sanitize_text_field( wp_unslash( $_POST['design_name'] ) ),
			)
		);
	}

	// 描述
	if ( isset( $_POST['design_description'] ) ) {
		update_post_meta(
			$design_id,
			'_pw_design_description',
			sanitize_textarea_field( wp_unslash( $_POST['design_description'] ) )
		);
	}

	// 分类
	if ( ! empty( $_POST['design_category'] ) ) {
		wp_set_post_terms(
			$design_id,
			array( (int) $_POST['design_category'] ),
			'pw_design_category'
		);
	} else {
		wp_set_post_terms( $design_id, array(), 'pw_design_category' );
	}

	// 标签
	if ( isset( $_POST['design_tags'] ) ) {
		$tags_raw = wp_unslash( $_POST['design_tags'] );
		$tags     = array_map( 'trim', explode( ',', $tags_raw ) );
		$tags     = array_filter( $tags );
		wp_set_post_terms( $design_id, $tags, 'pw_design_tag' );
	}

	// 启用状态
	$enabled = isset( $_POST['design_enabled'] ) ? '1' : '0';
	update_post_meta( $design_id, '_pw_design_enabled', $enabled );

	// 高级设置
	if ( isset( $_POST['design_priority'] ) ) {
		update_post_meta( $design_id, '_pw_design_priority', (int) $_POST['design_priority'] );
	}

	$featured = isset( $_POST['design_featured'] ) ? '1' : '0';
	update_post_meta( $design_id, '_pw_design_featured', $featured );

	if ( isset( $_POST['design_visibility'] ) ) {
		$visibility = sanitize_text_field( wp_unslash( $_POST['design_visibility'] ) );
		if ( in_array( $visibility, array( 'public', 'private', 'draft' ), true ) ) {
			update_post_meta( $design_id, '_pw_design_visibility', $visibility );
		}
	}

	$allow_download = isset( $_POST['design_allow_download'] ) ? '1' : '0';
	update_post_meta( $design_id, '_pw_design_allow_download', $allow_download );

	// 高级字段
	$exclude_export = isset( $_POST['design_exclude_export'] ) ? '1' : '0';
	update_post_meta( $design_id, '_design_exclude_export', $exclude_export );

	if ( isset( $_POST['design_layer_depth'] ) ) {
		update_post_meta( $design_id, '_design_layer_depth', (int) $_POST['design_layer_depth'] );
	}

	if ( isset( $_POST['design_scale_mode'] ) ) {
		$scale_mode = sanitize_text_field( wp_unslash( $_POST['design_scale_mode'] ) );
		if ( in_array( $scale_mode, array( 'fit', 'fill', 'stretch', 'none' ), true ) ) {
			update_post_meta( $design_id, '_design_scale_mode', $scale_mode );
		}
	}

	update_post_meta( $design_id, '_design_stay_on_top', isset( $_POST['design_stay_on_top'] ) ? '1' : '0' );
	update_post_meta( $design_id, '_design_auto_select', isset( $_POST['design_auto_select'] ) ? '1' : '0' );
	update_post_meta( $design_id, '_design_rotatable', isset( $_POST['design_rotatable'] ) ? '1' : '0' );
	update_post_meta( $design_id, '_design_removable', isset( $_POST['design_removable'] ) ? '1' : '0' );
	update_post_meta( $design_id, '_design_movable', isset( $_POST['design_movable'] ) ? '1' : '0' );
	update_post_meta( $design_id, '_design_scalable', isset( $_POST['design_scalable'] ) ? '1' : '0' );
	update_post_meta( $design_id, '_design_proportional_scaling', isset( $_POST['design_proportional_scaling'] ) ? '1' : '0' );

	if ( isset( $_POST['design_scale_by'] ) ) {
		$scale_by = sanitize_text_field( wp_unslash( $_POST['design_scale_by'] ) );
		if ( in_array( $scale_by, array( 'factor', 'percentage', 'pixels' ), true ) ) {
			update_post_meta( $design_id, '_design_scale_by', $scale_by );
		}
	}

	if ( isset( $_POST['design_min_scale_limit'] ) ) {
		update_post_meta( $design_id, '_design_min_scale_limit', (float) $_POST['design_min_scale_limit'] );
	}

	if ( isset( $_POST['design_price'] ) ) {
		update_post_meta( $design_id, '_design_price', (float) $_POST['design_price'] );
	}

	if ( isset( $_POST['design_sku'] ) ) {
		$sku = sanitize_text_field( wp_unslash( $_POST['design_sku'] ) );
		update_post_meta( $design_id, '_design_sku', $sku );
	}

	wp_send_json_success( 'Design updated successfully' );
}
add_action( 'wp_ajax_pw_update_design_meta', 'pw_update_design_meta' );

// AJAX handler for adding new design - DISABLED to avoid conflict with class method.
// add_action( 'wp_ajax_pw_add_design', 'pw_add_design' );
function pw_add_design() {
	error_log( 'PW Design Upload (Global Function) - Function called' );
	error_log( 'PW Design Upload (Global Function) - POST data: ' . print_r( $_POST, true ) );
	error_log( 'PW Design Upload (Global Function) - FILES data: ' . print_r( $_FILES, true ) );

	// 权限检查
	error_log(
		'PW Design Upload (Global Function) - Current user can edit_posts: ' .
		( current_user_can( 'edit_posts' ) ? 'YES' : 'NO' )
	);
	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_send_json_error( 'Security check failed.' );
		return;
	}

	// 基本字段校验
	if ( empty( $_POST['design_name'] ) ) {
		wp_send_json_error( '设计名称不能为空' );
		return;
	}

	if ( empty( $_FILES['design_image'] ) ) {
		wp_send_json_error( '请选择设计图片' );
		return;
	}

	$design_name     = sanitize_text_field( wp_unslash( $_POST['design_name'] ) );
	$design_category = isset( $_POST['design_category'] ) ? (int) $_POST['design_category'] : 0;

	if ( ! function_exists( 'wp_handle_upload' ) ) {
		require_once ABSPATH . 'wp-admin/includes/file.php';
	}

	$uploadedfile = $_FILES['design_image'];

	$upload_overrides = array(
		'test_form' => false,
		'mimes'     => array(
			'jpg|jpeg|jpe' => 'image/jpeg',
			'gif'          => 'image/gif',
			'png'          => 'image/png',
			'svg'          => 'image/svg+xml',
		),
	);

	error_log( 'PW Design Upload (Global Function) - File type: ' . $uploadedfile['type'] );
	error_log( 'PW Design Upload (Global Function) - Upload overrides: ' . print_r( $upload_overrides, true ) );

	$movefile = wp_handle_upload( $uploadedfile, $upload_overrides );

	if ( $movefile && ! isset( $movefile['error'] ) ) {
		$post_data = array(
			'post_title'   => $design_name,
			'post_content' => '',
			'post_status'  => 'publish',
			'post_type'    => 'pw_design',
		);

		$post_id = wp_insert_post( $post_data );

		if ( $post_id && ! is_wp_error( $post_id ) ) {
			$attachment = array(
				'post_mime_type' => $movefile['type'],
				'post_title'     => $design_name,
				'post_content'   => '',
				'post_status'    => 'inherit',
			);

			$attach_id = wp_insert_attachment( $attachment, $movefile['file'], $post_id );

			if ( $attach_id && ! is_wp_error( $attach_id ) ) {
				if ( ! function_exists( 'wp_generate_attachment_metadata' ) ) {
					require_once ABSPATH . 'wp-admin/includes/image.php';
				}
				$attach_data = wp_generate_attachment_metadata( $attach_id, $movefile['file'] );
				wp_update_attachment_metadata( $attach_id, $attach_data );

				set_post_thumbnail( $post_id, $attach_id );
			}

			if ( $design_category > 0 ) {
				wp_set_post_terms( $post_id, array( $design_category ), 'pw_design_category' );
			}

			wp_send_json_success(
				array(
					'post_id' => $post_id,
					'message' => '设计添加成功',
				)
			);
		} else {
			// 创建失败，删除上传的文件
			if ( isset( $movefile['file'] ) && file_exists( $movefile['file'] ) ) {
				unlink( $movefile['file'] );
			}
			wp_send_json_error( '创建设计文章失败' );
		}
	} else {
		wp_send_json_error(
			'文件上传失败：' . ( isset( $movefile['error'] ) ? $movefile['error'] : '未知错误' )
		);
	}
}