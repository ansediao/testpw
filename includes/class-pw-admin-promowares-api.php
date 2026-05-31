<?php

/**
 * Promowares API Communication Handler 聚合api
 *
 * This file contains all code that communicates with the Promowares API
 * (https://dev.promowares.com/api/). It has been extracted from the main
 * plugin files to centralize API communication logic.
 *
 * @link       https://promowares.com
 * @since      1.0.0
 *
 * @package    Pw_Admin
 * @subpackage Pw_Admin/includes
 */

/**
 * Promowares API Communication Handler Class
 *
 * Handles all communications with the Promowares API including:
 * - Product synchronization
 * - Authentication
 * - User information retrieval
 * - API proxy requests
 *
 * @package    Pw_Admin
 * @subpackage Pw_Admin/includes
 * @author     Promoware Team
 */
class Pw_Admin_Promowares_Api
{

    /**
     * The Promowares API base URL.
     *
     * @since    1.0.0
     * @access   private
     * @var      string    $api_base_url    The base URL for Promowares API requests.
     */
    private $api_base_url;

    /**
     * The hardcoded JWT token for backward compatibility.
     *
     * @since    1.0.0
     * @access   private
     * @var      string    $hardcoded_token    The hardcoded JWT token.
     */
    private $hardcoded_token;

    /**
     * Initialize the class and set its properties.
     *
     * @since    1.0.0
     */
    public function __construct()
    {
        $this->api_base_url = 'https://dev.promowares.com/api/v1/';
        $this->hardcoded_token = get_option('pw_api_token', '');

        // Register REST API routes
        $this->register_rest_routes();
    }

    /**
     * Encode cache payload as JSON while preserving readable Unicode text.
     *
     * @since    1.0.0
     * @param    mixed    $data    Data to encode.
     * @return   string|false      JSON string on success, false on failure.
     */
    private function encode_cache_json($data)
    {
        $options = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;
        $encoded = wp_json_encode($data, $options);

        if (false !== $encoded) {
            return $encoded;
        }

        return wp_json_encode($data);
    }

    /**
     * Get products from Promowares API.
     * 
     * This method fetches product data from the Promowares API using
     * the hardcoded authentication token.
     *
     * @since    1.0.0
     * @return   array|false    The products data or false on error.
     */
    public function get_products_from_api()
    {
        $response = wp_remote_get($this->api_base_url . 'products', array(
            'headers' => array(
                'accept' => 'application/json',
                'Authorization' => $this->hardcoded_token,
            ),
            'timeout' => 30
        ));

        if (is_wp_error($response)) {
            error_log('Promowares API Error: ' . $response->get_error_message());
            return false;
        }

        $response_code = wp_remote_retrieve_response_code($response);
        if ($response_code !== 200) {
            error_log('Promowares API HTTP Error: ' . $response_code);
            return false;
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log('Promowares API JSON Error: ' . json_last_error_msg());
            return false;
        }

        return isset($data['data']['list']['single_products']) ? $data['data']['list']['single_products'] : false;
    }

    /**
     * Get composite products from Promowares API.
     * 
     * This method fetches composite product data from the Promowares API using
     * the hardcoded authentication token.
     *
     * @since    1.0.0
     * @return   array|false    The composite products data or false on error.
     */
    public function get_composite_products_from_api()
    {
        $response = wp_remote_get($this->api_base_url . 'products', array(
            'headers' => array(
                'accept' => 'application/json',
                'Authorization' => $this->hardcoded_token,
            ),
            'timeout' => 30
        ));

        if (is_wp_error($response)) {
            error_log('Promowares API Error: ' . $response->get_error_message());
            return false;
        }

        $response_code = wp_remote_retrieve_response_code($response);
        if ($response_code !== 200) {
            error_log('Promowares API HTTP Error: ' . $response_code);
            return false;
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log('Promowares API JSON Error: ' . json_last_error_msg());
            return false;
        }

        return isset($data['data']['list']['composite_products']) ? $data['data']['list']['composite_products'] : false;
    }

    /**
     * Get container information from Promowares API.
     * 
     * This method fetches container data from the Promowares API using
     * the hardcoded authentication token.
     *
     * @since    1.0.0
     * @param    int    $container_id    The container ID to fetch.
     * @return   array|false    The container data or false on error.
     */
    public function get_container_info($container_id)
    {
        if (empty($container_id)) {
            return false;
        }

        $response = wp_remote_get($this->api_base_url . 'containers/' . $container_id, array(
            'headers' => array(
                'accept' => 'application/json',
                'Authorization' => $this->hardcoded_token,
            ),
            'timeout' => 30
        ));

        if (is_wp_error($response)) {
            error_log('Promowares API Error: ' . $response->get_error_message());
            return false;
        }

        $response_code = wp_remote_retrieve_response_code($response);
        if ($response_code !== 200) {
            error_log('Promowares API HTTP Error: ' . $response_code);
            return false;
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log('Promowares API JSON Error: ' . json_last_error_msg());
            return false;
        }

        return isset($data['data']) ? $data['data'] : false;
    }

    public function send_product_inquiry($product_id, $first_name, $last_name, $email, $phone, $message, $token = null)
    {
        $auth_token = $token ?: $this->hardcoded_token;
        if (empty($auth_token)) {
            return new WP_Error('missing_token', 'API token is required');
        }
        
        $payload = array(
            'email' => (string)$email,
            'first_name' => (string)$first_name,
            'last_name' => (string)$last_name,
            'message' => (string)$message,
            'product_id' => (int)$product_id,
            'tel' => (string)$phone,
        );
        
        $response = wp_remote_post($this->api_base_url . 'plugin/inquiry', array(
            'headers' => array(
                'Authorization' => $auth_token,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ),
            'body' => wp_json_encode($payload),
            'timeout' => 10,
        ));
        
        if (is_wp_error($response)) {
            return $response;
        }
        
        $response_code = wp_remote_retrieve_response_code($response);
        if ($response_code !== 200) {
            return new WP_Error('http_error', 'Promowares API HTTP Error: ' . $response_code);
        }
        
        $body = wp_remote_retrieve_body($response);
        $decoded = json_decode($body, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return array();
        }
        
        return $decoded;
    }

    /**
     * Handle AJAX proxy API requests to Promowares API.
     * 
     * This method acts as a proxy for frontend AJAX requests to the
     * Promowares API, handling authentication and security checks.
     *
     * @since    1.0.0
     */
    public function handle_proxy_api_request()
    {
        // Check user permissions
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
            return;
        }

        $endpoint = sanitize_text_field($_POST['endpoint'] ?? '');
        $token = sanitize_text_field($_POST['token'] ?? '');

        if (empty($endpoint) || empty($token)) {
            wp_send_json_error('Missing required parameters');
            return;
        }

        $response = wp_remote_get($this->api_base_url . $endpoint, [
            'headers' => [
                'Accept' => 'application/json',
                'Authorization' => $token
            ],
            'timeout' => 30
        ]);

