<?php

/**
 * Fired during plugin activation
 *
 * @link       https://www.pw.com
 * @since      1.0.0
 *
 * @package    Pwca_Admin
 * @subpackage Pwca_Admin/includes
 */

/**
 * Fired during plugin activation.
 *
 * This class defines all code necessary to run during the plugin's activation.
 *
 * @since      1.0.0
 * @package    Pwca_Admin
 * @subpackage Pwca_Admin/includes
 * @author     PW <pw@pwcom>
 */
class Pwca_Admin_Activator
{

	/**
	 * 插件激活时执行的代码
	 *
	 * 设置重写规则刷新标志，确保自定义URL能够正常工作
	 * 创建必要的自定义页面
	 * 刷新重写规则以确保REST API端点正常工作
	 *
	 * @since    1.0.0
	 */
	public static function activate()
	{
		// 设置标志，表示需要刷新重写规则
		update_option('pwca_canvas_flush_rewrite', false);

		// 创建自定义页面
		self::create_custom_pages();

		// 迁移旧选项名到新选项名（兼容升级）
		self::migrate_old_options();

		// 刷新重写规则以确保REST API端点正常工作
		flush_rewrite_rules();
	}

	/**
	 * 插件激活时创建自定义页面
	 *
	 * 当此插件被激活时，检查并创建 "Custom Cart" 和 "Custom Checkout" 页面。
	 * 这确保了必要的页面存在，且只运行一次，避免重复创建。
	 *
	 * @since    1.0.0
	 */
	private static function create_custom_pages()
	{
		// 检查自定义购物车页面是否存在，不存在则创建
		if (! get_page_by_path('custom-cart')) {
			wp_insert_post(array(
				'post_title'   => __('Custom Cart', 'pw-admin'),
				'post_name'    => 'custom-cart',
				'post_status'  => 'publish',
				'post_type'    => 'page',
				'post_content' => '[woocommerce_cart]'
			));
		}

		// 检查自定义结算页面是否存在，不存在则创建
		if (! get_page_by_path('custom-checkout')) {
			wp_insert_post(array(
				'post_title'   => __('Custom Checkout', 'pw-admin'),
				'post_name'    => 'custom-checkout',
				'post_status'  => 'publish',
				'post_type'    => 'page',
				'post_content' => '[woocommerce_checkout]'
			));
		}
	}

	/**
	 * 迁移旧的 `pw_` 前缀选项到新的 `pwca_` 前缀
	 * 用于从旧版本升级到新命名规范时的数据兼容
	 *
	 * @since    1.0.0
	 */
	private static function migrate_old_options()
	{
		$option_map = array(
			'pw_api_token'          => 'pwca_api_token',
			'pw_api_mock_mode'      => 'pwca_api_mock_mode',
			'pw_cache_enabled'      => 'pwca_cache_enabled',
			'pw_store_id'           => 'pwca_store_id',
			'pw_disable_ssl'        => 'pwca_disable_ssl',
			'pw_api_key'            => 'pwca_api_key',
			'pw_api_secret'         => 'pwca_api_secret',
			'pw_customize_text'     => 'pwca_customize_text',
			'pw_customize_color'    => 'pwca_customize_color',
			'pw_canvas_flush_rewrite' => 'pwca_canvas_flush_rewrite',
		);

		foreach ($option_map as $old_name => $new_name) {
			$new_value = get_option($new_name);
			// 只在旧选项存在且新选项尚未设置时迁移
			if ($new_value === false) {
				$old_value = get_option($old_name);
				if ($old_value !== false) {
					update_option($new_name, $old_value);
					error_log("[PWCA Migration] Migrated option: {$old_name} -> {$new_name}");
				}
			}
		}
	}
}
