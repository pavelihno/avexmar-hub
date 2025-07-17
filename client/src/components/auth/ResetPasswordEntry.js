import { useEffect } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { useAuthModal } from '../../context/AuthModalContext';

const ResetPasswordEntry = () => {
	const { openResetPasswordModal } = useAuthModal();
	const [searchParams] = useSearchParams();
	const token = searchParams.get('token') || '';

	useEffect(() => {
		openResetPasswordModal(token);
	}, [openResetPasswordModal, token]);

	return <Navigate to='/' replace />;
};

export default ResetPasswordEntry;
