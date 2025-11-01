<?php
/**
 * Product Inquiry Module
 * 
 * @package    Pw_Admin
 * @subpackage Pw_Admin/public/modules
 * @author     PW <pw@pwcom>
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class Pw_Product_Inquiry {

    /**
     * Initialize hooks
     */
    public function __construct() {
        add_filter('woocommerce_product_tabs', array($this, 'add_product_inquiry_tab'));
        add_action('admin_post_nopriv_handle_product_inquiry', array($this, 'process_product_inquiry_form'));
        add_action('admin_post_handle_product_inquiry', array($this, 'process_product_inquiry_form'));
        add_action('admin_notices', array($this, 'show_flamingo_unread_messages_notice'));
        add_action('admin_init', array($this, 'mark_flamingo_message_as_read_on_view'));
    }

    /**
     * Add product inquiry form tab to WooCommerce product tabs
     */
    public function add_product_inquiry_tab($tabs) {
        $tabs['custom_inquiry_tab'] = array(
            'title'     => __('Product Inquiry Form', 'pw-admin'),
            'priority'  => 50,
            'callback'  => array($this, 'product_inquiry_tab_content')
        );
        
        return $tabs;
    }

    /**
     * Display content for product inquiry tab
     */
    public function product_inquiry_tab_content() {
        global $product;
        
        if (!$product) {
            return;
        }
        
        $product_id = $product->get_id();
        $product_title = $product->get_name();
        
        echo '<h2>' . sprintf(__('Inquire about %s', 'pw-admin'), esc_html($product_title)) . '</h2>';
        
        // Display success/error messages
        if (isset($_GET['inquiry_status'])) {
            $status = sanitize_text_field($_GET['inquiry_status']);
            if ($status === 'success') {
                echo '<div class="pwca-woocommerce-message" role="alert">' . __('Your inquiry has been sent successfully!', 'pw-admin') . '</div>';
            } elseif ($status === 'error') {
                echo '<div class="pwca-woocommerce-error" role="alert">' . __('There was an error sending your inquiry. Please try again.', 'pw-admin') . '</div>';
            } elseif ($status === 'mail_failed') {
                echo '<div class="pwca-woocommerce-info" role="alert">' . __('Your inquiry has been saved but email notification failed.', 'pw-admin') . '</div>';
            }
        }
        
        // Add custom CSS for the form
        echo '<style>
            #product_inquiry_form {
                max-width: 800px;
                margin: 20px auto;
                padding: 0 20px;
            }
            
            .pw-form-row {
                display: flex;
                align-items: center;
                margin-bottom: 25px;
                gap: 20px;
            }
            
            .pw-form-row label {
                flex: 0 0 150px;
                font-weight: 500;
                color: #999;
                font-size: 16px;
                text-align: left;
                margin: 0;
            }
            
            .pw-form-row input[type="text"],
            .pw-form-row input[type="email"],
            .pw-form-row input[type="tel"] {
                flex: 1;
                padding: 12px 16px;
                border: 2px solid #ddd;
                border-radius: 8px;
                font-size: 16px;
                font-family: inherit;
                background-color: #fff;
                transition: border-color 0.3s ease;
                box-sizing: border-box;
            }
            
            .pw-form-row textarea {
                flex: 1;
                padding: 12px 16px;
                border: 2px solid #ddd;
                border-radius: 8px;
                font-size: 16px;
                font-family: inherit;
                background-color: #fff;
                transition: border-color 0.3s ease;
                box-sizing: border-box;
                resize: vertical;
                min-height: 120px;
            }
            
            .pw-form-row input[type="text"]:focus,
            .pw-form-row input[type="email"]:focus,
            .pw-form-row input[type="tel"]:focus,
            .pw-form-row textarea:focus {
                outline: none;
                border-color: #007cba;
            }
            
            .pw-form-row.textarea-row {
                align-items: flex-start;
            }
            
            .pw-form-row.textarea-row label {
                padding-top: 12px;
            }
            
            .pw-submit-row {
                display: flex;
                justify-content: flex-end;
                margin-top: 30px;
            }
            
            .pw-submit-btn {
                background-color: #00bcd4 !important;
                color: white !important;
                border: none !important;
                padding: 12px 30px !important;
                border-radius: 6px !important;
                font-size: 16px !important;
                font-weight: 500 !important;
                cursor: pointer !important;
                transition: background-color 0.3s ease !important;
                text-transform: none !important;
            }
            
            .pw-submit-btn:hover {
                background-color: #00acc1 !important;
            }
            
            .pw-form-required {
                color: #e74c3c;
            }
            
            @media (max-width: 768px) {
                .pw-form-row {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 8px;
                }
                
                .pw-form-row label {
                    flex: none;
                    width: 100%;
                }
                
                .pw-form-row input[type="text"],
                .pw-form-row input[type="email"],
                .pw-form-row input[type="tel"],
                .pw-form-row textarea {
                    width: 100%;
                }
                
                .pw-form-row.textarea-row label {
                    padding-top: 0;
                }
            }
        </style>';
        
        // Inquiry form
        echo '<form action="' . esc_url(admin_url('admin-post.php')) . '" method="post" id="product_inquiry_form">';
        
        // WordPress nonce for security
        wp_nonce_field('product_inquiry_action', 'product_inquiry_nonce');
        
        // Hidden fields
        echo '<input type="hidden" name="action" value="handle_product_inquiry">';
        echo '<input type="hidden" name="product_id" value="' . esc_attr($product_id) . '">';
        echo '<input type="hidden" name="product_title" value="' . esc_attr($product_title) . '">';
        
        // First Name field
        echo '<div class="pw-form-row">';
        echo '<label for="inquiry_first_name">First Name <span class="pw-form-required">*</span></label>';
        echo '<input type="text" name="inquiry_first_name" id="inquiry_first_name" required>';
        echo '</div>';
        
        // Last Name field
        echo '<div class="pw-form-row">';
        echo '<label for="inquiry_last_name">Last Name <span class="pw-form-required">*</span></label>';
        echo '<input type="text" name="inquiry_last_name" id="inquiry_last_name" required>';
        echo '</div>';
        
        // Email field
        echo '<div class="pw-form-row">';
        echo '<label for="inquiry_email">Email <span class="pw-form-required">*</span></label>';
        echo '<input type="email" name="inquiry_email" id="inquiry_email" required>';
        echo '</div>';
        
        // Tel field
        echo '<div class="pw-form-row">';
        echo '<label for="inquiry_phone">Tel</label>';
        echo '<input type="tel" name="inquiry_phone" id="inquiry_phone">';
        echo '</div>';
        
        // Message field
        echo '<div class="pw-form-row textarea-row">';
        echo '<label for="inquiry_message">Message <span class="pw-form-required">*</span></label>';
        echo '<textarea name="inquiry_message" id="inquiry_message" required></textarea>';
        echo '</div>';
        
        // Submit button
        echo '<div class="pw-submit-row">';
        echo '<input type="submit" name="submit_inquiry" value="Submit" class="pw-submit-btn">';
        echo '</div>';
        
        echo '</form>';
    }

    /**
     * Process product inquiry form submission
     */
    public function process_product_inquiry_form() {
        // Verify nonce
        if (!isset($_POST['product_inquiry_nonce']) || !wp_verify_nonce($_POST['product_inquiry_nonce'], 'product_inquiry_action')) {
            wp_die(__('Security check failed!', 'pw-admin'));
        }
        
        // Sanitize and get form data
        $product_id = isset($_POST['product_id']) ? absint($_POST['product_id']) : 0;
        $product_title = isset($_POST['product_title']) ? sanitize_text_field($_POST['product_title']) : __('Unknown Product', 'pw-admin');
        $first_name = isset($_POST['inquiry_first_name']) ? sanitize_text_field($_POST['inquiry_first_name']) : '';
        $last_name = isset($_POST['inquiry_last_name']) ? sanitize_text_field($_POST['inquiry_last_name']) : '';
        $name = trim($first_name . ' ' . $last_name);
        $email = isset($_POST['inquiry_email']) ? sanitize_email($_POST['inquiry_email']) : '';
        $phone = isset($_POST['inquiry_phone']) ? sanitize_text_field($_POST['inquiry_phone']) : '';
        $message = isset($_POST['inquiry_message']) ? sanitize_textarea_field($_POST['inquiry_message']) : '';
        
        // Get redirect URL
        $redirect_url = $product_id ? get_permalink($product_id) : home_url();
        
        // Validate required fields
        if (empty($first_name) || empty($last_name) || empty($email) || empty($message) || !$product_id) {
            wp_redirect(add_query_arg('inquiry_status', 'error', $redirect_url));
            exit;
        }
        
        // Save to Flamingo if plugin is active
        if (class_exists('Flamingo_Inbound_Message')) {
            $this->save_inquiry_to_flamingo($product_id, $product_title, $name, $email, $phone, $message, $redirect_url);
        }
        
        // Send email notification
        $mail_sent = $this->send_inquiry_email($product_id, $product_title, $name, $email, $phone, $message, $redirect_url);
        
        // Redirect with appropriate status
        if ($mail_sent) {
            wp_redirect(add_query_arg('inquiry_status', 'success', $redirect_url));
        } else {
            wp_redirect(add_query_arg('inquiry_status', 'mail_failed', $redirect_url));
        }
        exit;
    }

    /**
     * Save inquiry to Flamingo plugin
     */
    private function save_inquiry_to_flamingo($product_id, $product_title, $name, $email, $phone, $message, $redirect_url) {
        $flamingo_fields = array(
            'inquiry_name'    => $name,
            'inquiry_email'   => $email,
            'inquiry_phone'   => $phone,
            'inquiry_message' => $message,
            'product_name'    => $product_title,
            'product_id'      => $product_id,
            'inquiry_page'    => $redirect_url
        );
        
        $inquiry_subject = sprintf(__('Product inquiry for "%s"', 'pw-admin'), $product_title);
        
        $post_data = array(
            'post_type'    => 'flamingo_inbound',
            'post_status'  => 'publish',
            'post_title'   => $inquiry_subject,
        );
        
        $post_id = wp_insert_post($post_data);
        
        if ($post_id && !is_wp_error($post_id)) {
            update_post_meta($post_id, '_from', $name . ' <' . $email . '>');
            update_post_meta($post_id, '_from_name', $name);
            update_post_meta($post_id, '_from_email', $email);
            update_post_meta($post_id, '_subject', $inquiry_subject);
            update_post_meta($post_id, '_fields', $flamingo_fields);
        }
    }

    /**
     * Send inquiry email notification
     */
    private function send_inquiry_email($product_id, $product_title, $name, $email, $phone, $message, $redirect_url) {
        $to = get_option('admin_email');
        $subject = sprintf(__('Product Inquiry for %s', 'pw-admin'), $product_title);
        $headers = array(
            'Content-Type: text/html; charset=UTF-8',
            'From: ' . $name . ' <' . $email . '>'
        );
        
        $body = "<h2>" . __('Product Inquiry Details:', 'pw-admin') . "</h2>";
        $body .= "<p><strong>" . __('Product:', 'pw-admin') . "</strong> <a href='" . esc_url($redirect_url) . "'>" . esc_html($product_title) . "</a> (ID: " . esc_html($product_id) . ")</p>";
        $body .= "<p><strong>" . __('Name:', 'pw-admin') . "</strong> " . esc_html($name) . "</p>";
        $body .= "<p><strong>" . __('Email:', 'pw-admin') . "</strong> " . esc_html($email) . "</p>";
        
        if (!empty($phone)) {
            $body .= "<p><strong>" . __('Phone:', 'pw-admin') . "</strong> " . esc_html($phone) . "</p>";
        }
        
        $body .= "<p><strong>" . __('Message:', 'pw-admin') . "</strong><br>" . nl2br(esc_html($message)) . "</p>";
        
        return wp_mail($to, $subject, $body, $headers);
    }

    /**
     * Show admin notice for unread Flamingo messages
     */
    public function show_flamingo_unread_messages_notice() {
        if (!current_user_can('manage_options')) {
            return;
        }
        
        if (!class_exists('Flamingo_Inbound_Message')) {
            return;
        }
        
        $args = array(
            'post_type'      => 'flamingo_inbound',
            'post_status'    => 'publish',
            'posts_per_page' => -1,
            'meta_query'     => array(
                array(
                    'key'     => '_flamingo_is_read',
                    'compare' => 'NOT EXISTS',
                ),
            ),
            'fields' => 'ids',
            'cache_results'          => false,
            'update_post_meta_cache' => false,
            'update_post_term_cache' => false,
        );
        
        $unread_query = new WP_Query($args);
        $unread_count = $unread_query->found_posts;
        
        if ($unread_count > 0) {
            $inbox_url = admin_url('admin.php?page=flamingo_inbound');
            echo '<div class="notice notice-info is-dismissible">';
            echo '<p>';
            printf(
                esc_html__('You have %d new product inquiry messages.', 'pw-admin'),
                $unread_count
            );
            echo ' <a href="' . esc_url($inbox_url) . '">' . esc_html__('View Now', 'pw-admin') . '</a>';
            echo '</p>';
            echo '</div>';
        }
    }

    /**
     * Mark Flamingo message as read when viewed
     */
    public function mark_flamingo_message_as_read_on_view() {
        global $pagenow;
        
        if ('admin.php' === $pagenow &&
            isset($_GET['page']) &&
            $_GET['page'] === 'flamingo_inbound' &&
            isset($_GET['post'])) {
            
            $post_id = absint($_GET['post']);
            
            if (!$post_id) {
                return;
            }
            
            if (!current_user_can('edit_post', $post_id)) {
                return;
            }
            
            if (!get_post_meta($post_id, '_flamingo_is_read', true)) {
                update_post_meta($post_id, '_flamingo_is_read', '1');
            }
        }
    }
}