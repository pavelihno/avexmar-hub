import React from 'react';

import Home from '../components/Home';
import About from '../components/About';
import ResetPassword from '../components/auth/ResetPassword';

const PublicRoutes = () => [
	{ path: '/', element: <Home /> },
	{ path: '/about', element: <About /> },
	{ path: '/reset_password', element: <ResetPassword /> },
];

export default PublicRoutes;
