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
       
        <div class="pw-design-filters">
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

    <div id="pw-design-app">
        <div class="pw-design-bulk-actions">
            <button class="button" @click="openFilterModal">Filter</button>
            <label><input type="checkbox" v-model="allSelected"> Select All</label>
            <button v-show="selectedDesignIds.length > 0" id="pw-delete-selected-designs" class="button button-danger" @click="triggerBulkDelete" style="display: none;" :style="{ display: selectedDesignIds.length > 0 ? 'inline-block' : 'none' }">Delete Selected</button>
            <button v-show="selectedDesignIds.length > 0" id="pw-bulk-update-designs" class="button button-primary" @click="triggerBulkUpdate" style="display: none;" :style="{ display: selectedDesignIds.length > 0 ? 'inline-block' : 'none' }">Bulk Update</button>
        </div>

        <div class="pw-design-grid">
            <div v-if="paginatedDesigns.length === 0">No designs found.</div>
            <div v-for="design in paginatedDesigns" :key="design.id" class="pw-design-card" :data-design-id="design.id">
                <div class="pw-design-thumbnail">
                    <input type="checkbox" class="pw-design-checkbox" :value="design.id" :checked="selectedDesignIds.includes(design.id)" @change="toggleSelection(design.id)">
                    <img v-if="design.thumbnail" :src="design.thumbnail" class="pw-design-thumbnail-img">
                    <div v-else>Thumbnail Design</div>
                </div>
                <div class="pw-design-name">{{ design.name }}</div>
                <button class="button pw-add-tag-button" :data-design-id="design.id" @click="triggerAddTag(design.id)">Add Tag</button>
                <div class="pw-design-tags" :data-design-id="design.id">
                    <span v-if="design.tags && design.tags.length" class="pw-tags-label">Tags: </span>
                    {{ design.tags ? design.tags.join(' ') : '' }}
                </div>
                <div class="pw-design-actions-bottom">
                    <button type="button" class="pw-edit-design-btn" :data-design-id="design.id" title="Edit Design" @click="triggerEdit(design.id)"><span class="dashicons dashicons-edit"></span></button>
                    <a :href="design.delete_link" title="Delete Design" class="pw-delete-design-link" onclick="return confirm('Are you sure?');"><span class="dashicons dashicons-trash"></span></a>
                </div>
            </div>
        </div>

        <!-- Pagination -->
        <div class="pw-pagination" v-if="totalPages > 1" style="margin-top: 20px; text-align: center;">
            <button class="button" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">Previous</button>
            <span style="margin: 0 10px;">Page {{ currentPage }} of {{ totalPages }}</span>
            <button class="button" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">Next</button>
        </div>

        <!-- Filter Modal (Vue Controlled) -->
        <div class="modal" :class="{ 'is-open': isFilterModalOpen }" id="pw-vue-filter-modal" aria-hidden="true" v-show="isFilterModalOpen" style="display: none;" :style="{ display: isFilterModalOpen ? 'block' : 'none' }">
            <div class="modal__overlay" tabindex="-1" @click="closeFilterModal">
                <div class="modal__container" role="dialog" aria-modal="true" @click.stop>
                    <header class="modal__header">
                        <h2 class="modal__title">Filter Designs</h2>
                        <button class="modal__close" aria-label="Close modal" @click="closeFilterModal">&times;</button>
                    </header>
                    <div class="modal__content">
                        <div class="pw-filter-search-field">
                            <span class="dashicons dashicons-search"></span>
                            <input type="text" v-model="fieldSearch" placeholder="Search the Field Name">
                            <span v-if="fieldSearch" class="dashicons dashicons-no-alt" @click="fieldSearch = ''" style="cursor: pointer;"></span>
                        </div>

                        <div class="pw-filter-section">
                            <h5 class="pw-filter-toggle">Selected Filter Field</h5>
                            <div class="pw-filter-options">
                                <div v-for="(filter, index) in tempFilters" :key="index" class="pw-filter-item" style="border-bottom: 1px solid #eee; padding: 10px 0;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                                        <label style="font-weight: bold;"><input type="checkbox" checked @change="removeFilterField(index)"> {{ filter.label }}</label>
                                    </div>
                                    <div class="pw-filter-condition" style="display: flex; gap: 10px;">
                                        <select v-model="filter.operator" style="flex: 1;">
                                            <option value="contains" v-if="filter.type === 'text'">contains</option>
                                            <option value="not_contains" v-if="filter.type === 'text'">does not contain</option>
                                            <option value="is" v-if="filter.type !== 'text'">is</option>
                                            <option value="is_not" v-if="filter.type !== 'text'">is not</option>
                                            <option value="gt" v-if="filter.type === 'number'">greater than</option>
                                            <option value="lt" v-if="filter.type === 'number'">less than</option>
                                        </select>
                                        
                                        <input v-if="filter.type !== 'select'" :type="filter.type" v-model="filter.value" :placeholder="filter.label" style="flex: 2;">
                                        <select v-if="filter.type === 'select'" v-model="filter.value" style="flex: 2;">
                                            <option value="">Select {{ filter.label }}</option>
                                            <option v-for="opt in availableFieldsDef.find(f => f.key === filter.key).options" :value="opt.value">{{ opt.label }}</option>
                                        </select>
                                    </div>
                                </div>
                                <div v-if="tempFilters.length === 0" style="color: #999; font-style: italic; padding: 10px;">--No Matching Fields--</div>
                            </div>
                        </div>

                        <div class="pw-filter-section">
                            <h5 class="pw-filter-toggle">Not Selected Filter Field</h5>
                            <div class="pw-filter-options">
                                <div v-for="field in notSelectedFields" :key="field.key" class="pw-filter-item-available" style="padding: 5px 0;">
                                    <label><input type="checkbox" @change="addFilterField(field)"> {{ field.label }}</label>
                                </div>
                                <div v-if="notSelectedFields.length === 0" style="color: #999; font-style: italic; padding: 10px;">--No Matching Fields--</div>
                            </div>
                        </div>
                    </div>
                    <footer class="modal__footer">
                        <button class="button" @click="clearFilters">Clear</button>
                        <button class="button button-primary" @click="applyFilters">Confirm</button>
                    </footer>
                </div>
            </div>
        </div>

        <!-- Bulk Update Modal (Vue Controlled) -->
        <div class="modal" :class="{ 'is-open': isBulkUpdateModalOpen }" id="pw-vue-bulk-update-modal" aria-hidden="true" v-show="isBulkUpdateModalOpen" style="display: none;" :style="{ display: isBulkUpdateModalOpen ? 'block' : 'none' }">
            <div class="modal__overlay" tabindex="-1" @click="closeBulkUpdateModal">
                <div class="modal__container" role="dialog" aria-modal="true" @click.stop>
                    <header class="modal__header">
                        <h2 class="modal__title">Bulk Update Designs</h2>
                        <button class="modal__close" aria-label="Close modal" @click="closeBulkUpdateModal">&times;</button>
                    </header>
                    <div class="modal__content">
                        <div class="pw-filter-search-field">
                            <span class="dashicons dashicons-search"></span>
                            <input type="text" v-model="updateFieldSearch" placeholder="Search the Field Name">
                            <span v-if="updateFieldSearch" class="dashicons dashicons-no-alt" @click="updateFieldSearch = ''" style="cursor: pointer;"></span>
                        </div>

                        <div class="pw-filter-section">
                            <h5 class="pw-filter-toggle">Selected Filter Field</h5>
                            <div class="pw-filter-options">
                                <div v-for="(field, index) in bulkUpdateFields" :key="index" class="pw-filter-item" style="border-bottom: 1px solid #eee; padding: 10px 0;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                                        <label style="font-weight: bold;"><input type="checkbox" checked @change="removeBulkUpdateField(index)"> {{ field.label }}</label>
                                    </div>
                                    <div class="pw-filter-condition">
                                        <input v-if="field.type === 'text'" type="text" v-model="field.value" class="regular-text" style="width:100%" placeholder="Enter new value">
                                        <select v-if="field.type === 'select'" v-model="field.value" style="width:100%">
                                            <option value="">Select {{ field.label }}</option>
                                            <option v-for="opt in field.options" :value="opt.value">{{ opt.label }}</option>
                                        </select>
                                    </div>
                                </div>
                                <div v-if="bulkUpdateFields.length === 0" style="color: #999; font-style: italic; padding: 10px;">--No Fields Selected--</div>
                            </div>
                        </div>

                        <div class="pw-filter-section">
                            <h5 class="pw-filter-toggle">Not Selected Filter Field</h5>
                            <div class="pw-filter-options">
                                <div v-for="field in notSelectedUpdateFields" :key="field.key" class="pw-filter-item-available" style="padding: 5px 0;">
                                    <label><input type="checkbox" @change="addBulkUpdateField(field)"> {{ field.label }}</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <footer class="modal__footer">
                        <button class="button" @click="closeBulkUpdateModal">Cancel</button>
                        <button class="button button-primary" @click="performBulkUpdate">Update</button>
                    </footer>
                </div>
            </div>
        </div>
    </div>
