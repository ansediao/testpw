(() => {
	const root = document.querySelector('.pwca-admin-design')
	if (!root) return

	const appEl = document.getElementById('pw-design-app')
	if (appEl) {
		appEl.hidden = true
		appEl.setAttribute('aria-busy', 'true')
	}

	let loadingEl = document.getElementById('pwca-design-library-loading')
	if (!loadingEl && appEl) {
		loadingEl = document.createElement('div')
		loadingEl.id = 'pwca-design-library-loading'
		loadingEl.className = 'pwca-design-library-loading'
		loadingEl.innerHTML = '<span class="spinner is-active" aria-hidden="true"></span>'
		appEl.insertAdjacentElement('beforebegin', loadingEl)
	}

	const fail = (message) => {
		if (loadingEl) loadingEl.remove()
		if (!appEl) return
		appEl.hidden = false
		appEl.setAttribute('aria-busy', 'false')
		appEl.innerHTML = `<div class="notice notice-error"><p>${String(message || 'Design Library 初始化失败，请刷新页面后重试。')}</p></div>`
	}

	const dataNode = document.getElementById('pwca-design-library-data')
	if (!dataNode) {
		fail('Design Library 数据节点缺失，请刷新页面后重试。')
		return
	}

	let payload = null
	try {
		payload = JSON.parse(dataNode.value || dataNode.textContent || '{}')
	} catch {
		payload = null
	}

	if (!payload) {
		fail('Design Library 数据解析失败，请刷新页面后重试。')
		return
	}

	if (!window.Vue) {
		fail('Vue 未加载，Design Library 无法初始化。请检查网络或资源加载。')
		return
	}

	const { createApp, ref, computed } = window.Vue

	const dispatch = (name, detail) => {
		document.dispatchEvent(new CustomEvent(name, { detail }))
	}

	const designs = Array.isArray(payload.designs) ? payload.designs : []
	const categories = Array.isArray(payload.categories) ? payload.categories : []

	const DesignApp = {
		setup() {
			const allDesigns = ref(designs)

			const availableFieldsDef = [
				{ key: 'name', label: 'Product Name', type: 'text' },
				{
					key: 'category',
					label: 'Category Name',
					type: 'select',
					options: categories.map((c) => ({
						value: c.slug,
						label: c.name,
					})),
				},
				{ key: 'price', label: 'Price', type: 'number' },
			]

			const isFilterModalOpen = ref(false)
			const fieldSearch = ref('')
			const activeFilters = ref([])
			const tempFilters = ref([])

			const currentPage = ref(1)
			const pageSize = ref(20)
			const sortBy = ref('date_desc')

			const openFilterModal = () => {
				tempFilters.value = JSON.parse(JSON.stringify(activeFilters.value))
				fieldSearch.value = ''
				isFilterModalOpen.value = true
			}

			const closeFilterModal = () => {
				isFilterModalOpen.value = false
			}

			const applyFilters = () => {
				activeFilters.value = JSON.parse(JSON.stringify(tempFilters.value))
				currentPage.value = 1
				closeFilterModal()
			}

			const clearFilters = () => {
				tempFilters.value = []
			}

			const filteredFieldDefs = computed(() => {
				const search = String(fieldSearch.value || '').toLowerCase()
				if (!search) return availableFieldsDef
				return availableFieldsDef.filter((f) => String(f.label).toLowerCase().includes(search))
			})

			const selectedFieldKeys = computed(() => tempFilters.value.map((f) => f.key))

			const notSelectedFields = computed(() =>
				filteredFieldDefs.value.filter((f) => !selectedFieldKeys.value.includes(f.key)),
			)

			const addFilterField = (fieldDef) => {
				tempFilters.value.push({
					key: fieldDef.key,
					label: fieldDef.label,
					type: fieldDef.type,
					operator: fieldDef.type === 'text' ? 'contains' : fieldDef.type === 'select' ? 'is' : 'eq',
					value: '',
				})
			}

			const removeFilterField = (index) => {
				tempFilters.value.splice(index, 1)
			}

			const filteredDesigns = computed(() => {
				let result = allDesigns.value

				if (activeFilters.value.length > 0) {
					result = result.filter((design) =>
						activeFilters.value.every((filter) => {
							const designValue = design[filter.key]
							const filterValue = filter.value
							if (filterValue === '' || filterValue === null) return true

							switch (filter.operator) {
								case 'contains':
									return String(designValue).toLowerCase().includes(String(filterValue).toLowerCase())
								case 'not_contains':
									return !String(designValue).toLowerCase().includes(String(filterValue).toLowerCase())
								case 'is':
								case 'eq':
									return String(designValue) === String(filterValue)
								case 'is_not':
								case 'neq':
									return String(designValue) !== String(filterValue)
								case 'gt':
									return Number(designValue) > Number(filterValue)
								case 'lt':
									return Number(designValue) < Number(filterValue)
								default:
									return true
							}
						}),
					)
				}

				result = [...result].sort((a, b) => {
					if (sortBy.value === 'name_asc') return String(a.name).localeCompare(String(b.name))
					if (sortBy.value === 'name_desc') return String(b.name).localeCompare(String(a.name))
					if (sortBy.value === 'date_asc') return new Date(a.date) - new Date(b.date)
					if (sortBy.value === 'date_desc') return new Date(b.date) - new Date(a.date)
					return 0
				})

				return result
			})

			const totalPages = computed(() => Math.ceil(filteredDesigns.value.length / pageSize.value))

			const paginatedDesigns = computed(() => {
				const start = (currentPage.value - 1) * pageSize.value
				return filteredDesigns.value.slice(start, start + pageSize.value)
			})

			const changePage = (page) => {
				if (page < 1 || page > totalPages.value) return
				currentPage.value = page
				window.scrollTo({ top: 0, behavior: 'smooth' })
			}

			const selectedDesignIds = ref([])

			const allSelected = computed({
				get: () =>
					paginatedDesigns.value.length > 0 &&
					selectedDesignIds.value.length === paginatedDesigns.value.length,
				set: (val) => {
					if (val) {
						selectedDesignIds.value = paginatedDesigns.value.map((d) => d.id)
					} else {
						selectedDesignIds.value = []
					}
				},
			})

			const toggleSelection = (id) => {
				const idx = selectedDesignIds.value.indexOf(id)
				if (idx === -1) selectedDesignIds.value.push(id)
				else selectedDesignIds.value.splice(idx, 1)
			}

			const triggerEdit = (id) => dispatch('pwca:design:edit', { id })
			const triggerAddTag = (id) => dispatch('pwca:design:tags', { id })
			const triggerBulkDelete = () => dispatch('pwca:design:bulkDelete', { ids: [...selectedDesignIds.value] })
			const triggerBulkUpdate = () => dispatch('pwca:design:bulkUpdate', { ids: [...selectedDesignIds.value] })

			const isBulkUpdateModalOpen = ref(false)
			const updateFieldSearch = ref('')
			const bulkUpdateFields = ref([])

			const availableUpdateFieldsDef = [
				{ key: 'name', label: 'Name', type: 'text' },
				{ key: 'category', label: 'Category', type: 'select', options: categories.map((c) => ({ value: c.slug, label: c.name })) },
				{ key: 'price', label: 'Price', type: 'text' },
				{ key: 'status', label: 'Status', type: 'toggle' },
			]

			const openBulkUpdateModal = () => {
				updateFieldSearch.value = ''
				isBulkUpdateModalOpen.value = true
			}

			const closeBulkUpdateModal = () => {
				isBulkUpdateModalOpen.value = false
			}

			const filteredUpdateFieldDefs = computed(() => {
				const search = String(updateFieldSearch.value || '').toLowerCase()
				if (!search) return availableUpdateFieldsDef
				return availableUpdateFieldsDef.filter((f) => String(f.label).toLowerCase().includes(search))
			})

			const selectedUpdateFieldKeys = computed(() => bulkUpdateFields.value.map((f) => f.key))

			const notSelectedUpdateFields = computed(() =>
				filteredUpdateFieldDefs.value.filter((f) => !selectedUpdateFieldKeys.value.includes(f.key)),
			)

			const addBulkUpdateField = (fieldDef) => {
				bulkUpdateFields.value.push({
					key: fieldDef.key,
					label: fieldDef.label,
					type: fieldDef.type,
					value: fieldDef.type === 'toggle' ? 'draft' : '',
					options: fieldDef.options || [],
				})
			}

			const removeBulkUpdateField = (index) => {
				bulkUpdateFields.value.splice(index, 1)
			}

			const performBulkUpdate = () => {
				dispatch('pwca:design:bulkUpdate:submit', {
					ids: [...selectedDesignIds.value],
					fields: JSON.parse(JSON.stringify(bulkUpdateFields.value)),
				})
				closeBulkUpdateModal()
			}

			document.addEventListener('pwca:design:bulkUpdate:open', openBulkUpdateModal)

			return {
				availableFieldsDef,
				isFilterModalOpen,
				fieldSearch,
				tempFilters,
				notSelectedFields,
				openFilterModal,
				closeFilterModal,
				applyFilters,
				clearFilters,
				addFilterField,
				removeFilterField,
				currentPage,
				totalPages,
				paginatedDesigns,
				changePage,
				selectedDesignIds,
				allSelected,
				toggleSelection,
				triggerEdit,
				triggerAddTag,
				triggerBulkDelete,
				triggerBulkUpdate,
				isBulkUpdateModalOpen,
				updateFieldSearch,
				bulkUpdateFields,
				notSelectedUpdateFields,
				addBulkUpdateField,
				removeBulkUpdateField,
				closeBulkUpdateModal,
				performBulkUpdate,
			}
		},
	}

	try {
		createApp(DesignApp).mount('#pwca-design-app')
		if (loadingEl) loadingEl.remove()
		if (appEl) {
			appEl.hidden = false
			appEl.setAttribute('aria-busy', 'false')
		}
	} catch (err) {
		console.error(err)
		fail('Design Library 初始化异常，请刷新页面后重试。')
	}
})()

