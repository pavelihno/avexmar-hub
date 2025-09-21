import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import AdminDataTable from '../../components/admin/AdminDataTable';

import {
	fetchPayments,
	createPayment,
	updatePayment,
	deletePayment,
	deleteAllPayments,
} from '../../redux/actions/payment';
import { fetchBookings } from '../../redux/actions/booking';
import { createAdminManager } from './utils';
import { FIELD_TYPES, formatNumber } from '../utils';
import { ENUM_LABELS, FIELD_LABELS, UI_LABELS, getEnumOptions } from '../../constants';
import { formatDate } from '../utils';

const PaymentManagement = () => {
	const dispatch = useDispatch();
	const { payments, isLoading, errors } = useSelector((state) => state.payment);
	const { bookings } = useSelector((state) => state.bookings);

	useEffect(() => {
		dispatch(fetchPayments());
		dispatch(fetchBookings());
	}, [dispatch]);

	const bookingOptions = bookings.map((b) => ({
		value: b.id,
		label: `${b.booking_number || b.public_id} — ${formatDate(b.booking_date)}`,
	}));

	const methodOptions = getEnumOptions('PAYMENT_METHOD');
	const statusOptions = getEnumOptions('PAYMENT_STATUS');
	const currencyOptions = getEnumOptions('CURRENCY');
	const typeOptions = getEnumOptions('PAYMENT_TYPE');

	const FIELDS = {
		id: { key: 'id', apiKey: 'id' },
		bookingId: {
			key: 'bookingId',
			apiKey: 'booking_id',
			label: FIELD_LABELS.PAYMENT.booking_id,
			type: FIELD_TYPES.SELECT,
			options: bookingOptions,
			formatter: (value) => {
				const opt = bookingOptions.find((o) => o.value === value);
				return opt ? opt.label : value;
			},
		},
		paymentMethod: {
			key: 'paymentMethod',
			apiKey: 'payment_method',
			label: FIELD_LABELS.PAYMENT.payment_method,
			type: FIELD_TYPES.SELECT,
			options: methodOptions,
			formatter: (value) => ENUM_LABELS.PAYMENT_METHOD[value] || value,
		},
		paymentType: {
			key: 'paymentType',
			apiKey: 'payment_type',
			label: FIELD_LABELS.PAYMENT.payment_type,
			type: FIELD_TYPES.SELECT,
			options: typeOptions,
			formatter: (value) => ENUM_LABELS.PAYMENT_TYPE[value] || value,
		},
		paymentStatus: {
			key: 'paymentStatus',
			apiKey: 'payment_status',
			label: FIELD_LABELS.PAYMENT.payment_status,
			type: FIELD_TYPES.SELECT,
			options: statusOptions,
			formatter: (value) => ENUM_LABELS.PAYMENT_STATUS[value] || value,
		},
		providerPaymentId: {
			key: 'providerPaymentId',
			apiKey: 'provider_payment_id',
			label: FIELD_LABELS.PAYMENT.provider_payment_id,
			type: FIELD_TYPES.TEXT,
			excludeFromTable: true,
		},
		confirmationToken: {
			key: 'confirmationToken',
			apiKey: 'confirmation_token',
			label: FIELD_LABELS.PAYMENT.confirmation_token,
			type: FIELD_TYPES.TEXT,
			excludeFromTable: true,
		},
		amount: {
			key: 'amount',
			apiKey: 'amount',
			label: FIELD_LABELS.PAYMENT.amount,
			type: FIELD_TYPES.NUMBER,
			float: true,
			formatter: (value) => (value != null ? formatNumber(value) : ''),
			inputProps: { min: 0, step: 0.01 },
		},
		currency: {
			key: 'currency',
			apiKey: 'currency',
			label: FIELD_LABELS.PAYMENT.currency,
			type: FIELD_TYPES.SELECT,
			options: currencyOptions,
			defaultValue: currencyOptions[0]?.value,
			formatter: (value) => ENUM_LABELS.CURRENCY[value] || value,
		},
		expiresAt: {
			key: 'expiresAt',
			apiKey: 'expires_at',
			label: FIELD_LABELS.PAYMENT.expires_at,
			type: FIELD_TYPES.DATE,
			formatter: (value) => formatDate(value),
			excludeFromTable: true,
		},
		paidAt: {
			key: 'paidAt',
			apiKey: 'paid_at',
			label: FIELD_LABELS.PAYMENT.paid_at,
			type: FIELD_TYPES.DATE,
			formatter: (value) => formatDate(value),
			excludeFromTable: true,
		},
		isPaid: {
			key: 'isPaid',
			apiKey: 'is_paid',
			label: FIELD_LABELS.PAYMENT.is_paid,
			type: FIELD_TYPES.BOOLEAN,
			formatter: (value) => ENUM_LABELS.BOOLEAN[value] || value,
		},
	};

	const adminManager = createAdminManager(FIELDS, {
		addButtonText: () => UI_LABELS.ADMIN.modules.payments.add_button,
		editButtonText: () => UI_LABELS.ADMIN.modules.payments.edit_button,
	});

	const handleAddPayment = (data) => dispatch(createPayment(adminManager.toApiFormat(data))).unwrap();
	const handleEditPayment = (data) => dispatch(updatePayment(adminManager.toApiFormat(data))).unwrap();
	const handleDeletePayment = (id) => dispatch(deletePayment(id)).unwrap();

	const handleDeleteAllPayments = async () => {
		await dispatch(deleteAllPayments()).unwrap();
		dispatch(fetchPayments());
	};

	const formattedPayments = payments.map(adminManager.toUiFormat);

	return (
		<AdminDataTable
			title={UI_LABELS.ADMIN.modules.payments.management}
			data={formattedPayments}
			columns={adminManager.columns}
			onAdd={handleAddPayment}
			onEdit={handleEditPayment}
			onDelete={handleDeletePayment}
			onDeleteAll={handleDeleteAllPayments}
			renderForm={adminManager.renderForm}
			addButtonText={UI_LABELS.ADMIN.modules.payments.add_button}
			isLoading={isLoading}
			error={errors}
		/>
	);
};

export default PaymentManagement;
