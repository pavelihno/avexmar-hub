import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Typography, Dialog, DialogContent } from '@mui/material';

import { createFlightTariff, updateFlightTariff, fetchFlightTariff } from '../../redux/actions/flightTariff';
import { fetchTariffs } from '../../redux/actions/tariff';
import { FIELD_LABELS, UI_LABELS, VALIDATION_MESSAGES, ENUM_LABELS, getEnumOptions } from '../../constants';
import { createAdminManager } from './utils';
import { FIELD_TYPES, formatNumber } from '../utils';

export const FlightTariffManagement = ({ flightId, tariffDialogOpen, onClose, action = 'add', flightTariffId }) => {
	const dispatch = useDispatch();
	const { tariffs, isLoading: isLoadingTariffs } = useSelector((state) => state.tariffs);
	const { flightTariff, isLoading: isLoadingFlightTariff } = useSelector((state) => state.flightTariffs);

	const [seatClass, setSeatClass] = useState('');
	const [formUpdates, setFormUpdates] = useState({});

	const isEditing = action === 'edit';

	useEffect(() => {
		if (!tariffs || tariffs.length === 0) {
			dispatch(fetchTariffs());
		}
	}, [dispatch, tariffs]);

	useEffect(() => {
		if (isEditing && flightTariffId) {
			dispatch(fetchFlightTariff(flightTariffId));
		}
	}, [dispatch, isEditing, flightTariffId]);

	useEffect(() => {
		if (isEditing && flightTariff && Array.isArray(tariffs) && tariffs.length > 0) {
			const tariff = tariffs.find((t) => t.id === flightTariff.tariff_id);
			if (tariff) {
				setSeatClass(tariff.seat_class);
			}
		} else if (!isEditing) {
			setSeatClass('');
		}
	}, [isEditing, flightTariff, tariffs]);

	useEffect(() => {
		if (Object.keys(formUpdates).length > 0) {
			setFormUpdates({});
		}
	}, [formUpdates]);

        const seatClassOptions = getEnumOptions('SEAT_CLASS');

        const tariffOptions = tariffs
                .filter((t) => t.seat_class === seatClass)
                .map((t) => ({
                        value: t.id,
                        label: `${ENUM_LABELS.SEAT_CLASS[t.seat_class]} - ${UI_LABELS.ADMIN.modules.tariffs.tariff} ${t.order_number} (${formatNumber(t.price)} ${ENUM_LABELS.CURRENCY[t.currency]})`,
                }));

	const FIELDS = {
		id: { key: 'id', apiKey: 'id' },
		flightId: { key: 'flightId', apiKey: 'flight_id', excludeFromForm: true },
		seatClass: {
			key: 'seatClass',
			apiKey: 'seat_class',
			label: FIELD_LABELS.TARIFF.seat_class,
			type: FIELD_TYPES.SELECT,
			options: seatClassOptions,
			validate: (value) => (!value ? VALIDATION_MESSAGES.TARIFF.seat_class.REQUIRED : null),
		},
		seatsNumber: {
			key: 'seatsNumber',
			apiKey: 'seats_number',
			label: FIELD_LABELS.FLIGHT_TARIFF.seats_number,
			type: FIELD_TYPES.NUMBER,
			inputProps: { min: 0, step: 1 },
			validate: (value) =>
				value === '' || value === null || value === undefined
					? VALIDATION_MESSAGES.TARIFF.seats_number.REQUIRED
					: null,
		},
		flightTariffId: {
			key: 'flightTariffId',
			apiKey: 'tariff_id',
			label: FIELD_LABELS.FLIGHT_TARIFF.tariff_id,
			type: FIELD_TYPES.SELECT,
			options: tariffOptions,
			fullWidth: true,
			validate: (value) => (!value ? VALIDATION_MESSAGES.TARIFF.tariff.REQUIRED : null),
		},
	};

        const tariffManager = createAdminManager(FIELDS, {
                addButtonText: () => UI_LABELS.ADMIN.modules.tariffs.add_button,
                editButtonText: () => UI_LABELS.ADMIN.modules.tariffs.edit_button,
        });

        const currentItem = (() => {
                if (isEditing) {
                        if (flightTariff && Array.isArray(tariffs) && tariffs.length > 0) {
                                const tariff = tariffs.find((t) => t.id === flightTariff.tariff_id);
                                const originalSeatClass = tariff ? tariff.seat_class : '';
                                return {
                                        id: flightTariffId,
                                        flightId: flightId,
                                        seatClass: seatClass || originalSeatClass,
                                        seatsNumber: flightTariff.seats_number,
                                        flightTariffId: seatClass && seatClass !== originalSeatClass ? '' : flightTariff.tariff_id,
                                };
                        }
                }
                return { flightId, seatClass, seatsNumber: 0, flightTariffId: '' };
        })();

	const handleSaveTariff = (tariffData) => {
		const formattedData = tariffManager.toApiFormat({
			...tariffData,
			flightId,
		});

		return dispatch(isEditing ? updateFlightTariff(formattedData) : createFlightTariff(formattedData)).unwrap();
	};

	const handleChange = (field, value) => {
		if (field === FIELDS.seatClass.key && value !== seatClass) {
			setSeatClass(value);
			setFormUpdates({ flightTariffId: '' });
		}
	};

	if (isEditing && (isLoadingFlightTariff || isLoadingTariffs || !seatClass)) {
		return (
			<Dialog open={tariffDialogOpen} onClose={onClose} maxWidth='sm' fullWidth>
				<DialogContent>
					<Typography>{UI_LABELS.MESSAGES.loading}</Typography>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog open={tariffDialogOpen} onClose={onClose} maxWidth='md' fullWidth>
			<DialogContent>
				{tariffManager.renderForm({
					isEditing,
					currentItem,
					onSave: handleSaveTariff,
					onChange: handleChange,
					onClose,
					externalUpdates: formUpdates,
				})}
			</DialogContent>
		</Dialog>
	);
};

export default FlightTariffManagement;
