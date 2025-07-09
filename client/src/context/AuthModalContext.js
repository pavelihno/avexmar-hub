import React, { createContext, useContext, useState } from 'react';

const AuthModalContext = createContext();

export const AuthModalProvider = ({ children }) => {
	const [authModal, setAuthModal] = useState({
		isOpen: false,
		type: null, // 'login' or 'register'
	});

	const openLoginModal = () => {
		setAuthModal({ isOpen: true, type: 'login' });
	};

	const openRegisterModal = () => {
		setAuthModal({ isOpen: true, type: 'register' });
	};

	const closeAuthModal = () => {
		setAuthModal({ isOpen: false, type: null });
	};

	return (
		<AuthModalContext.Provider
			value={{
				authModal,
				openLoginModal,
				openRegisterModal,
				closeAuthModal,
			}}
		>
			{children}
		</AuthModalContext.Provider>
	);
};

export const useAuthModal = () => useContext(AuthModalContext);
