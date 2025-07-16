import React from 'react';
import { Modal, Fade } from '@mui/material';

import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';

import { useAuthModal } from '../../context/AuthModalContext';

const AuthModal = () => {
	const { authModal, closeAuthModal } = useAuthModal();
	const { isOpen, type } = authModal;

	return (
		<Modal
			open={isOpen}
			onClose={closeAuthModal}
			aria-labelledby='auth-modal'
			closeAfterTransition
			sx={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<Fade in={isOpen}>
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
