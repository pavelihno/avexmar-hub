import React, { createContext, useContext, useState } from 'react';

const AuthModalContext = createContext();

export const AuthModalProvider = ({ children }) => {
	const [authModal, setAuthModal] = useState({
		isOpen: false,
		type: null, // 'login', 'register' or 'forgotPassword'
		redirectPath: null,
	});

	const openLoginModal = (redirectPath = null) => {
		let sanitized = null;
		if (typeof redirectPath === 'string') {
			sanitized = redirectPath.trim();
		}
		setAuthModal({ isOpen: true, type: 'login', redirectPath: sanitized });
	};

	const openRegisterModal = () => {
		setAuthModal({ isOpen: true, type: 'register', redirectPath: null });
	};

	const openForgotPasswordModal = () => {
		setAuthModal({ isOpen: true, type: 'forgotPassword', redirectPath: null });
	};

	const closeAuthModal = () => {
		setAuthModal({ isOpen: false, type: null, redirectPath: null });
	};

	return (
		<AuthModalContext.Provider
			value={{
				authModal,
				openLoginModal,
				openRegisterModal,
				openForgotPasswordModal,
				closeAuthModal,
			}}
		>
			{children}
		</AuthModalContext.Provider>
	);
};

export const useAuthModal = () => useContext(AuthModalContext);
