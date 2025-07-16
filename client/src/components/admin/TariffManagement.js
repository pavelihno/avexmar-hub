import React, { useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Dialog, DialogContent, Typography } from '@mui/material';

import {
	createTariff,
	updateTariff,
	fetchTariff,
} from '../../redux/actions/tariff';
import { FIELD_TYPES, createAdminManager } from './utils';
import {
	FIELD_LABELS,
	UI_LABELS,
	VALIDATION_MESSAGES,
	getEnumOptions,
} from '../../constants';

export const TariffManagement = ({
	flightId,
	tariffDialogOpen,
	onClose,
	action = 'add',
	tariffId,
}) => {
	const dispatch = useDispatch();
	const { tariff, isLoading } = useSelector((state) => state.tariffs);

	const isEditing = action === 'edit';

	const FIELDS = useMemo(
		() => ({
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
					!value
						? VALIDATION_MESSAGES.TARIFF.seat_class.REQUIRED
						: null,
			},
			seatsNumber: {
				key: 'seatsNumber',
				apiKey: 'seats_number',
				label: FIELD_LABELS.TARIFF.seats_number,
				type: FIELD_TYPES.NUMBER,
				inputProps: { min: 0, step: 1 },
				validate: (value) =>
					value === null || value === undefined || value === ''
						? VALIDATION_MESSAGES.TARIFF.seats_number.REQUIRED
						: null,
			},
			currency: {
				key: 'currency',
				apiKey: 'currency',
				label: FIELD_LABELS.TARIFF.currency,
				type: FIELD_TYPES.SELECT,
				options: getEnumOptions('CURRENCY'),
				validate: (value) =>
					!value
						? VALIDATION_MESSAGES.TARIFF.currency.REQUIRED
						: null,
			},
			price: {
				key: 'price',
				apiKey: 'price',
				label: FIELD_LABELS.TARIFF.price,
				type: FIELD_TYPES.NUMBER,
				float: true,
				inputProps: { min: 0, step: 0.01 },
				validate: (value) =>
					value === null || value === undefined || value === ''
						? VALIDATION_MESSAGES.TARIFF.price.REQUIRED
						: null,
			},
		}),
		[]
	);

	const tariffManager = useMemo(
		() =>
			createAdminManager(FIELDS, {
				addButtonText: UI_LABELS.ADMIN.modules.tariffs.add_button,
				editButtonText: UI_LABELS.ADMIN.modules.tariffs.edit_button,
			}),
		[FIELDS]
	);

	const currentItem = useMemo(() => {
		if (isEditing) return tariff ? tariffManager.toUiFormat(tariff) : null;
		return { flightId };
	}, [isEditing, tariff, tariffManager, flightId]);

	useEffect(() => {
		if (isEditing && tariffId) {
			dispatch(fetchTariff(tariffId));
		}
	}, [isEditing, tariffId, dispatch]);

        const handleSaveTariff = async (tariffData) => {
                const formattedData = tariffManager.toApiFormat({
                        ...tariffData,
                        flightId,
                });

                try {
                        await dispatch(
                                isEditing
                                        ? updateTariff(formattedData)
                                        : createTariff(formattedData)
                        ).unwrap();
                        onClose();
                } catch (error) {
                        throw error;
                }
        };

	if (isEditing && isLoading) {
		return (
			<Dialog
				open={tariffDialogOpen}
				onClose={onClose}
				maxWidth='md'
				fullWidth
			>
				<DialogContent>
					<Typography>{UI_LABELS.MESSAGES.loading}</Typography>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog
			open={tariffDialogOpen}
			onClose={onClose}
			maxWidth='md'
			fullWidth
		>
			<DialogContent>
				{tariffManager.renderForm({
					isEditing,
					currentItem,
					onClose,
					onSave: handleSaveTariff,
				})}
			</DialogContent>
		</Dialog>
	);
};

export default TariffManagement;
