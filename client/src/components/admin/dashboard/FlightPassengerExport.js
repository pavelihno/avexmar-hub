import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
	Box,
	Button,
	Typography,
	IconButton,
	Snackbar,
	Alert,
	CircularProgress,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	TableSortLabel,
	Paper,
	Radio,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import { alpha, useTheme } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';

import Base from '../../Base';
import { formatDate, formatDateTime, createFieldRenderer, FIELD_TYPES } from '../../utils';
import { UI_LABELS, FILE_NAME_TEMPLATES, DATE_API_FORMAT } from '../../../constants';
import { fetchExportData, downloadExport } from '../../../redux/actions/export';

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

const FlightPassengerExport = () => {
	const dispatch = useDispatch();
	const theme = useTheme();

	const { data: exportData = {}, isLoading, errors } = useSelector((state) => state.exports);
	const routes = exportData.routes || [];
	const flights = exportData.flights || [];

	const [routeId, setRouteId] = useState('');
	const [flightId, setFlightId] = useState('');
	const [notification, setNotification] = useState({ open: false, message: '', severity: 'error' });
	const [flightDate, setFlightDate] = useState('');
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [order, setOrder] = useState('desc');
	const [orderBy, setOrderBy] = useState('scheduledDeparture');

	useEffect(() => {
		dispatch(
			fetchExportData({
				key: 'routes',
				endpoint: '/exports/flight-passengers/routes',
			})
		);
	}, [dispatch]);

	useEffect(() => {
		if (errors) {
			setNotification({ open: true, message: errors?.message || UI_LABELS.ERRORS.unknown, severity: 'error' });
		}
	}, [errors]);

	const selectedFlight = useMemo(() => flights.find((f) => String(f.id) === String(flightId)), [flights, flightId]);

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
				airlineName: ((flight.airline && flight.airline.name) || flight.airline_name || '').toLowerCase(),
				airlineNameDisplay: (flight.airline && flight.airline.name) || flight.airline_name || '',
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
					endpoint: `/exports/flight-passengers/routes/${id}/flights`,
				})
			);
		}
	};

	const handleResetFilters = () => {
		setRouteId('');
		setFlightId('');
		setFlightDate('');
		setPage(0);
	};

	const handleSelectFlight = (id) => {
		setFlightId((prev) => (String(prev) === String(id) ? '' : String(id)));
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

	const headCells = useMemo(
		() => [
			{
				id: 'airlineFlightNumber',
				label: UI_LABELS.ADMIN.dashboard.flightPassengers.table.flight,
			},
			{
				id: 'scheduledDeparture',
				label: UI_LABELS.ADMIN.dashboard.flightPassengers.table.date,
			},
			{
				id: 'airlineName',
				label: UI_LABELS.ADMIN.dashboard.flightPassengers.table.airline,
			},
		],
		[]
	);

	const handleDownload = async () => {
		if (!selectedFlight) return;
		try {
			const data = await dispatch(
				downloadExport({
					endpoint: '/exports/flight-passengers',
					params: {
						flight_id: selectedFlight.id,
					},
				})
			).unwrap();

			const flightNumber = selectedFlight.airline_flight_number;
			const departureDate = selectedFlight.scheduled_departure;
			const filename = FILE_NAME_TEMPLATES.FLIGHT_PASSENGERS_EXPORT(flightNumber, formatDate(departureDate));

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

				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						gap: 3,
						p: { xs: 2, md: 3 },
						mb: { xs: 3, md: 4 },
					}}
				>
					<Typography variant='subtitle1'>{UI_LABELS.ADMIN.dashboard.flightPassengers.description}</Typography>
					<Stack spacing={2}>
						<Stack
							direction={{ xs: 'column', md: 'row' }}
							spacing={2}
							alignItems={{ xs: 'stretch', md: 'flex-start' }}
						>
							<Box sx={{ flex: { xs: '1 1 auto', md: '0 1 400px' } }}>
								{createFieldRenderer({
									label: UI_LABELS.ADMIN.dashboard.flightPassengers.route,
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
									label: UI_LABELS.ADMIN.dashboard.flightPassengers.flightDate,
									type: FIELD_TYPES.DATE,
								})({
									value: flightDate,
									onChange: (val) => setFlightDate(val || ''),
									fullWidth: true,
									disabled: !routeId || isLoading,
									size: 'medium',
								})}
							</Box>

							<Box sx={{ flex: { xs: '1 1 auto', md: '0 0 auto' } }}>
								<Button
									variant='outlined'
									color='primary'
									onClick={handleResetFilters}
									disabled={!routeId && !flightDate}
									startIcon={<ClearAllIcon />}
									sx={{
										minHeight: 48,
										whiteSpace: 'nowrap',
										width: { xs: '100%', md: 'auto' },
									}}
								>
									{UI_LABELS.ADMIN.dashboard.flightPassengers.resetFilters}
								</Button>
							</Box>
						</Stack>

						<Box sx={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
							<Paper
								variant='outlined'
								sx={{
									borderRadius: 2,
								}}
							>
								<TableContainer sx={{ overflowX: { xs: 'auto', sm: 'auto', md: 'visible' } }}>
									<Table size='small' sx={{ minWidth: { xs: 500, sm: 600 } }}>
										<TableHead>
											<TableRow>
												{headCells.map((headCell) => (
													<TableCell
														key={headCell.id}
														sortDirection={orderBy === headCell.id ? order : false}
														sx={{
															fontWeight: 'bold',
															cursor: 'pointer',
														}}
													>
														<TableSortLabel
															active={orderBy === headCell.id}
															direction={orderBy === headCell.id ? order : 'asc'}
															onClick={() => handleRequestSort(headCell.id)}
														>
															{headCell.label}
														</TableSortLabel>
													</TableCell>
												))}
												<TableCell padding='checkbox' sx={{ width: 48 }} />
											</TableRow>
										</TableHead>
										<TableBody>
											{sortedRows
												.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
												.map((row) => {
													const isSelected = String(flightId) === String(row.id);

													return (
														<TableRow
															key={row.id}
															hover
															selected={isSelected}
															role='button'
															sx={{ cursor: 'pointer' }}
															onClick={() => handleSelectFlight(row.id)}
														>
															<TableCell sx={{ whiteSpace: 'nowrap' }}>
																{row.airlineFlightNumber}
															</TableCell>
															<TableCell sx={{ whiteSpace: 'nowrap' }}>
																{formatDateTime(row.scheduledDepartureFormatted)}
															</TableCell>
															<TableCell>{row.airlineNameDisplay}</TableCell>
															<TableCell
																padding='checkbox'
																onClick={(e) => e.stopPropagation()}
															>
																<Radio
																	checked={isSelected}
																	onClick={() => handleSelectFlight(row.id)}
																	size='small'
																	color='primary'
																/>
															</TableCell>
														</TableRow>
													);
												})}
											{sortedRows.length === 0 && (
												<TableRow>
													<TableCell colSpan={4}>
														<Typography
															variant='body2'
															color='text.secondary'
															align='center'
														>
															{routeId
																? UI_LABELS.ADMIN.dashboard.flightPassengers.emptyState
																: UI_LABELS.ADMIN.dashboard.flightPassengers
																		.selectRoutePrompt}
														</Typography>
													</TableCell>
												</TableRow>
											)}
										</TableBody>
									</Table>
								</TableContainer>
								<TablePagination
									component='div'
									count={sortedRows.length}
									page={page}
									onPageChange={handleChangePage}
									rowsPerPage={rowsPerPage}
									onRowsPerPageChange={handleChangeRowsPerPage}
									rowsPerPageOptions={[10, 25, 50]}
									labelRowsPerPage={UI_LABELS.BUTTONS.pagination.rows_per_page}
									labelDisplayedRows={({ from, to, count }) =>
										UI_LABELS.BUTTONS.pagination.displayed_rows({ from, to, count })
									}
									sx={{
										'.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
											fontSize: { xs: '0.75rem', sm: '0.875rem' },
										},
									}}
								/>
							</Paper>

							{isLoading && (
								<Box
									sx={{
										position: 'absolute',
										top: 0,
										left: 0,
										right: 0,
										bottom: 0,
										backgroundColor: alpha(theme.palette.white, 0.8),
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										zIndex: 1,
									}}
								>
									<CircularProgress />
								</Box>
							)}
						</Box>

						<Box
							sx={{
								display: 'flex',
								justifyContent: { xs: 'stretch', md: 'flex-end' },
							}}
						>
							<Button
								variant='contained'
								startIcon={<FileDownloadIcon />}
								onClick={handleDownload}
								disabled={!selectedFlight || isLoading}
								sx={{ width: { xs: '100%', md: 'auto' }, minHeight: 48, mt: { xs: 2, md: 0 } }}
							>
								{UI_LABELS.BUTTONS.download}
							</Button>
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
