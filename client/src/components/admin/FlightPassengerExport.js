import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Typography, IconButton, Snackbar, Alert, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { alpha, useTheme } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';

import Base from '../Base';
import { formatDate, createFieldRenderer, FIELD_TYPES } from '../utils';
import { UI_LABELS, DATE_API_FORMAT } from '../../constants';
import { fetchExportData, downloadExport } from '../../redux/actions/export';

const FlightPassengerExport = () => {
	const dispatch = useDispatch();
	const theme = useTheme();

	const { data: exportData = {}, isLoading, errors } = useSelector((state) => state.exports);
	const routes = exportData.routes || [];
	const flights = exportData.flights || [];

	const [routeId, setRouteId] = useState('');
	const [flightId, setFlightId] = useState('');
	const [notification, setNotification] = useState({ open: false, message: '', severity: 'error' });

	const selectedFlight = useMemo(() => flights.find((f) => f.id === flightId), [flights, flightId]);

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

	const handleRouteChange = (e) => {
		const id = e.target.value;
		setRouteId(id);
		setFlightId('');
		if (id) {
			dispatch(
				fetchExportData({
					key: 'flights',
					endpoint: `/exports/flight-passengers/routes/${id}/flights`,
				})
			);
		}
	};

	const handleDownload = async () => {
		if (!selectedFlight) return;
		try {
			const data = await dispatch(
				downloadExport({
					endpoint: '/exports/flight-passengers',
					params: {
						flight_id: selectedFlight.id,
						date: formatDate(selectedFlight.scheduled_departure, DATE_API_FORMAT),
					},
				})
			).unwrap();

			const url = window.URL.createObjectURL(new Blob([data]));
			const link = document.createElement('a');
			link.href = url;
link.setAttribute('download', 'flight_passengers.xls');
			document.body.appendChild(link);
			link.click();
			link.remove();
		} catch (err) {
			setNotification({
				open: true,
				message: (err && err.message) || UI_LABELS.ERRORS.unknown,
				severity: 'error',
			});
		}
	};

	const closeNotification = () => setNotification((n) => ({ ...n, open: false }));

	return (
		<Base maxWidth='xl'>
			<Box sx={{ p: 3 }}>
				<Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
					<IconButton component={Link} to='/admin' sx={{ mr: 2 }}>
						<ArrowBackIcon />
					</IconButton>
					<Box>
						<Typography variant='h4'>{UI_LABELS.ADMIN.exports.flightPassengers.title}</Typography>
						<Typography variant='body1' color='text.secondary'>
							{UI_LABELS.ADMIN.exports.flightPassengers.description}
						</Typography>
					</Box>
				</Box>

				<Box
					sx={{
						display: 'flex',
						gap: 2,
						p: 3,
						alignItems: 'center',
						flexWrap: 'wrap',
					}}
				>
					{createFieldRenderer({
						label: UI_LABELS.ADMIN.exports.flightPassengers.route,
						type: FIELD_TYPES.SELECT,
					})({
						value: routeId,
						onChange: (val) => handleRouteChange({ target: { value: val } }),
						fullWidth: false,
						options: routes.map((r) => ({ value: r.id, label: r.name })),
						sx: { minWidth: { md: 300, xs: 250 } },
						size: 'medium',
						disabled: isLoading,
					})}

					{createFieldRenderer({
						label: UI_LABELS.ADMIN.exports.flightPassengers.flight,
						type: FIELD_TYPES.SELECT,
					})({
						value: flightId,
						onChange: (val) => setFlightId(val),
						fullWidth: false,
						options: flights.map((f) => ({
							value: f.id,
							label: `${f.airline_flight_number} — ${formatDate(f.scheduled_departure)}`,
						})),
						sx: { minWidth: { md: 300, xs: 250 } },
						size: 'medium',
						disabled: !routeId || isLoading,
					})}

					<Button
						variant='contained'
						startIcon={<FileDownloadIcon />}
						onClick={handleDownload}
						disabled={!flightId || isLoading}
					>
						{UI_LABELS.BUTTONS.download}
					</Button>
				</Box>

				<Box sx={{ position: 'relative', mt: 4 }}>
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
