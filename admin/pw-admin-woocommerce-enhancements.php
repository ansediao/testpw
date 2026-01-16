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
