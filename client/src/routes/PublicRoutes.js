import React from 'react';

import Home from '../components/Home';
import About from '../components/About';
import ResetPassword from '../components/auth/ResetPassword';
import Search from '../components/search/Search';
import Cart from '../components/cart/Cart';

const PublicRoutes = () => [
	{ path: '/', element: <Home /> },
	{ path: '/about', element: <About /> },
	{ path: '/reset_password', element: <ResetPassword /> },
	{ path: '/search', element: <Search /> },
	{ path: '/cart', element: <Cart />}
];

export default PublicRoutes;
