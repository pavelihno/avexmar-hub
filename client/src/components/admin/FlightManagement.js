import React, { useEffect, useState } from 'react';
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
import { useTheme, alpha } from '@mui/material/styles';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import AdminDataTable from '../../components/admin/AdminDataTable';
import FlightTariffManagement from './FlightTariffManagement';

import { downloadTemplate, uploadFile } from '../../api';

import { fetchFlights, createFlight, updateFlight, deleteFlight, deleteAllFlights } from '../../redux/actions/flight';
import { fetchAircrafts } from '../../redux/actions/aircraft';
import { fetchTariffs } from '../../redux/actions/tariff';
import { fetchFlightTariffs, deleteFlightTariff } from '../../redux/actions/flightTariff';
import { fetchRoutes } from '../../redux/actions/route';
import { fetchAirlines } from '../../redux/actions/airline';
import { fetchAirports } from '../../redux/actions/airport';
import { createAdminManager } from './utils';
import { FIELD_TYPES, formatNumber } from '../utils';
import { formatDate, formatTime, formatTimeToAPI, formatTimeToUI, validateDate, validateTime } from '../utils';
import { ENUM_LABELS, FIELD_LABELS, UI_LABELS, VALIDATION_MESSAGES, DEFAULT_TIME } from '../../constants';

