import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import AdminDataTable from '../../components/admin/AdminDataTable';
import { downloadTemplate, uploadFile } from '../../api';

import {
	fetchAirports,
	createAirport,
	updateAirport,
	deleteAirport,
	deleteAllAirports,
} from '../../redux/actions/airport';
import { fetchCountries } from '../../redux/actions/country';
import { fetchTimezones } from '../../redux/actions/timezone';
import { createAdminManager } from './utils';
import { FIELD_TYPES } from '../utils';
import { FIELD_LABELS, UI_LABELS, VALIDATION_MESSAGES } from '../../constants';

const AirportManagement = () => {
	const dispatch = useDispatch();
	const { airports, isLoading, errors } = useSelector((state) => state.airports);
	const { countries, isLoading: countriesLoading } = useSelector((state) => state.countries);
	const { timezones, isLoading: tzLoading } = useSelector((state) => state.timezones);

	useEffect(() => {
		dispatch(fetchAirports());
		dispatch(fetchCountries());
		dispatch(fetchTimezones());
	}, [dispatch]);

	const countryOptions =
		!countries || !Array.isArray(countries) ? [] : countries.map((c) => ({ value: c.id, label: c.name }));

	const timezoneOptions =
		!timezones || !Array.isArray(timezones) ? [] : timezones.map((tz) => ({ value: tz.id, label: tz.name }));

	const getCountryById = (id) => {
		if (!countries || !Array.isArray(countries)) return null;
		return countries.find((c) => c.id === id);
	};

	const getTimezoneById = (id) => {
		if (!timezones || !Array.isArray(timezones)) return null;
		return timezones.find((t) => t.id === id);
	};

	const FIELDS = {
		id: { key: 'id', apiKey: 'id' },
		name: {
			key: 'name',
			apiKey: 'name',
			label: FIELD_LABELS.AIRPORT.name,
			type: FIELD_TYPES.TEXT,
			fullWidth: true,
			validate: (value) => (!value ? VALIDATION_MESSAGES.AIRPORT.name.REQUIRED : null),
		},
		iataCode: {
			key: 'iataCode',
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
			key: 'icaoCode',
			apiKey: 'icao_code',
			label: FIELD_LABELS.AIRPORT.icao_code,
			type: FIELD_TYPES.TEXT,
			excludeFromTable: true,
			validate: (value) => (value && value.length !== 4 ? VALIDATION_MESSAGES.AIRPORT.icao_code.LENGTH : null),
			inputProps: { maxLength: 4 },
		},
		cityName: {
			key: 'cityName',
			apiKey: 'city_name',
			label: FIELD_LABELS.AIRPORT.city_name,
			type: FIELD_TYPES.TEXT,
			validate: (value) => (!value ? VALIDATION_MESSAGES.AIRPORT.city_name.REQUIRED : null),
		},
		cityNameEn: {
			key: 'cityNameEn',
			apiKey: 'city_name_en',
			label: FIELD_LABELS.AIRPORT.city_name_en,
			type: FIELD_TYPES.TEXT,
			excludeFromTable: true,
		},
		cityCode: {
			key: 'cityCode',
			apiKey: 'city_code',
			label: FIELD_LABELS.AIRPORT.city_code,
			type: FIELD_TYPES.TEXT,
			validate: (value) => (!value ? VALIDATION_MESSAGES.AIRPORT.city_code.REQUIRED : null),
		},
		countryId: {
			key: 'countryId',
			apiKey: 'country_id',
			label: FIELD_LABELS.AIRPORT.country_id,
			type: FIELD_TYPES.SELECT,
			options: countryOptions,
			formatter: (value) => {
				const c = getCountryById(value);
				return c ? c.name : value;
			},
			validate: (value) => (!value ? VALIDATION_MESSAGES.AIRPORT.country_id.REQUIRED : null),
		},
		timezoneId: {
			key: 'timezoneId',
			apiKey: 'timezone_id',
			label: FIELD_LABELS.AIRPORT.timezone_id || 'Часовой пояс',
			type: FIELD_TYPES.SELECT,
			options: timezoneOptions,
			formatter: (value) => {
				const tz = getTimezoneById(value);
				return tz ? tz.name : value;
			},
		},
	};

	const adminManager = createAdminManager(FIELDS, {
		addButtonText: (item) => UI_LABELS.ADMIN.modules.airports.add_button,
		editButtonText: (item) => UI_LABELS.ADMIN.modules.airports.edit_button,
	});

	const handleAddAirport = (airportData) => dispatch(createAirport(adminManager.toApiFormat(airportData))).unwrap();
	const handleEditAirport = (airportData) => dispatch(updateAirport(adminManager.toApiFormat(airportData))).unwrap();
	const handleDeleteAirport = (id) => dispatch(deleteAirport(id)).unwrap();

	const handleDeleteAllAirports = async () => {
		await dispatch(deleteAllAirports()).unwrap();
		dispatch(fetchAirports());
	};

	const handleUpload = async (file) => {
		const res = await uploadFile('airports', file);
		dispatch(fetchAirports());
		return res;
	};

	const handleGetTemplate = async () => {
		await downloadTemplate('airports', 'airports_template.xlsx');
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
			onDeleteAll={handleDeleteAllAirports}
			renderForm={adminManager.renderForm}
			addButtonText={UI_LABELS.ADMIN.modules.airports.add_button}
			uploadButtonText={UI_LABELS.ADMIN.modules.airports.upload_button}
			uploadTemplateButtonText={UI_LABELS.ADMIN.modules.airports.upload_template_button}
			getUploadTemplate={handleGetTemplate}
			onUpload={handleUpload}
			isLoading={isLoading || countriesLoading || tzLoading}
			error={errors}
		/>
	);
};

export default AirportManagement;
