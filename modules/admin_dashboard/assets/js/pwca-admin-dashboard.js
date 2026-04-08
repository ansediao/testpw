(() => {
	const root = document.querySelector('.pwca-admin-dashboard')
	if (!root) return

	const ajaxUrl = root.dataset.ajaxUrl || ''
	const restProductBase = root.dataset.restProductBase || ''
	const adminPageUrl = root.dataset.adminPageUrl || ''
	const storeUrl = root.dataset.storeUrl || ''
	const connectNonce = root.dataset.connectNonce || ''
	const disconnectNonce = root.dataset.disconnectNonce || ''
	const hasConnectedToken = root.dataset.hasConnectedToken === '1'
	const clearCacheNonce = root.dataset.clearCacheNonce || ''
	const cacheStatusNonce = root.dataset.cacheStatusNonce || ''
	const productRequestNonce = root.dataset.productRequestNonce || ''
	const saveMockModeNonce = root.dataset.saveMockModeNonce || ''
	const initialApiMockMode = root.dataset.apiMockMode === '1' ? 1 : 0
	const connectBaseUrl = 'https://www.promowares.xyz/api/store/bind-entry'

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

	const normalizeStoreUrl = (value) => {
		const raw = String(value || '').trim()
		if (!raw) return ''
		return raw.endsWith('/') ? raw : `${raw}/`
	}

	const toHex = (buffer) =>
		Array.from(new Uint8Array(buffer))
			.map((byte) => byte.toString(16).padStart(2, '0'))
			.join('')

	const createConnectSignature = async (secretKey, payload) => {
		if (!window.crypto || !window.crypto.subtle) {
			throw new Error('Current browser does not support crypto signing')
		}

		const encoder = new TextEncoder()
		const cryptoKey = await window.crypto.subtle.importKey(
			'raw',
			encoder.encode(secretKey),
			{ name: 'HMAC', hash: 'SHA-256' },
			false,
			['sign'],
		)
		const signatureBuffer = await window.crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(payload))
		return toHex(signatureBuffer)
	}

	const buildConnectRedirectUrl = async (secretKey, callbackPage, callbackTab = '') => {
		const callbackBase = adminPageUrl || `${window.location.origin}/wp-admin/admin.php`
		const callbackUrl = new URL(callbackBase, window.location.origin)
		callbackUrl.searchParams.set('page', callbackPage)
		if (callbackPage === 'pw-dashboard-settings' && callbackTab) {
			callbackUrl.searchParams.set('tab', callbackTab)
		}
		const state = JSON.stringify({
			page: callbackPage,
			tab: callbackTab,
		})
		callbackUrl.searchParams.set('state', state)

		const normalizedStoreUrl = normalizeStoreUrl(storeUrl || window.location.origin)
		const timestamp = String(Math.floor(Date.now() / 1000))
		const callback = callbackUrl.toString()
		const payload = `callback=${callback}&store_url=${normalizedStoreUrl}&timestamp=${timestamp}`
		const sign = await createConnectSignature(secretKey, payload)

		const params = new URLSearchParams()
		params.set('callback', callback)
		params.set('store_url', normalizedStoreUrl)
		params.set('timestamp', timestamp)
		params.set('sign', sign)

		return `${connectBaseUrl}?${params.toString()}`
	}

	const initTokenConnect = () => {
		const connectButton = document.getElementById('pwca-token-connect')
		const statusContainer = document.getElementById('pwca-token-status')

		if (!connectButton || !statusContainer) return
		let isConnected = hasConnectedToken

		const setBusy = (busy) => {
			connectButton.disabled = busy
			if (busy) {
				connectButton.textContent = isConnected ? 'Disconnecting...' : 'Connecting...'
				return
			}
			connectButton.textContent = isConnected ? 'Disconnect' : 'Connect'
		}

		connectButton.addEventListener('click', async () => {
			setBusy(true)
			statusContainer.innerHTML = ''

			try {
				if (isConnected) {
					const response = await postUrlEncoded({
						action: 'pwca_disconnect_store',
						nonce: disconnectNonce,
					})
					if (!response || !response.success) {
						setNotice(statusContainer, 'error', String((response && response.data) || 'Disconnect failed'))
						return
					}
					window.location.reload()
					return
				}

				const response = await postUrlEncoded({
					action: 'pwca_get_bind_entry_url',
					nonce: connectNonce,
					callback_page: 'pw-dashboard',
				})
				const redirectUrl = response && response.success && response.data && response.data.url ? String(response.data.url) : ''
				if (!redirectUrl) {
					setNotice(statusContainer, 'error', String((response && response.data) || 'Connect URL build failed'))
					return
				}
				window.location.href = redirectUrl
			} catch (error) {
				setNotice(statusContainer, 'error', `${isConnected ? 'Disconnect' : 'Connect'} failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
			} finally {
				setBusy(false)
			}
		})
	}

	const initApiMockToggle = () => {
		const container = document.getElementById('pwca-api-mock-toggle')
		const statusContainer = document.getElementById('pwca-api-mock-status')

		if (!container || !saveMockModeNonce) return

		const buttons = Array.from(container.querySelectorAll('button[data-value]'))
		if (!buttons.length) return

		const setActive = (value) => {
			buttons.forEach((button) => {
				const buttonValue = button.dataset.value === '1' ? 1 : 0
				if (buttonValue === value) {
					button.classList.remove('button-secondary')
					button.classList.add('button-primary')
				} else {
					button.classList.remove('button-primary')
					button.classList.add('button-secondary')
				}
			})
			container.dataset.current = String(value)
		}

		setActive(initialApiMockMode)

		const setBusy = (busy) => {
			buttons.forEach((button) => {
				button.disabled = busy
			})
		}

		buttons.forEach((button) => {
			button.addEventListener('click', async (event) => {
				event.preventDefault()
				const value = button.dataset.value === '1' ? 1 : 0

				if (String(value) === container.dataset.current) {
					return
				}

				setBusy(true)
				if (statusContainer) {
					statusContainer.innerHTML = ''
				}

				try {
					const response = await postUrlEncoded({
						action: 'pw_save_mock_mode',
						mode: value,
						nonce: saveMockModeNonce,
					})

					if (response && response.success) {
						setActive(value)
						if (statusContainer) {
							const message =
								value === 1
									? 'Mock error mode enabled. All Promowares API calls will return mocked errors.'
									: 'Mock error mode disabled. Promowares API will return real data.'
							setNotice(statusContainer, 'success', message)
						}
					} else if (statusContainer) {
						setNotice(statusContainer, 'error', String((response && response.data) || 'Failed to save mock mode'))
					}
				} catch (error) {
					if (statusContainer) {
						setNotice(
							statusContainer,
							'error',
							`Failed to save mock mode: ${error instanceof Error ? error.message : 'Unknown error'}`,
						)
					}
				} finally {
					setBusy(false)
				}
			})
		})
	}

	const initImportProgress = () => {
		const progressBar = document.getElementById('pwca-progress-bar')
		const progressText = document.getElementById('pwca-progress-text')
		if (!progressBar || !progressText) return

		let isPolling = false
		let isFirstRequest = true

		const updateProgress = async () => {
			if (isPolling) return
			isPolling = true

			try {
				const data = await postUrlEncoded({ action: 'check_import_progress', is_page_refresh: isFirstRequest ? '1' : '0' })
				isFirstRequest = false
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
		const cacheStatusBox = document.getElementById('pwca-cache-status')
		const cacheTotal = document.getElementById('pwca-cache-total')
		const cacheExpired = document.getElementById('pwca-cache-expired')
		const cacheLastUpdated = document.getElementById('pwca-cache-last-updated')
		const cacheTtl = document.getElementById('pwca-cache-ttl')

		const productIdInput = document.getElementById('pwca-cache-product-id')
		const clearCacheButton = document.getElementById('pwca-clear-cache')
		const refreshStatusButton = document.getElementById('pwca-refresh-cache-status')
		const cacheResult = document.getElementById('pwca-cache-result')
		const cacheTestButton = document.getElementById('pwca-test-cache')
		const cacheTestResult = document.getElementById('pwca-cache-test-result')

		if (!cacheStatusBox || !cacheResult || !clearCacheButton || !refreshStatusButton) {
			return
		}

		const setStatusLoading = (loading) => {
			cacheStatusBox.classList.toggle('is-loading', loading)
		}

		const fetchCacheStatus = async () => {
			if (!ajaxUrl || !cacheStatusNonce) {
				return
			}

			setStatusLoading(true)
			cacheResult.innerHTML = ''

			try {
				const data = await postUrlEncoded({
					action: 'pw_get_cache_status',
					nonce: cacheStatusNonce,
				})

				if (!data || !data.success || !data.data) {
					setNotice(cacheResult, 'error', String(data?.data || 'Failed to get cache status'))
					return
				}

				const status = data.data
				if (cacheTotal) cacheTotal.textContent = String(status.total || 0)
				if (cacheExpired) cacheExpired.textContent = String(status.expired || 0)
				if (cacheLastUpdated) cacheLastUpdated.textContent = String(status.last_updated || 'N/A')
				if (cacheTtl) cacheTtl.textContent = String(status.ttl || 'N/A')
			} catch (error) {
				setNotice(cacheResult, 'error', `Failed to get cache status: ${error instanceof Error ? error.message : 'Unknown error'}`)
			} finally {
				setStatusLoading(false)
			}
		}

		const clearCache = async () => {
			if (!ajaxUrl || !clearCacheNonce) {
				return
			}

			const productIdRaw = productIdInput ? productIdInput.value.trim() : ''
			const productId = productIdRaw !== '' ? productIdRaw : null

			cacheResult.innerHTML = ''
			clearCacheButton.disabled = true

			try {
				const data = await postUrlEncoded({
					action: 'pw_clear_product_cache',
					nonce: clearCacheNonce,
					product_id: productId,
				})

				if (!data) {
					setNotice(cacheResult, 'error', 'Clear cache failed: Unknown error')
					return
				}

				if (data.success) {
					setNotice(cacheResult, 'success', String(data.data || 'Cache cleared'))
					fetchCacheStatus()
				} else {
					setNotice(cacheResult, 'error', String(data.data || 'Clear cache failed'))
				}
			} catch (error) {
				setNotice(cacheResult, 'error', `Clear cache failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
			} finally {
				clearCacheButton.disabled = false
			}
		}

		const runCacheTest = async () => {
			if (!restProductBase) return

			const pwId = (productIdInput && productIdInput.value.trim()) || 'test'
			if (!pwId) return

			cacheTestResult.textContent = 'Testing...'
			cacheTestResult.classList.remove('is-success', 'is-error')

			const measureRequest = async (label) => {
				const url = `${restProductBase}${encodeURIComponent(pwId)}`
				const start = performance.now()
				let ok = false
				let responseStatus = 0

				try {
					const response = await fetch(url, { credentials: 'same-origin' })
					responseStatus = response.status
					ok = response.ok
					await response.json()
				} catch {
				}

				const duration = performance.now() - start
				return { label, duration, ok, status: responseStatus }
			}

			try {
				const first = await measureRequest('First request')
				const second = await measureRequest('Second request')

				const lines = []
				lines.push(`${first.label}: ${first.ok ? 'Success' : 'Failed'} (${first.status}), Time: ${first.duration.toFixed(1)}ms`)
				lines.push(`${second.label}: ${second.ok ? 'Success' : 'Failed'} (${second.status}), Time: ${second.duration.toFixed(1)}ms`)

				const faster = first.duration && second.duration
					? (first.duration / second.duration).toFixed(2)
					: 'N/A'

				lines.push(`Second request is ${faster}x faster than first`)

				cacheTestResult.textContent = lines.join(' | ')
				cacheTestResult.classList.add('is-success')
			} catch {
				cacheTestResult.textContent = 'Test failed: Request error'
				cacheTestResult.classList.add('is-error')
			}
		}

		refreshStatusButton.addEventListener('click', (event) => {
			event.preventDefault()
			fetchCacheStatus()
		})

		clearCacheButton.addEventListener('click', (event) => {
			event.preventDefault()
			clearCache()
		})

		if (cacheTestButton && cacheTestResult) {
			cacheTestButton.addEventListener('click', (event) => {
				event.preventDefault()
				runCacheTest()
			})
		}

		fetchCacheStatus()
	}

	const initSettingsTab = () => {
		const reconnectButton = document.getElementById('pwca-reconnect-button')
		const statusContainer = document.getElementById('pwca-settings-connect-status')
		const settingsSecretInput = document.getElementById('pwca-settings-secret-key-input')
		if (reconnectButton) {
			reconnectButton.addEventListener('click', async () => {
				const secretKey = settingsSecretInput ? settingsSecretInput.value.trim() : ''
				if (!secretKey) {
					if (statusContainer) {
						setNotice(statusContainer, 'error', 'Please fill API integration secret first')
					}
					return
				}

				reconnectButton.disabled = true
				reconnectButton.textContent = 'Connecting...'
				if (statusContainer) {
					statusContainer.innerHTML = ''
				}

				try {
					const redirectUrl = await buildConnectRedirectUrl(secretKey, 'pw-dashboard-settings', 'settings')
					window.location.href = redirectUrl
				} catch (error) {
					if (statusContainer) {
						setNotice(statusContainer, 'error', `Reconnect failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
					}
				} finally {
					reconnectButton.disabled = false
					reconnectButton.textContent = 'Reconnect'
				}
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
					img.alt = 'Preview image'
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
					setNotice(messages, 'success', String(response.data || 'Submitted successfully'))
					form.reset()
					if (preview) preview.innerHTML = ''
				} else {
					setNotice(messages, 'error', String(response?.data || 'Submission failed'))
				}
			} catch {
				messages.hidden = false
				setNotice(messages, 'error', 'Submission failed: Network error')
			} finally {
				setBusy(false)
			}
		})
	}

	initTokenConnect()
	initApiMockToggle()
	initImportProgress()
	initCacheManagement()
	initSettingsTab()
	initProductRequest()
})()

