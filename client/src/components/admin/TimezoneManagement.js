import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import AdminDataTable from './AdminDataTable';
import { downloadTemplate, uploadFile } from '../../api';
import {
	fetchTimezones,
	createTimezone,
	updateTimezone,
	deleteTimezone,
	deleteAllTimezones,
} from '../../redux/actions/timezone';
import { createAdminManager } from './utils';
import { FIELD_TYPES } from '../utils';
import { FIELD_LABELS, UI_LABELS, VALIDATION_MESSAGES } from '../../constants';

const TimezoneManagement = () => {
	const dispatch = useDispatch();
	const { timezones, isLoading, errors } = useSelector((state) => state.timezones);

	useEffect(() => {
		dispatch(fetchTimezones());
	}, [dispatch]);

	const FIELDS = {
		id: { key: 'id', apiKey: 'id' },
		name: {
			key: 'name',
			apiKey: 'name',
			label: FIELD_LABELS.TIMEZONE.name,
			type: FIELD_TYPES.TEXT,
			validate: (v) => (!v ? VALIDATION_MESSAGES.TIMEZONE.name.REQUIRED : null),
		},
	};

	const adminManager = createAdminManager(FIELDS, {
		addButtonText: () => UI_LABELS.ADMIN.modules.timezones.add_button,
		editButtonText: () => UI_LABELS.ADMIN.modules.timezones.edit_button,
	});

	const handleAddTimezone = (data) => dispatch(createTimezone(adminManager.toApiFormat(data))).unwrap();
	const handleEditTimezone = (data) => dispatch(updateTimezone(adminManager.toApiFormat(data))).unwrap();
	const handleDeleteTimezone = (id) => dispatch(deleteTimezone(id)).unwrap();

	const handleDeleteAllTimezones = async () => {
		await dispatch(deleteAllTimezones()).unwrap();
		dispatch(fetchTimezones());
	};

	const handleUpload = async (file) => {
		const res = await uploadFile('timezones', file);
		dispatch(fetchTimezones());
		return res;
	};

	const handleGetTemplate = async () => {
		await downloadTemplate('timezones', 'timezones_template.xlsx');
	};

	const formatted = timezones.map(adminManager.toUiFormat);

	return (
		<AdminDataTable
			title={UI_LABELS.ADMIN.modules.timezones.management}
			data={formatted}
			columns={adminManager.columns}
			onAdd={handleAddTimezone}
			onEdit={handleEditTimezone}
			onDelete={handleDeleteTimezone}
			onDeleteAll={handleDeleteAllTimezones}
			renderForm={adminManager.renderForm}
			addButtonText={UI_LABELS.ADMIN.modules.timezones.add_button}
			uploadButtonText={UI_LABELS.ADMIN.modules.timezones.upload_button}
			uploadTemplateButtonText={UI_LABELS.ADMIN.modules.timezones.upload_template_button}
			getUploadTemplate={handleGetTemplate}
			onUpload={handleUpload}
			isLoading={isLoading}
			error={errors}
		/>
	);
};

export default TimezoneManagement;
