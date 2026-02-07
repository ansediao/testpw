<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Product Request 子模块
 * 处理产品需求提交功能和视图渲染
 */
final class Pwca_Admin_Dashboard_Product_Request {
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
		add_action( 'wp_ajax_pw_submit_product_request', array( $this, 'handle_product_request_submission' ) );
	}

	/**
	 * 渲染 Product Request Tab
	 */
	public static function render_product_request_tab() {
		$instance = self::$instance;
		if ( ! $instance ) {
			return;
		}

		$path = $instance->module_path . 'views' . DIRECTORY_SEPARATOR . 'product_request.php';
		if ( file_exists( $path ) ) {
			require $path;
		}
	}

	public function handle_product_request_submission() {
		if ( ! isset( $_POST['nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['nonce'] ) ), 'pw_product_request_nonce' ) ) {
			wp_send_json_error( __( 'Security check failed!', 'pw-admin' ) );
			return;
		}

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( __( 'Permission denied!', 'pw-admin' ) );
			return;
		}

		$description  = isset( $_POST['pw_product_description'] ) ? sanitize_textarea_field( wp_unslash( $_POST['pw_product_description'] ) ) : '';
		$product_link = isset( $_POST['pw_product_link'] ) ? esc_url_raw( wp_unslash( $_POST['pw_product_link'] ) ) : '';
		$image_url    = '';

		if ( isset( $_FILES['pw_product_image'] ) && ! empty( $_FILES['pw_product_image']['name'] ) ) {
			if ( ! function_exists( 'wp_handle_upload' ) ) {
				require_once ABSPATH . 'wp-admin/includes/file.php';
			}

			$uploaded_file     = $_FILES['pw_product_image'];
			$upload_overrides  = array( 'test_form' => false );
			$movefile          = wp_handle_upload( $uploaded_file, $upload_overrides );

			if ( $movefile && ! isset( $movefile['error'] ) ) {
				$image_url = $movefile['url'];
			}
		}

		if ( '' === $description && '' === $product_link && '' === $image_url ) {
			wp_send_json_error( __( 'Please fill in at least one field.', 'pw-admin' ) );
			return;
		}

		if ( class_exists( 'Flamingo_Inbound_Message' ) ) {
			$this->save_product_request_to_flamingo( $description, $product_link, $image_url );
			wp_send_json_success( __( 'Your product request has been submitted successfully!', 'pw-admin' ) );
			return;
		}

		wp_send_json_success( __( 'Your product request has been saved successfully!', 'pw-admin' ) );
	}

	private function save_product_request_to_flamingo( $description, $product_link, $image_url ) {
		$current_user = wp_get_current_user();
		$from_name    = $current_user->display_name ? $current_user->display_name : 'Admin User';
		$from_email   = $current_user->user_email ? $current_user->user_email : get_option( 'admin_email' );

		$flamingo_fields = array(
			'product_description' => $description,
			'product_link'        => $product_link,
			'product_image'       => $image_url,
			'request_type'        => 'Product Request',
			'request_source'      => 'Admin Dashboard',
			'submitted_by'        => $from_name,
		);

		$request_subject = __( 'Product Request from Admin Dashboard', 'pw-admin' );
		$post_data       = array(
			'post_type'   => 'flamingo_inbound',
			'post_status' => 'publish',
			'post_title'  => $request_subject,
		);

		$post_id = wp_insert_post( $post_data );
		if ( ! $post_id || is_wp_error( $post_id ) ) {
			return;
		}

		update_post_meta( $post_id, '_from', $from_name . ' <' . $from_email . '>' );
		update_post_meta( $post_id, '_from_name', $from_name );
		update_post_meta( $post_id, '_from_email', $from_email );
		update_post_meta( $post_id, '_subject', $request_subject );
		update_post_meta( $post_id, '_fields', $flamingo_fields );
	}
}
