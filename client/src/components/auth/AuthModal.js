import React, { useEffect, useRef } from 'react';
import { Modal, Fade } from '@mui/material';

import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';

import { useAuthModal } from '../../context/AuthModalContext';

const AuthModal = () => {
	const { authModal, closeAuthModal } = useAuthModal();
	const { isOpen, type } = authModal;

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
				p: { xs: 2, sm: 0 },
				overflowY: 'auto',
			}}
		>
			<Fade in={isOpen} onExited={handleExited}>
				<div>
					{type === 'login' && <Login isModal={true} />}
					{type === 'register' && <Register isModal={true} />}
					{type === 'forgotPassword' && <ForgotPassword isModal={true} />}
				</div>
			</Fade>
		</Modal>
	);
};

export default AuthModal;
