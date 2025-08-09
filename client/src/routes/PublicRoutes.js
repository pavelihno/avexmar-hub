import React from 'react';

import Home from '../components/Home';
import About from '../components/About';
import ResetPassword from '../components/auth/ResetPassword';
import Search from '../components/search/Search';
import Schedule from '../components/search/Schedule';
import Cart from '../components/cart/Cart';
import Passengers from '../components/booking/Passengers';

const PublicRoutes = () => [
	{ path: '/', element: <Home /> },
	{ path: '/about', element: <About /> },
	{ path: '/reset_password', element: <ResetPassword /> },
        { path: '/search', element: <Search /> },
        { path: '/schedule', element: <Schedule /> },
        { path: '/cart', element: <Cart />},
        { path: '/booking/:publicId/passengers', element: <Passengers /> }
];

export default PublicRoutes;
