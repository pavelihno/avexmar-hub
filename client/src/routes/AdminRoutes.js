import React from 'react';

import AdminPanel from '../components/admin/AdminPanel';
import AirportManagement from '../components/admin/AirportManagement';
import AirlineManagement from '../components/admin/AirlineManagement';
import CountryManagement from '../components/admin/CountryManagement';
import RouteManagement from '../components/admin/RouteManagement';
import DiscountManagement from '../components/admin/DiscountManagement';
import FlightManagement from '../components/admin/FlightManagement';
import TariffManagement from '../components/admin/TariffManagement';
import BookingManagement from '../components/admin/BookingManagement';
import TicketManagement from '../components/admin/TicketManagement';
import PassengerManagement from '../components/admin/PassengerManagement';
import UserManagement from '../components/admin/UserManagement';

import ProtectedRoute from './ProtectedRoute';

const AdminRoutes = ({ isAdmin }) => [
	{
		path: '/admin',
		element: (
			<ProtectedRoute children={<AdminPanel />} condition={isAdmin} />
		),
	},
	{
		path: '/admin/airports',
		element: (
			<ProtectedRoute
				children={<AirportManagement />}
				condition={isAdmin}
			/>
		),
	},
	{
		path: '/admin/airlines',
		element: (
			<ProtectedRoute
				children={<AirlineManagement />}
				condition={isAdmin}
			/>
		),
	},
	{
		path: '/admin/countries',
		element: (
			<ProtectedRoute
				children={<CountryManagement />}
				condition={isAdmin}
			/>
		),
	},
	{
		path: '/admin/routes',
		element: (
			<ProtectedRoute
				children={<RouteManagement />}
				condition={isAdmin}
			/>
		),
	},
	{
		path: '/admin/discounts',
		element: (
			<ProtectedRoute
				children={<DiscountManagement />}
				condition={isAdmin}
			/>
		),
	},
	{
		path: '/admin/flights',
		element: (
			<ProtectedRoute
				children={<FlightManagement />}
				condition={isAdmin}
			/>
		),
	},
	{
		path: '/admin/tariffs',
		element: (
			<ProtectedRoute
				children={<TariffManagement />}
				condition={isAdmin}
			/>
		),
	},
	{
		path: '/admin/bookings',
		element: (
			<ProtectedRoute
				children={<BookingManagement />}
				condition={isAdmin}
			/>
		),
	},
	{
		path: '/admin/tickets',
		element: (
			<ProtectedRoute
				children={<TicketManagement />}
				condition={isAdmin}
			/>
		),
	},
	{
		path: '/admin/passengers',
		element: (
			<ProtectedRoute
				children={<PassengerManagement />}
				condition={isAdmin}
			/>
		),
	},
	{
		path: '/admin/users',
		element: (
			<ProtectedRoute children={<UserManagement />} condition={isAdmin} />
		),
	},
];

export default AdminRoutes;
