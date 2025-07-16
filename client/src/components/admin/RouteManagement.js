import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import AdminDataTable from '../../components/admin/AdminDataTable';

import { fetchRoutes, createRoute, updateRoute, deleteRoute } from '../../redux/actions/route';
import { fetchAirports } from '../../redux/actions/airport';
import { FIELD_TYPES, createAdminManager } from './utils';
import { FIELD_LABELS, UI_LABELS, VALIDATION_MESSAGES } from '../../constants';

const RouteManagement = () => {
	const dispatch = useDispatch();
	const { routes, isLoading, errors } = useSelector((state) => state.routes);
	const { airports, isLoading: airportsLoading } = useSelector((state) => state.airports);

	useEffect(() => {
		dispatch(fetchRoutes());
		dispatch(fetchAirports());
	}, [dispatch]);

	const getAirportOptions = () => {
		if (!airports || !Array.isArray(airports)) {
			return [];
		}
		return airports.map((airport) => ({
			value: airport.id,
			label: `${airport.name} (${airport.iata_code}) - ${airport.city_code}`,
		}));
	};

	const getAirportById = (id) => {
		if (!airports || !Array.isArray(airports)) {
			return null;
		}
		return airports.find((airport) => airport.id === id);
	};

	const airportOptions = useMemo(() => getAirportOptions(), [airports]);

	const FIELDS = {
		id: { key: 'id', apiKey: 'id' },
		originAirportId: {
			key: 'originAirportId',
			apiKey: 'origin_airport_id',
			label: FIELD_LABELS.ROUTE.origin_airport_id,
			type: FIELD_TYPES.SELECT,
			options: airportOptions,
			formatter: (value) => {
				const airport = getAirportById(value);
				return airport ? `${airport.iata_code}` : value;
			},
			validate: (value) => (!value ? VALIDATION_MESSAGES.ROUTE.origin_airport_id.REQUIRED : null),
		},
		destinationAirportId: {
			key: 'destinationAirportId',
			apiKey: 'destination_airport_id',
			label: FIELD_LABELS.ROUTE.destination_airport_id,
			type: FIELD_TYPES.SELECT,
			options: airportOptions,
			formatter: (value) => {
				const airport = getAirportById(value);
				return airport ? `${airport.iata_code}` : value;
			},
			validate: (value) => (!value ? VALIDATION_MESSAGES.ROUTE.destination_airport_id.REQUIRED : null),
		},
	};

	const adminManager = useMemo(
		() =>
			createAdminManager(FIELDS, {
				addButtonText: UI_LABELS.ADMIN.modules.routes.add_button,
				editButtonText: UI_LABELS.ADMIN.modules.routes.edit_button,
			}),
		[FIELDS, getAirportById]
	);

	const handleAddRoute = (routeData) => {
		return dispatch(createRoute(adminManager.toApiFormat(routeData))).unwrap();
	};

	const handleEditRoute = (routeData) => {
		return dispatch(updateRoute(adminManager.toApiFormat(routeData))).unwrap();
	};

	const handleDeleteRoute = (id) => {
		return dispatch(deleteRoute(id));
	};

	const formattedRoutes = routes.map(adminManager.toUiFormat);

	return (
		<AdminDataTable
			title={UI_LABELS.ADMIN.modules.routes.management}
			data={formattedRoutes}
			columns={adminManager.columns}
			onAdd={handleAddRoute}
			onEdit={handleEditRoute}
			onDelete={handleDeleteRoute}
			renderForm={adminManager.renderForm}
			addButtonText={UI_LABELS.ADMIN.modules.routes.add_button}
			isLoading={isLoading || airportsLoading}
			error={errors}
		/>
	);
};

export default RouteManagement;
