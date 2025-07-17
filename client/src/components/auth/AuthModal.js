import React, { useEffect, useRef } from 'react';
import { Modal, Fade } from '@mui/material';

import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';

import { useAuthModal } from '../../context/AuthModalContext';

const AuthModal = () => {
        const { authModal, closeAuthModal } = useAuthModal();
        const { isOpen, type, token } = authModal;

	const lastFocusedRef = useRef(null);

	useEffect(() => {
		if (isOpen) {
			lastFocusedRef.current = document.activeElement;
		}
	}, [isOpen]);

	const handleExited = () => {
		const node = lastFocusedRef.current;
		if (node && typeof node.focus === 'function') {
			node.focus();
		}
	};

	return (
		<Modal
			open={isOpen}
			onClose={closeAuthModal}
			aria-labelledby='auth-modal'
			closeAfterTransition
			disableRestoreFocus
			sx={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<Fade in={isOpen} onExited={handleExited}>
				<div>
					{type === 'login' && <Login isModal={true} />}
					{type === 'register' && <Register isModal={true} />}
                                        {type === 'forgotPassword' && <ForgotPassword isModal={true} />}
                                        {type === 'resetPassword' && (
                                                <ResetPassword isModal={true} token={token} />
                                        )}
				</div>
			</Fade>
		</Modal>
	);
};

export default AuthModal;
