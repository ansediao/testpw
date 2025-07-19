<?php
/**
 * Template Handler Module
 * 
 * @package    Pw_Admin
 * @subpackage Pw_Admin/public/modules
 * @author     PW <pw@pwcom>
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class Pw_Template_Handler {

    /**
     * Initialize hooks
     */
    public function __construct() {
        add_filter('woocommerce_locate_template', array($this, 'custom_woocommerce_template'), 10, 3);
        add_filter('wc_get_template', array($this, 'custom_template_path'), 10, 5);
    }

    /**
     * Custom WooCommerce template loading
     */
    public function custom_woocommerce_template($template, $template_name, $template_path) {
        global $woocommerce;
        
        $_template = $template;
        
        if (!$template_path) {
            $template_path = $woocommerce->template_url();
        }
        
        $plugin_path = untrailingslashit(plugin_dir_path(__FILE__)) . '/../templates/';
        
        // Look within passed path within the theme - this is priority
        $template = locate_template(
            array(
                trailingslashit($template_path) . $template_name,
                $template_name
            )
        );
        
        // Get the template from this plugin, if it exists
        if (!$template && file_exists($plugin_path . $template_name)) {
            $template = $plugin_path . $template_name;
        }
        
        // Use default template
        if (!$template) {
            $template = $_template;
        }
        
        return $template;
    }

    /**
     * Custom template path handling
     */
    public function custom_template_path($located, $template_name, $args, $template_path, $default_path) {
        if (strpos($template_name, 'single-product') !== false || strpos($template_name, 'content-product') !== false) {
            $plugin_template = untrailingslashit(plugin_dir_path(__FILE__)) . '/../templates/' . $template_name;
            
            if (file_exists($plugin_template)) {
                return $plugin_template;
            }
        }
        
        return $located;
    }

    /**
     * Get template part
     */
    public static function get_template_part($slug, $name = null, $args = array()) {
        $template = '';
        
        if ($name) {
            $template = locate_template(array("{$slug}-{$name}.php", "pw-admin/{$slug}-{$name}.php"));
        }
        
        if (!$template) {
            $template = locate_template(array("{$slug}.php", "pw-admin/{$slug}.php"));
        }
        
        // Check plugin templates directory
        if (!$template) {
            $plugin_template = untrailingslashit(plugin_dir_path(__FILE__)) . '/../templates/';
            
            if ($name) {
                $template_path = $plugin_template . "{$slug}-{$name}.php";
            } else {
                $template_path = $plugin_template . "{$slug}.php";
            }
            
            if (file_exists($template_path)) {
                $template = $template_path;
            }
        }
        
        if ($template) {
            if (!empty($args) && is_array($args)) {
                extract($args);
            }
            
            include $template;
        }
    }
}