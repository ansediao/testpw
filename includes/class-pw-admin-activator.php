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
	 *
	 * @since    1.0.0
	 */
	public static function activate() {
		// 设置标志，表示需要刷新重写规则
		update_option('pw_canvas_flush_rewrite', false);
	}

}