        if (is_wp_error($response)) {
            wp_send_json_error($response->get_error_message());
        } else {
            $body = wp_remote_retrieve_body($response);
            $decoded_response = json_decode($body, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                wp_send_json_error('Invalid JSON response from API');
            } else {
                wp_send_json($decoded_response);
            }
        }
    }

    /**
     * Verify user authentication with Promowares API.
     * 
     * This method checks if a given token is valid by making a request
     * to the user-info endpoint.
     *
     * @since    1.0.0
     * @param    string    $token    The JWT token to verify.
     * @return   array|WP_Error     The user info or error.
     */
    public function verify_user_token($token)
    {
        $response = wp_remote_get($this->api_base_url . 'auth/user-info', [
            'headers' => [
                'Accept' => 'application/json',
                'Authorization' => $token
            ],
            'timeout' => 30
        ]);

        if (is_wp_error($response)) {
            return $response;
        }

        $response_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if ($response_code === 200 && isset($data['data'])) {
            return $data;
        }

        return new WP_Error('auth_failed', 'Token verification failed', $data);
    }

    /**
     * Get specific product data from Promowares API.
     *
     * @since    1.0.0
     * @param    int       $product_id    The product ID to fetch.
     * @param    string    $token         Optional. Custom token to use.
     * @return   array|WP_Error          The product data or error.
     */
    public function get_product($product_id, $token = null)
    {
        $auth_token = $token ?: $this->hardcoded_token;

        $response = wp_remote_get($this->api_base_url . 'products/' . intval($product_id), [
            'headers' => [
                'Accept' => 'application/json',
                'Authorization' => $auth_token
            ],
            'timeout' => 30
        ]);

        if (is_wp_error($response)) {
            return $response;
        }

        $response_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if ($response_code === 200) {
            return $data;
        }

        return new WP_Error('api_error', 'Failed to fetch product', $data);
    }

    /**
     * Sync product data to Promowares API.
     *
     * @since    1.0.0
     * @param    array     $product_data    The product data to sync.
     * @param    string    $token           Optional. Custom token to use.
     * @return   array|WP_Error            The sync response or error.
     */
    public function sync_product($product_data, $token = null)
    {
        $auth_token = $token ?: $this->hardcoded_token;

        $response = wp_remote_post($this->api_base_url . 'products/sync', [
            'headers' => [
                'Content-Type' => 'application/json',
                'Authorization' => $auth_token
            ],
            'body' => wp_json_encode($product_data),
            'timeout' => 30
        ]);

        if (is_wp_error($response)) {
            return $response;
        }

        $response_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if ($response_code >= 200 && $response_code < 300) {
            return $data;
        }

        return new WP_Error('sync_error', 'Failed to sync product', $data);
    }

    /**
     * Get product data from Promowares API using WooCommerce product's pw_id meta.
     *
     * @since    1.0.0
     * @param    int       $woo_product_id    The WooCommerce product ID.
     * @param    string    $token             Optional. Custom token to use.
     * @return   array|WP_Error              The product data or error.
     */
    public function get_product_by_woo_id($woo_product_id, $token = null)
    {
        // Get the pw_id from WooCommerce product meta
        $pw_id = get_post_meta($woo_product_id, 'pw_id', true);

        if (empty($pw_id)) {
            return new WP_Error('missing_pw_id', 'Product does not have a pw_id meta field');
        }

        // Use the existing get_product method
        return $this->get_product($pw_id, $token);
    }

    /**
     * Check API connection status.
     *
     * @since    1.0.0
     * @param    string    $token    Optional. Custom token to use.
     * @return   bool               True if connected, false otherwise.
     */
    public function check_connection($token = null)
    {
        $auth_token = $token ?: $this->hardcoded_token;

        $response = wp_remote_get($this->api_base_url . 'status', [
            'headers' => [
                'Accept' => 'application/json',
                'Authorization' => $auth_token
            ],
            'timeout' => 15
        ]);

        return !is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200;
    }

    /**
     * Get the API base URL.
     *
     * @since    1.0.0
     * @return   string    The API base URL.
     */
    public function get_api_base_url()
    {
        return $this->api_base_url;
    }

    /**
     * Get the hardcoded token.
     *
     * @since    1.0.0
     * @return   string    The hardcoded token.
     */
    public function get_hardcoded_token()
    {
        return $this->hardcoded_token;
    }

    public static function calculate_shipping_options($country_code, $weight, $shipping_method = 'PK1792')
    {
        $token = get_option('pw_api_token', '');
        if (empty($token)) {
            return new WP_Error('missing_token', 'API token is required');
        }

        $api_url = 'https://dev.promowares.com/api/v1/shipping/calculate';

        $request_data = array(
            'country_code' => (string) $country_code,
            'weight' => (string) $weight,
            'shipping_method' => (string) $shipping_method,
        );

        $response = wp_remote_post($api_url, array(
            'headers' => array(
                'Authorization' => $token,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ),
            'body' => wp_json_encode($request_data),
            'timeout' => 15,
        ));

        if (is_wp_error($response)) {
            return $response;
        }

        $body = wp_remote_retrieve_body($response);
        $decoded = json_decode($body, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return new WP_Error('json_error', 'Invalid JSON response: ' . json_last_error_msg());
        }

        return $decoded;
    }

    /**
     * Get custom templates data for a specific product.
     *
     * @since    1.0.0
     * @param    int       $product_id    The product ID to fetch templates for.
     * @param    string    $token         Optional. Custom token to use.
     * @return   array|WP_Error          The templates data or error.
     */
    public function get_product_templates($product_id, $token = null)
    {
        $auth_token = $token ?: $this->hardcoded_token;
        
        if (empty($auth_token)) {
            return new WP_Error('missing_token', 'API token is required');
        }
        
        return $this->call_promowares_api("custom-templates/product/{$product_id}", $auth_token);
    }

    /**
     * Register AJAX hooks for API proxy functionality.
     *
     * @since    1.0.0
     */
    public function register_ajax_hooks()
    {
        add_action('wp_ajax_pw_proxy_api_request', array($this, 'handle_proxy_api_request'));
        add_action('wp_ajax_pw_toggle_cache', array($this, 'handle_toggle_cache'));
        // Note: Removed nopriv hook for security - only logged-in users should access API
    }

    /**
     * Handle toggle cache AJAX request.
     *
     * @since    1.0.0
     */
    public function handle_toggle_cache()
    {
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'pw_toggle_cache_nonce')) {
            wp_send_json_error(array('message' => 'Security verification failed'));
            return;
        }

        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Insufficient permissions'));
            return;
        }

        $enabled = isset($_POST['enabled']) ? 1 : 0;
        update_option('pw_cache_enabled', $enabled);

        wp_send_json_success(array('cache_enabled' => $enabled));
    }

    /**
     * Register REST API routes for data aggregation.
     *
     * @since    1.0.0
     */
    public function register_rest_routes()
    {
        add_action('rest_api_init', array($this, 'register_aggregation_endpoints'), 10);
    }

    /**
     * Register aggregation REST API endpoints.
     *
     * @since    1.0.0
     */
    public function register_aggregation_endpoints()
    {
        register_rest_route('pw/v1', '/product-data/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_aggregated_product_data'),
            'permission_callback' => '__return_true', // Consider stricter permissions for production
            'args' => array(
                'id' => array(
                    'validate_callback' => function ($param, $request, $key) {
                        return is_numeric($param);
                    }
                ),
            ),
        ));

        register_rest_route('pw-canvas/v1', '/store-customization-settings', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_store_customization_settings_data'),
            'permission_callback' => '__return_true',
        ));

        // Register print methods endpoint
        register_rest_route('pw-canvas/v1', '/print-methods', array(
            'methods' => 'POST',
            'callback' => array($this, 'get_print_methods_data'),
            'permission_callback' => '__return_true',
            'args' => array(
                'printing_method_ids' => array(
                    'required' => true,
                    'validate_callback' => function ($param, $request, $key) {
                        return is_array($param) && !empty($param);
                    },
                    'sanitize_callback' => function ($param, $request, $key) {
                        return array_map('intval', $param);
                    }
                ),
            ),
        ));

        // Register custom colors endpoint
        register_rest_route('pw-canvas/v1', '/custom-colors', array(
            'methods' => 'POST',
            'callback' => array($this, 'get_custom_colors_data'),
            'permission_callback' => '__return_true',
            'args' => array(
                'color_list_id' => array(
                    'required' => true,
                    'validate_callback' => function ($param, $request, $key) {
                        return is_numeric($param) && $param > 0;
                    },
                    'sanitize_callback' => function ($param, $request, $key) {
                        return intval($param);
                    }
                ),
            ),
        ));

        // Register image upload endpoint
        register_rest_route('pw-canvas/v1', '/upload-image', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_image_upload'),
            'permission_callback' => '__return_true',
        ));
    }

    /**
     * Get store-level customization settings.
     *
     * This endpoint proxies Promowares `/store/customization-settings`.
     * It is different from the legacy `/customization-settings` endpoint and
     * must remain an independent payload for downstream callers.
     *
     * @since    1.0.0
     * @param    WP_REST_Request    $request    The REST request object.
     * @return   WP_REST_Response              The REST response with settings data.
     */
    public function get_store_customization_settings_data($request)
    {
        $token = get_option('pw_api_token', '');
        if (empty($token)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Store token is not configured yet. Please connect the store first.',
            ), 401);
        }

        $settings = $this->call_promowares_api('store/customization-settings', $token);
        if (is_wp_error($settings)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Failed to load store customization settings.',
                'error' => $settings->get_error_message(),
                'details' => $settings->get_error_data(),
            ), 502);
        }

        return new WP_REST_Response($settings, 200);
    }

    /**
     * Handle image upload for canvas.
     *
     * @since    1.0.0
     * @param    WP_REST_Request    $request    The REST request object.
     * @return   WP_REST_Response   The REST response with uploaded image URL.
     */
    public function handle_image_upload($request)
    {
        // Check if WordPress upload functions are available
        if (!function_exists('wp_handle_upload')) {
            require_once(ABSPATH . 'wp-admin/includes/file.php');
        }

        // Check if file was uploaded
        if (empty($_FILES['file'])) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'No file uploaded',
            ), 400);
        }

        $uploaded_file = $_FILES['file'];
        $file_extension = pathinfo($uploaded_file['name'], PATHINFO_EXTENSION);
        
        // Generate new filename with format: canvas_时间戳.后缀
        $new_filename = 'canvas_' . time() . '.' . $file_extension;
        
        // Override the filename
        $uploaded_file['name'] = $new_filename;
        
        // Set upload overrides
        $upload_overrides = array(
            'test_form' => false,
            'unique_filename_callback' => function($dir, $name, $ext) use ($new_filename) {
                return $new_filename;
            }
        );
        
        // Handle the upload
        $movefile = wp_handle_upload($uploaded_file, $upload_overrides);
        
        if ($movefile && !isset($movefile['error'])) {
            // Create attachment
            $attachment = array(
                'post_mime_type' => $movefile['type'],
                'post_title'     => sanitize_file_name($new_filename),
                'post_content'   => '',
                'post_status'    => 'inherit'
            );
            
            // Insert attachment into database
            $attach_id = wp_insert_attachment($attachment, $movefile['file']);
            
            // Generate attachment metadata
            if (function_exists('wp_generate_attachment_metadata')) {
                require_once(ABSPATH . 'wp-admin/includes/image.php');
                $attach_data = wp_generate_attachment_metadata($attach_id, $movefile['file']);
                wp_update_attachment_metadata($attach_id, $attach_data);
            }
            
            return new WP_REST_Response(array(
                'success' => true,
                'url' => $movefile['url'],
                'filename' => $new_filename,
                'attachment_id' => $attach_id
            ), 200);
        } else {
            // Return error response
            return new WP_REST_Response(array(
                'success' => false,
                'message' => $movefile['error'],
            ), 400);
        }
    }

    /**
     * Get aggregated product data from multiple Promowares API endpoints.
     *
     * @since    1.0.0
     * @param    WP_REST_Request    $request    The REST request object.
     * @return   WP_REST_Response              The aggregated response.
     */
    public function get_aggregated_product_data($request)
    {
        $product_id = $request['id'];
        $token = $this->hardcoded_token;
        $mock_mode = (int) get_option('pw_api_mock_mode', 0);
        $cache_enabled = (int) get_option('pw_cache_enabled', 1);
        error_log("[PW Mock] get_aggregated_product_data called for product_id: {$product_id}, mock_mode: {$mock_mode}, cache_enabled: {$cache_enabled}");

        if (empty($token)) {
            return new WP_REST_Response(array(
                'error' => 'API token not configured'
            ), 401);
        }

        // 检查缓存数据（启用缓存检查，通过 updated_at 判断）
        // 只有在缓存启用时才尝试读取缓存
        $cached_data = false;
        if ($cache_enabled) {
            $cached_data = $this->get_cached_product_data($product_id);

            // 如果缓存检查返回 WP_Error，表示远程检查失败
            if (is_wp_error($cached_data)) {
                error_log("[PW Cache] Cache freshness check failed: " . $cached_data->get_error_message());
                return new WP_REST_Response(array(
                    'success' => false,
                    'error' => 'Failed to verify cache freshness: ' . $cached_data->get_error_message(),
                    'details' => $cached_data->get_error_data()
                ), 503);
            }

            if ($cached_data !== false) {
                $response = new WP_REST_Response($cached_data, 200);
                $response->header('X-PW-Cache', 'HIT');
                error_log("[PW Mock] Returning cached data");
                return $response;
            }
        } else {
            error_log("[PW Cache] Debug mode - cache disabled, skipping cache read");
        }

        $aggregated_data = array();

        // 1. Get basic product data
        $product_data = $this->call_promowares_api("products/{$product_id}", $token);
        if (!is_wp_error($product_data)) {
            $aggregated_data['product'] = $product_data;
            $aggregated_data['has_product_data'] = true;
        } else {
            $aggregated_data['has_product_data'] = false;
            $aggregated_data['product_error'] = $product_data->get_error_message();
        }

        // 2. Get custom templates with enhanced view and layer data
        $templates_data = $this->get_enhanced_template_data($product_id, $token);
        if (!is_wp_error($templates_data)) {
            $aggregated_data['templates'] = $templates_data;
            $aggregated_data['has_templates'] = true;
        } else {
            $aggregated_data['has_templates'] = false;
            $aggregated_data['templates_error'] = $templates_data->get_error_message();
        }

        // 3. Get variant product data
        $variant_data = $this->call_promowares_api("plugin/variant_product/{$product_id}", $token);
        if (!is_wp_error($variant_data)) {
            $aggregated_data['variants'] = $variant_data;
            $aggregated_data['has_variants'] = true;
        } else {
            $aggregated_data['has_variants'] = false;
            $aggregated_data['variants_error'] = $variant_data->get_error_message();
        }

        // 4. Get user customization settings (global)
        $customization_settings = $this->call_promowares_api("customization-settings", $token);
        if (!is_wp_error($customization_settings)) {
            $aggregated_data['customization_settings'] = $customization_settings;
            $aggregated_data['has_customization_settings'] = true;
        } else {
            $aggregated_data['has_customization_settings'] = false;
            $aggregated_data['customization_settings_error'] = $customization_settings->get_error_message();
        }

        // 4.1 Get store-level customization settings (separate from legacy customization settings)
        $store_customization_settings = $this->call_promowares_api("store/customization-settings", $token);
        if (!is_wp_error($store_customization_settings)) {
            $aggregated_data['store_customization_settings'] = $store_customization_settings;
            $aggregated_data['has_store_customization_settings'] = true;
        } else {
            $aggregated_data['has_store_customization_settings'] = false;
            $aggregated_data['store_customization_settings_error'] = $store_customization_settings->get_error_message();
        }

        // 5. Get user points info
        $points_info = $this->call_promowares_api("points/info", $token);
        if (!is_wp_error($points_info)) {
            $aggregated_data['points'] = $points_info;
            $aggregated_data['has_points'] = true;
        } else {
            $aggregated_data['has_points'] = false;
            $aggregated_data['points_error'] = $points_info->get_error_message();
        }

        // 6. Get mock data from external API
        $mock_data = $this->call_mock_api($product_id);
        if (!is_wp_error($mock_data)) {
            $aggregated_data['mock_data'] = $mock_data;
            $aggregated_data['has_mock_data'] = true;
        } else {
            $aggregated_data['has_mock_data'] = false;
            $aggregated_data['mock_data_error'] = $mock_data->get_error_message();
        }

        // 7. Get WooCommerce product data if exists
        $woo_products = get_posts(array(
            'post_type' => 'product',
            'meta_query' => array(
                array(
                    'key' => 'pw_id',
                    'value' => $product_id,
                    'compare' => '='
                )
            ),
            'posts_per_page' => 1
        ));

        if (!empty($woo_products)) {
            $woo_product = wc_get_product($woo_products[0]->ID);
            if ($woo_product) {
                $aggregated_data['woocommerce'] = array(
                    'id' => $woo_product->get_id(),
                    'name' => $woo_product->get_name(),
                    'price' => $woo_product->get_price(),
                    'price_html' => $woo_product->get_price_html(),
                    'stock_status' => $woo_product->get_stock_status(),
                    'in_stock' => $woo_product->is_in_stock(),
                    'permalink' => get_permalink($woo_product->get_id())
                );
                $aggregated_data['has_woocommerce_product'] = true;
            }
        } else {
            $aggregated_data['has_woocommerce_product'] = false;
        }

        // 6. Generate business logic fields
        $aggregated_data['computed'] = $this->compute_business_logic($aggregated_data);

        // 保存缓存数据（排除模拟数据，模拟数据不缓存）
        // 只有在缓存启用且非 Mock Error 模式下才保存缓存
        $cache_enabled = (int) get_option('pw_cache_enabled', 1);
        $mock_mode = (int) get_option('pw_api_mock_mode', 0);
        if ($cache_enabled && $mock_mode !== 1) {
            $cache_data = $aggregated_data;
            if (isset($cache_data['mock_data'])) {
                unset($cache_data['mock_data']);
            }
            if (isset($cache_data['has_mock_data'])) {
                $cache_data['has_mock_data'] = false; // 缓存中标记为无模拟数据
            }
            if (isset($cache_data['mock_data_error'])) {
                unset($cache_data['mock_data_error']);
            }
            // 重新计算业务逻辑字段（排除模拟数据）
            $cache_data['computed'] = $this->compute_business_logic($cache_data);

            $this->save_cached_product_data($product_id, $cache_data);
        }

        // 如果关键 API 都失败了，返回 503 错误
        $critical_failures = 0;
        if (empty($aggregated_data['product']) && !empty($aggregated_data['product_error'])) {
            $critical_failures++;
        }
        if (empty($aggregated_data['templates']) && !empty($aggregated_data['templates_error'])) {
            $critical_failures++;
        }
        if (empty($aggregated_data['variants']) && !empty($aggregated_data['variants_error'])) {
            $critical_failures++;
        }

        // 如果关键 API 都失败了，返回 503 错误
        if ($critical_failures >= 3) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => 'Promowares API Error: All critical API calls failed.',
                'details' => array(
                    'product_error' => $aggregated_data['product_error'] ?? null,
                    'templates_error' => $aggregated_data['templates_error'] ?? null,
                    'variants_error' => $aggregated_data['variants_error'] ?? null,
                )
            ), 503);
        }

        $response = new WP_REST_Response($aggregated_data, 200);
        $response->header('X-PW-Cache', 'MISS');
        if (!$cache_enabled) {
            $response->header('X-PW-Debug-Mode', 'true');
        }

        // 检查产品是否有更新标记，如果有则通知前台刷新
        if ($this->check_product_update_flag($product_id)) {
            $response->header('X-PW-Product-Updated', 'true');
            error_log("[PW Cache] Product {$product_id} updated flag sent to frontend");
        }

        return $response;
    }

    /**
     * Make a call to Promowares API endpoint.
     *
     * @since    1.0.0
     * @param    string    $endpoint    The API endpoint (without base URL).
     * @param    string    $token       The authentication token.
     * @return   array|WP_Error        The API response or error.
     */
    private function call_promowares_api($endpoint, $token)
    {
        $mock_mode = (int) get_option('pw_api_mock_mode', 0);
        error_log("[PW Mock] call_promowares_api called for endpoint: {$endpoint}, mock_mode: {$mock_mode}");
        if ($mock_mode === 1) {
            error_log("[PW Mock] Mock Error enabled, returning error for endpoint: {$endpoint}");
            return new WP_Error(
                'pw_mock_api_error',
                'Mocked Promowares API error (pw_api_mock_mode is enabled).',
                array(
                    'endpoint' => $endpoint,
                )
            );
        }

        $response = wp_remote_get($this->api_base_url . $endpoint, array(
            'headers' => array(
                'Accept' => 'application/json',
                'Accept-Encoding' => 'gzip, deflate, br',
                'Authorization' => $token,
                'Connection' => 'keep-alive',
                'User-Agent' => 'PW-Canvas-Plugin/1.0.0'
            ),
            'timeout' => 30
        ));

        if (is_wp_error($response)) {
            return $response;
        }

        $response_code = wp_remote_retrieve_response_code($response);
        if ($response_code !== 200) {
            return new WP_Error('api_error', "API returned status code: {$response_code}", array(
                'status' => $response_code,
                'endpoint' => $endpoint
            ));
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return new WP_Error('json_error', 'Invalid JSON response: ' . json_last_error_msg());
        }

        return $data;
    }

    /**
     * Make a call to external mock API.
     *
     * @since    1.0.0
     * @param    int    $product_id    The product ID (can be used for dynamic mock data).
     * @return   array|WP_Error       The API response or error.
     */
    private function call_mock_api($product_id)
    {
        // Mock API URL with product_id parameter for potential dynamic responses
        $mock_url = 'https://mock.apipost.net/mock/2adf9164a465000/mock/2adf9164a465000/?apipost_id=432a4307f209d';



        $response = wp_remote_get($mock_url, array(
            'headers' => array(
                'Accept' => '*/*',
                'Accept-Encoding' => 'gzip, deflate, br',
                'Connection' => 'keep-alive',
                'User-Agent' => 'PW-Canvas-Plugin/1.0.0'
            ),
            'timeout' => 15 // Shorter timeout for mock API
        ));

        if (is_wp_error($response)) {
            return $response;
        }

        $response_code = wp_remote_retrieve_response_code($response);
        if ($response_code !== 200) {
            return new WP_Error('mock_api_error', "Mock API returned status code: {$response_code}", array(
                'status' => $response_code,
                'url' => $mock_url
            ));
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return new WP_Error('mock_json_error', 'Invalid JSON response from mock API: ' . json_last_error_msg());
        }

        return $data;
    }

    /**
     * Compute business logic fields based on aggregated data.
     *
     * @since    1.0.0
     * @param    array    $data    The aggregated data.
     * @return   array             The computed business logic fields.
     */
    private function compute_business_logic($data)
    {
        $computed = array();

        // Check if product is customizable
        $computed['is_customizable'] = $data['has_templates'] &&
            isset($data['templates']['data']) &&
            !empty($data['templates']['data']);

        // Check if product has variants
        $computed['has_color_variants'] = $data['has_variants'] &&
            isset($data['variants']['data']) &&
            !empty($data['variants']['data']);

        // Extract available colors from variants
        $computed['available_colors'] = array();
        if ($computed['has_color_variants'] && isset($data['variants']['data'])) {
            foreach ($data['variants']['data'] as $variant) {
                if (isset($variant['color'])) {
                    $computed['available_colors'][] = $variant['color'];
                }
            }
        }

        // Check if product is purchasable
        $computed['is_purchasable'] = $data['has_woocommerce_product'] &&
            isset($data['woocommerce']['in_stock']) &&
            $data['woocommerce']['in_stock'] &&
            !empty($data['woocommerce']['price']);

        // Show price information
        $computed['show_price'] = $data['has_woocommerce_product'] &&
            !empty($data['woocommerce']['price']);

        // Process mock data if available
        $computed['mock_features'] = array();
        if ($data['has_mock_data'] && isset($data['mock_data'])) {
            $computed['mock_features'] = $this->process_mock_data($data['mock_data']);
        }

        // Enhanced product status summary including mock data
        $computed['status'] = array(
            'api_connected' => $data['has_product_data'],
            'has_templates' => $data['has_templates'],
            'has_variants' => $data['has_variants'],
            'has_mock_data' => $data['has_mock_data'],
            'woo_synced' => $data['has_woocommerce_product'],
            'ready_for_customization' => $computed['is_customizable'] && $data['has_woocommerce_product'],
            'mock_enhanced' => $data['has_mock_data'] && !empty($computed['mock_features'])
        );

        return $computed;
    }

    /**
     * Process mock data and extract useful features.
     *
     * @since    1.0.0
     * @param    array    $mock_data    The mock data from external API.
     * @return   array                  Processed mock features.
     */
    private function process_mock_data($mock_data)
    {
        $features = array();

        // Extract common mock data patterns
        if (is_array($mock_data)) {
            // Check for common mock data structures
            if (isset($mock_data['features'])) {
                $features['available_features'] = $mock_data['features'];
            }

            if (isset($mock_data['recommendations'])) {
                $features['recommendations'] = $mock_data['recommendations'];
            }

            if (isset($mock_data['settings'])) {
                $features['settings'] = $mock_data['settings'];
            }

            if (isset($mock_data['metadata'])) {
                $features['metadata'] = $mock_data['metadata'];
            }

            // Extract any boolean flags
            foreach ($mock_data as $key => $value) {
                if (is_bool($value)) {
                    $features['flags'][$key] = $value;
                }
            }

            // Extract any numeric values that might be useful
            foreach ($mock_data as $key => $value) {
                if (is_numeric($value)) {
                    $features['metrics'][$key] = $value;
                }
            }

            // Store raw data for custom processing
            $features['raw_data'] = $mock_data;
        }

        return $features;
    }

    /**
     * Get cached product data from product meta.
     *
     * @since    1.0.0
     * @param    int             $product_id    The Promowares product ID.
     * @return   array|false|WP_Error           The cached data, false if not found/invalid, or WP_Error on remote check failure.
     */
    private function get_cached_product_data($product_id)
    {
        // 查找对应的 WooCommerce 产品
        $woo_products = get_posts(array(
            'post_type' => 'product',
            'meta_query' => array(
                array(
                    'key' => 'pw_id',
                    'value' => $product_id,
                    'compare' => '='
                )
            ),
            'posts_per_page' => 1
        ));

        if (empty($woo_products)) {
            return false;
        }

        $woo_product_id = $woo_products[0]->ID;
        
        // 获取缓存数据和时间戳
        $cached_data = get_post_meta($woo_product_id, '_pw_aggregated_data_cache', true);
        $cache_timestamp = get_post_meta($woo_product_id, '_pw_aggregated_data_cache_time', true);

        // 检查缓存是否存在
        if (empty($cached_data) || empty($cache_timestamp)) {
            return false;
        }

        // 检查远程数据是否有更新（移除本地过期时间逻辑）
        $freshness_result = $this->check_remote_data_freshness($product_id, intval($cache_timestamp));

        // 如果返回 WP_Error，表示检查失败，返回错误信息
        if (is_wp_error($freshness_result)) {
            return $freshness_result;
        }

        // 如果返回 false，表示远程数据已更新，缓存失效
        if (!$freshness_result) {
            // 远程数据已更新，删除旧缓存
            // delete_post_meta($woo_product_id, '_pw_aggregated_data_cache');
            // delete_post_meta($woo_product_id, '_pw_aggregated_data_cache_time');
            return false;
        }

        // 返回缓存的数据
        $decoded_data = json_decode($cached_data, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            return $decoded_data;
        }

        return false;
    }

    /**
     * Save product data to cache using product meta.
     *
     * @since    1.0.0
     * @param    int      $product_id        The Promowares product ID.
     * @param    array    $aggregated_data   The data to cache.
     * @return   bool                        True on success, false on failure.
     */
    private function save_cached_product_data($product_id, $aggregated_data)
    {
        // 查找对应的 WooCommerce 产品
        $woo_products = get_posts(array(
            'post_type' => 'product',
            'meta_query' => array(
                array(
                    'key' => 'pw_id',
                    'value' => $product_id,
                    'compare' => '='
                )
            ),
            'posts_per_page' => 1
        ));

        if (empty($woo_products)) {
            return false;
        }

        $woo_product_id = $woo_products[0]->ID;
        
        // 将数据编码为 JSON 并保存
        $encoded_data = $this->encode_cache_json($aggregated_data);
        if (false === $encoded_data) {
            return false;
        }
        $current_time = time();

        // 保存缓存数据和时间戳（用于与远程 updated_at 比较）
        $data_saved = update_post_meta($woo_product_id, '_pw_aggregated_data_cache', $encoded_data);
        $time_saved = update_post_meta($woo_product_id, '_pw_aggregated_data_cache_time', $current_time);

        return $data_saved && $time_saved;
    }

    /**
     * Clear cached product data for a specific product.
     *
     * @since    1.0.0
     * @param    int    $product_id    The Promowares product ID.
     * @return   bool                  True on success, false on failure.
     */
    public function clear_cached_product_data($product_id)
    {
        // 查找对应的 WooCommerce 产品
        $woo_products = get_posts(array(
            'post_type' => 'product',
            'meta_query' => array(
                array(
                    'key' => 'pw_id',
                    'value' => $product_id,
                    'compare' => '='
                )
            ),
            'posts_per_page' => 1
        ));

        if (empty($woo_products)) {
            return false;
        }

        $woo_product_id = $woo_products[0]->ID;
        
        // 删除缓存数据
        $data_deleted = delete_post_meta($woo_product_id, '_pw_aggregated_data_cache');
        $time_deleted = delete_post_meta($woo_product_id, '_pw_aggregated_data_cache_time');

        return $data_deleted || $time_deleted; // 如果任一删除成功就返回 true
    }

    /**
     * Clear all cached product data.
     *
     * @since    1.0.0
     * @return   int    Number of products cleared.
     */
    public function clear_all_cached_product_data()
    {
        global $wpdb;
        
        // 删除所有相关的缓存 meta
        $cache_deleted = $wpdb->delete(
            $wpdb->postmeta,
            array('meta_key' => '_pw_aggregated_data_cache'),
            array('%s')
        );
        
        $time_deleted = $wpdb->delete(
            $wpdb->postmeta,
            array('meta_key' => '_pw_aggregated_data_cache_time'),
            array('%s')
        );

        return max($cache_deleted, $time_deleted);
    }

    /**
     * Check if remote product data has been updated since cache timestamp.
     * 如果updated-at有更新，进一步检查产品原始数据是否有实际变化。
     *
     * @since    1.0.0
     * @param    int             $product_id        The Promowares product ID.
     * @param    int             $cache_timestamp   The local cache timestamp.
     * @return   bool|WP_Error                     True if cache is still valid, false if needs update, WP_Error on failure.
     */
    private function check_remote_data_freshness($product_id, $cache_timestamp)
    {
        // Mock Error 模式下模拟通讯失败
        $mock_mode = (int) get_option('pw_api_mock_mode', 0);
        if ($mock_mode === 1) {
            error_log('[PW Cache] Mock Error enabled, simulating remote freshness check failure');
            return false; // 模拟通讯失败，标记缓存为过期，强制重新获取
        }

        try {
            $response = wp_remote_get(
                $this->api_base_url . "products/{$product_id}/updated-at",
                array(
                    'headers' => array(
                        'Authorization' => $this->hardcoded_token,
                        'Accept' => 'application/json',
                        'User-Agent' => 'PW-Canvas-Plugin/1.0.0'
                    ),
                    'timeout' => 5
                )
            );

            if (is_wp_error($response)) {
                $error_message = $response->get_error_message();
                error_log('[PW Cache] Failed to check remote data freshness: ' . $error_message);
                return new WP_Error('remote_check_failed', 'Network error when checking remote data freshness: ' . $error_message);
            }

            $response_code = wp_remote_retrieve_response_code($response);
            if ($response_code !== 200) {
                $error_message = "API returned status code: {$response_code}";
                error_log("[PW Cache] Remote freshness check returned status: {$response_code}");
                return new WP_Error('remote_check_failed', $error_message, array('status_code' => $response_code));
            }
            
            $body = wp_remote_retrieve_body($response);
            $data = json_decode($body, true);
            
            if (isset($data['data']['updated_at'])) {
                $remote_updated_at = strtotime($data['data']['updated_at']);
                $is_fresh = $remote_updated_at <= $cache_timestamp;
                
                // 如果updated-at显示有更新，进一步检查产品原始数据是否有实际变化
                if (!$is_fresh) {
                    error_log("[PW Cache] Product {$product_id} updated-at changed, checking actual data changes...");
                    $has_actual_changes = $this->check_product_data_changes($product_id);
                    
                    if (!$has_actual_changes) {
                        error_log("[PW Cache] Product {$product_id} updated-at changed but no actual data changes detected, keeping cache");
                        // 更新缓存时间戳，避免下次重复检查
                        $this->update_cache_timestamp($product_id);
                        return true;
                    }
                    
                    error_log("[PW Cache] Product {$product_id} has actual data changes, marking cache as STALE");
                    // 有实际变化，触发产品更新
                    $this->update_product_if_changed($product_id);
                }
                
                error_log("[PW Cache] Product {$product_id} cache freshness check: " . ($is_fresh ? 'FRESH' : 'STALE'));
                return $is_fresh;
            }
            
            error_log("[PW Cache] No updated_at field in response for product {$product_id}");
            return true; // 无法获取更新时间时保持缓存有效
            
        } catch (Exception $e) {
            error_log('[PW Cache] Exception in freshness check: ' . $e->getMessage());
            return true;
        }
    }

    /**
     * 获取远程产品的原始数据（标题、描述、价格、SKU等）
     *
     * @since    1.0.0
     * @param    int    $product_id    The Promowares product ID.
     * @return   array|false          产品数据或false
     */
    private function get_remote_product_raw_data($product_id)
    {
        try {
            $response = wp_remote_get(
                $this->api_base_url . "products/{$product_id}",
                array(
                    'headers' => array(
                        'Authorization' => $this->hardcoded_token,
                        'Accept' => 'application/json',
                        'User-Agent' => 'PW-Canvas-Plugin/1.0.0'
                    ),
                    'timeout' => 10
                )
            );

            if (is_wp_error($response)) {
                error_log('[PW Cache] Failed to fetch remote product data: ' . $response->get_error_message());
                return false;
            }

            $response_code = wp_remote_retrieve_response_code($response);
            if ($response_code !== 200) {
                error_log("[PW Cache] Remote product data returned status: {$response_code}");
                return false;
            }

            $body = wp_remote_retrieve_body($response);
            $data = json_decode($body, true);

            if (isset($data['data'])) {
                return $data['data'];
            }

            return false;
        } catch (Exception $e) {
            error_log('[PW Cache] Exception in get_remote_product_raw_data: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * 获取本地WooCommerce产品的数据
     *
     * @since    1.0.0
     * @param    int    $product_id    The Promowares product ID.
     * @return   array|false          本地产品数据或false
     */
    private function get_local_product_data($product_id)
    {
        // 查找对应的 WooCommerce 产品
        $woo_products = get_posts(array(
            'post_type' => 'product',
            'meta_query' => array(
                array(
                    'key' => 'pw_id',
                    'value' => $product_id,
                    'compare' => '='
                )
            ),
            'posts_per_page' => 1
        ));

        if (empty($woo_products)) {
            return false;
        }

        $woo_product_id = $woo_products[0]->ID;
        $product = wc_get_product($woo_product_id);

        if (!$product) {
            return false;
        }

        return array(
            'woo_product_id' => $woo_product_id,
            'name' => $product->get_name(),
            'description' => $product->get_description(),
            'short_description' => $product->get_short_description(),
            'sku' => $product->get_sku(),
            'regular_price' => $product->get_regular_price(),
            'sale_price' => $product->get_sale_price(),
            'price' => $product->get_price(),
            'stock_status' => $product->get_stock_status(),
            'stock_quantity' => $product->get_stock_quantity(),
            'manage_stock' => $product->get_manage_stock(),
        );
    }

    /**
     * 比较本地和远程产品数据，检查是否有实际变化
     *
     * @since    1.0.0
     * @param    int    $product_id    The Promowares product ID.
     * @return   bool                 True如果有实际变化，false如果没有
     */
    private function check_product_data_changes($product_id)
    {
        $remote_data = $this->get_remote_product_raw_data($product_id);
        $local_data = $this->get_local_product_data($product_id);

        if ($remote_data === false || $local_data === false) {
            // 无法获取数据，假设有变化以触发更新
            return true;
        }

        // 定义要比较的字段映射（远程字段 => 本地字段）
        $fields_to_compare = array(
            'name' => 'name',
            'description' => 'description',
            'short_description' => 'short_description',
            'sku' => 'sku',
            'price' => 'price',
            'regular_price' => 'regular_price',
            'sale_price' => 'sale_price',
            'stock_status' => 'stock_status',
            'stock_quantity' => 'stock_quantity',
        );

        $changes = array();

        foreach ($fields_to_compare as $remote_field => $local_field) {
            $remote_value = isset($remote_data[$remote_field]) ? $this->normalize_compare_value($remote_data[$remote_field], $remote_field) : '';
            $local_value = isset($local_data[$local_field]) ? $this->normalize_compare_value($local_data[$local_field], $remote_field) : '';

            // 标准化价格比较
            if (in_array($remote_field, array('price', 'regular_price', 'sale_price'))) {
                $remote_value = $this->normalize_price($remote_value);
                $local_value = $this->normalize_price($local_value);
            }

            if ($remote_value !== $local_value) {
                $changes[$remote_field] = array(
                    'remote' => $remote_value,
                    'local' => $local_value
                );
            }
        }

        if (!empty($changes)) {
            error_log("[PW Cache] Product {$product_id} detected changes: " . json_encode($changes));
            // 保存变更信息供后续使用
            $this->set_product_changes_cache($product_id, $changes);
            return true;
        }

        return false;
    }

    /**
     * 标准化价格值用于比较
     *
     * @since    1.0.0
     * @param    mixed    $price    价格值
     * @return   string            标准化后的价格
     */
    private function normalize_price($price)
    {
        if (empty($price)) {
            return '0';
        }
        // 移除货币符号和空格，保留数字和小数点
        $price = preg_replace('/[^0-9.]/', '', $price);
        return number_format((float) $price, 2, '.', '');
    }

    private function normalize_compare_value($value, $field)
    {
        if (is_null($value)) {
            return '';
        }

        if (is_bool($value)) {
            return $value ? '1' : '0';
        }

        if (is_array($value) || is_object($value)) {
            $value = wp_json_encode($value);
        }

        $value = (string) $value;

        if (in_array($field, array('name', 'description', 'short_description', 'sku'), true)) {
            $value = wp_strip_all_tags($value);
            $value = preg_replace('/\s+/u', ' ', $value);
        }

        return trim($value);
    }

    /**
     * 保存产品变更信息到临时缓存
     *
     * @since    1.0.0
     * @param    int      $product_id    The Promowares product ID.
     * @param    array    $changes       变更信息
     */
    private function set_product_changes_cache($product_id, $changes)
    {
        set_transient("pw_product_changes_{$product_id}", $changes, HOUR_IN_SECONDS);
    }

    /**
     * 获取产品变更信息
     *
     * @since    1.0.0
     * @param    int    $product_id    The Promowares product ID.
     * @return   array|false          变更信息或false
     */
    private function get_product_changes_cache($product_id)
    {
        return get_transient("pw_product_changes_{$product_id}");
    }

    /**
     * 更新缓存时间戳（当检测到无实际变化时）
     *
     * @since    1.0.0
     * @param    int    $product_id    The Promowares product ID.
     * @return   bool                  True on success, false on failure.
     */
    private function update_cache_timestamp($product_id)
    {
        // 查找对应的 WooCommerce 产品
        $woo_products = get_posts(array(
            'post_type' => 'product',
            'meta_query' => array(
                array(
                    'key' => 'pw_id',
                    'value' => $product_id,
                    'compare' => '='
                )
            ),
            'posts_per_page' => 1
        ));

        if (empty($woo_products)) {
            return false;
        }

        $woo_product_id = $woo_products[0]->ID;
        return update_post_meta($woo_product_id, '_pw_aggregated_data_cache_time', time());
    }

    /**
     * 如果产品有变化，更新WooCommerce产品数据
     *
     * @since    1.0.0
     * @param    int    $product_id    The Promowares product ID.
     * @return   bool                  True on success, false on failure.
     */
    private function update_product_if_changed($product_id)
    {
        $changes = $this->get_product_changes_cache($product_id);
        
        if ($changes === false) {
            // 重新检查变化
            $this->check_product_data_changes($product_id);
            $changes = $this->get_product_changes_cache($product_id);
        }

        if ($changes === false || empty($changes)) {
            return false;
        }

        $local_data = $this->get_local_product_data($product_id);
        if ($local_data === false) {
            return false;
        }

        $woo_product_id = $local_data['woo_product_id'];
        $product = wc_get_product($woo_product_id);

        if (!$product) {
            return false;
        }

        $updated = false;

        // 根据变更更新产品字段
        foreach ($changes as $field => $values) {
            $remote_value = $values['remote'];

            switch ($field) {
                case 'name':
                    $product->set_name($remote_value);
                    $updated = true;
                    break;

                case 'description':
                    $product->set_description($remote_value);
                    $updated = true;
                    break;

                case 'short_description':
                    $product->set_short_description($remote_value);
                    $updated = true;
                    break;

                case 'sku':
                    $product->set_sku($remote_value);
                    $updated = true;
                    break;

                case 'regular_price':
                    $product->set_regular_price($remote_value);
                    $updated = true;
                    break;

                case 'sale_price':
                    $product->set_sale_price($remote_value);
                    $updated = true;
                    break;

                case 'price':
                    // 价格通常由regular_price和sale_price计算得出，不需要直接设置
                    break;

                case 'stock_status':
                    $product->set_stock_status($remote_value);
                    $updated = true;
                    break;

                case 'stock_quantity':
                    $product->set_stock_quantity(intval($remote_value));
                    $updated = true;
                    break;
            }
        }

        if ($updated) {
            $product->save();
            error_log("[PW Cache] Product {$product_id} (WC ID: {$woo_product_id}) updated successfully");
            
            // 清除变更缓存
            delete_transient("pw_product_changes_{$product_id}");
            
            // 设置产品更新标记，用于通知前台刷新
            $this->set_product_update_flag($product_id);
            
            // 触发产品更新后的操作
            do_action('pw_product_updated_after_sync', $woo_product_id, $product_id, $changes);
            
            return true;
        }

        return false;
    }

    /**
     * 设置产品更新标记，用于通知前台刷新
     *
     * @since    1.0.0
     * @param    int    $product_id    The Promowares product ID.
     */
    private function set_product_update_flag($product_id)
    {
        // 使用 transient 存储更新标记，有效期5分钟
        set_transient("pw_product_updated_flag_{$product_id}", time(), 5 * MINUTE_IN_SECONDS);
        error_log("[PW Cache] Product {$product_id} update flag set for frontend refresh");
    }

    /**
     * 检查产品是否有更新标记
     *
     * @since    1.0.0
     * @param    int    $product_id    The Promowares product ID.
     * @return   bool                  True if product was updated, false otherwise.
     */
    public function check_product_update_flag($product_id)
    {
        $flag = get_transient("pw_product_updated_flag_{$product_id}");
        if ($flag !== false) {
            // 检查标记后删除，避免重复刷新
            delete_transient("pw_product_updated_flag_{$product_id}");
            return true;
        }
        return false;
    }

    /**
     * Check if remote print methods data has been updated since cache timestamp.
     *
     * @since    1.0.0
     * @param    array  $method_ids       Array of printing method IDs.
     * @param    int    $cache_timestamp  The local cache timestamp.
     * @return   bool                     True if cache is still valid, false if needs update.
     */
    private function check_print_methods_freshness($method_ids, $cache_timestamp)
    {
        try {
            $ids_string = implode(',', $method_ids);
            $response = wp_remote_get(
                $this->api_base_url . "print-methods/updated-at?ids={$ids_string}",
                array(
                    'headers' => array(
                        'Authorization' => $this->hardcoded_token,
                        'Accept' => 'application/json',
                        'User-Agent' => 'PW-Canvas-Plugin/1.0.0'
                    ),
                    'timeout' => 5
                )
            );
            
            if (is_wp_error($response)) {
                error_log('[PW Cache] Failed to check print methods freshness: ' . $response->get_error_message());
                return true; // 网络错误时保持缓存有效
            }
            
            $response_code = wp_remote_retrieve_response_code($response);
            if ($response_code !== 200) {
                error_log("[PW Cache] Print methods freshness check returned status: {$response_code}");
                return true; // API错误时保持缓存有效
            }
            
            $body = wp_remote_retrieve_body($response);
            $data = json_decode($body, true);
            
            if (isset($data['data']['updated_at'])) {
                $remote_updated_at = strtotime($data['data']['updated_at']);
                $is_fresh = $remote_updated_at <= $cache_timestamp;
                error_log("[PW Cache] Print methods cache freshness check: " . ($is_fresh ? 'FRESH' : 'STALE'));
                return $is_fresh;
            }
            
            error_log("[PW Cache] No updated_at field in print methods response");
            return true; // 无法获取更新时间时保持缓存有效
            
        } catch (Exception $e) {
            error_log('[PW Cache] Exception in print methods freshness check: ' . $e->getMessage());
            return true;
        }
    }

    /**
     * Check if remote custom colors data has been updated since cache timestamp.
     *
     * @since    1.0.0
     * @param    int    $color_list_id    The color list ID.
     * @param    int    $cache_timestamp  The local cache timestamp.
     * @return   bool                     True if cache is still valid, false if needs update.
     */
    private function check_custom_colors_freshness($color_list_id, $cache_timestamp)
    {
        try {
            $response = wp_remote_get(
                $this->api_base_url . "custom-colors/{$color_list_id}/updated-at",
                array(
                    'headers' => array(
                        'Authorization' => $this->hardcoded_token,
                        'Accept' => 'application/json',
                        'User-Agent' => 'PW-Canvas-Plugin/1.0.0'
                    ),
                    'timeout' => 5
                )
            );
            
            if (is_wp_error($response)) {
                error_log('[PW Cache] Failed to check custom colors freshness: ' . $response->get_error_message());
                return true; // 网络错误时保持缓存有效
            }
            
            $response_code = wp_remote_retrieve_response_code($response);
            if ($response_code !== 200) {
                error_log("[PW Cache] Custom colors freshness check returned status: {$response_code}");
                return true; // API错误时保持缓存有效
            }
            
            $body = wp_remote_retrieve_body($response);
            $data = json_decode($body, true);
            
            if (isset($data['data']['updated_at'])) {
                $remote_updated_at = strtotime($data['data']['updated_at']);
                $is_fresh = $remote_updated_at <= $cache_timestamp;
                error_log("[PW Cache] Custom colors {$color_list_id} cache freshness check: " . ($is_fresh ? 'FRESH' : 'STALE'));
                return $is_fresh;
            }
            
            error_log("[PW Cache] No updated_at field in custom colors response");
            return true; // 无法获取更新时间时保持缓存有效
            
        } catch (Exception $e) {
            error_log('[PW Cache] Exception in custom colors freshness check: ' . $e->getMessage());
            return true;
        }
    }

    /**
     * Get enhanced template data with views and layers.
     * 
     * This method implements the multi-step data fetching logic:
     * 1. Get product template ID from custom-templates/product/{product_id}
     * 2. Get views data from custom-views/template/{template_id}
     * 3. Get layers data for each view from layers?custom_view_id={view_id}
     *
     * @since    1.0.0
     * @param    int       $product_id    The product ID to fetch templates for.
     * @param    string    $token         The authentication token.
     * @return   array|WP_Error          The enhanced templates data or error.
     */
    private function get_enhanced_template_data($product_id, $token)
    {
        error_log("[PW Canvas] Starting get_enhanced_template_data for product_id: {$product_id}");
        
        // Step 1: Get customization data (template, views, layers) from aggregated endpoint
        error_log("[PW Canvas] Step 1: Fetching customization data for product_id: {$product_id}");
        $response = $this->call_promowares_api("products/{$product_id}/customization", $token);

        if (is_wp_error($response)) {
            error_log("[PW Canvas] Error fetching customization data: " . $response->get_error_message());
            return $response;
        }

        if (!isset($response['data']) || !is_array($response['data'])) {
            error_log("[PW Canvas] Customization data missing for product_id: {$product_id}");
            return new WP_Error('customization_data_missing', 'Customization data not found in response');
        }

        $customization_data = $response['data'];

        if (!isset($customization_data['custom_template']['id'])) {
            error_log("[PW Canvas] Custom template ID not found in customization data");
            return new WP_Error('custom_template_id_missing', 'Custom template ID not found in customization data');
        }

        $product_template_id = $customization_data['custom_template']['id'];
        error_log("[PW Canvas] Extracted product_template_id: {$product_template_id}");

        // Initialize final data structure to preserve expected format
        $final_data = is_array($response) ? $response : array();

        if (!isset($final_data['data']) || !is_array($final_data['data'])) {
            $final_data['data'] = array();
        }

        $final_data['productTemplateId'] = $product_template_id;
        $final_data['views'] = array();

        // Attach custom template data unchanged
        $final_data['data']['custom_template'] = $customization_data['custom_template'];

        foreach ($customization_data as $key => $value) {
            if ($key === 'custom_template' || $key === 'custom_views') {
                continue;
            }
            $final_data['data'][$key] = $value;
        }

        $custom_views = isset($customization_data['custom_views']) && is_array($customization_data['custom_views'])
            ? $customization_data['custom_views']
            : array();

        $main_custom_view = null;
        $sub_custom_views = array();
        $sub_view_index = 1;

        $view_position = 0;

        foreach ($custom_views as $view) {
            $view_layers = isset($view['layers']) && is_array($view['layers']) ? $view['layers'] : array();

            // Ensure layer_config exists and includes layers for downstream compatibility
            $layer_config = array();
            if (isset($view['layer_config']) && is_array($view['layer_config'])) {
                $layer_config = $view['layer_config'];
            }
            $layer_config['layers'] = $view_layers;

            $is_main_view = isset($view['view_type']) && $view['view_type'] === 'main';

            if ($is_main_view && $main_custom_view !== null) {
                // Only allow one main view; subsequent "main" views fall back to sub views
                $is_main_view = false;
            }

            if (!$is_main_view && $view_position === 0 && $main_custom_view === null) {
                // Fallback: treat the first view as main if type not provided
                $is_main_view = true;
            }

            $view_payload = array(
                'id' => $is_main_view ? 'main_view' : 'sub_view_' . $sub_view_index,
                'view_id' => isset($view['id']) ? $view['id'] : null,
                'view_type' => isset($view['view_type']) ? $view['view_type'] : null,
                'view_flow' => isset($view['view_flow']) ? $view['view_flow'] : null,
                'view_name' => isset($view['view_name']) ? $view['view_name'] : '',
                'status' => isset($view['status']) ? $view['status'] : null,
                'single_printing_method_only' => isset($view['single_printing_method_only']) ? $view['single_printing_method_only'] : null,
                'printing_method_list_id' => isset($view['printing_method_list_id']) ? $view['printing_method_list_id'] : null,
                'layers' => $view_layers,
                'data' => array(
                    'layer_config' => $layer_config,
                ),
            );

            // Preserve additional view meta data if available
            $preserved_keys = array('status', 'preview_images', 'mockup_images', 'printing_methods', 'printing_method_list');
            foreach ($preserved_keys as $key) {
                if (isset($view[$key])) {
                    $view_payload[$key] = $view[$key];
                }
            }

            $final_data['views'][] = $view_payload;

            // Prepare data structure for custom_view
            $view_for_custom_view = $view;
            $view_for_custom_view['layer_config'] = $layer_config;

            if ($is_main_view) {
                $main_custom_view = $view_for_custom_view;
            } else {
                $sub_custom_views[] = $view_for_custom_view;
                $sub_view_index++;
            }

            $view_position++;
        }

        // Ensure a main view is always present in custom_view data
        if ($main_custom_view === null && !empty($sub_custom_views)) {
            $main_custom_view = array_shift($sub_custom_views);
            $main_custom_view['view_type'] = isset($main_custom_view['view_type']) ? $main_custom_view['view_type'] : 'main';

            // Update views array to reflect reassigned main view id if necessary
            foreach ($final_data['views'] as &$view_reference) {
                if (
                    isset($view_reference['view_id'], $main_custom_view['id']) &&
                    strval($view_reference['view_id']) === strval($main_custom_view['id'])
                ) {
                    $view_reference['id'] = 'main_view';
                    $view_reference['view_type'] = isset($view_reference['view_type']) ? $view_reference['view_type'] : 'main';
                }
            }
            unset($view_reference);
        }

        $final_data['data']['custom_view'] = array(
            'main_custom_view' => $main_custom_view,
            'sub_custom_view' => $sub_custom_views,
        );

        error_log("[PW Canvas] get_enhanced_template_data completed successfully for product_id: {$product_id}");
        return $final_data;
    }

    /**
     * Get print methods data from Promowares API.
     *
     * @since    1.0.0
     * @param    WP_REST_Request    $request    The REST request object.
     * @return   WP_REST_Response              The print methods response.
     */
    public function get_print_methods_data($request)
    {
        $printing_method_ids = $request['printing_method_ids'];
        $token = $this->hardcoded_token;

        if (empty($token)) {
            return new WP_REST_Response(array(
                'error' => 'API token not configured'
            ), 401);
        }

        // Convert IDs array to comma-separated string for cache key and API call
        $ids_string = implode(',', $printing_method_ids);
        $cache_key = 'pw_print_methods_' . md5($ids_string);
        
        // 检查缓存数据（使用 option 存储）
        $cached_data = get_option($cache_key . '_data');
        $cache_timestamp = get_option($cache_key . '_time');
        
        if ($cached_data !== false && $cache_timestamp !== false) {
            // 检查远程数据是否有更新
            if ($this->check_print_methods_freshness($printing_method_ids, intval($cache_timestamp))) {
                // 缓存仍然有效，返回缓存数据
                $decoded_data = json_decode($cached_data, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    return new WP_REST_Response($decoded_data, 200);
                }
            } else {
                // 远程数据已更新，删除旧缓存
                delete_option($cache_key . '_data');
                delete_option($cache_key . '_time');
            }
        }
        
        // Call the API with all IDs at once using query parameter
        $api_response = $this->call_promowares_api("print-methods?ids={$ids_string}", $token);
        
        if (is_wp_error($api_response)) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => $api_response->get_error_message(),
                'requested_ids' => $printing_method_ids
            ), 500);
        }

        $response_data = array(
            'success' => true,
            'data' => $api_response,
            'total_methods' => is_array($api_response) ? count($api_response) : 0,
            'requested_ids' => $printing_method_ids,
            'has_errors' => false
        );

        // 保存缓存数据（使用 option 存储）
        $encoded_data = $this->encode_cache_json($response_data);
        if (false === $encoded_data) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => 'Failed to encode print methods cache data',
                'requested_ids' => $printing_method_ids
            ), 500);
        }
        $current_time = time();
        update_option($cache_key . '_data', $encoded_data);
        update_option($cache_key . '_time', $current_time);

        return new WP_REST_Response($response_data, 200);
    }

    /**
     * Get user info from Promowares API.
     *
     * @since    1.0.0
     * @param    string    $token    Optional. Custom token to use.
     * @return   array|WP_Error     The user info or error.
     */
    public function get_user_info($token = null)
    {
        $auth_token = $token ?: $this->hardcoded_token;

        if (empty($auth_token)) {
            return new WP_Error('missing_token', 'API token is required');
        }

        $response = wp_remote_get($this->api_base_url . 'auth/user-info', [
            'headers' => [
                'Accept' => 'application/json',
                'Accept-Encoding' => 'gzip, deflate, br',
                'Authorization' => $auth_token,
                'Connection' => 'keep-alive',
                'User-Agent' => 'PW-Canvas-Plugin/1.0.0'
            ],
            'timeout' => 30
        ]);

        if (is_wp_error($response)) {
            return $response;
        }

        $response_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if ($response_code === 200 && isset($data['data'])) {
            return $data;
        }

        return new WP_Error('api_error', 'Failed to get user info', $data);
    }

    /**
     * Validate token with Promowares API.
     *
     * @since    1.0.0
     * @param    string    $token    Optional. Custom token to use.
     * @return   array|WP_Error     The validation result or error.
     */
    public function validate_token($token = null)
    {
        $auth_token = $token ?: $this->hardcoded_token;

        if (empty($auth_token)) {
            return new WP_Error('missing_token', 'API token is required');
        }

        $response = wp_remote_get($this->api_base_url . 'auth/validate', [
            'headers' => [
                'Accept' => 'application/json',
                'Accept-Encoding' => 'gzip, deflate, br',
                'Authorization' => $auth_token,
                'Connection' => 'keep-alive',
                'User-Agent' => 'PW-Canvas-Plugin/1.0.0'
            ],
            'timeout' => 30
        ]);

        if (is_wp_error($response)) {
            return $response;
        }

        $response_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if ($response_code === 200 && isset($data['data'])) {
            return $data;
        }

        return new WP_Error('api_error', 'Token validation failed', $data);
    }

    /**
     * Get custom colors data from Promowares API.
     *
     * @since    1.0.0
     * @param    WP_REST_Request    $request    The REST request object.
     * @return   WP_REST_Response              The custom colors response.
     */
    public function get_custom_colors_data($request)
    {
        $color_list_id = $request['color_list_id'];
        $token = $this->hardcoded_token;

        if (empty($token)) {
            return new WP_REST_Response(array(
                'error' => 'API token not configured'
            ), 401);
        }

        if (empty($color_list_id)) {
            return new WP_REST_Response(array(
                'error' => 'color_list_id is required'
            ), 400);
        }

        // 生成缓存键（使用 option 存储）
        $cache_key = 'pw_custom_colors_' . $color_list_id;
        
        // 检查缓存数据
        $cached_data = get_option($cache_key . '_data');
        $cache_timestamp = get_option($cache_key . '_time');
        
        if ($cached_data !== false && $cache_timestamp !== false) {
            // 检查远程数据是否有更新
            if ($this->check_custom_colors_freshness($color_list_id, intval($cache_timestamp))) {
                // 缓存仍然有效，返回缓存数据
                $decoded_data = json_decode($cached_data, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    return new WP_REST_Response($decoded_data, 200);
                }
            } else {
                // 远程数据已更新，删除旧缓存
                delete_option($cache_key . '_data');
                delete_option($cache_key . '_time');
            }
        }

        // Call the custom-colors API endpoint
        $api_response = $this->call_promowares_api("custom-colors/{$color_list_id}", $token);
        
        if (is_wp_error($api_response)) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => $api_response->get_error_message(),
                'color_list_id' => $color_list_id
            ), 500);
        }

        $response_data = array(
            'success' => true,
            'data' => $api_response,
            'color_list_id' => $color_list_id
        );

        // 保存缓存数据（使用 option 存储）
        $encoded_data = $this->encode_cache_json($response_data);
        if (false === $encoded_data) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => 'Failed to encode custom colors cache data',
                'color_list_id' => $color_list_id
            ), 500);
        }
        $current_time = time();
        update_option($cache_key . '_data', $encoded_data);
        update_option($cache_key . '_time', $current_time);

        return new WP_REST_Response($response_data, 200);
    }
}
