import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import AdminDataTable from './AdminDataTable';
import {
	fetchConsentEvents,
	createConsentEvent,
	updateConsentEvent,
	deleteConsentEvent,
	deleteAllConsentEvents,
} from '../../redux/actions/consentEvent';
import { createAdminManager } from './utils';
import { FIELD_TYPES } from '../utils';
import { FIELD_LABELS, UI_LABELS, VALIDATION_MESSAGES, getEnumOptions } from '../../constants';

const ConsentEventManagement = () => {
	const dispatch = useDispatch();
	const { consentEvents, isLoading, errors } = useSelector((state) => state.consentEvents);

	useEffect(() => {
		dispatch(fetchConsentEvents());
	}, [dispatch]);

	const typeOptions = getEnumOptions('CONSENT_EVENT_TYPE');
	const actionOptions = getEnumOptions('CONSENT_ACTION');

	const FIELDS = {
		id: { key: 'id', apiKey: 'id' },
		type: {
			key: 'type',
			apiKey: 'type',
			label: FIELD_LABELS.CONSENT_EVENT.type,
			type: FIELD_TYPES.SELECT,
			options: typeOptions,
			validate: (value) => (!value ? VALIDATION_MESSAGES.CONSENT_EVENT.type.REQUIRED : null),
		},
		granter_user_id: {
			key: 'granter_user_id',
			apiKey: 'granter_user_id',
			label: FIELD_LABELS.CONSENT_EVENT.granter_user_id,
			type: FIELD_TYPES.TEXT,
		},
		booking_id: {
			key: 'booking_id',
			apiKey: 'booking_id',
			label: FIELD_LABELS.CONSENT_EVENT.booking_id,
			type: FIELD_TYPES.TEXT,
			validate: (value) => (!value ? VALIDATION_MESSAGES.CONSENT_EVENT.booking_id.REQUIRED : null),
		},
		doc_id: {
			key: 'doc_id',
			apiKey: 'doc_id',
			label: FIELD_LABELS.CONSENT_EVENT.doc_id,
			type: FIELD_TYPES.TEXT,
			validate: (value) => (!value ? VALIDATION_MESSAGES.CONSENT_EVENT.doc_id.REQUIRED : null),
		},
		action: {
			key: 'action',
			apiKey: 'action',
			label: FIELD_LABELS.CONSENT_EVENT.action,
			type: FIELD_TYPES.SELECT,
			options: actionOptions,
			validate: (value) => (!value ? VALIDATION_MESSAGES.CONSENT_EVENT.action.REQUIRED : null),
		},
		ip: {
			key: 'ip',
			apiKey: 'ip',
			label: FIELD_LABELS.CONSENT_EVENT.ip,
			type: FIELD_TYPES.TEXT,
		},
		user_agent: {
			key: 'user_agent',
			apiKey: 'user_agent',
			label: FIELD_LABELS.CONSENT_EVENT.user_agent,
			type: FIELD_TYPES.TEXT_AREA,
			fullWidth: true,
		},
		device_fingerprint: {
			key: 'device_fingerprint',
			apiKey: 'device_fingerprint',
			label: FIELD_LABELS.CONSENT_EVENT.device_fingerprint,
			type: FIELD_TYPES.TEXT,
		},
		subject_ids: {
			key: 'subject_ids',
			apiKey: 'subject_ids',
			label: FIELD_LABELS.CONSENT_EVENT.subject_ids,
			type: FIELD_TYPES.TEXT,
			toApi: (value) => (value ? value.split(',').map((v) => v.trim()) : []),
			toUi: (value) => (value || []).join(','),
		},
	};

	const adminManager = createAdminManager(FIELDS, {
		addButtonText: () => UI_LABELS.ADMIN.modules.consentEvents.add_button,
		editButtonText: () => UI_LABELS.ADMIN.modules.consentEvents.edit_button,
	});

	const handleAdd = (data) => dispatch(createConsentEvent(adminManager.toApiFormat(data))).unwrap();
	const handleEdit = (data) => dispatch(updateConsentEvent(adminManager.toApiFormat(data))).unwrap();
	const handleDelete = (id) => dispatch(deleteConsentEvent(id)).unwrap();
	
	const handleDeleteAll = async () => {
	await dispatch(deleteAllConsentEvents()).unwrap();
	dispatch(fetchConsentEvents());
	};

	const formattedEvents = consentEvents.map(adminManager.toUiFormat);

	return (
	<AdminDataTable
	title={UI_LABELS.ADMIN.modules.consentEvents.management}
	data={formattedEvents}
	columns={adminManager.columns}
	onAdd={handleAdd}
	onEdit={handleEdit}
	onDelete={handleDelete}
	onDeleteAll={handleDeleteAll}
	renderForm={adminManager.renderForm}
	addButtonText={UI_LABELS.ADMIN.modules.consentEvents.add_button}
	isLoading={isLoading}
	error={errors}
	/>
	);
};

export default ConsentEventManagement;