</div>


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
                        <input type="file" id="pw-design-image" name="design_image" accept="image/*" style="display:none;">
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

<!-- Edit Design Modal -->
<div class="modal" id="pw-edit-design-modal" aria-hidden="true">
    <div class="modal__overlay" tabindex="-1">
        <div class="modal__container" role="dialog" aria-modal="true" aria-labelledby="pw-edit-design-modal-title" style="max-width: 1200px; width: 90vw;">
            <header class="modal__header">
                <h2 class="modal__title" id="pw-edit-design-modal-title">Edit Design Settings</h2>
                <button class="modal__close" aria-label="Close modal" data-micromodal-close>&times;</button>
            </header>
            <div class="modal__content">
                <form id="pw-edit-design-form">
                    <?php wp_nonce_field('pw_edit_design_nonce', 'pw_edit_design_nonce_field'); ?>
                    <input type="hidden" id="pw-edit-design-id" name="design_id" value="">
                    
                    <!-- 设计名称 -->
                    <div class="pw-form-field" style="margin-bottom:20px;">
                        <label for="pw-edit-design-name" style="display:block; margin-bottom:8px; font-weight:600; color:#333;">Design Name</label>
                        <input type="text" id="pw-edit-design-name" name="design_name" required style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px; font-size:14px;">
                    </div>
                    
                    <!-- 设计描述 -->
                    <div class="pw-form-field" style="margin-bottom:20px;">
                        <label for="pw-edit-design-description" style="display:block; margin-bottom:8px; font-weight:600; color:#333;">Description</label>
                        <textarea id="pw-edit-design-description" name="design_description" rows="4" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px; font-size:14px; resize:vertical;" placeholder="Enter design description..."></textarea>
                    </div>
                    
                    <!-- 分类选择 -->
                    <div class="pw-form-field" style="margin-bottom:20px;">
                        <label for="pw-edit-design-category" style="display:block; margin-bottom:8px; font-weight:600; color:#333;">Design Category</label>
                        <select id="pw-edit-design-category" name="design_category" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px; font-size:14px;">
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
                    </div>
                    
                    <!-- 标签管理 -->
                    <div class="pw-form-field" style="margin-bottom:20px;">
                        <label for="pw-edit-design-tags" style="display:block; margin-bottom:8px; font-weight:600; color:#333;">Tags</label>
                        <input type="text" id="pw-edit-design-tags" name="design_tags" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px; font-size:14px;" placeholder="Enter tags separated by commas...">
                        <small style="color:#666; font-size:12px; margin-top:5px; display:block;">Separate multiple tags with commas</small>
                    </div>
                    
                    <!-- 启用设置 -->
                    <div class="pw-form-field" style="margin-bottom:20px;">
                        <label style="display:flex; align-items:center; cursor:pointer;">
                            <input type="checkbox" id="pw-edit-design-enabled" name="design_enabled" value="1" style="margin-right:8px;">
                            <span style="font-weight:600; color:#333;">Enable Setting</span>
                        </label>
                        <small style="color:#666; font-size:12px; margin-top:5px; display:block;">Check to enable this design setting</small>
                    </div>
                </form>
            </div>
            <footer class="modal__footer">
                <button class="button" data-micromodal-close>Cancel</button>
                <button type="submit" class="button button-primary" id="pw-edit-design-submit" form="pw-edit-design-form">Update Design</button>
            </footer>
        </div>
    </div>
