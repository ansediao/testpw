<?php
$selected_category = isset($_GET['category']) ? sanitize_text_field($_GET['category']) : '';
$search_query      = isset( $_GET['s'] ) ? sanitize_text_field( $_GET['s'] ) : '';
$selected_tab      = isset( $_GET['tab'] ) ? sanitize_text_field( $_GET['tab'] ) : 'all';
?>
<div class="wrap">
    <h1>Home Page for Design</h1>

    <div class="pw-design-controls">
        <div class="pw-design-actions">
            <button class="button button-primary" id="pw-add-design-btn">Add Design</button>
            <button class="button" id="pw-add-category-btn">Add Category</button>
            <button class="button" id="pw-manage-category-btn">Manage Category</button>
        </div>
       
        <div class="pw-design-filters" style="    display: flex
;
    gap: 10px;
    align-items: center;" >
            <form method="GET" action="">
                <input type="hidden" name="page" value="<?php echo esc_attr( $_REQUEST['page'] ); ?>">
                <input type="text" name="s" value="<?php echo esc_attr( $search_query ); ?>" placeholder="Search Designs">
                <button type="submit" class="button">Search</button>
            </form>
            <form method="GET" action="">
                <input type="hidden" name="page" value="<?php echo esc_attr( $_REQUEST['page'] ); ?>">
                <select name="category" onchange="this.form.submit()">
                    <option value="">Select a Category</option>
                    <?php
                    $categories = get_terms( array(
                        'taxonomy'   => 'pw_design_category',
                        'hide_empty' => false,
                    ) );
                    foreach ( $categories as $category ) {
                        printf(
                            '<option value="%s"%s>%s</option>',
                            esc_attr( $category->slug ),
                            selected( $selected_category, $category->slug, false ),
                            esc_html( $category->name )
                        );
                    }
                    ?>
                </select>
                <noscript><button type="submit" class="button">Filter</button></noscript>
            </form>
            <span class="dashicons dashicons-info"></span>
        </div>
    </div>

    <div class="pw-design-tabs">
        <a href="?page=<?php echo esc_attr($_REQUEST['page']); ?>&tab=all" class="nav-tab <?php echo ($selected_tab == 'all' || empty($selected_tab)) ? 'nav-tab-active' : ''; ?>">All</a>
        <a href="?page=<?php echo esc_attr($_REQUEST['page']); ?>&tab=universal" class="nav-tab <?php echo ($selected_tab == 'universal') ? 'nav-tab-active' : ''; ?>">Universal</a>
        <a href="?page=<?php echo esc_attr($_REQUEST['page']); ?>&tab=universal-main-view" class="nav-tab <?php echo ($selected_tab == 'universal-main-view') ? 'nav-tab-active' : ''; ?>">Universal for Main View</a>
        <a href="?page=<?php echo esc_attr($_REQUEST['page']); ?>&tab=product-specific" class="nav-tab <?php echo ($selected_tab == 'product-specific') ? 'nav-tab-active' : ''; ?>">Product Specific</a>
    </div>
                    <br><br><br>
    <div class="pw-design-bulk-actions">
        <button class="button" id="pw-open-filter-modal">Filter</button>
        <label><input type="checkbox" id="pw-select-all-designs"> Select All</label>
        <button id="pw-delete-selected-designs" class="button button-danger" style="display:none;">Delete Selected</button>
        <button id="pw-bulk-update-designs" class="button button-primary" style="display:none;">Bulk Update</button>
    </div>

    <div class="pw-design-grid">
        <?php
        $args = array(
            'post_type'      => 'pw_design',
            'posts_per_page' => -1, // Retrieve all posts
            'post_status'    => array('publish'), // Include all statuses
        );

        if ( ! empty( $search_query ) ) {
            $args['s'] = $search_query;
        }
        
        if ( ! empty( $selected_category ) ) {
            $args['tax_query'] = array(
                array(
                    'taxonomy' => 'pw_design_category',
                    'field'    => 'slug',
                    'terms'    => $selected_category,
                ),
            );
        }
        
        // 根据标签筛选设计
        if ( ! empty( $selected_tab ) && $selected_tab !== 'all' ) {
            $tag_slug = '';
            switch ( $selected_tab ) {
                case 'universal':
                    $tag_slug = 'universal';
                    break;
                case 'universal-main-view':
                    $tag_slug = 'universal-main-view';
                    break;
                case 'product-specific':
                    $tag_slug = 'product-specific';
                    break;
            }
            
            if ( ! empty( $tag_slug ) ) {
                // 添加标签查询条件
                if ( ! isset( $args['tax_query'] ) ) {
                    $args['tax_query'] = array();
                }
                
                // 如果已经有分类查询条件，则使用AND关系
                if ( ! empty( $args['tax_query'] ) && !isset($args['tax_query']['relation']) ) {
                    $args['tax_query']['relation'] = 'AND';
                }
                
                $args['tax_query'][] = array(
                    'taxonomy' => 'pw_design_tag',
                    'field'    => 'slug',
                    'terms'    => $tag_slug,
                );
            }
        }
        
        $designs_query = new WP_Query( $args );

        if ( $designs_query->have_posts() ) :
            while ( $designs_query->have_posts() ) : $designs_query->the_post();
                $design_id = get_the_ID();
                $design_title = get_the_title();
                $design_thumbnail = get_the_post_thumbnail( $design_id, 'medium', array( 'class' => 'pw-design-thumbnail-img' ) );
                $edit_link = get_edit_post_link( $design_id );
                $delete_link = get_delete_post_link( $design_id, true ); // Pass true to get link, not display it.
                $design_categories = get_the_terms( $design_id, 'pw_design_category' );
                $design_tags = get_the_terms( $design_id, 'pw_design_tag' );
        ?>
                <div class="pw-design-card" data-design-id="<?php echo esc_attr( $design_id ); ?>">
                    <input type="checkbox" class="pw-design-checkbox" value="<?php echo esc_attr( $design_id ); ?>">
                    <div class="pw-design-thumbnail">
                        <?php if ( $design_thumbnail ) : ?>
                            <?php echo $design_thumbnail; ?>
                        <?php else : ?>
                            Thumbnail Design
                        <?php endif; ?>
                    </div>
                    <div class="pw-design-name"><?php echo esc_html( $design_title ); ?></div>
                    <button class="button pw-add-tag-button" data-design-id="<?php echo esc_attr( $design_id ); ?>">Add Tag</button>
                    <div class="pw-design-tags" data-design-id="<?php echo esc_attr( $design_id ); ?>">
                        <?php
                        $design_tags = wp_get_post_terms( $design_id, 'pw_design_tag', array( 'fields' => 'names' ) );
                        if ( !empty( $design_tags ) && !is_wp_error( $design_tags ) ) {
                            echo '<span class="pw-tags-label">Tags: </span>' . esc_html( implode( ' ', $design_tags ) );
                        }
                        ?>
                    </div>
                    <div class="pw-design-actions-bottom">
                        <a href="<?php echo esc_url( $edit_link ); ?>" title="Edit Design"><span class="dashicons dashicons-edit"></span></a>
                        <a href="<?php echo esc_url( $delete_link ); ?>" title="Delete Design" class="pw-delete-design-link"><span class="dashicons dashicons-trash"></span></a>
                    </div>
                </div>
            <?php
            endwhile;
            wp_reset_postdata(); // Restore original Post Data
        else :
            ?>
            <p>No designs found.</p>
        <?php endif; ?>
    </div>

    <style>
        .pw-design-controls,
        .pw-design-filters,
        .pw-design-actions,
        .pw-design-tabs,
        .pw-design-bulk-actions,
        .pw-design-grid {
            margin-bottom: 20px;
        }

        .pw-design-actions a,
        .pw-design-filters button,
        .pw-design-bulk-actions button {
            margin-right: 10px;
        }

        .pw-design-filters input,
        .pw-design-filters select {
            margin-right: 10px;
            padding: 5px 8px;
            border: 1px solid #c3c4c7;
            box-shadow: 0 1px 1px rgba(0,0,0,.04);
            border-radius: 4px;
        }

        .pw-design-filters .dashicons {
            font-size: 20px;
            line-height: 30px;
            vertical-align: middle;
            color: #888;
        }

        .pw-design-tabs .nav-tab {
            margin-right: 5px;
        }

        .pw-design-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 20px;
        }

        .pw-design-card {
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 15px;
            text-align: center;
            background-color: #fff;
            box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }

        .pw-design-thumbnail {
            width: 100%;
            height: 150px;
            background-color: #f0f0f0;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 10px;
            border: 1px dashed #ccc;
            font-style: italic;
            color: #888;
            overflow: hidden; /* Ensure image doesn't overflow */
        }
        .pw-design-thumbnail img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain; /* Scale image down to fit container */
        }

        .pw-design-name {
            font-weight: bold;
            margin-bottom: 10px;
        }

        .pw-design-actions-bottom {
            margin-top: 15px;
            display: flex;
            justify-content: center;
            gap: 15px;
        }

        .pw-design-actions-bottom .dashicons {
            font-size: 20px;
            cursor: pointer;
            color: #555;
        }
        .pw-design-actions-bottom .dashicons:hover {
            color: #0073aa;
        }
        
        .pw-design-tags {
            margin: 5px 0;
            font-size: 12px;
            color: #666;
            min-height: 16px;
        }
        
        .pw-tags-label {
            font-weight: bold;
            color: #333;
        }
    </style>
