(() => {
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

	const initMicroModal = () => {
		document.addEventListener('click', (event) => {
			const trigger = event.target.closest('[data-micromodal-close]')
			if (!trigger) return
			if (trigger.classList.contains('modal__overlay') && trigger !== event.target) return
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

	const renderViewImages = (viewImages, productName) => {
		if (!Array.isArray(viewImages) || viewImages.length === 0) {
			return '<p class="pwca-view-design-empty">No design images available</p>'
		}

		const blocks = viewImages.map((vm) => {
			if (!vm || typeof vm !== 'object') return ''

			const viewId = vm.view_id || vm.id || ''
			const viewName = vm.view_name || vm.name || viewId || 'View'
			const images = Array.isArray(vm.images) ? vm.images : []

			if (images.length === 0) return ''

			const imageTags = images.map((url, idx) => {
				const label = images.length === 2 && idx === 0 ? 'Print File' : 'Mockup'
				const labelClass = images.length === 2 && idx === 0 ? 'pwca-image-label-print' : 'pwca-image-label-mockup'
				return `
					<div class="pwca-view-design-image-item">
						<img src="${url}" alt="${viewName} - ${label}" loading="lazy">
						<span class="pwca-view-design-image-label ${labelClass}">${label}</span>
					</div>
				`
			}).join('')

			return `
				<div class="pwca-view-design-block">
					<h4 class="pwca-view-design-view-name">${viewName}</h4>
					<div class="pwca-view-design-images">${imageTags}</div>
				</div>
			`
		}).filter(Boolean).join('')

		return blocks || '<p class="pwca-view-design-empty">No design images available</p>'
	}

	const openViewDesignModal = (button) => {
		const productName = button.dataset.productName || 'Product'
		const productId = button.dataset.productId || ''
		const itemId = button.dataset.itemId || ''

		let viewImages = []
		try {
			viewImages = JSON.parse(button.dataset.viewImages || '[]')
		} catch (e) {
			viewImages = []
		}

		const modalTitle = document.getElementById('pwca-view-design-modal-title')
		const modalBody = document.getElementById('pwca-view-design-modal-body')

		if (modalTitle) {
			modalTitle.textContent = `Design Preview - ${productName}`
		}

		if (modalBody) {
			modalBody.innerHTML = renderViewImages(viewImages, productName)
		}

		showModal('pwca-view-design-modal')
	}

	const bindViewDesignButtons = () => {
		document.addEventListener('click', (event) => {
			const button = event.target.closest('.pwca-admin-orders-view-design')
			if (!button) return
			event.preventDefault()
			openViewDesignModal(button)
		})
	}

	const init = () => {
		initMicroModal()
		bindViewDesignButtons()
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init)
	} else {
		init()
	}
})()
