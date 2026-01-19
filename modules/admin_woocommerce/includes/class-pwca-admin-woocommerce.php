<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Admin_WooCommerce {
	private $module_path;
	private $module_url;

	public static function bootstrap( $module_path, $module_url ) {
		$instance = new self( $module_path, $module_url );
		$instance->register();
	}

	private function __construct( $module_path, $module_url ) {
		$this->module_path = trailingslashit( (string) $module_path );
		$this->module_url  = trailingslashit( (string) $module_url );
	}

	public function register() {
		add_action( 'admin_init', array( $this, 'remove_product_duplicate_for_non_admins' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );

		add_action( 'pre_get_posts', array( $this, 'exclude_composite_group_products' ) );

		add_filter( 'post_row_actions', array( $this, 'filter_product_row_actions' ), 10, 2 );
		add_filter( 'bulk_actions-edit-product', array( $this, 'filter_product_bulk_actions' ) );
		add_action( 'manage_product_posts_custom_column', array( $this, 'render_product_name_column_badges' ), 20, 2 );
	}

	public function enqueue_assets( $hook ) {
		if ( ! $this->is_product_list_screen() ) {
			return;
		}

		wp_enqueue_style(
			'pwca-vendor-icons',
			'//at.alicdn.com/t/c/font_4970780_pfyts3fzl6.css',
			array(),
			null
		);
	}

	public function filter_product_row_actions( $actions, $post ) {
		if ( ! $post instanceof WP_Post ) {
			return $actions;
		}

		if ( 'product' !== $post->post_type ) {
			return $actions;
		}

		$is_sync_product = get_post_meta( $post->ID, 'pw_isSyncProduct', true );
		if ( '1' === (string) $is_sync_product ) {
			unset( $actions['trash'] );

			if ( ! current_user_can( 'manage_options' ) ) {
				unset( $actions['duplicate'] );
			}
		}

		return $actions;
	}

	public function remove_product_duplicate_for_non_admins() {
		if ( current_user_can( 'manage_options' ) ) {
			return;
		}

		remove_action(
			'admin_action_duplicate_product',
			array( 'WC_Admin_Duplicate_Product', 'duplicate_product_action' )
		);
	}

	public function filter_product_bulk_actions( $actions ) {
		return $actions;
	}

	public function render_product_name_column_badges( $column, $post_id ) {
		if ( 'name' !== (string) $column ) {
			return;
		}

		$is_sync_product = get_post_meta( $post_id, 'pw_isSyncProduct', true );
		if ( '1' === (string) $is_sync_product ) {
			echo '<span style="background-color: #000; color: #fff; padding: 2px 4px; border-radius: 2px; font-size: 10px; font-weight: bold; display: inline-block;">SYNC</span> ';
		}

		$all_ids = get_post_meta( $post_id, 'pw_composite_all_product_ids', true );
		if ( ! is_array( $all_ids ) || empty( $all_ids ) ) {
			return;
		}

		$child_ids = array_values( array_diff( array_map( 'intval', $all_ids ), array( (int) $post_id ) ) );
		if ( empty( $child_ids ) ) {
			return;
		}

		echo '<div class="cross-sells-tooltip">▲ ' . count( $child_ids ) . ' sub-products
			<div class="tooltip">' . implode(
			'<br>',
			array_map(
				function ( $cid ) {
					return '<i class="iconfont icon-xiaji"></i> ' . get_the_title( $cid );
				},
				$child_ids
			)
		) . '</div>
		</div>';
	}

	public function exclude_composite_group_products( $query ) {
		if ( ! $query instanceof WP_Query ) {
			return;
		}

		if ( ! is_admin() || ! $query->is_main_query() ) {
			return;
		}

		if ( 'product' !== $query->get( 'post_type' ) ) {
			return;
		}

		global $wpdb;
		$group_post_ids = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT pm.post_id FROM {$wpdb->postmeta} pm WHERE pm.meta_key = %s AND pm.meta_value = %s",
				'pw_is_composite_group',
				'1'
			)
		);

		if ( empty( $group_post_ids ) ) {
			return;
		}

		$existing = (array) $query->get( 'post__not_in' );
		$query->set( 'post__not_in', array_unique( array_merge( $existing, array_map( 'intval', $group_post_ids ) ) ) );
	}

	private function is_product_list_screen() {
		if ( ! function_exists( 'get_current_screen' ) ) {
			return false;
		}

		$screen = get_current_screen();
		if ( ! $screen ) {
			return false;
		}

		return ( 'edit-product' === (string) $screen->id );
	}
}

