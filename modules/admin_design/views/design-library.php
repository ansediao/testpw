<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$ajax_url       = isset( $view_model['ajax_url'] ) ? (string) $view_model['ajax_url'] : '';
$nonces         = isset( $view_model['nonces'] ) && is_array( $view_model['nonces'] ) ? $view_model['nonces'] : array();
$filters        = isset( $view_model['filters'] ) && is_array( $view_model['filters'] ) ? $view_model['filters'] : array();
$terms          = isset( $view_model['terms'] ) && is_array( $view_model['terms'] ) ? $view_model['terms'] : array();
$designs_data   = isset( $view_model['designs_data'] ) && is_array( $view_model['designs_data'] ) ? $view_model['designs_data'] : array();
$categories_data = isset( $view_model['categories_data'] ) && is_array( $view_model['categories_data'] ) ? $view_model['categories_data'] : array();

$selected_category = isset( $filters['selected_category'] ) ? (string) $filters['selected_category'] : '';
$search_query      = isset( $filters['search_query'] ) ? (string) $filters['search_query'] : '';
$selected_tab      = isset( $filters['selected_tab'] ) ? (string) $filters['selected_tab'] : 'all';

$data_payload = array(
	'designs'     => $designs_data,
	'categories'  => $categories_data,
	'selectedTab' => $selected_tab,
);

?>

<div
	class="wrap pwca-admin-design"
	data-ajax-url="<?php echo esc_url( $ajax_url ); ?>"
	data-add-category-nonce="<?php echo esc_attr( (string) ( $nonces['add_category'] ?? '' ) ); ?>"
	data-add-design-nonce="<?php echo esc_attr( (string) ( $nonces['add_design'] ?? '' ) ); ?>"
	data-bulk-delete-nonce="<?php echo esc_attr( (string) ( $nonces['bulk_delete'] ?? '' ) ); ?>"
	data-bulk-update-nonce="<?php echo esc_attr( (string) ( $nonces['bulk_update'] ?? '' ) ); ?>"
	data-admin-nonce="<?php echo esc_attr( (string) ( $nonces['admin'] ?? '' ) ); ?>"
