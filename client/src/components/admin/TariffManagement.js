import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import AdminDataTable from '../../components/admin/AdminDataTable';

import { fetchTariffs, createTariff, updateTariff, deleteTariff, deleteAllTariffs } from '../../redux/actions/tariff';
import { FIELD_TYPES, createAdminManager } from './utils';
import { ENUM_LABELS, FIELD_LABELS, UI_LABELS, VALIDATION_MESSAGES, getEnumOptions } from '../../constants';

const TariffManagement = () => {
	const dispatch = useDispatch();
	const { tariffs, isLoading, errors } = useSelector((state) => state.tariffs);

	useEffect(() => {
		dispatch(fetchTariffs());
	}, [dispatch]);

	const seatClassOptions = useMemo(() => getEnumOptions('SEAT_CLASS'), []);
	const currencyOptions = useMemo(() => getEnumOptions('CURRENCY'), []);

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
			formatter: (value) => `${UI_LABELS.ADMIN.modules.tariffs.tariff} ${value}` || '',
		},
		price: {
			key: 'price',
			apiKey: 'price',
			label: FIELD_LABELS.TARIFF.price,
			type: FIELD_TYPES.NUMBER,
			validate: (value) => (value == null ? VALIDATION_MESSAGES.TARIFF.price.REQUIRED : null),
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
	};

	const adminManager = useMemo(
		() =>
			createAdminManager(FIELDS, {
				addButtonText: (item) => UI_LABELS.ADMIN.modules.tariffs.add_button,
				editButtonText: (item) => {
					if (!item) return UI_LABELS.ADMIN.modules.tariffs.edit_button;
					else {
						const seatClass = ENUM_LABELS.SEAT_CLASS[item[FIELDS.seatClass.key]];
						const orderNumber = item[FIELDS.orderNumber.key];

						return `${UI_LABELS.BUTTONS.edit}: ${seatClass} — ${UI_LABELS.ADMIN.modules.tariffs.tariff} ${orderNumber}`;
					}
				},
			}),
		[FIELDS, tariffs]
	);

	const handleAddTariff = (tariffData) => dispatch(createTariff(adminManager.toApiFormat(tariffData))).unwrap();
	const handleEditTariff = (tariffData) => dispatch(updateTariff(adminManager.toApiFormat(tariffData))).unwrap();
	const handleDeleteTariff = (id) => dispatch(deleteTariff(id)).unwrap();

	const handleDeleteAllTariffs = async () => {
		await dispatch(deleteAllTariffs()).unwrap();
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
			renderForm={adminManager.renderForm}
			addButtonText={UI_LABELS.ADMIN.modules.tariffs.add_button}
			isLoading={isLoading}
			error={errors}
		/>
	);
};

export default TariffManagement;
