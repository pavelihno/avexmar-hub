import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import AdminDataTable from './AdminDataTable';

import {
	fetchTariffs,
	createTariff,
	updateTariff,
	deleteTariff,
	deleteAllTariffs,
	deleteFilteredTariffs,
} from '../../../redux/actions/tariff';
import { fetchFees } from '../../../redux/actions/fee';
import { createAdminManager } from '../utils';
import { FIELD_TYPES, formatNumber } from '../../utils';
import { ENUM_LABELS, FIELD_LABELS, UI_LABELS, VALIDATION_MESSAGES, getEnumOptions } from '../../../constants';

const TariffManagement = () => {
	const dispatch = useDispatch();
	const { tariffs, isLoading, errors } = useSelector((state) => state.tariffs);
	const { fees, isLoading: feesLoading } = useSelector((state) => state.fees);

	useEffect(() => {
		dispatch(fetchTariffs());
		dispatch(fetchFees());
	}, [dispatch]);

	const seatClassOptions = getEnumOptions('SEAT_CLASS');
	const currencyOptions = getEnumOptions('CURRENCY');

	const feeOptions =
		feesLoading || !Array.isArray(fees)
			? []
			: fees
					.filter((f) => f.application === 'ticket_return')
					.map((f) => ({
						value: f.id,
						label: `${ENUM_LABELS.FEE_APPLICATION[f.application]} - ${f.name} - ${f.amount}`,
					}));

	const FIELDS = {
		id: { key: 'id', apiKey: 'id' },
		seatClass: {
			key: 'seatClass',
			apiKey: 'seat_class',
			label: FIELD_LABELS.TARIFF.seat_class,
			type: FIELD_TYPES.SELECT,
			options: seatClassOptions,
			formatter: (value) => ENUM_LABELS.SEAT_CLASS[value] || value,
			validate: (value) => (!value ? VALIDATION_MESSAGES.TARIFF.seat_class.REQUIRED : null),
		},
		orderNumber: {
			key: 'orderNumber',
			apiKey: 'order_number',
			label: FIELD_LABELS.TARIFF.order_number,
			type: FIELD_TYPES.NUMBER,
			excludeFromForm: true,
		},
		title: {
			key: 'title',
			apiKey: 'title',
			label: FIELD_LABELS.TARIFF.title,
			type: FIELD_TYPES.TEXT,
			validate: (value) => (!value ? VALIDATION_MESSAGES.TARIFF.title.REQUIRED : null),
		},
		price: {
			key: 'price',
			apiKey: 'price',
			label: FIELD_LABELS.TARIFF.price,
			type: FIELD_TYPES.NUMBER,
			float: true,
			validate: (value) => (value == null ? VALIDATION_MESSAGES.TARIFF.price.REQUIRED : null),
			formatter: (value) => (value != null ? `${formatNumber(value)}` : ''),
		},
		currency: {
			key: 'currency',
			apiKey: 'currency',
			label: FIELD_LABELS.TARIFF.currency,
			type: FIELD_TYPES.SELECT,
			options: currencyOptions,
			defaultValue: currencyOptions[0].value,
			formatter: (value) => ENUM_LABELS.CURRENCY[value] || value,
			validate: (value) => (!value ? VALIDATION_MESSAGES.TARIFF.currency.REQUIRED : null),
		},
		baggage: {
			key: 'baggage',
			apiKey: 'baggage',
			label: FIELD_LABELS.TARIFF.baggage,
			type: FIELD_TYPES.NUMBER,
			defaultValue: 0,
			validate: (value) => {
				if (value === null || value === '' || value === undefined) {
					return VALIDATION_MESSAGES.TARIFF.baggage.REQUIRED;
				}
				return null;
			},
		},
		handLuggage: {
			key: 'handLuggage',
			apiKey: 'hand_luggage',
			label: FIELD_LABELS.TARIFF.hand_luggage,
			type: FIELD_TYPES.NUMBER,
			defaultValue: 0,
			validate: (value) => {
				if (value === null || value === '' || value === undefined) {
					return VALIDATION_MESSAGES.TARIFF.hand_luggage.REQUIRED;
				}
				return null;
			},
		},
		feeIds: {
			key: 'feeIds',
			apiKey: 'fee_ids',
			label: FIELD_LABELS.TARIFF.fee_ids,
			type: FIELD_TYPES.MULTI_SELECT,
			options: feeOptions,
			fullWidth: true,
			excludeFromTable: true,
			formatter: (values) => {
				if (!values || !Array.isArray(values)) return UI_LABELS.ADMIN.modules.tariffs.not_specified;
				const labels = values.map((value) => {
					const opt = feeOptions.find((o) => o.value === value);
					return opt ? opt.label : value;
				});
				return labels.length > 0 ? labels.join(', ') : UI_LABELS.ADMIN.modules.tariffs.not_specified;
			},
		},
		refundAllowed: {
			key: 'refundAllowed',
			apiKey: 'refund_allowed',
			label: FIELD_LABELS.TARIFF.refund_allowed,
			type: FIELD_TYPES.BOOLEAN,
			defaultValue: false,
			formatter: (value) => ENUM_LABELS.BOOLEAN[value ? 'true' : 'false'],
		},
		conditions: {
			key: 'conditions',
			apiKey: 'conditions',
			label: FIELD_LABELS.TARIFF.conditions,
			type: FIELD_TYPES.TEXT_AREA,
			fullWidth: true,
			excludeFromTable: true,
		},
	};

	const adminManager = createAdminManager(FIELDS, {
		addButtonText: (item) => UI_LABELS.ADMIN.modules.tariffs.add_button,
		editButtonText: (item) => {
			if (!item) return UI_LABELS.ADMIN.modules.tariffs.edit_button;
			else {
				const seatClass = ENUM_LABELS.SEAT_CLASS[item[FIELDS.seatClass.key]];
				const orderNumber = item[FIELDS.orderNumber.key];
				const title = item[FIELDS.title.key];

				return `${UI_LABELS.BUTTONS.edit}: ${seatClass} — ${UI_LABELS.ADMIN.modules.tariffs.tariff} ${orderNumber} — ${title}`;
			}
		},
	});

	const handleAddTariff = (tariffData) => dispatch(createTariff(adminManager.toApiFormat(tariffData))).unwrap();
	const handleEditTariff = (tariffData) => dispatch(updateTariff(adminManager.toApiFormat(tariffData))).unwrap();
	const handleDeleteTariff = (id) => dispatch(deleteTariff(id)).unwrap();

	const handleDeleteAllTariffs = async () => {
		await dispatch(deleteAllTariffs()).unwrap();
		dispatch(fetchTariffs());
	};
	const handleDeleteFilteredTariffs = async (ids) => {
		if (!ids?.length) return;
		await dispatch(deleteFilteredTariffs(ids)).unwrap();
		dispatch(fetchTariffs());
	};

	const formattedTariffs = tariffs.map(adminManager.toUiFormat);

	return (
		<AdminDataTable
			title={UI_LABELS.ADMIN.modules.tariffs.management}
			data={formattedTariffs}
			columns={adminManager.columns}
			onAdd={handleAddTariff}
			onEdit={handleEditTariff}
			onDelete={handleDeleteTariff}
			onDeleteAll={handleDeleteAllTariffs}
			onDeleteFiltered={handleDeleteFilteredTariffs}
			renderForm={adminManager.renderForm}
			addButtonText={UI_LABELS.ADMIN.modules.tariffs.add_button}
			isLoading={isLoading}
			error={errors}
		/>
	);
};

export default TariffManagement;
