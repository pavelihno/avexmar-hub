import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import AdminDataTable from '../../components/admin/AdminDataTable';

import {
	fetchAirports,
	createAirport,
	updateAirport,
	deleteAirport,
} from '../../redux/actions/airport';
import { FIELD_TYPES, createAdminManager } from './utils';

const AirportManagement = () => {
	const dispatch = useDispatch();
	const { airports, isLoading, errors } = useSelector(
		(state) => state.airports
	);

	useEffect(() => {
		dispatch(fetchAirports());
	}, [dispatch]);

	const FIELDS = {
		id: { key: 'id', apiKey: 'id' },
		name: {
			key: 'name',
			apiKey: 'name',
			label: 'Название аэропорта',
			type: FIELD_TYPES.TEXT,
			fullWidth: true,
		},
		iataCode: {
			key: 'iata_code',
			apiKey: 'iata_code',
			label: 'Код IATA',
			type: FIELD_TYPES.TEXT,
			validate: (value) =>
				!value
					? 'IATA код обязателен'
					: value.length !== 3
					? 'IATA код должен содержать 3 символа'
					: null,
			inputProps: { maxLength: 3 },
		},
		icaoCode: {
			key: 'icao_code',
			apiKey: 'icao_code',
			label: 'Код ICAO',
			type: FIELD_TYPES.TEXT,
			validate: (value) =>
				value && value.length !== 4
					? 'ICAO код должен содержать 4 символа'
					: null,
			inputProps: { maxLength: 4 },
		},
		city: {
			key: 'city',
			apiKey: 'city_code',
			label: 'Код города',
			type: FIELD_TYPES.TEXT,
		},
		country: {
			key: 'country',
			apiKey: 'country_code',
			label: 'Код страны',
			type: FIELD_TYPES.TEXT,
		},
	};

	const adminManager = createAdminManager(FIELDS, {
		entityTitle: 'аэропорт',
	});

	const handleAddAirport = (airportData) => {
		dispatch(createAirport(adminManager.toApiFormat(airportData)));
	};

	const handleEditAirport = (airportData) => {
		dispatch(updateAirport(adminManager.toApiFormat(airportData)));
	};

	const handleDeleteAirport = (id) => {
		return dispatch(deleteAirport(id));
	};

	const formattedAirports = airports.map(adminManager.toUiFormat);

	return (
		<AdminDataTable
			title='Управление аэропортами'
			data={formattedAirports}
			columns={adminManager.columns}
			onAdd={handleAddAirport}
			onEdit={handleEditAirport}
			onDelete={handleDeleteAirport}
			renderForm={adminManager.renderForm}
			addButtonText='Добавить аэропорт'
			isLoading={isLoading}
			error={errors}
		/>
	);
};

export default AirportManagement;
