<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// 从 Support 子模块获取数据
$support_data = array();
if ( class_exists( 'Pwca_Admin_Dashboard_Support' ) ) {
	$support_data = Pwca_Admin_Dashboard_Support::get_support_data();
}

$documentation_url = isset( $support_data['documentation_url'] ) ? $support_data['documentation_url'] : '#';
$support_email = isset( $support_data['support_email'] ) ? $support_data['support_email'] : '';

?>

<section class="pwca-admin-dashboard__pane pwca-admin-dashboard__pane--support">
	<h2 class="pwca-admin-dashboard__pane-title">Support</h2>

	<div class="pwca-admin-dashboard__support-cards">
		<div class="pwca-admin-dashboard__support-card">
			<h3>需要帮助？联系我们！</h3>
			<p>有任何问题或需要支持，请随时联系我们。我们的团队随时准备为您提供帮助。</p>
			<a href="#" class="button button-secondary">联系支持</a>
		</div>

		<div class="pwca-admin-dashboard__support-card">
			<h3>阅读我们的常见问题</h3>
			<p>查看我们的常见问题解答，了解关于产品、功能和使用方法的常见问题及解答。</p>
			<a href="#" class="button button-secondary">查看常见问题</a>
		</div>

		<div class="pwca-admin-dashboard__support-card">
			<h3>集成帮助</h3>
			<p>需要帮助集成我们的产品？查看我们的集成指南，或联系我们的技术支持团队获取帮助。</p>
			<a href="#" class="button button-secondary">查看集成指南</a>
		</div>
	</div>
</section>

