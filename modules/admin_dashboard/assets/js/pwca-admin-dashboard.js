(() => {
	const root = document.querySelector('.pwca-admin-dashboard')
	if (!root) return

	const ajaxUrl = root.dataset.ajaxUrl || ''
	const restProductBase = root.dataset.restProductBase || ''
	const saveTokenNonce = root.dataset.saveTokenNonce || ''
	const clearCacheNonce = root.dataset.clearCacheNonce || ''
	const cacheStatusNonce = root.dataset.cacheStatusNonce || ''
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

	const initCacheManagement = () => {
		const cacheInfo = document.getElementById('pwca-cache-info')
		const totalCached = document.getElementById('pwca-total-cached')
		const expiredCount = document.getElementById('pwca-expired-count')
		const latestCacheTime = document.getElementById('pwca-latest-cache-time')
		const cacheExpiry = document.getElementById('pwca-cache-expiry')
		const refreshButton = document.getElementById('pwca-refresh-cache-status')
		const specificIdInput = document.getElementById('pwca-specific-product-id')
		const clearSpecificButton = document.getElementById('pwca-clear-specific-cache')
		const clearAllButton = document.getElementById('pwca-clear-all-cache')
		const testIdInput = document.getElementById('pwca-test-product-id')
		const testButton = document.getElementById('pwca-test-cache')
		const resultContainer = document.getElementById('pwca-cache-operation-result')

		if (!refreshButton || !clearSpecificButton || !clearAllButton) return

		const loadCacheStatus = async () => {
			try {
				const response = await postUrlEncoded({
					action: 'pw_get_cache_status',
					nonce: cacheStatusNonce,
				})

				if (!response?.success) {
					if (cacheInfo) setNotice(cacheInfo, 'error', `加载缓存状态失败: ${response?.data || '未知错误'}`)
					return
				}

				if (totalCached) totalCached.textContent = String(response.data.total_cached ?? '')
				if (expiredCount) expiredCount.textContent = String(response.data.expired_count ?? '')
				if (latestCacheTime) latestCacheTime.textContent = String(response.data.latest_cache_time ?? '')
				if (cacheExpiry) cacheExpiry.textContent = `${String(response.data.cache_expiry_minutes ?? 30)}分钟`
			} catch {
				if (cacheInfo) setNotice(cacheInfo, 'error', '加载缓存状态失败: 网络错误')
			}
		}

		const clearCache = async (productId) => {
			if (!resultContainer) return

			try {
				const payload = {
					action: 'pw_clear_product_cache',
					nonce: clearCacheNonce,
				}

				if (productId) payload.product_id = productId

				const response = await postUrlEncoded(payload)
				if (response?.success) {
					const message = response?.data?.message ? String(response.data.message) : '操作成功'
					setNotice(resultContainer, 'success', message)
					await loadCacheStatus()
					return
				}

				setNotice(resultContainer, 'error', `操作失败: ${response?.data || '未知错误'}`)
			} catch {
				setNotice(resultContainer, 'error', '操作失败: 网络错误')
			}
		}

		refreshButton.addEventListener('click', loadCacheStatus)

		clearSpecificButton.addEventListener('click', async () => {
			if (!specificIdInput) return
			const value = specificIdInput.value.trim()
			if (!value) {
				window.alert('请输入产品ID')
				return
			}
			await clearCache(value)
			specificIdInput.value = ''
		})

		clearAllButton.addEventListener('click', async () => {
			const confirmed = window.confirm('确定要清除所有产品缓存吗？')
			if (!confirmed) return
			await clearCache('')
		})

		const testCache = async () => {
			if (!resultContainer || !testIdInput || !testIdInput.value.trim()) {
				window.alert('请输入产品ID')
				return
			}

			const productId = testIdInput.value.trim()
			resultContainer.innerHTML = ''
			resultContainer.appendChild(buildNotice('info', '正在测试缓存功能...'))

			const url = `${restProductBase}${encodeURIComponent(productId)}`

			const fetchJson = async () => {
				const start = performance.now()
				const response = await fetch(url, { credentials: 'same-origin' })
				const data = await response.json()
				const timeMs = Math.round(performance.now() - start)
				return { data, timeMs }
			}

			try {
				const first = await fetchJson()
				const second = await fetchJson()

				const wrapper = document.createElement('div')
				wrapper.appendChild(buildNotice('success', '缓存测试结果'))

				const details = document.createElement('div')
				details.className = 'pwca-admin-dashboard__cache-test-details'

				const line1 = document.createElement('p')
				line1.innerHTML = `<strong>第一次调用 (API):</strong> ${first.timeMs}ms`
				const line2 = document.createElement('p')
				line2.innerHTML = `<strong>第二次调用 (缓存):</strong> ${second.timeMs}ms`

				const improvement = first.timeMs > 0 ? (((first.timeMs - second.timeMs) / first.timeMs) * 100).toFixed(1) : '0'
				const line3 = document.createElement('p')
				line3.innerHTML = `<strong>性能提升:</strong> ${improvement}%`

				const consistent = JSON.stringify(first.data) === JSON.stringify(second.data)
				const line4 = document.createElement('p')
				line4.innerHTML = `<strong>数据一致性:</strong> ${consistent ? '✓ 通过' : '✗ 失败'}`

				details.appendChild(line1)
				details.appendChild(line2)
				details.appendChild(line3)
				details.appendChild(line4)
				wrapper.appendChild(details)

				resultContainer.innerHTML = ''
				resultContainer.appendChild(wrapper)
				await loadCacheStatus()
			} catch {
				setNotice(resultContainer, 'error', '缓存测试失败')
			}
		}

		if (testButton) testButton.addEventListener('click', testCache)

		loadCacheStatus()
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
	initCacheManagement()
	initSettingsTab()
	initProductRequest()
})()

