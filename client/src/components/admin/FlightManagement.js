import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
	Tooltip,
	IconButton,
	Box,
	Typography,
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import AdminDataTable from '../../components/admin/AdminDataTable';
import TariffManagement from './TariffManagement';

import {
	fetchFlights,
	createFlight,
	updateFlight,
	deleteFlight,
} from '../../redux/actions/flight';
import { fetchTariffs, deleteTariff } from '../../redux/actions/tariff';
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
	const { tariffs } = useSelector((state) => state.tariffs);

	const [selectedFlight, setSelectedFlight] = useState(null);
	const [tariffDialogOpen, setTariffDialogOpen] = useState(false);
	const [tariffAction, setTariffAction] = useState(null);
	const [selectedTariffId, setSelectedTariffId] = useState(null);

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

	const handleAddTariff = (flight) => {
		setSelectedFlight(flight);
		setTariffAction('add');
		setTariffDialogOpen(true);
	};

	const handleEditTariff = (flight, tariffId) => {
		setSelectedFlight(flight);
		setTariffAction('edit');
		setSelectedTariffId(tariffId);
		setTariffDialogOpen(true);
	};

	const handleDeleteTariff = (tariffId) => {
		if (window.confirm(UI_LABELS.ADMIN.confirm_delete)) {
			dispatch(deleteTariff(tariffId));
		}
	};

	const handleTariffDialogClose = () => {
		setSelectedFlight(null);
		setTariffAction(null);
		setSelectedTariffId(null);
		setTariffDialogOpen(false);
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
				return route
					? `${route.flight_number} (${route.origin_airport_id} - ${route.destination_airport_id})`
					: value;
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
			type: FIELD_TYPES.CUSTOM,
			label: FIELD_LABELS.FLIGHT.tariffs,
			excludeFromForm: true,
			renderField: (item) => {
				const flightTariffs = tariffs.filter(
					(tariff) => tariff.flight_id === item.id
				);

				return (
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'flex-start',
							minWidth: '200px',
						}}
					>
						{flightTariffs.length === 0 ? (
							<Tooltip
								title={
									UI_LABELS.ADMIN.modules.tariffs.add_button
								}
								placement='top'
							>
								<IconButton
									size='small'
									color='primary'
									onClick={(e) => {
										e.stopPropagation();
										const flightCopy = { ...item };
										handleAddTariff(flightCopy);
									}}
								>
									<AddCircleIcon />
								</IconButton>
							</Tooltip>
						) : (
							<>
								{flightTariffs.map((tariff) => (
									<Box
										key={tariff.id}
										sx={{
											display: 'flex',
											alignItems: 'center',
											mb: 0.5,
											backgroundColor: 'rgba(0,0,0,0.04)',
											borderRadius: 1,
											p: 0.5,
											width: '100%',
										}}
									>
										<Typography
											variant='body2'
											sx={{
												mr: 1,
												flexGrow: 1,
												whiteSpace: 'nowrap',
												overflow: 'hidden',
												textOverflow: 'ellipsis',
											}}
										>
											{`${tariff.seat_class}: ${tariff.price} ${tariff.currency}`}
										</Typography>
										<Box
											sx={{
												display: 'flex',
												flexShrink: 0,
											}}
										>
											<Tooltip
												title={
													UI_LABELS.ADMIN.modules
														.tariffs.edit_button
												}
												placement='top'
											>
												<IconButton
													size='small'
													color='primary'
													onClick={(e) => {
														e.stopPropagation();
														const flightCopy = {
															...item,
														};
														handleEditTariff(
															flightCopy,
															tariff.id
														);
													}}
												>
													<EditIcon fontSize='small' />
												</IconButton>
											</Tooltip>
											<Tooltip
												title={
													UI_LABELS.ADMIN.modules
														.tariffs.delete_button
												}
												placement='top'
											>
												<IconButton
													size='small'
													color='error'
													onClick={(e) => {
														e.stopPropagation();
														handleDeleteTariff(
															tariff.id
														);
													}}
												>
													<DeleteIcon fontSize='small' />
												</IconButton>
											</Tooltip>
										</Box>
									</Box>
								))}

								<Tooltip
									title={
										UI_LABELS.ADMIN.modules.flights
											.add_tariff
									}
									placement='top'
								>
									<IconButton
										size='small'
										color='primary'
										onClick={(e) => {
											e.stopPropagation();
											const flightCopy = { ...item };
											handleAddTariff(flightCopy);
										}}
										sx={{ mt: 0.5 }}
									>
										<AddCircleIcon />
									</IconButton>
								</Tooltip>
							</>
						)}
					</Box>
				);
			},
		},
	};

	const adminManager = useMemo(
		() =>
			createAdminManager(FIELDS, {
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

			<TariffManagement
				flight={selectedFlight}
				tariffDialogOpen={tariffDialogOpen}
				onClose={handleTariffDialogClose}
				action={tariffAction}
				tariffId={selectedTariffId}
			/>
		</>
	);
};

export default FlightManagement;