</div>

<!-- Bulk Update Modal Removed (Replaced by Vue Version) -->

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
    <div class="modal__overlay" tabindex="-1">
        <div class="modal__container" role="dialog" aria-modal="true" aria-labelledby="pw-category-settings-modal-title" style="max-width: 1200px; width: 90vw;">
            <header class="modal__header">
                <h2 class="modal__title" id="pw-category-settings-modal-title">Category Settings</h2>
                <button class="modal__close" aria-label="Close modal" data-micromodal-close>&times;</button>
            </header>
            <div class="modal__content">
                <form id="pw-category-settings-form">
                    <?php wp_nonce_field('pw_category_settings_nonce', 'pw_category_settings_nonce_field'); ?>
                    <input type="hidden" id="pw-settings-category-id" name="category_id">
                    
                    <!-- 分类名称 -->
                    <div class="pw-form-field" style="margin-bottom:20px;">
                        <label for="pw-settings-category-name" style="display:block; margin-bottom:8px; font-weight:600; color:#333;">Category Name</label>
                        <input type="text" id="pw-settings-category-name" name="category_name" required style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px; font-size:14px;">
                    </div>
                    
                    <!-- 分类描述 -->
                    <div class="pw-form-field" style="margin-bottom:20px;">
                        <label for="pw-settings-category-description" style="display:block; margin-bottom:8px; font-weight:600; color:#333;">Description</label>
                        <textarea id="pw-settings-category-description" name="category_description" rows="3" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px; font-size:14px; resize:vertical;" placeholder="Enter category description..."></textarea>
                    </div>
                    
                    <!-- 分类类型 -->
                    <div class="pw-form-field" style="margin-bottom:20px;">
                        <label for="pw-settings-category-type" style="display:block; margin-bottom:8px; font-weight:600; color:#333;">Category Type</label>
                        <select id="pw-settings-category-type" name="category_type" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px; font-size:14px;">
                            <option value="general">General</option>
                            <option value="product">Product</option>
                            <option value="style">Style</option>
                        </select>
                    </div>
                    
                    <!-- Tabs -->
                    <div class="pw-settings-tabs" style="margin-bottom:20px;">
                        <div class="pw-tab-nav" style="display:flex; border-bottom:1px solid #ddd; margin-bottom:20px;">
                            <button type="button" class="pw-tab-btn active" data-tab="initial-state" style="flex:1; padding:12px 20px; border:none; background:#fff; cursor:pointer; border-bottom:3px solid #007cba; color:#007cba; font-weight:600; border-radius:4px 0 0 0;">Initial State</button>
                            <button type="button" class="pw-tab-btn" data-tab="operation-config" style="flex:1; padding:12px 20px; border:none; background:#f9f9f9; cursor:pointer; border-bottom:3px solid transparent; color:#666; font-weight:500;">Operation Config</button>
                            <button type="button" class="pw-tab-btn" data-tab="price" style="flex:1; padding:12px 20px; border:none; background:#f9f9f9; cursor:pointer; border-bottom:3px solid transparent; color:#666; font-weight:500; border-radius:0 4px 0 0;">Price</button>
                        </div>
                        
                        <div class="pw-tab-content">
                            <!-- Initial State Tab -->
                            <div class="pw-tab-panel active" id="tab-initial-state" style="padding:0;">
                                <div class="pw-form-field" style="margin-bottom:20px;">
                                    <label style="display:flex; align-items:center; cursor:pointer;">
                                        <input type="checkbox" id="pw-exclude-from-export" name="exclude_from_export" style="margin-right:8px;">
                                        <span style="font-weight:600; color:#333;">Exclude From Export</span>
                                    </label>
                                    <small style="color:#666; font-size:12px; margin-top:5px; display:block;">Check to exclude this category from export operations</small>
                                </div>
                                
                                <div class="pw-form-field" style="margin-bottom:20px;">
                                    <label for="pw-layer-depth" style="display:block; margin-bottom:8px; font-weight:600; color:#333;">Layer Depth</label>
                                    <input type="number" id="pw-layer-depth" name="layer_depth" value="-1" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px; font-size:14px;">
                                    <small style="color:#666; font-size:12px; margin-top:5px; display:block;">Set the layer depth for this category (-1 for auto)</small>
                                </div>
                                
                                <div class="pw-form-field" style="margin-bottom:20px;">
                                    <label for="pw-scale-mode" style="display:block; margin-bottom:8px; font-weight:600; color:#333;">Scale Mode</label>
                                    <select id="pw-scale-mode" name="scale_mode" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px; font-size:14px;">
                                        <option value="fit">Fit</option>
                                        <option value="fill">Fill</option>
                                        <option value="stretch">Stretch</option>
                                        <option value="center">Center</option>
                                    </select>
                                    <small style="color:#666; font-size:12px; margin-top:5px; display:block;">Choose how content should be scaled within this category</small>
                                </div>
                            </div>
                            
                            <!-- Operation Config Tab -->
                            <div class="pw-tab-panel" id="tab-operation-config" style="padding:0; display:none;">
                                <div class="pw-form-field" style="margin-bottom:20px;">
                                    <label style="display:flex; align-items:center; cursor:pointer;">
                                        <input type="checkbox" id="pw-allow-resize" name="allow_resize" value="1" style="margin-right:8px;">
                                        <span style="font-weight:600; color:#333;">Allow Resize</span>
                                    </label>
                                    <small style="color:#666; font-size:12px; margin-top:5px; display:block;">Allow users to resize elements in this category</small>
                                </div>
                                
                                <div class="pw-form-field" style="margin-bottom:20px;">
                                    <label style="display:flex; align-items:center; cursor:pointer;">
                                        <input type="checkbox" id="pw-allow-rotate" name="allow_rotate" value="1" style="margin-right:8px;">
                                        <span style="font-weight:600; color:#333;">Allow Rotate</span>
                                    </label>
                                    <small style="color:#666; font-size:12px; margin-top:5px; display:block;">Allow users to rotate elements in this category</small>
                                </div>
                                
                                <div class="pw-form-field" style="margin-bottom:20px;">
                                    <label style="display:flex; align-items:center; cursor:pointer;">
                                        <input type="checkbox" id="pw-allow-delete" name="allow_delete" value="1" style="margin-right:8px;">
                                        <span style="font-weight:600; color:#333;">Allow Delete</span>
                                    </label>
                                    <small style="color:#666; font-size:12px; margin-top:5px; display:block;">Allow users to delete elements in this category</small>
                                </div>
                            </div>
                            
                            <!-- Price Tab -->
                            <div class="pw-tab-panel" id="tab-price" style="padding:0; display:none;">
                                <div class="pw-form-field" style="margin-bottom:20px;">
                                    <label for="pw-base-price" style="display:block; margin-bottom:8px; font-weight:600; color:#333;">Base Price</label>
                                    <input type="number" id="pw-base-price" name="base_price" step="0.01" min="0" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px; font-size:14px;" placeholder="0.00">
                                    <small style="color:#666; font-size:12px; margin-top:5px; display:block;">Base price for this category</small>
                                </div>
                                
                                <div class="pw-form-field" style="margin-bottom:20px;">
                                    <label for="pw-price-per-unit" style="display:block; margin-bottom:8px; font-weight:600; color:#333;">Price Per Unit</label>
                                    <input type="number" id="pw-price-per-unit" name="price_per_unit" step="0.01" min="0" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px; font-size:14px;" placeholder="0.00">
                                    <small style="color:#666; font-size:12px; margin-top:5px; display:block;">Additional price per unit/item in this category</small>
                                </div>
                                
                                <div class="pw-form-field" style="margin-bottom:20px;">
                                    <label style="display:flex; align-items:center; cursor:pointer;">
                                        <input type="checkbox" id="pw-price-enabled" name="price_enabled" value="1" style="margin-right:8px;">
                                        <span style="font-weight:600; color:#333;">Enable Pricing</span>
                                    </label>
                                    <small style="color:#666; font-size:12px; margin-top:5px; display:block;">Check to enable pricing for this category</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <footer class="modal__footer">
                <button class="button" data-micromodal-close>Cancel</button>
                <button type="submit" class="button button-primary" id="pw-settings-save" form="pw-category-settings-form">Update Category</button>
            </footer>
        </div>
    </div>
