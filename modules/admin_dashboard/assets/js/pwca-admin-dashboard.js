(() => {
	const root = document.querySelector('.pwca-admin-dashboard')
	if (!root) return

	const ajaxUrl = root.dataset.ajaxUrl || ''
	const saveTokenNonce = root.dataset.saveTokenNonce || ''
	const productRequestNonce = root.dataset.productRequestNonce || ''

	const buildNotice = (type, message) => {
		const notice = document.createElement('div')
		notice.className = `notice notice-${type} is-dismissible`

		const paragraph = document.createElement('p')
		paragraph.textContent = message
		notice.appendChild(paragraph)

		return notice
	}

	const setNotice = (container, type, message) => {
		if (!container) return
		container.innerHTML = ''
		container.appendChild(buildNotice(type, message))
	}

	const postUrlEncoded = async (data) => {
		if (!ajaxUrl) throw new Error('ajaxurl missing')

		const body = new URLSearchParams()
		Object.entries(data).forEach(([key, value]) => {
			if (value === undefined || value === null) return
			body.append(key, String(value))
		})

		const response = await fetch(ajaxUrl, {
			method: 'POST',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
			},
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
		if (!ajaxUrl) throw new Error('ajaxurl missing')

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

	const initTokenConnect = () => {
		const tokenInput = document.getElementById('pwca-token-input')
		const connectButton = document.getElementById('pwca-token-connect')
		const statusContainer = document.getElementById('pwca-token-status')

		if (!tokenInput || !connectButton || !statusContainer) return

		const setBusy = (busy) => {
			connectButton.disabled = busy
			connectButton.textContent = busy ? 'Verifying...' : 'Connect'
		}

		connectButton.addEventListener('click', async () => {
			const token = tokenInput.value.trim()
			if (!token) {
				setNotice(statusContainer, 'error', '请输入Token')
				return
			}

			setBusy(true)
			statusContainer.innerHTML = ''

			try {
				const response = await postUrlEncoded({
					action: 'pw_proxy_api_request',
					endpoint: 'auth/user-info',
					token,
				})

				const isValid =
					response &&
					response.code === 200 &&
					response.message === 'success' &&
					response.data &&
					response.data.user_id === 1 &&
					String(response.data.team) === '1'

				if (!isValid) {
					setNotice(statusContainer, 'error', '验证失败: 无效的响应格式')
					return
				}

				const saveResult = await postUrlEncoded({
					action: 'pw_save_token',
					token,
					nonce: saveTokenNonce,
				})

				if (saveResult && saveResult.success) {
					setNotice(statusContainer, 'success', '验证成功，Token已保存')
					return
				}

				setNotice(statusContainer, 'warning', '验证成功，但Token保存失败')
			} catch (error) {
				setNotice(statusContainer, 'error', `验证失败: ${error instanceof Error ? error.message : '未知错误'}`)
			} finally {
				setBusy(false)
			}
		})
	}

	const initImportProgress = () => {
		const progressBar = document.getElementById('pwca-progress-bar')
		const progressText = document.getElementById('pwca-progress-text')
		if (!progressBar || !progressText) return

		let isPolling = false

		const updateProgress = async () => {
			if (isPolling) return
			isPolling = true

			try {
				const data = await postUrlEncoded({ action: 'check_import_progress' })
				const total = typeof data?.total === 'number' ? data.total : 0
				const completed = typeof data?.completed === 'number' ? data.completed : 0
				const percentage = total > 0 ? (completed / total) * 100 : 0

				progressBar.style.width = `${percentage}%`
				progressText.textContent = `${completed}/${total}`

				if (completed < total) {
					window.setTimeout(updateProgress, 1000)
				}
			} catch {
			} finally {
				isPolling = false
			}
		}

		updateProgress()
	}

	

	const initSettingsTab = () => {
		const reconnectButton = document.getElementById('pwca-reconnect-button')
		if (reconnectButton) {
			reconnectButton.addEventListener('click', () => {
				window.alert('重新连接功能将在此处实现')
			})
		}

		if (window.jQuery && window.jQuery.fn && window.jQuery.fn.wpColorPicker) {
			const colorInputs = document.querySelectorAll('.pwca-color-picker')
			colorInputs.forEach((input) => {
				window.jQuery(input).wpColorPicker()
			})
		}
	}

	const initProductRequest = () => {
		const form = document.getElementById('pwca-product-request-form')
		const fileInput = document.getElementById('pwca-product-image')
		const preview = document.getElementById('pwca-image-preview')
		const submitButton = document.getElementById('pwca-product-request-submit')
		const messages = document.getElementById('pwca-form-messages')

		if (!form || !messages || !submitButton) return

		const setBusy = (busy) => {
			submitButton.disabled = busy
			submitButton.textContent = busy ? 'Submitting...' : 'Submit'
		}

		if (fileInput && preview) {
			fileInput.addEventListener('change', () => {
				const file = fileInput.files && fileInput.files[0]
				if (!file) return

				const reader = new FileReader()
				reader.onload = () => {
					const img = document.createElement('img')
					img.src = String(reader.result || '')
					img.alt = '预览图片'
					preview.innerHTML = ''
					preview.appendChild(img)
				}
				reader.readAsDataURL(file)
			})
		}

		form.addEventListener('submit', async (event) => {
			event.preventDefault()

			const formData = new FormData(form)
			formData.append('action', 'pw_submit_product_request')
			if (!formData.get('nonce')) formData.set('nonce', productRequestNonce)

			setBusy(true)

			try {
				const response = await postFormData(formData)
				messages.hidden = false

				if (response?.success) {
					setNotice(messages, 'success', String(response.data || '提交成功'))
					form.reset()
					if (preview) preview.innerHTML = ''
				} else {
					setNotice(messages, 'error', String(response?.data || '提交失败'))
				}
			} catch {
				messages.hidden = false
				setNotice(messages, 'error', '提交失败: 网络错误')
			} finally {
				setBusy(false)
			}
		})
	}

	initTokenConnect()
	initImportProgress()
	initSettingsTab()
	initProductRequest()
})()