</div>

<!-- Filter Modal -->
<div class="modal" id="pw-filter-modal" aria-hidden="true">
    <div class="modal__overlay" tabindex="-1" data-micromodal-close>
        <div class="modal__container" role="dialog" aria-modal="true" aria-labelledby="pw-filter-modal-title">
            <header class="modal__header">
                <h2 class="modal__title" id="pw-filter-modal-title">筛选条件</h2>
                <button class="modal__close" aria-label="Close modal" data-micromodal-close>&times;</button>
            </header>
            <div class="modal__content">
        <div class="pw-filter-search-field">
            <span class="dashicons dashicons-search"></span>
            <input type="text" id="pw-filter-name-search" placeholder="Name">
            <span class="dashicons dashicons-no-alt"></span>
        </div>

        <div class="pw-filter-section">
            <h5 class="pw-filter-toggle">Selected Filter Field</h5>
            <div class="pw-filter-options">
                <label><input type="checkbox" name="filter_field" value="product_name" checked> Product Name</label>
                <div class="pw-filter-condition">
                    <select name="product_name_condition">
                        <option value="contains">contains</option>
                        <option value="not_contains">does not contain</option>
                    </select>
                    <input type="text" name="product_name_value" placeholder="t-shirt">
                </div>
            </div>
        </div>

        <div class="pw-filter-section">
            <h5 class="pw-filter-toggle">Not Selected Filter Field</h5>
            <div class="pw-filter-options" style="display:none;">
                <label><input type="checkbox" name="filter_field" value="category_name"> Category Name</label>
                 <div class="pw-filter-condition" style="display:none;">
                    <select name="category_name_condition">
                        <option value="is">is</option>
                        <option value="is_not">is not</option>
                    </select>
                     <select name="category_name_value">
                        <option value="">Select Category</option>
                        <?php
                        if ( ! empty( $categories ) ) {
                            foreach ( $categories as $category ) {
                                printf( '<option value="%s">%s</option>', esc_attr( $category->slug ), esc_html( $category->name ) );
                            }
                        }
                        ?>
                    </select>
                </div>
            </div>
        </div>

            </div>
            <footer class="modal__footer">
                <button class="button" id="pw-filter-clear">Clear</button>
                <button class="button button-primary" id="pw-filter-confirm">Confirm</button>
            </footer>
        </div>
    </div>
