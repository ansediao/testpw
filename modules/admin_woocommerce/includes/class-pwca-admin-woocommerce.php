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
		add_filter( 'posts_results', array( $this, 'override_group_product_thumbnails_in_posts' ), 10, 2 );
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

		$is_composite_group = get_post_meta( $post_id, 'pw_is_composite_group', true );
		if ( '1' !== (string) $is_composite_group ) {
			return;
		}

		$main_post_id = get_post_meta( $post_id, 'pw_composite_main_post_id', true );
		$child_ids    = get_post_meta( $post_id, '_children', true );

		$product_ids = array();
		if ( ! empty( $main_post_id ) && (int) $main_post_id > 0 ) {
			$product_ids[] = (int) $main_post_id;
		}
		if ( is_array( $child_ids ) && ! empty( $child_ids ) ) {
			$child_ids = array_map( 'intval', $child_ids );
			$child_ids = array_values( array_diff( $child_ids, array( (int) $post_id ) ) );
			$product_ids = array_merge( $product_ids, $child_ids );
		}

		if ( empty( $product_ids ) ) {
			return;
		}

		echo '<div class="cross-sells-tooltip">▲ ' . count( $product_ids ) . ' products
			<div class="tooltip">' . implode(
			'<br>',
			array_map(
				function ( $pid ) {
					return '<i class="iconfont icon-xiaji"></i> ' . get_the_title( $pid );
				},
				$product_ids
			)
		) . '</div>
		</div>';
	}

	public function exclude_composite_group_products( $query ) {
		if ( ! $query instanceof WP_Query ) {
			return;
		}

		if ( ! is_admin() ) {
			return;
		}

		$post_type = $query->get( 'post_type' );
		if ( is_array( $post_type ) ) {
			if ( ! in_array( 'product', $post_type, true ) ) {
				return;
			}
		} elseif ( 'product' !== $post_type ) {
			return;
		}

		global $wpdb;
		$main_post_ids = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT pm.post_id FROM {$wpdb->postmeta} pm WHERE pm.meta_key = %s AND pm.meta_value = %s",
				'pw_is_composite_main',
				'1'
			)
		);
		$child_post_ids = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT pm.post_id
				FROM {$wpdb->postmeta} pm
				WHERE pm.meta_key = %s
					AND CAST(pm.meta_value AS UNSIGNED) > 0
					AND CAST(pm.meta_value AS UNSIGNED) <> pm.post_id
					AND pm.post_id NOT IN (
						SELECT pm2.post_id FROM {$wpdb->postmeta} pm2 WHERE pm2.meta_key = 'pw_is_composite_group' AND pm2.meta_value = '1'
					)",
				'pw_composite_main_post_id'
			)
		);

		$excluded_ids = array_unique(
			array_merge(
				array_map( 'intval', (array) $main_post_ids ),
				array_map( 'intval', (array) $child_post_ids )
			)
		);

		if ( empty( $excluded_ids ) ) {
			return;
		}

		$existing = (array) $query->get( 'post__not_in' );
		$query->set( 'post__not_in', array_unique( array_merge( $existing, $excluded_ids ) ) );
	}

	public function override_group_product_thumbnails_in_posts( $posts, $query ) {
		if ( empty( $posts ) || ! is_array( $posts ) ) {
			return $posts;
		}

		if ( ! is_admin() ) {
			return $posts;
		}

		$post_type = $query->get( 'post_type' );
		if ( 'product' !== $post_type ) {
			return $posts;
		}

		foreach ( $posts as $post ) {
			$is_composite_group = get_post_meta( $post->ID, 'pw_is_composite_group', true );
			if ( '1' !== (string) $is_composite_group ) {
				continue;
			}

			$main_post_id = get_post_meta( $post->ID, 'pw_composite_main_post_id', true );
			if ( empty( $main_post_id ) || (int) $main_post_id <= 0 ) {
				continue;
			}

			$main_thumbnail_id = get_post_meta( (int) $main_post_id, '_thumbnail_id', true );
			if ( empty( $main_thumbnail_id ) ) {
				continue;
			}

			update_post_meta( $post->ID, '_thumbnail_id', (int) $main_thumbnail_id );
		}

		return $posts;
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

