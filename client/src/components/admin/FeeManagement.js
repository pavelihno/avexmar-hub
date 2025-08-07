import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import AdminDataTable from '../../components/admin/AdminDataTable';

import { fetchFees, createFee, updateFee, deleteFee, deleteAllFees } from '../../redux/actions/fee';
import { createAdminManager } from './utils';
import { FIELD_TYPES, formatNumber } from '../utils';
import { FIELD_LABELS, UI_LABELS, VALIDATION_MESSAGES } from '../../constants';

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
			fullWidth: true,
			validate: (value) => (!value ? VALIDATION_MESSAGES.FEE.name.REQUIRED : null),
		},
		description: {
			key: 'description',
			apiKey: 'description',
			label: FIELD_LABELS.FEE.description,
			type: FIELD_TYPES.TEXT,
			fullWidth: true,
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
			renderForm={adminManager.renderForm}
			addButtonText={UI_LABELS.ADMIN.modules.fees.add_button}
			isLoading={isLoading}
			error={errors}
		/>
	);
};

export default FeeManagement;