</div>
<style>
.pw-modal-content h4, .pw-modal-content h5 {
    margin-top: 0;
    margin-bottom: 10px;
}
.pw-filter-search-field {
    position: relative;
    margin-bottom: 15px;
}
.pw-filter-search-field .dashicons {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    color: #888;
}
.pw-filter-search-field .dashicons-search {
    left: 8px;
}
.pw-filter-search-field .dashicons-no-alt {
    right: 8px;
    cursor: pointer;
}
.pw-filter-search-field input {
    width: 100%;
    padding-left: 30px;
    padding-right: 30px;
}
.pw-filter-section {
    margin-bottom: 15px;
}
.pw-filter-toggle {
    cursor: pointer;
    user-select: none;
}
.pw-filter-toggle::before {
    content: '▼';
    display: inline-block;
    margin-right: 5px;
    transition: transform 0.2s;
}
.pw-filter-toggle.collapsed::before {
    transform: rotate(-90deg);
}
.pw-filter-options {
    padding-left: 15px;
    border-left: 1px solid #ddd;
    margin-top: 10px;
}
.pw-filter-condition {
    margin-top: 5px;
    padding-left: 20px;
}
.pw-filter-condition select, .pw-filter-condition input {
    width: 100%;
    margin-top: 5px;
}
</style>

