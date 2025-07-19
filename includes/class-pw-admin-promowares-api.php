<?php

/**
 * Promowares API Communication Handler
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
class Pw_Admin_Promowares_Api {

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
    public function __construct() {
        $this->api_base_url = 'https://dev.promowares.com/api/v1/';
        $this->hardcoded_token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NDE4MTYxMjgsInRlYW0iOiIxIiwidXNlcl9pZCI6MX0.60D-NUbUBa_n3KXyNrhnoN964IjwIFJtGUVDCSnKYFM';
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
    public function get_products_from_api() {
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
     * Handle AJAX proxy API requests to Promowares API.
     * 
     * This method acts as a proxy for frontend AJAX requests to the
     * Promowares API, handling authentication and security checks.
     *
     * @since    1.0.0
     */
    public function handle_proxy_api_request() {
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
    public function verify_user_token($token) {
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
    public function get_product($product_id, $token = null) {
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
    public function sync_product($product_data, $token = null) {
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
     * Check API connection status.
     *
     * @since    1.0.0
     * @param    string    $token    Optional. Custom token to use.
     * @return   bool               True if connected, false otherwise.
     */
    public function check_connection($token = null) {
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
    public function get_api_base_url() {
        return $this->api_base_url;
    }

    /**
     * Get the hardcoded token.
     *
     * @since    1.0.0
     * @return   string    The hardcoded token.
     */
    public function get_hardcoded_token() {
        return $this->hardcoded_token;
    }

    /**
     * Register AJAX hooks for API proxy functionality.
     *
     * @since    1.0.0
     */
    public function register_ajax_hooks() {
        add_action('wp_ajax_pw_proxy_api_request', array($this, 'handle_proxy_api_request'));
        // Note: Removed nopriv hook for security - only logged-in users should access API
    }
}