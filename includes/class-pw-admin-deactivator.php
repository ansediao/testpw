<?php

/**
 * Fired during plugin deactivation
 *
 * @link       https://www.pw.com
 * @since      1.0.0
 *
 * @package    Pw_Admin
 * @subpackage Pw_Admin/includes
 */

/**
 * Fired during plugin deactivation.
 *
 * This class defines all code necessary to run during the plugin's deactivation.
 *
 * @since      1.0.0
 * @package    Pw_Admin
 * @subpackage Pw_Admin/includes
 * @author     PW <pw@pwcom>
 */
class Pw_Admin_Deactivator {

	/**
	 * 插件停用时执行的代码
	 *
	 * 清理插件相关的选项和设置
	 *
	 * @since    1.0.0
	 */
	public static function deactivate() {
		// 删除重写规则刷新标志
		delete_option('pw_canvas_flush_rewrite');
		
		// 刷新重写规则，移除我们的自定义规则
		flush_rewrite_rules();
	}

}
