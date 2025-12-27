<?php

// 去掉后台产品列表中产品的“移至回收站”按钮
function remove_trash_button_from_product_list( $actions, $post ) {
	if ( $post->post_type === 'product' ) {
		$pw_isSyncProduct = get_post_meta( $post->ID, 'pw_isSyncProduct', true );
		if ( $pw_isSyncProduct == '1' ) {
			unset( $actions['trash'] );
		}
	}

	return $actions;
}
add_filter( 'post_row_actions', 'remove_trash_button_from_product_list', 10, 2 );

// 彻底移除 WooCommerce 产品复制功能和按钮（超级管理员除外）
function completely_remove_product_duplicate() {
	// 仅非管理员移除复制功能
	if ( ! current_user_can( 'manage_options' ) ) {
		// 移除行内按钮
		add_filter( 'post_row_actions', 'remove_duplicate_product_button', 10, 2 );

		// 移除批量操作中的复制选项
		add_filter( 'bulk_actions-edit-product', 'remove_duplicate_bulk_action' );

		// 移除复制产品功能
		remove_action(
			'admin_action_duplicate_product',
			array( 'WC_Admin_Duplicate_Product', 'duplicate_product_action' )
		);
	}
}
add_action( 'admin_init', 'completely_remove_product_duplicate' );

// 移除产品列表行操作中的复制按钮
function remove_duplicate_product_button( $actions, $post ) {
	if ( $post->post_type === 'product' ) {
		$pw_isSyncProduct = get_post_meta( $post->ID, 'pw_isSyncProduct', true );
		if ( $pw_isSyncProduct == '1' ) {
			unset( $actions['duplicate'] );
		}
	}

	return $actions;
}

// 移除批量操作中的复制选项（暂时保留复制功能）
function remove_duplicate_bulk_action( $actions ) {
	return $actions;
}

// 在产品名称列前添加 SYNC 标记
add_action( 'manage_product_posts_custom_column', 'custom_product_column_content', 10, 2 );
function custom_product_column_content( $column, $product_id ) {
	if ( $column === 'name' ) {
		$pw_isSyncProduct = get_post_meta( $product_id, 'pw_isSyncProduct', true );
		if ( $pw_isSyncProduct == '1' ) {
			echo '<span style="background-color: #000; color: #fff; padding: 2px 4px; border-radius: 2px; font-size: 10px; font-weight: bold; display: inline-block;">SYNC</span> ';
		}
	}
}

// 保存自定义数据到订单
function add_custom_data_to_order_items( $item, $cart_item_key, $values, $order ) {
	if ( isset( $values['custom_data'] ) ) {
		$item->add_meta_data(
			'定制设计',
			'<img src="' . esc_url( $values['custom_data']['custom_image'] ) . '" style="max-width:100px; height:auto;" />',
			true
		);
		$item->add_meta_data( '颜色', $values['custom_data']['color'], true );

		$download_link = '<a href="' . esc_url( $values['custom_data']['custom_image'] ) . '" target="_blank" download>下载设计图</a>';
		$item->add_meta_data( '设计下载', $download_link, false );
	}
}
add_action( 'woocommerce_checkout_create_order_line_item', 'add_custom_data_to_order_items', 10, 4 );

// 给后台订单中每一项添加一个按钮
function add_custom_button_to_order_items( $item_id, $item, $order ) {
	$custom_image = wc_get_order_item_meta( $item_id, '_custom_image', true );
	$custom_color = wc_get_order_item_meta( $item_id, '_custom_color', true );
	$product_name = $item->get_name();
	$product_id   = $item->get_product_id();

	if ( ! empty( $custom_image ) ) {
		echo '<div class="generate-pdf-button" style="margin-top: 10px;">
            <button type="button" class="button generate-pdf"
                data-item-id="' . esc_attr( $item_id ) . '"
                data-order-id="' . esc_attr( $order->get_id() ) . '"
                data-product-name="' . esc_attr( $product_name ) . '"
                data-product-id="' . esc_attr( $product_id ) . '"
                data-custom-image="' . esc_attr( $custom_image ) . '"
                data-custom-color="' . esc_attr( $custom_color ) . '">
                生成印刷文件PDF</button>
            <span class="spinner" style="float:none;"></span>
        </div>';
	}
}
add_action( 'woocommerce_after_order_itemmeta', 'add_custom_button_to_order_items', 10, 3 );

