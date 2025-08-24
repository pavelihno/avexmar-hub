import React from 'react';

import Home from '../components/Home';
import About from '../components/About';
import PrivacyPolicy from '../components/PrivacyPolicy';
import PublicOffer from '../components/PublicOffer';
import ResetPassword from '../components/auth/ResetPassword';
import ActivateAccount from '../components/auth/ActivateAccount';
import Search from '../components/search/Search';
import Schedule from '../components/search/Schedule';
import Passengers from '../components/booking/Passengers';
import Confirmation from '../components/booking/Confirmation';
import Payment from '../components/booking/Payment';
import Completion from '../components/booking/Completion';
import BookingRoute from './BookingRoute';

const PublicRoutes = () => [
	{ path: '/', element: <Home /> },
		{ path: '/about', element: <About /> },
		{ path: '/privacy_policy', element: <PrivacyPolicy /> },
		{ path: '/public_offer', element: <PublicOffer /> },

		{ path: '/reset_password', element: <ResetPassword /> },
		{ path: '/activate', element: <ActivateAccount /> },

	{ path: '/search', element: <Search /> },
	{ path: '/schedule', element: <Schedule /> },

	{
		path: '/booking/:publicId',
		element: <BookingRoute />,
	},
	{
		path: '/booking/:publicId/passengers',
		element: (
			<BookingRoute page='passengers'>
				<Passengers />
			</BookingRoute>
		),
	},
	{
		path: '/booking/:publicId/confirmation',
		element: (
			<BookingRoute page='confirmation'>
				<Confirmation />
			</BookingRoute>
		),
	},
	{
		path: '/booking/:publicId/payment',
		element: (
			<BookingRoute page='payment'>
				<Payment />
			</BookingRoute>
		),
	},
	{
		path: '/booking/:publicId/completion',
		element: (
			<BookingRoute page='completion'>
				<Completion />
			</BookingRoute>
		),
	},
];

export default PublicRoutes;
