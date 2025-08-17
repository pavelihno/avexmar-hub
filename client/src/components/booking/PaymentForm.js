import React, { useCallback, useEffect, useRef, useState } from 'react';

// Renders YooKassa checkout widget inside booking payment step.
const WIDGET_SRC = 'https://yookassa.ru/checkout-widget/v1/checkout-widget.js';

const PaymentForm = ({ confirmationToken, returnUrl, onError }) => {
	const containerRef = useRef(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	// Ensure widget script is loaded only once.
	const ensureScript = useCallback(() => {
		if (window.YooMoneyCheckoutWidget) return Promise.resolve();
		if (window.__YK_WIDGET_PROMISE) return window.__YK_WIDGET_PROMISE;

		setLoading(true);
		window.__YK_WIDGET_PROMISE = new Promise((resolve, reject) => {
			const script = document.createElement('script');
			script.src = WIDGET_SRC;
			script.async = true;
			script.onload = resolve;
			script.onerror = reject;
			document.body.appendChild(script);
		}).finally(() => setLoading(false));

		return window.__YK_WIDGET_PROMISE;
	}, []);

	useEffect(() => {
		let widget;

		const initWidget = async () => {
			try {
				await ensureScript();
				if (!window.YooMoneyCheckoutWidget || !confirmationToken) return;

				if (containerRef.current) containerRef.current.innerHTML = '';
				widget = new window.YooMoneyCheckoutWidget({
					confirmation_token: confirmationToken,
					return_url: returnUrl,
					error_callback: onError,
				});
				widget.render('payment-form');
				setError(null);
			} catch (e) {
				const message = e?.message || 'Failed to load payment widget';
				setError(message);
				onError && onError(e);
			}
		};

		initWidget();

		return () => {
			if (widget && typeof widget.destroy === 'function') {
				try {
					widget.destroy();
				} catch (_) {
					// ignore
				}
			}
			if (containerRef.current) containerRef.current.innerHTML = '';
		};
	}, [confirmationToken, returnUrl, onError, ensureScript]);

	if (loading) {
		return <div style={{ padding: '8px 0', color: '#666', fontSize: 14 }}>Loading payment form…</div>;
	}

	if (error) {
		return <div style={{ padding: '8px 0', color: '#c62828', fontSize: 14 }}>{error}</div>;
	}

	if (!confirmationToken) {
		return <div style={{ padding: '8px 0', color: '#666', fontSize: 14 }}>Waiting for payment token…</div>;
	}

	return <div id='payment-form' ref={containerRef} />;
};

export default PaymentForm;

