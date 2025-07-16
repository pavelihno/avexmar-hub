import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import AdminDataTable from './AdminDataTable';
import { downloadTemplate, uploadFile } from '../../api';
import {
	fetchCountries,
	createCountry,
	updateCountry,
	deleteCountry,
} from '../../redux/actions/country';
import { FIELD_TYPES, createAdminManager } from './utils';
import { FIELD_LABELS, UI_LABELS, VALIDATION_MESSAGES } from '../../constants';

const CountryManagement = () => {
	const dispatch = useDispatch();
	const { countries, isLoading, errors } = useSelector(
		(state) => state.countries
	);

	useEffect(() => {
		dispatch(fetchCountries());
	}, [dispatch]);

	const FIELDS = {
		id: { key: 'id', apiKey: 'id' },
		name: {
			key: 'name',
			apiKey: 'name',
			label: FIELD_LABELS.COUNTRY.name,
			type: FIELD_TYPES.TEXT,
			fullWidth: true,
			validate: (value) =>
				!value ? VALIDATION_MESSAGES.COUNTRY.name.REQUIRED : null,
		},
		nameEn: {
			key: 'nameEn',
			apiKey: 'name_en',
			label: FIELD_LABELS.COUNTRY.name_en,
			type: FIELD_TYPES.TEXT,
			fullWidth: true,
		},
		codeA2: {
			key: 'codeA2',
			apiKey: 'code_a2',
			label: FIELD_LABELS.COUNTRY.code_a2,
			type: FIELD_TYPES.TEXT,
			validate: (value) =>
				!value
					? VALIDATION_MESSAGES.COUNTRY.code_a2.REQUIRED
					: value.length !== 2
					? VALIDATION_MESSAGES.COUNTRY.code_a2.LENGTH
					: null,
			inputProps: { maxLength: 2 },
		},
		codeA3: {
			key: 'codeA3',
			apiKey: 'code_a3',
			label: FIELD_LABELS.COUNTRY.code_a3,
			type: FIELD_TYPES.TEXT,
			validate: (value) =>
				!value
					? VALIDATION_MESSAGES.COUNTRY.code_a3.REQUIRED
					: value.length !== 3
					? VALIDATION_MESSAGES.COUNTRY.code_a3.LENGTH
					: null,
			inputProps: { maxLength: 3 },
		},
	};

	const adminManager = createAdminManager(FIELDS, {
		addButtonText: UI_LABELS.ADMIN.modules.countries.add_button,
		editButtonText: UI_LABELS.ADMIN.modules.countries.edit_button,
	});

        const handleAdd = (data) =>
                dispatch(createCountry(adminManager.toApiFormat(data))).unwrap();
        const handleEdit = (data) =>
                dispatch(updateCountry(adminManager.toApiFormat(data))).unwrap();
        const handleDelete = (id) => dispatch(deleteCountry(id));

	const handleUpload = async (file) => {
		const res = await uploadFile('countries', file);
		dispatch(fetchCountries());
		return res;
	};

	const handleGetTemplate = async () => {
		await downloadTemplate('countries', 'countries_template.xlsx');
	};

	const formatted = countries.map(adminManager.toUiFormat);

	return (
		<AdminDataTable
			title={UI_LABELS.ADMIN.modules.countries.management}
			data={formatted}
			columns={adminManager.columns}
			onAdd={handleAdd}
			onEdit={handleEdit}
			onDelete={handleDelete}
			renderForm={adminManager.renderForm}
			addButtonText={UI_LABELS.ADMIN.modules.countries.add_button}
			uploadButtonText={UI_LABELS.ADMIN.modules.countries.upload_button}
			uploadTemplateButtonText={
				UI_LABELS.ADMIN.modules.countries.upload_template_button
			}
			getUploadTemplate={handleGetTemplate}
			onUpload={handleUpload}
			isLoading={isLoading}
			error={errors}
		/>
	);
};

export default CountryManagement;