>
	<h1>Home Page for Design</h1>

	<textarea id="pwca-design-library-data" hidden><?php echo esc_textarea( wp_json_encode( $data_payload ) ); ?></textarea>

	<div class="pw-design-controls">
		<div class="pw-design-actions">
			<button class="button button-primary" id="pw-add-design-btn" type="button">Add Design</button>
			<button class="button" id="pw-add-category-btn" type="button">Add Category</button>
			<button class="button" id="pw-manage-category-btn" type="button">Manage Category</button>
		</div>

		<div class="pw-design-filters">
			<form method="get" action="">
				<input type="hidden" name="page" value="<?php echo esc_attr( (string) ( $_REQUEST['page'] ?? '' ) ); ?>">
				<input type="text" name="s" value="<?php echo esc_attr( $search_query ); ?>" placeholder="Search Designs">
				<button type="submit" class="button">Search</button>
			</form>

			<form method="get" action="" id="pwca-design-category-filter-form">
				<input type="hidden" name="page" value="<?php echo esc_attr( (string) ( $_REQUEST['page'] ?? '' ) ); ?>">
				<input type="hidden" name="tab" value="<?php echo esc_attr( $selected_tab ); ?>">
				<select name="category" id="pwca-design-category-filter">
					<option value="">Select a Category</option>
					<?php foreach ( $terms as $term ) : ?>
						<?php if ( $term instanceof WP_Term ) : ?>
							<option value="<?php echo esc_attr( (string) $term->slug ); ?>" <?php selected( $selected_category, (string) $term->slug ); ?>>
								<?php echo esc_html( (string) $term->name ); ?>
							</option>
						<?php endif; ?>
					<?php endforeach; ?>
				</select>
				<noscript><button type="submit" class="button">Filter</button></noscript>
			</form>

			<span class="dashicons dashicons-info" aria-hidden="true"></span>
		</div>
	</div>

	<div class="pw-design-tabs nav-tab-wrapper">
		<a href="<?php echo esc_url( add_query_arg( array( 'page' => (string) ( $_REQUEST['page'] ?? '' ), 'tab' => 'all', 'category' => $selected_category, 's' => $search_query ) ) ); ?>" class="nav-tab <?php echo ( 'all' === $selected_tab ) ? 'nav-tab-active' : ''; ?>">All</a>
		<a href="<?php echo esc_url( add_query_arg( array( 'page' => (string) ( $_REQUEST['page'] ?? '' ), 'tab' => 'universal', 'category' => $selected_category, 's' => $search_query ) ) ); ?>" class="nav-tab <?php echo ( 'universal' === $selected_tab ) ? 'nav-tab-active' : ''; ?>">Universal</a>
		<a href="<?php echo esc_url( add_query_arg( array( 'page' => (string) ( $_REQUEST['page'] ?? '' ), 'tab' => 'universal-main-view', 'category' => $selected_category, 's' => $search_query ) ) ); ?>" class="nav-tab <?php echo ( 'universal-main-view' === $selected_tab ) ? 'nav-tab-active' : ''; ?>">Universal for Main View</a>
		<a href="<?php echo esc_url( add_query_arg( array( 'page' => (string) ( $_REQUEST['page'] ?? '' ), 'tab' => 'product-specific', 'category' => $selected_category, 's' => $search_query ) ) ); ?>" class="nav-tab <?php echo ( 'product-specific' === $selected_tab ) ? 'nav-tab-active' : ''; ?>">Product Specific</a>
	</div>

	<div id="pw-design-app">
		<div class="pw-design-bulk-actions">
			<button class="button" type="button" @click="openFilterModal">Filter</button>
			<label><input type="checkbox" v-model="allSelected"> Select All</label>
			<button v-show="selectedDesignIds.length > 0" id="pw-delete-selected-designs" class="button button-danger" type="button" @click="triggerBulkDelete">Delete Selected</button>
			<button v-show="selectedDesignIds.length > 0" id="pw-bulk-update-designs" class="button button-primary" type="button" @click="triggerBulkUpdate">Bulk Update</button>
		</div>

		<div class="pw-design-grid">
			<div v-if="paginatedDesigns.length === 0">No designs found.</div>
			<div v-for="design in paginatedDesigns" :key="design.id" class="pw-design-card" :data-design-id="design.id">
				<div class="pw-design-thumbnail">
					<input type="checkbox" class="pw-design-checkbox" :value="design.id" :checked="selectedDesignIds.includes(design.id)" @change="toggleSelection(design.id)">
					<img v-if="design.thumbnail" :src="design.thumbnail" class="pw-design-thumbnail-img" alt="">
					<div v-else>Thumbnail Design</div>
				</div>
				<div class="pw-design-name">{{ design.name }}</div>
				<button class="button pw-add-tag-button" type="button" :data-design-id="design.id" @click="triggerAddTag(design.id)">Add Tag</button>
				<div class="pw-design-tags" :data-design-id="design.id">
					<span v-if="design.tags && design.tags.length" class="pw-tags-label">Tags: </span>
					{{ design.tags ? design.tags.join(' ') : '' }}
				</div>
				<div class="pw-design-actions-bottom">
					<button type="button" class="pw-edit-design-btn" :data-design-id="design.id" title="Edit Design" @click="triggerEdit(design.id)">
						<span class="dashicons dashicons-edit" aria-hidden="true"></span>
					</button>
					<a :href="design.delete_link" title="Delete Design" class="pw-delete-design-link" :data-design-id="design.id">
						<span class="dashicons dashicons-trash" aria-hidden="true"></span>
					</a>
				</div>
			</div>
		</div>

		<div class="pw-pagination" v-if="totalPages > 1">
			<button class="button" type="button" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">Previous</button>
			<span>Page {{ currentPage }} of {{ totalPages }}</span>
			<button class="button" type="button" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">Next</button>
		</div>

		<div class="modal" :class="{ 'is-open': isFilterModalOpen }" id="pw-vue-filter-modal" aria-hidden="true" v-show="isFilterModalOpen" :style="{ display: isFilterModalOpen ? 'block' : 'none' }">
			<div class="modal__overlay" tabindex="-1" @click="closeFilterModal">
				<div class="modal__container" role="dialog" aria-modal="true" @click.stop>
					<header class="modal__header">
						<h2 class="modal__title">Filter Designs</h2>
						<button class="modal__close" type="button" aria-label="Close modal" @click="closeFilterModal">&times;</button>
					</header>
					<div class="modal__content">
						<div class="pw-filter-search-field">
							<span class="dashicons dashicons-search" aria-hidden="true"></span>
							<input type="text" v-model="fieldSearch" placeholder="Search the Field Name">
							<span v-if="fieldSearch" class="dashicons dashicons-no-alt" @click="fieldSearch = ''" role="button" aria-label="Clear"></span>
						</div>

						<div class="pw-filter-section">
							<h5 class="pw-filter-toggle">Selected Filter Field</h5>
							<div class="pw-filter-options">
								<div v-for="(filter, index) in tempFilters" :key="index" class="pw-filter-item">
									<div class="pw-filter-item-header">
										<label><input type="checkbox" checked @change="removeFilterField(index)"> {{ filter.label }}</label>
									</div>
									<div class="pw-filter-condition">
										<select v-model="filter.operator">
											<option value="contains" v-if="filter.type === 'text'">contains</option>
											<option value="not_contains" v-if="filter.type === 'text'">does not contain</option>
											<option value="is" v-if="filter.type !== 'text'">is</option>
											<option value="is_not" v-if="filter.type !== 'text'">is not</option>
											<option value="gt" v-if="filter.type === 'number'">greater than</option>
											<option value="lt" v-if="filter.type === 'number'">less than</option>
										</select>

										<input v-if="filter.type !== 'select'" :type="filter.type" v-model="filter.value" :placeholder="filter.label">
										<select v-if="filter.type === 'select'" v-model="filter.value">
											<option value="">Select {{ filter.label }}</option>
											<option v-for="opt in availableFieldsDef.find(f => f.key === filter.key).options" :value="opt.value">{{ opt.label }}</option>
										</select>
									</div>
								</div>
								<div v-if="tempFilters.length === 0" class="pw-empty">--No Matching Fields--</div>
							</div>
						</div>

						<div class="pw-filter-section">
							<h5 class="pw-filter-toggle">Not Selected Filter Field</h5>
							<div class="pw-filter-options">
								<div v-for="field in notSelectedFields" :key="field.key" class="pw-filter-item-available">
									<label><input type="checkbox" @change="addFilterField(field)"> {{ field.label }}</label>
								</div>
								<div v-if="notSelectedFields.length === 0" class="pw-empty">--No Matching Fields--</div>
							</div>
						</div>
					</div>
					<footer class="modal__footer">
						<button class="button" type="button" @click="clearFilters">Clear</button>
						<button class="button button-primary" type="button" @click="applyFilters">Confirm</button>
					</footer>
				</div>
			</div>
		</div>

		<div class="modal" :class="{ 'is-open': isBulkUpdateModalOpen }" id="pw-vue-bulk-update-modal" aria-hidden="true" v-show="isBulkUpdateModalOpen" :style="{ display: isBulkUpdateModalOpen ? 'block' : 'none' }">
			<div class="modal__overlay" tabindex="-1" @click="closeBulkUpdateModal">
				<div class="modal__container" role="dialog" aria-modal="true" @click.stop>
					<header class="modal__header">
						<h2 class="modal__title">Bulk Update Designs</h2>
						<button class="modal__close" type="button" aria-label="Close modal" @click="closeBulkUpdateModal">&times;</button>
					</header>
					<div class="modal__content">
						<div class="pw-filter-search-field">
							<span class="dashicons dashicons-search" aria-hidden="true"></span>
							<input type="text" v-model="updateFieldSearch" placeholder="Search the Field Name">
							<span v-if="updateFieldSearch" class="dashicons dashicons-no-alt" @click="updateFieldSearch = ''" role="button" aria-label="Clear"></span>
						</div>

						<div class="pw-filter-section">
							<h5 class="pw-filter-toggle">Selected Filter Field</h5>
							<div class="pw-filter-options">
								<div v-for="(field, index) in bulkUpdateFields" :key="index" class="pw-filter-item">
									<div class="pw-filter-item-header">
										<label><input type="checkbox" checked @change="removeBulkUpdateField(index)"> {{ field.label }}</label>
									</div>
									<div class="pw-filter-condition">
										<input v-if="field.type === 'text'" type="text" v-model="field.value" class="regular-text" placeholder="Enter new value">
										<select v-if="field.type === 'select'" v-model="field.value">
											<option value="">Select {{ field.label }}</option>
											<option v-for="opt in field.options" :value="opt.value">{{ opt.label }}</option>
										</select>
										<div v-if="field.type === 'toggle'" class="pw-toggle-switch">
											<input type="checkbox" v-model="field.value" :id="'toggle-' + index" class="pw-toggle-input" true-value="publish" false-value="draft">
											<label :for="'toggle-' + index" class="pw-toggle-label"><span class="pw-toggle-slider"></span></label>
											<span class="pw-toggle-text">{{ field.value === 'publish' ? 'Published' : (field.value === 'draft' ? 'Draft' : 'Select Status') }}</span>
										</div>
									</div>
								</div>
								<div v-if="bulkUpdateFields.length === 0" class="pw-empty">--No Fields Selected--</div>
							</div>
						</div>

						<div class="pw-filter-section">
							<h5 class="pw-filter-toggle">Not Selected Filter Field</h5>
							<div class="pw-filter-options">
								<div v-for="field in notSelectedUpdateFields" :key="field.key" class="pw-filter-item-available">
									<label><input type="checkbox" @change="addBulkUpdateField(field)"> {{ field.label }}</label>
								</div>
							</div>
						</div>
					</div>
					<footer class="modal__footer">
						<button class="button" type="button" @click="closeBulkUpdateModal">Cancel</button>
						<button class="button button-primary" type="button" @click="performBulkUpdate">Update</button>
					</footer>
				</div>
			</div>
		</div>
	</div>
