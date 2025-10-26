import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Typography, Dialog, DialogContent, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { createFlightTariff, updateFlightTariff, fetchFlightTariff } from '../../redux/actions/flightTariff';
import { fetchTariffs } from '../../redux/actions/tariff';
import { FIELD_LABELS, UI_LABELS, VALIDATION_MESSAGES, ENUM_LABELS, getEnumOptions } from '../../constants';
import { createAdminManager } from './utils';
import { FIELD_TYPES, formatNumber } from '../utils';

export const FlightTariffManagement = ({ flightId, tariffDialogOpen, onClose, action = 'add', flightTariffId }) => {
	const dispatch = useDispatch();
	const { tariffs, isLoading: isLoadingTariffs } = useSelector((state) => state.tariffs);
	const { flightTariff, isLoading: isLoadingFlightTariff } = useSelector((state) => state.flightTariffs);
	const theme = useTheme();
	const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

	const [seatClass, setSeatClass] = useState('');
	const [formUpdates, setFormUpdates] = useState({});

	const isEditing = action === 'edit';
	const baseTakenSeats = isEditing && flightTariff ? Number(flightTariff.taken_seats || 0) : 0;
	const [effectiveTakenSeats, setEffectiveTakenSeats] = useState(baseTakenSeats);

	useEffect(() => {
		setEffectiveTakenSeats(baseTakenSeats);
	}, [baseTakenSeats]);

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

	const tariffOptions =
		isLoadingTariffs || !Array.isArray(tariffs)
			? []
			: tariffs
					.filter((t) => t.seat_class === seatClass)
					.map((t) => ({
						value: t.id,
						label: `${ENUM_LABELS.SEAT_CLASS[t.seat_class]} - ${UI_LABELS.ADMIN.modules.tariffs.tariff} ${
							t.order_number
						} - ${t.title} (${formatNumber(t.price)} ${ENUM_LABELS.CURRENCY[t.currency]})`,
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
			fullWidth: true,
			validate: (value) => (!value ? VALIDATION_MESSAGES.TARIFF.seat_class.REQUIRED : null),
		},
		availableSeats: {
			key: 'availableSeats',
			label: FIELD_LABELS.FLIGHT_TARIFF.available_seats,
			type: FIELD_TYPES.NUMBER,
			inputProps: { min: 0, step: 1 },
			defaultValue: 0,
			validate: (value) =>
				value === '' || value === null || value === undefined
					? VALIDATION_MESSAGES.TARIFF.available_seats.REQUIRED
					: null,
		},
		totalSeats: {
			key: 'totalSeats',
			apiKey: 'seats_number',
			label: FIELD_LABELS.FLIGHT_TARIFF.seats_number,
			type: FIELD_TYPES.NUMBER,
			inputProps: { min: 0, step: 1, readOnly: true },
			defaultValue: 0,
			disabled: true,
			toApi: (value) => Number(value ?? 0),
			toUi: (value) => Number(value ?? 0),
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

				const seatsNumber = Number(flightTariff.seats_number || 0);
				const seatsAvailable = Number(
					flightTariff.available_seats ?? Math.max(seatsNumber - baseTakenSeats, 0)
				);

				return {
					id: flightTariffId,
					flightId: flightId,
					seatClass: seatClass || originalSeatClass,
					availableSeats: seatsAvailable,
					totalSeats: seatsNumber,
					flightTariffId: seatClass && seatClass !== originalSeatClass ? '' : flightTariff.tariff_id,
				};
			}
		}
		return {
			flightId,
			seatClass,
			availableSeats: 0,
			totalSeats: 0,
			flightTariffId: '',
		};
	})();

	const handleSaveTariff = (tariffData) => {
		const availableSeats = Math.max(Number(tariffData[FIELDS.availableSeats.key] ?? 0) || 0, 0);
		const totalSeats = Math.max(Number(tariffData[FIELDS.totalSeats.key] ?? 0) || 0, 0);

		const payload = {
			...tariffData,
			[FIELDS.availableSeats.key]: availableSeats,
			[FIELDS.totalSeats.key]: totalSeats,
			takenSeats: effectiveTakenSeats,
			flightId,
		};

		const formattedData = tariffManager.toApiFormat(payload);
		formattedData.available_seats = availableSeats;

		return dispatch(isEditing ? updateFlightTariff(formattedData) : createFlightTariff(formattedData)).unwrap();
	};

	const handleChange = (field, value) => {
		if (field === FIELDS.seatClass.key && value !== seatClass) {
			setSeatClass(value);
			setEffectiveTakenSeats(0);
			setFormUpdates({
				flightTariffId: '',
				[FIELDS.availableSeats.key]: 0,
				[FIELDS.totalSeats.key]: 0,
			});
			return;
		}

		if (field === FIELDS.availableSeats.key) {
			const numericValue =
				value === '' || value === null || value === undefined ? '' : Math.max(Number(value), 0);
			if (numericValue === '') {
				setFormUpdates((prev) => ({ ...prev, [FIELDS.totalSeats.key]: effectiveTakenSeats }));
			} else {
				const total = numericValue + effectiveTakenSeats;
				setFormUpdates((prev) => ({ ...prev, [FIELDS.totalSeats.key]: total }));
			}
		}
	};

	if (isEditing && (isLoadingFlightTariff || isLoadingTariffs || !seatClass)) {
		return (
			<Dialog open={tariffDialogOpen} onClose={onClose} maxWidth='sm' fullWidth fullScreen={fullScreen}>
				<DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
					<Typography>{UI_LABELS.MESSAGES.loading}</Typography>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog open={tariffDialogOpen} onClose={onClose} maxWidth='md' fullWidth fullScreen={fullScreen}>
			<DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
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
