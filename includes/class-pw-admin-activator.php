<?php

/**
 * Fired during plugin activation
 *
 * @link       https://www.pw.com
 * @since      1.0.0
 *
 * @package    Pw_Admin
 * @subpackage Pw_Admin/includes
 */

/**
 * Fired during plugin activation.
 *
 * This class defines all code necessary to run during the plugin's activation.
 *
 * @since      1.0.0
 * @package    Pw_Admin
 * @subpackage Pw_Admin/includes
 * @author     PW <pw@pwcom>
 */
class Pw_Admin_Activator {

	/**
	 * 插件激活时执行的代码
	 *
	 * 设置重写规则刷新标志，确保自定义URL能够正常工作
	 * 创建必要的自定义页面
	 *
	 * @since    1.0.0
	 */
	public static function activate() {
		// 设置标志，表示需要刷新重写规则
		update_option('pw_canvas_flush_rewrite', false);
		
		// 创建自定义页面
		self::create_custom_pages();
	}

	/**
	 * 插件激活时创建自定义页面
	 *
	 * 当此插件被激活时，检查并创建 "Custom Cart" 和 "Custom Checkout" 页面。
	 * 这确保了必要的页面存在，且只运行一次，避免重复创建。
	 *
	 * @since    1.0.0
	 */
	private static function create_custom_pages() {
		// 检查自定义购物车页面是否存在，不存在则创建
		if ( ! get_page_by_path('custom-cart') ) {
			wp_insert_post(array(
				'post_title'   => __('Custom Cart', 'pw-admin'),
				'post_name'    => 'custom-cart',
				'post_status'  => 'publish',
				'post_type'    => 'page',
				'post_content' => '[woocommerce_cart]'
			));
		}

		// 检查自定义结算页面是否存在，不存在则创建
		if ( ! get_page_by_path('custom-checkout') ) {
			wp_insert_post(array(
				'post_title'   => __('Custom Checkout', 'pw-admin'),
				'post_name'    => 'custom-checkout',
				'post_status'  => 'publish',
				'post_type'    => 'page',
				'post_content' => '[woocommerce_checkout]'
			));
		}
	}

}
