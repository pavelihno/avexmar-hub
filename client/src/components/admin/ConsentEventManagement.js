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
import { fetchUsers } from '../../redux/actions/user';
import { fetchBookings } from '../../redux/actions/booking';
import { fetchConsentDocs } from '../../redux/actions/consentDoc';
import { fetchPassengers } from '../../redux/actions/passenger';
import { createAdminManager } from './utils';
import { FIELD_TYPES, formatDate } from '../utils';
import { ENUM_LABELS, FIELD_LABELS, UI_LABELS, VALIDATION_MESSAGES, getEnumOptions } from '../../constants';

const ConsentEventManagement = () => {
	const dispatch = useDispatch();
	const { consentEvents, isLoading, errors } = useSelector((state) => state.consentEvents);
	const { users, isLoading: usersLoading } = useSelector((state) => state.users);
	const { bookings, isLoading: bookingsLoading } = useSelector((state) => state.bookings);
	const { consentDocs, isLoading: docsLoading } = useSelector((state) => state.consentDocs);
	const { passengers, isLoading: passengersLoading } = useSelector((state) => state.passengers);

	useEffect(() => {
		dispatch(fetchConsentEvents());
		dispatch(fetchUsers());
		dispatch(fetchBookings());
		dispatch(fetchConsentDocs());
		dispatch(fetchPassengers());
	}, [dispatch]);

	const typeOptions = getEnumOptions('CONSENT_EVENT_TYPE');
	const actionOptions = getEnumOptions('CONSENT_ACTION');

	const userOptions = (users || []).map((u) => ({ value: u.id, label: u.email }));
	const bookingOptions = (bookings || []).map((b) => ({
		value: b.id,
		label: `${b.booking_number || b.public_id} — ${formatDate(b.booking_date)}`,
	}));
	const docOptions = (consentDocs || []).map((d) => ({
		value: d.id,
		label: `${ENUM_LABELS.CONSENT_DOC_TYPE[d.type]} v${d.version}`,
	}));

	const passengerOptions = (passengers || []).map((p) => ({
		value: p.id,
		label: `${p.last_name} ${p.first_name}`,
	}));

	const FIELDS = {
		id: { key: 'id', apiKey: 'id' },
		type: {
			key: 'type',
			apiKey: 'type',
			label: FIELD_LABELS.CONSENT_EVENT.type,
			type: FIELD_TYPES.SELECT,
			options: typeOptions,
			formatter: (value) => ENUM_LABELS.CONSENT_EVENT_TYPE[value] || value,
			validate: (value) => (!value ? VALIDATION_MESSAGES.CONSENT_EVENT.type.REQUIRED : null),
		},
		granter_user_id: {
			key: 'granter_user_id',
			apiKey: 'granter_user_id',
			label: FIELD_LABELS.CONSENT_EVENT.granter_user_id,
			type: FIELD_TYPES.SELECT,
			options: userOptions,
			formatter: (value) => userOptions.find((o) => o.value === value)?.label || value,
		},
		booking_id: {
			key: 'booking_id',
			apiKey: 'booking_id',
			label: FIELD_LABELS.CONSENT_EVENT.booking_id,
			type: FIELD_TYPES.SELECT,
			options: bookingOptions,
			formatter: (value) => bookingOptions.find((o) => o.value === value)?.label || value,
			validate: (value) => (!value ? VALIDATION_MESSAGES.CONSENT_EVENT.booking_id.REQUIRED : null),
		},
		doc_id: {
			key: 'doc_id',
			apiKey: 'doc_id',
			label: FIELD_LABELS.CONSENT_EVENT.doc_id,
			type: FIELD_TYPES.SELECT,
			options: docOptions,
			formatter: (value) => docOptions.find((o) => o.value === value)?.label || value,
			validate: (value) => (!value ? VALIDATION_MESSAGES.CONSENT_EVENT.doc_id.REQUIRED : null),
		},
		action: {
			key: 'action',
			apiKey: 'action',
			label: FIELD_LABELS.CONSENT_EVENT.action,
			type: FIELD_TYPES.SELECT,
			options: actionOptions,
			formatter: (value) => ENUM_LABELS.CONSENT_ACTION[value] || value,
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
			type: FIELD_TYPES.CUSTOM,
			renderField: (arg) => {
				const ids = Array.isArray(arg?.subject_ids) ? arg.subject_ids : [];
				const labels = ids.map((id) => passengerOptions.find((o) => o.value === id)?.label).filter(Boolean);
				return labels.join(', ');
			},
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
			isLoading={isLoading || usersLoading || bookingsLoading || docsLoading || passengersLoading}
			error={errors}
		/>
	);
};

export default ConsentEventManagement;