</div>

<div class="modal" id="pw-tag-modal" aria-hidden="true">
	<div class="modal__overlay" tabindex="-1" data-micromodal-close>
		<div class="modal__container" role="dialog" aria-modal="true" aria-labelledby="pw-tag-modal-title">
			<header class="modal__header">
				<h2 class="modal__title" id="pw-tag-modal-title">Manage Tags</h2>
				<button class="modal__close" type="button" aria-label="Close modal" data-micromodal-close>&times;</button>
			</header>
			<div class="modal__content">
				<div id="pw-tag-modal-body" class="pwca-tag-modal-body"></div>
				<input type="hidden" id="pw-tag-modal-design-id" value="">
			</div>
			<footer class="modal__footer">
				<button class="button" type="button" data-micromodal-close>Close</button>
				<button class="button button-primary" type="button" id="pw-tag-modal-save">Save Changes</button>
			</footer>
		</div>
	</div>
</div>

<div class="modal" id="pw-add-design-modal" aria-hidden="true">
	<div class="modal__overlay" tabindex="-1">
		<div class="modal__container" role="dialog" aria-modal="true" aria-labelledby="pw-add-design-modal-title">
			<header class="modal__header">
				<h2 class="modal__title" id="pw-add-design-modal-title">Add New Design</h2>
				<button class="modal__close" type="button" aria-label="Close modal" data-micromodal-close>&times;</button>
			</header>
			<div class="modal__content">
				<form id="pw-add-design-form" enctype="multipart/form-data">
					<?php wp_nonce_field( 'pw_add_design_nonce', 'pw_add_design_nonce_field' ); ?>

					<div class="pw-form-field pwca-upload-field">
						<label for="pw-design-image" class="pwca-upload-label">
							<div id="pw-upload-placeholder">
								<span class="dashicons dashicons-cloud-upload" aria-hidden="true"></span>
								<p>Click or drag image here to upload</p>
								<p>Supports JPG, PNG, GIF formats</p>
							</div>
							<div id="pw-image-preview">
								<img id="pw-preview-img" alt="">
								<p><span id="pw-file-name"></span></p>
								<button type="button" id="pw-remove-image" class="button">移除图片</button>
							</div>
						</label>
						<input type="file" id="pw-design-image" name="design_image" accept="image/*">
					</div>

					<div class="pw-form-field">
						<label for="pw-design-name">Design Name</label>
						<input type="text" id="pw-design-name" name="design_name" required>
					</div>

					<div class="pw-form-field">
						<label for="pw-design-category">Design Category</label>
						<select id="pw-design-category" name="design_category">
							<option value="">选择分类</option>
							<?php foreach ( $terms as $term ) : ?>
								<?php if ( $term instanceof WP_Term ) : ?>
									<option value="<?php echo esc_attr( (string) $term->term_id ); ?>"><?php echo esc_html( (string) $term->name ); ?></option>
								<?php endif; ?>
							<?php endforeach; ?>
						</select>
					</div>
				</form>
			</div>
			<footer class="modal__footer">
				<button class="button" type="button" data-micromodal-close>取消</button>
				<button type="submit" class="button button-primary" id="pw-add-design-submit" form="pw-add-design-form">Add Design</button>
			</footer>
		</div>
	</div>
