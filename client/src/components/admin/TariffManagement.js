import React, { useMemo, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Dialog, DialogContent, Typography } from '@mui/material';

import { createTariff, updateTariff } from '../../redux/actions/tariff';
import { FIELD_TYPES, createAdminManager } from './utils';
import {
	FIELD_LABELS,
	UI_LABELS,
	VALIDATION_MESSAGES,
	getEnumOptions,
} from '../../constants';

export const TariffManagement = ({
	flight,
	tariffDialogOpen,
	onClose,
	action = 'add',
	tariffId = null,
}) => {
	const dispatch = useDispatch();
	const { tariffs, isLoading } = useSelector((state) => state.tariffs);

	const [editingTariff, setEditingTariff] = useState(null);

	const FIELDS = {
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
			inputProps: {
				min: 0,
				max: 100,
				step: 0.01,
			},
			validate: (value) => {
				if (value === null || value === undefined || value === '') {
					return VALIDATION_MESSAGES.TARIFF.seats_number.REQUIRED;
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
			createAdminManager(FIELDS, {
				addButtonText: UI_LABELS.ADMIN.modules.tariffs.add_button,
				editButtonText: UI_LABELS.ADMIN.modules.tariffs.edit_button,
			}),
		[FIELDS, tariffs]
	);

	useEffect(() => {
		if (action === 'edit' && tariffId && !editingTariff) {
			const tariffToEdit = tariffs.find((t) => t.id === tariffId);
			if (tariffToEdit) {
				setEditingTariff(tariffManager.toUiFormat(tariffToEdit));
			}
		}
	}, [action, tariffId, tariffs, tariffManager, editingTariff]);

	const handleAddTariff = (tariffData) => {
		const newTariff = {
			...tariffData,
			flightId: flight.id,
		};
		dispatch(createTariff(tariffManager.toApiFormat(newTariff)));
		onClose();
	};

	const handleEditTariff = (tariffData) => {
		dispatch(updateTariff(tariffManager.toApiFormat(tariffData)));
		onClose();
	};

	if (!tariffManager) {
		return (
			<DialogContent>
				<Typography>{UI_LABELS.MESSAGES.loading}</Typography>
			</DialogContent>
		);
	}

	return (
		<>
			<Dialog
				open={tariffDialogOpen}
				onClose={onClose}
				maxWidth='md'
				fullWidth
			>
				<DialogContent>
					{action === 'add'
						? tariffManager.renderForm({
								isEditing: false,
								currentItem: { flightId: flight.id },
								onClose: onClose,
								onSave: handleAddTariff,
						  })
						: editingTariff &&
						  tariffManager.renderForm({
								isEditing: true,
								currentItem: editingTariff, // Ensure this is passed correctly
								onClose: onClose,
								onSave: handleEditTariff,
						  })}
				</DialogContent>
			</Dialog>
		</>
	);
};

export default TariffManagement;
