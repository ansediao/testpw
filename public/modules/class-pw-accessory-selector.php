<?php
/**
 * Accessory Selector Module
 * 
 * @package    Pw_Admin
 * @subpackage Pw_Admin/public/modules
 * @author     PW <pw@pwcom>
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class Pw_Accessory_Selector {

    /**
     * Initialize hooks
     */
    public function __construct() {
        add_action('pw_admin_single_product_custom_content', array($this, 'display_accessory_selector'), 40);
    }

    /**
     * Display accessory selector
     */
    public function display_accessory_selector() {
        if (!is_super_admin()) {
            return;
        }

        global $product;
        if (!is_a($product, 'WC_Product')) {
            return;
        }

        $product_id = $product->get_id();
        $pw_isSyncProduct = get_post_meta($product_id, 'pw_isSyncProduct', true);
        
        if ($pw_isSyncProduct !== '1') {
            return;
        }

        $api = new Pw_Admin_Promowares_Api();
        $api_response = $api->get_product_by_woo_id($product_id);

        if (is_wp_error($api_response) || !isset($api_response['data']['accessories']) || !is_array($api_response['data']['accessories']) || empty($api_response['data']['accessories'])) {
            return;
        }

        $main_product_image = get_post_meta($product_id, 'pw_mainIMG_color', true);
        if (empty($main_product_image)) {
            $main_product_image = wp_get_attachment_image_url(get_post_thumbnail_id($product_id), 'thumbnail');
        }
        ?>
        
        <div id="pw-accessories-container" class="pw-accessories-data">
            <div class="dropdown-wrapper">
                <label for="accessory-dropdown">额外组件:</label>
                <div class="dropdown-container">
                    <button id="accessory-dropdown-button">
                        <span>选择一个配件</span>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </button>
                    <div id="accessory-list" class="hidden">
                        <?php foreach ($api_response['data']['accessories'] as $index => $accessory): 
                            $accessory_image = !empty($accessory['product_image']) ? $accessory['product_image'] : $main_product_image;
                        ?>
                            <div class="product-item" data-id="<?php echo esc_attr($index); ?>">
                                <img src="<?php echo esc_url($accessory_image); ?>" alt="<?php echo esc_attr($accessory['name']); ?>" class="product-image">
                                <div class="info">
                                    <p class="name"><?php echo esc_html($accessory['name']); ?></p>
                                    <p class="price">
                                        <?php if ($accessory['anchor_price'] > 0 && $accessory['anchor_price'] > $accessory['price']): ?>
                                            <span style="text-decoration: line-through; color: #999; font-size: 12px;">$<?php echo number_format($accessory['anchor_price'], 2); ?></span>
                                        <?php endif; ?>
                                        $<?php echo number_format($accessory['price'], 2); ?>
                                    </p>
                                    <?php if (!empty($accessory['sku'])): ?>
                                        <p class="sku">SKU: <?php echo esc_html($accessory['sku']); ?></p>
                                    <?php endif; ?>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>
            <div id="selected-accessories-container">
                <!-- 已选择的配件将通过JS动态插入这里 -->
            </div>
        </div>
        
        <div id="accessory-image-preview-container"></div>

     

        <script>
        document.addEventListener('DOMContentLoaded', function () {
            const apiResponse = <?php echo wp_json_encode($api_response['data']['accessories']); ?>;
            const accessories = Array.isArray(apiResponse) ? apiResponse : Object.values(apiResponse);
            
            const dropdownButton = document.getElementById('accessory-dropdown-button');
            const accessoryList = document.getElementById('accessory-list');
            const selectedAccessoriesContainer = document.getElementById('selected-accessories-container');
            const imagePreviewContainer = document.getElementById('accessory-image-preview-container');
            let selectedAccessoryIds = new Set();

            // Dropdown toggle
            dropdownButton.addEventListener('click', function (e) {
                e.stopPropagation();
                accessoryList.classList.toggle('hidden');
                dropdownButton.classList.toggle('open');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', function () {
                if (!accessoryList.classList.contains('hidden')) {
                    accessoryList.classList.add('hidden');
                    dropdownButton.classList.remove('open');
                }
            });

            // Image preview functionality
            accessoryList.addEventListener('mouseover', function(e) {
                const targetImage = e.target.closest('.product-image');
                if (targetImage) {
                    const largeImage = document.createElement('img');
                    largeImage.src = targetImage.src;
                    imagePreviewContainer.innerHTML = '';
                    imagePreviewContainer.appendChild(largeImage);
                    imagePreviewContainer.style.display = 'block';
                }
            });

            accessoryList.addEventListener('mousemove', function(e) {
                if (imagePreviewContainer.style.display === 'block') {
                    imagePreviewContainer.style.left = (e.pageX + 20) + 'px';
                    imagePreviewContainer.style.top = (e.pageY + 20) + 'px';
                }
            });

            accessoryList.addEventListener('mouseout', function(e) {
                const relatedTarget = e.relatedTarget;
                if (!relatedTarget || !relatedTarget.closest('#accessory-image-preview-container')) {
                    imagePreviewContainer.style.display = 'none';
                }
            });

            // Select accessory
            accessoryList.addEventListener('click', function (e) {
                const selectedItem = e.target.closest('.product-item');
                if (selectedItem) {
                    const accessoryId = parseInt(selectedItem.dataset.id, 10);
                    if (selectedAccessoryIds.has(accessoryId)) {
                        showCustomAlert('该配件已添加！');
                        return;
                    }

                    const accessory = accessories[accessoryId];
                    if (accessory) {
                        addAccessoryToQueue(accessory, accessoryId);
                        selectedAccessoryIds.add(accessoryId);
                    }
                    accessoryList.classList.add('hidden');
                    dropdownButton.classList.remove('open');
                }
            });

            // Add accessory to selected area
            function addAccessoryToQueue(accessory, accessoryId) {
                const mainProductImage = '<?php echo esc_js($main_product_image); ?>';
                const accessoryImage = accessory.product_image || mainProductImage;
                
                const itemWrapper = document.createElement('div');
                itemWrapper.className = 'selected-accessory-item';
                itemWrapper.dataset.id = accessoryId;
                
                let priceHtml = '';
                if (accessory.anchor_price > 0 && accessory.anchor_price > accessory.price) {
                    priceHtml = '<span style="text-decoration: line-through; color: #999; font-size: 12px;">$' + accessory.anchor_price.toFixed(2) + '</span> ';
                }
                priceHtml += '$' + accessory.price.toFixed(2);
                
                itemWrapper.innerHTML = `
                    <img src="${accessoryImage}" alt="${accessory.name}">
                    <div class="info">
                        <p class="name">${accessory.name}</p>
                        <p class="price">${priceHtml}</p>
                    </div>
                    <button class="remove-btn">&times;</button>
                `;
                selectedAccessoriesContainer.appendChild(itemWrapper);
            }

            // Remove accessory
            selectedAccessoriesContainer.addEventListener('click', function (e) {
                if (e.target.classList.contains('remove-btn')) {
                    const itemToRemove = e.target.closest('[data-id]');
                    if (itemToRemove) {
                        const accessoryId = parseInt(itemToRemove.dataset.id, 10);
                        selectedAccessoryIds.delete(accessoryId);
                        itemToRemove.remove();
                    }
                }
            });

            // Custom alert function
            function showCustomAlert(message) {
                let alertBox = document.querySelector('.custom-alert');
                if (alertBox) {
                    alertBox.remove();
                }
                alertBox = document.createElement('div');
                alertBox.textContent = message;
                alertBox.className = 'custom-alert';
                document.body.appendChild(alertBox);
                setTimeout(() => {
                    alertBox.remove();
                }, 3000);
            }
        });
        </script>

        <?php
    }
}