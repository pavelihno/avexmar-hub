import React, { createContext, useContext, useState } from 'react';

const AuthModalContext = createContext();

export const AuthModalProvider = ({ children }) => {
	const [authModal, setAuthModal] = useState({
		isOpen: false,
		type: null, // 'login', 'register', 'forgotPassword' or 'resetPassword'
		token: null,
	});

	const openLoginModal = () => {
		setAuthModal({ isOpen: true, type: 'login' });
	};

	const openRegisterModal = () => {
		setAuthModal({ isOpen: true, type: 'register' });
	};

	const openForgotPasswordModal = () => {
		setAuthModal({ isOpen: true, type: 'forgotPassword', token: null });
	};

	const openResetPasswordModal = (token) => {
		setAuthModal({ isOpen: true, type: 'resetPassword', token });
	};

	const closeAuthModal = () => {
		setAuthModal({ isOpen: false, type: null, token: null });
	};

	return (
		<AuthModalContext.Provider
			value={{
				authModal,
				openLoginModal,
				openRegisterModal,
				openForgotPasswordModal,
				openResetPasswordModal,
				closeAuthModal,
			}}
		>
			{children}
		</AuthModalContext.Provider>
	);
};

export const useAuthModal = () => useContext(AuthModalContext);