<!-- Tag Modal -->
<div class="modal" id="pw-tag-modal" aria-hidden="true">
    <div class="modal__overlay" tabindex="-1" data-micromodal-close>
        <div class="modal__container" role="dialog" aria-modal="true" aria-labelledby="pw-tag-modal-title">
            <header class="modal__header">
                <h2 class="modal__title" id="pw-tag-modal-title">Manage Tags</h2>
                <button class="modal__close" aria-label="Close modal" data-micromodal-close>&times;</button>
            </header>
            <div class="modal__content">
                <div id="pw-tag-modal-body" style="max-height: 300px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; margin-bottom: 20px;">
                    <!-- Tags will be loaded here -->
                </div>
                <input type="hidden" id="pw-tag-modal-design-id" value="">
            </div>
            <footer class="modal__footer">
                <button class="button" data-micromodal-close>Close</button>
                <button class="button button-primary" id="pw-tag-modal-save">Save Changes</button>
            </footer>
        </div>
    </div>
</div>

<!-- Add Design Modal -->
<div class="modal" id="pw-add-design-modal" aria-hidden="true">
    <div class="modal__overlay" tabindex="-1">
        <div class="modal__container" role="dialog" aria-modal="true" aria-labelledby="pw-add-design-modal-title">
            <header class="modal__header">
                <h2 class="modal__title" id="pw-add-design-modal-title">Add New Design</h2>
                <button class="modal__close" aria-label="Close modal" data-micromodal-close>&times;</button>
            </header>
            <div class="modal__content">
                <form id="pw-add-design-form" enctype="multipart/form-data">
                    <?php wp_nonce_field('pw_add_design_nonce', 'pw_add_design_nonce_field'); ?>
                    
                    <!-- 图片上传区域 -->
                    <div class="pw-form-field" style="margin-bottom:25px;">
                        <label style="display:block; margin-bottom:8px; font-weight:600; color:#333;">设计图片</label>
                        <label for="pw-design-image" style="border:2px dashed #ccc; border-radius:8px; padding:40px; text-align:center; background:#fafafa; cursor:pointer; transition:all 0.3s ease; display:block;" onmouseover="this.style.borderColor='#0073aa'; this.style.background='#f0f8ff';" onmouseout="this.style.borderColor='#ccc'; this.style.background='#fafafa';">
                            <div id="pw-upload-placeholder">
                                <span class="dashicons dashicons-cloud-upload" style="font-size:48px; color:#999; display:block; margin-bottom:15px;"></span>
                                <p style="margin:0; color:#666; font-size:16px;">Click or drag image here to upload</p>
                                <p style="margin:5px 0 0; color:#999; font-size:14px;">Supports JPG, PNG, GIF formats</p>
                            </div>
                            <div id="pw-image-preview" style="display:none;">
                                <img id="pw-preview-img" style="max-width:100%; max-height:200px; border-radius:4px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                                <p style="margin:10px 0 0; color:#666;"><span id="pw-file-name"></span></p>
                                <button type="button" id="pw-remove-image" class="button" style="margin-top:10px;">移除图片</button>
                            </div>
                        </label>
                        <input type="file" id="pw-design-image" name="design_image" accept="image/*" style="display:none;" onchange="console.log('File selected:', this.files);">
                    </div>
                    </div>
                    
                    <!-- 名称字段 -->
                    <div class="pw-form-field" style="margin-bottom:25px;">
                        <label for="pw-design-name" style="display:block; margin-bottom:8px; font-weight:600; color:#333;">Design Name</label>
                        <input type="text" id="pw-design-name" name="design_name" required style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px; font-size:14px;">
                    </div>
                    
                    <!-- 分类选择 -->
                    <div class="pw-form-field" style="margin-bottom:30px;">
                        <label for="pw-design-category" style="display:block; margin-bottom:8px; font-weight:600; color:#333;">Design Category</label>
                        <select id="pw-design-category" name="design_category" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px; font-size:14px;">
                            <option value="">选择分类</option>
                            <?php
                            $categories = get_terms( array(
                                'taxonomy'   => 'pw_design_category',
                                'hide_empty' => false,
                            ) );
                            if ( ! empty( $categories ) && ! is_wp_error( $categories ) ) {
                                foreach ( $categories as $category ) {
                                    printf(
                                        '<option value="%s">%s</option>',
                                        esc_attr( $category->term_id ),
                                        esc_html( $category->name )
                                    );
                                }
                            }
                            ?>
                        </select>
                    </div>
                </form>
            </div>
            <footer class="modal__footer">
                <button class="button" data-micromodal-close>取消</button>
                <button type="submit" class="button button-primary" id="pw-add-design-submit" form="pw-add-design-form">Add Design</button>
            </footer>
        </div>
    </div>
