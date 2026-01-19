<!-- 设计内容 (隐藏) -->
<div id="content-sheji" class="content-pane">
    

    <div class="search-filter-container">
        <!-- 快速搜索输入框 -->
        <div class="quick-search-row">
            <div class="search-input-wrapper">
                <svg class="search-icon" viewBox="0 0 24 24" width="20" height="20">
                    <path fill="#9ca3af" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
                <input type="text" class="search" placeholder="Search Design Folders" id="quick-search-input">
            </div>
            <button id="filter-toggle-btn" class="filter-toggle-btn">
                <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="white" d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
                </svg>
                Filter
            </button>
        </div>

        <!-- 高级搜索行 (默认隐藏) -->
        <div class="advanced-search-row" id="advanced-search-row">
            <div class="advanced-search-field">
                <label>Folder</label>
                <select id="filter-operator" class="filter-operator">
                    <option value="is">is</option>
                    <option value="isnot">is not</option>
                    <option value="contains">contains</option>
                    <option value="notcontains">not contains</option>
                </select>
                <input type="text" id="advanced-search-input" class="advanced-search-input" placeholder="">
            </div>
        </div>
    </div>

    

    <hr>
    <?php
    // 获取所有自定义分类数据
    $categories = get_terms(array(
        'taxonomy'   => 'pw_design_category',
        'hide_empty' => false,
    ));

    if (!is_wp_error($categories) && !empty($categories)) {
        echo '<div id="design-categories-list" class="content-sheji">';
        echo '<div class="list">';
        foreach ($categories as $category) {
            echo '<div class="category-item">';
            echo '<div class="category-item-header">';
            // 统一显示图片在标题上面
            echo '<div class="category_name name">' . '<img src="' . MY_PLUGIN_URL . 'assets/images/icons/design.svg" alt="Designs ICON">' . esc_html($category->name) . '</div>';
            echo '<button class="back-button" >Back to Design Folders</button>';
            echo '</div>';
            echo '<div class="designs-grid">';
            $designs = get_posts(array(
                'post_type'      => 'pw_design',
                'posts_per_page' => -1,
                'tax_query'      => array(
                    array(
                        'taxonomy' => 'pw_design_category',
                        'field'    => 'term_id',
                        'terms'    => $category->term_id,
                    ),
                ),
            ));

            if (!empty($designs)) {
                foreach ($designs as $design) {
                    echo '<div class="design-item">';
                    if (has_post_thumbnail($design->ID)) {
                        echo '<img src="' . get_the_post_thumbnail_url($design->ID, 'thumbnail') . '" alt="' . esc_attr($design->post_title) . '" class="pwca-design-thumbnail" data-design-id="' . esc_attr($design->ID) . '">';
                    }
                    echo '</div>';
                }
            }
            echo '</div>';
            echo '</div>';
        }
        echo '</div>';
        echo '</div>';
    }
    ?>
</div>