</div>

<?php
// 1. Prepare Data for Vue
$designs_data = array();
$categories_data = array();

// Use existing query parameters from the file
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

// Check tags
if ( ! empty( $selected_tab ) && $selected_tab !== 'all' ) {
    $tag_slug = '';
    switch ( $selected_tab ) {
        case 'universal': $tag_slug = 'universal'; break;
        case 'universal-main-view': $tag_slug = 'universal-main-view'; break;
        case 'product-specific': $tag_slug = 'product-specific'; break;
    }
    
    if ( ! empty( $tag_slug ) ) {
        if ( ! isset( $args['tax_query'] ) ) $args['tax_query'] = array();
        if ( ! empty( $args['tax_query'] ) && !isset($args['tax_query']['relation']) ) $args['tax_query']['relation'] = 'AND';
        $args['tax_query'][] = array(
            'taxonomy' => 'pw_design_tag',
            'field'    => 'slug',
            'terms'    => $tag_slug,
        );
    }
}

$designs_query = new WP_Query( $args );

if ( $designs_query->have_posts() ) {
    while ( $designs_query->have_posts() ) {
        $designs_query->the_post();
        $d_id = get_the_ID();
        
        $cats = get_the_terms( $d_id, 'pw_design_category' );
        $cat_names = $cats && !is_wp_error($cats) ? wp_list_pluck($cats, 'name') : array();
        $cat_slugs = $cats && !is_wp_error($cats) ? wp_list_pluck($cats, 'slug') : array();
        
        $tgs = get_the_terms( $d_id, 'pw_design_tag' );
        $tag_names = $tgs && !is_wp_error($tgs) ? wp_list_pluck($tgs, 'name') : array();

        $thumb_url = get_the_post_thumbnail_url($d_id, 'medium');

        $price = get_post_meta($d_id, '_pw_design_price', true);

        $designs_data[] = array(
            'id' => $d_id,
            'name' => get_the_title(),
            'thumbnail' => $thumb_url,
            'delete_link' => get_delete_post_link( $d_id ),
            'category' => !empty($cat_slugs) ? $cat_slugs[0] : '',
            'categories' => $cat_names,
            'tags' => $tag_names,
            'price' => $price,
            'date' => get_the_date('Y-m-d'),
        );
    }
    wp_reset_postdata();
}

