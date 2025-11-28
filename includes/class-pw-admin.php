<?php

/**
 * The file that defines the core plugin class
 *
 * A class definition that includes attributes and functions used across both the
 * public-facing side of the site and the admin area.
 *
 * @link       https://www.pw.com
 * @since      1.0.0
 *
 * @package    Pw_Admin
 * @subpackage Pw_Admin/includes
 */

/**
 * The core plugin class.
 *
 * This is used to define internationalization, admin-specific hooks, and
 * public-facing site hooks.
 *
 * Also maintains the unique identifier of this plugin as well as the current
 * version of the plugin.
 *
 * @since      1.0.0
 * @package    Pw_Admin
 * @subpackage Pw_Admin/includes
 * @author     PW <pw@pwcom>
 */
class Pw_Admin {

	/**
	 * The loader that's responsible for maintaining and registering all hooks that power
	 * the plugin.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      Pw_Admin_Loader    $loader    Maintains and registers all hooks for the plugin.
	 */
	protected $loader;

	/**
	 * The unique identifier of this plugin.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      string    $plugin_name    The string used to uniquely identify this plugin.
	 */
	protected $plugin_name;

	/**
	 * The current version of the plugin.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      string    $version    The current version of the plugin.
	 */
	protected $version;

	/**
	 * Define the core functionality of the plugin.
	 *
	 * Set the plugin name and the plugin version that can be used throughout the plugin.
	 * Load the dependencies, define the locale, and set the hooks for the admin area and
	 * the public-facing side of the site.
	 *
	 * @since    1.0.0
	 */
	public function __construct() {
		if ( defined( 'PW_ADMIN_VERSION' ) ) {
			$this->version = PW_ADMIN_VERSION;
		} else {
			$this->version = '1.0.0';
		}
		$this->plugin_name = 'pw-admin';

		$this->load_dependencies();
		$this->set_locale();
		$this->register_custom_post_types();
		$this->init_api_class();
		$this->define_admin_hooks();
		$this->define_public_hooks();

	}

	/**
	 * Load the required dependencies for this plugin.
	 *
	 * Include the following files that make up the plugin:
	 *
	 * - Pw_Admin_Loader. Orchestrates the hooks of the plugin.
	 * - Pw_Admin_i18n. Defines internationalization functionality.
	 * - Pw_Admin_Admin. Defines all hooks for the admin area.
	 * - Pw_Admin_Public. Defines all hooks for the public side of the site.
	 *
	 * Create an instance of the loader which will be used to register the hooks
	 * with WordPress.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function load_dependencies() {

		/**
		 * The class responsible for orchestrating the actions and filters of the
		 * core plugin.
		 */
		require_once plugin_dir_path( dirname( __FILE__ ) ) . 'includes/class-pw-admin-loader.php';

		/**
		 * The class responsible for defining internationalization functionality
		 * of the plugin.
		 */
		require_once plugin_dir_path( dirname( __FILE__ ) ) . 'includes/class-pw-admin-i18n.php';

		/**
		 * The class responsible for defining all actions that occur in the admin area.
		 */
		require_once plugin_dir_path( dirname( __FILE__ ) ) . 'admin/class-pw-admin-admin.php';

		/**
		 * The class responsible for defining all actions that occur in the public-facing
		 * side of the site.
		 */
		require_once plugin_dir_path( dirname( __FILE__ ) ) . 'public/class-pw-admin-public.php';

		/**
		 * The class responsible for Promowares API communication.
		 */
		require_once plugin_dir_path( dirname( __FILE__ ) ) . 'includes/class-pw-admin-promowares-api.php';