</div>

<div class="modal" id="pw-edit-design-modal" aria-hidden="true">
	<div class="modal__overlay" tabindex="-1">
		<div class="modal__container pwca-edit-design-modal" role="dialog" aria-modal="true" aria-labelledby="pw-edit-design-modal-title">
			<header class="modal__header">
				<h2 class="modal__title" id="pw-edit-design-modal-title">Edit Design Settings</h2>
				<button class="modal__close" type="button" aria-label="Close modal" data-micromodal-close>&times;</button>
			</header>
			<div class="modal__content">
				<form id="pw-edit-design-form">
					<?php wp_nonce_field( 'pw_edit_design_nonce', 'pw_edit_design_nonce_field' ); ?>
					<input type="hidden" id="pw-edit-design-id" name="design_id" value="">

					<div class="pw-form-field">
						<label for="pw-edit-design-name">Design Name</label>
						<input type="text" id="pw-edit-design-name" name="design_name" required>
					</div>

					<div class="pw-form-field">
						<label for="pw-edit-design-description">Description</label>
						<textarea id="pw-edit-design-description" name="design_description" rows="4" placeholder="Enter design description..."></textarea>
					</div>

					<div class="pw-form-field">
						<label for="pw-edit-design-category">Design Category</label>
						<select id="pw-edit-design-category" name="design_category">
							<option value="">Select Category</option>
						</select>
					</div>

					<div class="pw-form-field">
						<label for="pw-edit-design-tags">Tags</label>
						<input type="text" id="pw-edit-design-tags" name="design_tags" placeholder="Enter tags separated by commas...">
					</div>

					<div class="pw-form-field">
						<label class="pwca-checkbox-row">
							<input type="checkbox" id="pw-edit-design-enabled" name="design_enabled" value="1">
							<span>Enable Setting</span>
						</label>
					</div>
				</form>
			</div>
			<footer class="modal__footer">
				<button class="button" type="button" data-micromodal-close>Cancel</button>
				<button type="submit" class="button button-primary" id="pw-edit-design-submit" form="pw-edit-design-form">Update Design</button>
			</footer>
		</div>
	</div>
