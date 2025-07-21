import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Dialog, DialogContent } from '@mui/material';

import { createFlightTariff, updateFlightTariff, fetchFlightTariff } from '../../redux/actions/flightTariff';
import { fetchTariffs } from '../../redux/actions/tariff';
import { FIELD_LABELS, UI_LABELS, VALIDATION_MESSAGES, ENUM_LABELS, getEnumOptions } from '../../constants';
import { FIELD_TYPES, createAdminManager } from './utils';

export const FlightTariffManagement = ({ flightId, tariffDialogOpen, onClose, action = 'add', flightTariffId }) => {
	const dispatch = useDispatch();
	const { tariffs } = useSelector((state) => state.tariffs);
	const { flightTariff, isLoading } = useSelector((state) => state.flightTariffs);

	const [formData, setFormData] = useState({});

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
	}, [isEditing, flightTariffId, dispatch]);

	const seatClassOptions = useMemo(() => getEnumOptions('SEAT_CLASS'), []);

	const tariffOptions = useMemo(() => {
		return tariffs
			.filter((t) => t.seat_class === formData.seatClass)
			.map((t) => ({
				value: t.id,
				label: `${ENUM_LABELS.SEAT_CLASS[t.seat_class]} - ${UI_LABELS.ADMIN.modules.tariffs.tariff} ${
					t.order_number
				} (${t.price} ${ENUM_LABELS.CURRENCY[t.currency]})`,
			}));
	}, [tariffs, formData.seatClass]);

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
			validate: (value) => (!value ? UI_LABELS.MESSAGES.required_field : null),
		},
	};

	const tariffManager = useMemo(
		() =>
			createAdminManager(FIELDS, {
				addButtonText: () => UI_LABELS.ADMIN.modules.tariffs.add_button,
				editButtonText: () => UI_LABELS.ADMIN.modules.tariffs.edit_button,
			}),
		[FIELDS]
	);

	const currentItem = useMemo(() => {
		if (isEditing) return flightTariff ? tariffManager.toUiFormat(flightTariff) : null;
		return { flightId };
	}, [isEditing, flightTariff, tariffManager, flightId]);

	useEffect(() => {
		if (isEditing && flightTariffId) {
			dispatch(fetchFlightTariff(flightTariffId));
		}
	}, [isEditing, flightTariffId, dispatch]);

	useEffect(() => {
		if (tariffDialogOpen) {
			if (isEditing && flightTariff) {
				setFormData(tariffManager.toUiFormat(flightTariff));
			} else if (!isEditing) {
				setFormData({
					flightId,
					seatClass: '',
					seatsNumber: 0,
					flightTariffId: '',
				});
			}
		}
	}, [tariffDialogOpen, isEditing, flightTariff, flightId, tariffManager]);

	const handleSaveTariff = async (tariffData) => {
		const formattedData = tariffManager.toApiFormat({
			...tariffData,
			flightId,
		});

		try {
			await dispatch(isEditing ? updateFlightTariff(formattedData) : createFlightTariff(formattedData)).unwrap();
			onClose();
		} catch (error) {
			throw error;
		}
	};

	const handleChange = (field, value) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	if (isEditing && isLoading && !flightTariff) {
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
				})}
			</DialogContent>
		</Dialog>
	);
};

export default FlightTariffManagement;
