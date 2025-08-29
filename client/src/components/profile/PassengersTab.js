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
	Link as MuiLink,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import PassengerForm from '../booking/PassengerForm';
import PrivacyConsentCheckbox from '../booking/PrivacyConsentCheckbox';

import { fetchUserPassengers, createUserPassenger } from '../../redux/actions/passenger';
import { fetchCountries } from '../../redux/actions/country';
import { mapToApi, mappingConfigs } from '../utils/mappers';
import { UI_LABELS } from '../../constants/uiLabels';
import { VALIDATION_MESSAGES } from '../../constants/validationMessages';

const PassengersTab = () => {
	const dispatch = useDispatch();
	const { currentUser } = useSelector((state) => state.auth);
	const { passengers } = useSelector((state) => state.passengers);
	const { countries } = useSelector((state) => state.countries);
	const [showForm, setShowForm] = useState(false);
	const [data, setData] = useState({});
	const [consent, setConsent] = useState(false);
	const [errors, setErrors] = useState({});
	const formRef = useRef();

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
			setErrors({ consent: VALIDATION_MESSAGES.BOOKING.consent.REQUIRED });
			return;
		}
		const apiData = mapToApi(data, mappingConfigs.passenger);
		dispatch(createUserPassenger({ userId: currentUser.id, data: { ...apiData, consent } }))
			.then(() => {
				setShowForm(false);
				setData({});
				setConsent(false);
				setErrors({});
			})
			.catch((res) => setErrors(res || {}));
	};

	return (
		<Container maxWidth='md' sx={{ mt: 4 }}>
			<Paper sx={{ p: 2, width: '100%' }}>
				<Typography variant='h4'>{UI_LABELS.PROFILE.passengers}</Typography>

				<Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
					{passengers && passengers.length === 0 ? (
						<Typography variant='subtitle1' sx={{ textAlign: 'center' }}>
							{UI_LABELS.PROFILE.no_passengers}
						</Typography>
					) : (
						<TableContainer>
							<Table size='medium'>
								<TableHead>
									<TableRow>
										<TableCell sx={{ fontWeight: 'bold' }}>{UI_LABELS.PROFILE.last_name}</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }}>
											{UI_LABELS.PROFILE.first_name}
										</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }}>
											{UI_LABELS.PROFILE.birth_date}
										</TableCell>
										<TableCell />
									</TableRow>
								</TableHead>
								<TableBody>
									{passengers.map((p) => (
										<TableRow key={p.id}>
											<TableCell>{p.last_name}</TableCell>
											<TableCell>{p.first_name}</TableCell>
											<TableCell>{p.birth_date}</TableCell>
											<TableCell align='right'>
												<MuiLink
													href={p.link}
													target='_blank'
													underline='hover'
													sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
												>
													{UI_LABELS.PROFILE.more_details}
													<OpenInNewIcon fontSize='inherit' />
												</MuiLink>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					)}

					{showForm ? (
						<Paper elevation={1} sx={{ p: 2 }}>
							<PassengerForm
								passenger={data}
								onChange={handleChange}
								citizenshipOptions={citizenshipOptions}
								ref={formRef}
							/>
							<Box sx={{ display: 'flex', flexDirection: 'column', rowGap: 1, my: 1, mx: 2 }}>
								<PrivacyConsentCheckbox
									value={consent}
									onChange={(val) => {
										setConsent(val);
										if (val && errors.consent) setErrors({ ...errors, consent: undefined });
									}}
									error={errors.consent}
								/>
								<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
									<Box>
										<Button variant='contained' onClick={handleSubmit} sx={{ mr: 1 }}>
											{UI_LABELS.BOOKING.passenger_form.add_passenger}
										</Button>
										<Button variant='text' onClick={() => setShowForm(false)}>
											{UI_LABELS.BUTTONS.cancel}
										</Button>
									</Box>
								</Box>
							</Box>
						</Paper>
					) : (
						<Box>
							<Button variant='outlined' onClick={() => setShowForm(true)}>
								{UI_LABELS.BOOKING.passenger_form.add_passenger}
							</Button>
						</Box>
					)}
				</Box>
			</Paper>
		</Container>
	);
};

export default PassengersTab;
