<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Integration_Promowares {
	private $module_path;
	private $module_url;
	private static $instance;

	public static function bootstrap( $module_path, $module_url ) {
		$instance = new self( $module_path, $module_url );
		self::$instance = $instance;
		$instance->register();
	}

	public static function schedule_product_import() {
		if ( ! self::$instance ) {
			return array(
				array( 'type' => 'error', 'text' => 'Promowares sync module not initialized' ),
			);
		}

		return self::$instance->schedule_product_import_internal();
	}

	private function __construct( $module_path, $module_url ) {
		$this->module_path = trailingslashit( (string) $module_path );
		$this->module_url  = trailingslashit( (string) $module_url );
	}

	public function register() {
		add_action( 'wp_ajax_check_import_progress', array( $this, 'handle_check_import_progress' ) );
		add_action( 'wp_ajax_pw_save_token', array( $this, 'handle_save_token' ) );
		add_action( 'wp_ajax_pw_save_mock_mode', array( $this, 'handle_save_mock_mode' ) );

		add_action( 'import_single_product', array( $this, 'import_single_product' ) );
		add_action( 'import_composite_product_group', array( $this, 'import_composite_product_group' ) );
		add_action( 'process_container_rules', array( $this, 'process_container_rules' ) );
	}

	public function handle_check_import_progress() {
		$total     = 0;
		$completed = 0;

		if ( ! $this->is_action_scheduler_available() ) {
			wp_send_json(
				array(
					'total'     => 0,
					'completed' => 0,
				)
			);
			return;
		}

		$hooks = array( 'import_single_product', 'import_composite_product_group' );

		foreach ( $hooks as $hook ) {
			$pending_actions = as_get_scheduled_actions(
				array(
					'status'   => 'pending',
					'hook'     => $hook,
					'per_page' => -1,
				)
			);

			$completed_actions = as_get_scheduled_actions(
				array(
					'status'   => 'complete',
					'hook'     => $hook,
					'per_page' => -1,
				)
			);

			$total     += count( $pending_actions ) + count( $completed_actions );
			$completed += count( $completed_actions );
		}

		if ( $total > 0 && $total === $completed ) {
			set_transient( 'pwca_import_completed', true, 300 );
		}

		$is_page_refresh = isset( $_POST['is_page_refresh'] ) && '1' === $_POST['is_page_refresh'];
		if ( $is_page_refresh && get_transient( 'pwca_import_completed' ) ) {
			delete_transient( 'pwca_import_completed' );
			$this->clear_stale_import_actions();
			$total     = 0;
			$completed = 0;
		}

		wp_send_json(
			array(
				'total'     => (int) $total,
				'completed' => (int) $completed,
			)
		);
	}

	public function handle_save_token() {
		if ( ! $this->verify_ajax_nonce( 'pw_save_token_nonce', 'nonce' ) ) {
			wp_send_json_error( 'Security verification failed' );
			return;
		}

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( 'Insufficient permissions' );
			return;
		}

		$token = isset( $_POST['token'] ) ? sanitize_text_field( wp_unslash( $_POST['token'] ) ) : '';
		if ( $token === '' ) {
			wp_send_json_error( 'Token cannot be empty' );
			return;
		}

		$result = update_option( 'pw_api_token', $token );
		if ( $result ) {
			wp_send_json_success( 'Token saved successfully' );
			return;
		}

		wp_send_json_error( 'Failed to save token' );
	}

	public function handle_save_mock_mode() {
		if ( ! $this->verify_ajax_nonce( 'pw_save_mock_mode_nonce', 'nonce' ) ) {
			wp_send_json_error( 'Security verification failed' );
			return;
		}

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( 'Insufficient permissions' );
			return;
		}

		$mode_raw = isset( $_POST['mode'] ) ? sanitize_text_field( wp_unslash( $_POST['mode'] ) ) : '';
		$mode     = (int) ( '1' === $mode_raw ? 1 : 0 );

		$result = update_option( 'pw_api_mock_mode', $mode );
		if ( $result ) {
			wp_send_json_success( 'API mock mode updated successfully' );
			return;
		}

		wp_send_json_error( 'Failed to update API mock mode' );
	}

	

	public function import_single_product( $product ) {
		if ( ! is_array( $product ) ) {
			return;
		}

		$resolved = $this->resolve_single_product_payload( $product );
		if ( ! $resolved ) {
			return;
		}

		$post_id = wp_insert_post(
			array(
				'post_title'   => $resolved['name'],
				'post_content' => $resolved['description'],
				'post_excerpt' => $resolved['short_description'],
				'post_status'  => 'publish',
				'post_type'    => 'product',
			)
		);

		if ( ! $post_id ) {
			return;
		}

		$this->store_single_product_meta( $post_id, $resolved );
		$this->maybe_store_product_templates( $post_id, $resolved['id'] );
		$this->maybe_set_product_featured_image( $post_id, $resolved['product_image'] );
	}

	public function import_composite_product_group( $composite_group ) {
		if ( ! is_array( $composite_group ) ) {
			return;
		}

		$main_product_id = isset( $composite_group['main_product_id'] ) ? (int) $composite_group['main_product_id'] : 0;
		$products        = isset( $composite_group['products'] ) && is_array( $composite_group['products'] ) ? $composite_group['products'] : array();

		if ( $main_product_id <= 0 || empty( $products ) ) {
			return;
		}

		$container_name = isset( $composite_group['container_name'] ) ? sanitize_text_field( $composite_group['container_name'] ) : '';
		$created = $this->create_composite_products( $main_product_id, $products, $container_name );
		if ( ! $created['main_post_id'] ) {
			return;
		}

		$this->link_composite_products( $created['main_post_id'], $created['created_product_ids'] );
		$this->maybe_create_grouped_product( $created['main_post_id'], $created['created_product_ids'], $container_name );
		$this->maybe_schedule_container_rules_processing( $main_product_id, $products, $composite_group, $created['created_product_ids'], $created['main_post_id'] );
	}

	public function process_container_rules( $args_json ) {
		$args = json_decode( (string) $args_json, true );
		if ( ! $args || ! is_array( $args ) ) {
			return;
		}

		if ( ! isset( $args['container_id'], $args['composite_group'], $args['created_product_ids'] ) ) {
			return;
		}

		$container_id        = (int) $args['container_id'];
		$created_product_ids = is_array( $args['created_product_ids'] ) ? $args['created_product_ids'] : array();

		if ( $container_id <= 0 || empty( $created_product_ids ) ) {
			return;
		}

		$container_info = $this->get_api_client()->get_container_info( $container_id );
		if ( ! $container_info || ! is_array( $container_info ) ) {
			return;
		}

		$label_values = isset( $container_info['label_values'] ) && is_array( $container_info['label_values'] ) ? $container_info['label_values'] : array();
		if ( empty( $label_values ) ) {
			return;
		}

		$this->apply_container_rules( $container_id, $container_info, $label_values, $created_product_ids );
	}

	private function schedule_product_import_internal() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return array(
				array( 'type' => 'error', 'text' => 'Insufficient permissions to sync products' ),
			);
		}

		if ( ! $this->is_action_scheduler_available() ) {
			return array(
				array( 'type' => 'error', 'text' => 'Action Scheduler is unavailable, cannot sync products' ),
			);
		}

		$this->clear_stale_import_actions();
		$this->delete_existing_sync_products();

		$api = $this->get_api_client();

		$products = $api->get_products_from_api();
		$composite_products = $api->get_composite_products_from_api();

		$total_products = is_array( $products ) ? count( $products ) : 0;
		$total_composite = is_array( $composite_products ) ? count( $composite_products ) : 0;

		if ( 0 === $total_products && 0 === $total_composite ) {
			return array(
				array( 'type' => 'warning', 'text' => 'No products available for sync from the API response' ),
			);
		}

		if ( is_array( $products ) && ! empty( $products ) ) {
			foreach ( $products as $product ) {
				as_schedule_single_action( time(), 'import_single_product', array( $product ) );
			}
		}

		if ( is_array( $composite_products ) && ! empty( $composite_products ) ) {
			foreach ( $composite_products as $composite_group ) {
				as_schedule_single_action( time(), 'import_composite_product_group', array( $composite_group ) );
			}
		}

		return array(
			array( 'type' => 'success', 'text' => sprintf( 'Product import scheduled (%d single + %d composite)', $total_products, $total_composite ) ),
		);
	}

	private function clear_stale_import_actions() {
		if ( ! $this->is_action_scheduler_available() ) {
			return;
		}

		$hooks = array( 'import_single_product', 'import_composite_product_group' );
		$statuses = array( 'pending', 'complete' );

		foreach ( $hooks as $hook ) {
			foreach ( $statuses as $status ) {
				$actions = as_get_scheduled_actions(
					array(
						'status'   => $status,
						'hook'     => $hook,
						'per_page' => -1,
					)
				);

				foreach ( $actions as $action ) {
					$action_id = is_object( $action ) && isset( $action->get_id ) ? $action->get_id() : null;
					if ( $action_id ) {
						as_delete_action( $action_id );
					}
				}
			}
		}
	}

	private function delete_existing_sync_products() {
		global $wpdb;

		$sync_product_ids = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT pm.post_id FROM {$wpdb->postmeta} pm WHERE pm.meta_key = %s AND pm.meta_value = %s",
				'pw_isSyncProduct',
				'1'
			)
		);

		if ( empty( $sync_product_ids ) ) {
			return;
		}

		foreach ( $sync_product_ids as $post_id ) {
			if ( (int) $post_id > 0 ) {
				wp_delete_post( (int) $post_id, true );
			}
		}
	}

	private function is_action_scheduler_available() {
		return function_exists( 'as_schedule_single_action' ) && function_exists( 'as_get_scheduled_actions' );
	}

	private function verify_ajax_nonce( $action, $field ) {
		if ( ! isset( $_POST[ $field ] ) ) {
			return false;
		}

		return wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST[ $field ] ) ), $action );
	}

	private function get_api_client() {
		return new Pwca_Admin_Promowares_Api();
	}

	private function resolve_single_product_payload( array $product ) {
		$product_id = isset( $product['id'] ) ? (int) $product['id'] : 0;
		if ( $product_id <= 0 ) {
			return null;
		}

		$name              = isset( $product['name'] ) ? sanitize_text_field( (string) $product['name'] ) : '';
		$description       = isset( $product['description'] ) ? wp_kses_post( (string) $product['description'] ) : '';
		$short_description = isset( $product['short_description'] ) ? wp_kses_post( (string) $product['short_description'] ) : '';

		$sku          = isset( $product['sku'] ) ? sanitize_text_field( (string) $product['sku'] ) : '';
		$price        = isset( $product['price'] ) ? (string) $product['price'] : '';
		$anchor_price = isset( $product['anchor_price'] ) ? (string) $product['anchor_price'] : '';

		if ( $name === '' ) {
			return null;
		}

		return array(
			'id'                => $product_id,
			'name'              => $name,
			'description'       => $description,
			'short_description' => $short_description,
			'blank_item'        => isset( $product['blank_item'] ) ? (int) $product['blank_item'] : 0,
			'inquiry_button'    => isset( $product['inquiry_button'] ) ? (int) $product['inquiry_button'] : 0,
			'price'             => $price,
			'anchor_price'      => $anchor_price,
			'sku'               => $sku,
			'product_image'     => isset( $product['product_image'] ) ? esc_url_raw( (string) $product['product_image'] ) : '',
			'raw_data'          => $product,
		);
	}

	private function store_single_product_meta( $post_id, array $resolved ) {
		update_post_meta( $post_id, 'pw_id', $resolved['id'] );
		update_post_meta( $post_id, 'pw_blank_item', $resolved['blank_item'] );
		update_post_meta( $post_id, 'pw_inquiry_button', $resolved['inquiry_button'] );
		update_post_meta( $post_id, '_price', $resolved['price'] );
		update_post_meta( $post_id, '_regular_price', $resolved['anchor_price'] );
		update_post_meta( $post_id, '_sku', $resolved['sku'] );
		update_post_meta( $post_id, 'pw_isSyncProduct', true );
		update_post_meta( $post_id, 'pwca_raw_product_data', wp_json_encode( $resolved['raw_data'] ) );
	}

	private function maybe_store_product_templates( $post_id, $product_id ) {
		$api   = $this->get_api_client();
		$token = get_option( 'pw_api_token', '' );

		if ( (int) $product_id <= 0 ) {
			return;
		}

		$templates_response = $api->get_product_templates( (int) $product_id, (string) $token );
		if ( is_wp_error( $templates_response ) || ! is_array( $templates_response ) ) {
			return;
		}

		if ( ! isset( $templates_response['data']['custom_view']['main_custom_view']['layer_config'] ) ) {
			return;
		}

		$pw_main_custom_view = $templates_response['data']['custom_view']['main_custom_view'];
		update_post_meta( $post_id, 'pw_main_custom_view', $pw_main_custom_view );

		$pw_sub_custom_view = isset( $templates_response['data']['custom_view']['sub_custom_view'] ) ? $templates_response['data']['custom_view']['sub_custom_view'] : array();
		update_post_meta( $post_id, 'pw_sub_custom_view', $pw_sub_custom_view );
	}

	private function maybe_set_product_featured_image( $product_id, $image_url ) {
		$image_url = (string) $image_url;
		if ( $image_url === '' || (int) $product_id <= 0 ) {
			return false;
		}

		$remote = $this->fetch_remote_image_payload( $image_url );
		if ( ! $remote ) {
			return false;
		}

		$upload = $this->upload_image_bits( $remote['filename'], $remote['body'] );
		if ( ! $upload ) {
			return false;
		}

		$attachment_id = $this->create_attachment_from_upload( $upload, $remote['filename'] );
		if ( ! $attachment_id ) {
			return false;
		}

		$this->generate_attachment_metadata( $attachment_id, $upload['file'] );
		set_post_thumbnail( (int) $product_id, (int) $attachment_id );
		return true;
	}

	private function fetch_remote_image_payload( $image_url ) {
		$image_data = wp_remote_get( (string) $image_url );
		if ( is_wp_error( $image_data ) || 200 !== wp_remote_retrieve_response_code( $image_data ) ) {
			return null;
		}

		$image_body = wp_remote_retrieve_body( $image_data );
		if ( $image_body === '' ) {
			return null;
		}

		$filename = $this->resolve_image_filename( (string) $image_url, $image_data );
		if ( $filename === '' ) {
			return null;
		}

		$normalized = $this->normalize_image_to_square( $image_body );

		return array(
			'filename' => $filename,
			'body'     => $normalized,
		);
	}

	private function normalize_image_to_square( $image_body ) {
		$image_body = (string) $image_body;
		if ( $image_body === '' || ! function_exists( 'imagecreatefromstring' ) || ! function_exists( 'imagecreatetruecolor' ) ) {
			return $image_body;
		}

		$image_info = @getimagesizefromstring( $image_body );
		if ( ! is_array( $image_info ) || empty( $image_info[0] ) || empty( $image_info[1] ) || empty( $image_info['mime'] ) ) {
			return $image_body;
		}

		$width = (int) $image_info[0];
		$height = (int) $image_info[1];
		$mime = (string) $image_info['mime'];
		if ( $width <= 0 || $height <= 0 || $width === $height ) {
			return $image_body;
		}

		$is_jpeg = in_array( $mime, array( 'image/jpeg', 'image/jpg' ), true );
		$is_png  = 'image/png' === $mime;
		if ( ! $is_jpeg && ! $is_png ) {
			return $image_body;
		}

		$source = @imagecreatefromstring( $image_body );
		if ( ! $source ) {
			return $image_body;
		}

		$size = max( $width, $height );
		$canvas = imagecreatetruecolor( $size, $size );
		if ( ! $canvas ) {
			imagedestroy( $source );
			return $image_body;
		}

		if ( $is_png ) {
			imagealphablending( $canvas, false );
			$transparent = imagecolorallocatealpha( $canvas, 0, 0, 0, 127 );
			imagefilledrectangle( $canvas, 0, 0, $size, $size, $transparent );
			imagesavealpha( $canvas, true );
		} else {
			$white = imagecolorallocate( $canvas, 255, 255, 255 );
			imagefilledrectangle( $canvas, 0, 0, $size, $size, $white );
		}

		$dst_x = (int) floor( ( $size - $width ) / 2 );
		$dst_y = (int) floor( ( $size - $height ) / 2 );
		imagecopy( $canvas, $source, $dst_x, $dst_y, 0, 0, $width, $height );

		ob_start();
		if ( $is_png ) {
			imagepng( $canvas );
		} else {
			imagejpeg( $canvas, null, 90 );
		}
		$normalized = ob_get_clean();

		imagedestroy( $canvas );
		imagedestroy( $source );

		if ( ! is_string( $normalized ) || $normalized === '' ) {
			return $image_body;
		}

		return $normalized;
	}

	private function resolve_image_filename( $image_url, $image_data ) {
		$file_info = pathinfo( (string) $image_url );
		$filename  = isset( $file_info['basename'] ) ? sanitize_file_name( (string) $file_info['basename'] ) : '';
		if ( $filename === '' ) {
			$filename = 'pwca-product-image';
		}

		if ( empty( $file_info['extension'] ) ) {
			$filename .= $this->resolve_extension_from_content_type( $image_data );
		}

		return $filename;
	}

	private function upload_image_bits( $filename, $body ) {
		$upload = wp_upload_bits( (string) $filename, null, (string) $body );
		if ( ! empty( $upload['error'] ) ) {
			return null;
		}

		if ( empty( $upload['file'] ) ) {
			return null;
		}

		return $upload;
	}

	private function create_attachment_from_upload( array $upload, $filename ) {
		$filetype   = wp_check_filetype( $upload['file'] );
		$attachment = array(
			'post_mime_type' => $filetype['type'],
			'post_title'     => sanitize_text_field( (string) $filename ),
			'post_content'   => '',
			'post_status'    => 'inherit',
		);

		$attachment_id = wp_insert_attachment( $attachment, $upload['file'] );
		if ( is_wp_error( $attachment_id ) ) {
			return 0;
		}

		return (int) $attachment_id;
	}

	private function generate_attachment_metadata( $attachment_id, $file_path ) {
		require_once ABSPATH . 'wp-admin/includes/image.php';
		$attachment_data = wp_generate_attachment_metadata( (int) $attachment_id, (string) $file_path );
		wp_update_attachment_metadata( (int) $attachment_id, $attachment_data );
	}

	private function resolve_extension_from_content_type( $image_data ) {
		$content_type = wp_remote_retrieve_header( $image_data, 'content-type' );
		switch ( (string) $content_type ) {
			case 'image/jpeg':
				return '.jpg';
			case 'image/png':
				return '.png';
			case 'image/gif':
				return '.gif';
			case 'image/webp':
				return '.webp';
		}
		return '';
	}

	private function create_composite_products( $main_product_id, array $products, $container_name = '' ) {
		$created_product_ids = array();
		$main_post_id        = null;

		foreach ( $products as $product ) {
			if ( ! is_array( $product ) ) {
				continue;
			}

			$payload = $this->resolve_composite_product_payload( $product );
			if ( ! $payload ) {
				continue;
			}

			$post_title = ! empty( $container_name ) ? sanitize_text_field( $container_name ) : $payload['name'];

			$post_id = wp_insert_post(
				array(
					'post_title'   => $post_title,
					'post_content' => $payload['description'],
					'post_excerpt' => $payload['short_description'],
					'post_status'  => 'publish',
					'post_type'    => 'product',
				)
			);

			if ( ! $post_id ) {
				continue;
			}

			$payload['original_name'] = $payload['name'];
			$this->store_composite_product_meta( $post_id, $payload, (int) $main_product_id );
			$this->maybe_set_product_featured_image( $post_id, $payload['product_image'] );

			$created_product_ids[ $payload['id'] ] = $post_id;

			if ( (int) $payload['id'] === (int) $main_product_id ) {
				$main_post_id = $post_id;
				update_post_meta( $post_id, 'pw_is_composite_main', true );
				update_post_meta( $post_id, 'pw_composite_main_id', (int) $main_product_id );
			}
		}

		return array(
			'created_product_ids' => $created_product_ids,
			'main_post_id'        => $main_post_id,
		);
	}

	private function resolve_composite_product_payload( array $product ) {
		$product_id = isset( $product['id'] ) ? (int) $product['id'] : 0;
		if ( $product_id <= 0 ) {
			return null;
		}

		$name              = isset( $product['name'] ) ? sanitize_text_field( (string) $product['name'] ) : '';
		$description       = isset( $product['description'] ) ? wp_kses_post( (string) $product['description'] ) : '';
		$short_description = isset( $product['short_description'] ) ? wp_kses_post( (string) $product['short_description'] ) : '';

		if ( $name === '' ) {
			return null;
		}

		return array(
			'id'                => $product_id,
			'name'              => $name,
			'description'       => $description,
			'short_description' => $short_description,
			'blank_item'        => isset( $product['blank_item'] ) ? (int) $product['blank_item'] : 0,
			'inquiry_button'    => isset( $product['inquiry_button'] ) ? (int) $product['inquiry_button'] : 0,
			'price'             => isset( $product['price'] ) ? (string) $product['price'] : '',
			'anchor_price'      => isset( $product['anchor_price'] ) ? (string) $product['anchor_price'] : '',
			'sku'               => isset( $product['sku'] ) ? sanitize_text_field( (string) $product['sku'] ) : '',
			'product_type'      => isset( $product['product_type'] ) ? sanitize_text_field( (string) $product['product_type'] ) : '',
			'product_image'     => isset( $product['product_image'] ) ? esc_url_raw( (string) $product['product_image'] ) : '',
			'container_id'     => isset( $product['container_id'] ) ? (int) $product['container_id'] : 0,
			'label_value'      => isset( $product['label_value'] ) ? sanitize_text_field( (string) $product['label_value'] ) : '',
			'raw_data'         => $product,
		);
	}

	private function store_composite_product_meta( $post_id, array $payload, $main_product_id ) {
		update_post_meta( $post_id, 'pw_id', $payload['id'] );
		update_post_meta( $post_id, 'pw_blank_item', $payload['blank_item'] );
		update_post_meta( $post_id, 'pw_inquiry_button', $payload['inquiry_button'] );
		update_post_meta( $post_id, '_price', $payload['price'] );
		update_post_meta( $post_id, '_regular_price', $payload['anchor_price'] );
		update_post_meta( $post_id, '_sku', $payload['sku'] );
		update_post_meta( $post_id, 'pw_isSyncProduct', true );
		update_post_meta( $post_id, 'pw_product_type', $payload['product_type'] );
		update_post_meta( $post_id, 'pw_composite_main_id', (int) $main_product_id );
		update_post_meta( $post_id, 'pw_composite_main_post_id', 0 );
		update_post_meta( $post_id, 'pw_container_value', $payload['label_value'] );
		if ( isset( $payload['original_name'] ) ) {
			update_post_meta( $post_id, 'pw_composite_original_name', $payload['original_name'] );
		}
		if ( isset( $payload['raw_data'] ) ) {
			update_post_meta( $post_id, 'pwca_raw_product_data', wp_json_encode( $payload['raw_data'] ) );
		}
	}

	private function link_composite_products( $main_post_id, array $created_product_ids ) {
		$related_product_ids = array();
		foreach ( $created_product_ids as $pw_id => $wp_post_id ) {
			$related_product_ids[] = (int) $wp_post_id;
			update_post_meta( (int) $wp_post_id, 'pw_composite_main_post_id', (int) $main_post_id );
		}

		$related_product_ids = array_values( array_diff( array_map( 'intval', $related_product_ids ), array( (int) $main_post_id ) ) );
		update_post_meta( (int) $main_post_id, 'pw_composite_related_products', $related_product_ids );
		update_post_meta( (int) $main_post_id, 'pw_composite_all_product_ids', array_values( array_map( 'intval', $created_product_ids ) ) );
	}

	private function maybe_create_grouped_product( $main_post_id, array $created_product_ids, $container_name = '' ) {
		if ( ! function_exists( 'wp_set_object_terms' ) ) {
			return 0;
		}

		$related_product_ids = array_values(
			array_diff(
				array_map( 'intval', array_values( $created_product_ids ) ),
				array( (int) $main_post_id )
			)
		);

		if ( empty( $related_product_ids ) ) {
			return 0;
		}

		$group_title = ! empty( $container_name ) ? sanitize_text_field( $container_name ) : ( get_the_title( (int) $main_post_id ) . ' - Group' );
		$group_post_id = wp_insert_post(
			array(
				'post_title'   => $group_title,
				'post_status'  => 'publish',
				'post_type'    => 'product',
				'post_content' => '',
			)
		);

		if ( ! $group_post_id ) {
			return 0;
		}

		wp_set_object_terms( (int) $group_post_id, 'grouped', 'product_type' );
		update_post_meta( (int) $group_post_id, 'pw_isSyncProduct', true );
		update_post_meta( (int) $group_post_id, 'pw_is_composite_group', true );
		update_post_meta( (int) $group_post_id, 'pw_composite_main_post_id', (int) $main_post_id );
		update_post_meta( (int) $group_post_id, '_children', $related_product_ids );

		$related_with_group = array_values( array_unique( array_merge( $related_product_ids, array( (int) $group_post_id ) ) ) );
		update_post_meta( (int) $main_post_id, 'pw_composite_related_products', $related_with_group );

		return (int) $group_post_id;
	}

	private function maybe_schedule_container_rules_processing( $main_product_id, array $products, array $composite_group, array $created_product_ids, $main_post_id ) {
		if ( ! $this->is_action_scheduler_available() ) {
			return;
		}

		$main_product_data = $this->find_main_product_data( (int) $main_product_id, $products );
		if ( ! $main_product_data ) {
			return;
		}

		$container_id = isset( $main_product_data['container_id'] ) ? (int) $main_product_data['container_id'] : 0;
		if ( $container_id <= 0 ) {
			return;
		}

		$args_json = wp_json_encode(
			array(
				'container_id'        => (int) $container_id,
				'composite_group'     => $composite_group,
				'created_product_ids' => $created_product_ids,
				'main_post_id'        => (int) $main_post_id,
			)
		);

		as_schedule_single_action( time() + 5, 'process_container_rules', array( $args_json ) );
	}

	private function find_main_product_data( $main_product_id, array $products ) {
		foreach ( $products as $product ) {
			if ( ! is_array( $product ) ) {
				continue;
			}

			$product_id = isset( $product['id'] ) ? (int) $product['id'] : 0;
			if ( $product_id === (int) $main_product_id ) {
				return $product;
			}
		}
		return null;
	}

	private function apply_container_rules( $container_id, array $container_info, array $label_values, array $created_product_ids ) {
		$container_name  = isset( $container_info['container_name'] ) ? sanitize_text_field( (string) $container_info['container_name'] ) : '';
		$container_label = isset( $container_info['container_label'] ) ? sanitize_text_field( (string) $container_info['container_label'] ) : '';

		foreach ( $label_values as $label_value ) {
			if ( ! is_array( $label_value ) ) {
				continue;
			}

			$pw_product_id    = isset( $label_value['product_id'] ) ? (int) $label_value['product_id'] : 0;
			$label_value_text = isset( $label_value['label_value'] ) ? sanitize_text_field( (string) $label_value['label_value'] ) : '';
			$is_default       = isset( $label_value['is_default'] ) ? (int) $label_value['is_default'] : 0;

			if ( $pw_product_id <= 0 || ! isset( $created_product_ids[ $pw_product_id ] ) ) {
				continue;
			}

			$wp_post_id = (int) $created_product_ids[ $pw_product_id ];
			update_post_meta( $wp_post_id, 'pw_container_id', (int) $container_id );
			update_post_meta( $wp_post_id, 'pw_container_value', $label_value_text );
			update_post_meta( $wp_post_id, 'pw_container_name', $container_name );
			update_post_meta( $wp_post_id, 'pw_container_label', $container_label );
			update_post_meta( $wp_post_id, 'pw_container_is_default', (int) $is_default );
		}
	}
}