</div>

<div class="modal" id="pw-add-category-modal" aria-hidden="true">
	<div class="modal__overlay" tabindex="-1" data-micromodal-close>
		<div class="modal__container" role="dialog" aria-modal="true" aria-labelledby="pw-add-category-modal-title">
			<header class="modal__header">
				<h2 class="modal__title" id="pw-add-category-modal-title">Add New Category</h2>
				<button class="modal__close" type="button" aria-label="Close modal" data-micromodal-close>&times;</button>
			</header>
			<div class="modal__content">
				<form id="pw-add-category-form">
					<input type="hidden" name="pw_add_category_nonce_field" value="<?php echo esc_attr( (string) ( $nonces['add_category'] ?? '' ) ); ?>">

					<div class="pw-form-field">
						<label for="pw-category-name">Category Name</label>
						<input type="text" id="pw-category-name" name="category_name" required placeholder="Enter category name">
					</div>

					<div class="pw-form-field">
						<label for="pw-category-type">Category Type</label>
						<select id="pw-category-type" name="category_type">
							<option value="universal">Universal</option>
							<option value="main_view">Main View</option>
							<option value="product">Product</option>
						</select>
					</div>
				</form>
			</div>
			<footer class="modal__footer">
				<button class="button" type="button" data-micromodal-close>取消</button>
				<button type="submit" class="button button-primary" id="pw-add-category-submit" form="pw-add-category-form">Add Category</button>
			</footer>
		</div>
	</div>
</div>

<div class="modal" id="pw-manage-category-modal" aria-hidden="true">
	<div class="modal__overlay" tabindex="-1" data-micromodal-close>
		<div class="modal__container pwca-manage-category-modal" role="dialog" aria-modal="true" aria-labelledby="pw-manage-category-modal-title">
			<header class="modal__header">
				<h2 class="modal__title" id="pw-manage-category-modal-title">Manage Category</h2>
				<button class="modal__close" type="button" aria-label="Close modal" data-micromodal-close>&times;</button>
			</header>
			<div class="modal__content">
				<div class="pw-category-list">
					<?php if ( ! empty( $terms ) ) : ?>
						<div class="pw-category-items">
							<?php foreach ( $terms as $term ) : ?>
								<?php if ( $term instanceof WP_Term ) : ?>
									<div class="pw-category-item" data-category-id="<?php echo esc_attr( (string) $term->term_id ); ?>">
										<input type="text" class="pw-category-name-input" value="<?php echo esc_attr( (string) $term->name ); ?>" maxlength="60">
										<span class="pw-category-settings-btn" role="button" tabindex="0" data-category-id="<?php echo esc_attr( (string) $term->term_id ); ?>">
											<span class="dashicons dashicons-admin-generic" aria-hidden="true"></span>
										</span>
										<span class="pw-category-delete-btn" role="button" tabindex="0" data-category-id="<?php echo esc_attr( (string) $term->term_id ); ?>">
											<span class="dashicons dashicons-trash" aria-hidden="true"></span>
										</span>
									</div>
								<?php endif; ?>
							<?php endforeach; ?>
						</div>
					<?php else : ?>
						<div class="pw-no-categories">
							<p>No categories found. Create your first category!</p>
						</div>
					<?php endif; ?>
				</div>
			</div>
			<footer class="modal__footer">
				<button class="button" type="button" data-micromodal-close>Close</button>
			</footer>
		</div>
	</div>
