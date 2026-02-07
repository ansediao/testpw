<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Support 子模块
 * 处理支持页面功能和视图渲染
 */
final class Pwca_Admin_Dashboard_Support {
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
		// Support 页面目前主要是静态内容，通过视图渲染
		// 后续可在此添加支持表单处理、文档链接等功能
	}

	/**
	 * 渲染 Support Tab
	 */
	public static function render_support_tab() {
		$instance = self::$instance;
		if ( ! $instance ) {
			return;
		}

		$path = $instance->module_path . 'views' . DIRECTORY_SEPARATOR . 'support.php';
		if ( file_exists( $path ) ) {
			require $path;
		}
	}

	public static function get_support_data() {
		return array(
			'documentation_url' => 'https://docs.promowares.com',
			'support_email'     => 'support@promowares.com',
		);
	}
}