const FlightManagement = () => {
	const dispatch = useDispatch();
	const { flights, isLoading, errors } = useSelector((state) => state.flights);
	const { routes, isLoading: routesLoading } = useSelector((state) => state.routes);
	const { airlines, isLoading: airlinesLoading } = useSelector((state) => state.airlines);
	const { aircrafts, isLoading: aircraftsLoading } = useSelector((state) => state.aircrafts);
	const { tariffs, isLoading: tariffsLoading } = useSelector((state) => state.tariffs);
	const { flightTariffs, isLoading: flightTariffsLoading } = useSelector((state) => state.flightTariffs);
	const { airports, isLoading: airportsLoading } = useSelector((state) => state.airports);

	const theme = useTheme();

	const [tariffDialogOpen, setTariffDialogOpen] = useState(false);
	const [tariffAction, setTariffAction] = useState(null);
	const [selectedFlightId, setSelectedFlightId] = useState(null);
	const [selectedFlightTariffId, setSelectedFlightTariffId] = useState(null);

	useEffect(() => {
		dispatch(fetchFlights());
		dispatch(fetchRoutes());
		dispatch(fetchAirlines());
		dispatch(fetchAircrafts());
		dispatch(fetchTariffs());
		dispatch(fetchFlightTariffs());
		dispatch(fetchAirports());
	}, [dispatch]);

	const getAirportById = (id) => {
		if (airportsLoading || !Array.isArray(airports)) {
			return null;
		}
		return airports.find((airport) => airport.id === id);
	};

	const getTariffById = (id) => {
		if (tariffsLoading || !Array.isArray(tariffs)) {
			return null;
		}
		return tariffs.find((tariff) => tariff.id === id);
	};

	const routeOptions =
		routesLoading || airportsLoading || !Array.isArray(routes) || !Array.isArray(airports)
			? []
			: routes.map((route) => {
					const origin = getAirportById(route.origin_airport_id);
					const dest = getAirportById(route.destination_airport_id);

					return {
						value: route.id,
						label: `${origin?.city_name} (${origin?.iata_code || '…'}) → ${dest?.city_name} (${
							dest?.iata_code || '…'
						})`,
					};
			  });

	const airlineOptions =
		!airlines || !Array.isArray(airlines)
			? []
			: airlines.map((airline) => ({
					value: airline.id,
					label: `${airline.name} (${airline.iata_code})`,
			  }));

	const aircraftOptions =
		aircraftsLoading || !Array.isArray(aircrafts)
			? []
			: aircrafts.map((aircraft) => ({
					value: aircraft.id,
					label: aircraft.type,
			  }));

	const [deleteFlightTariffDialog, setDeleteFlightTariffDialog] = useState({
		open: false,
		flightTariffId: null,
	});

	const handleAddFlightTariff = (flightId) => {
		setTariffAction('add');
		setSelectedFlightId(flightId);
		setTariffDialogOpen(true);
	};

	const handleEditFlightTariff = (flightId, flightTariffId) => {
		setTariffAction('edit');
		setSelectedFlightId(flightId);
		setSelectedFlightTariffId(flightTariffId);
		setTariffDialogOpen(true);
	};

	const handleOpenDeleteFlightTariffDialog = (flightTariffId) => {
		setDeleteFlightTariffDialog({ open: true, flightTariffId });
	};

	const handleCloseDeleteFlightTariffDialog = () => {
		setDeleteFlightTariffDialog({ open: false, flightTariffId: null });
	};

	const confirmDeleteFlightTariff = () => {
		dispatch(deleteFlightTariff(deleteFlightTariffDialog.flightTariffId));
		handleCloseDeleteFlightTariffDialog();
	};

	const handleTariffDialogClose = () => {
		setSelectedFlightId(null);
		setSelectedFlightTariffId(null);
		setTariffAction(null);
		setTariffDialogOpen(false);
	};

	const handleUpload = async (file) => {
		const res = await uploadFile('flights', file);
		dispatch(fetchFlights());
		dispatch(fetchFlightTariffs());
		return res;
	};

	const handleGetTemplate = async () => {
		await downloadTemplate('flights', 'flights_template.xlsx');
	};

	const FIELDS = {
		id: { key: 'id', apiKey: 'id' },
		airlineId: {
			key: 'airlineId',
			apiKey: 'airline_id',
			label: FIELD_LABELS.FLIGHT.airline_id,
			type: FIELD_TYPES.SELECT,
			options: airlineOptions,
			formatter: (value) => {
				const airline = airlineOptions.find((option) => option.value === value);
				return airline ? `${airline.label}` : value;
			},
			validate: (value) => (!value ? VALIDATION_MESSAGES.FLIGHT.airline_id.REQUIRED : null),
		},
                flightNumber: {
                        key: 'flightNumber',
                        apiKey: 'flight_number',
                        label: FIELD_LABELS.FLIGHT.flight_number,
                        type: FIELD_TYPES.TEXT,
                        validate: (value) => (!value ? VALIDATION_MESSAGES.FLIGHT.flight_number.REQUIRED : null),
                },
                note: {
                        key: 'note',
                        apiKey: 'note',
                        label: FIELD_LABELS.FLIGHT.note,
                        type: FIELD_TYPES.TEXT_AREA,
                        fullWidth: true,
                        excludeFromTable: true,
                },
                routeId: {
                        key: 'routeId',
                        apiKey: 'route_id',
                        label: FIELD_LABELS.FLIGHT.route_id,
                        type: FIELD_TYPES.SELECT,
			options: routeOptions,
			formatter: (value) => {
				const route = routeOptions.find((option) => option.value === value);
				return route ? `${route.label}` : value;
			},
			validate: (value) => (!value ? VALIDATION_MESSAGES.FLIGHT.route_id.REQUIRED : null),
		},
		aircraftId: {
			key: 'aircraftId',
			apiKey: 'aircraft_id',
			label: FIELD_LABELS.FLIGHT.aircraft_id,
			type: FIELD_TYPES.SELECT,
			options: aircraftOptions,
			formatter: (value) => {
				const aircraft = aircrafts?.find((a) => a.id === value);
				return aircraft ? aircraft.type : value;
			},
		},
		scheduledDeparture: {
			key: 'scheduledDeparture',
			apiKey: 'scheduled_departure',
			label: FIELD_LABELS.FLIGHT.scheduled_departure,
			type: FIELD_TYPES.DATE,
			formatter: (value) => formatDate(value),
			validate: (value) => {
				if (!value) return VALIDATION_MESSAGES.FLIGHT.scheduled_departure.REQUIRED;
				if (!validateDate(value)) return VALIDATION_MESSAGES.GENERAL.INVALID_DATE;
				return null;
			},
		},
		scheduledDepartureTime: {
			key: 'scheduledDepartureTime',
			apiKey: 'scheduled_departure_time',
			label: FIELD_LABELS.FLIGHT.scheduled_departure_time,
			type: FIELD_TYPES.TIME,
			defaultValue: DEFAULT_TIME,
			excludeFromTable: true,
			toApi: (value) => formatTimeToAPI(value),
			toUi: (value) => formatTimeToUI(value),
			formatter: (value) => formatTime(value),
			validate: (value) => {
				if (!value) return VALIDATION_MESSAGES.FLIGHT.scheduled_departure_time.REQUIRED;
				if (value && !validateTime(value)) return VALIDATION_MESSAGES.GENERAL.INVALID_TIME;
				return null;
			},
		},
		scheduledArrival: {
			key: 'scheduledArrival',
			apiKey: 'scheduled_arrival',
			label: FIELD_LABELS.FLIGHT.scheduled_arrival,
			type: FIELD_TYPES.DATE,
			excludeFromTable: true,
			formatter: (value) => formatDate(value),
			validate: (value) => {
				if (!value) return VALIDATION_MESSAGES.FLIGHT.scheduled_arrival.REQUIRED;
				if (!validateDate(value)) return VALIDATION_MESSAGES.GENERAL.INVALID_DATE;
				return null;
			},
		},
		scheduledArrivalTime: {
			key: 'scheduledArrivalTime',
			apiKey: 'scheduled_arrival_time',
			label: FIELD_LABELS.FLIGHT.scheduled_arrival_time,
			type: FIELD_TYPES.TIME,
			defaultValue: DEFAULT_TIME,
			excludeFromTable: true,
			toApi: (value) => formatTimeToAPI(value),
			toUi: (value) => formatTimeToUI(value),
			formatter: (value) => formatTime(value),
			validate: (value) => {
				if (!value) return VALIDATION_MESSAGES.FLIGHT.scheduled_arrival_time.REQUIRED;
				if (value && !validateTime(value)) return VALIDATION_MESSAGES.GENERAL.INVALID_TIME;
				return null;
			},
		},
		tariffs: {
			key: 'tariffs',
			type: FIELD_TYPES.CUSTOM,
			label: FIELD_LABELS.FLIGHT.tariffs,
			excludeFromForm: true,
			renderField: (item) => {
				const flightTariffsForFlight = flightTariffs.filter((ft) => ft.flight_id === item.id);

				return (
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'flex-start',
							minWidth: '200px',
						}}
					>
						{flightTariffsForFlight.length === 0 ? (
							<Tooltip title={UI_LABELS.ADMIN.modules.tariffs.add_button} placement='top'>
								<IconButton
									size='small'
									color='primary'
									onClick={(e) => {
										e.stopPropagation();
										handleAddFlightTariff(item.id);
									}}
								>
									<AddCircleIcon />
								</IconButton>
							</Tooltip>
						) : (
							<>
								{flightTariffsForFlight.map((ft) => {
									const baseTariff = getTariffById(ft.tariff_id) || {};
									const seatClass = ENUM_LABELS.SEAT_CLASS[baseTariff.seat_class];
									const orderNumber = baseTariff.order_number;
									const tariffPrice = baseTariff.price;
									const currency = ENUM_LABELS.CURRENCY[baseTariff.currency];
									const seatsNumber = ft.seats_number;

									const tariffLabel = `${seatClass} - ${
										UI_LABELS.ADMIN.modules.tariffs.tariff
									} ${orderNumber} - ${formatNumber(tariffPrice)} ${currency} - ${formatNumber(
										seatsNumber
									)} ${UI_LABELS.ADMIN.modules.tariffs.seats.toLowerCase()}`;

									return (
										<Box
											key={ft.id}
											sx={{
												display: 'flex',
												alignItems: 'center',
												mb: 0.5,
												backgroundColor: alpha(theme.palette.black, 0.04),
												borderRadius: 1,
												p: 0.5,
												width: 'auto',
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
												{tariffLabel}
											</Typography>
											<Box sx={{ display: 'flex', flexShrink: 0 }}>
												<Tooltip
													title={UI_LABELS.ADMIN.modules.tariffs.edit_button}
													placement='top'
												>
													<IconButton
														size='small'
														color='primary'
														onClick={(e) => {
															e.stopPropagation();
															e.currentTarget.blur();
															handleEditFlightTariff(item.id, ft.id);
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
															e.currentTarget.blur();
															handleOpenDeleteFlightTariffDialog(ft.id);
														}}
													>
														<DeleteIcon fontSize='small' />
													</IconButton>
												</Tooltip>
											</Box>
										</Box>
									);
								})}
								<Tooltip title={UI_LABELS.ADMIN.modules.flights.add_tariff} placement='top'>
									<IconButton
										size='small'
										color='primary'
										onClick={(e) => {
											e.stopPropagation();
											e.currentTarget.blur();
											handleAddFlightTariff(item.id);
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

	const adminManager = createAdminManager(FIELDS, {
		addButtonText: (item) => UI_LABELS.ADMIN.modules.flights.add_button,
		editButtonText: (item) => UI_LABELS.ADMIN.modules.flights.edit_button,
	});

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
				uploadButtonText={UI_LABELS.ADMIN.modules.flights.upload_button}
				uploadTemplateButtonText={UI_LABELS.ADMIN.modules.flights.upload_template_button}
				getUploadTemplate={handleGetTemplate}
				onUpload={handleUpload}
				isLoading={
					isLoading ||
					routesLoading ||
					airlinesLoading ||
					aircraftsLoading ||
					tariffsLoading ||
					flightTariffsLoading ||
					airportsLoading
				}
				error={errors}
			/>

			<FlightTariffManagement
				flightId={selectedFlightId}
				tariffDialogOpen={tariffDialogOpen}
				onClose={handleTariffDialogClose}
				action={tariffAction}
				flightTariffId={selectedFlightTariffId}
			/>

			{/* Delete tariff dialog */}
			<Dialog open={deleteFlightTariffDialog.open} onClose={handleCloseDeleteFlightTariffDialog}>
				<DialogTitle id='delete-tariff-dialog-title'>{UI_LABELS.MESSAGES.confirm_action}</DialogTitle>
				<DialogContent>
					<Typography id='delete-tariff-dialog-description'>
						{UI_LABELS.ADMIN.modules.tariffs.confirm_delete}
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseDeleteFlightTariffDialog} color='primary'>
						{UI_LABELS.BUTTONS.cancel}
					</Button>
					<Button onClick={confirmDeleteFlightTariff} color='error' variant='contained'>
						{UI_LABELS.BUTTONS.delete}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

export default FlightManagement;
