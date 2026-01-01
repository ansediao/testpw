(function( $ ) {
	'use strict';

	/**
	 * Custom Admin Menu Logic
	 * Handles the 3rd level menu for Design Library -> Designs, Tags
	 */
	$(document).ready(function() {
		// Target the Design Library menu item
		// The menu link is usually 'admin.php?page=pw-design-library'
		var $menuLink = $('#adminmenu a[href="admin.php?page=pw-design-library"]');
		
		if ($menuLink.length) {
			var $menuItem = $menuLink.parent('li');
			
			// Create the toggle icon
			// dashicons-arrow-down-alt2 is a standard WP dashicon
			var $toggle = $('<span class="pw-menu-toggle dashicons dashicons-arrow-down-alt2"></span>');
			
			// Create the submenu container
			var $submenu = $('<ul class="pw-admin-submenu"></ul>');
			
			// Create the Designs menu item (this one points to the main page)
			var $designsItem = $('<li><a href="admin.php?page=pw-design-library">Designs</a></li>');

			// Create the Tags menu item
			var $tagsItem = $('<li><a href="edit-tags.php?taxonomy=pw_design_tag">Tags</a></li>');
			
			$submenu.append($designsItem);
			$submenu.append($tagsItem);
			
			// Append toggle to the link and submenu to the list item
			$menuLink.append($toggle);
			$menuItem.append($submenu);

			// Check current URL to determine active state
			var currentUrl = window.location.href;
			var isTagsPage = currentUrl.indexOf('taxonomy=pw_design_tag') > -1;
			var isDesignsPage = currentUrl.indexOf('page=pw-design-library') > -1;
			
			// Auto-expand if we are in any of the sub-pages
			if (isTagsPage || isDesignsPage) {
				$menuItem.addClass('pw-expanded current'); 
				// We keep the parent active, but maybe we want to visually deemphasize the parent link if it's just a toggle now?
				// Actually, WP keeps the parent active. We just need to highlight the correct sub-item.
				$submenu.show();
				
				if (isTagsPage) {
					$tagsItem.find('a').css('color', '#fff').css('font-weight', '600');
					$menuLink.removeClass('current'); // Remove highlight from parent if on tags
				} else if (isDesignsPage) {
					$designsItem.find('a').css('color', '#fff').css('font-weight', '600');
					// Parent is naturally highlighted by WP, which is fine, or we can remove it to make it look like a pure container
					// $menuLink.removeClass('current'); 
				}
			}

			// Handle click event on the PARENT link (Design Library)
			// User wants the parent link to ONLY toggle the menu, not navigate
			$menuLink.on('click', function(e) {
				// Check if the click was on the link itself (or its children, including the toggle)
				// We prevent default navigation
				e.preventDefault();
				
				$menuItem.toggleClass('pw-expanded');
				$submenu.slideToggle(200);
			});

			// Note: We don't need a separate click handler for $toggle anymore because it's inside $menuLink 
			// and the event will bubble up, or we can just handle the link click.
			// However, if the user clicks the toggle specifically, it might bubble to the link handler which is fine.
		}
	});

})( jQuery );
