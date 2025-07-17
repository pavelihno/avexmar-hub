import React, { createContext, useContext, useState } from 'react';

const ProfileModalContext = createContext();

export const ProfileModalProvider = ({ children }) => {
	const [profileModalOpen, setProfileModalOpen] = useState(false);

	const openProfileModal = () => {
		setProfileModalOpen(true);
	};

	const closeProfileModal = () => {
		setProfileModalOpen(false);
	};

	return (
		<ProfileModalContext.Provider
			value={{
				profileModalOpen,
				openProfileModal,
				closeProfileModal,
			}}
		>
			{children}
		</ProfileModalContext.Provider>
	);
};

export const useProfileModal = () => useContext(ProfileModalContext);
