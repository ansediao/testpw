<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Pwca_Admin_Design {
	private $module_path;
	private $module_url;
	private $page_hooks = array();

	public static function bootstrap( $module_path, $module_url ) {
		$instance = new self( $module_path, $module_url );
		$instance->register();
	}

	private function __construct( $module_path, $module_url ) {
		$this->module_path = trailingslashit( (string) $module_path );
		$this->module_url  = trailingslashit( (string) $module_url );
	}

	public function register() {
		add_action( 'admin_menu', array( $this, 'register_menu_pages' ), 11 );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
		add_filter( 'parent_file', array( $this, 'fix_tags_menu_highlight' ) );
		add_action( 'add_meta_boxes_pw_design', array( $this, 'register_pw_design_price_metabox' ) );
		add_action( 'save_post_pw_design', array( $this, 'save_pw_design_price_meta' ) );
		add_action( 'wp_ajax_pw_add_category', array( $this, 'handle_add_category' ) );
		add_action( 'wp_ajax_pw_get_category_settings', array( $this, 'handle_get_category_settings' ) );
		add_action( 'wp_ajax_pw_update_category_settings', array( $this, 'handle_update_category_settings' ) );
		add_action( 'wp_ajax_pw_delete_category', array( $this, 'handle_delete_category' ) );
		add_action( 'wp_ajax_pw_add_design', array( $this, 'handle_add_design' ) );
		add_action( 'wp_ajax_pw_check_design_sku_unique', array( $this, 'handle_check_design_sku_unique' ) );
		add_action( 'wp_ajax_pw_get_design_tags', array( $this, 'handle_get_design_tags' ) );
		add_action( 'wp_ajax_pw_save_design_tags', array( $this, 'handle_save_design_tags' ) );
		add_action( 'wp_ajax_pw_bulk_delete_designs', array( $this, 'handle_bulk_delete_designs' ) );
		add_action( 'wp_ajax_pw_bulk_update_designs', array( $this, 'handle_bulk_update_designs' ) );
		add_action( 'wp_ajax_pw_get_design_data', array( $this, 'handle_get_design_data' ) );
		add_action( 'wp_ajax_pw_update_design_meta', array( $this, 'handle_update_design_meta' ) );
	}

	public function register_pw_design_price_metabox() {
		add_meta_box(
			'pw_design_price_metabox',
			'价格',
			array( $this, 'render_pw_design_price_metabox' ),
			'pw_design',
			'side',
			'default'
		);
	}

	public function render_pw_design_price_metabox( $post ) {
		wp_nonce_field( 'pw_design_price_nonce', 'pw_design_price_nonce_field' );
		$value = get_post_meta( $post->ID, '_pw_design_price', true );
		echo '<label for="pw_design_price">价格</label>';
		echo '<input type="number" id="pw_design_price" name="pw_design_price" value="' . esc_attr( (string) $value ) . '" min="0" step="0.01" style="width:100%" />';
	}

	public function save_pw_design_price_meta( $post_id ) {
		$nonce = isset( $_POST['pw_design_price_nonce_field'] ) ? sanitize_text_field( wp_unslash( $_POST['pw_design_price_nonce_field'] ) ) : '';
		if ( ! wp_verify_nonce( $nonce, 'pw_design_price_nonce' ) ) {
			return;
		}
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		$price = isset( $_POST['pw_design_price'] ) ? wp_unslash( $_POST['pw_design_price'] ) : null;
		if ( null === $price || '' === $price ) {
			delete_post_meta( $post_id, '_pw_design_price' );
			return;
		}

		update_post_meta( $post_id, '_pw_design_price', (float) $price );
	}

	public function register_menu_pages() {
		$design_capability = $this->get_design_edit_capability();

		$this->page_hooks['pw-design-library'] = add_submenu_page(
			'pw-dashboard',
			'Design Library',
			'Design Library',
			$design_capability,
			'pw-design-library',
			array( $this, 'render_design_library_page' )
		);

		add_submenu_page(
			'pw-dashboard',
			'Tags',
			'Tags',
			$design_capability,
			'edit-tags.php?taxonomy=pw_design_tag'
		);
	}

	public function enqueue_assets( $hook ) {
		if ( ! $this->should_load_assets( (string) $hook ) ) {
			return;
		}

		wp_enqueue_style(
			'pwca-admin-design-management',
			$this->module_url . 'assets/scss/pwca-admin-design-management.css',
			array(),
			null
		);

		wp_enqueue_style(
			'pwca-admin-design-micromodal',
			$this->module_url . 'assets/scss/pwca-admin-design-micromodal.css',
			array(),
			null
		);

		wp_enqueue_script(
			'pwca-vue',
			'https://unpkg.com/vue@3/dist/vue.global.prod.js',
			array(),
			'3.0.0',
			true
		);

		wp_enqueue_script(
			'pwca-admin-design-app',
			$this->module_url . 'assets/js/pwca-admin-design-app.js',
			array( 'pwca-vue' ),
			null,
			true
		);

		wp_enqueue_script(
			'pwca-admin-design-modals',
			$this->module_url . 'assets/js/pwca-admin-design-modals.js',
			array( 'jquery' ),
			null,
			true
		);
	}

	public function render_design_library_page() {
		if ( ! current_user_can( $this->get_design_edit_capability() ) ) {
			wp_die( esc_html__( 'You do not have sufficient permissions to access this page.' ) );
		}

		$view_model = $this->get_design_library_view_model();
		$this->render_view( 'design-library.php', array( 'view_model' => $view_model ) );
	}

	public function fix_tags_menu_highlight( $parent_file ) {
		global $pagenow;

		if ( 'edit-tags.php' !== $pagenow ) {
			return $parent_file;
		}

		$taxonomy = isset( $_GET['taxonomy'] ) ? sanitize_text_field( wp_unslash( $_GET['taxonomy'] ) ) : '';
		if ( 'pw_design_tag' !== $taxonomy ) {
			return $parent_file;
		}

		return 'pw-dashboard';
	}

	public function handle_add_category() {
		$nonce = $this->get_post_text( 'nonce' );
		$this->verify_nonce_or_exit( $nonce, 'pw_add_category_nonce', '安全验证失败' );
		$this->require_capability_or_exit( 'manage_categories' );

		$category_name = $this->get_post_text( 'category_name' );
		$category_type = $this->get_post_text( 'category_type' );
		if ( '' === $category_name ) {
			wp_send_json_error( '分类名称不能为空' );
		}

		$term_data = wp_insert_term(
			$category_name,
			'pw_design_category',
			array(
				'description' => '分类类型: ' . $category_type,
			)
		);

		if ( is_wp_error( $term_data ) ) {
			wp_send_json_error( '创建分类失败: ' . $term_data->get_error_message() );
		}

		if ( isset( $term_data['term_id'] ) ) {
			update_term_meta( (int) $term_data['term_id'], 'category_type', $category_type );
		}

		wp_send_json_success(
			array(
				'message'       => '分类创建成功',
				'term_id'       => (int) $term_data['term_id'],
				'category_name' => $category_name,
				'category_type' => $category_type,
			)
		);
	}

	public function handle_get_category_settings() {
		$nonce = $this->get_post_text( 'nonce' );
		$this->verify_nonce_or_exit( $nonce, 'pw_add_category_nonce', '安全验证失败' );
		$this->require_capability_or_exit( 'manage_categories' );

		$category_id = $this->get_post_int( 'category_id' );
		if ( $category_id <= 0 ) {
			wp_send_json_error( '无效的分类ID' );
		}

		$category = get_term( $category_id, 'pw_design_category' );
		if ( is_wp_error( $category ) || ! $category ) {
			wp_send_json_error( '分类不存在' );
		}

		wp_send_json_success(
			array(
				'name'               => (string) $category->name,
				'description'        => (string) $category->description,
				'type'               => (string) ( get_term_meta( $category_id, 'category_type', true ) ?: 'general' ),
				'exclude_from_export' => (bool) get_term_meta( $category_id, 'exclude_from_export', true ),
				'layer_depth'        => (int) get_term_meta( $category_id, 'layer_depth', true ),
				'scale_mode'         => (string) ( get_term_meta( $category_id, 'scale_mode', true ) ?: 'fit' ),
				'allow_resize'       => (bool) get_term_meta( $category_id, 'allow_resize', true ),
				'allow_rotate'       => (bool) get_term_meta( $category_id, 'allow_rotate', true ),
				'allow_delete'       => (bool) get_term_meta( $category_id, 'allow_delete', true ),
				'base_price'         => (float) get_term_meta( $category_id, 'base_price', true ),
				'price_per_unit'     => (float) get_term_meta( $category_id, 'price_per_unit', true ),
				'price_enabled'      => (bool) get_term_meta( $category_id, 'price_enabled', true ),
			)
		);
	}

	public function handle_update_category_settings() {
		$nonce = $this->get_post_text( 'nonce' );
		$this->verify_nonce_or_exit( $nonce, 'pw_add_category_nonce', '安全验证失败' );
		$this->require_capability_or_exit( 'manage_categories' );

		$category_id = $this->get_post_int( 'category_id' );
		$category_name = $this->get_post_text( 'category_name' );
		$category_description = $this->get_post_textarea( 'category_description' );
		$category_type = $this->get_post_text( 'category_type' );

		if ( $category_id <= 0 ) {
			wp_send_json_error( '无效的分类ID' );
		}
		if ( '' === $category_name ) {
			wp_send_json_error( '分类名称不能为空' );
		}

		$term_data = wp_update_term(
			$category_id,
			'pw_design_category',
			array(
				'name'        => $category_name,
				'description' => $category_description,
			)
		);

		if ( is_wp_error( $term_data ) ) {
			wp_send_json_error( '更新分类失败: ' . $term_data->get_error_message() );
		}

		update_term_meta( $category_id, 'category_type', $category_type );
		update_term_meta( $category_id, 'exclude_from_export', $this->get_post_bool( 'exclude_from_export' ) );
		update_term_meta( $category_id, 'layer_depth', $this->get_post_int( 'layer_depth' ) );
		update_term_meta( $category_id, 'scale_mode', $this->get_post_text( 'scale_mode' ) );
		update_term_meta( $category_id, 'allow_resize', $this->get_post_bool( 'allow_resize' ) );
		update_term_meta( $category_id, 'allow_rotate', $this->get_post_bool( 'allow_rotate' ) );
		update_term_meta( $category_id, 'allow_delete', $this->get_post_bool( 'allow_delete' ) );
		update_term_meta( $category_id, 'base_price', $this->get_post_float( 'base_price' ) );
		update_term_meta( $category_id, 'price_per_unit', $this->get_post_float( 'price_per_unit' ) );
		update_term_meta( $category_id, 'price_enabled', $this->get_post_bool( 'price_enabled' ) );

		wp_send_json_success(
			array(
				'message'       => '分类设置更新成功',
				'category_id'   => $category_id,
				'category_name' => $category_name,
			)
		);
	}

	public function handle_delete_category() {
		$nonce = $this->get_post_text( 'nonce' );
		$this->verify_nonce_or_exit( $nonce, 'pw_add_category_nonce', '安全验证失败' );
		$this->require_capability_or_exit( 'manage_categories' );

		$category_id = $this->get_post_int( 'category_id' );
		if ( $category_id <= 0 ) {
			wp_send_json_error( '无效的分类ID' );
		}

		$result = wp_delete_term( $category_id, 'pw_design_category' );
		if ( is_wp_error( $result ) ) {
			wp_send_json_error( '删除分类失败: ' . $result->get_error_message() );
		}
		if ( false === $result ) {
			wp_send_json_error( '删除分类失败: 分类不存在或无法删除' );
		}

		wp_send_json_success(
			array(
				'message'     => '分类删除成功',
				'category_id' => $category_id,
			)
		);
	}

	public function handle_add_design() {
		if ( 'POST' !== (string) ( $_SERVER['REQUEST_METHOD'] ?? '' ) ) {
			wp_send_json_error( '无效的请求方法' );
		}

		$nonce = $this->get_post_text( 'pw_add_design_nonce_field' );
		$this->verify_nonce_or_exit( $nonce, 'pw_add_design_nonce', 'Security check failed.' );
		$this->require_capability_or_exit( 'edit_posts' );

		$design_name = $this->get_post_text( 'design_name' );
		$design_category = $this->get_post_int( 'design_category' );
		$design_sku = $this->get_post_text( 'design_sku' );
		if ( '' === $design_name ) {
			wp_send_json_error( '设计名称不能为空' );
		}
		if ( '' === $design_sku ) {
			wp_send_json_error( 'SKU 不能为空' );
		}
		if ( ! $this->is_design_sku_unique( $design_sku ) ) {
			wp_send_json_error( 'SKU 已存在，请更换' );
		}

		$post_id = wp_insert_post(
			array(
				'post_title'  => $design_name,
				'post_type'   => 'pw_design',
				'post_status' => 'publish',
			)
		);

		if ( is_wp_error( $post_id ) ) {
			wp_send_json_error( '创建设计失败: ' . $post_id->get_error_message() );
		}

		if ( $design_category > 0 ) {
			wp_set_object_terms( $post_id, $design_category, 'pw_design_category' );
		}

		update_post_meta( (int) $post_id, '_design_sku', $design_sku );

		$attachment_id = $this->maybe_create_attachment_from_upload( 'design_image', (int) $post_id );
		if ( $attachment_id ) {
			set_post_thumbnail( (int) $post_id, $attachment_id );
		}

		wp_send_json_success(
			array(
				'message'      => '设计添加成功',
				'post_id'      => (int) $post_id,
				'redirect_url' => (string) get_edit_post_link( (int) $post_id ),
			)
		);
	}

	public function handle_check_design_sku_unique() {
		$nonce = $this->get_post_text( 'nonce' );
		$this->verify_nonce_or_exit( $nonce, 'pw_add_design_nonce', '安全验证失败' );
		$this->require_capability_or_exit( 'edit_posts' );

		$sku        = $this->get_post_text( 'sku' );
		$exclude_id = $this->get_post_int( 'exclude_id' );

		if ( '' === $sku ) {
			wp_send_json_error( 'SKU 不能为空' );
		}

		$is_unique = $this->is_design_sku_unique( $sku, $exclude_id );

		wp_send_json_success(
			array(
				'unique'  => $is_unique,
				'message' => $is_unique ? 'SKU 可用' : 'SKU 已存在，请更换',
			)
		);
	}

	public function handle_get_design_tags() {
		$nonce = $this->get_post_text( 'nonce' );
		$this->verify_nonce_or_exit( $nonce, 'pw_add_design_nonce', '安全验证失败' );

		$design_id = $this->get_post_int( 'design_id' );
		if ( $design_id <= 0 ) {
			wp_send_json_error( '无效的设计ID' );
		}

		$all_tags = get_terms(
			array(
				'taxonomy'   => 'pw_design_tag',
				'hide_empty' => false,
			)
		);
		if ( is_wp_error( $all_tags ) ) {
			wp_send_json_error( '加载标签失败' );
		}

		$current_tag_ids = wp_get_object_terms( $design_id, 'pw_design_tag', array( 'fields' => 'ids' ) );
		$current_set = array_map( 'intval', is_array( $current_tag_ids ) ? $current_tag_ids : array() );

		$tags = array();
		foreach ( (array) $all_tags as $tag ) {
			if ( ! $tag instanceof WP_Term ) {
				continue;
			}
			$tags[] = array(
				'id'      => (int) $tag->term_id,
				'name'    => (string) $tag->name,
				'checked' => in_array( (int) $tag->term_id, $current_set, true ),
			);
		}

		wp_send_json_success( array( 'tags' => $tags ) );
	}

	public function handle_save_design_tags() {
		$nonce = $this->get_post_text( 'nonce' );
		$this->verify_nonce_or_exit( $nonce, 'pw_add_design_nonce', '安全验证失败' );

		$design_id = $this->get_post_int( 'design_id' );
		$design    = $this->get_design_post_or_exit( $design_id );
		if ( ! current_user_can( 'edit_post', $design->ID ) ) {
			wp_send_json_error( '权限不足' );
		}

		$tags_raw = isset( $_POST['tags'] ) ? wp_unslash( $_POST['tags'] ) : array();
		if ( is_array( $tags_raw ) ) {
			$tags = array_map( 'intval', $tags_raw );
		} else {
			$raw = sanitize_text_field( (string) $tags_raw );
			if ( '' === $raw ) {
				$tags = array();
			} else {
				$tags = array_map( 'intval', explode( ',', $raw ) );
			}
		}

		$result = wp_set_object_terms( $design_id, $tags, 'pw_design_tag' );
		if ( is_wp_error( $result ) ) {
			wp_send_json_error( '标签保存失败: ' . $result->get_error_message() );
		}

		wp_send_json_success(
			array(
				'message' => '标签保存成功',
				'tags'    => array_values( array_filter( array_map( 'intval', (array) $result ) ) ),
			)
		);
	}

	public function handle_bulk_delete_designs() {
		$nonce = $this->get_post_text( 'nonce' );
		$this->verify_nonce_or_exit( $nonce, 'pw_bulk_delete_designs_nonce', '安全验证失败' );
		$this->require_capability_or_exit( 'delete_posts' );

		$ids = $this->get_post_int_list( 'ids' );
		if ( empty( $ids ) ) {
			wp_send_json_error( '未选择任何设计' );
		}

		foreach ( $ids as $design_id ) {
			$post = get_post( $design_id );
			if ( ! $post || 'pw_design' !== $post->post_type ) {
				continue;
			}
			wp_delete_post( $design_id, true );
		}

		wp_send_json_success( '删除成功' );
	}

	public function handle_bulk_update_designs() {
		$nonce = $this->get_post_text( 'nonce' );
		$this->verify_nonce_or_exit( $nonce, 'pw_bulk_update_designs_nonce', '安全验证失败' );
		$this->require_capability_or_exit( 'edit_posts' );

		$ids = $this->get_post_int_list( 'ids' );
		$fields_json = $this->get_post_text( 'fields' );

		if ( empty( $ids ) ) {
			wp_send_json_error( '未选择任何设计' );
		}
		if ( '' === $fields_json ) {
			wp_send_json_error( '未提供更新字段' );
		}

		$fields = json_decode( $fields_json, true );
		if ( ! is_array( $fields ) ) {
			wp_send_json_error( '字段格式错误' );
		}

		foreach ( $ids as $design_id ) {
			$this->bulk_update_design( $design_id, $fields );
		}

		wp_send_json_success( '更新成功' );
	}

	public function handle_get_design_data() {
		$nonce = $this->get_post_text( 'nonce' );
		$this->verify_nonce_or_exit( $nonce, 'pw_admin_nonce', 'Invalid nonce' );

		$design_id = $this->get_post_int( 'design_id' );
		$design    = $this->get_design_post_or_exit( $design_id );
		$categories_data = $this->get_categories_for_design_edit();
		$current_category = $this->get_design_primary_category_id( $design_id );
		$tags_string      = $this->get_design_tags_string( $design_id );

		wp_send_json_success(
			array(
				'id'               => $design_id,
				'name'             => (string) $design->post_title,
				'description'      => (string) get_post_meta( $design_id, '_pw_design_description', true ),
				'categories'       => $categories_data,
				'current_category' => $current_category,
				'tags'             => $tags_string,
				'enabled'          => (bool) get_post_meta( $design_id, '_pw_design_enabled', true ),
				'priority'         => (int) get_post_meta( $design_id, '_pw_design_priority', true ),
				'featured'         => (bool) get_post_meta( $design_id, '_pw_design_featured', true ),
				'visibility'       => (string) ( get_post_meta( $design_id, '_pw_design_visibility', true ) ?: 'public' ),
				'allow_download'   => (bool) get_post_meta( $design_id, '_pw_design_allow_download', true ),
				'exclude_export'   => (bool) get_post_meta( $design_id, '_design_exclude_export', true ),
				'layer_depth'      => (int) ( get_post_meta( $design_id, '_design_layer_depth', true ) ?: 1 ),
				'scale_mode'       => (string) ( get_post_meta( $design_id, '_design_scale_mode', true ) ?: 'fit' ),
				'stay_on_top'      => (bool) get_post_meta( $design_id, '_design_stay_on_top', true ),
				'auto_select'      => (bool) get_post_meta( $design_id, '_design_auto_select', true ),
				'rotatable'        => (bool) get_post_meta( $design_id, '_design_rotatable', true ),
				'removable'        => (bool) get_post_meta( $design_id, '_design_removable', true ),
				'movable'          => (bool) get_post_meta( $design_id, '_design_movable', true ),
				'scalable'         => (bool) get_post_meta( $design_id, '_design_scalable', true ),
				'proportional_scaling' => (bool) get_post_meta( $design_id, '_design_proportional_scaling', true ),
				'scale_by'         => (string) ( get_post_meta( $design_id, '_design_scale_by', true ) ?: 'factor' ),
				'min_scale_limit'  => (float) ( get_post_meta( $design_id, '_design_min_scale_limit', true ) ?: 0.2 ),
				'price'            => (float) ( get_post_meta( $design_id, '_design_price', true ) ?: 0 ),
				'sku'              => (string) ( get_post_meta( $design_id, '_design_sku', true ) ?: '' ),
			)
		);
	}

	public function handle_update_design_meta() {
		$nonce = $this->get_post_text( 'nonce' );
		$this->verify_nonce_or_exit( $nonce, 'pw_admin_nonce', 'Invalid nonce' );

		$design_id = $this->get_post_int( 'design_id' );
		$this->get_design_post_or_exit( $design_id );

		$this->update_design_post_fields( $design_id );
		$this->update_design_taxonomies( $design_id );
		$this->update_design_meta_fields( $design_id );

		wp_send_json_success( 'Design updated successfully' );
	}

	private function update_design_post_fields( $design_id ) {
		if ( empty( $_POST['design_name'] ) ) {
			return;
		}

		wp_update_post(
			array(
				'ID'         => $design_id,
				'post_title' => sanitize_text_field( wp_unslash( $_POST['design_name'] ) ),
			)
		);
	}

	private function update_design_taxonomies( $design_id ) {
		$category_id = isset( $_POST['design_category'] ) ? (int) $_POST['design_category'] : 0;
		if ( $category_id > 0 ) {
			wp_set_post_terms( $design_id, array( $category_id ), 'pw_design_category' );
		} else {
			wp_set_post_terms( $design_id, array(), 'pw_design_category' );
		}

		if ( isset( $_POST['design_tags'] ) ) {
			$tags_raw = (string) wp_unslash( $_POST['design_tags'] );
			$tags     = array_filter( array_map( 'trim', explode( ',', $tags_raw ) ) );
			wp_set_post_terms( $design_id, $tags, 'pw_design_tag' );
		}
	}

	private function update_design_meta_fields( $design_id ) {
		if ( isset( $_POST['design_description'] ) ) {
			update_post_meta(
				$design_id,
				'_pw_design_description',
				sanitize_textarea_field( wp_unslash( $_POST['design_description'] ) )
			);
		}

		update_post_meta( $design_id, '_pw_design_enabled', isset( $_POST['design_enabled'] ) ? '1' : '0' );
		update_post_meta( $design_id, '_pw_design_featured', isset( $_POST['design_featured'] ) ? '1' : '0' );
		update_post_meta( $design_id, '_pw_design_allow_download', isset( $_POST['design_allow_download'] ) ? '1' : '0' );

		if ( isset( $_POST['design_priority'] ) ) {
			update_post_meta( $design_id, '_pw_design_priority', (int) $_POST['design_priority'] );
		}

		if ( isset( $_POST['design_visibility'] ) ) {
			$visibility = sanitize_text_field( wp_unslash( $_POST['design_visibility'] ) );
			if ( in_array( $visibility, array( 'public', 'private', 'draft' ), true ) ) {
				update_post_meta( $design_id, '_pw_design_visibility', $visibility );
			}
		}

		update_post_meta( $design_id, '_design_exclude_export', isset( $_POST['design_exclude_export'] ) ? '1' : '0' );
		update_post_meta( $design_id, '_design_stay_on_top', isset( $_POST['design_stay_on_top'] ) ? '1' : '0' );
		update_post_meta( $design_id, '_design_auto_select', isset( $_POST['design_auto_select'] ) ? '1' : '0' );
		update_post_meta( $design_id, '_design_rotatable', isset( $_POST['design_rotatable'] ) ? '1' : '0' );
		update_post_meta( $design_id, '_design_removable', isset( $_POST['design_removable'] ) ? '1' : '0' );
		update_post_meta( $design_id, '_design_movable', isset( $_POST['design_movable'] ) ? '1' : '0' );
		update_post_meta( $design_id, '_design_scalable', isset( $_POST['design_scalable'] ) ? '1' : '0' );
		update_post_meta( $design_id, '_design_proportional_scaling', isset( $_POST['design_proportional_scaling'] ) ? '1' : '0' );

		if ( isset( $_POST['design_layer_depth'] ) ) {
			update_post_meta( $design_id, '_design_layer_depth', (int) $_POST['design_layer_depth'] );
		}

		if ( isset( $_POST['design_scale_mode'] ) ) {
			$scale_mode = sanitize_text_field( wp_unslash( $_POST['design_scale_mode'] ) );
			if ( in_array( $scale_mode, array( 'fit', 'fill', 'stretch', 'none' ), true ) ) {
				update_post_meta( $design_id, '_design_scale_mode', $scale_mode );
			}
		}

		if ( isset( $_POST['design_scale_by'] ) ) {
			$scale_by = sanitize_text_field( wp_unslash( $_POST['design_scale_by'] ) );
			if ( in_array( $scale_by, array( 'factor', 'percentage', 'pixels' ), true ) ) {
				update_post_meta( $design_id, '_design_scale_by', $scale_by );
			}
		}

		if ( isset( $_POST['design_min_scale_limit'] ) ) {
			update_post_meta( $design_id, '_design_min_scale_limit', (float) $_POST['design_min_scale_limit'] );
		}

		if ( isset( $_POST['design_price'] ) ) {
			update_post_meta( $design_id, '_design_price', (float) $_POST['design_price'] );
		}

		if ( isset( $_POST['design_sku'] ) ) {
			update_post_meta( $design_id, '_design_sku', sanitize_text_field( wp_unslash( $_POST['design_sku'] ) ) );
		}
	}

	private function is_design_sku_unique( $sku, $exclude_post_id = 0 ) {
		$sku = sanitize_text_field( (string) $sku );
		if ( '' === $sku ) {
			return false;
		}

		$args = array(
			'post_type'      => 'pw_design',
			'post_status'    => 'any',
			'posts_per_page' => 1,
			'fields'         => 'ids',
			'meta_query'     => array(
				array(
					'key'   => '_design_sku',
					'value' => $sku,
				),
			),
		);

		if ( $exclude_post_id > 0 ) {
			$args['post__not_in'] = array( (int) $exclude_post_id );
		}

		$query = new WP_Query( $args );
		return empty( $query->posts );
	}

	private function get_post_text( $key ) {
		if ( ! isset( $_POST[ $key ] ) ) {
			return '';
		}
		return sanitize_text_field( wp_unslash( $_POST[ $key ] ) );
	}

	private function get_post_textarea( $key ) {
		if ( ! isset( $_POST[ $key ] ) ) {
			return '';
		}
		return sanitize_textarea_field( wp_unslash( $_POST[ $key ] ) );
	}

	private function get_post_int( $key ) {
		if ( ! isset( $_POST[ $key ] ) ) {
			return 0;
		}
		return (int) wp_unslash( $_POST[ $key ] );
	}

	private function get_post_float( $key ) {
		if ( ! isset( $_POST[ $key ] ) ) {
			return 0.0;
		}
		return (float) wp_unslash( $_POST[ $key ] );
	}

	private function get_post_bool( $key ) {
		if ( ! isset( $_POST[ $key ] ) ) {
			return false;
		}
		$value = wp_unslash( $_POST[ $key ] );
		if ( is_string( $value ) ) {
			return in_array( $value, array( '1', 'true', 'on', 'yes' ), true );
		}
		return (bool) $value;
	}

	private function verify_nonce_or_exit( $nonce, $action, $message ) {
		if ( ! wp_verify_nonce( $nonce, $action ) ) {
			wp_send_json_error( $message );
		}
	}

	private function require_capability_or_exit( $capability ) {
		if ( ! current_user_can( $capability ) ) {
			wp_send_json_error( '权限不足' );
		}
	}

	private function get_post_int_list( $key ) {
		if ( ! isset( $_POST[ $key ] ) ) {
			return array();
		}

		$value = wp_unslash( $_POST[ $key ] );
		if ( is_array( $value ) ) {
			return array_values( array_filter( array_map( 'intval', $value ) ) );
		}

		$raw = sanitize_text_field( (string) $value );
		if ( '' === $raw ) {
			return array();
		}

		return array_values( array_filter( array_map( 'intval', explode( ',', $raw ) ) ) );
	}

	private function get_design_post_or_exit( $design_id ) {
		if ( $design_id <= 0 ) {
			wp_send_json_error( 'Invalid design ID' );
		}
		$design = get_post( $design_id );
		if ( ! $design || 'pw_design' !== $design->post_type ) {
			wp_send_json_error( 'Design not found' );
		}
		return $design;
	}

	private function get_categories_for_design_edit() {
		$categories = get_terms(
			array(
				'taxonomy'   => 'pw_design_category',
				'hide_empty' => false,
			)
		);

		if ( empty( $categories ) || is_wp_error( $categories ) ) {
			return array();
		}

		$data = array();
		foreach ( $categories as $category ) {
			$data[] = array(
				'id'   => (int) $category->term_id,
				'name' => (string) $category->name,
			);
		}
		return $data;
	}

	private function get_design_primary_category_id( $design_id ) {
		$current_categories = wp_get_post_terms( $design_id, 'pw_design_category' );
		if ( empty( $current_categories ) || is_wp_error( $current_categories ) ) {
			return 0;
		}
		return (int) $current_categories[0]->term_id;
	}

	private function get_design_tags_string( $design_id ) {
		$tags = wp_get_post_terms(
			$design_id,
			'pw_design_tag',
			array(
				'fields' => 'names',
			)
		);

		if ( empty( $tags ) || is_wp_error( $tags ) ) {
			return '';
		}

		return implode( ', ', $tags );
	}

	private function maybe_create_attachment_from_upload( $file_key, $post_id ) {
		if ( empty( $_FILES[ $file_key ] ) || empty( $_FILES[ $file_key ]['name'] ) ) {
			return 0;
		}

		if ( ! function_exists( 'media_handle_upload' ) ) {
			require_once ABSPATH . 'wp-admin/includes/media.php';
			require_once ABSPATH . 'wp-admin/includes/file.php';
			require_once ABSPATH . 'wp-admin/includes/image.php';
		}

		$attachment_id = media_handle_upload( $file_key, $post_id );
		if ( is_wp_error( $attachment_id ) ) {
			return 0;
		}

		return (int) $attachment_id;
	}

	private function bulk_update_design( $design_id, array $fields ) {
		$post = get_post( $design_id );
		if ( ! $post || 'pw_design' !== $post->post_type ) {
			return;
		}

		foreach ( $fields as $field ) {
			$key = isset( $field['key'] ) ? (string) $field['key'] : '';
			$value = $field['value'] ?? null;
			$this->apply_bulk_update_field( (int) $design_id, $key, $value );
		}
	}

	private function apply_bulk_update_field( $design_id, $key, $value ) {
		if ( 'name' === $key && is_string( $value ) && '' !== $value ) {
			wp_update_post( array( 'ID' => $design_id, 'post_title' => sanitize_text_field( $value ) ) );
			return;
		}

		if ( 'status' === $key && is_string( $value ) ) {
			$allowed = array( 'publish', 'draft', 'pending', 'private' );
			if ( in_array( $value, $allowed, true ) ) {
				wp_update_post( array( 'ID' => $design_id, 'post_status' => $value ) );
			}
			return;
		}

		if ( 'price' === $key && ( is_string( $value ) || is_numeric( $value ) ) ) {
			update_post_meta( $design_id, '_pw_design_price', (float) $value );
			return;
		}

		if ( 'category' === $key && ( is_string( $value ) || is_numeric( $value ) ) ) {
			$term_id = $this->resolve_category_term_id( $value );
			if ( $term_id > 0 ) {
				wp_set_post_terms( $design_id, array( $term_id ), 'pw_design_category' );
			}
			return;
		}

		if ( 'tags' === $key ) {
			$tags = is_array( $value ) ? $value : ( is_string( $value ) ? explode( ',', $value ) : array() );
			$tags = array_filter( array_map( 'sanitize_text_field', array_map( 'strval', $tags ) ) );
			wp_set_post_terms( $design_id, $tags, 'pw_design_tag' );
		}
	}

	private function resolve_category_term_id( $value ) {
		if ( is_numeric( $value ) ) {
			return (int) $value;
		}
		$slug = sanitize_title( (string) $value );
		if ( '' === $slug ) {
			return 0;
		}
		$term = get_term_by( 'slug', $slug, 'pw_design_category' );
		if ( ! $term || is_wp_error( $term ) ) {
			return 0;
		}
		return (int) $term->term_id;
	}

	private function get_design_library_view_model() {
		$filters = $this->get_filters_from_request();
		$terms   = $this->get_design_categories_terms();

		return array(
			'ajax_url'           => admin_url( 'admin-ajax.php' ),
			'nonces'             => array(
				'add_category' => wp_create_nonce( 'pw_add_category_nonce' ),
				'add_design'   => wp_create_nonce( 'pw_add_design_nonce' ),
				'bulk_delete'  => wp_create_nonce( 'pw_bulk_delete_designs_nonce' ),
				'bulk_update'  => wp_create_nonce( 'pw_bulk_update_designs_nonce' ),
				'admin'        => wp_create_nonce( 'pw_admin_nonce' ),
			),
			'filters'            => $filters,
			'terms'              => $terms,
			'designs_data'        => $this->query_designs_data( $filters ),
			'categories_data'     => $this->format_categories_data( $terms ),
		);
	}

	private function get_filters_from_request() {
		$selected_category = isset( $_GET['category'] ) ? sanitize_text_field( wp_unslash( $_GET['category'] ) ) : '';
		$search_query      = isset( $_GET['s'] ) ? sanitize_text_field( wp_unslash( $_GET['s'] ) ) : '';
		$selected_tab      = isset( $_GET['tab'] ) ? sanitize_text_field( wp_unslash( $_GET['tab'] ) ) : 'all';

		if ( ! in_array( $selected_tab, array( 'all', 'universal', 'universal-main-view', 'product-specific' ), true ) ) {
			$selected_tab = 'all';
		}

		return array(
			'selected_category' => $selected_category,
			'search_query'      => $search_query,
			'selected_tab'      => $selected_tab,
		);
	}

	private function query_designs_data( array $filters ) {
		$args = array(
			'post_type'      => 'pw_design',
			'posts_per_page' => -1,
			'post_status'    => array( 'publish' ),
		);

		if ( ! empty( $filters['search_query'] ) ) {
			$args['s'] = $filters['search_query'];
		}

		if ( ! empty( $filters['selected_category'] ) ) {
			$args['tax_query'] = array(
				array(
					'taxonomy' => 'pw_design_category',
					'field'    => 'slug',
					'terms'    => $filters['selected_category'],
				),
			);
		}

		$tag_slug = $this->map_tab_to_tag_slug( (string) $filters['selected_tab'] );
		if ( '' !== $tag_slug ) {
			if ( ! isset( $args['tax_query'] ) ) {
				$args['tax_query'] = array();
			}

			if ( ! empty( $args['tax_query'] ) && ! isset( $args['tax_query']['relation'] ) ) {
				$args['tax_query']['relation'] = 'AND';
			}

			$args['tax_query'][] = array(
				'taxonomy' => 'pw_design_tag',
				'field'    => 'slug',
				'terms'    => $tag_slug,
			);
		}

		$query = new WP_Query( $args );
		$data  = array();

		if ( $query->have_posts() ) {
			while ( $query->have_posts() ) {
				$query->the_post();
				$design_id = get_the_ID();

				$categories = get_the_terms( $design_id, 'pw_design_category' );
				$cat_names  = $categories && ! is_wp_error( $categories ) ? wp_list_pluck( $categories, 'name' ) : array();
				$cat_slugs  = $categories && ! is_wp_error( $categories ) ? wp_list_pluck( $categories, 'slug' ) : array();

				$tags      = get_the_terms( $design_id, 'pw_design_tag' );
				$tag_names = $tags && ! is_wp_error( $tags ) ? wp_list_pluck( $tags, 'name' ) : array();

				$data[] = array(
					'id'          => $design_id,
					'name'        => (string) get_the_title(),
					'thumbnail'   => (string) get_the_post_thumbnail_url( $design_id, 'medium' ),
					'delete_link' => (string) get_delete_post_link( $design_id ),
					'category'    => ! empty( $cat_slugs ) ? (string) $cat_slugs[0] : '',
					'categories'  => array_values( array_map( 'strval', $cat_names ) ),
					'tags'        => array_values( array_map( 'strval', $tag_names ) ),
					'price'       => (string) get_post_meta( $design_id, '_pw_design_price', true ),
					'date'        => (string) get_the_date( 'Y-m-d' ),
				);
			}
		}

		wp_reset_postdata();
		return $data;
	}

	private function map_tab_to_tag_slug( $selected_tab ) {
		if ( 'universal' === $selected_tab ) {
			return 'universal';
		}

		if ( 'universal-main-view' === $selected_tab ) {
			return 'universal-main-view';
		}

		if ( 'product-specific' === $selected_tab ) {
			return 'product-specific';
		}

		return '';
	}

	private function get_design_categories_terms() {
		$terms = get_terms(
			array(
				'taxonomy'   => 'pw_design_category',
				'hide_empty' => false,
			)
		);

		if ( is_wp_error( $terms ) ) {
			return array();
		}

		return (array) $terms;
	}

	private function format_categories_data( array $terms ) {
		$data = array();

		foreach ( $terms as $term ) {
			if ( ! $term instanceof WP_Term ) {
				continue;
			}

			$data[] = array(
				'slug' => (string) $term->slug,
				'name' => (string) $term->name,
			);
		}

		return $data;
	}

	private function get_design_edit_capability() {
		$post_type_object = get_post_type_object( 'pw_design' );
		if ( $post_type_object && isset( $post_type_object->cap, $post_type_object->cap->edit_posts ) ) {
			return $post_type_object->cap->edit_posts;
		}

		return 'edit_posts';
	}

	private function should_load_assets( $hook ) {
		if ( in_array( $hook, $this->page_hooks, true ) ) {
			return true;
		}

		$page = isset( $_GET['page'] ) ? sanitize_text_field( wp_unslash( $_GET['page'] ) ) : '';
		return 'pw-design-library' === $page;
	}

	private function render_view( $relative_path, array $data ) {
		$path = $this->module_path . 'views' . DIRECTORY_SEPARATOR . $relative_path;
		if ( ! file_exists( $path ) ) {
			return;
		}

		foreach ( $data as $key => $value ) {
			${$key} = $value;
		}

		require $path;
	}
}
