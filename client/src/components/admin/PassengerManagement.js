import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import AdminDataTable from '../../components/admin/AdminDataTable';

import {
	fetchPassengers,
	createPassenger,
	updatePassenger,
	deletePassenger,
	deleteAllPassengers,
} from '../../redux/actions/passenger';
import { FIELD_TYPES, createAdminManager } from './utils';
import { formatDate, validateDate } from '../utils';
import { ENUM_LABELS, FIELD_LABELS, UI_LABELS, VALIDATION_MESSAGES, getEnumOptions } from '../../constants';

const PassengerManagement = () => {
	const dispatch = useDispatch();
	const { passengers, isLoading, errors } = useSelector((state) => state.passengers);

	useEffect(() => {
		dispatch(fetchPassengers());
	}, [dispatch]);

	const FIELDS = {
		id: { key: 'id', apiKey: 'id' },
		bookingId: {
			key: 'bookingId',
			apiKey: 'booking_id',
		},
		lastName: {
			key: 'lastName',
			apiKey: 'last_name',
			label: FIELD_LABELS.PASSENGER.last_name,
			type: FIELD_TYPES.TEXT,
			fullWidth: true,
			validate: (value) => (!value ? VALIDATION_MESSAGES.PASSENGER.last_name.REQUIRED : null),
		},
		firstName: {
			key: 'firstName',
			apiKey: 'first_name',
			label: FIELD_LABELS.PASSENGER.first_name,
			type: FIELD_TYPES.TEXT,
			fullWidth: true,
			validate: (value) => (!value ? VALIDATION_MESSAGES.PASSENGER.first_name.REQUIRED : null),
		},
		gender: {
			key: 'gender',
			apiKey: 'gender',
			label: FIELD_LABELS.PASSENGER.gender,
			type: FIELD_TYPES.SELECT,
			options: getEnumOptions('GENDER'),
			formatter: (value) => ENUM_LABELS.GENDER[value] || value,
		},
		birthDate: {
			key: 'birthDate',
			apiKey: 'birth_date',
			label: FIELD_LABELS.PASSENGER.birth_date,
			type: FIELD_TYPES.DATE,
			formatter: (value) => formatDate(value),
			validate: (value) => {
				if (value && !validateDate(value)) return VALIDATION_MESSAGES.GENERAL.INVALID_DATE;
				return null;
			},
		},
		documentType: {
			key: 'documentType',
			apiKey: 'document_type',
			label: FIELD_LABELS.PASSENGER.document_type,
			type: FIELD_TYPES.SELECT,
			options: getEnumOptions('DOCUMENT_TYPE'),
			excludeFromTable: true,
		},
		documentNumber: {
			key: 'documentNumber',
			apiKey: 'document_number',
			label: FIELD_LABELS.PASSENGER.document_number,
			type: FIELD_TYPES.TEXT,
			validate: (value) => (!value ? VALIDATION_MESSAGES.PASSENGER.document_number.REQUIRED : null),
		},
		documentExpiryDate: {
			key: 'documentExpiryDate',
			apiKey: 'document_expiry_date',
			label: FIELD_LABELS.PASSENGER.document_expiry_date,
			type: FIELD_TYPES.DATE,
			formatter: (value) => formatDate(value),
		},
		citizenshipId: {
			key: 'citizenshipId',
			apiKey: 'citizenship_id',
			label: FIELD_LABELS.PASSENGER.citizenship_id,
			type: FIELD_TYPES.SELECT,
			options: {},
			formatter: (value) => null,
		},
		emailAddress: {
			key: 'emailAddress',
			apiKey: 'email_address',
			label: FIELD_LABELS.PASSENGER.email_address,
			type: FIELD_TYPES.TEXT,
			validate: (value) => (!value ? VALIDATION_MESSAGES.PASSENGER.email_address.REQUIRED : null),
		},
		phoneNumber: {
			key: 'phoneNumber',
			apiKey: 'phone_number',
			label: FIELD_LABELS.PASSENGER.phone_number,
			type: FIELD_TYPES.TEXT,
			validate: (value) => (!value ? VALIDATION_MESSAGES.PASSENGER.phone_number.REQUIRED : null),
		},
		isContact: {
			key: 'isContact',
			apiKey: 'is_contact',
			label: FIELD_LABELS.PASSENGER.is_contact,
			type: FIELD_TYPES.BOOLEAN,
			excludeFromTable: true,
		},
	};

	const adminManager = createAdminManager(FIELDS, {
		addButtonText: (item) => UI_LABELS.ADMIN.modules.passengers.add_button,
		editButtonText: (item) => UI_LABELS.ADMIN.modules.passengers.edit_button,
	});

	const handleAddPassenger = (data) => dispatch(createPassenger(adminManager.toApiFormat(data))).unwrap();
	const handleEditPassenger = (data) => dispatch(updatePassenger(adminManager.toApiFormat(data))).unwrap();
	const handleDeletePassenger = (id) => dispatch(deletePassenger(id)).unwrap();

	const handleDeleteAllPassengers = async () => {
		await dispatch(deleteAllPassengers()).unwrap();
		dispatch(fetchPassengers());
	};

	const formattedPassengers = passengers.map(adminManager.toUiFormat);

	return (
		<AdminDataTable
			title={UI_LABELS.ADMIN.modules.passengers.management}
			data={formattedPassengers}
			columns={adminManager.columns}
			onAdd={handleAddPassenger}
			onEdit={handleEditPassenger}
			onDelete={handleDeletePassenger}
			onDeleteAll={handleDeleteAllPassengers}
			renderForm={adminManager.renderForm}
			addButtonText={UI_LABELS.ADMIN.modules.passengers.add_button}
			isLoading={isLoading}
			error={errors}
		/>
	);
};

export default PassengerManagement;
