import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DialogTitle, DialogContent } from '@mui/material';

import AdminDataTable from '../../components/admin/AdminDataTable';

import {
	createTariff,
	updateTariff,
	deleteTariff,
} from '../../redux/actions/tariff';
import { FIELD_TYPES, createAdminManager } from './utils';
import {
	FIELD_LABELS,
	UI_LABELS,
	VALIDATION_MESSAGES,
	getEnumOptions,
} from '../../constants';

export const TariffManagement = ({ flight, onClose }) => {
	const dispatch = useDispatch();
	const { tariffs, isLoading: tariffsLoading } = useSelector(
		(state) => state.tariffs
	);
	const flightTariffs = tariffs.filter(
		(tariff) => tariff.flight_id === flight.id
	);

	const TARIFF_FIELDS = {
		id: { key: 'id', apiKey: 'id' },
		flightId: {
			key: 'flightId',
			apiKey: 'flight_id',
			excludeFromForm: true,
		},
		seatClass: {
			key: 'seatClass',
			apiKey: 'seat_class',
			label: FIELD_LABELS.TARIFF.seat_class,
			type: FIELD_TYPES.SELECT,
			options: getEnumOptions('SEAT_CLASS'),
			validate: (value) =>
				!value ? VALIDATION_MESSAGES.TARIFF.seat_class.REQUIRED : null,
		},
		seatsNumber: {
			key: 'seatsNumber',
			apiKey: 'seats_number',
			label: FIELD_LABELS.TARIFF.seats_number,
			type: FIELD_TYPES.NUMBER,
			validate: (value) => {
				if (value === null || value === undefined || value === '') {
					return VALIDATION_MESSAGES.TARIFF.seats_number.REQUIRED;
				}
				if (value <= 0) {
					return VALIDATION_MESSAGES.TARIFF.seats_number.POSITIVE;
				}
				return null;
			},
		},
		currency: {
			key: 'currency',
			apiKey: 'currency',
			label: FIELD_LABELS.TARIFF.currency,
			type: FIELD_TYPES.SELECT,
			options: getEnumOptions('CURRENCY'),
			validate: (value) =>
				!value ? VALIDATION_MESSAGES.TARIFF.currency.REQUIRED : null,
		},
		price: {
			key: 'price',
			apiKey: 'price',
			label: FIELD_LABELS.TARIFF.price,
			type: FIELD_TYPES.NUMBER,
			float: true,
			inputProps: {
				min: 0,
				step: 0.01,
			},
			validate: (value) => {
				if (value === null || value === undefined || value === '') {
					return VALIDATION_MESSAGES.TARIFF.price.REQUIRED;
				}
				return null;
			},
		},
	};

	const tariffManager = useMemo(
		() =>
			createAdminManager(TARIFF_FIELDS, {
				addButtonText: UI_LABELS.ADMIN.modules.tariffs.add_button,
				editButtonText: UI_LABELS.ADMIN.modules.tariffs.edit_button,
			}),
		[TARIFF_FIELDS]
	);

	const handleAddTariff = (tariffData) => {
		// Set flight_id to current flight
		const newTariff = {
			...tariffData,
			flightId: flight.id,
		};
		dispatch(createTariff(tariffManager.toApiFormat(newTariff)));
	};

	const handleEditTariff = (tariffData) => {
		dispatch(updateTariff(tariffManager.toApiFormat(tariffData)));
	};

	const handleDeleteTariff = (id) => {
		return dispatch(deleteTariff(id));
	};

	const formattedTariffs = flightTariffs.map(tariffManager.toUiFormat);

	return (
		<>
			<DialogTitle>
				{UI_LABELS.ADMIN.modules.tariffs.management_for_flight}{' '}
				{flight.id}
			</DialogTitle>
			<DialogContent>
				<AdminDataTable
					data={formattedTariffs}
					columns={tariffManager.columns}
					onAdd={handleAddTariff}
					onEdit={handleEditTariff}
					onDelete={handleDeleteTariff}
					renderForm={tariffManager.renderForm}
					addButtonText={UI_LABELS.ADMIN.modules.tariffs.add_button}
					isLoading={tariffsLoading}
					error={null}
					hideTitle
				/>
			</DialogContent>
		</>
	);
};

export default TariffManagement;
