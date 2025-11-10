import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	Divider,
	IconButton,
	Paper,
	Snackbar,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Tooltip,
	Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import Base from '../../Base';
import { ENUM_LABELS, UI_LABELS } from '../../../constants';
import { formatDate, DragAndDropUploadField } from '../../utils';
import { serverApi } from '../../../api';

const LABELS = UI_LABELS.ADMIN.dashboard.tickets;

const TicketImport = () => {
	const [spreadsheetFile, setSpreadsheetFile] = useState(null);
	const [pdfFile, setPdfFile] = useState(null);
	const [result, setResult] = useState(null);
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
	const hasReadyPassengers = useMemo(
		() =>
			passengers.some((passenger) => {
				const ticketNumber = String(passenger.ticket_number || '').trim();
				return passenger.is_matched && !passenger.ticketed_before && Boolean(ticketNumber);
			}),
		[passengers]
	);

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
			showMessage(LABELS.messages.success, 'success');
		} catch (error) {
			const message = error.response?.data?.message || error.message || UI_LABELS.ERRORS.unknown;
			showMessage(message, 'error');
		} finally {
			setIsLoading(false);
		}
	};

	const handleConfirmImport = async () => {
		if (!pdfFile) {
			showMessage(LABELS.messages.insufficientData, 'warning');
			return;
		}
		if (!hasReadyPassengers) {
			showMessage(LABELS.messages.noReadyPassengers, 'warning');
			return;
		}
		if (!matchedBooking?.id) {
			showMessage(LABELS.messages.noBookingId, 'warning');
			return;
		}
		if (!matchedFlight?.id) {
			showMessage(LABELS.messages.noFlightId, 'warning');
			return;
		}

		const formData = new FormData();
		formData.append('itinerary', pdfFile);
		formData.append('passengers', JSON.stringify(passengers));
		formData.append('booking_id', matchedBooking.id);
		formData.append('flight_id', matchedFlight.id);

		setIsConfirming(true);
		try {
			const response = await serverApi.post('/imports/tickets/confirm', formData, {
				headers: { 'Content-Type': 'multipart/form-data' },
			});
			const skipped = response.data.skipped_count || 0;
			const message = response.data.message || LABELS.messages.importSuccess;
			const severity = skipped > 0 ? 'warning' : 'success';
			showMessage(message, severity);
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
		() => result && pdfFile && hasReadyPassengers && matchedBooking && matchedFlight,
		[result, pdfFile, hasReadyPassengers, matchedBooking, matchedFlight]
	);

	const confirmTooltip = useMemo(() => {
		if (!result) return LABELS.tooltips.noAnalysis;
		if (!pdfFile) return LABELS.tooltips.noPdf;
		if (!matchedBooking) return LABELS.tooltips.noBooking;
		if (!matchedFlight) return LABELS.tooltips.noFlight;
		if (!hasReadyPassengers) return LABELS.tooltips.noReadyPassengers;
		return '';
	}, [result, pdfFile, hasReadyPassengers, matchedBooking, matchedFlight]);

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
						gap: 3,
						p: { xs: 2, md: 3 },
						mb: { xs: 1, md: 2 },
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
						<Divider />
						<Typography variant='h3' sx={{ px: { xs: 2, md: 3 } }}>
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
						<Paper sx={{ p: 2, mx: { xs: 2, md: 3 } }}>
							<Stack spacing={2}>
								{/* Parsed Flight Data Section */}
								<Box>
									<Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 600 }}>
										{LABELS.results.parsedData}
									</Typography>
									<Stack
										direction={{ xs: 'column', sm: 'row' }}
										spacing={1.5}
										divider={<Divider orientation='vertical' flexItem />}
										sx={{ flexWrap: 'wrap' }}
									>
										<Box sx={{ flex: 1, minWidth: 200 }}>
											<Typography
												variant='caption'
												color='text.secondary'
												sx={{ display: 'block', mb: 0.25 }}
											>
												{LABELS.results.fields.flight}
											</Typography>
											<Typography variant='body2' sx={{ fontWeight: 500 }}>
												{parsedFlight.raw || '—'}
											</Typography>
										</Box>
										<Box sx={{ flex: 1, minWidth: 150 }}>
											<Typography
												variant='caption'
												color='text.secondary'
												sx={{ display: 'block', mb: 0.25 }}
											>
												{LABELS.results.fields.date}
											</Typography>
											<Typography variant='body2' sx={{ fontWeight: 500 }}>
												{parsedFlight.departure_date
													? formatDate(parsedFlight.departure_date)
													: '—'}
											</Typography>
										</Box>
										<Box sx={{ flex: 1, minWidth: 150 }}>
											<Typography
												variant='caption'
												color='text.secondary'
												sx={{ display: 'block', mb: 0.25 }}
											>
												{LABELS.results.fields.route}
											</Typography>
											<Typography variant='body2' sx={{ fontWeight: 500 }}>
												{parsedFlight.route || '—'}
											</Typography>
										</Box>
										<Box sx={{ flex: 1, minWidth: 120 }}>
											<Typography
												variant='caption'
												color='text.secondary'
												sx={{ display: 'block', mb: 0.25 }}
											>
												{LABELS.results.fields.passengerCount}
											</Typography>
											<Typography variant='body2' sx={{ fontWeight: 500 }}>
												{passengers.length}
											</Typography>
										</Box>
									</Stack>
								</Box>

								<Divider />

								{/* Flight in System Section */}
								<Box>
									<Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 0.75 }}>
										{matchedFlight ? (
											<CheckCircleIcon color='success' fontSize='small' />
										) : (
											<CancelIcon color='error' fontSize='small' />
										)}
										<Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
											{matchedFlight
												? LABELS.results.flightInSystem
												: LABELS.results.flightNotFound}
										</Typography>
									</Stack>
									{matchedFlight ? (
										<Stack
											direction={{ xs: 'column', sm: 'row' }}
											spacing={1.5}
											divider={<Divider orientation='vertical' flexItem />}
											sx={{ flexWrap: 'wrap' }}
										>
											<Box sx={{ flex: 1, minWidth: 200 }}>
												<Typography
													variant='caption'
													color='text.secondary'
													sx={{ display: 'block', mb: 0.25 }}
												>
													{LABELS.results.fields.number}
												</Typography>
												<Typography variant='body2' sx={{ fontWeight: 500 }}>
													{matchedFlight.flight_number}
												</Typography>
											</Box>
											<Box sx={{ flex: 1, minWidth: 150 }}>
												<Typography
													variant='caption'
													color='text.secondary'
													sx={{ display: 'block', mb: 0.25 }}
												>
													{LABELS.results.fields.date}
												</Typography>
												<Typography variant='body2' sx={{ fontWeight: 500 }}>
													{matchedFlight.scheduled_departure
														? formatDate(matchedFlight.scheduled_departure)
														: '—'}
												</Typography>
											</Box>
										</Stack>
									) : (
										<Typography variant='body2' color='text.secondary'>
											{LABELS.results.flightNotFoundMessage}
										</Typography>
									)}
								</Box>

								<Divider />

								{/* Booking Section */}
								<Box>
									<Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 0.75 }}>
										{matchedBooking ? (
											<CheckCircleIcon color='success' fontSize='small' />
										) : (
											<CancelIcon color='error' fontSize='small' />
										)}
										<Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
											{matchedBooking ? LABELS.results.booking : LABELS.results.bookingNotFound}
										</Typography>
									</Stack>
									{matchedBooking ? (
										<Stack
											direction={{ xs: 'column', sm: 'row' }}
											spacing={1.5}
											divider={<Divider orientation='vertical' flexItem />}
											sx={{ flexWrap: 'wrap' }}
										>
											<Box sx={{ flex: 1, minWidth: 150 }}>
												<Typography
													variant='caption'
													color='text.secondary'
													sx={{ display: 'block', mb: 0.25 }}
												>
													{LABELS.results.fields.number}
												</Typography>
												<Typography variant='body2' sx={{ fontWeight: 500 }}>
													{matchedBooking.booking_number || '—'}
												</Typography>
											</Box>
											<Box sx={{ flex: 1, minWidth: 200 }}>
												<Typography
													variant='caption'
													color='text.secondary'
													sx={{ display: 'block', mb: 0.25 }}
												>
													{LABELS.results.fields.email}
												</Typography>
												<Typography variant='body2' sx={{ fontWeight: 500 }}>
													{matchedBooking.email_address || '—'}
												</Typography>
											</Box>
											<Box sx={{ flex: 1, minWidth: 150 }}>
												<Typography
													variant='caption'
													color='text.secondary'
													sx={{ display: 'block', mb: 0.25 }}
												>
													{LABELS.results.fields.status}
												</Typography>
												<Typography variant='body2' sx={{ fontWeight: 500 }}>
													{ENUM_LABELS.BOOKING_STATUS?.[matchedBooking.status] ||
														matchedBooking.status ||
														'—'}
												</Typography>
											</Box>
										</Stack>
									) : (
										<Typography variant='body2' color='text.secondary'>
											{LABELS.results.bookingNotFoundMessage}
										</Typography>
									)}
								</Box>
							</Stack>
						</Paper>
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
											<TableCell sx={{ py: 1 }}>{LABELS.results.table.ticketed}</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{passengers.length === 0 ? (
											<TableRow>
												<TableCell colSpan={8} align='center' sx={{ py: 2 }}>
													{LABELS.results.noPassengers}
												</TableCell>
											</TableRow>
										) : (
											passengers.map((passenger, idx) => (
												<TableRow key={idx}>
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
														<Typography
															variant='body2'
															sx={{
																fontWeight: 500,
																color: passenger.is_matched
																	? 'success.main'
																	: 'error.main',
															}}
														>
															{passenger.is_matched
																? LABELS.results.table.matchedYes
																: LABELS.results.table.matchedNo}
														</Typography>
													</TableCell>
													<TableCell sx={{ py: 1 }}>
														<Typography
															variant='body2'
															sx={{
																fontWeight: 500,
																color: passenger.ticketed_before
																	? 'success.main'
																	: 'default.main',
															}}
														>
															{passenger.ticketed_before
																? LABELS.results.table.ticketedYes
																: LABELS.results.table.ticketedNo}
														</Typography>
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
							<Tooltip
								title={confirmTooltip || ''}
								placement='top'
								arrow
								disableHoverListener={!confirmTooltip}
								disableFocusListener={!confirmTooltip}
							>
								<Box sx={{ display: 'flex', width: { xs: '100%', sm: 'auto' } }}>
									<Button
										variant='contained'
										onClick={handleConfirmImport}
										disabled={!canConfirm || isConfirming}
										color='success'
										fullWidth
										sx={{ width: { xs: '100%', sm: 'auto' } }}
									>
										{isConfirming ? LABELS.actions.confirming : LABELS.actions.confirm}
									</Button>
								</Box>
							</Tooltip>
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
