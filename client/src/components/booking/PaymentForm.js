import React, { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Renders YooKassa payment widget inside booking process.
 * Expects confirmationToken received from backend to initialize widget.
 */
const WIDGET_SRC = 'https://yookassa.ru/checkout-widget/v1/checkout-widget.js';

const PaymentForm = ({ confirmationToken, returnUrl, onError }) => {
	const containerRef = useRef(null);
	const [isLoadingScript, setIsLoadingScript] = useState(false);
	const [loadError, setLoadError] = useState(null);

	// Load the widget script once and reuse a global promise to avoid duplicates
	const ensureWidgetScript = useCallback(() => {
		if (window.YooMoneyCheckoutWidget) return Promise.resolve();

		setLoadError(null);
		setIsLoadingScript(true);

		if (window.__YK_WIDGET_PROMISE) return window.__YK_WIDGET_PROMISE;

		const existing = document.querySelector(`script[src="${WIDGET_SRC}"]`);
		window.__YK_WIDGET_PROMISE = new Promise((resolve, reject) => {
			const onLoad = () => {
				if (window.YooMoneyCheckoutWidget) resolve();
				else reject(new Error('YooKassa widget is unavailable after script load'));
			};
			const onErrorLoad = () => reject(new Error('Failed to load YooKassa widget script'));

			if (existing) {
				existing.addEventListener('load', onLoad, { once: true });
				existing.addEventListener('error', onErrorLoad, { once: true });
			} else {
				const script = document.createElement('script');
				script.src = WIDGET_SRC;
				script.async = true;
				script.onload = onLoad;
				script.onerror = onErrorLoad;
				document.body.appendChild(script);
			}
		}).finally(() => setIsLoadingScript(false));

		// Allow retry by clearing the global promise on failure
		window.__YK_WIDGET_PROMISE.catch(() => {
			delete window.__YK_WIDGET_PROMISE;
		});

		return window.__YK_WIDGET_PROMISE;
	}, []);

	useEffect(() => {
		let widget;

		const createAndRender = () => {
			if (!window.YooMoneyCheckoutWidget || !confirmationToken) return;
			widget = new window.YooMoneyCheckoutWidget({
				confirmation_token: confirmationToken,
				return_url: returnUrl,
				error_callback: (e) => onError && onError(e),
			});
			// IMPORTANT: render expects container ID string, not a DOM element
			widget.render('payment-form');
		};

		ensureWidgetScript()
			.then(() => {
				setLoadError(null);
				createAndRender();
			})
			.catch((err) => {
				setLoadError(err?.message || 'Failed to load payment widget');
				onError && onError(err);
			});

		return () => {
			if (widget && typeof widget.destroy === 'function') {
				try {
					widget.destroy();
				} catch (_) {
					// ignore
				}
			}
		};
	}, [confirmationToken, returnUrl, onError, ensureWidgetScript]);

	const handleRetry = () => {
		setLoadError(null);
		setIsLoadingScript(true);
		ensureWidgetScript()
			.then(() => {
				setLoadError(null);
				setIsLoadingScript(false);
				if (window.YooMoneyCheckoutWidget && confirmationToken) {
					try {
						const w = new window.YooMoneyCheckoutWidget({
							confirmation_token: confirmationToken,
							return_url: returnUrl,
							error_callback: onError,
						});
						w.render('payment-form');
					} catch (e) {
						setLoadError(e?.message || 'Failed to initialize widget');
						onError && onError(e);
					}
				}
			})
			.catch((err) => {
				setIsLoadingScript(false);
				setLoadError(err?.message || 'Failed to load payment widget');
				onError && onError(err);
			});
	};

	return (
		<div id='payment-form' ref={containerRef}>
			{isLoadingScript && (
				<div style={{ padding: '8px 0', color: '#666', fontSize: 14 }}>Loading payment form…</div>
			)}
			{!isLoadingScript && !confirmationToken && !loadError && (
				<div style={{ padding: '8px 0', color: '#666', fontSize: 14 }}>Waiting for payment token…</div>
			)}
			{loadError && (
				<div style={{ marginTop: 8 }}>
					<div style={{ color: '#c62828', fontSize: 14, marginBottom: 8 }}>{loadError}</div>
					<button
						type='button'
						onClick={handleRetry}
						style={{
							background: '#1976d2',
							border: 'none',
							color: '#fff',
							padding: '6px 12px',
							borderRadius: 4,
							cursor: 'pointer',
						}}
					>
						Retry
					</button>
				</div>
			)}
		</div>
	);
};

export default PaymentForm;
