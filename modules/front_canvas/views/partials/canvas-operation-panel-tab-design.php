<!-- 设计内容 (隐藏) -->
<div id="content-sheji" class="pwca-content-pane">
    <div id="pwca-design-search-app">
        <!-- Vue app will be mounted here -->
    </div>
</div>

<template id="pwca-design-search-template">
    <div class="pwca-search-filter-container">
        <!-- 快速搜索区域 -->
        <div class="pwca-quick-search-row">
            <div class="pwca-search-input-wrapper">
                <svg class="pwca-search-icon" viewBox="0 0 24 24" width="20" height="20">
                    <path fill="#9ca3af" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
                <input 
                    type="text" 
                    class="pwca-search" 
                    placeholder="Search Design Folders" 
                    v-model="state.quickSearch"
                >
            </div>
            <button 
                class="pwca-filter-toggle-btn"
                @click="toggleAdvanced"
            >
                <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="white" d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
                </svg>
                Filter
            </button>
        </div>

        <!-- 高级搜索行 (默认隐藏) -->
        <div class="pwca-advanced-search-row" v-show="state.isAdvancedVisible">
            <div class="pwca-advanced-search-field">
                <label>Folder</label>
                <select v-model="state.filterOperator" class="pwca-filter-operator">
                    <option value="is">is</option>
                    <option value="isnot">is not</option>
                    <option value="contains">contains</option>
                    <option value="notcontains">not contains</option>
                </select>
                <input 
                    type="text" 
                    v-model="state.advancedSearch" 
                    class="pwca-advanced-search-input" 
                    placeholder=""
                >
            </div>
        </div>
    </div>

    <hr>

    <div class="pwca-content-sheji" :class="{ active: state.isCategoryDetailOpen }">
        <div class="pwca-list">
            <div 
                v-for="category in filteredCategories" 
                :key="category.id"
                class="pwca-category-item" 
                :class="{ active: state.activeCategoryId === category.id }"
                @click="selectCategory(category.id)"
            >
                <div class="pwca-category-item-header">
                    <div class="pwca-category-name name">
                        <img :src="designIconUrl" alt="Designs ICON">
                        {{ category.name }}
                    </div>
                    <button class="pwca-back-button" @click.stop="deselectCategory">Back to Design Folders</button>
                </div>
                <div class="pwca-designs-grid">
                    <div 
                        v-for="design in category.designs" 
                        :key="design.id"
                        class="pwca-design-item"
                        @click.stop="addDesign(design.id)"
                    >
                        <img 
                            :src="design.thumbnail" 
                            :alt="design.title" 
                            class="pwca-design-thumbnail"
                            :data-design-id="design.id"
                            :data-design-sku="design.sku"
                        >
                    </div>
                </div>
            </div>
            <div v-if="filteredCategories.length === 0" class="no-results">
                No designs found matching your criteria.
            </div>
        </div>
    </div>
</template>

<?php
// Prepare data for Vue
$categories_data = array();
$categories = get_terms(array(
    'taxonomy'   => 'pw_design_category',
    'hide_empty' => false,
));

if (!is_wp_error($categories) && !empty($categories)) {
    foreach ($categories as $category) {
        $raw_type      = get_term_meta($category->term_id, 'category_type', true);
        $category_type = is_string($raw_type) ? $raw_type : 'universal';
        
        if ($category_type === '' || $category_type === 'general') {
            $category_type = 'universal';
        }

        $designs_posts = get_posts(array(
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

        $designs = array();
        foreach ($designs_posts as $design) {
            $designs[] = array(
                'id'        => $design->ID,
                'title'     => $design->post_title,
                'thumbnail' => get_the_post_thumbnail_url($design->ID, 'thumbnail'),
                'sku'       => (string) (get_post_meta($design->ID, '_design_sku', true) ?: ''),
            );
        }

        $categories_data[] = array(
            'id'      => $category->term_id,
            'name'    => $category->name,
            'type'    => $category_type,
            'designs' => $designs,
        );
    }
}
?>

<script type="text/javascript">
    window.pwcaDesignData = {
        categories: <?php echo json_encode($categories_data); ?>,
        designIconUrl: '<?php echo MY_PLUGIN_URL; ?>assets/images/icons/design.svg'
    };
</script>