$all_cats = get_terms( array('taxonomy' => 'pw_design_category', 'hide_empty' => false) );
if ( ! empty( $all_cats ) && ! is_wp_error( $all_cats ) ) {
    foreach ( $all_cats as $c ) {
        $categories_data[] = array(
            'slug' => $c->slug,
            'name' => $c->name
        );
    }
}

// 2. Enqueue Vue and App
wp_enqueue_script('vue', 'https://unpkg.com/vue@3/dist/vue.global.prod.js', array(), '3.0.0', true);
wp_enqueue_script('pw-design-app', plugin_dir_url(__FILE__) . '../js/pw-design-app.js', array('vue', 'jquery'), '1.0.0', true);
wp_localize_script('pw-design-app', 'pw_designs_data', $designs_data);
wp_localize_script('pw-design-app', 'pw_categories_data', $categories_data);


// 加载Micromodal.js
wp_enqueue_script(
    'micromodal',
    'https://unpkg.com/micromodal/dist/micromodal.min.js',
    array(),
    '0.4.10',
    true
);

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

// 传递Edit Design相关数据
wp_localize_script('pw-admin-micromodal-simple', 'pw_admin_ajax', array(
    'nonce' => wp_create_nonce('pw_admin_nonce'),
    'ajaxurl' => admin_url('admin-ajax.php')
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
