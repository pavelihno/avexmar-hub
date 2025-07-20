import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import AdminDataTable from '../../components/admin/AdminDataTable';

import { fetchRoutes, createRoute, updateRoute, deleteRoute, deleteAllRoutes } from '../../redux/actions/route';
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

	const airportOptions = useMemo(() => {
		if (!airports || !Array.isArray(airports)) {
			return [];
		}
		return airports.map((airport) => ({
			value: airport.id,
			label: `${airport.name} (${airport.iata_code}) - ${airport.city_code}`,
		}));
	}, [airports]);

	const getAirportLabelById = (id) => {
		if (!airportOptions || !Array.isArray(airportOptions)) {
			return null;
		}
		const airport = airportOptions.find((airport) => airport.value === id);
		return airport ? airport.label : null;
	};

	const FIELDS = {
		id: { key: 'id', apiKey: 'id' },
		originAirportId: {
			key: 'originAirportId',
			apiKey: 'origin_airport_id',
			label: FIELD_LABELS.ROUTE.origin_airport_id,
			type: FIELD_TYPES.SELECT,
			options: airportOptions,
			formatter: (value) => getAirportLabelById(value) || value,
			validate: (value) => (!value ? VALIDATION_MESSAGES.ROUTE.origin_airport_id.REQUIRED : null),
		},
		destinationAirportId: {
			key: 'destinationAirportId',
			apiKey: 'destination_airport_id',
			label: FIELD_LABELS.ROUTE.destination_airport_id,
			type: FIELD_TYPES.SELECT,
			options: airportOptions,
			formatter: (value) => getAirportLabelById(value) || value,
			validate: (value) => (!value ? VALIDATION_MESSAGES.ROUTE.destination_airport_id.REQUIRED : null),
		},
	};

	const adminManager = useMemo(
		() =>
			createAdminManager(FIELDS, {
				addButtonText: (item) => UI_LABELS.ADMIN.modules.routes.add_button,
				editButtonText: (item) => UI_LABELS.ADMIN.modules.routes.edit_button,
			}),
		[FIELDS]
	);

	const handleAddRoute = (routeData) => dispatch(createRoute(adminManager.toApiFormat(routeData))).unwrap();
	const handleEditRoute = (routeData) => dispatch(updateRoute(adminManager.toApiFormat(routeData))).unwrap();
	const handleDeleteRoute = (id) => dispatch(deleteRoute(id)).unwrap();

	const handleDeleteAllRoutes = async () => {
		await dispatch(deleteAllRoutes()).unwrap();
		dispatch(fetchRoutes());
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
			onDeleteAll={handleDeleteAllRoutes}
			renderForm={adminManager.renderForm}
			addButtonText={UI_LABELS.ADMIN.modules.routes.add_button}
			isLoading={isLoading || airportsLoading}
			error={errors}
		/>
	);
};

export default RouteManagement;
