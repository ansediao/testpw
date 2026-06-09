<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Public_Product_Inquiry {
	private $context;
	private $module_path;

	public function __construct( Pwca_Public_Product_Context $context, $module_path ) {
		$this->context     = $context;
		$this->module_path = $module_path;
	}

	public function register() {
		add_filter( 'woocommerce_product_tabs', array( $this, 'add_inquiry_tab' ) );
		add_action( 'admin_post_nopriv_handle_product_inquiry', array( $this, 'handle_form_submit' ) );
		add_action( 'admin_post_handle_product_inquiry', array( $this, 'handle_form_submit' ) );

		add_action( 'admin_notices', array( $this, 'maybe_render_unread_notice' ) );
		add_action( 'admin_init', array( $this, 'maybe_mark_message_as_read' ) );
	}

	public function add_inquiry_tab( $tabs ) {
		$tabs['pwca_inquiry_tab'] = array(
			'title'    => __( 'Product Inquiry Form', 'pw-admin' ),
			'priority' => 50,
			'callback' => array( $this, 'render_inquiry_tab' ),
		);

		return $tabs;
	}

	public function render_inquiry_tab() {
		$product = $this->context->get_current_product();
		if ( ! $product ) {
			return;
		}

		$view_path = $this->module_path . '/views/product-inquiry-tab.php';
		if ( ! is_readable( $view_path ) ) {
			return;
		}

		$product_id    = $product->get_id();
		$product_title = $product->get_name();

		$status = '';
		if ( isset( $_GET['inquiry_status'] ) ) {
			$status = sanitize_text_field( wp_unslash( $_GET['inquiry_status'] ) );
		}

		include $view_path;
	}

	public function handle_form_submit() {
		if ( ! $this->verify_request() ) {
			wp_die( esc_html__( 'Security check failed!', 'pw-admin' ) );
		}

		$data = $this->get_sanitized_form_data();
		$redirect_url = $this->get_redirect_url( $data['product_id'] );

		if ( ! $this->is_form_valid( $data ) ) {
			wp_safe_redirect( add_query_arg( 'inquiry_status', 'error', $redirect_url ) );
			exit;
		}

		$this->maybe_save_to_flamingo( $data, $redirect_url );
		$this->send_to_promowares_api( $data );

		$mail_sent = $this->send_inquiry_email( $data, $redirect_url );
		$status    = $mail_sent ? 'success' : 'mail_failed';

		wp_safe_redirect( add_query_arg( 'inquiry_status', $status, $redirect_url ) );
		exit;
	}

	private function verify_request() {
		if ( ! isset( $_POST['product_inquiry_nonce'] ) ) {
			return false;
		}

		$nonce = sanitize_text_field( wp_unslash( $_POST['product_inquiry_nonce'] ) );
		return wp_verify_nonce( $nonce, 'product_inquiry_action' );
	}

	private function get_sanitized_form_data() {
		$product_id    = isset( $_POST['product_id'] ) ? absint( $_POST['product_id'] ) : 0;
		$product_title = isset( $_POST['product_title'] ) ? sanitize_text_field( wp_unslash( $_POST['product_title'] ) ) : __( 'Unknown Product', 'pw-admin' );

		$first_name = isset( $_POST['inquiry_first_name'] ) ? sanitize_text_field( wp_unslash( $_POST['inquiry_first_name'] ) ) : '';
		$last_name  = isset( $_POST['inquiry_last_name'] ) ? sanitize_text_field( wp_unslash( $_POST['inquiry_last_name'] ) ) : '';
		$email      = isset( $_POST['inquiry_email'] ) ? sanitize_email( wp_unslash( $_POST['inquiry_email'] ) ) : '';
		$phone      = isset( $_POST['inquiry_phone'] ) ? sanitize_text_field( wp_unslash( $_POST['inquiry_phone'] ) ) : '';
		$message    = isset( $_POST['inquiry_message'] ) ? sanitize_textarea_field( wp_unslash( $_POST['inquiry_message'] ) ) : '';

		return array(
			'product_id'    => $product_id,
			'product_title' => $product_title,
			'first_name'    => $first_name,
			'last_name'     => $last_name,
			'email'         => $email,
			'phone'         => $phone,
			'message'       => $message,
		);
	}

	private function is_form_valid( $data ) {
		if ( empty( $data['product_id'] ) ) {
			return false;
		}

		if ( $data['first_name'] === '' || $data['last_name'] === '' || $data['email'] === '' || $data['message'] === '' ) {
			return false;
		}

		return true;
	}

	private function get_redirect_url( $product_id ) {
		$product_id = absint( $product_id );
		if ( $product_id ) {
			$url = get_permalink( $product_id );
			if ( $url ) {
				return $url;
			}
		}

		return home_url( '/' );
	}

	private function maybe_save_to_flamingo( $data, $redirect_url ) {
		if ( ! class_exists( 'Flamingo_Inbound_Message' ) ) {
			return;
		}

		$name    = trim( $data['first_name'] . ' ' . $data['last_name'] );
		$subject = sprintf( __( 'Product inquiry for "%s"', 'pw-admin' ), $data['product_title'] );

		$post_id = $this->create_flamingo_post( $subject );
		if ( ! $post_id ) {
			return;
		}

		$flamingo_fields = $this->build_flamingo_fields( $data, $redirect_url, $name );
		$this->update_flamingo_meta( $post_id, $data['email'], $name, $subject, $flamingo_fields );
	}

	private function create_flamingo_post( $subject ) {
		$post_id = wp_insert_post(
			array(
				'post_type'   => 'flamingo_inbound',
				'post_status' => 'publish',
				'post_title'  => $subject,
			)
		);

		if ( ! $post_id || is_wp_error( $post_id ) ) {
			return 0;
		}

		return absint( $post_id );
	}

	private function build_flamingo_fields( $data, $redirect_url, $name ) {
		return array(
			'inquiry_name'    => $name,
			'inquiry_email'   => $data['email'],
			'inquiry_phone'   => $data['phone'],
			'inquiry_message' => $data['message'],
			'product_name'    => $data['product_title'],
			'product_id'      => $data['product_id'],
			'inquiry_page'    => $redirect_url,
		);
	}

	private function update_flamingo_meta( $post_id, $email, $name, $subject, $flamingo_fields ) {
		update_post_meta( $post_id, '_from', $name . ' <' . $email . '>' );
		update_post_meta( $post_id, '_from_name', $name );
		update_post_meta( $post_id, '_from_email', $email );
		update_post_meta( $post_id, '_subject', $subject );
		update_post_meta( $post_id, '_fields', $flamingo_fields );
	}

	private function send_to_promowares_api( $data ) {
		$pw_id = get_post_meta( $data['product_id'], 'pw_id', true );
		$pw_id = is_string( $pw_id ) ? $pw_id : '';
		if ( $pw_id === '' ) {
			return;
		}

		if ( ! class_exists( 'Pwca_Admin_Promowares_Api' ) ) {
			return;
		}

		$api = new Pwca_Admin_Promowares_Api();
		$api->send_product_inquiry(
			(int) $pw_id,
			(string) $data['first_name'],
			(string) $data['last_name'],
			(string) $data['email'],
			(string) $data['phone'],
			(string) $data['message']
		);
	}

	private function send_inquiry_email( $data, $redirect_url ) {
		$name = trim( $data['first_name'] . ' ' . $data['last_name'] );

		$headers = array(
			'Content-Type: text/html; charset=UTF-8',
			'From: ' . $name . ' <' . $data['email'] . '>',
		);

		$subject = sprintf( __( 'Product Inquiry for %s', 'pw-admin' ), $data['product_title'] );

		$body  = '<h2>' . esc_html__( 'Product Inquiry Details:', 'pw-admin' ) . '</h2>';
		$body .= '<p><strong>' . esc_html__( 'Product:', 'pw-admin' ) . '</strong> <a href="' . esc_url( $redirect_url ) . '">' . esc_html( $data['product_title'] ) . '</a> (ID: ' . esc_html( $data['product_id'] ) . ')</p>';
		$body .= '<p><strong>' . esc_html__( 'Name:', 'pw-admin' ) . '</strong> ' . esc_html( $name ) . '</p>';
		$body .= '<p><strong>' . esc_html__( 'Email:', 'pw-admin' ) . '</strong> ' . esc_html( $data['email'] ) . '</p>';

		if ( $data['phone'] !== '' ) {
			$body .= '<p><strong>' . esc_html__( 'Phone:', 'pw-admin' ) . '</strong> ' . esc_html( $data['phone'] ) . '</p>';
		}

		$body .= '<p><strong>' . esc_html__( 'Message:', 'pw-admin' ) . '</strong><br>' . nl2br( esc_html( $data['message'] ) ) . '</p>';

		return wp_mail( get_option( 'admin_email' ), $subject, $body, $headers );
	}

	public function maybe_render_unread_notice() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		if ( ! class_exists( 'Flamingo_Inbound_Message' ) ) {
			return;
		}

		$unread_count = $this->get_unread_flamingo_count();
		if ( $unread_count < 1 ) {
			return;
		}

		$inbox_url = admin_url( 'admin.php?page=flamingo_inbound' );
		echo '<div class="notice notice-info is-dismissible"><p>' . esc_html( sprintf( __( 'You have %d new product inquiry messages.', 'pw-admin' ), $unread_count ) ) . ' <a href="' . esc_url( $inbox_url ) . '">' . esc_html__( 'View Now', 'pw-admin' ) . '</a></p></div>';
	}

	private function get_unread_flamingo_count() {
		$query = new WP_Query(
			array(
				'post_type'              => 'flamingo_inbound',
				'post_status'            => 'publish',
				'posts_per_page'         => 1,
				'meta_query'             => array(
					array(
						'key'     => '_flamingo_is_read',
						'compare' => 'NOT EXISTS',
					),
				),
				'fields'                 => 'ids',
				'cache_results'          => false,
				'update_post_meta_cache' => false,
				'update_post_term_cache' => false,
			)
		);

		return absint( $query->found_posts );
	}

	public function maybe_mark_message_as_read() {
		if ( ! isset( $_GET['page'], $_GET['post'] ) ) {
			return;
		}

		global $pagenow;
		if ( 'admin.php' !== $pagenow ) {
			return;
		}

		if ( $_GET['page'] !== 'flamingo_inbound' ) {
			return;
		}

		$post_id = absint( $_GET['post'] );
		if ( ! $post_id || ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		if ( get_post_meta( $post_id, '_flamingo_is_read', true ) ) {
			return;
		}

		update_post_meta( $post_id, '_flamingo_is_read', '1' );
	}
}
