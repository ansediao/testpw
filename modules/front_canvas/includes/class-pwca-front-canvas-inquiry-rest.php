<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Public_Canvas_Inquiry_Rest {
	public function register() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	public function register_routes() {
		register_rest_route(
			'pwca/v1',
			'/inquiry',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'handle_submit' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'product_id'         => array(
						'required'          => true,
						'validate_callback' => array( $this, 'validate_positive_int' ),
						'sanitize_callback' => 'absint',
					),
					'inquiry_first_name' => array(
						'required'          => true,
						'validate_callback' => array( $this, 'validate_not_empty' ),
						'sanitize_callback' => 'sanitize_text_field',
					),
					'inquiry_last_name'  => array(
						'required'          => true,
						'validate_callback' => array( $this, 'validate_not_empty' ),
						'sanitize_callback' => 'sanitize_text_field',
					),
					'inquiry_email'      => array(
						'required'          => true,
						'validate_callback' => array( $this, 'validate_email' ),
						'sanitize_callback' => 'sanitize_email',
					),
					'inquiry_phone'      => array(
						'required'          => false,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'inquiry_message'    => array(
						'required'          => true,
						'validate_callback' => array( $this, 'validate_not_empty' ),
						'sanitize_callback' => 'sanitize_textarea_field',
					),
				),
			)
		);
	}

	public function handle_submit( WP_REST_Request $request ) {
		$product_id = absint( $request['product_id'] );
		if ( ! function_exists( 'wc_get_product' ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => 'WooCommerce not available',
				),
				500
			);
		}

		$product = wc_get_product( $product_id );
		if ( ! $product ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => 'Product not found',
				),
				404
			);
		}

		$product_title = (string) $product->get_name();
		$name          = trim( (string) $request['inquiry_first_name'] . ' ' . (string) $request['inquiry_last_name'] );

		$email = (string) $request['inquiry_email'];
		$phone = isset( $request['inquiry_phone'] ) ? (string) $request['inquiry_phone'] : '';
		$body  = (string) $request['inquiry_message'];

		$saved = $this->maybe_save_to_flamingo( $product_id, $product_title, $name, $email, $phone, $body );
		$sent  = $this->send_notification_email( $product_id, $product_title, $name, $email, $phone, $body );

		if ( $saved ) {
			return new WP_REST_Response(
				array(
					'success' => true,
					'message' => $sent ? 'Your inquiry has been sent successfully!' : 'Your inquiry has been saved but email notification failed.',
				),
				200
			);
		}

		return new WP_REST_Response(
			array(
				'success' => false,
				'message' => 'Failed to save inquiry. Please try again.',
			),
			500
		);
	}

	public function validate_positive_int( $param ) {
		return is_numeric( $param ) && absint( $param ) > 0;
	}

	public function validate_not_empty( $param ) {
		return trim( (string) $param ) !== '';
	}

	public function validate_email( $param ) {
		return is_email( (string) $param );
	}

	private function maybe_save_to_flamingo( $product_id, $product_title, $name, $email, $phone, $message ) {
		if ( ! class_exists( 'Flamingo_Inbound_Message' ) ) {
			return false;
		}

		$flamingo_fields = array(
			'inquiry_name'    => $name,
			'inquiry_email'   => $email,
			'inquiry_phone'   => $phone,
			'inquiry_message' => $message,
			'product_name'    => $product_title,
			'product_id'      => $product_id,
			'inquiry_source'  => 'Canvas Product Page',
			'inquiry_url'     => home_url( '/pwcanvas/?product_id=' . absint( $product_id ) ),
			'submission_time' => current_time( 'mysql' ),
		);

		$subject = sprintf( 'Canvas Product Inquiry: %s', $product_title );

		$post_id = wp_insert_post(
			array(
				'post_type'    => 'flamingo_inbound',
				'post_status'  => 'publish',
				'post_title'   => $subject,
				'post_content' => $message,
				'meta_input'   => array(
					'_from'       => $name . ' <' . $email . '>',
					'_from_name'  => $name,
					'_from_email' => $email,
					'_subject'    => $subject,
					'_fields'     => $flamingo_fields,
					'_channel'    => 'canvas-inquiry',
				),
			)
		);

		return ( $post_id && ! is_wp_error( $post_id ) );
	}

	private function send_notification_email( $product_id, $product_title, $name, $email, $phone, $message ) {
		$headers = array(
			'Content-Type: text/html; charset=UTF-8',
			'From: ' . $name . ' <' . $email . '>',
		);

		$subject = sprintf( 'Canvas Product Inquiry: %s', $product_title );

		$body  = '<h2>Product Inquiry Details:</h2>';
		$body .= '<p><strong>Product:</strong> ' . esc_html( $product_title ) . ' (ID: ' . esc_html( $product_id ) . ')</p>';
		$body .= '<p><strong>Name:</strong> ' . esc_html( $name ) . '</p>';
		$body .= '<p><strong>Email:</strong> ' . esc_html( $email ) . '</p>';
		if ( $phone !== '' ) {
			$body .= '<p><strong>Phone:</strong> ' . esc_html( $phone ) . '</p>';
		}
		$body .= '<p><strong>Message:</strong><br>' . nl2br( esc_html( $message ) ) . '</p>';

		return wp_mail( get_option( 'admin_email' ), $subject, $body, $headers );
	}
}