</div>

<!-- Bulk Update Modal -->
<div class="modal" id="pw-bulk-update-modal" aria-hidden="true">
    <div class="modal__overlay" tabindex="-1">
        <div class="modal__container" role="dialog" aria-modal="true" aria-labelledby="pw-bulk-update-modal-title" style="max-width: 800px;">
            <header class="modal__header">
                <h2 class="modal__title" id="pw-bulk-update-modal-title">Bulk Update Designs</h2>
                <button class="modal__close" aria-label="Close modal" data-micromodal-close>&times;</button>
            </header>
            <div class="modal__content">
                <form id="pw-bulk-update-form">
                    <?php wp_nonce_field('pw_bulk_update_nonce', 'pw_bulk_update_nonce_field'); ?>
                    
                    <div class="pw-bulk-update-info" style="margin-bottom: 20px; padding: 15px; background: #f0f8ff; border: 1px solid #0073aa; border-radius: 4px;">
                        <p style="margin: 0; color: #0073aa; font-weight: 600;">Selected Designs: <span id="pw-selected-count">0</span></p>
                        <p style="margin: 5px 0 0; color: #666; font-size: 14px;">Changes will be applied to all selected designs. Leave fields empty to keep current values.</p>
                    </div>
                    
                    <div class="pw-bulk-update-table" style="overflow-x: auto;">
                        <table class="wp-list-table widefat fixed striped" style="width: 100%;">
                            <thead>
                                <tr>
                                    <th style="width: 200px;">Field</th>
                                    <th>New Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>Description</strong></td>
                                    <td>
                                        <textarea name="bulk_description" id="pw-bulk-description" rows="3" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" placeholder="Enter new description for selected designs"></textarea>
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>Category</strong></td>
                                    <td>
                                        <select name="bulk_category" id="pw-bulk-category" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                            <option value="">Select Category</option>
                                            <?php
                                            $categories = get_terms( array(
                                                'taxonomy'   => 'pw_design_category',
                                                'hide_empty' => false,
                                            ) );
                                            if ( ! empty( $categories ) && ! is_wp_error( $categories ) ) {
                                                foreach ( $categories as $category ) {
                                                    printf(
                                                        '<option value="%s">%s</option>',
                                                        esc_attr( $category->term_id ),
                                                        esc_html( $category->name )
                                                    );
                                                }
                                            }
                                            ?>
                                        </select>
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>Tags</strong></td>
                                    <td>
                                        <div style="max-height: 150px; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px; padding: 10px; background: #fff;">
                                            <?php
                                            $tags = get_terms( array(
                                                'taxonomy' => 'pw_design_tag',
                                                'hide_empty' => false,
                                                'orderby' => 'name',
                                                'order' => 'ASC'
                                            ) );
                                            if ( ! empty( $tags ) && ! is_wp_error( $tags ) ) {
                                                foreach ( $tags as $tag ) {
                                                    printf(
                                                        '<label style="display: block; margin-bottom: 5px; cursor: pointer;"><input type="checkbox" name="bulk_tags[]" value="%s" style="margin-right: 8px;"> %s</label>',
                                                        esc_attr( $tag->name ),
                                                        esc_html( $tag->name )
                                                    );
                                                }
                                            } else {
                                                echo '<p style="color: #666; font-style: italic;">No tags available</p>';
                                            }
                                            ?>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <input type="hidden" name="selected_design_ids" id="pw-selected-design-ids" value="">
                </form>
            </div>
            <footer class="modal__footer">
                <button class="button" data-micromodal-close>Cancel</button>
                <button type="submit" class="button button-primary" id="pw-bulk-update-submit" form="pw-bulk-update-form">Update Selected Designs</button>
            </footer>
        </div>
    </div>
</div>

