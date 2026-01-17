<!-- 设计内容 (隐藏) -->
<div id="content-sheji" class="content-pane">
    <!-- List.js CDN -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/list.js/2.3.1/list.min.js"></script>

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
        <div class="advanced-search-row" id="advanced-search-row" style="display: none;">
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

    <style>
        .search-filter-container {
            padding: 16px;
            background: #f8f9fa;
            border-radius: 8px;
            margin-bottom: 16px;
        }

        .quick-search-row {
            display: flex;
            gap: 12px;
            align-items: center;
        }

        .search-input-wrapper {
            flex: 1;
            position: relative;
        }

        .search-icon {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            pointer-events: none;
        }

        .search,
        .advanced-search-input {
            width: 100%;
            padding: 12px 12px 12px 44px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 16px;
            background: white;
            box-sizing: border-box;
        }

        .search:focus,
        .advanced-search-input:focus {
            outline: none;
            border-color: #3b82f6;
        }

        .filter-toggle-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 20px;
            background: #22d3ee;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
        }

        .filter-toggle-btn:hover {
            background: #0891b2;
        }

        .advanced-search-row {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
        }

        .advanced-search-field {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .advanced-search-field label {
            font-weight: 500;
            color: #374151;
            min-width: 100px;
        }

        .filter-operator {
            padding: 8px 12px;
            border: 2px solid #e5e7eb;
            border-radius: 6px;
            background: white;
            font-size: 14px;
            min-width: 120px;
        }

        .filter-operator:focus {
            outline: none;
            border-color: #3b82f6;
        }

        .advanced-search-input {
            flex: 1;
            padding: 8px 12px;
            margin: 0;
        }
    </style>

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
                        echo '<img src="' . get_the_post_thumbnail_url($design->ID, 'thumbnail') . '" alt="' . esc_attr($design->post_title) . '" onclick="addDesignToCanvas(' . $design->ID . ')" style="cursor: pointer;">';
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