import React from 'react';

import Home from '../components/Home';
import About from '../components/About';
import ResetPassword from '../components/auth/ResetPassword';
import Search from '../components/search/Search';
import Schedule from '../components/search/Schedule';
import Passengers from '../components/booking/Passengers';
import Confirmation from '../components/booking/Confirmation';
import Payment from '../components/booking/Payment';
import Completion from '../components/booking/Completion';

const PublicRoutes = () => [
	{ path: '/', element: <Home /> },
	{ path: '/about', element: <About /> },

	{ path: '/reset_password', element: <ResetPassword /> },

	{ path: '/search', element: <Search /> },
	{ path: '/schedule', element: <Schedule /> },

	{ path: '/booking/:publicId/passengers', element: <Passengers /> },
        { path: '/booking/:publicId/confirmation', element: <Confirmation /> },
        { path: '/booking/:publicId/payment', element: <Payment /> },
        { path: '/booking/:publicId/completion', element: <Completion /> }
];

export default PublicRoutes;
