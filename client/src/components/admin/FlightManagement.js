import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Dialog, DialogTitle, DialogContent } from '@mui/material';

import AdminDataTable from '../../components/admin/AdminDataTable';

import TariffManagement from './TariffManagement';

import {
	fetchFlights,
	createFlight,
	updateFlight,
	deleteFlight,
} from '../../redux/actions/flight';
import { fetchTariffs } from '../../redux/actions/tariff';
import { fetchRoutes } from '../../redux/actions/route';
import { FIELD_TYPES, createAdminManager } from './utils';
import {
	FIELD_LABELS,
	UI_LABELS,
	VALIDATION_MESSAGES,
	getEnumOptions,
} from '../../constants';

const FlightManagement = () => {
	const dispatch = useDispatch();
	const { flights, isLoading, errors } = useSelector(
		(state) => state.flights
	);
	const { routes, isLoading: routesLoading } = useSelector(
		(state) => state.routes
	);

	const [selectedFlight, setSelectedFlight] = useState(null);
	const [tariffDialogOpen, setTariffDialogOpen] = useState(false);

	useEffect(() => {
		dispatch(fetchFlights());
		dispatch(fetchRoutes());
		dispatch(fetchTariffs());
	}, [dispatch]);

	const getRouteOptions = () => {
		if (!routes || !Array.isArray(routes)) {
			return [];
		}
		return routes.map((route) => ({
			value: route.id,
			label: `${route.flight_number} - ${route.origin_airport_id} -> ${route.destination_airport_id}`,
		}));
	};

	const getRouteById = (id) => {
		if (!routes || !Array.isArray(routes)) {
			return null;
		}
		return routes.find((route) => route.id === id);
	};

	const routeOptions = useMemo(() => getRouteOptions(), [routes]);

	const handleTariffManagement = (flight) => {
		setSelectedFlight(flight);
		setTariffDialogOpen(true);
	};

	const handleTariffDialogClose = () => {
		setTariffDialogOpen(false);
		setSelectedFlight(null);
	};

	const FIELDS = {
		id: { key: 'id', apiKey: 'id' },
		routeId: {
			key: 'routeId',
			apiKey: 'route_id',
			label: FIELD_LABELS.FLIGHT.route_id,
			type: FIELD_TYPES.SELECT,
			options: routeOptions,
			formatter: (value) => {
				const route = getRouteById(value);
				return route ? `${route.flight_number}` : value;
			},
			validate: (value) =>
				!value ? VALIDATION_MESSAGES.FLIGHT.route_id.REQUIRED : null,
		},
		scheduledDeparture: {
			key: 'scheduledDeparture',
			apiKey: 'scheduled_departure',
			label: FIELD_LABELS.FLIGHT.scheduled_departure,
			type: FIELD_TYPES.DATETIME,
			validate: (value) =>
				!value
					? VALIDATION_MESSAGES.FLIGHT.scheduled_departure.REQUIRED
					: null,
		},
		scheduledArrival: {
			key: 'scheduledArrival',
			apiKey: 'scheduled_arrival',
			label: FIELD_LABELS.FLIGHT.scheduled_arrival,
			type: FIELD_TYPES.DATETIME,
			validate: (value) =>
				!value
					? VALIDATION_MESSAGES.FLIGHT.scheduled_arrival.REQUIRED
					: null,
		},
		status: {
			key: 'status',
			apiKey: 'status',
			label: FIELD_LABELS.FLIGHT.status,
			type: FIELD_TYPES.SELECT,
			options: getEnumOptions('FLIGHT_STATUS'),
			validate: (value) =>
				!value ? VALIDATION_MESSAGES.FLIGHT.status.REQUIRED : null,
		},
		tariffs: {
			key: 'tariffs',
			label: FIELD_LABELS.FLIGHT.tariffs,
			excludeFromForm: true,
			formatter: () => UI_LABELS.ADMIN.modules.flights.manage_tariffs,
		},
	};

	const adminManager = useMemo(
		() =>
			createAdminManager(FIELDS, {
				renderOverrides: {
					routeId: (item) => {
						const route = getRouteById(item.routeId);
						return route
							? `${route.flight_number} (${route.origin_airport_id} - ${route.destination_airport_id})`
							: '';
					},
					tariffs: (item) => (
						<Button
							variant='contained'
							color='primary'
							size='small'
							onClick={(e) => {
								e.stopPropagation();
								handleTariffManagement(item);
							}}
						>
							{UI_LABELS.ADMIN.modules.flights.manage_tariffs}
						</Button>
					),
				},
				addButtonText: UI_LABELS.ADMIN.modules.flights.add_button,
				editButtonText: UI_LABELS.ADMIN.modules.flights.edit_button,
			}),
		[FIELDS, getRouteById]
	);

	const handleAddFlight = (flightData) => {
		dispatch(createFlight(adminManager.toApiFormat(flightData)));
	};

	const handleEditFlight = (flightData) => {
		dispatch(updateFlight(adminManager.toApiFormat(flightData)));
	};

	const handleDeleteFlight = (id) => {
		return dispatch(deleteFlight(id));
	};

	const formattedFlights = flights.map(adminManager.toUiFormat);

	return (
		<>
			<AdminDataTable
				title={UI_LABELS.ADMIN.modules.flights.management}
				data={formattedFlights}
				columns={adminManager.columns}
				onAdd={handleAddFlight}
				onEdit={handleEditFlight}
				onDelete={handleDeleteFlight}
				renderForm={adminManager.renderForm}
				addButtonText={UI_LABELS.ADMIN.modules.flights.add_button}
				isLoading={isLoading || routesLoading}
				error={errors}
			/>

			<Dialog
				open={tariffDialogOpen}
				onClose={handleTariffDialogClose}
				maxWidth='md'
				fullWidth
			>
				{selectedFlight && (
					<TariffManagement
						flight={selectedFlight}
						onClose={handleTariffDialogClose}
					/>
				)}
			</Dialog>
		</>
	);
};

export default FlightManagement;
