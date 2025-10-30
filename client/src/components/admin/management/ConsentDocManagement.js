import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import AdminDataTable from './AdminDataTable';
import {
	fetchConsentDocs,
	createConsentDoc,
	updateConsentDoc,
	deleteConsentDoc,
	deleteAllConsentDocs,
	deleteFilteredConsentDocs,
} from '../../../redux/actions/consentDoc';
import { createAdminManager } from '../utils';
import { FIELD_TYPES } from '../../utils';
import { ENUM_LABELS, FIELD_LABELS, UI_LABELS, VALIDATION_MESSAGES, getEnumOptions } from '../../../constants';

const ConsentDocManagement = () => {
	const dispatch = useDispatch();
	const { consentDocs, isLoading, errors } = useSelector((state) => state.consentDocs);

	useEffect(() => {
		dispatch(fetchConsentDocs());
	}, [dispatch]);

	const typeOptions = getEnumOptions('CONSENT_DOC_TYPE');

	const FIELDS = {
		id: { key: 'id', apiKey: 'id' },
		type: {
			key: 'type',
			apiKey: 'type',
			label: FIELD_LABELS.CONSENT_DOC.type,
			type: FIELD_TYPES.SELECT,
			options: typeOptions,
			formatter: (value) => ENUM_LABELS.CONSENT_DOC_TYPE[value] || value,
			validate: (value) => (!value ? VALIDATION_MESSAGES.CONSENT_DOC.type.REQUIRED : null),
		},
		version: {
			key: 'version',
			apiKey: 'version',
			label: FIELD_LABELS.CONSENT_DOC.version,
			type: FIELD_TYPES.NUMBER,
			excludeFromForm: true,
		},
		content: {
			key: 'content',
			apiKey: 'content',
			label: FIELD_LABELS.CONSENT_DOC.content,
			type: FIELD_TYPES.RICH_TEXT,
			fullWidth: true,
			validate: (value) => (!value ? VALIDATION_MESSAGES.CONSENT_DOC.content.REQUIRED : null),
		},
	};

	const adminManager = createAdminManager(FIELDS, {
		addButtonText: () => UI_LABELS.ADMIN.modules.consentDocs.add_button,
		editButtonText: () => UI_LABELS.ADMIN.modules.consentDocs.edit_button,
	});

	const handleAdd = (data) => dispatch(createConsentDoc(adminManager.toApiFormat(data))).unwrap();
	const handleEdit = async (data) => {
		await dispatch(updateConsentDoc(adminManager.toApiFormat(data))).unwrap();
		dispatch(fetchConsentDocs());
	};
	const handleDelete = (id) => dispatch(deleteConsentDoc(id)).unwrap();

	const handleDeleteAll = async () => {
		await dispatch(deleteAllConsentDocs()).unwrap();
		dispatch(fetchConsentDocs());
	};
	const handleDeleteFiltered = async (ids) => {
		if (!ids?.length) return;
		await dispatch(deleteFilteredConsentDocs(ids)).unwrap();
		dispatch(fetchConsentDocs());
	};

	const formattedDocs = consentDocs.map(adminManager.toUiFormat);

	return (
		<AdminDataTable
			title={UI_LABELS.ADMIN.modules.consentDocs.management}
			data={formattedDocs}
			columns={adminManager.columns}
			onAdd={handleAdd}
			onEdit={handleEdit}
			onDelete={handleDelete}
			onDeleteAll={handleDeleteAll}
			onDeleteFiltered={handleDeleteFiltered}
			renderForm={adminManager.renderForm}
			addButtonText={UI_LABELS.ADMIN.modules.consentDocs.add_button}
			isLoading={isLoading}
			error={errors}
		/>
	);
};

export default ConsentDocManagement;
