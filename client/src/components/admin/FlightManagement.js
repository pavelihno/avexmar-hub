import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
	Tooltip,
	IconButton,
	Button,
	Box,
	Typography,
	Dialog,
	DialogContent,
	DialogTitle,
	DialogActions,
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import AdminDataTable from '../../components/admin/AdminDataTable';
import TariffManagement from './TariffManagement';

import { fetchFlights, createFlight, updateFlight, deleteFlight, deleteAllFlights } from '../../redux/actions/flight';
import { fetchTariffs, deleteTariff } from '../../redux/actions/tariff';
import { fetchRoutes } from '../../redux/actions/route';
import { fetchAirlines } from '../../redux/actions/airline';
import { fetchAirports } from '../../redux/actions/airport';
import { FIELD_TYPES, createAdminManager, formatDateTime } from './utils';
import { ENUM_LABELS, FIELD_LABELS, UI_LABELS, VALIDATION_MESSAGES, getEnumOptions } from '../../constants';

const FlightManagement = () => {
	const dispatch = useDispatch();
	const { flights, isLoading, errors } = useSelector((state) => state.flights);
	const { routes, isLoading: routesLoading } = useSelector((state) => state.routes);
	const { airlines, isLoading: airlinesLoading } = useSelector((state) => state.airlines);
	const { tariffs } = useSelector((state) => state.tariffs);
	const { airports, isLoading: airportsLoading } = useSelector((state) => state.airports);

	const [tariffDialogOpen, setTariffDialogOpen] = useState(false);
	const [tariffAction, setTariffAction] = useState(null);
	const [selectedFlightId, setSelectedFlightId] = useState(null);
	const [selectedTariffId, setSelectedTariffId] = useState(null);

	useEffect(() => {
		dispatch(fetchFlights());
		dispatch(fetchRoutes());
		dispatch(fetchAirlines());
		dispatch(fetchTariffs());
		dispatch(fetchAirports());
	}, [dispatch]);

	const routeOptions = useMemo(() => {
		if (routesLoading || airportsLoading || !Array.isArray(routes) || !Array.isArray(airports)) {
			return [];
		}
		return routes.map((route) => {
			const origin = airports.find((a) => a.id === route.origin_airport_id);
			const dest = airports.find((a) => a.id === route.destination_airport_id);

			return {
				value: route.id,
				label: `${origin?.city_name} (${origin?.name || '…'}, ${origin?.iata_code || '…'}) → ${
					dest?.city_name
				} (${dest?.name || '…'}, ${dest?.iata_code || '…'})`,
			};
		});
	}, [routes, airports, routesLoading, airportsLoading]);

	const getRouteById = (id) => {
		if (!routes || !Array.isArray(routes)) {
			return null;
		}
		return routes.find((route) => route.id === id);
	};

	const getAirlineOptions = () => {
		if (!airlines || !Array.isArray(airlines)) {
			return [];
		}
		return airlines.map((airline) => ({
			value: airline.id,
			label: `${airline.name} (${airline.iata_code})`,
		}));
	};

	const getAirlineById = (id) => {
		if (!airlines || !Array.isArray(airlines)) {
			return null;
		}
		return airlines.find((airline) => airline.id === id);
	};

	const airlineOptions = useMemo(() => getAirlineOptions(), [airlines]);

	const [deleteTariffDialog, setDeleteTariffDialog] = useState({
		open: false,
		tariffId: null,
	});

	const handleAddTariff = (flightId) => {
		setTariffAction('add');
		setSelectedFlightId(flightId);
		setTariffDialogOpen(true);
	};

	const handleEditTariff = (flightId, tariffId) => {
		setTariffAction('edit');
		setSelectedFlightId(flightId);
		setSelectedTariffId(tariffId);
		setTariffDialogOpen(true);
	};

	const handleOpenDeleteTariffDialog = (tariffId) => {
		setDeleteTariffDialog({ open: true, tariffId });
	};

	const handleCloseDeleteTariffDialog = () => {
		setDeleteTariffDialog({ open: false, tariffId: null });
	};

	const confirmDeleteTariff = () => {
		dispatch(deleteTariff(deleteTariffDialog.tariffId));
		handleCloseDeleteTariffDialog();
	};

	const handleTariffDialogClose = () => {
		setSelectedFlightId(null);
		setTariffAction(null);
		setSelectedTariffId(null);
		setTariffDialogOpen(false);
	};

	const FIELDS = {
		id: { key: 'id', apiKey: 'id' },
		flightNumber: {
			key: 'flightNumber',
			apiKey: 'flight_number',
			label: FIELD_LABELS.FLIGHT.flight_number,
			type: FIELD_TYPES.TEXT,
			validate: (value) => (!value ? VALIDATION_MESSAGES.FLIGHT.flight_number.REQUIRED : null),
		},
		airlineId: {
			key: 'airlineId',
			apiKey: 'airline_id',
			label: FIELD_LABELS.FLIGHT.airline_id,
			type: FIELD_TYPES.SELECT,
			options: airlineOptions,
			formatter: (value) => {
				const airline = getAirlineById(value);
				return airline ? `${airline.iata_code}` : value;
			},
			validate: (value) => (!value ? VALIDATION_MESSAGES.FLIGHT.airline_id.REQUIRED : null),
		},
		routeId: {
			key: 'routeId',
			apiKey: 'route_id',
			label: FIELD_LABELS.FLIGHT.route_id,
			type: FIELD_TYPES.SELECT,
			fullWidth: true,
			options: routeOptions,
			formatter: (value) => {
				const route = getRouteById(value);
				return route ? `${route.origin_airport_id} -> ${route.destination_airport_id}` : value;
			},
			validate: (value) => (!value ? VALIDATION_MESSAGES.FLIGHT.route_id.REQUIRED : null),
		},
		scheduledDeparture: {
			key: 'scheduledDeparture',
			apiKey: 'scheduled_departure',
			label: FIELD_LABELS.FLIGHT.scheduled_departure,
			type: FIELD_TYPES.DATETIME,
			formatter: (value) => formatDateTime(value),
			validate: (value) => (!value ? VALIDATION_MESSAGES.FLIGHT.scheduled_departure.REQUIRED : null),
		},
		scheduledArrival: {
			key: 'scheduledArrival',
			apiKey: 'scheduled_arrival',
			label: FIELD_LABELS.FLIGHT.scheduled_arrival,
			type: FIELD_TYPES.DATETIME,
			formatter: (value) => formatDateTime(value),
			validate: (value) => (!value ? VALIDATION_MESSAGES.FLIGHT.scheduled_arrival.REQUIRED : null),
		},
		tariffs: {
			key: 'tariffs',
			type: FIELD_TYPES.CUSTOM,
			label: FIELD_LABELS.FLIGHT.tariffs,
			excludeFromForm: true,
			renderField: (item) => {
				const flightTariffs = tariffs.filter((tariff) => tariff.flight_id === item.id);

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
							<Tooltip title={UI_LABELS.ADMIN.modules.tariffs.add_button} placement='top'>
								<IconButton
									size='small'
									color='primary'
									onClick={(e) => {
										e.stopPropagation();
										handleAddTariff(item.id);
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
											{`${ENUM_LABELS.SEAT_CLASS[tariff.seat_class] || tariff.seat_class} - ${
												tariff.price
											} ${ENUM_LABELS.CURRENCY[tariff.currency] || tariff.currency}`}
										</Typography>
										<Box
											sx={{
												display: 'flex',
												flexShrink: 0,
											}}
										>
											<Tooltip
												title={UI_LABELS.ADMIN.modules.tariffs.edit_button}
												placement='top'
											>
												<IconButton
													size='small'
													color='primary'
													onClick={(e) => {
														e.stopPropagation();
														handleEditTariff(item.id, tariff.id);
													}}
												>
													<EditIcon fontSize='small' />
												</IconButton>
											</Tooltip>
											<Tooltip
												title={UI_LABELS.ADMIN.modules.tariffs.delete_button}
												placement='top'
											>
												<IconButton
													size='small'
													color='error'
													onClick={(e) => {
														e.stopPropagation();
														handleOpenDeleteTariffDialog(tariff.id);
													}}
												>
													<DeleteIcon fontSize='small' />
												</IconButton>
											</Tooltip>
										</Box>
									</Box>
								))}

								<Tooltip title={UI_LABELS.ADMIN.modules.flights.add_tariff} placement='top'>
									<IconButton
										size='small'
										color='primary'
										onClick={(e) => {
											e.stopPropagation();
											handleAddTariff(item.id);
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
		[FIELDS, getRouteById, getAirlineById]
	);

	const handleAddFlight = (flightData) => dispatch(createFlight(adminManager.toApiFormat(flightData))).unwrap();
	const handleEditFlight = (flightData) => dispatch(updateFlight(adminManager.toApiFormat(flightData))).unwrap();
	const handleDeleteFlight = (id) => dispatch(deleteFlight(id)).unwrap();

	const handleDeleteAllFlights = async () => {
		await dispatch(deleteAllFlights()).unwrap();
		dispatch(fetchFlights());
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
				onDeleteAll={handleDeleteAllFlights}
				renderForm={adminManager.renderForm}
				addButtonText={UI_LABELS.ADMIN.modules.flights.add_button}
				isLoading={isLoading || routesLoading || airlinesLoading}
				error={errors}
			/>

			<TariffManagement
				flightId={selectedFlightId}
				tariffDialogOpen={tariffDialogOpen}
				onClose={handleTariffDialogClose}
				action={tariffAction}
				tariffId={selectedTariffId}
			/>

			{/* Delete tariff dialog */}
			<Dialog open={deleteTariffDialog.open} onClose={handleCloseDeleteTariffDialog}>
				<DialogTitle id='delete-tariff-dialog-title'>{UI_LABELS.MESSAGES.confirm_action}</DialogTitle>
				<DialogContent>
					<Typography id='delete-tariff-dialog-description'>
						{UI_LABELS.ADMIN.modules.tariffs.confirm_delete}
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseDeleteTariffDialog} color='primary'>
						{UI_LABELS.BUTTONS.cancel}
					</Button>
					<Button onClick={confirmDeleteTariff} color='error' variant='contained'>
						{UI_LABELS.BUTTONS.delete}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

export default FlightManagement;
