import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import AdminDataTable from './AdminDataTable';
import { downloadTemplate, uploadFile } from '../../api';
import {
	fetchAirlines,
	createAirline,
	updateAirline,
	deleteAirline,
} from '../../redux/actions/airline';
import { fetchCountries } from '../../redux/actions/country';
import { FIELD_TYPES, createAdminManager } from './utils';
import { FIELD_LABELS, UI_LABELS, VALIDATION_MESSAGES } from '../../constants';

const AirlineManagement = () => {
	const dispatch = useDispatch();
	const { airlines, isLoading, errors } = useSelector(
		(state) => state.airlines
	);
	const { countries, isLoading: countriesLoading } = useSelector(
		(state) => state.countries
	);

	useEffect(() => {
		dispatch(fetchAirlines());
		dispatch(fetchCountries());
	}, [dispatch]);

	const countryOptions = useMemo(() => {
		if (!countries || !Array.isArray(countries)) return [];
		return countries.map((c) => ({ value: c.id, label: c.name }));
	}, [countries]);

	const getCountryById = (id) => {
		if (!countries || !Array.isArray(countries)) return null;
		return countries.find((c) => c.id === id);
	};

	const FIELDS = {
		id: { key: 'id', apiKey: 'id' },
		name: {
			key: 'name',
			apiKey: 'name',
			label: FIELD_LABELS.AIRLINE.name,
			type: FIELD_TYPES.TEXT,
			validate: (value) =>
				!value ? VALIDATION_MESSAGES.AIRLINE.name.REQUIRED : null,
		},
		countryId: {
			key: 'countryId',
			apiKey: 'country_id',
			label: FIELD_LABELS.AIRLINE.country_id,
			type: FIELD_TYPES.SELECT,
			options: countryOptions,
			formatter: (value) => {
				const c = getCountryById(value);
				return c ? c.name : value;
			},
			validate: (value) =>
				!value ? VALIDATION_MESSAGES.AIRLINE.country_id.REQUIRED : null,
		},
		iataCode: {
			key: 'iataCode',
			apiKey: 'iata_code',
			label: FIELD_LABELS.AIRLINE.iata_code,
			type: FIELD_TYPES.TEXT,
			validate: (value) =>
				!value
					? VALIDATION_MESSAGES.AIRLINE.iata_code.REQUIRED
					: value.length !== 2
					? VALIDATION_MESSAGES.AIRLINE.iata_code.LENGTH
					: null,
			inputProps: { maxLength: 2 },
		},
		icaoCode: {
			key: 'icaoCode',
			apiKey: 'icao_code',
			label: FIELD_LABELS.AIRLINE.icao_code,
			type: FIELD_TYPES.TEXT,
			validate: (value) =>
				!value
					? VALIDATION_MESSAGES.AIRLINE.icao_code.REQUIRED
					: value.length !== 3
					? VALIDATION_MESSAGES.AIRLINE.icao_code.LENGTH
					: null,
			inputProps: { maxLength: 3 },
		},
	};

	const adminManager = useMemo(
		() =>
			createAdminManager(FIELDS, {
				addButtonText: UI_LABELS.ADMIN.modules.airlines.add_button,
				editButtonText: UI_LABELS.ADMIN.modules.airlines.edit_button,
			}),
		[FIELDS, getCountryById]
	);

        const handleAdd = (data) =>
                dispatch(createAirline(adminManager.toApiFormat(data))).unwrap();
        const handleEdit = (data) =>
                dispatch(updateAirline(adminManager.toApiFormat(data))).unwrap();
        const handleDelete = (id) => dispatch(deleteAirline(id));

	const handleUpload = async (file) => {
		const res = await uploadFile('airlines', file);
		dispatch(fetchAirlines());
		return res;
	};

	const handleGetTemplate = async () => {
		await downloadTemplate('airlines', 'airlines_template.xlsx');
	};

	const formatted = airlines.map(adminManager.toUiFormat);

	return (
		<AdminDataTable
			title={UI_LABELS.ADMIN.modules.airlines.management}
			data={formatted}
			columns={adminManager.columns}
			onAdd={handleAdd}
			onEdit={handleEdit}
			onDelete={handleDelete}
			renderForm={adminManager.renderForm}
			addButtonText={UI_LABELS.ADMIN.modules.airlines.add_button}
			uploadButtonText={UI_LABELS.ADMIN.modules.airlines.upload_button}
			uploadTemplateButtonText={
				UI_LABELS.ADMIN.modules.airlines.upload_template_button
			}
			getUploadTemplate={handleGetTemplate}
			onUpload={handleUpload}
			isLoading={isLoading || countriesLoading}
			error={errors}
		/>
	);
};

export default AirlineManagement;