// 处理 AJAX 请求生成 PDF
function handle_generate_production_pdf() {
	if ( ! isset( $_POST['security'] ) || ! wp_verify_nonce( $_POST['security'], 'generate-pdf-nonce' ) ) {
		wp_send_json_error( '安全验证失败' );
		return;
	}

	$item_id  = isset( $_POST['item_id'] ) ? (int) $_POST['item_id'] : 0;
	$order_id = isset( $_POST['order_id'] ) ? (int) $_POST['order_id'] : 0;

	if ( ! $item_id || ! $order_id ) {
		wp_send_json_error( '参数无效' );
		return;
	}

	$order = wc_get_order( $order_id );
	if ( ! $order ) {
		wp_send_json_error( '订单不存在' );
		return;
	}

	$custom_image = wc_get_order_item_meta( $item_id, '_custom_image', true );
	$custom_color = wc_get_order_item_meta( $item_id, '_custom_color', true );

	if ( empty( $custom_image ) ) {
		wp_send_json_error( '没有找到自定义图片' );
		return;
	}

	$items        = $order->get_items();
	$product_name = '';
	$product_id   = 0;

	foreach ( $items as $item_key => $order_item ) {
		if ( (int) $item_key === (int) $item_id ) {
			$product_name = $order_item->get_name();
			$product_id   = $order_item->get_product_id();
			break;
		}
	}

	$pdf_file = generate_production_pdf( $order, $item_id, $product_name, $product_id, $custom_image, $custom_color );

	if ( $pdf_file ) {
		wp_send_json_success(
			array(
				'pdf_url' => $pdf_file['url'],
			)
		);
	} else {
		wp_send_json_error( '生成PDF失败' );
	}
}
add_action( 'wp_ajax_generate_production_pdf', 'handle_generate_production_pdf' );

// 生成生产单 PDF
function generate_production_pdf( $order, $item_id, $product_name, $product_id, $custom_image, $custom_color ) {
	$pdf = new jsPDF();

	$pdf->setProperties(
		array(
			'title'   => '生产单 - 订单 #' . $order->get_order_number(),
			'subject' => '生产单',
			'author'  => 'PW System',
			'creator' => 'PW Admin',
		)
	);

	$pdf->setFont( 'stsongstdlight', '', 10 );

	$pdf->setFontSize( 16 );
	$pdf->text( '生产单 - 订单 #' . $order->get_order_number(), 105, 20, array( 'align' => 'center' ) );
	$pdf->setFontSize( 10 );

	$date_created = $order->get_date_created();
	if ( $date_created instanceof WC_DateTime ) {
		$pdf->text( '订单日期: ' . $date_created->date( 'Y-m-d H:i:s' ), 20, 40 );
	}
	$pdf->text( '客户名称: ' . $order->get_billing_first_name() . ' ' . $order->get_billing_last_name(), 20, 50 );
	$pdf->text( '联系电话: ' . $order->get_billing_phone(), 20, 60 );

	$pdf->setFontSize( 12 );
	$pdf->text( '产品信息', 20, 80 );
	$pdf->setFontSize( 10 );
	$pdf->text( '产品名称: ' . $product_name, 20, 90 );
	$pdf->text( '产品ID: ' . $product_id, 20, 100 );
	$pdf->text( '颜色: ' . $custom_color, 20, 110 );

	if ( filter_var( $custom_image, FILTER_VALIDATE_URL ) ) {
		$pdf->setFontSize( 12 );
		$pdf->text( '定制设计', 20, 130 );

		$image_data = file_get_contents( $custom_image );
		if ( $image_data !== false ) {
			$temp_file = tempnam( sys_get_temp_dir(), 'pdf_img' );
			file_put_contents( $temp_file, $image_data );

			$pdf->addImage( $temp_file, 'JPEG', 20, 140, 100, 0 );

			unlink( $temp_file );
		}
	}

	$upload_dir = wp_upload_dir();
	$pdf_dir    = $upload_dir['basedir'] . '/production-pdfs';

	if ( ! file_exists( $pdf_dir ) ) {
		wp_mkdir_p( $pdf_dir );
	}

	$filename  = 'production-order-' . $order->get_order_number() . '-item-' . $item_id . '-' . time() . '.pdf';
	$file_path = $pdf_dir . '/' . $filename;

	$pdf->save( $file_path );

	return array(
		'path' => $file_path,
		'url'  => $upload_dir['baseurl'] . '/production-pdfs/' . $filename,
	);
}