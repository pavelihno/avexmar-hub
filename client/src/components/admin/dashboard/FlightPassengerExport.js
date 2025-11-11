import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
	Box,
	Button,
	Typography,
	IconButton,
	Snackbar,
	Alert,
	Stack,
	TableCell,
	Divider,
	Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ClearAllIcon from '@mui/icons-material/ClearAll';

import { useDispatch, useSelector } from 'react-redux';

import Base from '../../Base';
import { formatDate, formatDateTime, createFieldRenderer, FIELD_TYPES } from '../../utils';
import { UI_LABELS, FILE_NAME_TEMPLATES, DATE_API_FORMAT } from '../../../constants';
import { fetchExportData, downloadExport } from '../../../redux/actions/export';
import DataExportTable from './DataExportTable';

function descendingComparator(a, b, orderBy) {
	if (b[orderBy] < a[orderBy]) {
		return -1;
	}
	if (b[orderBy] > a[orderBy]) {
		return 1;
	}
	return 0;
}

function getComparator(order, orderBy) {
	return order === 'desc'
		? (a, b) => descendingComparator(a, b, orderBy)
		: (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
	const stabilized = array.map((el, index) => [el, index]);
	stabilized.sort((a, b) => {
		const order = comparator(a[0], b[0]);
		if (order !== 0) return order;
		return a[1] - b[1];
	});
	return stabilized.map((el) => el[0]);
}

const initialAutoFilters = {
	fromDate: '',
	toDate: '',
};

const mapAutoFiltersToParams = (filters) => {
	const params = {};
	if (filters.fromDate) params.from_date = filters.fromDate;
	if (filters.toDate) params.to_date = filters.toDate;
	return params;
};

const FlightPassengerExport = () => {
	const dispatch = useDispatch();

	const { data: exportData = {}, isLoading, errors } = useSelector((state) => state.exports);
	const routes = exportData.routes || [];
	const flights = exportData.flights || [];
	const pendingExportData = exportData.pendingTicketBookings || {};
	const pendingFlights = pendingExportData.flights || [];
	const pendingSummary = pendingExportData.summary || {};

	const [routeId, setRouteId] = useState('');
	const [flightId, setFlightId] = useState('');
	const [notification, setNotification] = useState({ open: false, message: '', severity: 'error' });
	const [flightDate, setFlightDate] = useState('');
	const [autoFilters, setAutoFilters] = useState(initialAutoFilters);
	const [autoSearchPerformed, setAutoSearchPerformed] = useState(false);
	const shouldShowAutoResults = autoSearchPerformed && pendingFlights.length > 0;
	const [autoSectionLoading, setAutoSectionLoading] = useState(false);
	const [selectedFlightIds, setSelectedFlightIds] = useState([]);

	// Pagination and sorting for auto export
	const [autoPage, setAutoPage] = useState(0);
	const [autoRowsPerPage, setAutoRowsPerPage] = useState(10);
	const [autoOrder, setAutoOrder] = useState('desc');
	const [autoOrderBy, setAutoOrderBy] = useState('scheduledDeparture');

	// Pagination and sorting for flight export
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [order, setOrder] = useState('desc');
	const [orderBy, setOrderBy] = useState('scheduledDeparture');

	useEffect(() => {
		dispatch(
			fetchExportData({
				key: 'routes',
				endpoint: '/exports/flight-passengers/flight/routes',
			})
		);
	}, [dispatch]);

	useEffect(() => {
		if (errors) {
			setNotification({ open: true, message: errors?.message || UI_LABELS.ERRORS.unknown, severity: 'error' });
		}
	}, [errors]);

	const selectedFlight = useMemo(() => flights.find((f) => String(f.id) === String(flightId)), [flights, flightId]);

	const sortedAutoRows = useMemo(() => {
		const rows = pendingFlights.map((flight) => ({
			id: flight.id,
			flightNumber: flight.flight_number || '',
			scheduledDeparture: flight.scheduled_departure ? new Date(flight.scheduled_departure).getTime() : 0,
			scheduledDepartureFormatted: flight.scheduled_departure,
			airlineName: (flight.airline_name || '').toLowerCase(),
			airlineNameDisplay: flight.airline_name || '',
			route: flight.route || '',
			totalPassengerCount: flight.total_passenger_count || 0,
			unticketed: flight.unticketed_passenger_count || 0,
			bookingCount: flight.booking_count || 0,
			unticketed_bookings: flight.unticketed_booking_count || 0,
		}));

		return stableSort(rows, getComparator(autoOrder, autoOrderBy));
	}, [pendingFlights, autoOrder, autoOrderBy]);

	const sortedRows = useMemo(() => {
		if (!routeId) return [];

		const rows = flights
			.filter((flight) => {
				if (!flightDate) return true;
				const departureDateKey = formatDate(flight.scheduled_departure, DATE_API_FORMAT);
				return departureDateKey === flightDate;
			})
			.map((flight) => ({
				id: flight.id,
				airlineFlightNumber: flight.airline_flight_number || '',
				scheduledDeparture: flight.scheduled_departure ? new Date(flight.scheduled_departure).getTime() : 0,
				scheduledDepartureFormatted: flight.scheduled_departure,
				totalPassengerCount: flight.total_passenger_count || 0,
				unticketed: flight.unticketed_passenger_count || 0,
				bookingCount: flight.booking_count || 0,
				unticketed_bookings: flight.unticketed_booking_count || 0,
			}));

		return stableSort(rows, getComparator(order, orderBy));
	}, [flights, flightDate, routeId, order, orderBy]);

	useEffect(() => {
		if (flightId && !sortedRows.some((row) => String(row.id) === String(flightId))) {
			setFlightId('');
		}
	}, [sortedRows, flightId]);

	useEffect(() => {
		setPage(0);
	}, [routeId, flightDate]);

	const handleRouteChange = (value) => {
		const id = value;
		setRouteId(id);
		setFlightId('');
		setFlightDate('');
		setPage(0);

		if (id) {
			dispatch(
				fetchExportData({
					key: 'flights',
					endpoint: `/exports/flight-passengers/flight/routes/${id}`,
				})
			);
		}
	};

	const handleFlightResetFilters = () => {
		setRouteId('');
		setFlightId('');
		setFlightDate('');
		setPage(0);
	};

	const handleSelectFlight = (id) => {
		setFlightId((prev) => (String(prev) === String(id) ? '' : String(id)));
	};

	const handleAutoFilterChange = (field, value) => {
		setAutoFilters((prev) => ({
			...prev,
			[field]: value || '',
		}));
	};

	const handleAutoResetFilters = () => {
		setAutoFilters(initialAutoFilters);
		setAutoSearchPerformed(false);
		setAutoPage(0);
		setSelectedFlightIds([]);
	};

	const handleAutoRequestSort = (property) => {
		const isAsc = autoOrderBy === property && autoOrder === 'asc';
		setAutoOrder(isAsc ? 'desc' : 'asc');
		setAutoOrderBy(property);
		setAutoPage(0);
	};

	const handleAutoChangePage = (event, newPage) => {
		setAutoPage(newPage);
	};

	const handleAutoChangeRowsPerPage = (event) => {
		setAutoRowsPerPage(parseInt(event.target.value, 10));
		setAutoPage(0);
	};

	const handleAutoToggleFlight = (flightId) => {
		setSelectedFlightIds((prev) => {
			if (prev.includes(flightId)) {
				return prev.filter((id) => id !== flightId);
			}
			return [...prev, flightId];
		});
	};

	const handleAutoToggleAll = () => {
		if (selectedFlightIds.length === sortedAutoRows.length) {
			setSelectedFlightIds([]);
		} else {
			setSelectedFlightIds(sortedAutoRows.map((row) => row.id).filter(Boolean));
		}
	};

	const fetchPendingBookings = (filters) =>
		dispatch(
			fetchExportData({
				key: 'pendingTicketBookings',
				endpoint: '/exports/flight-passengers',
				params: mapAutoFiltersToParams(filters),
			})
		).unwrap();

	const handleAutoSearch = async () => {
		setAutoSectionLoading(true);
		setAutoSearchPerformed(true);
		try {
			const result = await fetchPendingBookings(autoFilters);
			// Select all flights by default
			const flights = result?.data?.flights || result?.flights || [];
			const allFlightIds = flights.map((f) => f.id).filter(Boolean);
			setSelectedFlightIds(allFlightIds);
		} catch (err) {
			// Error notification handled globally
		} finally {
			setAutoSectionLoading(false);
		}
	};

	const handleAutoDownload = async () => {
		if (!pendingFlights.length || !selectedFlightIds.length) return;
		setAutoSectionLoading(true);
		try {
			const data = await dispatch(
				downloadExport({
					endpoint: '/exports/flight-passengers',
					method: 'post',
					data: {
						...mapAutoFiltersToParams(autoFilters),
						flight_ids: selectedFlightIds,
					},
				})
			).unwrap();

			const filename = FILE_NAME_TEMPLATES.PENDING_PASSENGERS_EXPORT(
				formatDate(autoFilters.fromDate),
				formatDate(autoFilters.toDate),
				formatDateTime(Date.now(), 'dd_MM_yyyy_HH_mm')
			);
			const url = window.URL.createObjectURL(new Blob([data]));
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', filename);
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(url);

			setNotification({
				open: true,
				message: UI_LABELS.ADMIN.dashboard.flightPassengers.messages.success,
				severity: 'success',
			});

			try {
				const result = await fetchPendingBookings(autoFilters);
				// Update selected flights after refresh
				const flights = result?.data?.flights || result?.flights || [];
				const allFlightIds = flights.map((f) => f.id).filter(Boolean);
				setSelectedFlightIds(allFlightIds);
			} catch (err) {
				// Error notification handled globally
			}
		} catch (err) {
			// Error notification handled globally
		} finally {
			setAutoSectionLoading(false);
		}
	};

	const handleRequestSort = (property) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
		setPage(0);
	};

	const handleChangePage = (event, newPage) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (event) => {
		setRowsPerPage(parseInt(event.target.value, 10));
		setPage(0);
	};

	const autoHeadCells = useMemo(
		() => [
			{
				id: 'flightNumber',
				label: UI_LABELS.ADMIN.dashboard.flightPassengers.tables.auto.flight,
			},
			{
				id: 'scheduledDeparture',
				label: UI_LABELS.ADMIN.dashboard.flightPassengers.tables.auto.date,
			},
			{
				id: 'route',
				label: UI_LABELS.ADMIN.dashboard.flightPassengers.tables.auto.route,
			},
			{
				id: 'passengerCount',
				label: UI_LABELS.ADMIN.dashboard.flightPassengers.tables.auto.passengers,
			},
			{
				id: 'bookingCount',
				label: UI_LABELS.ADMIN.dashboard.flightPassengers.tables.auto.bookings,
			},
		],
		[]
	);

	const headCells = useMemo(
		() => [
			{
				id: 'airlineFlightNumber',
				label: UI_LABELS.ADMIN.dashboard.flightPassengers.tables.manual.flight,
			},
			{
				id: 'scheduledDeparture',
				label: UI_LABELS.ADMIN.dashboard.flightPassengers.tables.manual.date,
			},
			{
				id: 'passengerCount',
				label: UI_LABELS.ADMIN.dashboard.flightPassengers.tables.manual.passengers,
			},
			{
				id: 'bookingCount',
				label: UI_LABELS.ADMIN.dashboard.flightPassengers.tables.manual.bookings,
			},
		],
		[]
	);

	const handleDownload = async () => {
		if (!selectedFlight) return;
		try {
			const data = await dispatch(
				downloadExport({
					endpoint: '/exports/flight-passengers/flight',
					method: 'post',
					params: {
						flight_id: selectedFlight.id,
					},
				})
			).unwrap();

			const flightNumber = selectedFlight.airline_flight_number;
			const departureDate = selectedFlight.scheduled_departure;
			const filename = FILE_NAME_TEMPLATES.FLIGHT_PASSENGERS_EXPORT(
				flightNumber,
				formatDate(departureDate),
				formatDateTime(Date.now(), 'dd_MM_yyyy_HH_mm')
			);

			const url = window.URL.createObjectURL(new Blob([data]));
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', filename);
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(url);
		} catch (err) {
			setNotification({
				open: true,
				message: (err && err.message) || UI_LABELS.ERRORS.unknown,
				severity: 'error',
			});
		}
	};

	const closeNotification = () =>
		setNotification((prev) => ({
			...prev,
			open: false,
		}));

	return (
		<Base>
			<Box sx={{ p: { xs: 2, md: 3 } }}>
				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						flexWrap: 'wrap',
						gap: 1.5,
						mb: { xs: 2, md: 3 },
					}}
				>
					<IconButton
						component={Link}
						to='/admin'
						sx={{
							mr: { xs: 0, md: 1 },
							alignSelf: 'center',
						}}
					>
						<ArrowBackIcon />
					</IconButton>
					<Typography variant='h4'>{UI_LABELS.ADMIN.dashboard.flightPassengers.title}</Typography>
				</Box>

				<Box sx={{ mb: { xs: 3, md: 4 } }}>
					<Typography variant='h4' sx={{ mb: 1 }}>
						{UI_LABELS.ADMIN.dashboard.flightPassengers.sections.auto.title}
					</Typography>
					<Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
						{UI_LABELS.ADMIN.dashboard.flightPassengers.sections.auto.description}
					</Typography>

					<Stack spacing={2}>
						<Stack
							direction={{ xs: 'column', md: 'row' }}
							spacing={2}
							alignItems={{ xs: 'stretch', md: 'flex-start' }}
						>
							<Box sx={{ flex: { xs: '1 1 auto', md: '0 1 220px' } }}>
								{createFieldRenderer({
									label: UI_LABELS.ADMIN.dashboard.flightPassengers.filters.fromDate,
									type: FIELD_TYPES.DATE,
								})({
									value: autoFilters.fromDate,
									onChange: (val) => handleAutoFilterChange('fromDate', val),
									fullWidth: true,
									disabled: autoSectionLoading,
									size: 'medium',
									maxDate: formatDate(new Date(), DATE_API_FORMAT),
								})}
							</Box>
							<Box sx={{ flex: { xs: '1 1 auto', md: '0 1 220px' } }}>
								{createFieldRenderer({
									label: UI_LABELS.ADMIN.dashboard.flightPassengers.filters.toDate,
									type: FIELD_TYPES.DATE,
								})({
									value: autoFilters.toDate,
									onChange: (val) => handleAutoFilterChange('toDate', val),
									fullWidth: true,
									disabled: autoSectionLoading,
									size: 'medium',
									maxDate: formatDate(new Date(), DATE_API_FORMAT),
								})}
							</Box>

							<Button
								variant='contained'
								onClick={handleAutoSearch}
								disabled={autoSectionLoading}
								sx={{
									minHeight: 48,
									whiteSpace: 'nowrap',
									width: { xs: '100%', md: 'auto' },
								}}
							>
								{UI_LABELS.ADMIN.dashboard.flightPassengers.filters.search}
							</Button>

							<Button
								variant='outlined'
								color='primary'
								onClick={handleAutoResetFilters}
								disabled={autoSectionLoading || (!autoFilters.fromDate && !autoFilters.toDate)}
								startIcon={<ClearAllIcon />}
								sx={{
									minHeight: 48,
									whiteSpace: 'nowrap',
									width: { xs: '100%', md: 'auto' },
								}}
							>
								{UI_LABELS.ADMIN.dashboard.flightPassengers.filters.reset}
							</Button>
						</Stack>

						{shouldShowAutoResults && (
							<Box
								sx={{
									display: 'flex',
									alignItems: 'center',
									gap: 2,
									px: 2,
									py: 1.5,
									borderRadius: 1,
									bgcolor: 'background.lightBlue',
									flexWrap: 'wrap',
								}}
							>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
									<Typography variant='body2' color='text.secondary'>
										{UI_LABELS.ADMIN.dashboard.flightPassengers.summary.flights}:
									</Typography>
									<Typography variant='body2' fontWeight='medium'>
										{pendingSummary.flight_count || 0}
									</Typography>
								</Box>
								<Divider orientation='vertical' flexItem />
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
									<Typography variant='body2' color='text.secondary'>
										{UI_LABELS.ADMIN.dashboard.flightPassengers.summary.bookings}:
									</Typography>
									<Typography variant='body2' fontWeight='medium'>
										{pendingSummary.booking_count || 0}
									</Typography>
								</Box>
								<Divider orientation='vertical' flexItem />
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
									<Typography variant='body2' color='text.secondary'>
										{UI_LABELS.ADMIN.dashboard.flightPassengers.summary.passengers}:
									</Typography>
									<Typography variant='body2' fontWeight='medium'>
										{pendingSummary.unticketed_passenger_count || 0}
									</Typography>
								</Box>
							</Box>
						)}

						<DataExportTable
							headCells={autoHeadCells}
							rows={shouldShowAutoResults ? sortedAutoRows : []}
							emptyMessage={
								autoSearchPerformed
									? UI_LABELS.ADMIN.dashboard.flightPassengers.messages.empty
									: UI_LABELS.ADMIN.dashboard.flightPassengers.messages.prompt
							}
							isLoading={autoSectionLoading}
							order={autoOrder}
							orderBy={autoOrderBy}
							onRequestSort={handleAutoRequestSort}
							page={autoPage}
							rowsPerPage={autoRowsPerPage}
							onPageChange={handleAutoChangePage}
							onRowsPerPageChange={handleAutoChangeRowsPerPage}
							showSelection={true}
							selectedId={null}
							onSelectRow={(id) => handleAutoToggleFlight(id)}
							multiSelect={true}
							selectedIds={selectedFlightIds}
							onToggleAll={handleAutoToggleAll}
							renderRow={(flight) => (
								<>
									<TableCell sx={{ whiteSpace: 'nowrap' }}>{flight.flightNumber}</TableCell>
									<TableCell sx={{ whiteSpace: 'nowrap' }}>
										{formatDateTime(flight.scheduledDepartureFormatted)}
									</TableCell>
									<TableCell>{flight.route}</TableCell>
									<TableCell>
										{flight.totalPassengerCount} / {flight.unticketed}
									</TableCell>
									<TableCell>
										{flight.bookingCount} / {flight.unticketed_bookings}
									</TableCell>
								</>
							)}
						/>

						<Box
							sx={{
								display: 'flex',
								justifyContent: { xs: 'stretch', md: 'flex-end' },
								alignItems: 'center',
								gap: 2,
							}}
						>
							{shouldShowAutoResults && (
								<Typography variant='body2' color='text.secondary'>
									Выбрано: {selectedFlightIds.length} из {sortedAutoRows.length}
								</Typography>
							)}
							<Tooltip title={UI_LABELS.ADMIN.dashboard.flightPassengers.actions.exportTooltip}>
								<span>
									<Button
										variant='contained'
										startIcon={<FileDownloadIcon />}
										onClick={handleAutoDownload}
										disabled={
											autoSectionLoading ||
											!shouldShowAutoResults ||
											selectedFlightIds.length === 0
										}
										sx={{ width: { xs: '100%', md: 'auto' }, minHeight: 48 }}
									>
										{UI_LABELS.ADMIN.dashboard.flightPassengers.actions.export}
									</Button>
								</span>
							</Tooltip>
						</Box>
					</Stack>
				</Box>

				<Divider sx={{ my: 2 }} />

				<Box sx={{ mb: { xs: 3, md: 4 } }}>
					<Typography variant='h4' sx={{ mb: 1 }}>
						{UI_LABELS.ADMIN.dashboard.flightPassengers.sections.manual.title}
					</Typography>
					<Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
						{UI_LABELS.ADMIN.dashboard.flightPassengers.sections.manual.description}
					</Typography>
					<Stack spacing={2}>
						<Stack
							direction={{ xs: 'column', md: 'row' }}
							spacing={2}
							alignItems={{ xs: 'stretch', md: 'flex-start' }}
						>
							<Box sx={{ flex: { xs: '1 1 auto', md: '0 1 400px' } }}>
								{createFieldRenderer({
									label: UI_LABELS.ADMIN.dashboard.flightPassengers.filters.route,
									type: FIELD_TYPES.SELECT,
								})({
									value: routeId,
									onChange: (val) => handleRouteChange(val),
									fullWidth: true,
									options: routes.map((r) => ({ value: r.id, label: r.name })),
									size: 'medium',
									disabled: isLoading,
								})}
							</Box>

							<Box sx={{ flex: { xs: '1 1 auto', md: '0 1 220px' } }}>
								{createFieldRenderer({
									label: UI_LABELS.ADMIN.dashboard.flightPassengers.filters.flightDate,
									type: FIELD_TYPES.DATE,
								})({
									value: flightDate,
									onChange: (val) => setFlightDate(val || ''),
									fullWidth: true,
									disabled: !routeId || isLoading,
									size: 'medium',
								})}
							</Box>

							<Button
								variant='outlined'
								color='primary'
								onClick={handleFlightResetFilters}
								disabled={!routeId && !flightDate}
								startIcon={<ClearAllIcon />}
								sx={{
									minHeight: 48,
									whiteSpace: 'nowrap',
									width: { xs: '100%', md: 'auto' },
								}}
							>
								{UI_LABELS.ADMIN.dashboard.flightPassengers.filters.reset}
							</Button>
						</Stack>

						<DataExportTable
							headCells={headCells}
							rows={sortedRows}
							emptyMessage={
								routeId
									? UI_LABELS.ADMIN.dashboard.flightPassengers.messages.emptyFlights
									: UI_LABELS.ADMIN.dashboard.flightPassengers.messages.selectRoutePrompt
							}
							isLoading={isLoading}
							order={order}
							orderBy={orderBy}
							onRequestSort={handleRequestSort}
							page={page}
							rowsPerPage={rowsPerPage}
							onPageChange={handleChangePage}
							onRowsPerPageChange={handleChangeRowsPerPage}
							showSelection={true}
							selectedId={flightId}
							onSelectRow={handleSelectFlight}
							renderRow={(row) => (
								<>
									<TableCell sx={{ whiteSpace: 'nowrap' }}>{row.airlineFlightNumber}</TableCell>
									<TableCell sx={{ whiteSpace: 'nowrap' }}>
										{formatDateTime(row.scheduledDepartureFormatted)}
									</TableCell>
									<TableCell>
										{row.totalPassengerCount} / {row.unticketed}
									</TableCell>
									<TableCell>
										{row.bookingCount} / {row.unticketed_bookings}
									</TableCell>
								</>
							)}
						/>

						<Box
							sx={{
								display: 'flex',
								justifyContent: { xs: 'stretch', md: 'flex-end' },
							}}
						>
							<Tooltip title={UI_LABELS.ADMIN.dashboard.flightPassengers.actions.exportTooltip}>
								<span>
									<Button
										variant='contained'
										startIcon={<FileDownloadIcon />}
										onClick={handleDownload}
										disabled={!selectedFlight || isLoading}
										sx={{ width: { xs: '100%', md: 'auto' }, minHeight: 48 }}
									>
										{UI_LABELS.ADMIN.dashboard.flightPassengers.actions.export}
									</Button>
								</span>
							</Tooltip>
						</Box>
					</Stack>
				</Box>

				<Snackbar
					open={notification.open}
					autoHideDuration={4000}
					onClose={closeNotification}
					anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
				>
					<Alert onClose={closeNotification} severity={notification.severity} sx={{ width: '100%' }}>
						{notification.message}
					</Alert>
				</Snackbar>
			</Box>
		</Base>
	);
};

export default FlightPassengerExport;