<!-- Add Category Modal -->
<div class="modal" id="pw-add-category-modal" aria-hidden="true">
    <div class="modal__overlay" tabindex="-1" data-micromodal-close>
        <div class="modal__container" role="dialog" aria-modal="true" aria-labelledby="pw-add-category-modal-title">
            <header class="modal__header">
                <h2 class="modal__title" id="pw-add-category-modal-title">Add New Category</h2>
                <button class="modal__close" aria-label="Close modal" data-micromodal-close>&times;</button>
            </header>
            <div class="modal__content">
                <form id="pw-add-category-form">
                    <?php wp_nonce_field('pw_add_category_nonce', 'pw_add_category_nonce_field'); ?>
                    
                    <!-- 分类名称字段 -->
                    <div class="pw-form-field" style="margin-bottom:25px;">
                        <label for="pw-category-name" style="display:block; margin-bottom:8px; font-weight:600; color:#333;">Category Name</label>
                        <input type="text" id="pw-category-name" name="category_name" required style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px; font-size:14px;" placeholder="Enter category name">
                    </div>
                    
                    <!-- 分类类型选择 -->
                    <div class="pw-form-field" style="margin-bottom:30px;">
                        <label for="pw-category-type" style="display:block; margin-bottom:8px; font-weight:600; color:#333;">Category Type</label>
                        <select id="pw-category-type" name="category_type" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px; font-size:14px;">
                            <option value="general">General</option>
                            <option value="product">Product</option>
                            <option value="style">Style</option>
                        </select>
                    </div>
                </form>
            </div>
            <footer class="modal__footer">
                <button class="button" data-micromodal-close>取消</button>
                <button type="submit" class="button button-primary" id="pw-add-category-submit" form="pw-add-category-form">Add Category</button>
            </footer>
        </div>
    </div>
</div>

<!-- Manage Category Modal -->
<div class="modal" id="pw-manage-category-modal" aria-hidden="true">
    <div class="modal__overlay" tabindex="-1" data-micromodal-close>
        <div class="modal__container" role="dialog" aria-modal="true" aria-labelledby="pw-manage-category-modal-title" style="max-width: 600px; max-height: 80vh;">
            <header class="modal__header" style="border-bottom:1px solid #eee; background:#f8f9fa; margin-bottom:0; padding:20px 30px;">
                <h2 class="modal__title" id="pw-manage-category-modal-title" style="margin:0; color:#333; display:flex; align-items:center;">
                    <span class="dashicons dashicons-category" style="margin-right:10px; color:#0073aa;"></span>
                    Manage Category
                </h2>
                <button class="modal__close" aria-label="Close modal" data-micromodal-close>&times;</button>
            </header>
            <div class="modal__content" style="max-height:60vh; overflow-y:auto; padding:20px 30px;">
            <div class="pw-category-list">
                <?php
                $categories = get_terms(array(
                    'taxonomy' => 'pw_design_category',
                    'hide_empty' => false,
                ));
                
                if (!empty($categories) && !is_wp_error($categories)) :
                ?>
                <div class="pw-category-items">
                    <?php foreach ($categories as $category) : 
                        // 获取该分类下的设计数量
                        $design_count = wp_count_posts('pw_design');
                        $category_design_count = get_posts(array(
                            'post_type' => 'pw_design',
                            'post_status' => 'publish',
                            'numberposts' => -1,
                            'tax_query' => array(
                                array(
                                    'taxonomy' => 'pw_design_category',
                                    'field' => 'term_id',
                                    'terms' => $category->term_id
                                )
                            ),
                            'fields' => 'ids'
                        ));
                        $count = count($category_design_count);
                    ?>
                    <div class="pw-category-item" data-category-id="<?php echo esc_attr($category->term_id); ?>" style="display:flex; align-items:center; padding:12px 15px; border:1px solid #ddd; border-radius:4px; margin-bottom:10px; background:#fff;">
                        <input type="text" class="pw-category-name-input" value="<?php echo esc_attr($category->name); ?>" style="flex:1; padding:8px 12px; border:1px solid #ddd; border-radius:4px; margin-right:10px; font-size:14px;" maxlength="60">
                        <span class="pw-category-char-count" style="margin-right:10px; color:#666; font-size:12px;">(<?php echo strlen($category->name); ?>)</span>
                        <span class="pw-category-design-count" style="margin-right:10px; color:#0073aa; font-size:12px; font-weight:600;"><?php echo $count; ?> designs</span>
                        <button type="button" class="pw-category-settings-btn" data-category-id="<?php echo esc_attr($category->term_id); ?>" style="background:none; border:none; cursor:pointer; padding:5px; margin-right:5px;" title="Category Settings">
                            <span class="dashicons dashicons-admin-generic" style="color:#0073aa; font-size:16px;"></span>
                        </button>
                        <button type="button" class="pw-category-delete-btn" data-category-id="<?php echo esc_attr($category->term_id); ?>" style="background:none; border:none; cursor:pointer; padding:5px;" title="Delete Category">
                            <span class="dashicons dashicons-trash" style="color:#dc3232; font-size:16px;"></span>
                        </button>
                    </div>
                    <?php endforeach; ?>
                </div>
                <?php else : ?>
                <div class="pw-no-categories" style="text-align:center; padding:40px; color:#666;">
                    <span class="dashicons dashicons-category" style="font-size:48px; margin-bottom:15px; color:#ccc;"></span>
                    <p>No categories found. Create your first category!</p>
                </div>
                <?php endif; ?>
            </div>
            <footer class="modal__footer" style="border-top:1px solid #eee; padding:20px 30px; margin-top:0;">
                <button class="button" data-micromodal-close>Close</button>
            </footer>
        </div>
    </div>
