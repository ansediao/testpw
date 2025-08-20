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
        // Note: Removed nopriv hook for security - only logged-in users should access API
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

        if (empty($token)) {
            return new WP_REST_Response(array(
                'error' => 'API token not configured'
            ), 401);
        }

        // 检查缓存数据
        // $cached_data = $this->get_cached_product_data($product_id);
        // if ($cached_data !== false) {
        //     return new WP_REST_Response($cached_data, 200);
        // }

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

        // 4. Get mock data from external API
        $mock_data = $this->call_mock_api($product_id);
        if (!is_wp_error($mock_data)) {
            $aggregated_data['mock_data'] = $mock_data;
            $aggregated_data['has_mock_data'] = true;
        } else {
            $aggregated_data['has_mock_data'] = false;
            $aggregated_data['mock_data_error'] = $mock_data->get_error_message();
        }

        // 5. Get WooCommerce product data if exists
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

        // 保存缓存数据
        $this->save_cached_product_data($product_id, $aggregated_data);

        return new WP_REST_Response($aggregated_data, 200);
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
     * @param    int    $product_id    The Promowares product ID.
     * @return   array|false           The cached data or false if not found/expired.
     */
    private function get_cached_product_data($product_id)
    {
        // 查找对应的 WooCommerce品
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

        // 检查缓存是否存在且未过期（30分钟 = 1800秒）
        if (empty($cached_data) || empty($cache_timestamp)) {
            return false;
        }

        $cache_expiry = 30 * 60; // 30分钟
        if ((time() - intval($cache_timestamp)) > $cache_expiry) {
            // 缓存已过期，删除旧缓存
            delete_post_meta($woo_product_id, '_pw_aggregated_data_cache');
            delete_post_meta($woo_product_id, '_pw_aggregated_data_cache_time');
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
        $encoded_data = wp_json_encode($aggregated_data);
        $current_time = time();

        // 保存缓存数据和时间戳
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
        
        // Step 1: Get product template
        error_log("[PW Canvas] Step 1: Fetching product template for product_id: {$product_id}");
        $product_template_response = $this->call_promowares_api("custom-templates/product/{$product_id}", $token);
        
        if (is_wp_error($product_template_response)) {
            error_log("[PW Canvas] Error fetching product template: " . $product_template_response->get_error_message());
            return $product_template_response;
        }
        
        error_log("[PW Canvas] Product template fetched successfully");

        // Extract template ID from response
        if (!isset($product_template_response['data']['id'])) {
            error_log("[PW Canvas] Product template ID not found in response");
            return new WP_Error('template_id_missing', 'Product template ID not found in response');
        }

        $product_template_id = $product_template_response['data']['id'];
        error_log("[PW Canvas] Extracted product_template_id: {$product_template_id}");
        
        // Initialize final data structure with original template data
        $final_data = $product_template_response;
        $final_data['productTemplateId'] = $product_template_id;

        // Step 2: Get custom views for the template
        error_log("[PW Canvas] Step 2: Fetching custom views for template_id: {$product_template_id}");
        $views_response = $this->call_promowares_api("custom-views/template/{$product_template_id}", $token);
        
        if (is_wp_error($views_response)) {
            // If views request fails, return original template data with empty views
            error_log("[PW Canvas] Error fetching custom views: " . $views_response->get_error_message());
            $final_data['views'] = array();
            $final_data['views_error'] = $views_response->get_error_message();
            return $final_data;
        }

        $view_data_array = isset($views_response['data']) ? $views_response['data'] : array();
        error_log("[PW Canvas] Found " . count($view_data_array) . " custom views");
        
        if (empty($view_data_array)) {
            error_log("[PW Canvas] No custom views found, returning template data with empty views");
            $final_data['views'] = array();
            return $final_data;
        }

        // Initialize views array with basic view data
        $final_data['views'] = array();
        foreach ($view_data_array as $index => $view) {
            $final_data['views'][] = array(
                // 第一个 为 main_view  剩下的  为 `sub_view_${index}`
                'id' => $index === 0 ? 'main_view' : 'sub_view_' . $index,
                'view_id' => $view['id'],
                'view_name'=> $view['view_name'],
                'printing_method_list_id' => isset($view['printing_method_list_id']) ? $view['printing_method_list_id'] : null,
                'layers' => array(), // Initialize empty layers array
                'data' => array(
                    'layer_config' => array(
                        'layers' => array()
                    )
                )
            );

        }

        // Step 3: Get layers for each view concurrently (simulate Promise.all behavior)
        error_log("[PW Canvas] Step 3: Fetching layers for each view");
        $layer_requests = array();
        foreach ($view_data_array as $index => $view) {
            $view_id = $view['id'];
            error_log("[PW Canvas] Fetching layers for view_id: {$view_id}");
            $layer_endpoint = "layers?custom_view_id={$view_id}";
            $layer_response = $this->call_promowares_api($layer_endpoint, $token);
            
            if (!is_wp_error($layer_response) && isset($layer_response['data'])) {
                $layer_data_array = $layer_response['data'];
                error_log("[PW Canvas] Found " . count($layer_data_array) . " layers for view_id: {$view_id}");
                
                // Populate layers data for this view
                if (!empty($layer_data_array)) {
                    $final_data['views'][$index]['layers'] = array();
                    $final_data['views'][$index]['data']['layer_config']['layers'] = array();
                    
                    foreach ($layer_data_array as $layer) {
                        $layer_item = array(
                            'id' => $layer['id'],
                            'name' => isset($layer['name']) ? $layer['name'] : '',
                            'layer_data' => $layer
                        );
                        
                        // Add to both layers array and data structure
                        $final_data['views'][$index]['layers'][] = $layer_item;
                        $final_data['views'][$index]['data']['layer_config']['layers'][] = $layer_item;
                    }
                }
            } else {
                if (is_wp_error($layer_response)) {
                    error_log("[PW Canvas] Error fetching layers for view_id {$view_id}: " . $layer_response->get_error_message());
                } else {
                    error_log("[PW Canvas] No layer data found for view_id: {$view_id}");
                }
            }
        }

        error_log("[PW Canvas] get_enhanced_template_data completed successfully for product_id: {$product_id}");
        return $final_data;
    }
}