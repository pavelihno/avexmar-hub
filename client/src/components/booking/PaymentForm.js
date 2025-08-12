import React, { useEffect, useRef } from 'react';

/**
 * Renders YooKassa payment widget inside booking process.
 * Expects confirmationToken received from backend to initialize widget.
 */
const PaymentForm = ({ confirmationToken, returnUrl, onSuccess, onError }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        let widget;
        function initWidget() {
            if (!window.YooKassaCheckoutWidget || !confirmationToken) return;
            widget = new window.YooKassaCheckoutWidget({
                confirmation_token: confirmationToken,
                return_url: returnUrl,
                error_callback: onError,
                success_callback: onSuccess,
            });
            widget.render(containerRef.current);
        }

        if (!window.YooKassaCheckoutWidget) {
            const script = document.createElement('script');
            script.src = 'https://yookassa.ru/checkout-widget/v1/checkout-widget.js';
            script.onload = initWidget;
            document.body.appendChild(script);
        } else {
            initWidget();
        }

        return () => widget && widget.destroy();
    }, [confirmationToken, returnUrl, onSuccess, onError]);

    return <div ref={containerRef} />;
};

export default PaymentForm;
