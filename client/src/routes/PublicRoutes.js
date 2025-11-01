import React from 'react';

import Home from '../components/Home';
import About from '../components/About';
import PDPolicy from '../components/consent/PDPolicy';
import PDAgreement from '../components/consent/PDAgreement';
import PublicOffer from '../components/consent/PublicOffer';
import ResetPassword from '../components/auth/ResetPassword';
import ActivateAccount from '../components/auth/ActivateAccount';
import Search from '../components/search/Search';
import Schedule from '../components/search/Schedule';
import Passengers from '../components/booking/Passengers';
import Confirmation from '../components/booking/Confirmation';
import Payment from '../components/booking/Payment';
import Completion from '../components/booking/Completion';
import BookingSearch from '../components/booking/BookingSearch';
import BookingRoute from './BookingRoute';
import ProtectedRoute from './ProtectedRoute';
import Profile from '../components/profile/Profile';

const PublicRoutes = ({ isAuth }) => [
	{ path: '/', element: <Home /> },
	{ path: '/about', element: <About /> },
	{ path: '/pd_policy', element: <PDPolicy /> },
	{ path: '/pd_agreement', element: <PDAgreement /> },
	{ path: '/public_offer', element: <PublicOffer /> },
	{ path: '/reset_password', element: <ResetPassword /> },
	{ path: '/activate', element: <ActivateAccount /> },
	{ path: '/search', element: <Search /> },
	{ path: '/schedule', element: <Schedule /> },
	{ path: '/search/booking', element: <BookingSearch /> },
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
	{
		path: '/profile',
		element: <ProtectedRoute children={<Profile />} condition={isAuth} />,
	},
];

export default PublicRoutes;
