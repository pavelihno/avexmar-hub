import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import AdminDataTable from './AdminDataTable';

import {
	fetchFees,
	createFee,
	updateFee,
	deleteFee,
	deleteAllFees,
	deleteFilteredFees,
} from '../../../redux/actions/fee';
import { createAdminManager } from '../utils';
import { FIELD_TYPES, formatNumber } from '../../utils';
import { FIELD_LABELS, UI_LABELS, VALIDATION_MESSAGES, ENUM_LABELS, getEnumOptions } from '../../../constants';

const FeeManagement = () => {
	const dispatch = useDispatch();
	const { fees, isLoading, errors } = useSelector((state) => state.fees);

	useEffect(() => {
		dispatch(fetchFees());
	}, [dispatch]);

	const FIELDS = {
		id: { key: 'id', apiKey: 'id' },
		name: {
			key: 'name',
			apiKey: 'name',
			label: FIELD_LABELS.FEE.name,
			type: FIELD_TYPES.TEXT,
			validate: (value) => (!value ? VALIDATION_MESSAGES.FEE.name.REQUIRED : null),
		},
		amount: {
			key: 'amount',
			apiKey: 'amount',
			label: FIELD_LABELS.FEE.amount,
			type: FIELD_TYPES.NUMBER,
			float: true,
			formatter: (value) => (value != null ? formatNumber(value) : ''),
			validate: (value) => (value == null ? VALIDATION_MESSAGES.FEE.amount.REQUIRED : null),
		},
		application: {
			key: 'application',
			apiKey: 'application',
			label: FIELD_LABELS.FEE.application,
			type: FIELD_TYPES.SELECT,
			options: getEnumOptions('FEE_APPLICATION'),
			formatter: (value) => ENUM_LABELS.FEE_APPLICATION[value] || value,
			validate: (value) => (!value ? VALIDATION_MESSAGES.FEE.application.REQUIRED : null),
		},
		applicationTerm: {
			key: 'applicationTerm',
			apiKey: 'application_term',
			label: FIELD_LABELS.FEE.application_term,
			type: FIELD_TYPES.SELECT,
			options: getEnumOptions('FEE_TERM'),
			formatter: (value) => ENUM_LABELS.FEE_TERM[value] || value,
			validate: (value) => (!value ? VALIDATION_MESSAGES.FEE.application_term.REQUIRED : null),
		},
		description: {
			key: 'description',
			apiKey: 'description',
			label: FIELD_LABELS.FEE.description,
			type: FIELD_TYPES.TEXT_AREA,
			rows: 3,
			fullWidth: true,
		},
	};

	const adminManager = createAdminManager(FIELDS, {
		addButtonText: () => UI_LABELS.ADMIN.modules.fees.add_button,
		editButtonText: () => UI_LABELS.ADMIN.modules.fees.edit_button,
	});

	const handleAddFee = (data) => dispatch(createFee(adminManager.toApiFormat(data))).unwrap();
	const handleEditFee = (data) => dispatch(updateFee(adminManager.toApiFormat(data))).unwrap();
	const handleDeleteFee = (id) => dispatch(deleteFee(id)).unwrap();

	const handleDeleteAllFees = async () => {
		await dispatch(deleteAllFees()).unwrap();
		dispatch(fetchFees());
	};
	const handleDeleteFilteredFees = async (ids) => {
		if (!ids?.length) return;
		await dispatch(deleteFilteredFees(ids)).unwrap();
		dispatch(fetchFees());
	};

	const formattedFees = fees.map(adminManager.toUiFormat);

	return (
		<AdminDataTable
			title={UI_LABELS.ADMIN.modules.fees.management}
			data={formattedFees}
			columns={adminManager.columns}
			onAdd={handleAddFee}
			onEdit={handleEditFee}
			onDelete={handleDeleteFee}
			onDeleteAll={handleDeleteAllFees}
			onDeleteFiltered={handleDeleteFilteredFees}
			renderForm={adminManager.renderForm}
			addButtonText={UI_LABELS.ADMIN.modules.fees.add_button}
			isLoading={isLoading}
			error={errors}
		/>
	);
};

export default FeeManagement;
