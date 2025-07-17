import React, { createContext, useContext, useState } from 'react';

const AuthModalContext = createContext();

export const AuthModalProvider = ({ children }) => {
        const [authModal, setAuthModal] = useState({
                isOpen: false,
                type: null, // 'login', 'register' or 'forgotPassword'
        });

	const openLoginModal = () => {
		setAuthModal({ isOpen: true, type: 'login' });
	};

	const openRegisterModal = () => {
		setAuthModal({ isOpen: true, type: 'register' });
	};

        const openForgotPasswordModal = () => {
                setAuthModal({ isOpen: true, type: 'forgotPassword' });
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
                                openForgotPasswordModal,
                                closeAuthModal,
			}}
		>
			{children}
		</AuthModalContext.Provider>
	);
};

export const useAuthModal = () => useContext(AuthModalContext);
