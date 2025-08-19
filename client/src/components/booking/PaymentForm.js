import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Box, Alert } from '@mui/material';

import { UI_LABELS } from '../../constants/uiLabels';

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

				// Ensure container exists in DOM before rendering
				const el = document.getElementById('payment-form');
				if (!el) return;

				if (containerRef.current) containerRef.current.innerHTML = '';

				widget = new window.YooMoneyCheckoutWidget({
					confirmation_token: confirmationToken,
					return_url: returnUrl,
					error_callback: onError,
					language: 'ru',
				});

				widget.on('complete', () => {
					widget.destroy();
				});

				widget.render('payment-form');

				setError(null);
			} catch (e) {
				const message = e?.message || UI_LABELS.BOOKING.payment_form.load_error;
				setError(message);
				onError && onError(e);
			}
		};

		initWidget();

		return () => {
			if (widget && typeof widget.destroy === 'function') {
				try {
					widget.destroy();
				} catch (_) {}
			}
			if (containerRef.current) containerRef.current.innerHTML = '';
		};
	}, [confirmationToken, returnUrl, onError, ensureScript]);

	return (
		<Box>
			{loading && (
				<Alert severity='info' sx={{ my: 1, fontSize: 14 }}>
					{UI_LABELS.BOOKING.payment_form.loading}
				</Alert>
			)}
			{error && (
				<Alert severity='error' sx={{ my: 1, fontSize: 14 }}>
					{error}
				</Alert>
			)}
			{!confirmationToken && (
				<Alert severity='warning' sx={{ my: 1, fontSize: 14 }}>
					{UI_LABELS.BOOKING.payment_form.waiting}
				</Alert>
			)}
			<Box id='payment-form' ref={containerRef} />
		</Box>
	);
};

export default PaymentForm;