</div>

<!-- Category Settings Modal -->
<div class="modal" id="pw-category-settings-modal" aria-hidden="true">
    <div class="modal__overlay" tabindex="-1" data-micromodal-close>
        <div class="modal__container" role="dialog" aria-modal="true" aria-labelledby="pw-category-settings-modal-title" style="max-width: 500px; max-height: 80vh;">
            <header class="modal__header" style="border-bottom:1px solid #eee; background:#f8f9fa; margin-bottom:0; padding:20px 30px;">
                <h2 class="modal__title" id="pw-category-settings-modal-title" style="margin:0; color:#333;">Category Settings</h2>
                <button class="modal__close" aria-label="Close modal" data-micromodal-close>&times;</button>
            </header>
            <div class="modal__content" style="padding:30px;">
                <form id="pw-category-settings-form">
                    <input type="hidden" id="pw-settings-category-id" name="category_id">
                    
                    <!-- Category Name -->
                    <div class="pw-form-field" style="margin-bottom:25px;">
                        <label for="pw-settings-category-name" style="display:block; margin-bottom:8px; font-weight:600; color:#333;">Category Name</label>
                        <input type="text" id="pw-settings-category-name" name="category_name" required style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px; font-size:14px;">
                    </div>
                
                <!-- Category Type -->
                <div class="pw-form-field" style="margin-bottom:25px;">
                    <label for="pw-settings-category-type" style="display:block; margin-bottom:8px; font-weight:600; color:#333;">Category Type</label>
                    <select id="pw-settings-category-type" name="category_type" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px; font-size:14px;">
                        <option value="general">General</option>
                        <option value="product">Product</option>
                        <option value="style">Style</option>
                    </select>
                </div>
                
                <!-- Tabs -->
                <div class="pw-settings-tabs" style="margin-bottom:25px;">
                    <div class="pw-tab-nav" style="display:flex; border-bottom:1px solid #ddd;">
                        <button type="button" class="pw-tab-btn active" data-tab="initial-state" style="padding:10px 20px; border:none; background:#fff; cursor:pointer; border-bottom:2px solid #0073aa;">Initial State</button>
                        <button type="button" class="pw-tab-btn" data-tab="operation-config" style="padding:10px 20px; border:none; background:#f8f9fa; cursor:pointer; color:#666;">Operation Config</button>
                        <button type="button" class="pw-tab-btn" data-tab="price" style="padding:10px 20px; border:none; background:#f8f9fa; cursor:pointer; color:#666;">Price</button>
                    </div>
                    
                    <div class="pw-tab-content">
                        <!-- Initial State Tab -->
                        <div class="pw-tab-pane active" data-tab="initial-state" style="padding:20px 0;">
                            <div class="pw-form-field" style="margin-bottom:20px;">
                                <label style="display:flex; align-items:center; cursor:pointer;">
                                    <input type="checkbox" id="pw-exclude-from-export" name="exclude_from_export" style="margin-right:10px;">
                                    <span>Exclude From Export</span>
                                </label>
                            </div>
                            
                            <div class="pw-form-field" style="margin-bottom:20px;">
                                <label for="pw-layer-depth" style="display:block; margin-bottom:8px; font-weight:600; color:#333;">Layer Depth</label>
                                <input type="number" id="pw-layer-depth" name="layer_depth" value="-1" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px; font-size:14px;">
                            </div>
                            
                            <div class="pw-form-field" style="margin-bottom:20px;">
                                <label for="pw-scale-mode" style="display:block; margin-bottom:8px; font-weight:600; color:#333;">Scale Mode</label>
                                <select id="pw-scale-mode" name="scale_mode" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px; font-size:14px;">
                                    <option value="fit">Fit</option>
                                    <option value="fill">Fill</option>
                                    <option value="stretch">Stretch</option>
                                    <option value="stretch">Stretch</option>
                                    <option value="center">Center</option>
                                </select>
                            </div>
                        </div>
                        
                        <!-- Operation Config Tab -->
                        <div class="pw-tab-pane" data-tab="operation-config" style="padding:20px 0; display:none;">
                            <p style="color:#666; text-align:center; padding:40px 0;">Operation configuration options will be available here.</p>
                        </div>
                        
                        <!-- Price Tab -->
                        <div class="pw-tab-pane" data-tab="price" style="padding:20px 0; display:none;">
                            <p style="color:#666; text-align:center; padding:40px 0;">Price configuration options will be available here.</p>
                        </div>
                    </div>
                </div>
            </form>
            </div>
            <footer class="modal__footer" style="border-top:1px solid #eee; padding:20px 30px; margin-top:0;">
                <button class="button" data-micromodal-close>取消</button>
                <button type="submit" class="button button-primary" id="pw-settings-save" form="pw-category-settings-form">Save</button>
            </footer>
        </div>
    </div>
