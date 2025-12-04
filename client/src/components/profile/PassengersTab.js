import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
	Box,
	Button,
	Typography,
	Container,
	TableContainer,
	Table,
	TableHead,
	TableBody,
	TableRow,
	TableCell,
	Paper,
	Alert,
	IconButton,
	useMediaQuery,
	Tooltip,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Chip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import PassengerForm from '../booking/PassengerForm';
import PDAgreementCheckbox from '../booking/PDAgreementCheckbox';
import PassengerDetailsModal from './PassengerDetailsModal';

import {
	fetchUserPassengers,
	createUserPassenger,
	updateUserPassenger,
	deleteUserPassenger,
} from '../../redux/actions/passenger';
import { fetchCountries } from '../../redux/actions/country';
import { mapToApi, mappingConfigs } from '../utils/mappers';
import { formatDate } from '../utils';
import { UI_LABELS } from '../../constants/uiLabels';
import { VALIDATION_MESSAGES } from '../../constants/validationMessages';
import { ENUM_LABELS } from '../../constants';

const PassengersTab = () => {
	const dispatch = useDispatch();
	const { currentUser } = useSelector((state) => state.auth);
	const { passengers } = useSelector((state) => state.passengers);
	const { countries } = useSelector((state) => state.countries);
	const theme = useTheme();
	const isXs = useMediaQuery(theme.breakpoints.down('sm'));
	const [showForm, setShowForm] = useState(false);
	const [editingPassenger, setEditingPassenger] = useState(null);
	const [data, setData] = useState({});
	const [consent, setConsent] = useState(false);
	const [errors, setErrors] = useState({});
	const [successMessage, setSuccessMessage] = useState('');
	const [selectedPassenger, setSelectedPassenger] = useState(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [passengerToDelete, setPassengerToDelete] = useState(null);
	const formRef = useRef();

	const activePassengers = useMemo(() => (passengers || []).filter((p) => !p.deleted), [passengers]);

	useEffect(() => {
		if (currentUser) dispatch(fetchUserPassengers(currentUser.id));
	}, [dispatch, currentUser]);

	useEffect(() => {
		if (!countries || countries.length === 0) dispatch(fetchCountries());
	}, [countries, dispatch]);

	const citizenshipOptions = useMemo(
		() => (countries || []).map((c) => ({ value: c.id, label: c.name })),
		[countries]
	);

	const handleChange = (_field, _value, d) => setData(d);

	const handleSubmit = () => {
		if (!formRef.current?.validate()) return;
		if (!consent) {
			setErrors({
				consent: VALIDATION_MESSAGES.BOOKING.consent.REQUIRED,
			});
			return;
		}
		const apiData = mapToApi(data, mappingConfigs.passenger);

		if (editingPassenger) {
			if (!editingPassenger.id) {
				return;
			}
			dispatch(
				updateUserPassenger({
					userId: currentUser.id,
					passengerId: editingPassenger.id,
					data: { ...apiData, consent },
				})
			)
				.unwrap()
				.then(() => {
					setErrors({});
					setSuccessMessage(UI_LABELS.PROFILE.passenger_updated);
				})
				.catch((res) => {
					setErrors(res || {});
					setSuccessMessage('');
				});
		} else {
			dispatch(
				createUserPassenger({
					userId: currentUser.id,
					data: { ...apiData, consent },
				})
			)
				.unwrap()
				.then(() => {
					setErrors({});
					setSuccessMessage(UI_LABELS.PROFILE.passenger_added);
				})
				.catch((res) => {
					setErrors(res || {});
					setSuccessMessage('');
				});
		}
	};

	const handleEdit = (passenger) => {
		const formData = {
			lastName: passenger.last_name || '',
			firstName: passenger.first_name || '',
			middleName: passenger.middle_name || '',
			birthDate: passenger.birth_date || null,
			gender: passenger.gender || '',
			citizenshipId: passenger.citizenship_id || null,
			documentType: passenger.document_type || '',
			documentNumber: passenger.document_number || '',
			documentExpiry: passenger.document_expiry || null,
		};
		setData(formData);
		setEditingPassenger(passenger);
		setConsent(true);
		setShowForm(true);
		setSuccessMessage('');
		setErrors({});
	};

	const handleDeleteClick = (passenger) => {
		setPassengerToDelete(passenger);
		setDeleteDialogOpen(true);

		// Close edit form if open
		if (showForm) {
			setShowForm(false);
			setEditingPassenger(null);
			setData({});
			setConsent(false);
		}
	};

	const handleDeleteConfirm = () => {
		if (passengerToDelete) {
			if (!passengerToDelete.id) {
				setDeleteDialogOpen(false);
				setPassengerToDelete(null);
				return;
			}
			dispatch(
				deleteUserPassenger({
					userId: currentUser.id,
					passengerId: passengerToDelete.id,
				})
			)
				.unwrap()
				.then(() => {
					setDeleteDialogOpen(false);
					setPassengerToDelete(null);
					setSuccessMessage(UI_LABELS.SUCCESS.delete);
					setErrors({});
				})
				.catch((res) => {
					setErrors(res || {});
					setSuccessMessage('');
					setDeleteDialogOpen(false);
					setPassengerToDelete(null);
				});
		}
	};

	const handleDeleteCancel = () => {
		setDeleteDialogOpen(false);
		setPassengerToDelete(null);
	};

	const handleCancelForm = () => {
		setShowForm(false);
		setEditingPassenger(null);
		setData({});
		setConsent(false);
		setErrors({});
	};

	return (
		<Container maxWidth='md' sx={{ mt: { xs: 2, md: 4 }, px: { xs: 0, md: 2 } }}>
			<Paper
				sx={{
					p: { xs: 2, md: 3 },
					width: '100%',
					borderRadius: 3,
				}}
			>
				<Typography variant='h4'>{UI_LABELS.PROFILE.passengers}</Typography>

				<Box
					sx={{
						mt: 2,
						display: 'flex',
						flexDirection: 'column',
						gap: 2,
					}}
				>
					{!showForm && errors.message && (
						<Alert severity='error' sx={{ mb: 2 }}>
							{errors.message}
						</Alert>
					)}
					{successMessage && (
						<Alert severity='success' sx={{ mb: 2 }}>
							{successMessage}
						</Alert>
					)}
					{activePassengers && activePassengers.length === 0 ? (
						<Typography variant='subtitle1' sx={{ textAlign: 'center' }}>
							{UI_LABELS.PROFILE.no_passengers}
						</Typography>
					) : isXs ? (
						// Mobile card view
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
							{activePassengers.map((p) => {
								const name = `${p.last_name || ''} ${p.first_name || ''}`.trim() || '—';
								const birth = p.birth_date ? formatDate(p.birth_date) : '';
								const gender = ENUM_LABELS.GENDER_SHORT[p.gender] || '';
								const doc = ENUM_LABELS.DOCUMENT_TYPE[p.document_type] || '';
								return (
									<Paper key={p.id} variant='outlined' sx={{ p: 1.5 }}>
										<Box
											sx={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
												gap: 1,
												mb: 0.5,
												flexWrap: 'wrap',
											}}
										>
											<Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
												{name}
											</Typography>
											<Box sx={{ display: 'flex', gap: 0.5 }}>
												<Tooltip title={UI_LABELS.BUTTONS.edit}>
													<IconButton
														aria-label={UI_LABELS.BUTTONS.edit}
														onClick={() => handleEdit(p)}
														size='small'
														color='info'
													>
														<EditIcon />
													</IconButton>
												</Tooltip>
												<Tooltip title={UI_LABELS.BUTTONS.delete}>
													<IconButton
														aria-label={UI_LABELS.BUTTONS.delete}
														onClick={() => handleDeleteClick(p)}
														size='small'
														color='error'
													>
														<DeleteIcon />
													</IconButton>
												</Tooltip>
												<Tooltip title={UI_LABELS.PROFILE.more_details}>
													<IconButton
														aria-label={UI_LABELS.PROFILE.more_details}
														onClick={() => setSelectedPassenger(p)}
														size='small'
													>
														<OpenInNewIcon />
													</IconButton>
												</Tooltip>
											</Box>
										</Box>{' '}
										{(birth || gender) && (
											<Typography variant='body2' sx={{ color: 'text.secondary' }}>
												{[birth, gender].filter(Boolean).join(' · ')}
											</Typography>
										)}
										{doc && (
											<Typography
												variant='caption'
												sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}
											>
												{doc}
											</Typography>
										)}
									</Paper>
								);
							})}
						</Box>
					) : (
						// Desktop table view
						<TableContainer sx={{ overflowX: 'auto' }}>
							<Table size='small'>
								<TableHead>
									<TableRow>
										<TableCell sx={{ fontWeight: 'bold' }}>{UI_LABELS.PROFILE.last_name}</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }}>
											{UI_LABELS.PROFILE.first_name}
										</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }}>
											{UI_LABELS.PROFILE.birth_date}
										</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }}>{UI_LABELS.PROFILE.gender}</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }}>{UI_LABELS.PROFILE.document}</TableCell>
										<TableCell />
									</TableRow>
								</TableHead>
								<TableBody>
									{activePassengers.map((p) => (
										<TableRow key={p.id}>
											<TableCell>{p.last_name}</TableCell>
											<TableCell>{p.first_name}</TableCell>
											<TableCell>{p.birth_date ? formatDate(p.birth_date) : ''}</TableCell>
											<TableCell>{ENUM_LABELS.GENDER_SHORT[p.gender]}</TableCell>
											<TableCell>{ENUM_LABELS.DOCUMENT_TYPE[p.document_type]}</TableCell>
											<TableCell align='right'>
												<Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
													<Tooltip title={UI_LABELS.BUTTONS.edit}>
														<IconButton
															aria-label={UI_LABELS.BUTTONS.edit}
															onClick={() => handleEdit(p)}
															size='small'
															color='info'
														>
															<EditIcon />
														</IconButton>
													</Tooltip>
													<Tooltip title={UI_LABELS.BUTTONS.delete}>
														<IconButton
															aria-label={UI_LABELS.BUTTONS.delete}
															onClick={() => handleDeleteClick(p)}
															size='small'
															color='error'
														>
															<DeleteIcon />
														</IconButton>
													</Tooltip>
													<Tooltip title={UI_LABELS.PROFILE.more_details}>
														<IconButton
															aria-label={UI_LABELS.PROFILE.more_details}
															onClick={() => setSelectedPassenger(p)}
															size='small'
														>
															<OpenInNewIcon />
														</IconButton>
													</Tooltip>
												</Box>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					)}

					{showForm ? (
						<Paper elevation={1} sx={{ p: 2, borderRadius: 3 }}>
							{errors.message && (
								<Alert severity='error' sx={{ mb: 2 }}>
									{errors.message}
								</Alert>
							)}
							<PassengerForm
								passenger={data}
								onChange={handleChange}
								citizenshipOptions={citizenshipOptions}
								ref={formRef}
								useCategory={false}
							/>
							<Box
								sx={{
									display: 'flex',
									flexDirection: 'column',
									rowGap: 1,
									my: 1,
									mx: 2,
								}}
							>
								<PDAgreementCheckbox
									value={consent}
									onChange={(val) => {
										setConsent(val);
										if (val && errors.consent)
											setErrors({
												...errors,
												consent: undefined,
											});
									}}
									error={errors.consent}
								/>
								<Box
									sx={{
										display: 'flex',
										flexDirection: 'column',
										gap: 2,
									}}
								>
									<Box
										sx={{
											display: 'flex',
											flexDirection: { xs: 'column', sm: 'row' },
											gap: { xs: 1.5, sm: 0 },
											width: '100%',
										}}
									>
										<Button
											variant='contained'
											onClick={handleSubmit}
											disabled={!consent}
											sx={{
												mr: { sm: 1 },
												width: { xs: '100%', sm: 'auto' },
											}}
										>
											{editingPassenger
												? UI_LABELS.BUTTONS.save_changes
												: UI_LABELS.BOOKING.passenger_form.add_passenger}
										</Button>
										<Button
											variant='text'
											onClick={handleCancelForm}
											sx={{ width: { xs: '100%', sm: 'auto' } }}
										>
											{UI_LABELS.BUTTONS.cancel}
										</Button>
									</Box>
								</Box>
							</Box>
						</Paper>
					) : (
						<Box>
							<Button
								variant='outlined'
								onClick={() => {
									setSuccessMessage('');
									setErrors({});
									setShowForm(true);
								}}
							>
								{UI_LABELS.BOOKING.passenger_form.add_passenger}
							</Button>
						</Box>
					)}
				</Box>
			</Paper>
			{selectedPassenger && (
				<PassengerDetailsModal passenger={selectedPassenger} onClose={() => setSelectedPassenger(null)} />
			)}
			<Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} fullWidth maxWidth='sm'>
				<DialogTitle>{UI_LABELS.PROFILE.delete_passenger_confirm}</DialogTitle>
				<DialogContent>
					{passengerToDelete && (
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
							<Typography variant='h6' sx={{ fontWeight: 600 }}>
								{`${passengerToDelete.last_name || ''} ${passengerToDelete.first_name || ''} ${
									passengerToDelete.patronymic_name || ''
								}`.trim()}
							</Typography>

							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
								{passengerToDelete.gender && (
									<Chip size='small' label={ENUM_LABELS.GENDER[passengerToDelete.gender]} />
								)}
								{passengerToDelete.birth_date && (
									<Chip
										size='small'
										color='default'
										label={formatDate(passengerToDelete.birth_date)}
									/>
								)}
								{passengerToDelete.document_type && (
									<Chip
										size='small'
										color='primary'
										variant='outlined'
										label={`${ENUM_LABELS.DOCUMENT_TYPE[passengerToDelete.document_type]}${
											passengerToDelete.document_number
												? ` · ${passengerToDelete.document_number}`
												: ''
										}`}
									/>
								)}
								{passengerToDelete.citizenship?.name && (
									<Chip size='small' variant='outlined' label={passengerToDelete.citizenship.name} />
								)}
							</Box>
						</Box>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={handleDeleteCancel}>{UI_LABELS.BUTTONS.cancel}</Button>
					<Button onClick={handleDeleteConfirm} color='error' variant='contained'>
						{UI_LABELS.BUTTONS.delete}
					</Button>
				</DialogActions>
			</Dialog>
		</Container>
	);
};

export default PassengersTab;
