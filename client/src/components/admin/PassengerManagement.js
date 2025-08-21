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
import { fetchCountries } from '../../redux/actions/country';
import { fetchUsers } from '../../redux/actions/user';
import { createAdminManager } from './utils';
import { FIELD_TYPES, formatDate, validateDate } from '../utils';
import {
	DATE_API_FORMAT,
	ENUM_LABELS,
	FIELD_LABELS,
	UI_LABELS,
	VALIDATION_MESSAGES,
	getEnumOptions,
} from '../../constants';

const PassengerManagement = () => {
	const dispatch = useDispatch();
	const { passengers, isLoading: passengersLoading, errors } = useSelector((state) => state.passengers);
	const { countries } = useSelector((state) => state.countries);
	const { users } = useSelector((state) => state.users);

	useEffect(() => {
		dispatch(fetchPassengers());
		dispatch(fetchCountries());
		dispatch(fetchUsers());
	}, [dispatch]);

	const citizenshipOptions = countries.map((c) => ({
		value: c.id,
		label: c.name,
	}));
	const userOptions = users.map((u) => ({ value: u.id, label: u.email }));

	const getCountryById = (id) => countries.find((c) => c.id === id);

	const FIELDS = {
		id: { key: 'id', apiKey: 'id' },
		ownerUserId: {
			key: 'ownerUserId',
			apiKey: 'owner_user_id',
			label: FIELD_LABELS.PASSENGER.owner_user_id,
			type: FIELD_TYPES.SELECT,
			options: userOptions,
			formatter: (value) => {
				const u = userOptions.find((o) => o.value === value);
				return u ? u.label : value;
			},
		},
		lastName: {
			key: 'lastName',
			apiKey: 'last_name',
			label: FIELD_LABELS.PASSENGER.last_name,
			type: FIELD_TYPES.TEXT,
			validate: (value) => (!value ? VALIDATION_MESSAGES.PASSENGER.last_name.REQUIRED : null),
		},
		firstName: {
			key: 'firstName',
			apiKey: 'first_name',
			label: FIELD_LABELS.PASSENGER.first_name,
			type: FIELD_TYPES.TEXT,
			validate: (value) => (!value ? VALIDATION_MESSAGES.PASSENGER.first_name.REQUIRED : null),
		},
		patronymicName: {
			key: 'patronymicName',
			apiKey: 'patronymic_name',
			label: FIELD_LABELS.PASSENGER.patronymic_name,
			type: FIELD_TYPES.TEXT,
			excludeFromTable: true,
		},
		gender: {
			key: 'gender',
			apiKey: 'gender',
			label: FIELD_LABELS.PASSENGER.gender,
			type: FIELD_TYPES.SELECT,
			options: getEnumOptions('GENDER'),
			formatter: (value) => ENUM_LABELS.GENDER_SHORT[value] || value,
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
			formatter: (value) => ENUM_LABELS.DOCUMENT_TYPE[value] || value,
			validate: (value) => (!value ? VALIDATION_MESSAGES.PASSENGER.document_type.REQUIRED : null),
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
			excludeFromTable: true,
			formatter: (value) => formatDate(value),
		},
		citizenshipId: {
			key: 'citizenshipId',
			apiKey: 'citizenship_id',
			label: FIELD_LABELS.PASSENGER.citizenship_id,
			type: FIELD_TYPES.SELECT,
			options: citizenshipOptions,
			formatter: (value) => {
				const c = getCountryById(value);
				return c ? c.code_a2 : value;
			},
		},
	};

	const adminManager = createAdminManager(FIELDS, {
		addButtonText: () => UI_LABELS.ADMIN.modules.passengers.add_button,
		editButtonText: () => UI_LABELS.ADMIN.modules.passengers.edit_button,
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
			isLoading={passengersLoading}
			error={errors}
		/>
	);
};

export default PassengerManagement;