</div>

<?php
// 加载Micromodal.js
wp_enqueue_script(
    'micromodal',
    'https://unpkg.com/micromodal/dist/micromodal.min.js',
    array(),
    '0.4.10',
    true
);

// 暂时禁用分类管理脚本，避免与简化脚本冲突
// wp_enqueue_script(
//     'pw-admin-category-management',
//     plugin_dir_url(__FILE__) . '../js/pw-admin-category-management.js',
//     array('jquery'),
//     '1.0.0',
//     true
// );

// 加载简化的模态框处理脚本
wp_enqueue_script(
    'pw-admin-micromodal-simple',
    plugin_dir_url(__FILE__) . '../js/pw-admin-micromodal-simple.js',
    array('jquery', 'micromodal'),
    '1.0.1',
    true
);


// 传递必要的数据给JavaScript
wp_localize_script('pw-admin-category-management', 'pw_admin_vars', array(
    'nonce' => wp_create_nonce('pw_add_category_nonce'),
    'ajaxurl' => admin_url('admin-ajax.php')
));

// 传递设计管理相关数据
wp_localize_script('pw-admin-micromodal-simple', 'pw_design_vars', array(
    'nonce' => wp_create_nonce('pw_add_design_nonce'),
    'ajaxurl' => admin_url('admin-ajax.php')
));

// 传递分类管理相关数据给简化脚本
wp_localize_script('pw-admin-micromodal-simple', 'pw_admin_vars', array(
    'nonce' => wp_create_nonce('pw_add_category_nonce'),
    'ajaxurl' => admin_url('admin-ajax.php')
));

// 传递设计管理相关数据（包括批量操作）
wp_localize_script('pw-admin-micromodal-simple', 'pwDesignManagement', array(
    'ajaxUrl' => admin_url('admin-ajax.php'),
    'deleteNonce' => wp_create_nonce('pw_bulk_delete_designs_nonce'),
    'bulkUpdateNonce' => wp_create_nonce('pw_bulk_update_designs_nonce')
));

// 添加 micromodal 样式
wp_enqueue_style(
    'pw-admin-micromodal',
    plugin_dir_url(__FILE__) . '../css/pw-admin-micromodal.css',
    array(),
    '1.0.0'
);
?>

<script>
// 图片预览处理
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('pw-design-image');
    const previewImg = document.getElementById('pw-preview-img');
    const fileName = document.getElementById('pw-file-name');
    const uploadPlaceholder = document.getElementById('pw-upload-placeholder');
    const imagePreview = document.getElementById('pw-image-preview');
    const removeButton = document.getElementById('pw-remove-image');
    
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            if (this.files && this.files.length > 0) {
                const file = this.files[0];
                const reader = new FileReader();
                reader.onload = function(e) {
                    if (previewImg) previewImg.src = e.target.result;
                    if (fileName) fileName.textContent = file.name;
                    if (uploadPlaceholder) uploadPlaceholder.style.display = 'none';
                    if (imagePreview) imagePreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    if (removeButton) {
        removeButton.addEventListener('click', function() {
            if (fileInput) fileInput.value = '';
            if (uploadPlaceholder) uploadPlaceholder.style.display = 'block';
            if (imagePreview) imagePreview.style.display = 'none';
        });
    }
});
</script>