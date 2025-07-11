import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import AdminDataTable from '../../components/admin/AdminDataTable';

import {
	fetchDiscounts,
	createDiscount,
	updateDiscount,
	deleteDiscount,
} from '../../redux/actions/discount';
import { FIELD_TYPES, createAdminManager } from './utils';
import {
	ENUM_LABELS,
	FIELD_LABELS,
	UI_LABELS,
	VALIDATION_MESSAGES,
	getEnumOptions,
} from '../../constants';

const DiscountManagement = () => {
	const dispatch = useDispatch();
	const { discounts, isLoading, errors } = useSelector(
		(state) => state.discounts
	);

	useEffect(() => {
		dispatch(fetchDiscounts());
	}, [dispatch]);

	const FIELDS = {
		id: { key: 'id', apiKey: 'id' },
		discountName: {
			key: 'discountName',
			apiKey: 'discount_name',
			label: FIELD_LABELS.DISCOUNT.discount_name,
			type: FIELD_TYPES.TEXT,
			fullWidth: true,
			validate: (value) =>
				!value
					? VALIDATION_MESSAGES.DISCOUNT.discount_name.REQUIRED
					: null,
		},
		discountType: {
			key: 'discountType',
			apiKey: 'discount_type',
			label: FIELD_LABELS.DISCOUNT.discount_type,
			type: FIELD_TYPES.SELECT,
			options: getEnumOptions('DISCOUNT_TYPE'),
			formatter: (value) => ENUM_LABELS.DISCOUNT_TYPE[value] || value,
			validate: (value) =>
				!value
					? VALIDATION_MESSAGES.DISCOUNT.discount_type.REQUIRED
					: null,
		},
		percentageValue: {
			key: 'percentageValue',
			apiKey: 'percentage_value',
			label: FIELD_LABELS.DISCOUNT.percentage_value,
			type: FIELD_TYPES.NUMBER,
			float: true,
			inputProps: {
				min: 0,
				max: 100,
				step: 0.01,
			},
			formatter: (value) => (value !== null && value !== undefined ? `${value}%` : ''),
			validate: (value) =>
				value === null || value === undefined || value === ''
					? VALIDATION_MESSAGES.DISCOUNT.percentage_value.REQUIRED
					: null,
		},
	};

	const adminManager = createAdminManager(FIELDS, {
		addButtonText: UI_LABELS.ADMIN.modules.discounts.add_button,
		editButtonText: UI_LABELS.ADMIN.modules.discounts.edit_button,
	});

	const handleAddDiscount = (discountData) => {
		dispatch(createDiscount(adminManager.toApiFormat(discountData)));
	};

	const handleEditDiscount = (discountData) => {
		dispatch(updateDiscount(adminManager.toApiFormat(discountData)));
	};

	const handleDeleteDiscount = (id) => {
		return dispatch(deleteDiscount(id));
	};

	const formattedDiscounts = discounts.map(adminManager.toUiFormat);

	return (
		<AdminDataTable
			title={UI_LABELS.ADMIN.modules.discounts.management}
			data={formattedDiscounts}
			columns={adminManager.columns}
			onAdd={handleAddDiscount}
			onEdit={handleEditDiscount}
			onDelete={handleDeleteDiscount}
			renderForm={adminManager.renderForm}
			addButtonText={UI_LABELS.ADMIN.modules.discounts.add_button}
			isLoading={isLoading}
			error={errors}
		/>
	);
};

export default DiscountManagement;
