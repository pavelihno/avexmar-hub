import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, condition }) => {
	if (!condition) {
		return <Navigate to='/' />;
	}

	return children;
};

export default ProtectedRoute;
