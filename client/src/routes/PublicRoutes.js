import React from 'react';

import Home from '../components/Home';
import About from '../components/About';
import ResetPassword from '../components/auth/ResetPassword';
import Search from '../components/Search';

const PublicRoutes = () => [
	{ path: '/', element: <Home /> },
	{ path: '/about', element: <About /> },
	{ path: '/reset_password', element: <ResetPassword /> },
	{ path: '/search', element: <Search /> },
];

export default PublicRoutes;
