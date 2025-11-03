import React from 'react';

import AdminPanel from '../components/admin/AdminPanel';
import AirportManagement from '../components/admin/management/AirportManagement';
import AirlineManagement from '../components/admin/management/AirlineManagement';
import AircraftManagement from '../components/admin/management/AircraftManagement';
import CountryManagement from '../components/admin/management/CountryManagement';
import TimezoneManagement from '../components/admin/management/TimezoneManagement';
import RouteManagement from '../components/admin/management/RouteManagement';
import DiscountManagement from '../components/admin/management/DiscountManagement';
import FeeManagement from '../components/admin/management/FeeManagement';
import FlightManagement from '../components/admin/management/FlightManagement';
import FlightPassengerExport from '../components/admin/dashboard/FlightPassengerExport';
import BookingDashboard from '../components/admin/dashboard/BookingDashboard';
import TariffManagement from '../components/admin/management/TariffManagement';
import BookingManagement from '../components/admin/management/BookingManagement';
import PassengerManagement from '../components/admin/management/PassengerManagement';
import TicketManagement from '../components/admin/management/TicketManagement';
import UserManagement from '../components/admin/management/UserManagement';
import PaymentManagement from '../components/admin/management/PaymentManagement';
import ConsentDocManagement from '../components/admin/management/ConsentDocManagement';
import ConsentEventManagement from '../components/admin/management/ConsentEventManagement';
import CarouselSlideManagement from '../components/admin/management/CarouselSlideManagement';

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
			path: '/admin/passengers',
			element: <ProtectedRoute children={<PassengerManagement />} condition={isAdmin} />,
		},
		{
			path: '/admin/tickets',
			element: <ProtectedRoute children={<TicketManagement />} condition={isAdmin} />,
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
			path: '/admin/carousel-slides',
			element: <ProtectedRoute children={<CarouselSlideManagement />} condition={isAdmin} />,
		},
		{
			path: '/admin/dashboard/flight-passengers',
			element: <ProtectedRoute children={<FlightPassengerExport />} condition={isAdmin} />,
		},
		{
			path: '/admin/dashboard/bookings',
			element: <ProtectedRoute children={<BookingDashboard />} condition={isAdmin} />,
		},
	];
};

export default AdminRoutes;