</div>

<div class="modal" id="pw-category-settings-modal" aria-hidden="true">
	<div class="modal__overlay" tabindex="-1">
		<div class="modal__container pwca-edit-design-modal" role="dialog" aria-modal="true" aria-labelledby="pw-category-settings-modal-title">
			<header class="modal__header">
				<h2 class="modal__title" id="pw-category-settings-modal-title">Category Settings</h2>
				<button class="modal__close" type="button" aria-label="Close modal" data-micromodal-close>&times;</button>
			</header>
			<div class="modal__content">
				<form id="pw-category-settings-form">
					<input type="hidden" id="pw-settings-category-id" name="category_id" value="">

					<div class="pw-form-field">
						<label for="pw-settings-category-name">Category Name</label>
						<input type="text" id="pw-settings-category-name" name="category_name" required>
					</div>

					<div class="pw-form-field">
						<label for="pw-settings-category-description">Description</label>
						<textarea id="pw-settings-category-description" name="category_description" rows="3" placeholder="Enter category description..."></textarea>
					</div>

					<div class="pw-form-field">
						<label for="pw-settings-category-type">Category Type</label>
						<select id="pw-settings-category-type" name="category_type">
							<option value="universal">Universal</option>
							<option value="main_view">Main View</option>
							<option value="product">Product</option>
						</select>
					</div>

					<div class="pw-form-field">
						<label class="pwca-checkbox-row">
							<input type="checkbox" id="pw-exclude-from-export" name="exclude_from_export" value="1">
							<span>Exclude From Export</span>
						</label>
					</div>

					<div class="pw-form-field">
						<label for="pw-layer-depth">Layer Depth</label>
						<input type="number" id="pw-layer-depth" name="layer_depth" value="-1">
					</div>

					<div class="pw-form-field">
						<label for="pw-scale-mode">Scale Mode</label>
						<select id="pw-scale-mode" name="scale_mode">
							<option value="fit">Fit</option>
							<option value="fill">Fill</option>
							<option value="stretch">Stretch</option>
							<option value="center">Center</option>
						</select>
					</div>

					<div class="pw-form-field">
						<label class="pwca-checkbox-row">
							<input type="checkbox" id="pw-allow-resize" name="allow_resize" value="1">
							<span>Allow Resize</span>
						</label>
					</div>

					<div class="pw-form-field">
						<label class="pwca-checkbox-row">
							<input type="checkbox" id="pw-allow-rotate" name="allow_rotate" value="1">
							<span>Allow Rotate</span>
						</label>
					</div>

					<div class="pw-form-field">
						<label class="pwca-checkbox-row">
							<input type="checkbox" id="pw-allow-delete" name="allow_delete" value="1">
							<span>Allow Delete</span>
						</label>
					</div>

					<div class="pw-form-field">
						<label for="pw-base-price">Base Price</label>
						<input type="number" id="pw-base-price" name="base_price" step="0.01" min="0" placeholder="0.00">
					</div>

					<div class="pw-form-field">
						<label for="pw-price-per-unit">Price Per Unit</label>
						<input type="number" id="pw-price-per-unit" name="price_per_unit" step="0.01" min="0" placeholder="0.00">
					</div>

					<div class="pw-form-field">
						<label class="pwca-checkbox-row">
							<input type="checkbox" id="pw-price-enabled" name="price_enabled" value="1">
							<span>Enable Pricing</span>
						</label>
					</div>
				</form>
			</div>
			<footer class="modal__footer">
				<button class="button" type="button" data-micromodal-close>Cancel</button>
				<button type="submit" class="button button-primary" id="pw-settings-save" form="pw-category-settings-form">Update Category</button>
			</footer>
		</div>
	</div>
</div>
