import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import AdminDataTable from './AdminDataTable';
import {
	fetchAircrafts,
	createAircraft,
	updateAircraft,
	deleteAircraft,
	deleteAllAircrafts,
	deleteFilteredAircrafts,
} from '../../../redux/actions/aircraft';
import { createAdminManager } from '../utils';
import { FIELD_TYPES } from '../../utils';
import { FIELD_LABELS, UI_LABELS, VALIDATION_MESSAGES } from '../../../constants';

const AircraftManagement = () => {
	const dispatch = useDispatch();
	const { aircrafts, isLoading, errors } = useSelector((state) => state.aircrafts);

	useEffect(() => {
		dispatch(fetchAircrafts());
	}, [dispatch]);

	const FIELDS = {
		id: { key: 'id', apiKey: 'id' },
		type: {
			key: 'type',
			apiKey: 'type',
			label: FIELD_LABELS.AIRCRAFT.type,
			type: FIELD_TYPES.TEXT,
			fullWidth: true,
			validate: (value) => (!value ? VALIDATION_MESSAGES.AIRCRAFT.type.REQUIRED : null),
		},
		economySeats: {
			key: 'economySeats',
			apiKey: 'economy_seats',
			label: FIELD_LABELS.AIRCRAFT.economy_seats,
			type: FIELD_TYPES.NUMBER,
			inputProps: { min: 0, step: 1 },
			defaultValue: 0,
			toApi: (value) => {
				if (value === '' || value === null || value === undefined) return 0;
				return Number(value);
			},
			toUi: (value) => Number(value ?? 0),
			validate: (value) => {
				if (value === '' || value === null || value === undefined) {
					return VALIDATION_MESSAGES.AIRCRAFT.economy_seats.REQUIRED;
				}
				const numericValue = Number(value);
				if (Number.isNaN(numericValue)) {
					return VALIDATION_MESSAGES.AIRCRAFT.economy_seats.INVALID;
				}
				if (numericValue < 0) {
					return VALIDATION_MESSAGES.AIRCRAFT.economy_seats.NON_NEGATIVE;
				}
				return null;
			},
		},
		businessSeats: {
			key: 'businessSeats',
			apiKey: 'business_seats',
			label: FIELD_LABELS.AIRCRAFT.business_seats,
			type: FIELD_TYPES.NUMBER,
			inputProps: { min: 0, step: 1 },
			defaultValue: 0,
			toApi: (value) => {
				if (value === '' || value === null || value === undefined) return 0;
				return Number(value);
			},
			toUi: (value) => Number(value ?? 0),
			validate: (value) => {
				if (value === '' || value === null || value === undefined) {
					return VALIDATION_MESSAGES.AIRCRAFT.business_seats.REQUIRED;
				}
				const numericValue = Number(value);
				if (Number.isNaN(numericValue)) {
					return VALIDATION_MESSAGES.AIRCRAFT.business_seats.INVALID;
				}
				if (numericValue < 0) {
					return VALIDATION_MESSAGES.AIRCRAFT.business_seats.NON_NEGATIVE;
				}
				return null;
			},
		},
	};

	const adminManager = createAdminManager(FIELDS, {
		addButtonText: (item) => UI_LABELS.ADMIN.modules.aircrafts.add_button,
		editButtonText: (item) => UI_LABELS.ADMIN.modules.aircrafts.edit_button,
	});

	const handleAddAircraft = (data) => dispatch(createAircraft(adminManager.toApiFormat(data))).unwrap();
	const handleEditAircraft = (data) => dispatch(updateAircraft(adminManager.toApiFormat(data))).unwrap();
	const handleDeleteAircraft = (id) => dispatch(deleteAircraft(id)).unwrap();

	const handleDeleteAllAircrafts = async () => {
		await dispatch(deleteAllAircrafts()).unwrap();
		dispatch(fetchAircrafts());
	};
	const handleDeleteFilteredAircrafts = async (ids) => {
		if (!ids?.length) return;
		await dispatch(deleteFilteredAircrafts(ids)).unwrap();
		dispatch(fetchAircrafts());
	};

	const formatted = aircrafts.map(adminManager.toUiFormat);

	return (
		<AdminDataTable
			title={UI_LABELS.ADMIN.modules.aircrafts.management}
			data={formatted}
			columns={adminManager.columns}
			onAdd={handleAddAircraft}
			onEdit={handleEditAircraft}
			onDelete={handleDeleteAircraft}
			onDeleteAll={handleDeleteAllAircrafts}
			onDeleteFiltered={handleDeleteFilteredAircrafts}
			renderForm={adminManager.renderForm}
			addButtonText={UI_LABELS.ADMIN.modules.aircrafts.add_button}
			isLoading={isLoading}
			error={errors}
		/>
	);
};

export default AircraftManagement;
