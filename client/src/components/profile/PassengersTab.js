import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Button, Typography, Stack, Paper } from '@mui/material';

import PassengerForm from '../booking/PassengerForm';
import {
	fetchUserPassengers,
	createUserPassenger,
} from '../../redux/actions/passenger';
import { fetchCountries } from '../../redux/actions/country';
import { mapToApi, mappingConfigs } from '../utils/mappers';
import { UI_LABELS } from '../../constants/uiLabels';

const PassengersTab = () => {
	const dispatch = useDispatch();
	const { currentUser } = useSelector((state) => state.auth);
	const { passengers } = useSelector((state) => state.passengers);
	const { countries } = useSelector((state) => state.countries);
	const [showForm, setShowForm] = useState(false);
	const [data, setData] = useState({});
	const formRef = useRef();

	useEffect(() => {
		if (currentUser) dispatch(fetchUserPassengers(currentUser.id));
	}, [dispatch, currentUser]);

	useEffect(() => {
		if (!countries || countries.length === 0) dispatch(fetchCountries());
	}, [countries, dispatch]);

	const citizenshipOptions = useMemo(
		() => (countries || []).map((c) => ({ value: c.id, label: c.name })),
		[countries],
	);

	const handleChange = (_field, _value, d) => setData(d);

	const handleSubmit = () => {
		if (!formRef.current?.validate()) return;
		const apiData = mapToApi(data, mappingConfigs.passenger);
		dispatch(
			createUserPassenger({ userId: currentUser.id, data: apiData }),
		).then(() => {
			setShowForm(false);
			setData({});
		});
	};

	return (
		<Box sx={{ maxWidth: 600, mx: 'auto' }}>
			{passengers.length === 0 ? (
				<Typography sx={{ mb: 2 }}>
					{UI_LABELS.PROFILE.no_passengers}
				</Typography>
			) : (
				<Stack spacing={1} sx={{ mb: 2 }}>
					{passengers.map((p) => (
						<Paper key={p.id} sx={{ p: 1 }}>
							<Typography>{`${p.last_name} ${p.first_name}`}</Typography>
						</Paper>
					))}
				</Stack>
			)}
			{showForm ? (
				<Paper sx={{ p: 2 }}>
					<PassengerForm
						passenger={data}
						onChange={handleChange}
						citizenshipOptions={citizenshipOptions}
						ref={formRef}
					/>
					<Button variant="contained" onClick={handleSubmit} sx={{ mr: 1 }}>
						{UI_LABELS.BOOKING.passenger_form.add_passenger}
					</Button>
					<Button variant="text" onClick={() => setShowForm(false)}>
						{UI_LABELS.BUTTONS.cancel}
					</Button>
				</Paper>
			) : (
				<Button variant="outlined" onClick={() => setShowForm(true)}>
					{UI_LABELS.BOOKING.passenger_form.add_passenger}
				</Button>
			)}
		</Box>
	);
};

export default PassengersTab;
