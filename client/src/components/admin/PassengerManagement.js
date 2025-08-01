import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import AdminDataTable from '../../components/admin/AdminDataTable';

import {
	fetchPassengers,
	createPassenger,
	updatePassenger,
	deletePassenger,
	deleteAllPassengers,
} from '../../redux/actions/passenger';
import {
	fetchBookingPassengers,
	createBookingPassenger,
	updateBookingPassenger,
	deleteBookingPassenger,
	deleteAllBookingPassengers,
} from '../../redux/actions/bookingPassenger';
import { fetchBookings } from '../../redux/actions/booking';
import { fetchCountries } from '../../redux/actions/country';
import { createAdminManager } from './utils';
import { FIELD_TYPES } from '../utils';
import { formatDate, validateDate, isDuplicateInBooking } from '../utils';
import { ENUM_LABELS, FIELD_LABELS, UI_LABELS, VALIDATION_MESSAGES, getEnumOptions } from '../../constants';

const PassengerManagement = () => {
	const dispatch = useDispatch();
	const { passengers, isLoading: passengersLoading, errors } = useSelector((state) => state.passengers);
	const { bookingPassengers, isLoading: bookingPassengersLoading } = useSelector((state) => state.bookingPassengers);
	const { bookings } = useSelector((state) => state.bookings);
	const { countries } = useSelector((state) => state.countries);

	useEffect(() => {
		dispatch(fetchPassengers());
		dispatch(fetchBookingPassengers());
		dispatch(fetchBookings());
		dispatch(fetchCountries());
	}, [dispatch]);

	const bookingOptions = useMemo(
		() => bookings.map((b) => ({ value: b.id, label: `${b.booking_number} - ${formatDate(b.booking_date)}` })),
		[bookings]
	);
	const citizenshipOptions = useMemo(() => countries.map((c) => ({ value: c.id, label: c.name })), [countries]);

	const getCountryById = (id) => countries.find((c) => c.id === id);

	const FIELDS = useMemo(
		() => ({
			id: { key: 'id', apiKey: 'id' },
			passengerId: { key: 'passengerId', apiKey: 'passenger_id', excludeFromForm: true, excludeFromTable: true },
			bookingId: {
				key: 'bookingId',
				apiKey: 'booking_id',
				label: FIELD_LABELS.BOOKING_PASSENGER.booking_id,
				type: FIELD_TYPES.SELECT,
				fullWidth: true,
				options: bookingOptions,
				formatter: (value) => {
					const booking = bookingOptions.find((b) => b.value === value);
					return booking ? booking.label : value;
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
				excludeFromTable: true,
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
			emailAddress: {
				key: 'emailAddress',
				apiKey: 'email_address',
				label: FIELD_LABELS.BOOKING.email_address,
				type: FIELD_TYPES.TEXT,
				validate: (value) => (!value ? VALIDATION_MESSAGES.BOOKING.email_address.REQUIRED : null),
			},
			phoneNumber: {
				key: 'phoneNumber',
				apiKey: 'phone_number',
				label: FIELD_LABELS.BOOKING.phone_number,
				type: FIELD_TYPES.TEXT,
				validate: (value) => (!value ? VALIDATION_MESSAGES.BOOKING.phone_number.REQUIRED : null),
			},
			isContact: {
				key: 'isContact',
				apiKey: 'is_contact',
				label: FIELD_LABELS.BOOKING_PASSENGER.is_contact,
				type: FIELD_TYPES.BOOLEAN,
				excludeFromTable: true,
			},
		}),
		[bookingOptions, citizenshipOptions, bookings, countries]
	);

	const adminManager = useMemo(
		() =>
			createAdminManager(FIELDS, {
				addButtonText: () => UI_LABELS.ADMIN.modules.passengers.add_button,
				editButtonText: () => UI_LABELS.ADMIN.modules.passengers.edit_button,
			}),
		[FIELDS]
	);

	const handleAddPassenger = async (data) => {
		const apiData = adminManager.toApiFormat(data);
		const { booking_id, is_contact, ...passengerData } = apiData;
		if (
			isDuplicateInBooking(
				bookingPassengers,
				passengers,
				booking_id,
				passengerData.first_name,
				passengerData.last_name,
				passengerData.birth_date
			)
		) {
			throw new Error(VALIDATION_MESSAGES.BOOKING.passenger.EXISTS);
		}

		let existing = passengers.find(
			(p) =>
				p.first_name === passengerData.first_name &&
				p.last_name === passengerData.last_name &&
				p.birth_date === formatDate(passengerData.birth_date, 'yyyy-MM-dd') &&
				p.document_type === passengerData.document_type &&
				p.document_number === passengerData.document_number
		);

		if (!existing) {
			existing = await dispatch(createPassenger(passengerData)).unwrap();
		}

		return dispatch(
			createBookingPassenger({
				booking_id,
				passenger_id: existing.id,
				is_contact,
			})
		).unwrap();
	};

	const handleEditPassenger = async (data) => {
		const apiData = adminManager.toApiFormat(data);
		const { id, booking_id, passenger_id, is_contact, ...passengerData } = apiData;
		if (
			isDuplicateInBooking(
				bookingPassengers,
				passengers,
				booking_id,
				passengerData.first_name,
				passengerData.last_name,
				passengerData.birth_date,
				id
			)
		) {
			throw new Error(VALIDATION_MESSAGES.BOOKING.passenger.EXISTS);
		}

		let existing = passengers.find(
			(p) =>
				p.first_name === passengerData.first_name &&
				p.last_name === passengerData.last_name &&
				p.birth_date === formatDate(passengerData.birth_date, 'yyyy-MM-dd') &&
				p.document_type === passengerData.document_type &&
				p.document_number === passengerData.document_number
		);

		if (!existing) {
			existing = await dispatch(createPassenger(passengerData)).unwrap();
		}

		await dispatch(updateBookingPassenger({ id, booking_id, passenger_id: existing.id, is_contact })).unwrap();

		if (existing.id !== passenger_id) {
			const stillLinked = bookingPassengers.some((b) => b.passenger_id === passenger_id && b.id !== id);
			if (!stillLinked) {
				await dispatch(deletePassenger(passenger_id)).unwrap();
			}
		}
		return existing;
	};

	const handleDeletePassenger = async (id) => {
		const bp = bookingPassengers.find((b) => b.id === id);
		if (!bp) return Promise.resolve();

		await dispatch(deleteBookingPassenger(id)).unwrap();

		const stillLinked = bookingPassengers.some((b) => b.id !== id && b.passenger_id === bp.passenger_id);

		if (!stillLinked) {
			await dispatch(deletePassenger(bp.passenger_id)).unwrap();
		}
	};

	const handleDeleteAllPassengers = async () => {
		await dispatch(deleteAllBookingPassengers()).unwrap();
		await dispatch(deleteAllPassengers()).unwrap();
		dispatch(fetchBookingPassengers());
		dispatch(fetchPassengers());
	};

	const formattedPassengers = bookingPassengers.map((bp) => {
		const passenger = passengers.find((p) => p.id === bp.passenger_id) || {};
		const booking = bookings.find((b) => b.id === bp.booking_id) || {};
		return adminManager.toUiFormat({
			...passenger,
			id: bp.id,
			passenger_id: passenger.id,
			booking_id: booking.id,
			is_contact: bp.is_contact,
			email_address: booking.email_address,
			phone_number: booking.phone_number,
		});
	});

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
			isLoading={passengersLoading || bookingPassengersLoading}
			error={errors}
		/>
	);
};

export default PassengerManagement;
