import React from 'react';

import AdminPanel from '../components/admin/AdminPanel';
import AirportManagement from '../components/admin/AirportManagement';
import AirlineManagement from '../components/admin/AirlineManagement';
import AircraftManagement from '../components/admin/AircraftManagement';
import CountryManagement from '../components/admin/CountryManagement';
import TimezoneManagement from '../components/admin/TimezoneManagement';
import RouteManagement from '../components/admin/RouteManagement';
import DiscountManagement from '../components/admin/DiscountManagement';
import FeeManagement from '../components/admin/FeeManagement';
import FlightManagement from '../components/admin/FlightManagement';
import FlightPassengerExport from '../components/admin/FlightPassengerExport';
import TariffManagement from '../components/admin/TariffManagement';
import BookingManagement from '../components/admin/BookingManagement';
import TicketManagement from '../components/admin/TicketManagement';
import PassengerManagement from '../components/admin/PassengerManagement';
import UserManagement from '../components/admin/UserManagement';
import PaymentManagement from '../components/admin/PaymentManagement';
import ConsentDocManagement from '../components/admin/ConsentDocManagement';
import ConsentEventManagement from '../components/admin/ConsentEventManagement';

import ProtectedRoute from './ProtectedRoute';

const AdminRoutes = ({ currentUser }) => {
	const isAdmin = currentUser?.role === 'admin';
	return [
	{
		path: '/admin',
		element: <ProtectedRoute children={<AdminPanel />} condition={isAdmin} />,
	},
	{
		path: '/admin/airports',
		element: <ProtectedRoute children={<AirportManagement />} condition={isAdmin} />,
	},
	{
		path: '/admin/airlines',
		element: <ProtectedRoute children={<AirlineManagement />} condition={isAdmin} />,
	},
	{
		path: '/admin/aircrafts',
		element: <ProtectedRoute children={<AircraftManagement />} condition={isAdmin} />,
	},
	{
		path: '/admin/countries',
		element: <ProtectedRoute children={<CountryManagement />} condition={isAdmin} />,
	},
	{
		path: '/admin/timezones',
		element: <ProtectedRoute children={<TimezoneManagement />} condition={isAdmin} />,
	},
	{
		path: '/admin/routes',
		element: <ProtectedRoute children={<RouteManagement />} condition={isAdmin} />,
	},
	{
		path: '/admin/discounts',
		element: <ProtectedRoute children={<DiscountManagement />} condition={isAdmin} />,
	},
	{
		path: '/admin/fees',
		element: <ProtectedRoute children={<FeeManagement />} condition={isAdmin} />,
	},
	{
		path: '/admin/flights',
		element: <ProtectedRoute children={<FlightManagement />} condition={isAdmin} />,
	},
	{
		path: '/admin/tariffs',
		element: <ProtectedRoute children={<TariffManagement />} condition={isAdmin} />,
	},
	{
		path: '/admin/bookings',
		element: <ProtectedRoute children={<BookingManagement />} condition={isAdmin} />,
	},
	{
		path: '/admin/payments',
		element: <ProtectedRoute children={<PaymentManagement />} condition={isAdmin} />,
	},
	{
		path: '/admin/tickets',
		element: <ProtectedRoute children={<TicketManagement />} condition={isAdmin} />,
	},
	{
		path: '/admin/passengers',
		element: <ProtectedRoute children={<PassengerManagement />} condition={isAdmin} />,
	},
        {
                path: '/admin/users',
                element: <ProtectedRoute children={<UserManagement />} condition={isAdmin} />,
        },
        {
                path: '/admin/consent-docs',
                element: <ProtectedRoute children={<ConsentDocManagement />} condition={isAdmin} />,
        },
        {
                path: '/admin/consent-events',
                element: <ProtectedRoute children={<ConsentEventManagement />} condition={isAdmin} />,
        },
	{
		path: '/admin/exports/flight-passengers',
		element: <ProtectedRoute children={<FlightPassengerExport />} condition={isAdmin} />,
},
	];
};

export default AdminRoutes;
