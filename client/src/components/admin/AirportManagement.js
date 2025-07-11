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
import {
	FIELD_LABELS,
	UI_LABELS,
	VALIDATION_MESSAGES,
} from '../../constants';

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
			label: FIELD_LABELS.AIRPORT.name,
			type: FIELD_TYPES.TEXT,
			fullWidth: true,
		},
		iataCode: {
			key: 'iata_code',
			apiKey: 'iata_code',
			label: FIELD_LABELS.AIRPORT.iata_code,
			type: FIELD_TYPES.TEXT,
			validate: (value) =>
				!value
					? VALIDATION_MESSAGES.AIRPORT.iata_code.REQUIRED
					: value.length !== 3
					? VALIDATION_MESSAGES.AIRPORT.iata_code.LENGTH
					: null,
			inputProps: { maxLength: 3 },
		},
		icaoCode: {
			key: 'icao_code',
			apiKey: 'icao_code',
			label: FIELD_LABELS.AIRPORT.icao_code,
			type: FIELD_TYPES.TEXT,
			validate: (value) =>
				value && value.length !== 4
					? VALIDATION_MESSAGES.AIRPORT.icao_code.LENGTH
					: null,
			inputProps: { maxLength: 4 },
		},
		city: {
			key: 'city',
			apiKey: 'city_code',
			label: FIELD_LABELS.AIRPORT.city_code,
			type: FIELD_TYPES.TEXT,
		},
		country: {
			key: 'country',
			apiKey: 'country_code',
			label: FIELD_LABELS.AIRPORT.country_code,
			type: FIELD_TYPES.TEXT,
		},
	};

	const adminManager = createAdminManager(FIELDS, {
		addButtonText: UI_LABELS.ADMIN.modules.airports.add_button,
		editButtonText: UI_LABELS.ADMIN.modules.airports.edit_button,
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
			title={UI_LABELS.ADMIN.modules.airports.management}
			data={formattedAirports}
			columns={adminManager.columns}
			onAdd={handleAddAirport}
			onEdit={handleEditAirport}
			onDelete={handleDeleteAirport}
			renderForm={adminManager.renderForm}
			addButtonText={UI_LABELS.ADMIN.modules.airports.add_button}
			isLoading={isLoading}
			error={errors}
		/>
	);
};

export default AirportManagement;
