<?php
/**
 * Canvas Product Inquiry Handler
 * 
 * @package    Pw_Admin
 * @subpackage Pw_Admin/public/modules
 * @author     PW <pw@pwcom>
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class Pw_Canvas_Inquiry {

    /**
     * Initialize hooks
     */
    public function __construct() {
        add_action('wp_ajax_pw_handle_inquiry', array($this, 'handle_inquiry_ajax'));
        add_action('wp_ajax_nopriv_pw_handle_inquiry', array($this, 'handle_inquiry_ajax'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('rest_api_init', array($this, 'register_rest_routes'));
    }

    /**
     * Register REST API routes
     */
    public function register_rest_routes() {
        register_rest_route('pwca/v1', '/inquiry', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_inquiry_rest'),
            'permission_callback' => '__return_true',
            'args' => array(
                'product_id' => array(
                    'required' => true,
                    'validate_callback' => function($param, $request, $key) {
                        return is_numeric($param) && $param > 0;
                    },
                    'sanitize_callback' => 'absint'
                ),
                'inquiry_first_name' => array(
                    'required' => true,
                    'validate_callback' => function($param, $request, $key) {
                        return !empty(trim($param));
                    },
                    'sanitize_callback' => 'sanitize_text_field'
                ),
                'inquiry_last_name' => array(
                    'required' => true,
                    'validate_callback' => function($param, $request, $key) {
                        return !empty(trim($param));
                    },
                    'sanitize_callback' => 'sanitize_text_field'
                ),
                'inquiry_email' => array(
                    'required' => true,
                    'validate_callback' => function($param, $request, $key) {
                        return is_email($param);
                    },
                    'sanitize_callback' => 'sanitize_email'
                ),
                'inquiry_phone' => array(
                    'required' => false,
                    'sanitize_callback' => 'sanitize_text_field'
                ),
                'inquiry_message' => array(
                    'required' => true,
                    'validate_callback' => function($param, $request, $key) {
                        return !empty(trim($param));
                    },
                    'sanitize_callback' => 'sanitize_textarea_field'
                )
            )
        ));
    }

    /**
     * Handle REST API inquiry submission
     */
    public function handle_inquiry_rest($request) {
        // 获取参数（已经过验证和清理）
        $product_id = $request['product_id'];
        $first_name = $request['inquiry_first_name'];
        $last_name = $request['inquiry_last_name'];
        $email = $request['inquiry_email'];
        $phone = $request['inquiry_phone'] ?? '';
        $message = $request['inquiry_message'];

        // 获取产品信息
        $product = wc_get_product($product_id);
        if (!$product) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Product not found'
            ), 404);
        }

        $product_title = $product->get_name();
        $name = trim($first_name . ' ' . $last_name);

        // 保存到 Flamingo
        $flamingo_saved = $this->save_to_flamingo($product_id, $product_title, $name, $email, $phone, $message);

        // 发送邮件通知
        $email_sent = $this->send_notification_email($product_id, $product_title, $name, $email, $phone, $message);

        if ($flamingo_saved) {
            $response_message = $email_sent 
                ? 'Your inquiry has been sent successfully!' 
                : 'Your inquiry has been saved but email notification failed.';
            
            return new WP_REST_Response(array(
                'success' => true,
                'message' => $response_message
            ), 200);
        } else {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Failed to save inquiry. Please try again.'
            ), 500);
        }
    }

    /**
     * Enqueue scripts and localize data
     */
    public function enqueue_scripts() {
        // 只在产品页面加载
        if (isset($_GET['product_id'])) {
            wp_localize_script('jquery', 'pwInquiry', array(
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('pw_inquiry_nonce')
            ));
        }
    }

    /**
     * Handle AJAX inquiry submission
     */
    public function handle_inquiry_ajax() {
        // 验证 nonce
        if (!wp_verify_nonce($_POST['nonce'], 'pw_inquiry_nonce')) {
            wp_send_json_error('Security check failed');
        }

        // 获取并验证表单数据
        $product_id = isset($_POST['product_id']) ? absint($_POST['product_id']) : 0;
        $first_name = isset($_POST['inquiry_first_name']) ? sanitize_text_field($_POST['inquiry_first_name']) : '';
        $last_name = isset($_POST['inquiry_last_name']) ? sanitize_text_field($_POST['inquiry_last_name']) : '';
        $email = isset($_POST['inquiry_email']) ? sanitize_email($_POST['inquiry_email']) : '';
        $phone = isset($_POST['inquiry_phone']) ? sanitize_text_field($_POST['inquiry_phone']) : '';
        $message = isset($_POST['inquiry_message']) ? sanitize_textarea_field($_POST['inquiry_message']) : '';

        // 验证必填字段
        if (empty($first_name) || empty($last_name) || empty($email) || empty($message) || !$product_id) {
            wp_send_json_error('Please fill in all required fields');
        }

        // 验证邮箱格式
        if (!is_email($email)) {
            wp_send_json_error('Please enter a valid email address');
        }

        // 获取产品信息
        $product = wc_get_product($product_id);
        if (!$product) {
            wp_send_json_error('Product not found');
        }

        $product_title = $product->get_name();
        $name = trim($first_name . ' ' . $last_name);

        // 保存到 Flamingo
        $flamingo_saved = $this->save_to_flamingo($product_id, $product_title, $name, $email, $phone, $message);

        // 发送邮件通知
        $email_sent = $this->send_notification_email($product_id, $product_title, $name, $email, $phone, $message);

        if ($flamingo_saved) {
            if ($email_sent) {
                wp_send_json_success('Your inquiry has been sent successfully!');
            } else {
                wp_send_json_success('Your inquiry has been saved but email notification failed.');
            }
        } else {
            wp_send_json_error('Failed to save inquiry. Please try again.');
        }
    }

    /**
     * Save inquiry to Flamingo plugin
     */
    private function save_to_flamingo($product_id, $product_title, $name, $email, $phone, $message) {
        // 检查 Flamingo 插件是否激活
        if (!class_exists('Flamingo_Inbound_Message')) {
            error_log('Flamingo plugin not active');
            return false;
        }

        try {
            // 准备 Flamingo 字段数据
            $flamingo_fields = array(
                'inquiry_name'    => $name,
                'inquiry_email'   => $email,
                'inquiry_phone'   => $phone,
                'inquiry_message' => $message,
                'product_name'    => $product_title,
                'product_id'      => $product_id,
                'inquiry_source'  => 'Canvas Product Page',
                'inquiry_url'     => home_url('/pwcanvas/?product_id=' . $product_id),
                'submission_time' => current_time('mysql')
            );

            $inquiry_subject = sprintf('Canvas Product Inquiry: %s', $product_title);

            // 创建 Flamingo 记录
            $post_data = array(
                'post_type'    => 'flamingo_inbound',
                'post_status'  => 'publish',
                'post_title'   => $inquiry_subject,
                'post_content' => $message,
                'meta_input'   => array(
                    '_from'        => $name . ' <' . $email . '>',
                    '_from_name'   => $name,
                    '_from_email'  => $email,
                    '_subject'     => $inquiry_subject,
                    '_fields'      => $flamingo_fields,
                    '_channel'     => 'canvas-inquiry'
                )
            );

            $post_id = wp_insert_post($post_data);

            if ($post_id && !is_wp_error($post_id)) {
                // 记录日志
                error_log(sprintf('Canvas inquiry saved to Flamingo: Post ID %d, Product ID %d, Email %s', $post_id, $product_id, $email));
                return true;
            } else {
                error_log('Failed to create Flamingo post: ' . (is_wp_error($post_id) ? $post_id->get_error_message() : 'Unknown error'));
                return false;
            }
        } catch (Exception $e) {
            error_log('Flamingo save error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Send email notification
     */
    private function send_notification_email($product_id, $product_title, $name, $email, $phone, $message) {
        try {
            $to = get_option('admin_email');
            $subject = sprintf('Canvas Product Inquiry: %s', $product_title);
            $headers = array(
                'Content-Type: text/html; charset=UTF-8',
                'From: ' . get_bloginfo('name') . ' <' . get_option('admin_email') . '>',
                'Reply-To: ' . $name . ' <' . $email . '>'
            );

            // 构建邮件内容
            $body = $this->build_email_template($product_id, $product_title, $name, $email, $phone, $message);

            return wp_mail($to, $subject, $body, $headers);
        } catch (Exception $e) {
            error_log('Email send error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Build email template
     */
    private function build_email_template($product_id, $product_title, $name, $email, $phone, $message) {
        $product_url = home_url('/pwcanvas/?product_id=' . $product_id);
        
        $body = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">';
        $body .= '<div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">';
        
        // Header
        $body .= '<h2 style="color: #333; margin-bottom: 20px; border-bottom: 2px solid #00bcd4; padding-bottom: 10px;">Canvas Product Inquiry</h2>';
        
        // Product Info
        $body .= '<div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">';
        $body .= '<h3 style="color: #555; margin: 0 0 10px 0;">Product Information</h3>';
        $body .= '<p style="margin: 5px 0;"><strong>Product:</strong> <a href="' . esc_url($product_url) . '" style="color: #00bcd4; text-decoration: none;">' . esc_html($product_title) . '</a></p>';
        $body .= '<p style="margin: 5px 0;"><strong>Product ID:</strong> ' . esc_html($product_id) . '</p>';
        $body .= '</div>';
        
        // Customer Info
        $body .= '<div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">';
        $body .= '<h3 style="color: #555; margin: 0 0 10px 0;">Customer Information</h3>';
        $body .= '<p style="margin: 5px 0;"><strong>Name:</strong> ' . esc_html($name) . '</p>';
        $body .= '<p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:' . esc_attr($email) . '" style="color: #00bcd4;">' . esc_html($email) . '</a></p>';
        
        if (!empty($phone)) {
            $body .= '<p style="margin: 5px 0;"><strong>Phone:</strong> ' . esc_html($phone) . '</p>';
        }
        $body .= '</div>';
        
        // Message
        $body .= '<div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">';
        $body .= '<h3 style="color: #555; margin: 0 0 10px 0;">Message</h3>';
        $body .= '<div style="background-color: #ffffff; padding: 15px; border-radius: 3px; border-left: 4px solid #00bcd4;">';
        $body .= '<p style="margin: 0; line-height: 1.6; color: #333;">' . nl2br(esc_html($message)) . '</p>';
        $body .= '</div>';
        $body .= '</div>';
        
        // Footer
        $body .= '<div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">';
        $body .= '<p>This inquiry was submitted from the Canvas Product Customization page.</p>';
        $body .= '<p>Submission time: ' . current_time('Y-m-d H:i:s') . '</p>';
        $body .= '</div>';
        
        $body .= '</div>';
        $body .= '</div>';
        
        return $body;
    }
}