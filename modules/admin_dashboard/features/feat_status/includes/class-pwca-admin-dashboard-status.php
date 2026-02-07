<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Status 子模块
 * 处理状态页面功能和视图渲染
 */
final class Pwca_Admin_Dashboard_Status {
	private static $instance = null;
	private $module_path;
	private $module_url;

	public static function bootstrap( $module_path, $module_url ) {
		if ( null === self::$instance ) {
			self::$instance = new self( $module_path, $module_url );
			self::$instance->init();
		}
		return self::$instance;
	}

	private function __construct( $module_path, $module_url ) {
		$this->module_path = trailingslashit( (string) $module_path );
		$this->module_url  = trailingslashit( (string) $module_url );
	}

	private function init() {
		$this->register();
	}

	private function register() {
		// Status 页面目前主要是静态内容，通过视图渲染
		// 后续可在此添加状态检查、系统信息获取等功能
	}

	/**
	 * 渲染 Status Tab
	 */
	public static function render_status_tab() {
		$instance = self::$instance;
		if ( ! $instance ) {
			return;
		}

		$path = $instance->module_path . 'views' . DIRECTORY_SEPARATOR . 'status.php';
		if ( file_exists( $path ) ) {
			require $path;
		}
	}

	public static function get_status_data() {
		return array(
			'woocommerce_active' => class_exists( 'WooCommerce' ),
			'wordpress_version'  => get_bloginfo( 'version' ),
			'plugin_version'     => defined( 'PWCA_VERSION' ) ? PWCA_VERSION : 'unknown',
		);
	}
}
