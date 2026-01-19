(($) => {
	const root = document.querySelector('.pwca-admin-design')
	if (!root) return

	const ajaxUrl = root.dataset.ajaxUrl || ''
	const addCategoryNonce = root.dataset.addCategoryNonce || ''
	const addDesignNonce = root.dataset.addDesignNonce || ''
	const bulkDeleteNonce = root.dataset.bulkDeleteNonce || ''
	const bulkUpdateNonce = root.dataset.bulkUpdateNonce || ''
	const adminNonce = root.dataset.adminNonce || ''

	const postUrlEncoded = async (data) => {
		const body = new URLSearchParams()
		Object.entries(data).forEach(([key, value]) => {
			if (value === undefined || value === null) return
			body.append(key, String(value))
		})

		const response = await fetch(ajaxUrl, {
			method: 'POST',
			credentials: 'same-origin',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
			body,
		})

		const text = await response.text()
		try {
			return JSON.parse(text)
		} catch {
			throw new Error(text)
		}
	}

	const postFormData = async (formData) => {
		const response = await fetch(ajaxUrl, {
			method: 'POST',
			credentials: 'same-origin',
			body: formData,
		})

		const text = await response.text()
		try {
			return JSON.parse(text)
		} catch {
			throw new Error(text)
		}
	}

	const pwcaToggleBodyScroll = (disable) => {
		if (!document || !document.body) return
		if (disable) {
			document.body.classList.add('modal-open')
		} else {
			document.body.classList.remove('modal-open')
		}
	}

	let pwcaActiveModalId = null

	const showModal = (id) => {
		const modal = document.getElementById(id)
		if (!modal) return
		pwcaActiveModalId = id
		modal.classList.add('is-open')
		modal.setAttribute('aria-hidden', 'false')
		pwcaToggleBodyScroll(true)

		const focusable = modal.querySelector(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		)
		if (focusable) {
			try {
				focusable.focus()
			} catch {
			}
		}
	}

	const closeModal = (id) => {
		const targetId = id || pwcaActiveModalId
		if (!targetId) return
		const modal = document.getElementById(targetId)
		if (!modal) return
		modal.classList.remove('is-open')
		modal.setAttribute('aria-hidden', 'true')
		pwcaToggleBodyScroll(false)
		if (!id || id === pwcaActiveModalId) {
			pwcaActiveModalId = null
		}
	}

	// 暴露公共方法，便于其他脚本复用
	window.pwcaAdminShowModal = showModal
	window.pwcaAdminCloseModal = closeModal

	const initMicroModal = () => {
		document.addEventListener('click', (event) => {
			const trigger = event.target.closest('[data-micromodal-close]')
			if (!trigger) return
			const modal = trigger.closest('.modal')
			if (!modal || !modal.id) return
			closeModal(modal.id)
		})

		document.addEventListener('keydown', (event) => {
			if (event.key !== 'Escape') return
			if (!pwcaActiveModalId) return
			closeModal(pwcaActiveModalId)
		})
	}

	const bindCategoryFilterAutoSubmit = () => {
		const select = document.getElementById('pwca-design-category-filter')
		const form = document.getElementById('pwca-design-category-filter-form')
		if (!select || !form) return
		select.addEventListener('change', () => form.submit())
	}

	const bindDeleteConfirm = () => {
		document.addEventListener('click', (event) => {
			const link = event.target.closest('.pw-delete-design-link')
			if (!link) return
			const ok = window.confirm('Are you sure?')
			if (!ok) {
				event.preventDefault()
			}
		})
	}

	const bindAddDesignModal = () => {
		$('#pw-add-design-btn').on('click', (event) => {
			event.preventDefault()
			showModal('pw-add-design-modal')
		})
	}

	const bindAddCategoryModal = () => {
		$('#pw-add-category-btn').on('click', (event) => {
			event.preventDefault()
			showModal('pw-add-category-modal')
		})
	}

	const bindManageCategoryModal = () => {
		$('#pw-manage-category-btn').on('click', (event) => {
			event.preventDefault()
			showModal('pw-manage-category-modal')
		})
	}

	const bindImagePreview = () => {
		const fileInput = document.getElementById('pw-design-image')
		const previewImg = document.getElementById('pw-preview-img')
		const fileName = document.getElementById('pw-file-name')
		const uploadPlaceholder = document.getElementById('pw-upload-placeholder')
		const imagePreview = document.getElementById('pw-image-preview')
		const removeButton = document.getElementById('pw-remove-image')

		if (!fileInput) return

		fileInput.addEventListener('change', () => {
			const file = fileInput.files && fileInput.files[0]
			if (!file) return

			const reader = new FileReader()
			reader.onload = () => {
				if (previewImg) previewImg.src = String(reader.result || '')
				if (fileName) fileName.textContent = file.name
				if (uploadPlaceholder) uploadPlaceholder.style.display = 'none'
				if (imagePreview) imagePreview.style.display = 'block'
			}
			reader.readAsDataURL(file)
		})

		if (removeButton) {
			removeButton.addEventListener('click', (event) => {
				event.preventDefault()
				fileInput.value = ''
				if (uploadPlaceholder) uploadPlaceholder.style.display = 'block'
				if (imagePreview) imagePreview.style.display = 'none'
			})
		}
	}

	const bindAddDesignSubmit = () => {
		const form = document.getElementById('pw-add-design-form')
		const submitButton = document.getElementById('pw-add-design-submit')
		if (!form || !submitButton) return

		submitButton.addEventListener('click', async (event) => {
			event.preventDefault()
			const formData = new FormData(form)
			formData.append('action', 'pw_add_design')

			submitButton.disabled = true
			try {
				const response = await postFormData(formData)
				if (response && response.success) {
					window.location.reload()
					return
				}
				window.alert(`添加失败: ${response?.data || '未知错误'}`)
			} catch (error) {
				window.alert(`添加失败: ${error instanceof Error ? error.message : '未知错误'}`)
			} finally {
				submitButton.disabled = false
				closeModal('pw-add-design-modal')
			}
		})
	}

	const openTagModal = async (designId) => {
		const body = document.getElementById('pw-tag-modal-body')
		const idInput = document.getElementById('pw-tag-modal-design-id')
		if (!body || !idInput) return

		idInput.value = String(designId)
		body.textContent = 'Loading...'
		showModal('pw-tag-modal')

		try {
			const response = await postUrlEncoded({
				action: 'pw_get_design_tags',
				design_id: designId,
				nonce: addDesignNonce,
			})

			if (!response?.success) {
				body.textContent = `加载失败: ${response?.data || '未知错误'}`
				return
			}

			const tags = Array.isArray(response.data?.tags) ? response.data.tags : []
			body.innerHTML = ''
			tags.forEach((tag) => {
				const label = document.createElement('label')
				label.className = 'pwca-tag-option'

				const checkbox = document.createElement('input')
				checkbox.type = 'checkbox'
				checkbox.name = 'design_tags[]'
				checkbox.value = String(tag.id)
				checkbox.checked = Boolean(tag.checked)

				label.appendChild(checkbox)
				label.appendChild(document.createTextNode(` ${tag.name}`))
				body.appendChild(label)
			})
		} catch (error) {
			body.textContent = `加载失败: ${error instanceof Error ? error.message : '未知错误'}`
		}
	}

	const bindTagModalSave = () => {
		const saveButton = document.getElementById('pw-tag-modal-save')
		const idInput = document.getElementById('pw-tag-modal-design-id')
		const body = document.getElementById('pw-tag-modal-body')
		if (!saveButton || !idInput || !body) return

		saveButton.addEventListener('click', async () => {
			const designId = Number(idInput.value)
			const selected = [...body.querySelectorAll('input[type="checkbox"]:checked')].map((el) => Number(el.value))

			saveButton.disabled = true
			try {
				const response = await postUrlEncoded({
					action: 'pw_save_design_tags',
					design_id: designId,
					tags: selected,
					nonce: addDesignNonce,
				})

				if (response?.success) {
					window.location.reload()
					return
				}

				window.alert(`保存失败: ${response?.data || '未知错误'}`)
			} catch (error) {
				window.alert(`保存失败: ${error instanceof Error ? error.message : '未知错误'}`)
			} finally {
				saveButton.disabled = false
				closeModal('pw-tag-modal')
			}
		})
	}

	const openEditDesignModal = async (designId) => {
		const idInput = document.getElementById('pw-edit-design-id')
		const nameInput = document.getElementById('pw-edit-design-name')
		const descriptionInput = document.getElementById('pw-edit-design-description')
		const categorySelect = document.getElementById('pw-edit-design-category')
		const tagsInput = document.getElementById('pw-edit-design-tags')
		const enabledInput = document.getElementById('pw-edit-design-enabled')

		if (!idInput || !nameInput || !descriptionInput || !categorySelect || !tagsInput || !enabledInput) return

		idInput.value = String(designId)
		showModal('pw-edit-design-modal')

		try {
			const response = await postUrlEncoded({
				action: 'pw_get_design_data',
				design_id: designId,
				nonce: adminNonce,
			})

			if (!response?.success) {
				window.alert(`加载失败: ${response?.data || '未知错误'}`)
				return
			}

			const data = response.data
			nameInput.value = String(data.name || '')
			descriptionInput.value = String(data.description || '')
			tagsInput.value = String(data.tags || '')
			enabledInput.checked = Boolean(data.enabled)

			categorySelect.innerHTML = '<option value="">Select Category</option>'
			const categories = Array.isArray(data.categories) ? data.categories : []
			categories.forEach((c) => {
				const option = document.createElement('option')
				option.value = String(c.id)
				option.textContent = String(c.name)
				if (Number(data.current_category) === Number(c.id)) option.selected = true
				categorySelect.appendChild(option)
			})
		} catch (error) {
			window.alert(`加载失败: ${error instanceof Error ? error.message : '未知错误'}`)
		}
	}

	const bindEditDesignSubmit = () => {
		const form = document.getElementById('pw-edit-design-form')
		const submitButton = document.getElementById('pw-edit-design-submit')
		if (!form || !submitButton) return

		submitButton.addEventListener('click', async (event) => {
			event.preventDefault()
			const formData = new FormData(form)
			formData.append('action', 'pw_update_design_meta')
			formData.append('nonce', adminNonce)

			submitButton.disabled = true
			try {
				const response = await postFormData(formData)
				if (response?.success) {
					window.location.reload()
					return
				}
				window.alert(`更新失败: ${response?.data || '未知错误'}`)
			} catch (error) {
				window.alert(`更新失败: ${error instanceof Error ? error.message : '未知错误'}`)
			} finally {
				submitButton.disabled = false
				closeModal('pw-edit-design-modal')
			}
		})
	}

	const bindAddCategorySubmit = () => {
		const form = document.getElementById('pw-add-category-form')
		const submitButton = document.getElementById('pw-add-category-submit')
		if (!form || !submitButton) return

		submitButton.addEventListener('click', async (event) => {
			event.preventDefault()
			const nameInput = form.querySelector('input[name="category_name"]')
			const typeInput = form.querySelector('select[name="category_type"]')
			const categoryName = nameInput ? nameInput.value.trim() : ''
			const categoryType = typeInput ? typeInput.value : 'general'

			if (!categoryName) {
				window.alert('分类名称不能为空')
				return
			}

			submitButton.disabled = true
			try {
				const response = await postUrlEncoded({
					action: 'pw_add_category',
					category_name: categoryName,
					category_type: categoryType,
					nonce: addCategoryNonce,
				})

				if (response?.success) {
					window.location.reload()
					return
				}

				window.alert(`创建失败: ${response?.data || '未知错误'}`)
			} catch (error) {
				window.alert(`创建失败: ${error instanceof Error ? error.message : '未知错误'}`)
			} finally {
				submitButton.disabled = false
				closeModal('pw-add-category-modal')
			}
		})
	}

	const bindManageCategoryActions = () => {
		const openCategorySettingsModal = async (categoryId) => {
			const idInput = document.getElementById('pw-settings-category-id')
			const nameInput = document.getElementById('pw-settings-category-name')
			const descriptionInput = document.getElementById('pw-settings-category-description')
			const typeSelect = document.getElementById('pw-settings-category-type')
			const excludeExport = document.getElementById('pw-exclude-from-export')
			const layerDepth = document.getElementById('pw-layer-depth')
			const scaleMode = document.getElementById('pw-scale-mode')
			const allowResize = document.getElementById('pw-allow-resize')
			const allowRotate = document.getElementById('pw-allow-rotate')
			const allowDelete = document.getElementById('pw-allow-delete')
			const basePrice = document.getElementById('pw-base-price')
			const pricePerUnit = document.getElementById('pw-price-per-unit')
			const priceEnabled = document.getElementById('pw-price-enabled')

			if (
				!idInput ||
				!nameInput ||
				!descriptionInput ||
				!typeSelect ||
				!excludeExport ||
				!layerDepth ||
				!scaleMode ||
				!allowResize ||
				!allowRotate ||
				!allowDelete ||
				!basePrice ||
				!pricePerUnit ||
				!priceEnabled
			) {
				return
			}

			idInput.value = String(categoryId)
			showModal('pw-category-settings-modal')

			try {
				const response = await postUrlEncoded({
					action: 'pw_get_category_settings',
					category_id: categoryId,
					nonce: addCategoryNonce,
				})

				if (!response?.success) {
					window.alert(`加载失败: ${response?.data || '未知错误'}`)
					return
				}

				const data = response.data || {}
				nameInput.value = String(data.name || '')
				descriptionInput.value = String(data.description || '')
				typeSelect.value = String(data.type || 'general')
				excludeExport.checked = Boolean(data.exclude_from_export)
				layerDepth.value = String(data.layer_depth ?? -1)
				scaleMode.value = String(data.scale_mode || 'fit')
				allowResize.checked = Boolean(data.allow_resize)
				allowRotate.checked = Boolean(data.allow_rotate)
				allowDelete.checked = Boolean(data.allow_delete)
				basePrice.value = String(data.base_price ?? '')
				pricePerUnit.value = String(data.price_per_unit ?? '')
				priceEnabled.checked = Boolean(data.price_enabled)
			} catch (error) {
				window.alert(`加载失败: ${error instanceof Error ? error.message : '未知错误'}`)
			}
		}

		$(document).on('click', '.pw-category-delete-btn', async function (event) {
			event.preventDefault()
			const categoryId = Number($(this).data('category-id'))
			if (!categoryId) return

			const ok = window.confirm('Are you sure you want to delete this category? This action cannot be undone.')
			if (!ok) return

			try {
				const response = await postUrlEncoded({
					action: 'pw_delete_category',
					category_id: categoryId,
					nonce: addCategoryNonce,
				})

				if (response?.success) {
					window.location.reload()
					return
				}
				window.alert(`Delete failed: ${response?.data || '未知错误'}`)
			} catch (error) {
				window.alert(`Delete failed: ${error instanceof Error ? error.message : '未知错误'}`)
			}
		})

		$(document).on('click', '.pw-category-settings-btn', function (event) {
			event.preventDefault()
			const categoryId = Number($(this).data('category-id'))
			if (!categoryId) return
			openCategorySettingsModal(categoryId)
		})
	}

	const bindCategorySettingsSave = () => {
		const form = document.getElementById('pw-category-settings-form')
		const submitButton = document.getElementById('pw-settings-save')
		if (!form || !submitButton) return

		submitButton.addEventListener('click', async (event) => {
			event.preventDefault()
			const formData = new FormData(form)
			const categoryId = Number(formData.get('category_id') || 0)
			if (!categoryId) {
				window.alert('无效的分类ID')
				return
			}

			formData.append('action', 'pw_update_category_settings')
			formData.append('nonce', addCategoryNonce)

			submitButton.disabled = true
			try {
				const response = await postFormData(formData)
				if (response?.success) {
					window.location.reload()
					return
				}
				window.alert(`更新失败: ${response?.data || '未知错误'}`)
			} catch (error) {
				window.alert(`更新失败: ${error instanceof Error ? error.message : '未知错误'}`)
			} finally {
				submitButton.disabled = false
				closeModal('pw-category-settings-modal')
			}
		})
	}

	const bindCustomEvents = () => {
		document.addEventListener('pwca:design:tags', (event) => {
			const designId = Number(event.detail?.id)
			if (!designId) return
			openTagModal(designId)
		})

		document.addEventListener('pwca:design:edit', (event) => {
			const designId = Number(event.detail?.id)
			if (!designId) return
			openEditDesignModal(designId)
		})

		document.addEventListener('pwca:design:bulkDelete', (event) => {
			const ids = Array.isArray(event.detail?.ids) ? event.detail.ids : []
			if (ids.length === 0) return

			const ok = window.confirm(`确定要删除选中的 ${ids.length} 个设计吗？`)
			if (!ok) return

			postUrlEncoded({
				action: 'pw_bulk_delete_designs',
				ids,
				nonce: bulkDeleteNonce,
			})
				.then((response) => {
					if (response?.success) window.location.reload()
					else window.alert(`删除失败: ${response?.data || '未知错误'}`)
				})
				.catch((error) => {
					window.alert(`删除失败: ${error instanceof Error ? error.message : '未知错误'}`)
				})
		})

		document.addEventListener('pwca:design:bulkUpdate', (event) => {
			const ids = Array.isArray(event.detail?.ids) ? event.detail.ids : []
			if (ids.length === 0) return
			document.dispatchEvent(new CustomEvent('pwca:design:bulkUpdate:open'))
		})

		document.addEventListener('pwca:design:bulkUpdate:submit', (event) => {
			const ids = Array.isArray(event.detail?.ids) ? event.detail.ids : []
			const fields = Array.isArray(event.detail?.fields) ? event.detail.fields : []
			if (ids.length === 0 || fields.length === 0) return

			postUrlEncoded({
				action: 'pw_bulk_update_designs',
				ids,
				fields: JSON.stringify(fields),
				nonce: bulkUpdateNonce,
			})
				.then((response) => {
					if (response?.success) window.location.reload()
					else window.alert(`更新失败: ${response?.data || '未知错误'}`)
				})
				.catch((error) => {
					window.alert(`更新失败: ${error instanceof Error ? error.message : '未知错误'}`)
				})
		})
	}

	$(() => {
		if (!ajaxUrl) return
		initMicroModal()
		bindCategoryFilterAutoSubmit()
		bindDeleteConfirm()
		bindAddDesignModal()
		bindAddCategoryModal()
		bindManageCategoryModal()
		bindImagePreview()
		bindAddDesignSubmit()
		bindAddCategorySubmit()
		bindTagModalSave()
		bindEditDesignSubmit()
		bindManageCategoryActions()
		bindCategorySettingsSave()
		bindCustomEvents()
	})
})(window.jQuery)
