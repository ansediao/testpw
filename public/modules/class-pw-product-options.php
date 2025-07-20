<?php

/**
 * Product Options Module
 * 
 * Handles Buy Sample and Blank Product checkbox options
 *
 * @package    Pw_Admin
 * @subpackage Pw_Admin/public/modules
 */

class Pw_Product_Options
{
    /**
     * Constructor
     */
    public function __construct()
    {
        // Hook into product display
        add_action('pw_admin_single_product_custom_content', array($this, 'display_product_options'), 10, 2);
        
        // Add to cart data processing
        add_filter('woocommerce_add_cart_item_data', array($this, 'add_product_options_to_cart'), 10, 3);
        
        // Display options in cart
        add_filter('woocommerce_get_item_data', array($this, 'display_product_options_in_cart'), 10, 2);
        
        // Save options to order
        add_action('woocommerce_checkout_create_order_line_item', array($this, 'save_product_options_to_order'), 10, 4);
    }

    /**
     * Display product options on single product page
     *
     * @param WC_Product $product
     * @param int $product_id
     */
    public function display_product_options($product, $product_id)
    {
        // Only show for sync products
        $pw_isSyncProduct = get_post_meta($product_id, 'pw_isSyncProduct', true);
        if ($pw_isSyncProduct !== '1') {
            return;
        }

        // Get API data to check blank_item default state
        $api = new Pw_Admin_Promowares_Api();
        $api_response = $api->get_product_by_woo_id($product_id);
        
        $blank_product_checked = false;
        if (!is_wp_error($api_response) && isset($api_response['data']['blank_item'])) {
            $blank_product_checked = (bool) $api_response['data']['blank_item'];
        }

        echo $this->render_product_options_html($blank_product_checked);
    }

    /**
     * Render the product options HTML
     *
     * @param bool $blank_product_checked
     * @return string
     */
    private function render_product_options_html($blank_product_checked)
    {
        ob_start();
        ?>
        <!-- 添加勾选框 -->
        <div class="product-options" style="margin-top: 20px;">
            <div style="display: flex; gap: 20px; align-items: center;">
                <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                    <input type="checkbox" id="buy_sample" name="buy_sample" value="1" style="margin: 0;">
                    <span><?php _e('Buy Sample', 'pw-admin'); ?></span>
                </label>
                <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                    <input type="checkbox" id="blank_product" name="blank_product" value="1" style="margin: 0;" <?php echo $blank_product_checked ? 'checked' : ''; ?>>
                    <span><?php _e('Blank Product', 'pw-admin'); ?></span>
                </label>
            </div>
            <hr>
        </div>

        <script type="text/javascript">
        jQuery(document).ready(function($) {
            // Initialize hidden fields with current state
            function updateHiddenFields() {
                var buySample = $('#buy_sample').is(':checked') ? 1 : 0;
                var blankProduct = $('#blank_product').is(':checked') ? 1 : 0;
                
                // Remove existing hidden inputs to avoid duplicates
                $('input[name="buy_sample_option"]').remove();
                $('input[name="blank_product_option"]').remove();
                
                // Store options for add to cart
                $('form.cart').append('<input type="hidden" name="buy_sample_option" value="' + buySample + '">');
                $('form.cart').append('<input type="hidden" name="blank_product_option" value="' + blankProduct + '">');
            }
            
            // Initialize on page load
            updateHiddenFields();
            
            // Handle product options change
            $('#buy_sample, #blank_product').on('change', updateHiddenFields);
        });
        </script>
        <?php
        return ob_get_clean();
    }

    /**
     * Add product options to cart item data
     *
     * @param array $cart_item_data
     * @param int $product_id
     * @param int $variation_id
     * @return array
     */
    public function add_product_options_to_cart($cart_item_data, $product_id, $variation_id)
    {
        if (isset($_POST['buy_sample_option']) && $_POST['buy_sample_option'] == '1') {
            $cart_item_data['buy_sample'] = '1';
        }

        if (isset($_POST['blank_product_option']) && $_POST['blank_product_option'] == '1') {
            $cart_item_data['blank_product'] = '1';
        }

        return $cart_item_data;
    }

    /**
     * Display product options in cart
     *
     * @param array $item_data
     * @param array $cart_item
     * @return array
     */
    public function display_product_options_in_cart($item_data, $cart_item)
    {
        if (isset($cart_item['buy_sample']) && $cart_item['buy_sample'] == '1') {
            $item_data[] = array(
                'key'   => __('Buy Sample', 'pw-admin'),
                'value' => __('Yes', 'pw-admin'),
                'display' => ''
            );
        }

        if (isset($cart_item['blank_product']) && $cart_item['blank_product'] == '1') {
            $item_data[] = array(
                'key'   => __('Blank Product', 'pw-admin'),
                'value' => __('Yes', 'pw-admin'),
                'display' => ''
            );
        }

        return $item_data;
    }

    /**
     * Save product options to order
     *
     * @param WC_Order_Item_Product $item
     * @param string $cart_item_key
     * @param array $values
     * @param WC_Order $order
     */
    public function save_product_options_to_order($item, $cart_item_key, $values, $order)
    {
        if (isset($values['buy_sample']) && $values['buy_sample'] == '1') {
            $item->add_meta_data(__('Buy Sample', 'pw-admin'), __('Yes', 'pw-admin'));
        }

        if (isset($values['blank_product']) && $values['blank_product'] == '1') {
            $item->add_meta_data(__('Blank Product', 'pw-admin'), __('Yes', 'pw-admin'));
        }
    }
}