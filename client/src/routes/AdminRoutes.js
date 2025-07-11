import React from 'react';

import AdminPanel from '../components/admin/AdminPanel';
import AirportManagement from '../components/admin/AirportManagement';
import RouteManagement from '../components/admin/RouteManagement';
import DiscountManagement from '../components/admin/DiscountManagement';
// import FlightManagement from '../components/admin/FlightManagement';

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
	// {
	// 	path: '/admin/flights',
	// 	element: (
	// 		<ProtectedRoute
	// 			children={<FlightManagement />}
	// 			condition={isAdmin}
	// 		/>
	// 	),
	// },
];

export default AdminRoutes;
