<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * 子模块加载器
 * 负责扫描模块目录下的 feat_* 子目录并加载
 */
class Pwca_Admin_Dashboard_Loader {
	protected $module_path;
	protected $module_url;

	public function __construct( $module_path, $module_url ) {
		$this->module_path = rtrim( $module_path, DIRECTORY_SEPARATOR ) . DIRECTORY_SEPARATOR;
		$this->module_url  = trailingslashit( $module_url );
	}

	public function load() {
		// 从 features/ 子目录加载 feat_* 模块
		$feat_dirs = glob( $this->module_path . 'features' . DIRECTORY_SEPARATOR . 'feat_*', GLOB_ONLYDIR );
		if ( ! is_array( $feat_dirs ) || empty( $feat_dirs ) ) {
			return;
		}

		foreach ( $feat_dirs as $dir ) {
			$index = $dir . DIRECTORY_SEPARATOR . 'index.php';
			if ( file_exists( $index ) ) {
				include_once $index;
			}
		}
	}
}