		$this->loader = new Pw_Admin_Loader();

	}

	/**
	 * Define the locale for this plugin for internationalization.
	 *
	 * Uses the Pw_Admin_i18n class in order to set the domain and to register the hook
	 * with WordPress.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function set_locale() {

		$plugin_i18n = new Pw_Admin_i18n();

		$this->loader->add_action( 'plugins_loaded', $plugin_i18n, 'load_plugin_textdomain' );

	}

	/**
	 * Register all of the hooks related to the admin area functionality
	 * of the plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function define_admin_hooks() {

		$plugin_admin = new Pw_Admin_Admin( $this->get_plugin_name(), $this->get_version() );

		$this->loader->add_action( 'admin_enqueue_scripts', $plugin_admin, 'enqueue_styles' );
		$this->loader->add_action( 'admin_enqueue_scripts', $plugin_admin, 'enqueue_scripts' );

		// Register AJAX handlers
		$this->loader->add_action( 'wp_ajax_pw_add_category', $plugin_admin, 'handle_add_category' );
		$this->loader->add_action( 'wp_ajax_nopriv_pw_add_category', $plugin_admin, 'handle_add_category' );
		$this->loader->add_action( 'wp_ajax_pw_get_category_settings', $plugin_admin, 'handle_get_category_settings' );
		$this->loader->add_action( 'wp_ajax_nopriv_pw_get_category_settings', $plugin_admin, 'handle_get_category_settings' );
		$this->loader->add_action( 'wp_ajax_pw_update_category_settings', $plugin_admin, 'handle_update_category_settings' );
		$this->loader->add_action( 'wp_ajax_nopriv_pw_update_category_settings', $plugin_admin, 'handle_update_category_settings' );
		$this->loader->add_action( 'wp_ajax_pw_delete_category', $plugin_admin, 'handle_delete_category' );
		$this->loader->add_action( 'wp_ajax_nopriv_pw_delete_category', $plugin_admin, 'handle_delete_category' );
		
		// Register design management AJAX handlers
		$this->loader->add_action( 'wp_ajax_pw_add_design', $plugin_admin, 'handle_add_design' );
		$this->loader->add_action( 'wp_ajax_nopriv_pw_add_design', $plugin_admin, 'handle_add_design' );
		$this->loader->add_action( 'wp_ajax_pw_get_design_tags', $plugin_admin, 'handle_get_design_tags' );
		$this->loader->add_action( 'wp_ajax_nopriv_pw_get_design_tags', $plugin_admin, 'handle_get_design_tags' );
		$this->loader->add_action( 'wp_ajax_pw_save_design_tags', $plugin_admin, 'handle_save_design_tags' );
		$this->loader->add_action( 'wp_ajax_nopriv_pw_save_design_tags', $plugin_admin, 'handle_save_design_tags' );
		
		// Register product request form handler
		$this->loader->add_action( 'wp_ajax_pw_submit_product_request', $plugin_admin, 'handle_product_request_submission' );
		
		// Register bulk delete designs handler
		$this->loader->add_action( 'wp_ajax_pw_bulk_delete_designs', $plugin_admin, 'handle_bulk_delete_designs' );
		
		// Register bulk update designs handler
		$this->loader->add_action( 'wp_ajax_pw_bulk_update_designs', $plugin_admin, 'handle_bulk_update_designs' );

		$this->loader->add_action( 'add_meta_boxes_pw_design', $plugin_admin, 'register_pw_design_price_metabox' );
		$this->loader->add_action( 'save_post_pw_design', $plugin_admin, 'save_pw_design_price_meta' );

	}

	/**
	 * Register all of the hooks related to the public-facing functionality
	 * of the plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function define_public_hooks() {

		$plugin_public = new Pw_Admin_Public( $this->get_plugin_name(), $this->get_version() );

		$this->loader->add_action( 'wp_enqueue_scripts', $plugin_public, 'enqueue_styles' );
		$this->loader->add_action( 'wp_enqueue_scripts', $plugin_public, 'enqueue_scripts' );
		
		// Register canvas template handler
		$this->loader->add_action( 'template_redirect', $plugin_public, 'pw_canvas_handle_request' );

	}

	/**
	 * Run the loader to execute all of the hooks with WordPress.
	 *
	 * @since    1.0.0
	 */
	public function run() {
		$this->loader->run();
	}

	/**
	 * The name of the plugin used to uniquely identify it within the context of
	 * WordPress and to define internationalization functionality.
	 *
	 * @since     1.0.0
	 * @return    string    The name of the plugin.
	 */
	public function get_plugin_name() {
		return $this->plugin_name;
	}

	/**
	 * The reference to the class that orchestrates the hooks with the plugin.
	 *
	 * @since     1.0.0
	 * @return    Pw_Admin_Loader    Orchestrates the hooks of the plugin.
	 */
	public function get_loader() {
		return $this->loader;
	}

	/**
	 * Retrieve the version number of the plugin.
	 *
	 * @since     1.0.0
	 * @return    string    The version number of the plugin.
	 */
	public function get_version() {
		return $this->version;
	}

	/**
	 * Register custom post types and taxonomies for the plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function register_custom_post_types() {
		$this->loader->add_action( 'init', $this, 'pw_design_post_type_and_taxonomies' );
	}

	/**
	 * Initialize the Promowares API class.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function init_api_class() {
		// Initialize Promowares API class early to ensure REST routes are registered
		$promowares_api = new Pw_Admin_Promowares_Api();
		$promowares_api->register_ajax_hooks();
	}

	/**
	 * Register custom post type 'pw_design' and its taxonomies.
	 *
	 * @since    1.0.0
	 */
	public function pw_design_post_type_and_taxonomies() {
		// 注册 pw_design 文章类型
		$post_type_labels = array(
			'name'                  => _x( 'PW Designs', 'Post type general name', 'pw-admin' ),
			'singular_name'         => _x( 'PW Design', 'Post type singular name', 'pw-admin' ),
			'menu_name'             => _x( 'PW Designs', 'Admin Menu text', 'pw-admin' ),
			'name_admin_bar'        => _x( 'PW Design', 'Add New on Toolbar', 'pw-admin' ),
            'add_new'               => __( 'Add New', 'pw-admin' ),
            'add_new_item'          => __( 'Add New PW Design', 'pw-admin' ),
            'new_item'              => __( 'New PW Design', 'pw-admin' ),
            'edit_item'             => __( 'Edit PW Design', 'pw-admin' ),
            'view_item'             => __( 'View PW Design', 'pw-admin' ),
            'all_items'             => __( 'All PW Designs', 'pw-admin' ),
            'search_items'          => __( 'Search PW Designs', 'pw-admin' ),
            'parent_item_colon'     => __( 'Parent PW Design:', 'pw-admin' ),
            'not_found'             => __( 'No PW Designs found.', 'pw-admin' ),
            'not_found_in_trash'    => __( 'No PW Designs found in Trash.', 'pw-admin' ),
            'featured_image'        => _x( 'PW Design Featured Image', 'Overrides the "Featured Image" phrase for this post type. Added in 4.3', 'pw-admin' ),
            'set_featured_image'    => _x( 'Set featured image', 'Overrides the "Set featured image" phrase for this post type. Added in 4.3', 'pw-admin' ),
            'remove_featured_image' => _x( 'Remove featured image', 'Overrides the "Remove featured image" phrase for this post type. Added in 4.3', 'pw-admin' ),
            'use_featured_image'    => _x( 'Use as featured image', 'Overrides the "Use as featured image" phrase for this post type. Added in 4.3', 'pw-admin' ),
            'archives'              => _x( 'PW Design Archives', 'The post type archive label used in nav menus. Default "Post Archives". Added in 4.4', 'pw-admin' ),
            'insert_into_item'      => _x( 'Insert into PW Design', 'Overrides the "Insert into post"/"Insert into page" phrase (used when inserting media into a post). Added in 4.4', 'pw-admin' ),
            'uploaded_to_this_item' => _x( 'Uploaded to this PW Design', 'Overrides the "Uploaded to this post"/"Uploaded to this page" phrase (used when viewing media attached to a post). Added in 4.4', 'pw-admin' ),
            'filter_items_list'     => _x( 'Filter PW Designs list', 'Screen reader text for the filter links heading on the post type listing screen. Default "Filter posts list"/"Filter pages list". Added in 4.4', 'pw-admin' ),
            'items_list_navigation' => _x( 'PW Designs list navigation', 'Screen reader text for the pagination heading on the post type listing screen. Default "Posts list navigation"/"Pages list navigation". Added in 4.4', 'pw-admin' ),
            'items_list'            => _x( 'PW Designs list', 'Screen reader text for the items list heading on the post type listing screen. Default "Posts list"/"Pages list". Added in 4.4', 'pw-admin' ),
		);

		$post_type_args = array(
			'labels'             => $post_type_labels,
			'public'             => true,
			'publicly_queryable' => true,
			'show_ui'            => true,
			'show_in_menu'       => false, // 不在主菜单中显示
			'query_var'          => true,
			'rewrite'            => array( 'slug' => 'pw-design' ),
			'capability_type'    => 'post',
			'has_archive'        => true,
			'hierarchical'       => false,
			'menu_position'      => null,
			'supports'           => array( 'title', 'editor', 'thumbnail', 'excerpt', 'comments', 'custom-fields', 'revisions' ),
			'show_in_rest'       => false,
		);

		register_post_type( 'pw_design', $post_type_args );

		// 注册 pw_design_category (类似文章分类)
        $category_labels = array(
            'name'              => _x( 'PW Design Categories', 'taxonomy general name', 'pw-admin' ),
            'singular_name'     => _x( 'PW Design Category', 'taxonomy singular name', 'pw-admin' ),
            'search_items'      => __( 'Search PW Design Categories', 'pw-admin' ),
            'all_items'         => __( 'All PW Design Categories', 'pw-admin' ),
            'parent_item'       => __( 'Parent PW Design Category', 'pw-admin' ),
            'parent_item_colon' => __( 'Parent PW Design Category:', 'pw-admin' ),
            'edit_item'         => __( 'Edit PW Design Category', 'pw-admin' ),
            'update_item'       => __( 'Update PW Design Category', 'pw-admin' ),
            'add_new_item'      => __( 'Add New PW Design Category', 'pw-admin' ),
            'new_item_name'     => __( 'New PW Design Category Name', 'pw-admin' ),
            'menu_name'         => __( 'Design Categories', 'pw-admin' ),
        );

		$category_args = array(
			'hierarchical'      => true,
			'labels'            => $category_labels,
			'show_ui'           => true,
			'show_admin_column' => true,
			'query_var'         => true,
			'rewrite'           => array( 'slug' => 'pw-design-category' ),
			'show_in_rest'      => true,
		);

		register_taxonomy( 'pw_design_category', array( 'pw_design' ), $category_args );

		// 注册 pw_design_tag (类似文章标签)
        $tag_labels = array(
            'name'                       => _x( 'PW Design Tags', 'taxonomy general name', 'pw-admin' ),
            'singular_name'              => _x( 'PW Design Tag', 'taxonomy singular name', 'pw-admin' ),
            'search_items'               => __( 'Search PW Design Tags', 'pw-admin' ),
            'popular_items'              => __( 'Popular PW Design Tags', 'pw-admin' ),
            'all_items'                  => __( 'All PW Design Tags', 'pw-admin' ),
            'parent_item'                => null,
            'parent_item_colon'          => null,
            'edit_item'                  => __( 'Edit PW Design Tag', 'pw-admin' ),
            'update_item'                => __( 'Update PW Design Tag', 'pw-admin' ),
            'add_new_item'               => __( 'Add New PW Design Tag', 'pw-admin' ),
            'new_item_name'              => __( 'New PW Design Tag Name', 'pw-admin' ),
            'separate_items_with_commas' => __( 'Separate PW Design tags with commas', 'pw-admin' ),
            'add_or_remove_items'        => __( 'Add or remove PW Design tags', 'pw-admin' ),
            'choose_from_most_used'      => __( 'Choose from the most used PW Design tags', 'pw-admin' ),
            'not_found'                  => __( 'No PW Design tags found.', 'pw-admin' ),
            'menu_name'                  => __( 'Design Tags', 'pw-admin' ),
        );

		$tag_args = array(
			'hierarchical'          => false,
			'labels'                => $tag_labels,
			'show_ui'               => true,
			'show_admin_column'     => true,
			'query_var'             => true,
			'rewrite'               => array( 'slug' => 'pw-design-tag' ),
			'show_in_rest'          => true,
		);

		register_taxonomy( 'pw_design_tag', array( 'pw_design' ), $tag_args );
	}

}
