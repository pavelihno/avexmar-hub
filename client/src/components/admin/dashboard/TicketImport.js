import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	IconButton,
	Paper,
	Snackbar,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import Base from '../../Base';
import { ENUM_LABELS, UI_LABELS } from '../../../constants';
import { formatDate, DragAndDropUploadField } from '../../utils';
import { serverApi } from '../../../api';

const LABELS = UI_LABELS.ADMIN.dashboard.tickets;

const TicketImport = () => {
	const [spreadsheetFile, setSpreadsheetFile] = useState(null);
	const [pdfFile, setPdfFile] = useState(null);
	const [result, setResult] = useState(null);
	const [selectedFlightId, setSelectedFlightId] = useState(null);
	const [selectedBookingId, setSelectedBookingId] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isConfirming, setIsConfirming] = useState(false);
	const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

	const spreadsheetInputRef = useRef(null);
	const pdfInputRef = useRef(null);

	const warnings = useMemo(() => result?.warnings || [], [result]);
	const passengers = useMemo(() => result?.passengers || [], [result]);
	const parsedFlight = useMemo(() => result?.parsed_flight || {}, [result]);
	const matchedFlight = useMemo(() => result?.flight || null, [result]);
	const matchedBooking = useMemo(() => result?.booking || null, [result]);

	const handleSelectSpreadsheet = (file) => {
		if (file) {
			setSpreadsheetFile(file);
		}
	};

	const handleSelectPdf = (file) => {
		if (file) {
			setPdfFile(file);
		}
	};

	const handleReset = () => {
		setSpreadsheetFile(null);
		setPdfFile(null);
		setResult(null);
		setSelectedFlightId(null);
		setSelectedBookingId(null);
		if (spreadsheetInputRef.current) spreadsheetInputRef.current.value = '';
		if (pdfInputRef.current) pdfInputRef.current.value = '';
	};

	const showMessage = (message, severity = 'info') => {
		setNotification({ open: true, message, severity });
	};

	const handleUpload = async () => {
		if (!spreadsheetFile) {
			showMessage(LABELS.messages.missingSpreadsheet, 'warning');
			return;
		}
		if (!pdfFile) {
			showMessage(LABELS.messages.missingPdf, 'warning');
			return;
		}

		const formData = new FormData();
		formData.append('spreadsheet', spreadsheetFile);

		setIsLoading(true);
		try {
			const response = await serverApi.post('/imports/tickets', formData, {
				headers: { 'Content-Type': 'multipart/form-data' },
			});
			setResult(response.data);
			setSelectedFlightId(response.data.flight?.id || null);
			setSelectedBookingId(response.data.booking?.id || null);
			showMessage(LABELS.messages.success, 'success');
		} catch (error) {
			const message = error.response?.data?.message || error.message || UI_LABELS.ERRORS.unknown;
			showMessage(message, 'error');
		} finally {
			setIsLoading(false);
		}
	};

	const handleConfirmImport = async () => {
		if (!pdfFile || !selectedFlightId || !selectedBookingId) {
			showMessage(LABELS.messages.insufficientData, 'warning');
			return;
		}

		const formData = new FormData();
		formData.append('itinerary', pdfFile);
		formData.append('flight_id', selectedFlightId);
		formData.append('booking_id', selectedBookingId);

		setIsConfirming(true);
		try {
			const response = await serverApi.post('/imports/tickets/confirm', formData, {
				headers: { 'Content-Type': 'multipart/form-data' },
			});
			showMessage(response.data.message || LABELS.messages.importSuccess, 'success');
			setTimeout(handleReset, 2000);
		} catch (error) {
			const message = error.response?.data?.message || error.message || UI_LABELS.ERRORS.unknown;
			showMessage(message, 'error');
		} finally {
			setIsConfirming(false);
		}
	};

	const handleCloseNotification = () => setNotification((prev) => ({ ...prev, open: false }));

	const canConfirm = useMemo(
		() => result && pdfFile && selectedFlightId && selectedBookingId,
		[result, pdfFile, selectedFlightId, selectedBookingId]
	);

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
					<Typography variant='h4'>{LABELS.title}</Typography>
				</Box>

				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						gap: 2,
						mb: 3,
					}}
				>
					<Typography variant='subtitle1' sx={{ px: { xs: 2, md: 3 } }}>
						{LABELS.description}
					</Typography>

					<Paper sx={{ p: 2 }}>
						<Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
							<Box sx={{ flex: 1 }}>
								<Typography variant='subtitle2' sx={{ mb: 1 }}>
									{LABELS.inputs.spreadsheet.label}
								</Typography>
								<DragAndDropUploadField
									onFileSelect={handleSelectSpreadsheet}
									dragText={LABELS.inputs.dragXls}
									buttonText={spreadsheetFile ? LABELS.inputs.replace : LABELS.inputs.select}
									startIcon={<UploadFileIcon />}
									accept='.xls'
									disabled={isLoading || isConfirming}
									inputRef={spreadsheetInputRef}
									sx={{ minHeight: 100 }}
								>
									{spreadsheetFile && (
										<Typography variant='body2' color='primary' sx={{ mt: 1, fontWeight: 500 }}>
											{spreadsheetFile.name}
										</Typography>
									)}
								</DragAndDropUploadField>
							</Box>

							<Box sx={{ flex: 1 }}>
								<Typography variant='subtitle2' sx={{ mb: 1 }}>
									{LABELS.inputs.pdf.label}
								</Typography>
								<DragAndDropUploadField
									onFileSelect={handleSelectPdf}
									dragText={LABELS.inputs.dragPdf}
									buttonText={pdfFile ? LABELS.inputs.replacePdf : LABELS.inputs.selectPdf}
									startIcon={<PictureAsPdfIcon />}
									accept='application/pdf'
									disabled={isLoading || isConfirming}
									inputRef={pdfInputRef}
									sx={{ minHeight: 100 }}
								>
									{pdfFile && (
										<Typography variant='body2' color='primary' sx={{ mt: 1, fontWeight: 500 }}>
											{pdfFile.name}
										</Typography>
									)}
								</DragAndDropUploadField>
							</Box>
						</Stack>
					</Paper>

					<Stack
						direction={{ xs: 'column', sm: 'row' }}
						spacing={2}
						justifyContent='flex-end'
						sx={{ px: { xs: 2, md: 3 } }}
					>
						<Button variant='outlined' color='secondary' onClick={handleReset} disabled={isLoading}>
							{LABELS.actions.reset}
						</Button>
						<Button
							variant='contained'
							onClick={handleUpload}
							disabled={isLoading || !spreadsheetFile || !pdfFile}
						>
							{isLoading ? LABELS.actions.processing : LABELS.actions.analyze}
						</Button>
					</Stack>
				</Box>

				{isLoading && (
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							p: 4,
						}}
					>
						<CircularProgress />
					</Box>
				)}

				{result && !isLoading && (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
						<Typography variant='h5' sx={{ px: { xs: 2, md: 3 } }}>
							{LABELS.results.title}
						</Typography>

						{warnings.length > 0 && (
							<Alert severity='warning' sx={{ mx: { xs: 2, md: 3 } }}>
								<strong>{LABELS.results.warnings}:</strong>
								<ul style={{ margin: '4px 0 0 0', paddingLeft: '20px' }}>
									{warnings.map((warning, idx) => (
										<li key={idx}>{warning}</li>
									))}
								</ul>
							</Alert>
						)}

						<Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ px: { xs: 2, md: 3 } }}>
							<Paper sx={{ p: 2, flex: 1 }}>
								<Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 600 }}>
									{LABELS.results.parsedData}
								</Typography>
								<Stack spacing={0.5}>
									<Typography variant='body2'>
										<strong>{LABELS.results.fields.flight}:</strong> {parsedFlight.raw || '—'}
									</Typography>
									<Typography variant='body2'>
										<strong>{LABELS.results.fields.date}:</strong>{' '}
										{parsedFlight.departure_date ? formatDate(parsedFlight.departure_date) : '—'}
									</Typography>
									<Typography variant='body2'>
										<strong>{LABELS.results.fields.route}:</strong> {parsedFlight.route || '—'}
									</Typography>
									<Typography variant='body2'>
										<strong>{LABELS.results.fields.passengerCount}:</strong> {passengers.length}
									</Typography>
								</Stack>
							</Paper>

							<Paper
								sx={{
									p: 2,
									flex: 1,
									bgcolor: matchedFlight ? 'success.50' : 'error.50',
								}}
							>
								<Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 1 }}>
									<CheckCircleIcon color={matchedFlight ? 'success' : 'error'} fontSize='small' />
									<Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
										{matchedFlight ? LABELS.results.flightInSystem : LABELS.results.flightNotFound}
									</Typography>
								</Stack>
								{matchedFlight ? (
									<Stack spacing={0.5}>
										<Typography variant='body2'>
											<strong>{LABELS.results.fields.number}:</strong>{' '}
											{matchedFlight.flight_number}
										</Typography>
										<Typography variant='body2'>
											<strong>{LABELS.results.fields.date}:</strong>{' '}
											{matchedFlight.scheduled_departure
												? formatDate(matchedFlight.scheduled_departure)
												: '—'}
										</Typography>
									</Stack>
								) : (
									<Typography variant='body2' color='text.secondary'>
										{LABELS.results.flightNotFoundMessage}
									</Typography>
								)}
							</Paper>

							<Paper
								sx={{
									p: 2,
									flex: 1,
									bgcolor: matchedBooking ? 'success.50' : 'error.50',
								}}
							>
								<Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 1 }}>
									<CheckCircleIcon color={matchedBooking ? 'success' : 'error'} fontSize='small' />
									<Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
										{matchedBooking ? LABELS.results.booking : LABELS.results.bookingNotFound}
									</Typography>
								</Stack>
								{matchedBooking ? (
									<Stack spacing={0.5}>
										<Typography variant='body2'>
											<strong>{LABELS.results.fields.number}:</strong>{' '}
											{matchedBooking.booking_number || '—'}
										</Typography>
										<Typography variant='body2'>
											<strong>{LABELS.results.fields.email}:</strong>{' '}
											{matchedBooking.email_address || '—'}
										</Typography>
										<Typography variant='body2'>
											<strong>{LABELS.results.fields.status}:</strong>{' '}
											{ENUM_LABELS.BOOKING_STATUS?.[matchedBooking.status] ||
												matchedBooking.status ||
												'—'}
										</Typography>
									</Stack>
								) : (
									<Typography variant='body2' color='text.secondary'>
										{LABELS.results.bookingNotFoundMessage}
									</Typography>
								)}
							</Paper>
						</Stack>

						<Paper sx={{ p: 2, mx: { xs: 2, md: 3 } }}>
							<Typography variant='subtitle1' sx={{ mb: 1.5, fontWeight: 600 }}>
								{LABELS.results.passengers}
							</Typography>
							<Box sx={{ overflowX: 'auto' }}>
								<Table size='small'>
									<TableHead>
										<TableRow>
											<TableCell sx={{ py: 1 }}>{LABELS.results.table.order}</TableCell>
											<TableCell sx={{ py: 1 }}>{LABELS.results.table.name}</TableCell>
											<TableCell sx={{ py: 1 }}>{LABELS.results.table.document}</TableCell>
											<TableCell sx={{ py: 1 }}>{LABELS.results.table.birthDate}</TableCell>
											<TableCell sx={{ py: 1 }}>{LABELS.results.table.ticketNumber}</TableCell>
											<TableCell sx={{ py: 1 }}>{LABELS.results.table.pnr}</TableCell>
											<TableCell sx={{ py: 1 }}>{LABELS.results.table.matched}</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{passengers.length === 0 ? (
											<TableRow>
												<TableCell colSpan={7} align='center' sx={{ py: 2 }}>
													{LABELS.results.noPassengers}
												</TableCell>
											</TableRow>
										) : (
											passengers.map((passenger, idx) => (
												<TableRow key={idx} hover>
													<TableCell sx={{ py: 1 }}>{passenger.order || idx + 1}</TableCell>
													<TableCell sx={{ py: 1 }}>{passenger.raw_name || '—'}</TableCell>
													<TableCell sx={{ py: 1 }}>
														{passenger.document_number || '—'}
													</TableCell>
													<TableCell sx={{ py: 1 }}>
														{passenger.birth_date ? formatDate(passenger.birth_date) : '—'}
													</TableCell>
													<TableCell sx={{ py: 1 }}>
														{passenger.ticket_number || '—'}
													</TableCell>
													<TableCell sx={{ py: 1 }}>{passenger.pnr || '—'}</TableCell>
													<TableCell sx={{ py: 1 }}>
														{passenger.is_matched ? (
															<CheckCircleIcon color='success' fontSize='small' />
														) : (
															'—'
														)}
													</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							</Box>
						</Paper>

						<Stack
							direction={{ xs: 'column', sm: 'row' }}
							spacing={2}
							justifyContent='flex-end'
							sx={{ px: { xs: 2, md: 3 } }}
						>
							<Button variant='outlined' color='secondary' onClick={handleReset}>
								{LABELS.actions.cancel}
							</Button>
							<Button
								variant='contained'
								onClick={handleConfirmImport}
								disabled={!canConfirm || isConfirming}
								color='success'
							>
								{isConfirming ? LABELS.actions.confirming : LABELS.actions.confirm}
							</Button>
						</Stack>
					</Box>
				)}

				<Snackbar
					open={notification.open}
					autoHideDuration={notification.severity === 'success' ? 4000 : 6000}
					onClose={handleCloseNotification}
					anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
				>
					<Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
						{notification.message}
					</Alert>
				</Snackbar>
			</Box>
		</Base>
	);
};

export default TicketImport;
